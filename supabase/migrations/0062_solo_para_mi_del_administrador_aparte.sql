-- 0062 · LO «SOLO PARA MÍ» DEL ADMINISTRADOR, GUARDADO APARTE (Tanda 10N8, §0b-2). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0055 (y de la 0053). NO edita esas migraciones.
--
-- El problema (límite conocido de la 0055): las reservas del administrador viajan dentro del propio viaje (`trips.bookings`) y los miembros pueden leer ese JSON. Una entrada «Solo para mí»
-- (un regalo, una sorpresa) llegaba a los datos de los demás aunque la pantalla no la enseñara.
--
-- Qué hace, en palabras sencillas:
--   * `reservas_privadas_admin`: una fila por viaje con las reservas del administrador que son SOLO para él. Solo las lee y las toca el administrador (RLS).
--   * Un disparador antes de guardar `trips.bookings` saca de ahí esas reservas (una reserva cuyo «¿Para quién es?» es solo el administrador) y las deja en la tabla: nunca llegan a `trips.bookings`,
--     ni a la lectura de un miembro, ni por Realtime. La tabla se mezcla, nunca se vacía por un guardado que no las trae; quitar una de verdad lo hace la app del administrador sobre la tabla.
--   * Al abrir el viaje, la app del administrador las vuelve a juntar con las suyas (lo hace el móvil).
--   * Los viajes ya guardados se limpian solos con el siguiente guardado del administrador; al final de esta migración se limpian todos de una vez.
-- SI NO SE APLICA: todo funciona; solo que a nivel de red lo «Solo para mí» del administrador sigue dentro de `trips.bookings`.

begin;

create table if not exists public.reservas_privadas_admin (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reservas jsonb not null default '[]'::jsonb,
  actualizado_en timestamptz not null default now()
);
alter table public.reservas_privadas_admin enable row level security;
drop policy if exists "privadas admin select" on public.reservas_privadas_admin;
create policy "privadas admin select" on public.reservas_privadas_admin for select to authenticated using (user_id = auth.uid());
drop policy if exists "privadas admin insert" on public.reservas_privadas_admin;
create policy "privadas admin insert" on public.reservas_privadas_admin for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.trips t where t.id = trip_id and t.traveler_id = auth.uid()));
drop policy if exists "privadas admin update" on public.reservas_privadas_admin;
create policy "privadas admin update" on public.reservas_privadas_admin for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "privadas admin delete" on public.reservas_privadas_admin;
create policy "privadas admin delete" on public.reservas_privadas_admin for delete to authenticated using (user_id = auth.uid());

-- ¿Es una reserva solo para el administrador? («¿Para quién es?» = una sola persona, el administrador.)
create or replace function public.reserva_es_solo_del_admin(r jsonb, p_admin uuid) returns boolean
language sql immutable as $$
  select jsonb_typeof(r -> 'paraQuien') = 'array' and jsonb_array_length(r -> 'paraQuien') = 1 and (r -> 'paraQuien') ? p_admin::text
$$;

create or replace function public.separar_reservas_privadas() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_priv jsonb;
  v_resto jsonb;
  v_ids_resto text[];
begin
  if new.bookings is null or jsonb_typeof(new.bookings -> 'reservations') is distinct from 'array' then return new; end if;
  select coalesce(jsonb_agg(e), '[]'::jsonb) into v_priv from jsonb_array_elements(new.bookings -> 'reservations') e where public.reserva_es_solo_del_admin(e, new.traveler_id);
  select coalesce(jsonb_agg(e), '[]'::jsonb), coalesce(array_agg(e ->> 'id'), '{}') into v_resto, v_ids_resto from jsonb_array_elements(new.bookings -> 'reservations') e where not public.reserva_es_solo_del_admin(e, new.traveler_id);
  -- La tabla se va MEZCLANDO (nunca se vacía por un guardado que no las trae: un móvil que aún no las ha juntado no las borra). Quitarlas de verdad lo hace la app del administrador sobre la propia tabla.
  -- Una reserva que deja de ser «solo para mí» (el administrador añade a alguien) sale de la tabla y vuelve a viajar con el viaje.
  if jsonb_array_length(v_priv) = 0 and not exists (select 1 from public.reservas_privadas_admin where trip_id = new.id) then return new; end if;
  insert into public.reservas_privadas_admin (trip_id, user_id, reservas, actualizado_en) values (new.id, new.traveler_id, v_priv, now())
    on conflict (trip_id) do update set reservas = (
      select coalesce(jsonb_agg(e), '[]'::jsonb) from (
        select e from jsonb_array_elements(public.reservas_privadas_admin.reservas) e
         where not (e ->> 'id' = any (v_ids_resto)) and not exists (select 1 from jsonb_array_elements(excluded.reservas) n where n ->> 'id' = e ->> 'id')
        union all
        select e from jsonb_array_elements(excluded.reservas) e
      ) t(e)
    ), actualizado_en = now();
  if jsonb_array_length(v_priv) > 0 then new.bookings := jsonb_set(new.bookings, '{reservations}', v_resto); end if;
  return new;
end $$;
drop trigger if exists a_separar_reservas_privadas on public.trips;
create trigger a_separar_reservas_privadas before insert or update of bookings on public.trips for each row execute function public.separar_reservas_privadas();

-- Limpieza de una vez de los viajes que ya tenían reservas «Solo para mí» del administrador dentro de `bookings`.
update public.trips set bookings = bookings where jsonb_typeof(bookings -> 'reservations') = 'array' and exists (
  select 1 from jsonb_array_elements(bookings -> 'reservations') e where public.reserva_es_solo_del_admin(e, traveler_id)
);

commit;
