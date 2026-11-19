-- (V17) SOLO LECTURA. Los tres viajes de Alicia a Lanzarote: de quién es cada uno, cuándo se cambió por última vez, sus fechas y lo que tiene cada uno
-- (fotos suyas, hechos de logros, logros, Vistos y gente invitada). Un solo resultado. Sirve para mirar ANTES de pegar la 0084 y para confirmar el diagnóstico.
select jsonb_agg(jsonb_build_object(
  'viaje', t.id,
  'dueno', case when t.traveler_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' then 'Alicia' else 'otra persona' end,
  'destino', t.route ->> 'destination',
  'desde', t.route #>> '{answers,dateRange,start}',
  'hasta', t.route #>> '{answers,dateRange,end}',
  'ultimo_cambio', t.updated_at,
  'id_de_ruta', t.route ->> 'id',
  'fotos_de_alicia', (select count(*) from public.trip_photos f where f.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and f.trip_id = t.route ->> 'id'),
  'hechos_de_alicia', (select count(*) from public.logro_hechos h where h.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and h.trip_id = t.id),
  'logros_de_alicia', (select count(*) from public.achievements a where a.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and a.trip_id = t.id),
  'vistos_de_alicia', (select count(*) from public.stop_visits v where v.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and v.trip_id = t.id),
  'gente_invitada', (select count(*) from public.trip_members m where m.trip_id = t.id)
) order by t.updated_at) as resultado
from public.trips t
where t.id in ('4d3e6c59-2c9f-4570-8afa-2c597895b5e1', '3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', '1a54ced6-e592-450d-afdc-25e6863408a8');
