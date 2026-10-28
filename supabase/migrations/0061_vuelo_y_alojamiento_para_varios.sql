-- 0061 · EL VUELO Y EL ALOJAMIENTO, PARA QUIEN LO PONE Y PARA QUIEN ÉL MARQUE (Tanda 10N8, §7c y §7d). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0049, la 0053 y la 0055. NO edita esas migraciones: reemplaza una función.
--
-- Qué hace, en palabras sencillas:
--   * `poner_lo_suyo_para(viaje, vuelo, alojamiento, para, detalle)`: cualquiera del viaje (administrador no: el suyo vive en la ruta) pone un vuelo o un alojamiento y dice PARA QUIÉN ES. Se guarda
--     en la fila de `lo_suyo_del_viaje` de cada marcado (con «puestoPor» y «para» dentro del dato), en un solo guardado. Si alguien ya tenía el suyo, se le cambia.
--   * Un solo aviso por persona, con la ida y la vuelta juntas («Eric ha puesto el vuelo para ti y Ana: ida mar 10 · 11:15, vuelta sáb 14 · 18:05.»). Los textos salen de `payload.para_txt` y `payload.detalle`.
--   * El aviso «Ana ha puesto su propio vuelo» (0049/0055) deja de saltar por cada fila que escribe esta función: se apaga solo dentro de ella (`jutrip.sin_aviso_propio`).
--   * Sin esta migración: cada uno sigue pudiendo poner lo suyo (solo para sí); lo de «para otros» queda en su móvil y los avisos no llegan.

begin;

create or replace function public.avisar_lo_suyo_propio() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_dueno uuid;
  v_ruta jsonb;
  v_nombre text;
  v_destino text;
  v_inicio date;
begin
  -- (10N8) Lo escribe `poner_lo_suyo_para`, que ya avisa una sola vez con ida y vuelta juntas.
  if coalesce(current_setting('jutrip.sin_aviso_propio', true), '') = '1' then return new; end if;
  select traveler_id, route into v_dueno, v_ruta from public.trips where id = new.trip_id;
  if v_dueno is null or v_dueno = new.user_id then return new; end if;
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

-- «ti y Ana» / «Ana y Luis» / «ti, Ana y Luis»: los nombres de los marcados, vistos desde quien recibe el aviso.
create or replace function public.nombres_para_aviso(p_ids uuid[], p_desde uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  v_lista text[] := '{}';
  v_id uuid;
  v_n text;
begin
  if p_desde = any (p_ids) then v_lista := array['ti']; end if;
  foreach v_id in array p_ids loop
    if v_id = p_desde then continue; end if;
    select coalesce(nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), ''), 'alguien') into v_n from public.travelers where id = v_id;
    v_lista := v_lista || coalesce(v_n, 'alguien');
  end loop;
  if array_length(v_lista, 1) is null then return ''; end if;
  if array_length(v_lista, 1) = 1 then return v_lista[1]; end if;
  return array_to_string(v_lista[1:array_length(v_lista, 1) - 1], ', ') || ' y ' || v_lista[array_length(v_lista, 1)];
end $$;
revoke all on function public.nombres_para_aviso(uuid[], uuid) from public, anon, authenticated;

