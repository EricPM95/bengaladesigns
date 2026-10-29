-- 0065 · CADA CAMBIO DEL VIAJE ES UN AVISO NUEVO Y EL VUELO DEL INVITADO LE LLEGA AL ADMINISTRADOR (Tanda 10N10, apartado 1). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Va DESPUÉS de la 0058, la 0059 y la 0061 (cambia tres funciones suyas; no las edita). No toca tablas ni la lista de tipos de aviso.
--
-- Qué pasaba:
--   1. La 0058 sustituía el aviso anterior sin leer de la misma persona (2 minutos) por el nuevo: con dos cambios seguidos el primero DESAPARECÍA de la campana («Ha cambiado el viaje» pasaba a «Eric ha quitado el Free Tour») y el segundo,
--      al llegar enseguida, no sonaba. Y un paso sin `ultimoCambio` nuevo se juntaba con CUALQUIER aviso anterior sin leer, aunque fuese de otra acción.
--   2. «Solo para mí» en una cuenta conjunta no avisaba a nadie (0061, `poner_lo_suyo_para`): el invitado ponía su vuelo y al administrador no le llegaba nada.
-- Qué hace ahora:
--   * Cada cambio nuevo (otro `ultimoCambio.id`) es SIEMPRE un aviso nuevo; no borra ni sustituye ninguno. Solo los pasos siguientes de la MISMA acción (mismo id, p. ej. rehacer los días uno a uno) se juntan en el aviso de esa acción;
--     un móvil viejo que no apunta nada se junta con el último aviso suyo sin cambio propio (2 minutos).
--   * El vuelo que alguien del viaje pone solo para sí avisa siempre al administrador, también en la cuenta conjunta: «Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.» (lo suyo en dinero sigue privado;
--     el alojamiento «solo para mí» de una cuenta conjunta sigue sin avisar, como decidió la 10N7).

begin;

create or replace function public.avisar_viaje_cambiado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_old integer := jsonb_array_length(coalesce(old.route -> 'days', '[]'::jsonb));
  v_new integer := jsonb_array_length(coalesce(new.route -> 'days', '[]'::jsonb));
  v_ini_old text := old.route #>> '{answers,dateRange,start}';
  v_fin_old text := old.route #>> '{answers,dateRange,end}';
  v_ini_new text := new.route #>> '{answers,dateRange,start}';
  v_fin_new text := new.route #>> '{answers,dateRange,end}';
  v_fechas boolean;
  v_inicio date;
  v_anadidas jsonb;
  v_quitadas jsonb;
  v_movidas integer;
  v_mov_lista jsonb;
  v_reordenado boolean;
  v_nombre text;
  v_payload jsonb;
  v_cambio jsonb := new.route -> 'ultimoCambio';
  v_cambio_nuevo boolean;
  v_con_nombre boolean;
  v_dest uuid;
  v_previo public.avisos%rowtype;
  v_dias_antes integer;
  v_ini_antes text;
  v_fin_antes text;
