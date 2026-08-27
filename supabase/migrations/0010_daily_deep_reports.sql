-- Reporte diario detallado (formato "Esta semana en mercados" pero a
-- cadencia diaria): gancho, tabla de highlights, temas a fondo, lectura
-- propia, enfoques por estilo de inversión, calendario e ideas clave.
-- Generado una vez al día por /api/cron/deep-report, después del cierre.
create table if not exists daily_deep_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null unique,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_deep_reports_report_date_idx on daily_deep_reports (report_date desc);

alter table daily_deep_reports enable row level security;

create policy "daily_deep_reports_select_all" on daily_deep_reports
  for select
  using (true);
