-- 0063 · EL CAMBIO DEL DÍA EN QUE SE APUNTA CADA GASTO (Tanda 10N8, §0b-7). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala después de la 0037 y la 0040. NO edita esas migraciones.
--
-- Qué hace, en palabras sencillas:
--   * `trip_gastos.cambio`: la foto del cambio del día en que se apuntó el gasto ({"fecha":"2026-10-28","tasas":{"MXN":21.5}} = cuántas unidades de esa moneda son 1 euro ese día).
--   * Las cuentas del grupo usan ESE cambio para pasar el gasto a euros, no el de hoy: lo que debe cada uno ya no cambia cada día sin que nadie toque nada.
--   * Los gastos de antes (sin foto) siguen con el cambio de hoy, como hasta ahora. Los gastos en euros no la necesitan.
-- SI NO SE APLICA: todo funciona como antes (cambio de hoy); el móvil no manda la foto y no pasa nada.

begin;

alter table public.trip_gastos add column if not exists cambio jsonb;
alter table public.trip_gastos drop constraint if exists trip_gastos_cambio_forma;
alter table public.trip_gastos add constraint trip_gastos_cambio_forma check (
  cambio is null or (jsonb_typeof(cambio) = 'object' and jsonb_typeof(cambio -> 'tasas') = 'object' and coalesce(cambio ->> 'fecha', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);

commit;
