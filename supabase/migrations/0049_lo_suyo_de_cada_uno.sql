-- 0049 · EL VUELO Y EL ALOJAMIENTO DE CADA UNO, Y LAS ENTRADAS DE TODOS EN LAS CUENTAS (Tanda 10N5, §6c). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0035 (tipo `reserva_grupo`), la 0038 (`reservas_invitado`) y la 0042 (`dia_en_palabras`, `fecha_segura`).
--
-- Qué hace, en palabras sencillas:
--   * `lo_suyo_del_viaje`: el vuelo y el alojamiento que pone CADA persona para sí en un viaje compartido (también quien solo recomienda). Es suyo: solo lo ve y lo cambia ella. La ruta NO lo mira
--     (la ruta sigue al vuelo y al alojamiento del administrador, que viven en el propio viaje).
--   * `lo_suyo_del_grupo(viaje)`: quién tiene el suyo (sí/no, sin los datos), para que el administrador vea «Ana tiene su propio vuelo» y las cuentas saquen a Ana del reparto del vuelo del administrador.
--   * `entradas_del_grupo(viaje)`: las entradas que han reservado los invitados con «¿Para quién es?» (para varios), para que entren en las cuentas del grupo. Solo la ven los del viaje.
--   * Avisos (tipo `reserva_grupo`, la lista de tipos NO cambia; `payload.caso`): al administrador, «Ana ha puesto su propio vuelo.» (`vuelo_propio` / `alojamiento_propio`); a cada persona a la que el administrador
--     le pone el vuelo o el alojamiento, «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.» (`vuelo_cambiado` / `alojamiento_cambiado`), y se borra lo suyo (el del administrador manda desde ese momento).
--     Cada aviso lleva su `clave` con la huella de lo que dice, así que no se repite aunque se guarde dos veces lo mismo.
--
-- SI NO SE APLICA: cada uno puede poner lo suyo igual, pero solo se guarda en su propio móvil; el administrador no lo ve ni las cuentas lo tienen en cuenta, y no llegan los avisos.

begin;

create table if not exists public.lo_suyo_del_viaje (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vuelo jsonb,
  alojamiento jsonb,
  actualizado_en timestamptz not null default now(),
  primary key (trip_id, user_id)
);
alter table public.lo_suyo_del_viaje enable row level security;

drop policy if exists "lo_suyo select propio" on public.lo_suyo_del_viaje;
create policy "lo_suyo select propio" on public.lo_suyo_del_viaje for select to authenticated using (user_id = auth.uid());
drop policy if exists "lo_suyo insert propio" on public.lo_suyo_del_viaje;
create policy "lo_suyo insert propio" on public.lo_suyo_del_viaje for insert to authenticated
  with check (user_id = auth.uid() and (public.es_miembro(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.traveler_id = auth.uid())));
drop policy if exists "lo_suyo update propio" on public.lo_suyo_del_viaje;
create policy "lo_suyo update propio" on public.lo_suyo_del_viaje for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "lo_suyo delete propio" on public.lo_suyo_del_viaje;
create policy "lo_suyo delete propio" on public.lo_suyo_del_viaje for delete to authenticated using (user_id = auth.uid());

-- ── Quién tiene lo suyo (sin los datos) ─────────────────────────────────────────────────────────────────────────────────────────────

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
  ), '[]'::jsonb);
end $$;
revoke all on function public.lo_suyo_del_grupo(uuid) from public, anon;
grant execute on function public.lo_suyo_del_grupo(uuid) to authenticated;

-- ── Las entradas de los invitados reservadas para varias personas (para las cuentas) ───────────────────────────────────────────────

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
    )))
      from public.reservas_invitado r where r.trip_id = p_trip
  ), '[]'::jsonb);
end $$;
revoke all on function public.entradas_del_grupo(uuid) from public, anon;
grant execute on function public.entradas_del_grupo(uuid) to authenticated;

-- ── 1. Alguien pone lo suyo: «Ana ha puesto su propio vuelo.» (al administrador) ──────────────────────────────────────────────────

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

