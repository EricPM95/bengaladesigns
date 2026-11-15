-- TANDA V1 · PASO 1: SOLO MIRAR (no cambia nada). Pégalo en el SQL Editor de Supabase y dime (o pega aquí) lo que sale en cada bloque.

-- 1) ¿La tarea avisos-viaje sigue activa y cada cuánto corre?
select jobid, jobname, schedule, active from cron.job order by jobid;

-- 2) Lo que ha ido haciendo la tarea (últimas 10 vueltas) y si fallaron
select jobid, status, start_time, end_time, left(return_message, 120) as mensaje from cron.job_run_details order by start_time desc limit 10;

-- 3) Cuánto ocupa lo que guarda pg_net de las llamadas a la API (filas y tamaño)
select count(*) as filas, pg_size_pretty(pg_total_relation_size('net._http_response')) as tamano,
       min(created) as la_mas_antigua, max(created) as la_mas_nueva
from net._http_response;

-- 4) Lo que pesa un viaje (esto es lo que bajaba la tarea en CADA vuelta antes de la 0077)
select id, route ->> 'destination' as destino,
       pg_size_pretty(pg_column_size(route)::bigint) as ruta,
       pg_size_pretty(coalesce(pg_column_size(bookings), 0)::bigint) as reservas,
       updated_at::date as cambiado
from public.trips order by pg_column_size(route) desc limit 10;

-- 5) Tablas más grandes (la base entera son ~85 MB; lo que sale de aquí es lo que cuenta como salida de datos)
select relname as tabla, pg_size_pretty(pg_total_relation_size(oid)) as tamano
from pg_class where relkind = 'r' and relnamespace = 'public'::regnamespace
order by pg_total_relation_size(oid) desc limit 8;

-- 6) ¿Llegó a crearse el Pase Dúo de cortesía (7-nov)? Si sale una fila: ya está (no lo pegues otra vez). Si sale vacío: pega docs/dias/PASE_CORTESIA_ERIC_LANZAROTE.sql.
select p.id, p.destino, p.tipo, p.usos_max, p.usos_usados, p.estado, r.proveedor, r.importe_cent, r.pago_ref
from public.passes p left join public.pagos_registro r on r.pago_ref = p.pago_ref
where p.pago_ref = 'cortesia-eric-lanzarote-2026-11';

-- 7) ¿Qué pases hay en total? (solo cuántos y de qué tipo; ningún dato de personas)
select destino, tipo, estado, count(*) from public.passes group by 1, 2, 3 order by 1, 2, 3;
