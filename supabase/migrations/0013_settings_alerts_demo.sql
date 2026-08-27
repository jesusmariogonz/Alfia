-- Preferencia de moneda del usuario (para mostrar montos en USD o MXN).
alter table public.profiles
  add column if not exists currency_pref text not null default 'usd' check (currency_pref in ('usd', 'mxn'));

-- Umbrales de alerta por activo en watchlist: si el precio se mueve más de
-- X% desde que se guardó el umbral, se marca para avisar. last_alert_price
-- ancla desde dónde se mide el próximo movimiento (se resetea al disparar).
alter table public.watchlist_items
  add column if not exists alert_threshold_pct numeric(5, 2);
alter table public.watchlist_items
  add column if not exists alert_reference_price numeric(14, 4);
alter table public.watchlist_items
  add column if not exists alert_last_triggered_at timestamptz;

comment on column public.watchlist_items.alert_threshold_pct is
  'Si no es NULL, avisa cuando el precio se mueva +/- este % desde alert_reference_price.';

-- Cartera demo: posiciones de práctica con monto simulado, separadas de
-- las posiciones reales (invested_usd en watchlist_items). Cada fila es
-- una posición demo abierta o cerrada.
create table if not exists public.demo_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  shares numeric(18, 6) not null check (shares > 0),
  entry_price numeric(14, 4) not null check (entry_price > 0),
  demo_amount_usd numeric(14, 2) not null check (demo_amount_usd > 0),
  stop_loss_price numeric(14, 4),
  take_profit_price numeric(14, 4),
  status text not null default 'abierta' check (status in ('abierta', 'cerrada')),
  closed_at timestamptz,
  closed_price numeric(14, 4),
  created_at timestamptz not null default now()
);

create index if not exists demo_positions_user_id_idx
  on public.demo_positions (user_id, created_at desc);

alter table public.demo_positions enable row level security;

create policy "Los usuarios ven su propia cartera demo"
  on public.demo_positions for select
  using (auth.uid() = user_id);

create policy "Los usuarios abren posiciones demo propias"
  on public.demo_positions for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios editan su propia cartera demo"
  on public.demo_positions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Los usuarios borran su propia cartera demo"
  on public.demo_positions for delete
  using (auth.uid() = user_id);
