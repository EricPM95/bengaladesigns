-- 0036 · LAS PERSONAS DEL VIAJE Y SUS PERMISOS (Tanda 10N, apartados 4a, 5 y 10). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (entera y en una sola ejecución).
-- Va DESPUÉS de la 0035 (los tipos de aviso `permiso`, `quitado` y `viaje_cambiado` los deja la 0035; esta migración NO toca la lista de tipos).
--
-- Qué hace, en palabras sencillas:
--   1. `trip_members.permiso`: los tres permisos de un viaje compartido. El administrador es el dueño del viaje (no tiene fila aquí); cada invitado es «editar» o «recomendar».
--      TODOS entran con «recomendar»; solo el administrador sube a alguien (`cambiar_permiso`) y le llega un aviso a la campana.
--   2. Quién puede escribir en la ruta: el dueño y quien tiene «editar». Un editor NO cambia las fechas, el vuelo ni el alojamiento, ni mueve ni borra el viaje (disparador `trips_limites_editor`).
--      Los editores también aceptan o rechazan las recomendaciones, igual que el administrador.
--   3. Quitar a alguien (`quitar_del_viaje`) o salir (`salir_del_viaje`): deja de ver el viaje enseguida (las reglas de lectura miran `trip_members`), su plaza del pase VUELVE a quien la compró
--      (se resta el uso del pase y de la invitación) y a quien quitan le llega «Ya no formas parte del viaje a Roma». Lo ganado (logros, fundador, EXP) no se toca. El administrador no puede quitarse ni salir.
--   4. `gente_del_viaje` dice el permiso de cada uno y cuál eres tú (`es_yo`).
--   5. `ver_invitacion` dice si ya estás dentro (`ya_dentro` + `trip_id`) para no volver a enseñarte «Eric te invita…» si ya estás en el viaje.
--   6. Los cambios del viaje en directo: `avisar_viaje_cambiado` (disparador de `trips`) deja en la campana de los demás UN aviso por tanda de cambios («Eric ha cambiado el viaje: ha quitado 2 días»;
--      los cambios seguidos de la misma persona en 15 minutos se juntan en el mismo aviso). Y `trips`, `trip_members` y `avisos` entran en la publicación de Realtime de Supabase.
--
-- SI NO SE APLICA: la app sigue como antes (todos los invitados se tratan como «Solo recomendar», no hay lista de permisos con botones que funcionen y los cambios llegan al volver a abrir la app).

begin;

-- ── 1. El permiso de cada invitado ────────────────────────────────────────────────────────────────────────────────────────────────────

alter table public.trip_members add column if not exists permiso text not null default 'recomendar';
alter table public.trip_members drop constraint if exists trip_members_permiso_check;
alter table public.trip_members add constraint trip_members_permiso_check check (permiso in ('admin', 'editar', 'recomendar'));
-- El pase con el que entró (para devolverle la plaza a quien lo compró al quitarlo). Las filas de antes se resuelven por las invitaciones del viaje.
alter table public.trip_members add column if not exists pass_id uuid references public.passes (id) on delete set null;

create or replace function public.es_editor(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trip_members m where m.trip_id = p_trip and m.user_id = auth.uid() and m.permiso = 'editar')
$$;

