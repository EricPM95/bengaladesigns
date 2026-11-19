-- Comprueba la migración 0084 (Alicia, un solo viaje a Lanzarote). UNA sola fila. Esperado: viajes_lanzarote_de_alicia = 1, las dos copias = 0, el compartido = 1,
-- y fotos_perdidas / hechos_perdidos / logros_perdidos = 0 (lo que había en la copia de seguridad y ya no está en NINGÚN sitio de Alicia).
select jsonb_build_object(
  'viajes_lanzarote_de_alicia', (select count(*) from public.trips where traveler_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and lower(route ->> 'destination') like '%lanzarote%')
    + (select count(*) from public.trips t join public.trip_members m on m.trip_id = t.id where m.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and lower(t.route ->> 'destination') like '%lanzarote%'),
  'copias_que_quedan', (select count(*) from public.trips where id in ('3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', '1a54ced6-e592-450d-afdc-25e6863408a8')),
  'compartido_sigue', (select count(*) from public.trips where id = '4d3e6c59-2c9f-4570-8afa-2c597895b5e1'),
  'fotos_perdidas', (select count(*) from public.respaldo_v17_trip_photos r where not exists (select 1 from public.trip_photos f where f.user_id = r.user_id and f.bytes = r.bytes and f.width = r.width and f.height = r.height)),
  'fotos_en_el_compartido', (select count(*) from public.trip_photos f where f.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and f.trip_id = (select route ->> 'id' from public.trips where id = '4d3e6c59-2c9f-4570-8afa-2c597895b5e1')),
  'hechos_perdidos', (select count(*) from public.respaldo_v17_logro_hechos r where not exists (select 1 from public.logro_hechos h where h.id = r.id or (r.tipo = 'visto' and h.user_id = r.user_id and h.tipo = 'visto' and h.deshecho_en is null and coalesce(h.stop_id, h.sitio) = coalesce(r.stop_id, r.sitio)))),
  'logros_perdidos', (select count(*) from public.respaldo_v17_achievements r where not exists (select 1 from public.achievements a where a.id = r.id))
) as resultado;
