-- 0053 · LAS ENTRADAS PARA VARIOS LAS COMPRE QUIEN LAS COMPRE, Y LOS AVISOS DE «LO SUYO» MÁS CLAROS (Tanda 10N6, §1k, §1l y respuestas 0a-6, 0a-10). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0042 (avisos de entradas) y la 0049 (lo suyo de cada uno). NO edita esas migraciones: reemplaza sus funciones.
--
-- Qué hace, en palabras sencillas:
--   * Los avisos de una entrada para varios (`reserva_grupo`, casos `incluido` / `no_incluido`) llevan ahora `tienen`: los nombres de quienes la tienen, para decir «Eric y Ana han reservado el Coliseo…».
--     (Que una entrada sea «solo para quien la paga» solo cambia el dinero —no cuenta en las cuentas del grupo—; la entrada se ve igual y avisa igual, para que los demás puedan reservar la suya a la misma hora.)
--   * Nuevo: cuando un INVITADO guarda una entrada para varias personas (`reservas_invitado`), también avisa a las marcadas y a las que no, igual que cuando la guarda el administrador (antes solo avisaba el administrador).
--   * El aviso «Eric ha puesto el vuelo para todos.» lleva `suyo_cambiado` = true solo si esa persona tenía su propio vuelo (o su propio alojamiento), y entonces se añade «Se ha cambiado el tuyo.».
--   * Varios cambios seguidos del vuelo o el alojamiento del administrador (15 minutos, sin leer) se juntan en UN solo aviso con lo último que quedó.
--
-- SI NO SE APLICA: todo sigue como antes (con la 0042 y la 0049): los invitados no avisan, el aviso de «lo suyo» siempre dice «Se ha cambiado el tuyo.» y cada cambio es un aviso.

begin;

-- ── 1. Los nombres de quienes tienen una entrada ──────────────────────────────────────────────────────────────────────────────────────

-- Los nombres de pila de una lista de ids (jsonb array de textos), en el mismo orden.
create or replace function public.nombres_de_ids(p_ids jsonb) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(coalesce(nullif(trim(split_part(coalesce(t.nombre, ''), ' ', 1)), ''), 'Alguien') order by p.ord), '[]'::jsonb)
    from jsonb_array_elements_text(coalesce(p_ids, '[]'::jsonb)) with ordinality as p(id, ord)
    left join public.travelers t on t.id::text = p.id
$$;
revoke all on function public.nombres_de_ids(jsonb) from public, anon, authenticated;

-- ── 2. El administrador guarda una entrada para varias personas (reemplaza la de la 0042) ───────────────────────────────────────────

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

-- ── 3. UN INVITADO guarda una entrada para varias personas: avisa igual que el administrador ───────────────────────────────────────

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

-- ── 4. El administrador pone el vuelo / el alojamiento (reemplaza la de la 0049) ─────────────────────────────────────────────────────
--   · «Se ha cambiado el tuyo.» solo a quien TENÍA su propio vuelo (o su propio alojamiento): `suyo_cambiado`.
--   · Varios cambios seguidos (15 minutos, sin leer) se juntan en un solo aviso, con lo último que quedó.

