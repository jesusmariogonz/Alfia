-- Briefings de mercado en 3 momentos del día (ver /api/cron/briefing):
-- apertura (20 min antes de abrir, con ideas/proyecciones del día),
-- intradia (a media sesión, solo si hubo algo relevante) y cierre (20 min
-- antes de cerrar, corrobora las proyecciones de la apertura del mismo día).
create table if not exists market_briefings (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('apertura', 'intradia', 'cierre')),
  title text not null,
  content text[] not null,
  refers_to uuid references market_briefings (id),
  created_at timestamptz not null default now()
);

create index if not exists market_briefings_created_at_idx on market_briefings (created_at desc);

alter table market_briefings enable row level security;

create policy "market_briefings_select_all" on market_briefings
  for select
  using (true);
