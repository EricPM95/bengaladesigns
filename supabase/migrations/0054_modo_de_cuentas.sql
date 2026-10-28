-- 0054 · CÓMO SE LLEVAN LAS CUENTAS DEL VIAJE (Tanda 10N7, §2 y §2b-2). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0040 (que fija la lista de tipos de aviso) y de la 0027 (`avisar_union`). NO edita esas migraciones: reemplaza sus funciones y la lista de tipos.
--
-- Dónde se guarda el modo: DENTRO del viaje, en la ruta (`trips.route`), igual que «¿Entre quién?» de las cuentas: `modoCuentas` ('conjunta' | 'cada_uno'), `modoElegidoCon` (cuánta gente había cuando el administrador
-- eligió) y `nombreCuenta` («Nuestro viaje a Roma»). Así viaja con el viaje compartido y llega en directo a todos por el mismo Realtime de `trips`; no hace falta ninguna columna nueva.
--
-- Qué hace esta migración, en palabras sencillas:
--   * Nuevo tipo de aviso `cuentas_modo`: a todos los del viaje (menos a quien lo cambia) les llega «Eric ha cambiado las cuentas a cuenta conjunta.» / «…a cada uno lo suyo.».
--     Solo avisa cuando el modo cambia de verdad (elegir lo mismo que ya había, o lo que sale por defecto, no avisa). Varios cambios seguidos (15 minutos, sin leer) se quedan en el último.
--   * El aviso `unido` («Ana se ha unido a tu viaje») lleva `pregunta_cuentas` = true cuando al administrador hay que preguntarle «¿Cómo lleváis las cuentas?»:
--       - entra la primera persona a un viaje de una sola persona y aún no se ha elegido; o
--       - entra un tercero (o más) a una cuenta conjunta (se vuelve a preguntar; mientras no elija, sigue como estaba).
--   * Dos funciones puras que repiten lo que hace `src/lib/modoCuentas.ts`: `modo_cuentas_defecto(ruta)` y `cuentas_por_preguntar(ruta, personas)`.
--
-- SI NO SE APLICA: el modo se guarda y se ve igual en la app (va dentro de la ruta), pero no llegan los avisos «ha cambiado las cuentas» ni la pregunta en «se ha unido».

begin;

-- ── 1. El tipo de aviso nuevo (todos los de la 0040 más `cuentas_modo`) ──────────────────────────────────────────────────────────

alter table public.avisos drop constraint if exists avisos_tipo_check;
alter table public.avisos
  add constraint avisos_tipo_check
  check (tipo in ('recomendacion', 'aceptada', 'rechazada', 'unido', 'd10', 'resumen', 'sorpresas', 'sorteo', 'amigo_viaje',
                  'permiso', 'quitado', 'viaje_cambiado', 'sin_enviar', 'reserva_grupo', 'gasto_pendiente', 'gasto_resuelto', 'pago_marcado', 'cuentas_modo'));

-- ── 2. Lo que sale por defecto y cuándo hay que preguntar (la misma regla que en la app) ────────────────────────────────────────

-- Pareja y familia: cuenta conjunta. Amigos y solo: cada uno lo suyo (si viaja una sola persona, la app ni lo enseña).
create or replace function public.modo_cuentas_defecto(p_route jsonb) returns text
language sql immutable as $$
  select case p_route #>> '{answers,companion}' when 'couple' then 'conjunta' when 'family' then 'conjunta' else 'cada_uno' end
$$;

-- ¿Hay que preguntarle al administrador «¿Cómo lleváis las cuentas?» con `p_personas` en el viaje?
create or replace function public.cuentas_por_preguntar(p_route jsonb, p_personas integer) returns boolean
language plpgsql immutable as $$
declare
  v_elegido text := p_route ->> 'modoCuentas';
  v_con integer := coalesce(nullif(p_route ->> 'modoElegidoCon', '')::integer, 0);
  v_comp text := p_route #>> '{answers,companion}';
  v_ninos integer := case when jsonb_typeof(p_route #> '{answers,companionChildrenAges}') = 'array' then jsonb_array_length(p_route #> '{answers,companionChildrenAges}') else 0 end;
  v_esperadas integer;
begin
  if p_personas <= 1 then return false; end if;
  -- Elegido a mano: solo se vuelve a preguntar si es conjunta y entra alguien más (a partir de tres).
  if v_elegido in ('conjunta', 'cada_uno') then return v_elegido = 'conjunta' and p_personas >= 3 and p_personas > v_con; end if;
  if v_comp = 'couple' then return p_personas > 2; end if;
  if v_comp = 'family' then
    v_esperadas := greatest(2, coalesce(nullif(p_route #>> '{answers,companionAdults}', '')::integer, 0) + v_ninos);
    return p_personas > v_esperadas;
  end if;
  if v_comp = 'group' then return false; end if;
  -- Un viaje de una persona al que entra alguien: no sabemos si son pareja o amigos.
  return true;
end $$;

-- ── 3. «Ana se ha unido a tu viaje. ¿Cómo lleváis las cuentas?» (reemplaza la de la 0027) ──────────────────────────────────

create or replace function public.avisar_union() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_ruta jsonb;
  v_nombre text;
  v_personas integer;
begin
  select traveler_id, route into v_owner, v_ruta from public.trips where id = new.trip_id;
  if v_owner is null or v_owner = new.user_id then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.user_id;
  -- El administrador y los invitados (la fila nueva ya cuenta).
  select 1 + count(*) into v_personas from public.trip_members where trip_id = new.trip_id and user_id <> v_owner;
  insert into public.avisos (user_id, tipo, clave, payload)
  values (v_owner, 'unido', 'unido:' || new.trip_id || ':' || new.user_id,
          jsonb_build_object('trip_id', new.trip_id, 'persona_id', new.user_id, 'nombre', v_nombre, 'inicial', public.inicial_de_email(new.user_id),
                             'pregunta_cuentas', public.cuentas_por_preguntar(coalesce(v_ruta, '{}'::jsonb), v_personas)))
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists avisar_union on public.trip_members;
create trigger avisar_union after insert on public.trip_members for each row execute function public.avisar_union();

-- ── 4. «Eric ha cambiado las cuentas a cuenta conjunta.» ──────────────────────────────────────────────────────────────────────

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
    -- Varios cambios seguidos de la misma persona sin leer: se queda el último.
    delete from public.avisos a
     where a.user_id = v_dest and a.tipo = 'cuentas_modo' and a.leido_en is null and a.payload ->> 'trip_id' = new.id::text
       and a.payload ->> 'quien_id' = v_actor::text and a.creado_en > now() - interval '15 minutes';
    insert into public.avisos (user_id, tipo, clave, payload)
    values (v_dest, 'cuentas_modo', 'cm:' || new.id || ':' || v_actor || ':' || gen_random_uuid(),
            jsonb_build_object('trip_id', new.id, 'destino', new.route ->> 'destination', 'quien', v_nombre, 'quien_id', v_actor, 'inicial', public.inicial_de_email(v_actor), 'modo', v_ahora));
  end loop;
  return new;
end $$;
drop trigger if exists avisar_cuentas_modo on public.trips;
create trigger avisar_cuentas_modo after update of route on public.trips for each row execute function public.avisar_cuentas_modo();

commit;
