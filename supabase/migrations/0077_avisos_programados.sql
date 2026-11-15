-- 0077 · LOS AVISOS DEL VIAJE LEEN LO MÍNIMO (tanda V1, 15-nov). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0077.sql.
--
-- Por qué: hasta ahora la tarea `avisos-viaje` (0075, cada minuto) llamaba a `viajes_en_curso_para_avisos` y bajaba el viaje ENTERO (la ruta y las reservas, cientos de KB) en cada vuelta, solo para ver que aún no tocaba nada.
-- Con un viaje en curso eso son 1.440 lecturas al día de la ruta entera: la salida de datos de Supabase (egress) se fue a 9,69 GB de 5 GB.
--
-- Qué hace: (1) `avisos_plan`: qué viajes ya tienen su plan de avisos calculado y con qué «huella» (un resumen md5 de la ruta y las reservas, calculado DENTRO de la base de datos: no sale ni un byte);
-- (2) `avisos_programados`: los avisos ya calculados (texto, hora y día), una fila pequeña por aviso. El servidor recalcula el plan de un viaje SOLO cuando cambia (huella distinta), cuando ya no hay plan o cada 6 horas (para refrescar el tiempo),
-- y la tarea de cada vuelta solo lee los avisos que tocan ahora; (3) `avisos_viaje_hay_que_mirar` pasa a decir «sí» solo si hay un plan que rehacer o un aviso que toca (si no, ni se llama a la API);
-- (4) la tarea pasa de cada minuto a cada 5 minutos (el servidor admite hasta 30 min de retraso).
-- Las dos tablas cuelgan del VIAJE (no de ninguna cuenta): se borran con él. No llevan columna de persona, así que no hay nada que añadir a `empezar_de_cero`.
-- No se edita ninguna migración anterior. `avisos_viaje_hay_que_mirar` parte de su ÚLTIMA versión (la de la 0076: el dueño O un compañero con móvil suscrito).
-- Para pararlo: select cron.unschedule('avisos-viaje');   Para volver a cada minuto: ver el final de este archivo.
begin;

-- ── 1. Las tablas ───────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.avisos_plan (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  huella text not null,
  planificado_en timestamptz not null default now()
);
alter table public.avisos_plan enable row level security;
-- Sin políticas: solo el servidor (clave de servicio).

create table if not exists public.avisos_programados (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  -- La misma clave que usa `avisos_viaje_enviados` (sin el viaje delante): «manana:2026-11-10».
  clave text not null,
  tipo text not null,
  -- La hora (UTC) a la que toca mandarlo.
  para timestamptz not null,
  -- De qué día del viaje habla (para el día de prueba sin pase).
  dia_fecha date not null,
  texto text not null,
  -- Cuándo el servidor terminó con él (mandado a todos los que podían recibirlo). Sin esto, sigue pendiente.
  listo_en timestamptz,
  unique (trip_id, clave)
);
create index if not exists idx_avisos_programados_pendientes on public.avisos_programados (para) where listo_en is null;
alter table public.avisos_programados enable row level security;
-- Sin políticas: solo el servidor.

