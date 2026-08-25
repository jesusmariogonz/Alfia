-- Suscriptores del newsletter semanal. Acepta tanto usuarios registrados
-- (user_id) como visitantes anónimos que se suscriben desde la landing
-- (user_id null, solo email).

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_subscribers_active_idx
  on public.newsletter_subscribers (email)
  where unsubscribed_at is null;

alter table public.newsletter_subscribers enable row level security;

-- Sin políticas de select/insert para el rol anon: las suscripciones y bajas
-- se gestionan siempre a través de las API routes con la service role key,
-- nunca con el cliente de Supabase directo desde el navegador.
