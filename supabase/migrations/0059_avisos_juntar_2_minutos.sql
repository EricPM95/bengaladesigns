-- 0059 · LOS AVISOS DEL VUELO, EL ALOJAMIENTO Y LAS CUENTAS DEL ADMINISTRADOR SE JUNTAN 2 MINUTOS Y CADA CAMBIO VUELVE A SALIR COMO NUEVO (Tanda 10N8, apartados 0a y 0b). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede repetir).
-- Va DESPUÉS de la 0053 y la 0054 (cambia una función de cada una; no las edita). No toca tablas ni la lista de tipos de aviso (`avisos_tipo_check` se queda como la dejó la 0054).
--
-- Qué pasaba: la 0053 (vuelo y alojamiento del administrador) juntaba los cambios seguidos durante 15 minutos ACTUALIZANDO el aviso que ya estaba, con el mismo id: en el móvil del invitado ni salía la franja, ni sonaba, ni el
-- punto de la campana volvía a subir. La 0054 («ha cambiado las cuentas») ya borraba el anterior y creaba uno nuevo (por eso sí salía como nuevo), pero también durante 15 minutos.
-- Qué hace ahora, las dos igual: los cambios seguidos de la misma persona se juntan durante 2 minutos —el aviso anterior sin leer se sustituye por el nuevo— y el nuevo es un aviso nuevo (otro id), con franja, sonido y punto de la campana,
-- con la frase de lo último que ha pasado.

begin;

-- ── 1. Vuelo y alojamiento del administrador ───────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.dejar_aviso_de_lo_suyo(p_miembro uuid, p_trip uuid, p_caso text, p_actor uuid, p_nombre text, p_para text, p_suyo boolean, p_huella text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_previo public.avisos%rowtype;
  v_clave text := case when p_caso = 'vuelo_cambiado' then 'ls:vc:' else 'ls:ac:' end || p_trip || ':' || p_miembro || ':' || p_huella;
  v_payload jsonb;
begin
  select * into v_previo from public.avisos a
   where a.user_id = p_miembro and a.tipo = 'reserva_grupo' and a.leido_en is null and a.payload ->> 'caso' = p_caso
     and a.payload ->> 'trip_id' = p_trip::text and a.payload ->> 'quien_id' = p_actor::text and a.creado_en > now() - interval '2 minutes'
   order by a.creado_en desc limit 1;
  v_payload := jsonb_build_object('caso', p_caso, 'trip_id', p_trip, 'quien', p_nombre, 'quien_id', p_actor, 'inicial', public.inicial_de_email(p_actor), 'para', p_para,
    'suyo_cambiado', p_suyo or coalesce((v_previo.payload ->> 'suyo_cambiado')::boolean, false));
  -- El anterior (sin leer, de hace menos de 2 minutos) se sustituye por el nuevo: otro id, así vuelve a salir la franja, suena y sube el punto.
  if v_previo.id is not null then
    delete from public.avisos where id = v_previo.id;
  end if;
  insert into public.avisos (user_id, tipo, clave, payload) values (p_miembro, 'reserva_grupo', v_clave, v_payload) on conflict (user_id, clave) do nothing;
end $$;
revoke all on function public.dejar_aviso_de_lo_suyo(uuid, uuid, text, uuid, text, text, boolean, text) from public, anon, authenticated;

-- ── 2. «Eric ha cambiado las cuentas a cuenta conjunta.» ──────────────────────────────────────────────────────────────────────────────────────
create or replace function public.avisar_cuentas_modo() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_ahora text := new.route ->> 'modoCuentas';
  v_antes text := coalesce(old.route ->> 'modoCuentas', public.modo_cuentas_defecto(old.route));
  v_nombre text;
  v_dest uuid;
begin
  if v_actor is null or v_ahora is null or v_ahora not in ('conjunta', 'cada_uno') or v_ahora = v_antes then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = v_actor;
  for v_dest in select new.traveler_id union select m.user_id from public.trip_members m where m.trip_id = new.id loop
    if v_dest = v_actor then continue; end if;
    -- Varios cambios seguidos de la misma persona sin leer (2 minutos): se queda el último, y sale como nuevo.
    delete from public.avisos a
     where a.user_id = v_dest and a.tipo = 'cuentas_modo' and a.leido_en is null and a.payload ->> 'trip_id' = new.id::text
       and a.payload ->> 'quien_id' = v_actor::text and a.creado_en > now() - interval '2 minutes';
    insert into public.avisos (user_id, tipo, clave, payload)
    values (v_dest, 'cuentas_modo', 'cm:' || new.id || ':' || v_actor || ':' || gen_random_uuid(),
            jsonb_build_object('trip_id', new.id, 'destino', new.route ->> 'destination', 'quien', v_nombre, 'quien_id', v_actor, 'inicial', public.inicial_de_email(v_actor), 'modo', v_ahora));
  end loop;
  return new;
end $$;
drop trigger if exists avisar_cuentas_modo on public.trips;
create trigger avisar_cuentas_modo after update of route on public.trips for each row execute function public.avisar_cuentas_modo();

commit;
