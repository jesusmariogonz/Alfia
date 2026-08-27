-- Encuesta rápida "¿Bullish o bearish para mañana?" — un voto por usuario
-- por día. Se puede cambiar el voto el mismo día (upsert), no acumular
-- varios. Los conteos agregados se leen del lado del servidor sumando
-- filas, así que basta con permitir SELECT a cualquier usuario autenticado
-- (no expone nada sensible, es solo bullish/bearish + fecha).
create table if not exists sentiment_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vote_date date not null,
  vote text not null check (vote in ('bullish', 'bearish')),
  created_at timestamptz not null default now(),
  unique (user_id, vote_date)
);

create index if not exists sentiment_votes_vote_date_idx on sentiment_votes (vote_date);

alter table sentiment_votes enable row level security;

create policy "sentiment_votes_select_authenticated" on sentiment_votes
  for select
  to authenticated
  using (true);

create policy "sentiment_votes_insert_own" on sentiment_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "sentiment_votes_update_own" on sentiment_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
