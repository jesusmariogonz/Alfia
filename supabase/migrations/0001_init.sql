-- Alfia — esquema inicial: perfiles, créditos y auditoría de uso de IA.

create extension if not exists "pgcrypto";

-- Perfil de usuario, 1:1 con auth.users. El balance de créditos vive aquí
-- para poder bloquear la fila (SELECT ... FOR UPDATE) durante el descuento
-- atómico y así evitar condiciones de carrera entre consultas simultáneas.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'basico', 'pro')),
  credit_balance integer not null default 20 check (credit_balance >= 0),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Historial de transacciones de crédito (compras, recargas mensuales,
-- consumo por consulta de IA). Es un libro contable append-only.
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null, -- positivo = recarga/compra, negativo = consumo
  balance_after integer not null,
  reason text not null check (
    reason in ('bienvenida', 'suscripcion', 'compra_paquete', 'consumo_ia', 'ajuste_manual')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_id_idx
  on public.credit_transactions (user_id, created_at desc);

-- Auditoría de cada consulta a la IA: quién, qué modelo, cuántos tokens y
-- cuántos créditos costó. Es la base para controlar margen y detectar abuso.
create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  query_type text not null check (
    query_type in ('chat', 'resumen_diario', 'montecarlo', 'comparador', 'screener')
  ),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  credits_charged integer not null,
  transaction_id uuid references public.credit_transactions (id),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_log_user_id_idx
  on public.ai_usage_log (user_id, created_at desc);

-- Crea el perfil automáticamente al registrarse, con créditos de bienvenida.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credit_balance)
  values (new.id, new.email, 20);

  insert into public.credit_transactions (user_id, amount, balance_after, reason)
  values (new.id, 20, 20, 'bienvenida');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Descuento atómico de créditos: bloquea la fila del perfil, valida saldo
-- suficiente y registra la transacción, todo en una sola transacción de BD.
-- Lanza una excepción si el saldo no alcanza, de forma que el balance nunca
-- quede negativo.
create or replace function public.charge_credits(
  p_user_id uuid,
  p_amount integer, -- monto positivo a descontar
  p_query_type text,
  p_model text,
  p_input_tokens integer default 0,
  p_output_tokens integer default 0
)
returns table (transaction_id uuid, new_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_transaction_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'p_amount debe ser positivo';
  end if;

  select credit_balance into v_balance
  from public.profiles
  where id = p_user_id
  for update;

  if v_balance is null then
    raise exception 'Perfil no encontrado para el usuario %', p_user_id;
  end if;

  if v_balance < p_amount then
    raise exception 'Saldo insuficiente: tienes % créditos, se requieren %', v_balance, p_amount
      using errcode = 'P0001';
  end if;

  v_balance := v_balance - p_amount;

  update public.profiles
  set credit_balance = v_balance, updated_at = now()
  where id = p_user_id;

  insert into public.credit_transactions (user_id, amount, balance_after, reason)
  values (p_user_id, -p_amount, v_balance, 'consumo_ia')
  returning id into v_transaction_id;

  insert into public.ai_usage_log (
    user_id, query_type, model, input_tokens, output_tokens,
    credits_charged, transaction_id
  )
  values (
    p_user_id, p_query_type, p_model, p_input_tokens, p_output_tokens,
    p_amount, v_transaction_id
  );

  return query select v_transaction_id, v_balance;
end;
$$;

-- Recarga créditos (webhook de Stripe u otorgamiento manual).
create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (transaction_id uuid, new_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_transaction_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'p_amount debe ser positivo';
  end if;

  select credit_balance into v_balance
  from public.profiles
  where id = p_user_id
  for update;

  if v_balance is null then
    raise exception 'Perfil no encontrado para el usuario %', p_user_id;
  end if;

  v_balance := v_balance + p_amount;

  update public.profiles
  set credit_balance = v_balance, updated_at = now()
  where id = p_user_id;

  insert into public.credit_transactions (user_id, amount, balance_after, reason, metadata)
  values (p_user_id, p_amount, v_balance, p_reason, p_metadata)
  returning id into v_transaction_id;

  return query select v_transaction_id, v_balance;
end;
$$;

-- Row Level Security: cada usuario solo ve sus propios datos.
alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.ai_usage_log enable row level security;

create policy "Los usuarios ven su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Los usuarios ven sus propias transacciones"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

create policy "Los usuarios ven su propio uso de IA"
  on public.ai_usage_log for select
  using (auth.uid() = user_id);
