-- 0087 · AVISOS DE CAMBIO DEL VIAJE SIN LA FILA ENTERA (V26b, el gasto de Supabase). APLICADA el 19-nov-2026 (comprobada con docs/dias/COMPROBAR_0087.sql).
--
-- Qué hace, en palabras sencillas:
--   Hasta ahora, cada vez que se guardaba un viaje compartido, Realtime mandaba la FILA ENTERA del viaje (la ruta, 70-80 KB o más) a cada móvil que lo tenía abierto. Con dos móviles y 15 cambios al día, son megas y megas.
--   Esta migración crea `trip_cambios`: UNA fila diminuta por viaje (`trip_id` + `cambiado_en`, unos 80 bytes) que un disparador pone al día cada vez que cambia la ruta, las reservas o la lista de deseos.
--   La app escucha esa tabla en lugar de `trips`: al avisarle, pregunta el sello del viaje (100 bytes) y baja la ruta SOLO si de verdad cambió. Y `trips` sale de la publicación de Realtime, para que deje de mandar la fila entera.
--   Abrir una pestaña o un día (`ui_state`) no cuenta como cambio.
--
-- Quién la ve: el dueño del viaje y quien está dentro (las mismas personas que ven el viaje). No lleva datos de nadie: solo el id del viaje y una hora; se borra sola con el viaje.
-- SI NO SE APLICA: la app sigue funcionando; los cambios del compañero llegan con el reloj de respaldo (cada 45 segundos) en lugar de al momento. (La app nueva ya no escucha `trips`.)

begin;

create table if not exists public.trip_cambios (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  cambiado_en timestamptz not null default now()
);

alter table public.trip_cambios enable row level security;
drop policy if exists "trip_cambios select" on public.trip_cambios;
create policy "trip_cambios select" on public.trip_cambios
  for select to authenticated using (public.es_dueno(trip_id) or public.es_miembro(trip_id));
-- Nadie escribe desde la app: solo el disparador (security definer).

create or replace function public.anotar_cambio_de_viaje() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE'
     and new.updated_at is not distinct from old.updated_at
     and new.guardado_en is not distinct from old.guardado_en
     and new.route is not distinct from old.route
     and new.bookings is not distinct from old.bookings
     and new.wishlist is not distinct from old.wishlist then
    return new; -- solo cambió ui_state (pestaña o día abiertos): no es un cambio del viaje
  end if;
  insert into public.trip_cambios (trip_id, cambiado_en) values (new.id, now())
  on conflict (trip_id) do update set cambiado_en = excluded.cambiado_en;
  return new;
end;
$$;

drop trigger if exists trips_anotar_cambio on public.trips;
create trigger trips_anotar_cambio after insert or update on public.trips
  for each row execute function public.anotar_cambio_de_viaje();

-- Realtime: la tabla pequeña entra; la grande (`trips`, con la ruta) sale.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.trip_cambios; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime drop table public.trips; exception when undefined_object then null; end;
  end if;
end $$;

commit;
