-- 0055 · LO «SOLO PARA MÍ» NO LO VE NADIE MÁS, TAMPOCO EL ADMINISTRADOR (Tanda 10N7, §1b y §2b-1). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0053 (y de la 0049). NO edita esas migraciones: reemplaza sus funciones.
--
-- Qué hace, en palabras sencillas (solo cuando el viaje lleva una CUENTA CONJUNTA; en «Cada uno lo suyo» todo sigue igual que con la 0053):
--   * Una entrada «Solo para mí» (la lista de «para quién» es solo quien la compra) ya no avisa a nadie: ni a los demás en la campana ni en la franja. (La reserva sigue en la ruta de todos; lo que se oculta es el dinero.)
--   * `entradas_del_grupo` ya no devuelve a los demás (administrador incluido) las entradas «Solo para mí» de otro.
--   * Lo suyo de cada uno (su propio vuelo y alojamiento) es «Solo para mí»: «Ana ha puesto su propio vuelo» ya no le llega al administrador y `lo_suyo_del_grupo` solo cuenta lo de quien pregunta.
--   * Los gastos «Solo para mí» (`trip_gastos`, ámbito 'mio') ya eran solo de su autor desde la 0037 (ni el administrador los lee): aquí no se toca nada de ellos.
--
-- Cómo sabe el servidor que la cuenta es conjunta: `modo_cuentas_del_viaje(route)` mira `route.modoCuentas` (lo guarda la app) y, si aún no se eligió, «¿Con quién viajas?» (pareja o familia = conjunta).
-- Límite conocido: las reservas del ADMINISTRADOR viajan dentro del viaje (`trips.bookings`) y los miembros pueden leer ese JSON; la app no se las enseña, pero a nivel de red el dato llega. Para cerrarlo del todo,
-- lo «Solo para mí» del administrador tendría que guardarse aparte (como las de los invitados, en `reservas_invitado`). Queda pendiente de decidir.
-- SI NO SE APLICA: todo funciona; solo que los avisos de una entrada «Solo para mí» de una cuenta conjunta llegarían a los demás y el administrador vería (en los datos, no en pantalla) lo suyo de cada uno.

begin;

create or replace function public.modo_cuentas_del_viaje(p_route jsonb) returns text
language sql immutable as $$
  select case
    when p_route ->> 'modoCuentas' in ('conjunta', 'cada_uno') then p_route ->> 'modoCuentas'
    when p_route #>> '{answers,companion}' in ('couple', 'family') then 'conjunta'
    else 'cada_uno'
  end
$$;

