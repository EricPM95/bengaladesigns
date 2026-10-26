-- 0042 · LOS AVISOS DE LAS ENTRADAS, CREADOS POR LA BASE DE DATOS (Tanda 10N3, §3). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0035 (tipo `reserva_grupo`), la 0036 (`paradas_de_ruta`) y la 0038 (`reservas_invitado`).
--
-- Qué hace, en palabras sencillas: hasta ahora «Eric ha reservado el Coliseo para ti…» lo calculaba cada móvil al abrir la app. Ahora lo crea la base de datos en cuanto el dueño guarda la entrada, así
-- llega a la campanita (y al aviso del móvil) también con la app cerrada. Dos disparadores, los dos con el tipo `reserva_grupo` (la lista de tipos NO cambia) y un `payload.caso`:
--   * `incluido` / `no_incluido`: sobre `trips.bookings`. Cuando el dueño guarda (o cambia el día o la hora de) una entrada con «¿Para quién es?» (`paraQuien`), cada miembro del viaje recibe su aviso: a quien
--     está marcado, «Eric ha reservado el Coliseo para ti: jueves 26, 8:00.»; a quien no, «…el jueves 26 a las 8:00.» (con [Reservar la mía a la misma hora] y [Ya la tengo] en la app).
--   * `no_cuadra`: sobre `reservas_invitado`. Cuando un invitado guarda su entrada y cae en un día distinto de aquel en que la ruta tiene ese sitio: «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26.»
--     (con los datos para [Proponer el cambio]: sitio, día de la reserva y día de la ruta).
-- Cada aviso lleva su `clave` (no se repite aunque se guarde dos veces lo mismo) y el móvil no vuelve a calcularlo si ya tiene el del servidor (mismo `reserva_id`).
--
-- SI NO SE APLICA: todo funciona igual, solo que esos avisos los sigue calculando cada móvil al abrir la app (y no llegan con la app cerrada).

begin;

-- «jueves 26» (con fecha) o «día 2» (sin ella).
create or replace function public.dia_en_palabras(p_fecha date, p_dia integer) returns text
language sql immutable as $$
  select case
    when p_fecha is not null then (array['domingo','lunes','martes','miércoles','jueves','viernes','sábado'])[extract(dow from p_fecha)::int + 1] || ' ' || extract(day from p_fecha)::int
    when p_dia is not null then 'día ' || p_dia
    else '' end
$$;

create or replace function public.fecha_segura(p_texto text) returns date
language plpgsql immutable as $$
begin
  return nullif(p_texto, '')::date;
exception when others then
  return null;
end $$;

-- ── 1. El dueño guarda una entrada para varias personas ───────────────────────────────────────────────────────────────────────────────

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
    -- (Solo si es nueva o ha cambiado a quién cubre, el día o la hora.)
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
          'sitio', coalesce(nullif(r ->> 'shortName', ''), r ->> 'name'), 'sitio_nombre', r ->> 'name',
          'dia', v_dia_txt, 'date_iso', r ->> 'dateIso', 'day_number', v_dia, 'hora', r ->> 'time')
      ) on conflict (user_id, clave) do nothing;
    end loop;
  end loop;
  return new;
end $$;
drop trigger if exists avisar_reservas_grupo on public.trips;
create trigger avisar_reservas_grupo after update of bookings on public.trips for each row execute function public.avisar_reservas_grupo();

-- ── 2. Un invitado guarda una entrada que no cuadra con la ruta ─────────────────────────────────────────────────────────────────────

create or replace function public.avisar_entrada_no_cuadra() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  v_ruta jsonb;
  v_inicio date;
  v_fecha date;
  v_dia_reserva integer;
  v_dia_ruta integer;
begin
  select route into v_ruta from public.trips where id = new.trip_id;
  if v_ruta is null then return new; end if;
  v_inicio := public.fecha_segura(v_ruta #>> '{answers,dateRange,start}');
  for r in select e from jsonb_array_elements(coalesce(new.reservas, '[]'::jsonb)) e loop
    if r ->> 'kind' is distinct from 'entrada' then continue; end if;
    if tg_op = 'UPDATE' and exists (
      select 1 from jsonb_array_elements(coalesce(old.reservas, '[]'::jsonb)) o
      where o ->> 'id' = r ->> 'id' and (o ->> 'dateIso') is not distinct from (r ->> 'dateIso') and (o ->> 'dayNumber') is not distinct from (r ->> 'dayNumber')
    ) then continue; end if;
    v_fecha := public.fecha_segura(r ->> 'dateIso');
    v_dia_reserva := case when v_inicio is not null and v_fecha is not null then (v_fecha - v_inicio) + 1 else nullif(r ->> 'dayNumber', '')::integer end;
    -- El primer día de la ruta que tiene ese sitio por dentro (sin los de paso ni los vistos por fuera).
    select (d ->> 'dayNumber')::integer into v_dia_ruta
      from jsonb_array_elements(coalesce(v_ruta -> 'days', '[]'::jsonb)) d, jsonb_array_elements(coalesce(d -> 'stops', '[]'::jsonb)) st
     where st ->> 'name' in (select jsonb_array_elements_text(coalesce(r -> 'placeNames', '[]'::jsonb)))
       and coalesce(st ->> 'visitMode', '') <> 'fuera' and coalesce((st ->> 'passThrough')::boolean, false) = false
     order by (d ->> 'dayNumber')::integer limit 1;
    if v_dia_ruta is null or v_dia_reserva is null or v_dia_ruta = v_dia_reserva then continue; end if;
    insert into public.avisos (user_id, tipo, clave, payload)
    values (
      new.user_id, 'reserva_grupo',
      'nc:' || new.trip_id || ':' || (r ->> 'id') || ':' || v_dia_reserva || ':' || v_dia_ruta,
      jsonb_build_object(
        'caso', 'no_cuadra', 'trip_id', new.trip_id, 'reserva_id', r ->> 'id', 'ref_id', r ->> 'refId',
        'sitio', coalesce(nullif(r ->> 'shortName', ''), r ->> 'name'), 'sitio_nombre', r ->> 'name',
        'dia_reserva', public.dia_en_palabras(case when v_inicio is not null then v_inicio + v_dia_reserva - 1 end, v_dia_reserva),
        'dia_ruta', public.dia_en_palabras(case when v_inicio is not null then v_inicio + v_dia_ruta - 1 end, v_dia_ruta),
        'dia_reserva_n', v_dia_reserva, 'dia_ruta_n', v_dia_ruta, 'date_iso', r ->> 'dateIso', 'hora', r ->> 'time')
    ) on conflict (user_id, clave) do nothing;
  end loop;
  return new;
end $$;
drop trigger if exists avisar_entrada_no_cuadra on public.reservas_invitado;
create trigger avisar_entrada_no_cuadra after insert or update of reservas on public.reservas_invitado for each row execute function public.avisar_entrada_no_cuadra();

commit;