-- ── 2. Funciones del servidor ───────────────────────────────────────────────────────────────────────────────
-- Los viajes en curso con alguien a quien avisar (el dueño o un compañero con móvil) cuyo plan hay que rehacer. Devuelve SOLO ids y huella (unos 100 bytes por viaje).
create or replace function public.avisos_viajes_por_planificar(p_desde date, p_hasta date) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('trip_id', q.id, 'user_id', q.traveler_id, 'huella', q.huella)), '[]'::jsonb)
  from (
    select t.id, t.traveler_id, md5(coalesce(t.route::text, '') || '|' || coalesce(t.bookings::text, '')) as huella,
      case when (t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$' then (t.route #>> '{answers,dateRange,start}')::date end as inicio,
      case when coalesce(t.route #>> '{answers,dateRange,end}', t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$' then coalesce(t.route #>> '{answers,dateRange,end}', t.route #>> '{answers,dateRange,start}')::date end as fin
    from public.trips t
    where t.generation_state is null and t.guardado_en is null
      and (
        exists (select 1 from public.push_suscripciones s where s.user_id = t.traveler_id)
        or exists (select 1 from public.trip_members m join public.push_suscripciones s on s.user_id = m.user_id where m.trip_id = t.id)
      )
  ) q
  left join public.avisos_plan p on p.trip_id = q.id
  where q.inicio is not null and q.fin is not null and q.inicio <= p_hasta and q.fin >= p_desde
    and (p.trip_id is null or p.huella <> q.huella or p.planificado_en < now() - interval '6 hours')
$$;

-- UN viaje entero (la ruta y las reservas), para rehacerle el plan. Es lo único que baja la ruta, y solo cuando hace falta.
create or replace function public.avisos_viaje_para_plan(p_trip uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('trip_id', t.id, 'user_id', t.traveler_id, 'route', t.route, 'bookings', t.bookings, 'huella', md5(coalesce(t.route::text, '') || '|' || coalesce(t.bookings::text, '')))
  from public.trips t where t.id = p_trip
$$;

-- Guarda el plan de un viaje: cada fila de p_filas = {clave, tipo, para, dia_fecha, texto}. Lo ya terminado (listo_en) no se toca; lo pendiente que ya no está en el plan se quita.
create or replace function public.avisos_programados_guardar(p_trip uuid, p_huella text, p_filas jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  if not exists (select 1 from public.trips where id = p_trip) then return 0; end if;
  delete from public.avisos_programados where trip_id = p_trip and listo_en is null
    and clave not in (select f ->> 'clave' from jsonb_array_elements(coalesce(p_filas, '[]'::jsonb)) f);
  insert into public.avisos_programados (trip_id, clave, tipo, para, dia_fecha, texto)
  select p_trip, f ->> 'clave', f ->> 'tipo', (f ->> 'para')::timestamptz, (f ->> 'dia_fecha')::date, f ->> 'texto'
  from jsonb_array_elements(coalesce(p_filas, '[]'::jsonb)) f
  on conflict (trip_id, clave) do update set tipo = excluded.tipo, para = excluded.para, dia_fecha = excluded.dia_fecha, texto = excluded.texto
    where public.avisos_programados.listo_en is null;
  get diagnostics v_n = row_count;
  insert into public.avisos_plan (trip_id, huella, planificado_en) values (p_trip, p_huella, now())
  on conflict (trip_id) do update set huella = excluded.huella, planificado_en = excluded.planificado_en;
  return v_n;
end $$;

-- Los avisos que ya les toca y todavía valen (su hora pasó hace menos de p_retraso_min minutos). Devuelve solo los textos y quién es el dueño: unos 300 bytes por aviso.
create or replace function public.avisos_programados_debidos(p_ahora timestamptz, p_retraso_min integer) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('trip_id', a.trip_id, 'user_id', t.traveler_id, 'destino', t.route ->> 'destination', 'clave', a.clave, 'tipo', a.tipo, 'para', a.para, 'dia_fecha', a.dia_fecha, 'texto', a.texto) order by a.para), '[]'::jsonb)
  from public.avisos_programados a join public.trips t on t.id = a.trip_id
  where a.listo_en is null and a.para <= p_ahora and a.para >= p_ahora - make_interval(mins => greatest(coalesce(p_retraso_min, 30), 1))
$$;

create or replace function public.avisos_programados_listo(p_trip uuid, p_clave text) returns void
language sql security definer set search_path = public as $$
  update public.avisos_programados set listo_en = now() where trip_id = p_trip and clave = p_clave and listo_en is null
$$;

-- La mirada barata del planificador: «sí» solo si hay un plan que rehacer o un aviso que toca. Si no, no se llama a la API. (Parte de la 0076; añade lo de los avisos programados.)
create or replace function public.avisos_viaje_hay_que_mirar(p_desde date, p_hasta date) returns boolean
language sql stable security definer set search_path = public as $$
  select jsonb_array_length(public.avisos_viajes_por_planificar(p_desde, p_hasta)) > 0
    or exists (select 1 from public.avisos_programados a where a.listo_en is null and a.para <= now() and a.para >= now() - interval '30 minutes')
$$;

revoke all on function public.avisos_viajes_por_planificar(date, date) from public, anon, authenticated;
revoke all on function public.avisos_viaje_para_plan(uuid) from public, anon, authenticated;
revoke all on function public.avisos_programados_guardar(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.avisos_programados_debidos(timestamptz, integer) from public, anon, authenticated;
revoke all on function public.avisos_programados_listo(uuid, text) from public, anon, authenticated;
revoke all on function public.avisos_viaje_hay_que_mirar(date, date) from public, anon, authenticated;
grant execute on function public.avisos_viajes_por_planificar(date, date) to service_role;
grant execute on function public.avisos_viaje_para_plan(uuid) to service_role;
grant execute on function public.avisos_programados_guardar(uuid, text, jsonb) to service_role;
grant execute on function public.avisos_programados_debidos(timestamptz, integer) to service_role;
grant execute on function public.avisos_programados_listo(uuid, text) to service_role;
grant execute on function public.avisos_viaje_hay_que_mirar(date, date) to service_role;

-- ── 3. La tarea, cada 5 minutos (si pg_cron está; si no, no hace nada y lo dice) ───────────────────────────────
do $replanificar$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice '0077: pg_cron no está disponible: no se reprograma la tarea.';
    return;
  end if;
  if exists (select 1 from cron.job where jobname = 'avisos-viaje') then
    perform cron.unschedule('avisos-viaje');
  end if;
  perform cron.schedule('avisos-viaje', '*/5 * * * *', 'select public.avisos_viaje_disparar()');
end
$replanificar$;

commit;

-- Para volver a cada minuto:  select cron.unschedule('avisos-viaje'); select cron.schedule('avisos-viaje', '* * * * *', 'select public.avisos_viaje_disparar()');
