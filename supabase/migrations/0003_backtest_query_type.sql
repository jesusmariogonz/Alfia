-- Agrega 'backtest' como query_type válido en el log de uso de IA (Fase 3).

alter table public.ai_usage_log
  drop constraint if exists ai_usage_log_query_type_check;

alter table public.ai_usage_log
  add constraint ai_usage_log_query_type_check
  check (query_type in ('chat', 'resumen_diario', 'montecarlo', 'comparador', 'screener', 'backtest'));
