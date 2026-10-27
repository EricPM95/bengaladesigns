-- Tanda 10N5 (apartados 2 y 2b): el aviso de «ha cambiado el viaje» dice lo que de verdad ha pasado.
-- Va DESPUÉS de la 0036 (que crea `avisar_viaje_cambiado`) y de la 0046. Solo cambia esa función; no toca tablas ni la lista de tipos de aviso.
--
-- Qué cambia:
--   1. Si el móvil de quien guarda el viaje apunta en la ruta lo que ha hecho (`route.ultimoCambio`, con su `id` nuevo), el aviso lo copia tal cual a `payload.cambio` y el texto sale de ahí
--      («Eric ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.», «Eric ha cambiado el sábado 14 a día de excursión (Pompeya y Sorrento).», «Eric ha vuelto a la ruta inicial.»).
--      Un cambio con nombre propio es siempre su propio aviso: no se junta con otro.
--   2. Sin `ultimoCambio` nuevo (un móvil viejo, o un paso más de la misma acción), todo sigue como en la 0036 pero ARREGLADO: los días quitados/añadidos y las fechas se miran contra cómo estaba el viaje
--      ANTES del primer cambio de la tanda (`dias_antes`, `inicio_antes`, `fin_antes`), así que quitar un día y volver a ponerlo no dice «ha quitado un día, ha añadido un día, ha cambiado las fechas».
--      Y si hay un aviso sin leer de la misma persona de los últimos 15 minutos, el paso se junta con él en vez de crear otro.
--   3. Las paradas se comparan por nombre (no por id): al rehacer un día la app les pone otro id y todo parecía «quitado» y «añadido». El texto (shared/avisos/textos.js) separa lo movido de lo quitado.

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
  v_dest uuid;
  v_previo public.avisos%rowtype;
  v_dias_antes integer;
  v_ini_antes text;
  v_fin_antes text;
begin
  if v_actor is null or new.route is not distinct from old.route then return new; end if;
  -- ¿Es una acción nueva de quien guarda? (su `id` no es el que ya llevaba la ruta de antes)
  v_cambio_nuevo := v_cambio is not null and jsonb_typeof(v_cambio) = 'object' and (v_cambio ->> 'id') is not null
                    and (v_cambio ->> 'id') is distinct from (old.route -> 'ultimoCambio' ->> 'id');
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
    -- Un cambio con nombre propio es SU aviso. Los demás pasos seguidos de la misma persona (15 minutos) y sin leer se juntan en UN solo aviso.
    if not v_cambio_nuevo then
      select * into v_previo from public.avisos a
       where a.user_id = v_dest and a.tipo = 'viaje_cambiado' and a.leido_en is null and a.payload ->> 'trip_id' = new.id::text and a.payload ->> 'quien_id' = v_actor::text and a.creado_en > now() - interval '15 minutes'
       order by a.creado_en desc limit 1;
    end if;
    if v_previo.id is not null then
      -- Lo de antes del PRIMER cambio de la tanda manda: los días y las fechas se miran contra eso, no se suman (quitar un día y volver a ponerlo = nada).
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