create or replace function public.dejar_aviso_de_lo_suyo(p_miembro uuid, p_trip uuid, p_caso text, p_actor uuid, p_nombre text, p_para text, p_suyo boolean, p_huella text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_previo public.avisos%rowtype;
  v_clave text := case when p_caso = 'vuelo_cambiado' then 'ls:vc:' else 'ls:ac:' end || p_trip || ':' || p_miembro || ':' || p_huella;
  v_payload jsonb;
begin
  select * into v_previo from public.avisos a
   where a.user_id = p_miembro and a.tipo = 'reserva_grupo' and a.leido_en is null and a.payload ->> 'caso' = p_caso
     and a.payload ->> 'trip_id' = p_trip::text and a.payload ->> 'quien_id' = p_actor::text and a.creado_en > now() - interval '15 minutes'
   order by a.creado_en desc limit 1;
  v_payload := jsonb_build_object('caso', p_caso, 'trip_id', p_trip, 'quien', p_nombre, 'quien_id', p_actor, 'inicial', public.inicial_de_email(p_actor), 'para', p_para,
    'suyo_cambiado', p_suyo or coalesce((v_previo.payload ->> 'suyo_cambiado')::boolean, false));
  if v_previo.id is not null then
    -- Se junta con el anterior: lo último que quedó. (Si ya hubo otro aviso con esa misma huella, se deja como está.)
    if not exists (select 1 from public.avisos a where a.user_id = p_miembro and a.clave = v_clave and a.id <> v_previo.id) then
      update public.avisos set clave = v_clave, payload = v_payload where id = v_previo.id;
    end if;
  else
    insert into public.avisos (user_id, tipo, clave, payload) values (p_miembro, 'reserva_grupo', v_clave, v_payload) on conflict (user_id, clave) do nothing;
  end if;
end $$;
revoke all on function public.dejar_aviso_de_lo_suyo(uuid, uuid, text, uuid, text, text, boolean, text) from public, anon, authenticated;

create or replace function public.avisar_lo_del_admin() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_nombre text;
  v_vuelo_antes text;
  v_vuelo_ahora text;
  v_aloj_antes text;
  v_aloj_ahora text;
  v_para_v jsonb := new.route #> '{cuentasEntre,llegada}';
  v_para_a jsonb;
  v_clave_aloj text;
  v_miembro uuid;
  v_texto_para text;
  v_tenia boolean;
begin
  v_vuelo_antes := concat_ws('|', old.route ->> 'arrivalFlightTime', old.route ->> 'arrivalPointId', old.route ->> 'departureFlightTime', old.route ->> 'departurePointId', old.route #>> '{cuentasEntre,llegada}');
  v_vuelo_ahora := concat_ws('|', new.route ->> 'arrivalFlightTime', new.route ->> 'arrivalPointId', new.route ->> 'departureFlightTime', new.route ->> 'departurePointId', new.route #>> '{cuentasEntre,llegada}');
  select k into v_clave_aloj from jsonb_object_keys(coalesce(new.route -> 'cuentasEntre', '{}'::jsonb)) k where k like 'aloj-%' limit 1;
  v_para_a := case when v_clave_aloj is not null then new.route -> 'cuentasEntre' -> v_clave_aloj end;
  v_aloj_antes := coalesce(old.bookings -> 'accommodationSelections', '{}'::jsonb)::text || '|' || coalesce((select string_agg(k || '=' || (old.route -> 'cuentasEntre' ->> k), ',') from jsonb_object_keys(coalesce(old.route -> 'cuentasEntre', '{}'::jsonb)) k where k like 'aloj-%'), '');
  v_aloj_ahora := coalesce(new.bookings -> 'accommodationSelections', '{}'::jsonb)::text || '|' || coalesce((select string_agg(k || '=' || (new.route -> 'cuentasEntre' ->> k), ',') from jsonb_object_keys(coalesce(new.route -> 'cuentasEntre', '{}'::jsonb)) k where k like 'aloj-%'), '');
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.traveler_id;

  if v_vuelo_ahora is distinct from v_vuelo_antes and (new.route ->> 'arrivalFlightTime' is not null or new.route ->> 'departureFlightTime' is not null) then
    for v_miembro in select m.user_id from public.trip_members m where m.trip_id = new.id and m.user_id <> new.traveler_id loop
      if jsonb_typeof(v_para_v) = 'array' and not (v_para_v ? v_miembro::text) then continue; end if;
      v_texto_para := case when jsonb_typeof(v_para_v) is distinct from 'array' then 'todos' when jsonb_array_length(v_para_v) <= 2 then 'ti' else 'algunos' end;
      select exists (select 1 from public.lo_suyo_del_viaje l where l.trip_id = new.id and l.user_id = v_miembro and l.vuelo is not null) into v_tenia;
      update public.lo_suyo_del_viaje set vuelo = null, actualizado_en = now() where trip_id = new.id and user_id = v_miembro and vuelo is not null;
      perform public.dejar_aviso_de_lo_suyo(v_miembro, new.id, 'vuelo_cambiado', new.traveler_id, v_nombre, v_texto_para, v_tenia, md5(v_vuelo_ahora));
    end loop;
  end if;

  if v_aloj_ahora is distinct from v_aloj_antes and coalesce(new.bookings -> 'accommodationSelections', '{}'::jsonb) <> '{}'::jsonb then
    for v_miembro in select m.user_id from public.trip_members m where m.trip_id = new.id and m.user_id <> new.traveler_id loop
      if jsonb_typeof(v_para_a) = 'array' and not (v_para_a ? v_miembro::text) then continue; end if;
      v_texto_para := case when jsonb_typeof(v_para_a) is distinct from 'array' then 'todos' when jsonb_array_length(v_para_a) <= 2 then 'ti' else 'algunos' end;
      select exists (select 1 from public.lo_suyo_del_viaje l where l.trip_id = new.id and l.user_id = v_miembro and l.alojamiento is not null) into v_tenia;
      update public.lo_suyo_del_viaje set alojamiento = null, actualizado_en = now() where trip_id = new.id and user_id = v_miembro and alojamiento is not null;
      perform public.dejar_aviso_de_lo_suyo(v_miembro, new.id, 'alojamiento_cambiado', new.traveler_id, v_nombre, v_texto_para, v_tenia, md5(v_aloj_ahora));
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists avisar_lo_del_admin on public.trips;
create trigger avisar_lo_del_admin after update of route, bookings on public.trips for each row execute function public.avisar_lo_del_admin();

commit;