create or replace function public.poner_lo_suyo_para(p_trip uuid, p_vuelo jsonb, p_alojamiento jsonb, p_para uuid[], p_detalle text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_dueno uuid;
  v_ruta jsonb;
  v_nombre text;
  v_destino uuid;
  v_ids uuid[] := '{}';
  v_vis uuid[] := '{}';
  v_id uuid;
  v_conjunta boolean;
  v_caso text := case when p_vuelo is not null then 'vuelo_cambiado' else 'alojamiento_cambiado' end;
  v_dato jsonb := coalesce(p_vuelo, p_alojamiento);
  v_tenia boolean;
  v_tenian uuid[] := '{}';
begin
  if v_uid is null then raise exception 'Hace falta una sesión.'; end if;
  select traveler_id, route into v_dueno, v_ruta from public.trips where id = p_trip;
  if v_dueno is null then raise exception 'No existe ese viaje.'; end if;
  if not (public.es_miembro(p_trip) or v_dueno = v_uid) then raise exception 'No estás en ese viaje.'; end if;
  if p_vuelo is null and p_alojamiento is null then return; end if;
  v_conjunta := public.modo_cuentas_del_viaje(v_ruta) = 'conjunta';
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = v_uid;
  -- Los marcados que son del viaje (el administrador no: lo suyo vive en la ruta). Quien lo pone siempre va.
  foreach v_id in array (array[v_uid] || coalesce(p_para, '{}')) loop
    if v_id = any (v_vis) then continue; end if;
    if v_id <> v_uid and v_id <> v_dueno and not exists (select 1 from public.trip_members m where m.trip_id = p_trip and m.user_id = v_id) then continue; end if;
    v_vis := v_vis || v_id;
    if v_id = v_dueno and v_id <> v_uid then continue; end if;
    v_ids := v_ids || v_id;
  end loop;
  perform set_config('jutrip.sin_aviso_propio', '1', true);
  foreach v_id in array v_ids loop
    v_tenia := false;
    if p_vuelo is not null then
      select exists (select 1 from public.lo_suyo_del_viaje l where l.trip_id = p_trip and l.user_id = v_id and l.vuelo is not null) into v_tenia;
      if v_tenia then v_tenian := v_tenian || v_id; end if;
      insert into public.lo_suyo_del_viaje (trip_id, user_id, vuelo, actualizado_en) values (p_trip, v_id, p_vuelo, now())
        on conflict (trip_id, user_id) do update set vuelo = excluded.vuelo, actualizado_en = now();
    else
      select exists (select 1 from public.lo_suyo_del_viaje l where l.trip_id = p_trip and l.user_id = v_id and l.alojamiento is not null) into v_tenia;
      if v_tenia then v_tenian := v_tenian || v_id; end if;
      insert into public.lo_suyo_del_viaje (trip_id, user_id, alojamiento, actualizado_en) values (p_trip, v_id, p_alojamiento, now())
        on conflict (trip_id, user_id) do update set alojamiento = excluded.alojamiento, actualizado_en = now();
    end if;
  end loop;
  -- Un solo aviso a cada persona (menos a quien lo pone). «Solo para mí» en una cuenta conjunta no avisa a nadie.
  if v_conjunta and array_length(v_vis, 1) = 1 then return; end if;
  foreach v_destino in array (select array_agg(distinct x) from unnest(v_vis || v_dueno) x) loop
    if v_destino = v_uid then continue; end if;
    if array_length(v_vis, 1) = 1 then
      -- Lo puso solo para sí: al administrador le llega el de siempre, «Ana ha puesto su propio vuelo.».
      insert into public.avisos (user_id, tipo, clave, payload) values (
        v_destino, 'reserva_grupo', 'ls:' || case when p_vuelo is not null then 'v' else 'a' end || ':' || p_trip || ':' || v_uid || ':' || md5(v_dato::text),
        jsonb_build_object('caso', case when p_vuelo is not null then 'vuelo_propio' else 'alojamiento_propio' end, 'trip_id', p_trip, 'quien', v_nombre, 'quien_id', v_uid, 'inicial', public.inicial_de_email(v_uid), 'detalle', left(coalesce(p_detalle, ''), 200))
      ) on conflict (user_id, clave) do nothing;
    else
      insert into public.avisos (user_id, tipo, clave, payload) values (
        v_destino, 'reserva_grupo', 'ls:pv:' || p_trip || ':' || v_uid || ':' || v_destino || ':' || md5(v_dato::text),
        jsonb_build_object('caso', v_caso, 'trip_id', p_trip, 'quien', v_nombre, 'quien_id', v_uid, 'inicial', public.inicial_de_email(v_uid),
          'para_txt', public.nombres_para_aviso(v_vis, v_destino), 'detalle', left(coalesce(p_detalle, ''), 200), 'suyo_cambiado', v_destino = any (v_tenian))
      ) on conflict (user_id, clave) do nothing;
    end if;
  end loop;
end $$;
revoke all on function public.poner_lo_suyo_para(uuid, jsonb, jsonb, uuid[], text) from public, anon;
grant execute on function public.poner_lo_suyo_para(uuid, jsonb, jsonb, uuid[], text) to authenticated;

commit;
