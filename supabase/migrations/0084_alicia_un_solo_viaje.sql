-- 0084 · Alicia: de tres viajes a Lanzarote a UNO (V17, 19-nov). SE PEGA A MANO (Eric); nadie la aplica sola.
--
-- Alicia (2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c) tiene el viaje compartido de Eric (4d3e6c59-2c9f-4570-8afa-2c597895b5e1, dueño 6d87ffe1-…) y dos copias
-- suyas del mismo viaje (3157cdb3-a24c-4862-b8bf-9037d7b1a8cc y 1a54ced6-e592-450d-afdc-25e6863408a8). Esto pasa lo suyo (fotos, hechos, logros) al compartido
-- y borra SOLO sus dos copias. Todo en UNA transacción: si hay una duda (juntar_viaje_de lanza error), no se cambia nada.
-- ANTES de tocar nada guarda una copia de seguridad (tablas respaldo_v17_*) de las filas que se mueven o se borran.
-- Necesita la 0083 aplicada antes. Para deshacer: las tablas respaldo_v17_* tienen todas las filas originales.

begin;

create table if not exists public.respaldo_v17_trips as select * from public.trips where false;
create table if not exists public.respaldo_v17_trip_photos as select * from public.trip_photos where false;
create table if not exists public.respaldo_v17_trip_photo_meta as select * from public.trip_photo_meta where false;
create table if not exists public.respaldo_v17_logro_hechos as select * from public.logro_hechos where false;
create table if not exists public.respaldo_v17_achievements as select * from public.achievements where false;
create table if not exists public.respaldo_v17_stop_visits as select * from public.stop_visits where false;
alter table public.respaldo_v17_trips enable row level security;
alter table public.respaldo_v17_trip_photos enable row level security;
alter table public.respaldo_v17_trip_photo_meta enable row level security;
alter table public.respaldo_v17_logro_hechos enable row level security;
alter table public.respaldo_v17_achievements enable row level security;
alter table public.respaldo_v17_stop_visits enable row level security;

insert into public.respaldo_v17_trips select * from public.trips
  where id in ('3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', '1a54ced6-e592-450d-afdc-25e6863408a8', '4d3e6c59-2c9f-4570-8afa-2c597895b5e1')
    and not exists (select 1 from public.respaldo_v17_trips r where r.id = trips.id);
-- Las fotos de las dos copias (trip_photos.trip_id es el id de la RUTA, no el de la fila de trips) y sus datos.
insert into public.respaldo_v17_trip_photos select f.* from public.trip_photos f
  join public.trips t on t.route ->> 'id' = f.trip_id
  where f.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and t.id in ('3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', '1a54ced6-e592-450d-afdc-25e6863408a8')
    and not exists (select 1 from public.respaldo_v17_trip_photos r where r.id = f.id);
insert into public.respaldo_v17_trip_photo_meta select m.* from public.trip_photo_meta m
  where m.photo_id in (select id from public.respaldo_v17_trip_photos)
    and not exists (select 1 from public.respaldo_v17_trip_photo_meta r where r.photo_id = m.photo_id);
insert into public.respaldo_v17_logro_hechos select h.* from public.logro_hechos h
  where h.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and h.trip_id in ('3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', '1a54ced6-e592-450d-afdc-25e6863408a8')
    and not exists (select 1 from public.respaldo_v17_logro_hechos r where r.id = h.id);
insert into public.respaldo_v17_achievements select a.* from public.achievements a
  where a.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and a.trip_id in ('3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', '1a54ced6-e592-450d-afdc-25e6863408a8')
    and not exists (select 1 from public.respaldo_v17_achievements r where r.id = a.id);
insert into public.respaldo_v17_stop_visits select v.* from public.stop_visits v
  where v.user_id = '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c' and v.trip_id in ('3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', '1a54ced6-e592-450d-afdc-25e6863408a8')
    and not exists (select 1 from public.respaldo_v17_stop_visits r where r.id = v.id);

-- Pasar lo suyo al compartido (primero la más antigua; si algo es duda, juntar_viaje_de lanza el error y la transacción entera se deshace).
-- (Si las copias ya no existen —otra base, o ya hecho—, no hace nada.)
do $$
declare
  alicia constant uuid := '2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c';
  comp constant uuid := '4d3e6c59-2c9f-4570-8afa-2c597895b5e1';
  copia uuid;
  r jsonb;
begin
  foreach copia in array array['1a54ced6-e592-450d-afdc-25e6863408a8', '3157cdb3-a24c-4862-b8bf-9037d7b1a8cc']::uuid[] loop
    if exists (select 1 from public.trips where id = copia and traveler_id = alicia) and exists (select 1 from public.trips where id = comp) then
      r := public.juntar_viaje_de(alicia, copia, comp);
      raise notice 'copia %: %', copia, r;
      -- Borrar SOLO esa copia suya (nunca el compartido).
      delete from public.trips where id = copia and traveler_id = alicia;
    end if;
  end loop;
end
$$;

commit;
