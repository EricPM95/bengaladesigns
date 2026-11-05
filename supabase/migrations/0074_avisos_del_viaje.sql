-- 0074 · LOS AVISOS DEL VIAJE CON EL MÓVIL BLOQUEADO (tanda HOY3, 5-nov). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0074.sql.
--
-- Qué hace: (1) la tabla `avisos_viaje_enviados` (qué aviso del viaje se ha mandado ya a cada persona: así ninguno sale dos veces aunque la tarea corra cada minuto); (2) las funciones que usa el servidor
-- (server/avisosViaje.js): los viajes en curso, si hay alguien a quien avisar, reservar un aviso antes de mandarlo (`true` solo la primera vez) y liberarlo si no llegó a ningún móvil; (3) `empezar_de_cero` vuelve a crearse con la tabla nueva en su inventario.
-- Todo es del servidor: la tabla lleva RLS encendido y SIN políticas, y las funciones solo las puede llamar service_role.
-- `empezar_de_cero`: esta migración NO edita ninguna anterior; parte de su ÚLTIMA versión (la de la 0072: 0032 → 0037 → 0040 → 0071 → 0072) e idéntica a ella salvo UNA línea más en el inventario: ('avisos_viaje_enviados', 'user_id').
-- La planificación de cada minuto (pg_cron + pg_net) va aparte, en la 0075.
begin;

-- ── 1. Lo ya mandado ────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.avisos_viaje_enviados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete cascade,
  -- «<viaje>|<aviso>:<día>[:<hora>]», por ejemplo «…|manana:2026-11-10»: único por persona.
  clave text not null,
  tipo text not null,
  -- La hora (UTC) a la que tocaba mandarlo.
  para timestamptz not null,
  enviado_en timestamptz not null default now(),
  unique (user_id, clave)
);
create index if not exists idx_avisos_viaje_enviados_fecha on public.avisos_viaje_enviados (enviado_en);
alter table public.avisos_viaje_enviados enable row level security;
-- Sin políticas: solo el servidor (clave de servicio) lee y escribe.