begin
  if v_actor is null or new.route is not distinct from old.route then return new; end if;
  v_cambio_nuevo := v_cambio is not null and jsonb_typeof(v_cambio) = 'object' and (v_cambio ->> 'id') is not null
                    and (v_cambio ->> 'id') is distinct from (old.route -> 'ultimoCambio' ->> 'id');
  v_con_nombre := v_cambio_nuevo and coalesce(jsonb_typeof(v_cambio -> 'accion') = 'object', false);
  v_fechas := v_ini_old is distinct from v_ini_new or (v_fin_old is distinct from v_fin_new and v_old = v_new);
  begin
    v_inicio := v_ini_new::date;
  exception when others then
    v_inicio := null;
  end;
  select coalesce(jsonb_agg(jsonb_build_object('nombre', a.nombre, 'dia_n', a.dn, 'fecha', case when v_inicio is not null then (v_inicio + (a.dn - 1))::text end) order by a.dn, a.ord), '[]'::jsonb)
    into v_anadidas from public.paradas_de_ruta(new.route) a where not exists (select 1 from public.paradas_de_ruta(old.route) o where lower(o.nombre) = lower(a.nombre));
  select coalesce(jsonb_agg(jsonb_build_object('nombre', o.nombre) order by o.dn, o.ord), '[]'::jsonb)
    into v_quitadas from public.paradas_de_ruta(old.route) o where not exists (select 1 from public.paradas_de_ruta(new.route) a where lower(a.nombre) = lower(o.nombre));
  select count(*) into v_movidas from public.paradas_de_ruta(new.route) a join public.paradas_de_ruta(old.route) o on lower(o.nombre) = lower(a.nombre) where o.dn is distinct from a.dn;
  select coalesce(jsonb_agg(jsonb_build_object('nombre', a.nombre, 'dia_n', a.dn, 'fecha', case when v_inicio is not null then (v_inicio + (a.dn - 1))::text end) order by a.dn, a.ord), '[]'::jsonb)
    into v_mov_lista from public.paradas_de_ruta(new.route) a join public.paradas_de_ruta(old.route) o on lower(o.nombre) = lower(a.nombre) where o.dn is distinct from a.dn;
  select exists (
    select 1 from public.paradas_de_ruta(new.route) a join public.paradas_de_ruta(old.route) o on lower(o.nombre) = lower(a.nombre) and o.dn = a.dn
    where o.ord is distinct from a.ord and v_movidas = 0 and jsonb_array_length(v_anadidas) = 0 and jsonb_array_length(v_quitadas) = 0
  ) into v_reordenado;
  if not v_cambio_nuevo and v_old = v_new and not v_fechas and jsonb_array_length(v_anadidas) = 0 and jsonb_array_length(v_quitadas) = 0 and v_movidas = 0 and not v_reordenado then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = v_actor;
  v_payload := jsonb_build_object('trip_id', new.id, 'destino', new.route ->> 'destination', 'quien', v_nombre, 'quien_id', v_actor, 'inicial', public.inicial_de_email(v_actor),
    'dias_antes', v_old, 'inicio_antes', v_ini_old, 'fin_antes', v_fin_old,
    'dias_quitados', greatest(v_old - v_new, 0), 'dias_anadidos', greatest(v_new - v_old, 0), 'fechas', v_fechas,
    'anadidas', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(v_anadidas) e limit 6) q),
    'quitadas', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(v_quitadas) e limit 6) q),
    'movidas', v_movidas, 'reordenado', v_reordenado,
    'movidas_lista', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(v_mov_lista) e limit 6) q));
  if v_cambio_nuevo then v_payload := v_payload || jsonb_build_object('cambio', v_cambio); end if;
  for v_dest in
    select new.traveler_id union select m.user_id from public.trip_members m where m.trip_id = new.id
  loop
    if v_dest = v_actor then continue; end if;
    v_previo := null;
    if v_cambio_nuevo then
      -- Una acción nueva de la persona: SIEMPRE su propio aviso (otro id, con franja, sonido y punto de la campana). Ya no sustituye al anterior por tiempo (0058 lo hacía 2 minutos).
      null;
    else
      -- Un paso más de la MISMA acción (o de un móvil viejo que no apunta nada): se junta con el aviso anterior sin leer de esa persona (2 minutos).
      select * into v_previo from public.avisos a
       where a.user_id = v_dest and a.tipo = 'viaje_cambiado' and a.leido_en is null and a.payload ->> 'trip_id' = new.id::text and a.payload ->> 'quien_id' = v_actor::text and a.creado_en > now() - interval '2 minutes'
         and ((v_cambio is not null and a.payload #>> '{cambio,id}' = v_cambio ->> 'id') or (v_cambio is null and a.payload -> 'cambio' is null))
       order by a.creado_en desc limit 1;
    end if;
    if v_previo.id is not null then
      v_dias_antes := coalesce((v_previo.payload ->> 'dias_antes')::integer, v_old);
      v_ini_antes := coalesce(v_previo.payload ->> 'inicio_antes', v_ini_old);
      v_fin_antes := coalesce(v_previo.payload ->> 'fin_antes', v_fin_old);
      update public.avisos set creado_en = now(), payload = (
        jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
          v_previo.payload,
          '{dias_antes}', to_jsonb(v_dias_antes)),
          '{inicio_antes}', coalesce(to_jsonb(v_ini_antes), 'null'::jsonb)),
          '{fin_antes}', coalesce(to_jsonb(v_fin_antes), 'null'::jsonb)),
          '{dias_quitados}', to_jsonb(greatest(v_dias_antes - v_new, 0))),
          '{dias_anadidos}', to_jsonb(greatest(v_new - v_dias_antes, 0))),
          '{fechas}', to_jsonb(v_ini_antes is distinct from v_ini_new or (v_fin_antes is distinct from v_fin_new and v_dias_antes = v_new))),
          '{movidas_lista}', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements((v_payload -> 'movidas_lista') || coalesce(v_previo.payload -> 'movidas_lista', '[]'::jsonb)) e limit 6) q)),
          '{movidas}', to_jsonb(coalesce((v_previo.payload ->> 'movidas')::integer, 0) + v_movidas)),
          '{reordenado}', to_jsonb(coalesce((v_previo.payload ->> 'reordenado')::boolean, false) or v_reordenado)),
          '{anadidas}', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(coalesce(v_previo.payload -> 'anadidas', '[]'::jsonb) || (v_payload -> 'anadidas')) e limit 6) q)),
          '{quitadas}', (select coalesce(jsonb_agg(e), '[]'::jsonb) from (select e from jsonb_array_elements(coalesce(v_previo.payload -> 'quitadas', '[]'::jsonb) || (v_payload -> 'quitadas')) e limit 6) q))
      )
      where id = v_previo.id;
    else
      insert into public.avisos (user_id, tipo, clave, payload)
      values (v_dest, 'viaje_cambiado', 'vc:' || new.id || ':' || v_actor || ':' || gen_random_uuid(), v_payload);
    end if;
  end loop;
  return new;
