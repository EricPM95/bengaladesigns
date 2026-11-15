-- V1b · SOLO MIRAR (no cambia nada): cuántos viajes tiene cada cuenta y cuánto pesan. Con esto se calcula cuánto bajaba la app al abrir (antes) y cuánto baja ahora.
-- Pégalo en el SQL Editor de Supabase y pásame el resultado (no sale ningún dato personal: solo cuántos viajes y cuánto pesan).
select row_number() over (order by count(*) desc) as cuenta,
       count(*) as viajes,
       pg_size_pretty(sum(pg_column_size(route))::bigint) as pesan_las_rutas,
       pg_size_pretty(avg(pg_column_size(route))::bigint) as media_por_viaje,
       count(*) filter (where route ->> 'destination' ilike '%lanzarote%') as de_lanzarote
from public.trips
group by traveler_id
order by count(*) desc;
