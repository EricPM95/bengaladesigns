-- (V18) SOLO LECTURA. ¿Cuántos viajes tienen un día con un nombre del estilo «Dia 2 Lunes» (número de día + día de la semana) que NO escribió el viajero?
-- Devuelve el número de viajes y, de cada día, el viaje, el nº de día, su título y si lo puso el viajero. Un día con «nameByUser» o «userAdded» NO se toca (aquí no salen).
-- La app ya no enseña esos nombres (src/lib/nombreDeDia.ts › esNombreDeOtroDia); este SQL solo cuenta. No cambia nada.
with dias as (
  select t.id as viaje, (d ->> 'dayNumber')::int as n, coalesce(d ->> 'curatedTitle', d ->> 'title') as titulo
  from public.trips t, jsonb_array_elements(t.route -> 'days') d
  where coalesce(d ->> 'nameByUser', 'false') <> 'true' and coalesce(d ->> 'userAdded', 'false') <> 'true'
)
select jsonb_build_object(
  'viajes_con_un_nombre_asi', (select count(distinct viaje) from dias where titulo ~* '^\s*d[ií]a\s*\d+\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*$'),
  'dias', coalesce((select jsonb_agg(to_jsonb(x)) from (select * from dias where titulo ~* '^\s*d[ií]a\s*\d+\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*$' order by viaje, n limit 100) x), '[]'::jsonb)
) as resultado;
