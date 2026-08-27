-- Noticias con sentimiento, alimentadas por el cron de /api/cron/news
-- (Finnhub /news, categoría general). Se leen públicamente (RLS solo
-- permite SELECT); solo el service role (usado por el cron) puede insertar.
create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  title text not null,
  url text not null,
  source text not null,
  summary text,
  sentiment text not null check (sentiment in ('positivo', 'negativo', 'neutral')),
  published_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists news_items_published_at_idx on news_items (published_at desc);

alter table news_items enable row level security;

create policy "news_items_select_all" on news_items
  for select
  using (true);
