-- Convierte la watchlist en la base de "Mi Portafolio": un ítem de
-- watchlist con invested_usd no nulo es una posición abierta, no solo un
-- activo que se sigue. No se crea una tabla nueva a propósito — seguir un
-- activo y tener una posición en él son el mismo registro con un dato más.

alter table public.watchlist_items
  add column if not exists invested_usd numeric(14, 2);

comment on column public.watchlist_items.invested_usd is
  'Monto en USD invertido en este activo. NULL = solo en watchlist, sin posición abierta.';

-- Faltaba la política de update (se necesita para poner/editar el monto
-- invertido sin tener que borrar e insertar de nuevo la fila).
create policy "Los usuarios editan su propia watchlist"
  on public.watchlist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
