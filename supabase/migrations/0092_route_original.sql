-- 0092 · LA RUTA ORIGINAL DEL VIAJE, EN UNA COLUMNA APARTE (V37b). SIN APLICAR (comprobar con docs/dias/COMPROBAR_0092.sql).
--
-- Qué hace, en palabras sencillas:
--   «Volver a la ruta original» (la varita) necesita la ruta tal como salió la primera vez. Hasta la V36 viajaba DENTRO de `trips.route` (el viaje pesaba el doble); la V37 la sacó del viaje y la dejó solo en el móvil
--   donde se creó, así que otro móvil no tenía la original. Esta migración le da una columna propia, `trips.route_original`, para que cualquier móvil la tenga cuando la necesite:
--   - La app la SUBE una sola vez, junto con el primer guardado del viaje (o de la ruta rehecha), nunca más.
--   - La app NUNCA la baja al abrir ni al sincronizar el viaje (todas las consultas de `trips` piden sus columnas una a una y esta no está): solo la baja, una vez por viaje y móvil, cuando la persona
--     confirma «Sí, recuperar» en la varita (unos 50 KB).
--   - Un disparador la protege: mientras la ruta siga siendo la misma (mismo `id`), una vez puesta no se cambia (un móvil que se abrió el viaje más tarde no puede pisar la original con una ruta ya editada).
--     Si la ruta se rehace (id nuevo), sí se reemplaza.
--
-- Quién la ve: las mismas personas que ven el viaje (las políticas de `trips` son por fila). No lleva datos nuevos: es la ruta de siempre.
-- SI NO SE APLICA: la app sigue funcionando. Al guardar, la columna no existe, la app lo nota (error «route_original»), no vuelve a mandarla en esa sesión y el viaje se guarda igual; la varita usa la copia del móvil.
-- `empezar_de_cero` y borrar la cuenta no necesitan cambio: la columna es de la fila de `trips`, que ya se borra entera.

begin;

alter table public.trips add column if not exists route_original jsonb;

create or replace function public.proteger_route_original() returns trigger
language plpgsql set search_path = public as $$
begin
  -- La original ya estaba y la ruta es la misma: se queda la que había (aunque llegue otra o llegue null).
  if old.route_original is not null and (new.route ->> 'id') is not distinct from (old.route ->> 'id') then
    new.route_original := old.route_original;
  end if;
  return new;
end;
$$;

drop trigger if exists trips_proteger_route_original on public.trips;
create trigger trips_proteger_route_original before update on public.trips
  for each row execute function public.proteger_route_original();

commit;
