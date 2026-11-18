-- V15 (2): «Yo también estaba» no sale. SOLO LECTURA (select): se pega en el editor SQL de Supabase. No cambia nada.
-- Cambia el nombre del destino si hace falta. Mira el viaje de Lanzarote de Eric.

-- 1) El viaje: su id, quién es el dueño, el rango de fechas guardado (la fecha de fin que usa el servidor es dateRange.end) y cuántos días lleva la ruta.
select t.id as trip_id, t.traveler_id as dueno, t.created_at,
       t.route -> 'answers' -> 'dateRange' as rango_de_fechas,
       jsonb_array_length(t.route -> 'days') as dias_en_la_ruta
from public.trips t
where lower(t.route ->> 'destination') = 'lanzarote'
order by t.created_at desc;

-- 2) Los miembros de ese viaje y DESDE CUÁNDO (`created_at`): la regla actual deja fuera a quien se unió DESPUÉS del último día del viaje.
select m.trip_id, m.user_id, m.created_at as desde, m.permiso,
       (m.created_at::date > (t.route -> 'answers' -> 'dateRange' ->> 'end')::date) as se_unio_despues_del_ultimo_dia
from public.trip_members m
join public.trips t on t.id = m.trip_id
where lower(t.route ->> 'destination') = 'lanzarote';

-- 3) Lo que cada uno ganó en ese viaje (pedazos y emblemas): `trip_id` tiene que ser el del viaje compartido.
select a.user_id, a.logro, a.escalon, a.trip_id, a.detalle ->> 'origen' as origen, a.ganado_en
from public.achievements a
where a.destino = 'lanzarote' and a.logro in ('pedazo', 'emblema')
order by a.user_id, a.ganado_en;

-- 4) El pase: con el cobro apagado no cuenta; esto solo mira que nadie esté marcado «sin pase» (admin_sin_pase) ni tenga pases raros.
select * from public.admin_sin_pase;
select id, tipo, estado from public.passes;

-- 5) (Fechas, V15 punto 3) Cuántos viajes llevan en la ruta más días que su calendario (un día de más) y cuántos días de ruta están VACÍOS (sin paradas): solo leer.
select t.id, t.route ->> 'destination' as destino,
       (t.route -> 'answers' -> 'dateRange' ->> 'start') as inicio, (t.route -> 'answers' -> 'dateRange' ->> 'end') as fin,
       ((t.route -> 'answers' -> 'dateRange' ->> 'end')::date - (t.route -> 'answers' -> 'dateRange' ->> 'start')::date + 1) as dias_del_calendario,
       jsonb_array_length(t.route -> 'days') as dias_en_la_ruta,
       (select count(*) from jsonb_array_elements(t.route -> 'days') d
         where coalesce((d ->> 'isReturnLeg')::boolean, false) = false and jsonb_array_length(coalesce(d -> 'stops', '[]'::jsonb)) = 0) as dias_de_ruta_vacios
from public.trips t
where t.route -> 'answers' -> 'dateRange' ->> 'end' is not null
  and jsonb_array_length(t.route -> 'days') > ((t.route -> 'answers' -> 'dateRange' ->> 'end')::date - (t.route -> 'answers' -> 'dateRange' ->> 'start')::date + 1)
order by t.created_at desc;

-- 6) (Alicia, «09 NOV» y «5 días») ¿Tiene Alicia su PROPIA copia del viaje a Lanzarote (con otras fechas) además del viaje compartido de Eric? Mira todos los viajes a Lanzarote con su dueño y su rango.
select t.id, t.traveler_id as dueno, (t.route -> 'answers' -> 'dateRange' ->> 'start') as inicio, (t.route -> 'answers' -> 'dateRange' ->> 'end') as fin
from public.trips t where lower(t.route ->> 'destination') = 'lanzarote' order by t.created_at;

-- 7) Con qué id de viaje guardó cada persona lo que ganó (si el de Alicia no es el del viaje compartido, «Yo también estaba» no los cruzaba).
select h.user_id, h.trip_id, count(*) as hechos, min(h.instante) as primero, max(h.instante) as ultimo
from public.logro_hechos h where h.destino = 'lanzarote' and h.deshecho_en is null group by h.user_id, h.trip_id order by h.user_id;