create or replace function public.avisar_reservas_grupo() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  v_inicio date := public.fecha_segura(new.route #>> '{answers,dateRange,start}');
  v_fecha date;
  v_dia integer;
  v_nombre text;
  v_miembro uuid;
  v_dia_txt text;
begin
  if new.bookings is not distinct from old.bookings then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.traveler_id;
  for r in select e from jsonb_array_elements(coalesce(new.bookings -> 'reservations', '[]'::jsonb)) e loop
    if r ->> 'kind' is distinct from 'entrada' or jsonb_typeof(r -> 'paraQuien') is distinct from 'array' then continue; end if;
    if jsonb_array_length(r -> 'paraQuien') = 0 then continue; end if;
    -- (10N7) «Solo para mí» de una cuenta conjunta: no se cuenta a nadie.
    if public.modo_cuentas_del_viaje(new.route) = 'conjunta' and jsonb_array_length(r -> 'paraQuien') = 1 and (r -> 'paraQuien') ? new.traveler_id::text then continue; end if;
    if exists (
      select 1 from jsonb_array_elements(coalesce(old.bookings -> 'reservations', '[]'::jsonb)) o
      where o ->> 'id' = r ->> 'id' and (o -> 'paraQuien') is not distinct from (r -> 'paraQuien') and (o ->> 'dateIso') is not distinct from (r ->> 'dateIso')
        and (o ->> 'dayNumber') is not distinct from (r ->> 'dayNumber') and (o ->> 'time') is not distinct from (r ->> 'time')
    ) then continue; end if;
    v_fecha := public.fecha_segura(r ->> 'dateIso');
    v_dia := nullif(r ->> 'dayNumber', '')::integer;
    if v_inicio is null then v_fecha := null; end if;
    v_dia_txt := public.dia_en_palabras(v_fecha, v_dia);
    for v_miembro in select m.user_id from public.trip_members m where m.trip_id = new.id loop
      insert into public.avisos (user_id, tipo, clave, payload)
      values (
        v_miembro, 'reserva_grupo',
        'rg:' || new.id || ':' || (r ->> 'id') || ':' || coalesce(r ->> 'dateIso', r ->> 'dayNumber', '') || ':' || coalesce(r ->> 'time', '') || ':' || v_miembro,
        jsonb_build_object(
          'caso', case when (r -> 'paraQuien') ? v_miembro::text then 'incluido' else 'no_incluido' end,
          'incluido', (r -> 'paraQuien') ? v_miembro::text,
          'trip_id', new.id, 'reserva_id', r ->> 'id', 'ref_id', r ->> 'refId',
          'quien', v_nombre, 'quien_id', new.traveler_id, 'inicial', public.inicial_de_email(new.traveler_id),
          'tienen', public.nombres_de_ids(r -> 'paraQuien'),
          'sitio', coalesce(nullif(r ->> 'shortName', ''), r ->> 'name'), 'sitio_nombre', r ->> 'name',
          'dia', v_dia_txt, 'date_iso', r ->> 'dateIso', 'day_number', v_dia, 'hora', r ->> 'time')
      ) on conflict (user_id, clave) do nothing;
    end loop;
  end loop;
  return new;
end $$;
drop trigger if exists avisar_reservas_grupo on public.trips;
create trigger avisar_reservas_grupo after update of bookings on public.trips for each row execute function public.avisar_reservas_grupo();

create or replace function public.avisar_entrada_de_invitado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  v_ruta jsonb;
  v_inicio date;
  v_fecha date;
  v_dia integer;
  v_nombre text;
  v_dia_txt text;
  v_dueno uuid;
  v_dest uuid;
begin
  select route, traveler_id into v_ruta, v_dueno from public.trips where id = new.trip_id;
  if v_ruta is null then return new; end if;
  v_inicio := public.fecha_segura(v_ruta #>> '{answers,dateRange,start}');
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.user_id;
  for r in select e from jsonb_array_elements(coalesce(new.reservas, '[]'::jsonb)) e loop
    if r ->> 'kind' is distinct from 'entrada' or jsonb_typeof(r -> 'paraQuien') is distinct from 'array' then continue; end if;
    if jsonb_array_length(r -> 'paraQuien') = 0 then continue; end if;
    -- (10N7) «Solo para mí» de una cuenta conjunta: no se cuenta a nadie.
    if public.modo_cuentas_del_viaje(v_ruta) = 'conjunta' and jsonb_array_length(r -> 'paraQuien') = 1 and (r -> 'paraQuien') ? new.user_id::text then continue; end if;
    if tg_op = 'UPDATE' and exists (
      select 1 from jsonb_array_elements(coalesce(old.reservas, '[]'::jsonb)) o
      where o ->> 'id' = r ->> 'id' and (o -> 'paraQuien') is not distinct from (r -> 'paraQuien') and (o ->> 'dateIso') is not distinct from (r ->> 'dateIso')
        and (o ->> 'dayNumber') is not distinct from (r ->> 'dayNumber') and (o ->> 'time') is not distinct from (r ->> 'time')
    ) then continue; end if;
    v_fecha := public.fecha_segura(r ->> 'dateIso');
    v_dia := nullif(r ->> 'dayNumber', '')::integer;
    if v_inicio is null then v_fecha := null; end if;
    v_dia_txt := public.dia_en_palabras(v_fecha, v_dia);
    for v_dest in select v_dueno union select m.user_id from public.trip_members m where m.trip_id = new.trip_id loop
      if v_dest is null or v_dest = new.user_id then continue; end if;
      insert into public.avisos (user_id, tipo, clave, payload)
      values (
        v_dest, 'reserva_grupo',
        'rgi:' || new.trip_id || ':' || new.user_id || ':' || (r ->> 'id') || ':' || coalesce(r ->> 'dateIso', r ->> 'dayNumber', '') || ':' || coalesce(r ->> 'time', '') || ':' || v_dest,
        jsonb_build_object(
          'caso', case when (r -> 'paraQuien') ? v_dest::text then 'incluido' else 'no_incluido' end,
          'incluido', (r -> 'paraQuien') ? v_dest::text,
          'trip_id', new.trip_id, 'reserva_id', r ->> 'id', 'ref_id', r ->> 'refId',
          'quien', v_nombre, 'quien_id', new.user_id, 'inicial', public.inicial_de_email(new.user_id),
          'tienen', public.nombres_de_ids(r -> 'paraQuien'),
          'sitio', coalesce(nullif(r ->> 'shortName', ''), r ->> 'name'), 'sitio_nombre', r ->> 'name',
          'dia', v_dia_txt, 'date_iso', r ->> 'dateIso', 'day_number', v_dia, 'hora', r ->> 'time')
      ) on conflict (user_id, clave) do nothing;
    end loop;
  end loop;
  return new;
end $$;
drop trigger if exists avisar_entrada_de_invitado on public.reservas_invitado;
create trigger avisar_entrada_de_invitado after insert or update of reservas on public.reservas_invitado for each row execute function public.avisar_entrada_de_invitado();

create or replace function public.avisar_lo_suyo_propio() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_dueno uuid;
  v_ruta jsonb;
  v_nombre text;
  v_destino text;
  v_inicio date;
begin
  select traveler_id, route into v_dueno, v_ruta from public.trips where id = new.trip_id;
  if v_dueno is null or v_dueno = new.user_id then return new; end if;
  -- (10N7) En una cuenta conjunta, lo suyo es «Solo para mí»: el administrador no se entera.
  if public.modo_cuentas_del_viaje(v_ruta) = 'conjunta' then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.user_id;
  v_destino := v_ruta ->> 'destination';
  v_inicio := public.fecha_segura(v_ruta #>> '{answers,dateRange,start}');
  if new.vuelo is not null and (tg_op = 'INSERT' or new.vuelo is distinct from old.vuelo) then
    insert into public.avisos (user_id, tipo, clave, payload) values (
      v_dueno, 'reserva_grupo', 'ls:v:' || new.trip_id || ':' || new.user_id || ':' || md5(new.vuelo::text),
      jsonb_build_object('caso', 'vuelo_propio', 'trip_id', new.trip_id, 'quien', v_nombre, 'quien_id', new.user_id, 'inicial', public.inicial_de_email(new.user_id),
        'detalle', trim('Llegada a ' || coalesce(v_destino, '') || coalesce(' · ' || nullif(public.dia_en_palabras(v_inicio, 1), 'día 1'), '')))
    ) on conflict (user_id, clave) do nothing;
  end if;
  if new.alojamiento is not null and (tg_op = 'INSERT' or new.alojamiento is distinct from old.alojamiento) then
    insert into public.avisos (user_id, tipo, clave, payload) values (
      v_dueno, 'reserva_grupo', 'ls:a:' || new.trip_id || ':' || new.user_id || ':' || md5(new.alojamiento::text),
      jsonb_build_object('caso', 'alojamiento_propio', 'trip_id', new.trip_id, 'quien', v_nombre, 'quien_id', new.user_id, 'inicial', public.inicial_de_email(new.user_id),
        'detalle', 'Se aloja en ' || coalesce(nullif(new.alojamiento ->> 'name', ''), 'otro sitio'))
    ) on conflict (user_id, clave) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists avisar_lo_suyo_propio on public.lo_suyo_del_viaje;
create trigger avisar_lo_suyo_propio after insert or update of vuelo, alojamiento on public.lo_suyo_del_viaje for each row execute function public.avisar_lo_suyo_propio();

create or replace function public.lo_suyo_del_grupo(p_trip uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  if not (public.es_miembro(p_trip) or exists (select 1 from public.trips t where t.id = p_trip and t.traveler_id = auth.uid())) then
    raise exception 'No estás en ese viaje.';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('user_id', l.user_id, 'vuelo', l.vuelo is not null, 'alojamiento', l.alojamiento is not null))
      from public.lo_suyo_del_viaje l where l.trip_id = p_trip and (l.vuelo is not null or l.alojamiento is not null)
       -- (10N7) En una cuenta conjunta cada uno solo sabe lo suyo.
       and (l.user_id = auth.uid() or public.modo_cuentas_del_viaje((select t.route from public.trips t where t.id = p_trip)) <> 'conjunta')
  ), '[]'::jsonb);
end $$;
revoke all on function public.lo_suyo_del_grupo(uuid) from public, anon;
grant execute on function public.lo_suyo_del_grupo(uuid) to authenticated;

create or replace function public.entradas_del_grupo(p_trip uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  if not (public.es_miembro(p_trip) or exists (select 1 from public.trips t where t.id = p_trip and t.traveler_id = auth.uid())) then
    raise exception 'No estás en ese viaje.';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('user_id', r.user_id, 'reservas', (
      select coalesce(jsonb_agg(e), '[]'::jsonb) from jsonb_array_elements(coalesce(r.reservas, '[]'::jsonb)) e
       where e ->> 'kind' = 'entrada' and jsonb_typeof(e -> 'paraQuien') = 'array' and jsonb_array_length(e -> 'paraQuien') > 0
         -- (10N7) «Solo para mí» de una cuenta conjunta: nunca llega a los demás (ni el administrador).
         and not (public.modo_cuentas_del_viaje((select t.route from public.trips t where t.id = p_trip)) = 'conjunta' and jsonb_array_length(e -> 'paraQuien') = 1 and (e -> 'paraQuien') ? r.user_id::text)
    )))
      from public.reservas_invitado r where r.trip_id = p_trip
  ), '[]'::jsonb);
end $$;
revoke all on function public.entradas_del_grupo(uuid) from public, anon;
grant execute on function public.entradas_del_grupo(uuid) to authenticated;

commit;