-- El dueño o quien tiene «editar»: los que tocan la ruta y deciden las recomendaciones.
create or replace function public.puede_editar(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.es_dueno(p_trip) or public.es_editor(p_trip)
$$;

-- ── 2. Quién escribe en el viaje ──────────────────────────────────────────────────────────────────────────────────────────────────────

drop policy if exists "trips update dueno" on public.trips;
drop policy if exists "trips update dueno o editor" on public.trips;
create policy "trips update dueno o editor" on public.trips
  for update to authenticated using (traveler_id = auth.uid() or public.es_editor(id)) with check (traveler_id = auth.uid() or public.es_editor(id));

-- Un editor toca la ruta, pero NO las fechas, el vuelo ni el alojamiento, ni la propiedad del viaje. (Quitar o añadir un día cambia el último día de las fechas: eso sí vale.)
create or replace function public.trips_limites_editor() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or old.traveler_id = v_uid then return new; end if;
  if new.traveler_id is distinct from old.traveler_id or new.guardado_en is distinct from old.guardado_en or new.generation_state is distinct from old.generation_state then
    raise exception 'Solo el administrador puede hacer eso.';
  end if;
  if (new.route #>> '{answers,dateRange,start}') is distinct from (old.route #>> '{answers,dateRange,start}')
     or ((new.route #>> '{answers,dateRange,end}') is distinct from (old.route #>> '{answers,dateRange,end}')
         and jsonb_array_length(coalesce(new.route -> 'days', '[]'::jsonb)) = jsonb_array_length(coalesce(old.route -> 'days', '[]'::jsonb))) then
    raise exception 'Solo el administrador cambia las fechas del viaje.';
  end if;
  if (new.route -> 'departureFlightTime') is distinct from (old.route -> 'departureFlightTime')
     or (new.route -> 'arrivalFlightTime') is distinct from (old.route -> 'arrivalFlightTime')
     or (new.bookings -> 'transportBookings') is distinct from (old.bookings -> 'transportBookings')
     or (new.bookings -> 'accommodationSelections') is distinct from (old.bookings -> 'accommodationSelections')
     or (new.bookings -> 'rentalVehicleBooking') is distinct from (old.bookings -> 'rentalVehicleBooking') then
    raise exception 'Solo el administrador cambia el vuelo o el alojamiento.';
  end if;
  return new;
end $$;
drop trigger if exists trips_limites_editor on public.trips;
create trigger trips_limites_editor before update on public.trips for each row execute function public.trips_limites_editor();

-- Las recomendaciones: las ve su autor y los que pueden editar; las deciden el dueño y los editores.
drop policy if exists "trip_recommendations select" on public.trip_recommendations;
create policy "trip_recommendations select" on public.trip_recommendations
  for select to authenticated using (author_id = auth.uid() or public.puede_editar(trip_id));
drop policy if exists "trip_recommendations update dueno" on public.trip_recommendations;
drop policy if exists "trip_recommendations update dueno o editor" on public.trip_recommendations;
create policy "trip_recommendations update dueno o editor" on public.trip_recommendations
  for update to authenticated using (public.puede_editar(trip_id)) with check (public.puede_editar(trip_id));

-- ── 3. Quién está en el viaje, con su permiso ─────────────────────────────────────────────────────────────────────────────────────────

create or replace function public.gente_del_viaje(p_trip uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.es_dueno(p_trip) or public.es_miembro(p_trip) then (
    select coalesce(jsonb_agg(jsonb_build_object('id', x.uid, 'nombre', nullif(trim(split_part(coalesce(tr.nombre, ''), ' ', 1)), ''), 'inicial', public.inicial_de_email(x.uid), 'foto', tr.foto_path,
                                                  'es_admin', x.es_admin, 'permiso', x.permiso, 'es_yo', x.uid = auth.uid()) order by x.orden, x.unido, x.uid), '[]'::jsonb)
    from (
      select t.traveler_id as uid, true as es_admin, 'admin'::text as permiso, 0 as orden, 'epoch'::timestamptz as unido from public.trips t where t.id = p_trip
      union all
      select m.user_id, false, m.permiso, 1, m.created_at from public.trip_members m where m.trip_id = p_trip
    ) x left join public.travelers tr on tr.id = x.uid
  ) else '[]'::jsonb end
$$;
revoke all on function public.gente_del_viaje(uuid) from public, anon;
grant execute on function public.gente_del_viaje(uuid) to authenticated;

-- ── 4. Cambiar el permiso (solo el administrador) ─────────────────────────────────────────────────────────────────────────────────────

create or replace function public.cambiar_permiso(p_trip uuid, p_user uuid, p_permiso text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_admin text;
  v_destino text;
  v_filas integer;
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  if not public.es_dueno(p_trip) then raise exception 'Solo el administrador cambia los permisos.'; end if;
  if p_permiso not in ('editar', 'recomendar') then raise exception 'Ese permiso no existe.'; end if;
  update public.trip_members set permiso = p_permiso where trip_id = p_trip and user_id = p_user and permiso is distinct from p_permiso;
  get diagnostics v_filas = row_count;
  if v_filas = 0 then return jsonb_build_object('cambiado', false); end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_admin from public.travelers where id = auth.uid();
  select route ->> 'destination' into v_destino from public.trips where id = p_trip;
  insert into public.avisos (user_id, tipo, clave, payload)
  values (p_user, 'permiso', 'permiso:' || p_trip || ':' || p_user || ':' || gen_random_uuid(),
          jsonb_build_object('trip_id', p_trip, 'destino', v_destino, 'admin', v_admin, 'inicial', public.inicial_de_email(auth.uid()), 'permiso', p_permiso));
  return jsonb_build_object('cambiado', true);
end $$;

-- ── 5. Quitar a alguien o salir del viaje ─────────────────────────────────────────────────────────────────────────────────────────────

-- El pase con el que entró esa persona (el guardado o, en las filas de antes, el de alguna invitación del viaje de la que sea miembro).
create or replace function public.pase_de_miembro(p_trip uuid, p_user uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select m.pass_id from public.trip_members m where m.trip_id = p_trip and m.user_id = p_user),
    (select i.pass_id from public.trip_invitations i join public.pass_members pm on pm.pass_id = i.pass_id and pm.user_id = p_user
      where i.trip_id = p_trip and i.pass_id is not null order by i.created_at desc limit 1)
  )
$$;
revoke all on function public.pase_de_miembro(uuid, uuid) from public, anon, authenticated;

-- Lo que enseña «¿Quitar a Luis del viaje a Roma?»: el nombre y, si tenía plaza de un pase, cómo está ese pase ahora.
create or replace function public.info_quitar(p_trip uuid, p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_pase public.passes%rowtype;
  v_id uuid;
begin
  if not public.es_dueno(p_trip) then raise exception 'Solo el administrador puede quitar a alguien del viaje.'; end if;
  v_id := public.pase_de_miembro(p_trip, p_user);
  if v_id is not null then select * into v_pase from public.passes where id = v_id; end if;
  return jsonb_build_object(
    'nombre', (select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') from public.travelers where id = p_user),
    'plaza', case when v_id is null or v_pase.id is null or v_pase.comprador_id = p_user then null
                  else jsonb_build_object('pass_id', v_pase.id, 'tipo', v_pase.tipo, 'usos_usados', v_pase.usos_usados, 'usos_max', v_pase.usos_max) end);
end $$;

-- Saca a esa persona del viaje y devuelve su plaza. Solo la llaman las dos funciones de abajo.
create or replace function public.sacar_del_viaje(p_trip uuid, p_user uuid, p_aviso boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pase uuid;
  v_filas integer;
  v_devuelta boolean := false;
  v_destino text;
  v_admin text;
begin
  v_pase := public.pase_de_miembro(p_trip, p_user);
  delete from public.trip_members where trip_id = p_trip and user_id = p_user;
  get diagnostics v_filas = row_count;
  if v_filas = 0 then return jsonb_build_object('quitado', false); end if;
  -- La plaza del pase vuelve a quien la compró (la del propio comprador no se toca: no es una plaza que se pueda dar a otro).
  if v_pase is not null then
    delete from public.pass_members pm using public.passes p where pm.pass_id = p.id and pm.pass_id = v_pase and pm.user_id = p_user and p.comprador_id <> p_user;
    get diagnostics v_filas = row_count;
    if v_filas > 0 then
      update public.passes set usos_usados = greatest(usos_usados - 1, 0) where id = v_pase;
      v_devuelta := true;
    end if;
  end if;
  -- Y la plaza de la invitación (la última que se usó en este viaje) también queda libre.
  update public.trip_invitations set usos_usados = greatest(usos_usados - 1, 0)
   where id = (select i.id from public.trip_invitations i where i.trip_id = p_trip and i.usos_usados > 0 and (v_pase is null or i.pass_id is not distinct from v_pase) order by i.created_at desc limit 1);
  if p_aviso then
    select route ->> 'destination' into v_destino from public.trips where id = p_trip;
    select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_admin from public.travelers where id = auth.uid();
    insert into public.avisos (user_id, tipo, clave, payload)
    values (p_user, 'quitado', 'quitado:' || p_trip || ':' || p_user || ':' || gen_random_uuid(), jsonb_build_object('trip_id', p_trip, 'destino', v_destino, 'admin', v_admin));
  end if;
  return jsonb_build_object('quitado', true, 'plaza_devuelta', v_devuelta);
end $$;
revoke all on function public.sacar_del_viaje(uuid, uuid, boolean) from public, anon, authenticated;

create or replace function public.quitar_del_viaje(p_trip uuid, p_user uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  if not public.es_dueno(p_trip) then raise exception 'Solo el administrador puede quitar a alguien del viaje.'; end if;
  if p_user = auth.uid() then raise exception 'El administrador no puede quitarse del viaje; si quiere dejarlo, lo borra.'; end if;
  return public.sacar_del_viaje(p_trip, p_user, true);
end $$;

create or replace function public.salir_del_viaje(p_trip uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  if public.es_dueno(p_trip) then raise exception 'El administrador no puede salir del viaje; si quiere dejarlo, lo borra.'; end if;
  if not public.es_miembro(p_trip) then raise exception 'No estás en ese viaje.'; end if;
  return public.sacar_del_viaje(p_trip, auth.uid(), false);
end $$;

-- ── 6. Entrar: la invitación recuerda el pase y dice si ya estás dentro ───────────────────────────────────────────────────────────────

create or replace function public.canjear_invitacion(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  inv public.trip_invitations%rowtype;
  v_pase public.passes%rowtype;
  v_filas integer;
begin
  if v_uid is null then raise exception 'Hace falta una sesión.'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) then raise exception 'Primero crea tu cuenta.'; end if;
  select * into inv from public.trip_invitations where codigo = upper(trim(p_codigo)) for update;
  if not found then raise exception 'Esa invitación no existe.'; end if;
  if exists (select 1 from public.trips t where t.id = inv.trip_id and t.traveler_id = v_uid)
     or exists (select 1 from public.trip_members m where m.trip_id = inv.trip_id and m.user_id = v_uid) then
    return jsonb_build_object('trip_id', inv.trip_id, 'ya_estaba', true);
  end if;
  if inv.anulada_en is not null then raise exception 'Esa invitación se ha anulado.'; end if;
  if inv.pass_id is not null then
    select * into v_pase from public.passes where id = inv.pass_id for update;
    if not found or v_pase.usos_usados >= v_pase.usos_max then raise exception 'Ya no quedan usos en esta invitación.'; end if;
    insert into public.pass_members (pass_id, user_id) values (inv.pass_id, v_uid) on conflict do nothing;
    get diagnostics v_filas = row_count;
    if v_filas > 0 then update public.passes set usos_usados = usos_usados + 1 where id = inv.pass_id; end if;
  elsif inv.usos_usados >= inv.usos_max then
    raise exception 'Ya no quedan usos en esta invitación.';
  end if;
  update public.trip_invitations set usos_usados = usos_usados + 1 where id = inv.id;
  insert into public.travelers (id, is_anonymous) values (v_uid, false) on conflict (id) do nothing;
  -- Todos entran con «Solo recomendar»; el administrador sube a quien quiera.
  insert into public.trip_members (trip_id, user_id, invited_by, permiso, pass_id) values (inv.trip_id, v_uid, inv.creada_por, 'recomendar', inv.pass_id);
  return jsonb_build_object('trip_id', inv.trip_id, 'ya_estaba', false, 'con_pase', inv.pass_id is not null);
end $$;

-- Igual que en la 0026 y con `ya_dentro` / `trip_id`: quien ya está en el viaje (o lo administra) no vuelve a ver «Eric te invita a su viaje a Roma».
create or replace function public.ver_invitacion(p_codigo text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  inv public.trip_invitations%rowtype;
  v_pase public.passes%rowtype;
  v_destino text;
  v_inicio text;
  v_fin text;
  v_quien text;
  v_extra jsonb;
  v_dentro boolean;
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  select * into inv from public.trip_invitations where codigo = upper(trim(p_codigo));
  if not found then return jsonb_build_object('valida', false, 'motivo', 'no_existe'); end if;
  select route ->> 'destination', route #>> '{answers,dateRange,start}', route #>> '{answers,dateRange,end}'
    into v_destino, v_inicio, v_fin from public.trips where id = inv.trip_id;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_quien from public.travelers where id = inv.creada_por;
  v_dentro := exists (select 1 from public.trips t where t.id = inv.trip_id and t.traveler_id = auth.uid())
           or exists (select 1 from public.trip_members m where m.trip_id = inv.trip_id and m.user_id = auth.uid());
  v_extra := jsonb_build_object('destino', v_destino, 'invitador', v_quien, 'inicio', v_inicio, 'fin', v_fin, 'con_pase', inv.pass_id is not null, 'ya_dentro', v_dentro, 'trip_id', case when v_dentro then inv.trip_id end);
  if v_dentro then return jsonb_build_object('valida', true) || v_extra; end if;
  if inv.anulada_en is not null then return jsonb_build_object('valida', false, 'motivo', 'anulada') || v_extra; end if;
  if inv.pass_id is not null then
    select * into v_pase from public.passes where id = inv.pass_id;
    if not found or v_pase.usos_usados >= v_pase.usos_max then return jsonb_build_object('valida', false, 'motivo', 'sin_usos') || v_extra; end if;
  elsif inv.usos_usados >= inv.usos_max then
    return jsonb_build_object('valida', false, 'motivo', 'sin_usos') || v_extra;
  end if;
  return jsonb_build_object('valida', true) || v_extra;
end $$;

-- ── 7. Los cambios del viaje, en la campana de los demás ──────────────────────────────────────────────────────────────────────────────

-- Las paradas de una ruta (sin los paseos por barrio, que no son visitas): id, nombre, día, posición.
create or replace function public.paradas_de_ruta(p_route jsonb) returns table (sid text, nombre text, dn integer, ord integer)
language sql immutable as $$
  select st ->> 'id', st ->> 'name', (d ->> 'dayNumber')::integer, (o)::integer
  from jsonb_array_elements(coalesce(p_route -> 'days', '[]'::jsonb)) d,
       jsonb_array_elements(coalesce(d -> 'stops', '[]'::jsonb)) with ordinality as x (st, o)
  where coalesce((st ->> 'isZoneWalk')::boolean, false) = false and st ? 'id'
$$;

create or replace function public.avisar_viaje_cambiado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_old integer := jsonb_array_length(coalesce(old.route -> 'days', '[]'::jsonb));
  v_new integer := jsonb_array_length(coalesce(new.route -> 'days', '[]'::jsonb));
  v_fechas boolean;
  v_inicio date;
  v_anadidas jsonb;
  v_quitadas jsonb;
  v_movidas integer;
  v_reordenado boolean;
  v_nombre text;
  v_payload jsonb;
  v_dest uuid;
  v_previo public.avisos%rowtype;
begin
  if v_actor is null or new.route is not distinct from old.route then return new; end if;
  v_fechas := (old.route #>> '{answers,dateRange,start}') is distinct from (new.route #>> '{answers,dateRange,start}')
              or ((old.route #>> '{answers,dateRange,end}') is distinct from (new.route #>> '{answers,dateRange,end}') and v_old = v_new);
  begin
    v_inicio := (new.route #>> '{answers,dateRange,start}')::date;
  exception when others then
    v_inicio := null;
  end;
  select coalesce(jsonb_agg(jsonb_build_object('nombre', a.nombre, 'dia_n', a.dn, 'fecha', case when v_inicio is not null then (v_inicio + (a.dn - 1))::text end) order by a.dn, a.ord), '[]'::jsonb)
    into v_anadidas from public.paradas_de_ruta(new.route) a where not exists (select 1 from public.paradas_de_ruta(old.route) o where o.sid = a.sid);
  select coalesce(jsonb_agg(jsonb_build_object('nombre', o.nombre) order by o.dn, o.ord), '[]'::jsonb)
    into v_quitadas from public.paradas_de_ruta(old.route) o where not exists (select 1 from public.paradas_de_ruta(new.route) a where a.sid = o.sid);
  select count(*) into v_movidas from public.paradas_de_ruta(new.route) a join public.paradas_de_ruta(old.route) o on o.sid = a.sid where o.dn is distinct from a.dn;
  -- (El orden dentro de un día: el mismo conjunto de paradas del día, en otro orden.)
  select exists (
    select 1 from public.paradas_de_ruta(new.route) a join public.paradas_de_ruta(old.route) o on o.sid = a.sid and o.dn = a.dn
    where o.ord is distinct from a.ord and v_movidas = 0 and jsonb_array_length(v_anadidas) = 0 and jsonb_array_length(v_quitadas) = 0
  ) into v_reordenado;
  if v_old = v_new and not v_fechas and jsonb_array_length(v_anadidas) = 0 and jsonb_array_length(v_quitadas) = 0 and v_movidas = 0 and not v_reordenado then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = v_actor;
  v_payload := jsonb_build_object('trip_id', new.id, 'destino', new.route ->> 'destination', 'quien', v_nombre, 'quien_id', v_actor, 'inicial', public.inicial_de_email(v_actor),
    'dias_quitados', greatest(v_old - v_new, 0), 'dias_anadidos', greatest(v_new - v_old, 0), 'fechas', v_fechas,
    'anadidas', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(v_anadidas) e limit 6) q),
    'quitadas', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(v_quitadas) e limit 6) q),
    'movidas', v_movidas, 'reordenado', v_reordenado);
  for v_dest in
    select new.traveler_id union select m.user_id from public.trip_members m where m.trip_id = new.id
  loop
    if v_dest = v_actor then continue; end if;
    -- Cambios seguidos de la misma persona (15 minutos) y sin leer: se juntan en UN solo aviso.
    select * into v_previo from public.avisos a
     where a.user_id = v_dest and a.tipo = 'viaje_cambiado' and a.leido_en is null and a.payload ->> 'trip_id' = new.id::text and a.payload ->> 'quien_id' = v_actor::text and a.creado_en > now() - interval '15 minutes'
     order by a.creado_en desc limit 1;
    if found then
      update public.avisos set creado_en = now(), payload = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
          v_previo.payload,
          '{dias_quitados}', to_jsonb(coalesce((v_previo.payload ->> 'dias_quitados')::integer, 0) + (v_payload ->> 'dias_quitados')::integer)),
          '{dias_anadidos}', to_jsonb(coalesce((v_previo.payload ->> 'dias_anadidos')::integer, 0) + (v_payload ->> 'dias_anadidos')::integer)),
          '{fechas}', to_jsonb(coalesce((v_previo.payload ->> 'fechas')::boolean, false) or v_fechas)),
          '{movidas}', to_jsonb(coalesce((v_previo.payload ->> 'movidas')::integer, 0) + v_movidas)),
          '{reordenado}', to_jsonb(coalesce((v_previo.payload ->> 'reordenado')::boolean, false) or v_reordenado)),
          '{anadidas}', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(coalesce(v_previo.payload -> 'anadidas', '[]'::jsonb) || (v_payload -> 'anadidas')) e limit 6) q)),
          '{quitadas}', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(coalesce(v_previo.payload -> 'quitadas', '[]'::jsonb) || (v_payload -> 'quitadas')) e limit 6) q))
      where id = v_previo.id;
    else
      insert into public.avisos (user_id, tipo, clave, payload)
      values (v_dest, 'viaje_cambiado', 'vc:' || new.id || ':' || v_actor || ':' || gen_random_uuid(), v_payload);
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists avisar_viaje_cambiado on public.trips;
create trigger avisar_viaje_cambiado after update of route on public.trips for each row execute function public.avisar_viaje_cambiado();

-- ── 8. Realtime de Supabase: el viaje, su gente y la campana ──────────────────────────────────────────────────────────────────────────

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.trips; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.trip_members; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.avisos; exception when duplicate_object then null; end;
  end if;
end $$;

revoke all on function public.cambiar_permiso(uuid, uuid, text) from public, anon;
revoke all on function public.info_quitar(uuid, uuid) from public, anon;
revoke all on function public.quitar_del_viaje(uuid, uuid) from public, anon;
revoke all on function public.salir_del_viaje(uuid) from public, anon;
grant execute on function public.cambiar_permiso(uuid, uuid, text) to authenticated;
grant execute on function public.info_quitar(uuid, uuid) to authenticated;
grant execute on function public.quitar_del_viaje(uuid, uuid) to authenticated;
grant execute on function public.salir_del_viaje(uuid) to authenticated;

commit;
