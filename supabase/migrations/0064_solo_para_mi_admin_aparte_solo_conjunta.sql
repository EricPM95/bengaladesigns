-- 0064 · LO «SOLO PARA MÍ» DEL ADMINISTRADOR, GUARDADO APARTE, SOLO EN LA CUENTA CONJUNTA (Tanda 10N9, §1). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- SUSTITUYE a la 0062: se puede aplicar SIN haber aplicado la 0062 (crea lo que falte) y, si la 0062 ya estaba aplicada, la corrige. NO edita la 0062. Aplícala DESPUÉS de la 0055 (y de la 0053).
--
-- El problema de la 0062: sacaba de `trips.bookings` toda reserva «solo del administrador» en CUALQUIER forma de llevar las cuentas. En «Cada uno lo suyo», como una entrada sale marcada solo para quien la compra,
-- casi todas las entradas del administrador habrían desaparecido para sus amigos (y se rompía «Eric la tiene a las 9:15 · Reservar la mía a la misma hora»).
--
-- Qué hace, en palabras sencillas:
--   * La separación solo vale cuando el viaje lleva una CUENTA CONJUNTA (`modo_cuentas_del_viaje(route) = 'conjunta'`, igual que la 0055). En «Cada uno lo suyo» y viajando solo todo queda como antes de la 0062.
--   * Si el viaje pasa de cuenta conjunta a otra forma, lo que estaba guardado aparte vuelve a `trips.bookings` (ya no es secreto: en «Cada uno lo suyo» lo de una sola persona se ve y avisa igual) y la fila de la tabla se vacía.
--   * Si la 0062 ya había apartado reservas de viajes que NO son cuenta conjunta, aquí vuelven a su sitio.
-- SI NO SE APLICA: todo funciona; solo que a nivel de red lo «Solo para mí» del administrador de una cuenta conjunta sigue dentro de `trips.bookings`.

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
  -- (10N9) Solo en la cuenta conjunta. En «Cada uno lo suyo» y viajando solo, nada se aparta.
  if public.modo_cuentas_del_viaje(new.route) is distinct from 'conjunta' then return new; end if;
  if new.bookings is null or jsonb_typeof(new.bookings -> 'reservations') is distinct from 'array' then return new; end if;
  select coalesce(jsonb_agg(e), '[]'::jsonb) into v_priv from jsonb_array_elements(new.bookings -> 'reservations') e where public.reserva_es_solo_del_admin(e, new.traveler_id);
  select coalesce(jsonb_agg(e), '[]'::jsonb), coalesce(array_agg(e ->> 'id'), '{}') into v_resto, v_ids_resto from jsonb_array_elements(new.bookings -> 'reservations') e where not public.reserva_es_solo_del_admin(e, new.traveler_id);
  -- La tabla se va MEZCLANDO (nunca se vacía por un guardado que no las trae). Quitarlas de verdad lo hace la app del administrador sobre la propia tabla.
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

-- Si el viaje deja de ser cuenta conjunta, lo apartado vuelve a `trips.bookings` y la tabla se vacía. (Se llama «a_restaurar…» para que corra antes que «a_separar…» si el mismo guardado cambia las dos cosas.)
create or replace function public.devolver_reservas_privadas() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_guardadas jsonb;
  v_actuales jsonb;
begin
  if public.modo_cuentas_del_viaje(new.route) = 'conjunta' then return new; end if;
  select reservas into v_guardadas from public.reservas_privadas_admin where trip_id = new.id;
  if v_guardadas is null or jsonb_array_length(v_guardadas) = 0 then return new; end if;
  v_actuales := case when jsonb_typeof(new.bookings -> 'reservations') = 'array' then new.bookings -> 'reservations' else '[]'::jsonb end;
  new.bookings := jsonb_set(coalesce(new.bookings, '{}'::jsonb), '{reservations}', v_actuales || coalesce((
    select jsonb_agg(e) from jsonb_array_elements(v_guardadas) e where not exists (select 1 from jsonb_array_elements(v_actuales) a where a ->> 'id' = e ->> 'id')
  ), '[]'::jsonb), true);
  update public.reservas_privadas_admin set reservas = '[]'::jsonb, actualizado_en = now() where trip_id = new.id;
  return new;
end $$;
drop trigger if exists a_restaurar_reservas_privadas on public.trips;
create trigger a_restaurar_reservas_privadas before update of route on public.trips for each row execute function public.devolver_reservas_privadas();

-- Limpieza de una vez (a) de los viajes de cuenta conjunta que aún tienen «Solo para mí» del administrador dentro de `bookings`, y (b) de los viajes que NO son cuenta conjunta y que la 0062 ya había vaciado.
update public.trips set bookings = bookings where jsonb_typeof(bookings -> 'reservations') = 'array' and public.modo_cuentas_del_viaje(route) = 'conjunta' and exists (
  select 1 from jsonb_array_elements(bookings -> 'reservations') e where public.reserva_es_solo_del_admin(e, traveler_id)
);
update public.trips set route = route where public.modo_cuentas_del_viaje(route) is distinct from 'conjunta' and exists (
  select 1 from public.reservas_privadas_admin p where p.trip_id = trips.id and jsonb_array_length(p.reservas) > 0
);

commit;