-- ── 2. El administrador pone el vuelo o el alojamiento «para todos / para algunos»: se cambia el de esas personas ─────────────────────

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
begin
  v_vuelo_antes := concat_ws('|', old.route ->> 'arrivalFlightTime', old.route ->> 'arrivalPointId', old.route ->> 'departureFlightTime', old.route ->> 'departurePointId', old.route #>> '{cuentasEntre,llegada}');
  v_vuelo_ahora := concat_ws('|', new.route ->> 'arrivalFlightTime', new.route ->> 'arrivalPointId', new.route ->> 'departureFlightTime', new.route ->> 'departurePointId', new.route #>> '{cuentasEntre,llegada}');
  select k into v_clave_aloj from jsonb_object_keys(coalesce(new.route -> 'cuentasEntre', '{}'::jsonb)) k where k like 'aloj-%' limit 1;
  v_para_a := case when v_clave_aloj is not null then new.route -> 'cuentasEntre' -> v_clave_aloj end;
  v_aloj_antes := coalesce(old.bookings -> 'accommodationSelections', '{}'::jsonb)::text || '|' || coalesce((select string_agg(k || '=' || (old.route -> 'cuentasEntre' ->> k), ',') from jsonb_object_keys(coalesce(old.route -> 'cuentasEntre', '{}'::jsonb)) k where k like 'aloj-%'), '');
  v_aloj_ahora := coalesce(new.bookings -> 'accommodationSelections', '{}'::jsonb)::text || '|' || coalesce((select string_agg(k || '=' || (new.route -> 'cuentasEntre' ->> k), ',') from jsonb_object_keys(coalesce(new.route -> 'cuentasEntre', '{}'::jsonb)) k where k like 'aloj-%'), '');
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.traveler_id;

  -- El vuelo (solo si hay una hora puesta y algo ha cambiado).
  if v_vuelo_ahora is distinct from v_vuelo_antes and (new.route ->> 'arrivalFlightTime' is not null or new.route ->> 'departureFlightTime' is not null) then
    for v_miembro in select m.user_id from public.trip_members m where m.trip_id = new.id and m.user_id <> new.traveler_id loop
      if jsonb_typeof(v_para_v) = 'array' and not (v_para_v ? v_miembro::text) then continue; end if;
      v_texto_para := case when jsonb_typeof(v_para_v) is distinct from 'array' then 'todos' when jsonb_array_length(v_para_v) <= 2 then 'ti' else 'algunos' end;
      update public.lo_suyo_del_viaje set vuelo = null, actualizado_en = now() where trip_id = new.id and user_id = v_miembro and vuelo is not null;
      insert into public.avisos (user_id, tipo, clave, payload) values (
        v_miembro, 'reserva_grupo', 'ls:vc:' || new.id || ':' || v_miembro || ':' || md5(v_vuelo_ahora),
        jsonb_build_object('caso', 'vuelo_cambiado', 'trip_id', new.id, 'quien', v_nombre, 'quien_id', new.traveler_id, 'inicial', public.inicial_de_email(new.traveler_id), 'para', v_texto_para)
      ) on conflict (user_id, clave) do nothing;
    end loop;
  end if;

  -- El alojamiento.
  if v_aloj_ahora is distinct from v_aloj_antes and coalesce(new.bookings -> 'accommodationSelections', '{}'::jsonb) <> '{}'::jsonb then
    for v_miembro in select m.user_id from public.trip_members m where m.trip_id = new.id and m.user_id <> new.traveler_id loop
      if jsonb_typeof(v_para_a) = 'array' and not (v_para_a ? v_miembro::text) then continue; end if;
      v_texto_para := case when jsonb_typeof(v_para_a) is distinct from 'array' then 'todos' when jsonb_array_length(v_para_a) <= 2 then 'ti' else 'algunos' end;
      update public.lo_suyo_del_viaje set alojamiento = null, actualizado_en = now() where trip_id = new.id and user_id = v_miembro and alojamiento is not null;
      insert into public.avisos (user_id, tipo, clave, payload) values (
        v_miembro, 'reserva_grupo', 'ls:ac:' || new.id || ':' || v_miembro || ':' || md5(v_aloj_ahora),
        jsonb_build_object('caso', 'alojamiento_cambiado', 'trip_id', new.id, 'quien', v_nombre, 'quien_id', new.traveler_id, 'inicial', public.inicial_de_email(new.traveler_id), 'para', v_texto_para)
      ) on conflict (user_id, clave) do nothing;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists avisar_lo_del_admin on public.trips;
create trigger avisar_lo_del_admin after update of route, bookings on public.trips for each row execute function public.avisar_lo_del_admin();

commit;