-- ── 2. Funciones del servidor ───────────────────────────────────────────────────────────────────────────────
-- Los viajes que empiezan, están en curso o acaban de acabar (con un día de margen por la hora del destino): lo que mira la tarea de cada minuto.
create or replace function public.viajes_en_curso_para_avisos(p_desde date, p_hasta date) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('trip_id', q.id, 'user_id', q.traveler_id, 'route', q.route, 'bookings', q.bookings)), '[]'::jsonb)
  from (
    select t.id, t.traveler_id, t.route, t.bookings,
      case when (t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$' then (t.route #>> '{answers,dateRange,start}')::date end as inicio,
      case when coalesce(t.route #>> '{answers,dateRange,end}', t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$' then coalesce(t.route #>> '{answers,dateRange,end}', t.route #>> '{answers,dateRange,start}')::date end as fin
    from public.trips t
    where t.generation_state is null and t.guardado_en is null
  ) q
  where q.inicio is not null and q.fin is not null and q.inicio <= p_hasta and q.fin >= p_desde
$$;

-- ¿Hay algún viaje en curso cuyo dueño pueda recibir avisos (tiene alguna suscripción de móvil)? Lo mira el planificador de la 0075 cada minuto, SIN traer rutas: si no hay ninguno, no se llama a la API.
create or replace function public.avisos_viaje_hay_que_mirar(p_desde date, p_hasta date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from (
      select t.traveler_id,
        case when (t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$' then (t.route #>> '{answers,dateRange,start}')::date end as inicio,
        case when coalesce(t.route #>> '{answers,dateRange,end}', t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$' then coalesce(t.route #>> '{answers,dateRange,end}', t.route #>> '{answers,dateRange,start}')::date end as fin
      from public.trips t
      where t.generation_state is null and t.guardado_en is null
    ) q
    where q.inicio is not null and q.fin is not null and q.inicio <= p_hasta and q.fin >= p_desde
      and exists (select 1 from public.push_suscripciones s where s.user_id = q.traveler_id)
  )
$$;

-- Reserva un aviso antes de mandarlo: true solo la primera vez (si ya estaba, false y no se manda).
create or replace function public.avisos_viaje_reservar(p_uid uuid, p_trip uuid, p_clave text, p_tipo text, p_para timestamptz) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_filas integer;
begin
  insert into public.avisos_viaje_enviados (user_id, trip_id, clave, tipo, para) values (p_uid, p_trip, p_clave, p_tipo, p_para) on conflict (user_id, clave) do nothing;
  get diagnostics v_filas = row_count;
  return v_filas > 0;
end $$;

-- Lo libera si no llegó a ningún móvil (se reintenta al minuto siguiente).
create or replace function public.avisos_viaje_liberar(p_uid uuid, p_clave text) returns void
language sql security definer set search_path = public as $$
  delete from public.avisos_viaje_enviados where user_id = p_uid and clave = p_clave
$$;

revoke all on function public.viajes_en_curso_para_avisos(date, date) from public, anon, authenticated;
revoke all on function public.avisos_viaje_hay_que_mirar(date, date) from public, anon, authenticated;
revoke all on function public.avisos_viaje_reservar(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.avisos_viaje_liberar(uuid, text) from public, anon, authenticated;
grant execute on function public.viajes_en_curso_para_avisos(date, date) to service_role;
grant execute on function public.avisos_viaje_hay_que_mirar(date, date) to service_role;
grant execute on function public.avisos_viaje_reservar(uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.avisos_viaje_liberar(uuid, text) to service_role;

-- ── 3. Empezar de cero, con la tabla nueva (la única diferencia con la 0072 es la línea de avisos_viaje_enviados) ──────────
create or replace function public.empezar_de_cero(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_res jsonb := '{}'::jsonb;
  v_n integer;
  v_par record;
  v_traspaso jsonb;
begin
  if p_uid is null then raise exception 'Falta la cuenta.'; end if;
  if not exists (select 1 from auth.users where id = p_uid) then raise exception 'Esa cuenta no existe.'; end if;

  -- 1. Lo compartido pasa a los demás antes de borrar nada.
  v_traspaso := public.preparar_borrado(p_uid);

  -- 2. Lo de la cuenta, tabla a tabla y siempre por su columna de dueño. Las dependencias van antes que de lo que dependen (los viajes, de los últimos).
  for v_par in
    select * from (values
      ('stop_visits', 'user_id'),
      ('trip_photo_meta', 'user_id'),
      ('trip_photos', 'user_id'),
      ('logro_hechos', 'user_id'),
      ('achievements', 'user_id'),
      ('logro_avisos', 'user_id'),
      ('logro_perfil', 'user_id'),
      ('push_suscripciones', 'user_id'),
      ('logro_referidos', 'invitador_id'),
      ('avisos', 'user_id'),
      ('avisos_viaje_enviados', 'user_id'),
      ('avisos_destino', 'user_id'),
      ('place_likes', 'user_id'),
      ('admin_sin_pase', 'user_id'),
      ('trip_recommendations', 'author_id'),
      ('trip_gastos', 'autor_id'),
      ('trip_pagos', 'marcado_por'),
      ('trip_invitations', 'creada_por'),
      ('trip_members', 'user_id'),
      ('trip_ex_miembros', 'user_id'),
      ('pass_members', 'user_id'),
      ('passes', 'comprador_id'),
      ('billetes_personales', 'user_id'),
      ('lo_suyo_del_viaje', 'user_id'),
      ('reservas_invitado', 'user_id'),
      ('reservas_privadas_admin', 'user_id'),
      ('trips', 'traveler_id'),
      ('fotos_por_borrar', 'user_id')
    ) as t (tabla, columna)
  loop
    if to_regclass('public.' || v_par.tabla) is not null then
      execute format('delete from public.%I where %I = $1', v_par.tabla, v_par.columna) using p_uid;
      get diagnostics v_n = row_count;
      v_res := v_res || jsonb_build_object(v_par.tabla, v_n);
    end if;
  end loop;

  return jsonb_build_object('borrados', v_res, 'traspasado', v_traspaso);
end $$;

revoke all on function public.empezar_de_cero(uuid) from public, anon, authenticated;
grant execute on function public.empezar_de_cero(uuid) to service_role;

commit;
