-- Watchlist personalizada por usuario.

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists watchlist_items_user_id_idx
  on public.watchlist_items (user_id, created_at desc);

alter table public.watchlist_items enable row level security;

create policy "Los usuarios ven su propia watchlist"
  on public.watchlist_items for select
  using (auth.uid() = user_id);

create policy "Los usuarios agregan a su propia watchlist"
  on public.watchlist_items for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios quitan de su propia watchlist"
  on public.watchlist_items for delete
  using (auth.uid() = user_id);
