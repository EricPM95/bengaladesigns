-- LIMPIAR_ORIGINALROUTE (V37) · SIN APLICAR · OPCIONAL · no es una migración numerada.
--
-- Qué hace, en palabras sencillas:
--   Hasta la V36 la app guardaba dentro de `trips.route` una copia de la propia ruta (`originalRoute`, la de «Volver a mi ruta original»): cada viaje pesaba el doble
--   (Lanzarote 97 KB en vez de 49; Roma ~160 KB en vez de ~80). Desde la V37 la app ya no la sube, ni la baja, ni la guarda en la caché de HOY: cada viaje viejo se limpia SOLO la próxima
--   vez que alguien lo guarde. Este SQL es para limpiar de golpe los que nadie vaya a tocar pronto (opcional: sin él, la app funciona igual).
--
-- Cómo usarlo, en el SQL editor de Supabase:
--   1) Pega y ejecuta SOLO el PASO 1 (solo lee): cuántos viajes la llevan y cuánto pesa su `route` antes y después. (Se mide el texto JSON, que es lo que viaja por la red: `pg_column_size` mide lo YA comprimido por Postgres
--      en disco y no se puede comparar con el de una ruta recién calculada.)
--   2) Si te vale, pega y ejecuta el PASO 2 (limpia). Es REPETIBLE: si lo pegas otra vez no hace nada (ya no queda ninguno).
--   3) Pega docs/dias/COMPROBAR_LIMPIAR_ORIGINALROUTE.sql: una fila, todo en true.
--
-- Qué NO toca el PASO 2:
--   · `updated_at` y `guardado_en` (el sello del viaje): ninguno cambia, así que ningún móvil cree que «el viaje ha cambiado» y nadie vuelve a bajarlo.
--   · No manda avisos ni ensucia la campana: `trips` tiene disparadores (avisar_viaje_cambiado, avisar_lo_del_admin, avisar_cuentas_modo, trips_anotar_cambio…) que saltan al cambiar `route`
--     (crearían avisos de «Eric ha cambiado el viaje» y una fila en `trip_cambios` que despierta a los móviles abiertos por Realtime). Dentro de la transacción se APAGAN los disparadores de `trips`
--     (`disable trigger user`: solo los nuestros, no los del sistema ni las claves foráneas) y se vuelven a encender antes de acabar. Si algo falla, la transacción entera se deshace y quedan encendidos.
--   · Necesita ser dueño de la tabla (en el SQL editor de Supabase lo eres: es el usuario `postgres`).
--   · Si algún móvil con la app VIEJA (antes de la V37) guarda un viaje después, le vuelve a poner la copia: se repite el PASO 2 cuando todos hayan actualizado.

-- ─────────────────────────── PASO 1 · MIRAR (solo lee) ───────────────────────────
select
  count(*) filter (where route ? 'originalRoute')                                  as viajes_con_copia,
  count(*)                                                                         as viajes_en_total,
  coalesce(sum(octet_length(route::text)), 0)                                       as bytes_route_antes,
  coalesce(sum(octet_length((route - 'originalRoute')::text)), 0)                  as bytes_route_despues,
  round(100.0 * coalesce(sum(octet_length((route - 'originalRoute')::text)), 0) / nullif(sum(octet_length(route::text)), 0), 1) as porcentaje_que_queda
from public.trips;

-- (el detalle, viaje a viaje, los 20 que más pesan)
select id, octet_length(route::text) as bytes_antes, octet_length((route - 'originalRoute')::text) as bytes_despues
from public.trips
where route ? 'originalRoute'
order by octet_length(route::text) desc
limit 20;

-- ─────────────────────────── PASO 2 · LIMPIAR (repetible) ───────────────────────────
begin;

alter table public.trips disable trigger user;

update public.trips
   set route = route - 'originalRoute'
 where route ? 'originalRoute';

alter table public.trips enable trigger user;

commit;