end $$;

create or replace function public.avisar_lo_suyo_propio() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_dueno uuid;
  v_ruta jsonb;
  v_nombre text;
  v_destino text;
  v_inicio date;
  v_conj boolean;
begin
  -- (10N8) Lo escribe `poner_lo_suyo_para`, que ya avisa una sola vez con ida y vuelta juntas.
  if coalesce(current_setting('jutrip.sin_aviso_propio', true), '') = '1' then return new; end if;
  select traveler_id, route into v_dueno, v_ruta from public.trips where id = new.trip_id;
  if v_dueno is null or v_dueno = new.user_id then return new; end if;
  v_conj := public.modo_cuentas_del_viaje(v_ruta) = 'conjunta';
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
  if not v_conj and new.alojamiento is not null and (tg_op = 'INSERT' or new.alojamiento is distinct from old.alojamiento) then
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
  if v_conjunta and array_length(v_vis, 1) = 1 and p_vuelo is null then return; end if;
  foreach v_destino in array (select array_agg(distinct x) from unnest(v_vis || v_dueno) x) loop
    if v_destino = v_uid then continue; end if;
    if array_length(v_vis, 1) = 1 then
      -- Lo puso solo para sí: al administrador le llega el de siempre, «Ana ha puesto su propio vuelo.».
      insert into public.avisos (user_id, tipo, clave, payload) values (
        v_destino, 'reserva_grupo', 'ls:' || case when p_vuelo is not null then 'v' else 'a' end || ':' || p_trip || ':' || v_uid || ':' || md5(v_dato::text),
        jsonb_build_object('caso', case when p_vuelo is not null then 'vuelo_propio' else 'alojamiento_propio' end, 'trip_id', p_trip, 'quien', v_nombre, 'quien_id', v_uid, 'inicial', public.inicial_de_email(v_uid), 'detalle', left(coalesce(p_detalle, ''), 200)) || case when p_vuelo is not null then jsonb_build_object('con_horas', true) else '{}'::jsonb end
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
