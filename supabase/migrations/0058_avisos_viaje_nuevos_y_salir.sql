-- 0058 · LOS AVISOS DE «HA CAMBIADO EL VIAJE» SALEN COMO NUEVOS Y AL SALIR DEL VIAJE SE VAN SUS AVISOS (Tanda 10N8, apartados 2 y 4). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede repetir).
-- Va DESPUÉS de la 0036, la 0041, la 0046, la 0048 y la 0051 (cambia dos funciones suyas: `avisar_viaje_cambiado` y `sacar_del_viaje`). No toca tablas ni la lista de tipos de aviso (`avisos_tipo_check` se queda como la dejó la 0054:
-- recomendacion, aceptada, rechazada, unido, d10, resumen, sorpresas, sorteo, amigo_viaje, permiso, quitado, viaje_cambiado, sin_enviar, reserva_grupo, gasto_pendiente, gasto_resuelto, pago_marcado, cuentas_modo).
--
-- Qué pasaba (por qué al invitado no le llegaban «quitar un día», «cambiar el orden de los días», «añadir un restaurante» ni «añadir sitios»):
--   · La app solo apuntaba lo que había hecho quien cambia el viaje (`route.ultimoCambio`) en las acciones «con nombre propio» (Free Tour, excursión, volver a la ruta inicial…). Esas son las que sí llegaban.
--   · Todo lo demás llegaba a la base de datos sin eso, y la 0051 lo JUNTABA con el aviso anterior de la misma persona sin leer (15 minutos) actualizándolo por dentro: el aviso seguía siendo el mismo (mismo id), así que
--     en el móvil del invitado ni salía la franja ni sonaba ni subía el punto de la campana, y encima conservaba la frase del primero («Eric ha vuelto a la ruta inicial»).
--   · Y añadir solo un restaurante ni se veía: el disparador mira las paradas, y un restaurante elegido no es una parada.
-- Qué hace ahora:
--   1. La app (src/lib/sellarCambio.ts) apunta en cada guardado lo que ha pasado, con un `id` nuevo; aquí eso es un aviso NUEVO (otro id: franja, sonido y punto de la campana) con la frase de lo último que ha pasado.
--   2. Los cambios seguidos de la misma persona se juntan 2 minutos (antes 15): el aviso anterior sin leer se sustituye por el nuevo, así la campana no se llena. Un cambio con nombre propio sigue siendo su propio aviso.
--   3. Los pasos siguientes de una misma acción (mismo `id`) siguen juntándose en el aviso de esa acción, como antes.
--   4. Nadie recibe el aviso de lo que ha hecho él mismo (como antes: `if v_dest = v_actor then continue`).
--   5. Al salir del viaje, o al quitarte, sus avisos desaparecen de tu campana (menos «Ya no formas parte del viaje…», que se crea después).

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
      -- Una acción nueva de la persona. Sin nombre propio: sustituye al aviso anterior suyo sin leer de los últimos 2 minutos (la campana no se llena) y sale como NUEVO (otro id).
      -- Con nombre propio (Free Tour, excursión…): su propio aviso, no se junta con ninguno.
      if not v_con_nombre then
        delete from public.avisos a
         where a.user_id = v_dest and a.tipo = 'viaje_cambiado' and a.leido_en is null and a.payload ->> 'trip_id' = new.id::text and a.payload ->> 'quien_id' = v_actor::text
           and a.creado_en > now() - interval '2 minutes' and jsonb_typeof(a.payload #> '{cambio,accion}') is distinct from 'object';
      end if;
    else
      -- Un paso más de la MISMA acción (o de un móvil viejo que no apunta nada): se junta con el aviso anterior sin leer de esa persona (2 minutos).
      select * into v_previo from public.avisos a
       where a.user_id = v_dest and a.tipo = 'viaje_cambiado' and a.leido_en is null and a.payload ->> 'trip_id' = new.id::text and a.payload ->> 'quien_id' = v_actor::text and a.creado_en > now() - interval '2 minutes'
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

-- ── Al salir (o al quitarte), sus avisos se van de tu campana ───────────────────────────────────────────────────────────────────────────────
-- Es la `sacar_del_viaje` de la 0041 con un paso más: los avisos de ese viaje (cambios, cuentas, entradas, permisos, propuestas…) se ocultan para quien sale (`oculto_en`, como «Eliminar»; necesita la 0046).
-- Solo se queda «Ya no formas parte del viaje…», que se crea después.
create or replace function public.sacar_del_viaje(p_trip uuid, p_user uuid, p_aviso boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pase uuid;
  v_filas integer;
  v_devuelta boolean := false;
  v_destino text;
  v_admin text;
  v_borradas integer := 0;
begin
  v_pase := public.pase_de_miembro(p_trip, p_user);
  delete from public.trip_members where trip_id = p_trip and user_id = p_user;
  get diagnostics v_filas = row_count;
  if v_filas = 0 then return jsonb_build_object('quitado', false); end if;
  update public.avisos set leido_en = coalesce(leido_en, now())
   where tipo = 'recomendacion' and clave in (select 'rec:' || r.id from public.trip_recommendations r where r.trip_id = p_trip and r.author_id = p_user and r.estado = 'pendiente');
  delete from public.trip_recommendations where trip_id = p_trip and author_id = p_user and estado = 'pendiente';
  get diagnostics v_borradas = row_count;
  -- (10N8 §2) Sus avisos de ese viaje se van de su campana.
  update public.avisos set oculto_en = coalesce(oculto_en, now()), leido_en = coalesce(leido_en, now())
   where user_id = p_user and tipo <> 'quitado' and payload ->> 'trip_id' = p_trip::text;
  if v_pase is not null then
    delete from public.pass_members pm using public.passes p where pm.pass_id = p.id and pm.pass_id = v_pase and pm.user_id = p_user and p.comprador_id <> p_user;
    get diagnostics v_filas = row_count;
    if v_filas > 0 then
      update public.passes set usos_usados = greatest(usos_usados - 1, 0) where id = v_pase;
      v_devuelta := true;
    end if;
  end if;
  update public.trip_invitations set usos_usados = greatest(usos_usados - 1, 0)
   where id = (select i.id from public.trip_invitations i where i.trip_id = p_trip and i.usos_usados > 0 and (v_pase is null or i.pass_id is not distinct from v_pase) order by i.created_at desc limit 1);
  if p_aviso then
    select route ->> 'destination' into v_destino from public.trips where id = p_trip;
    select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_admin from public.travelers where id = auth.uid();
    insert into public.avisos (user_id, tipo, clave, payload)
    values (p_user, 'quitado', 'quitado:' || p_trip || ':' || p_user || ':' || gen_random_uuid(), jsonb_build_object('trip_id', p_trip, 'destino', v_destino, 'admin', v_admin));
  end if;
  return jsonb_build_object('quitado', true, 'plaza_devuelta', v_devuelta, 'propuestas_borradas', v_borradas);
end $$;
revoke all on function public.sacar_del_viaje(uuid, uuid, boolean) from public, anon, authenticated;

commit;
