-- LIMPIEZA DE CUENTAS DE PRUEBA (15-nov). PLANTILLA: los correos de los administradores van como __CORREO_1__ y __CORREO_2__ (la copia que se pega en Supabase lleva los de verdad y NO se sube al repo).
-- Qué hace: borra TODAS las cuentas (auth.users) menos las de los administradores, las que se quieran guardar a mano (más abajo) y las de quien sea dueño de un viaje donde un administrador es miembro (lo compartido no se pierde).
-- Todo lo de cada cuenta se va con ella en cascada (viajes, vistos, fotos, logros, pases, avisos, invitaciones…: todas las claves a auth.users son «on delete cascade» o «set null»; lo comprueba scripts/limpieza/pruebaLimpieza.mjs).
-- Se borra por tandas (300 cuentas cada vez) para no pasar el tiempo máximo del editor: PEGA Y EJECUTA ESTE ARCHIVO VARIAS VECES hasta que «quedan_por_borrar» salga 0. Es seguro repetirlo.
-- Los archivos de fotos del almacenamiento (Storage) no se tocan desde aquí (hay 0 GB).
-- LA COPIA de todo lo que se borra está en el PC (carpeta JUTRIP_copia_cuentas_de_prueba_2026-11-15, fuera del repo).

-- ── Las cuentas que se QUEDAN ─────────────────────────────────────────────────────────────────────────────────
drop table if exists _quedan;
create temp table _quedan (id uuid primary key);
insert into _quedan select id from auth.users where lower(email) in (lower('__CORREO_1__'), lower('__CORREO_2__'));
-- Los dueños de viajes donde un administrador es miembro (viajes compartidos con ellos).
insert into _quedan select t.traveler_id from public.trip_members m join public.trips t on t.id = m.trip_id where m.user_id in (select id from _quedan) on conflict do nothing;
-- Cuentas que se quieren guardar a mano (ids; sin ninguna: null::uuid).
insert into _quedan select id from auth.users where id in (__IDS_EXTRA__) on conflict do nothing;

-- Si no están los dos administradores, NO se borra nada.
do $$
begin
  if (select count(*) from auth.users where lower(email) in (lower('__CORREO_1__'), lower('__CORREO_2__'))) < 2 then
    raise exception 'No encuentro las dos cuentas de administrador: no se borra nada.';
  end if;
end $$;

-- ── Antes de borrar: lo que se queda y lo que se va ───────────────────────────────────────────────────────────
select (select count(*) from auth.users) as cuentas_ahora,
       (select count(*) from _quedan) as cuentas_que_se_quedan,
       (select count(*) from auth.users where id not in (select id from _quedan)) as quedan_por_borrar,
       (select count(*) from public.trips where traveler_id in (select id from _quedan)) as viajes_que_se_quedan,
       (select count(*) from public.trips where traveler_id not in (select id from _quedan)) as viajes_por_borrar;

-- ── El borrado: una tanda de 300 cuentas ──────────────────────────────────────────────────────────────────────
delete from auth.users where id in (select id from auth.users where id not in (select id from _quedan) order by created_at limit 300);

-- ── Después: lo que queda ─────────────────────────────────────────────────────────────────────────────────────
select (select count(*) from auth.users) as cuentas_ahora,
       (select count(*) from auth.users where id not in (select id from _quedan)) as quedan_por_borrar,
       (select count(*) from public.travelers) as travelers,
       (select count(*) from public.trips) as viajes,
       (select count(*) from public.trips where traveler_id in (select id from _quedan)) as viajes_de_los_que_se_quedan,
       (select count(*) from public.trip_members) as miembros_de_viaje,
       (select count(*) from public.avisos) as avisos,
       (select count(*) from public.trips t where not exists (select 1 from auth.users u where u.id = t.traveler_id)) as viajes_huerfanos;
drop table if exists _quedan;
