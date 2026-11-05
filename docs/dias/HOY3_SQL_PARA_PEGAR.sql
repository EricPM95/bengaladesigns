-- HOY3 · LOS AVISOS DEL VIAJE CON EL MÓVIL BLOQUEADO · SQL LISTO PARA PEGAR (5-nov-2026)
-- Se pega en el SQL Editor de Supabase, por pasos (cada paso se puede repetir sin romper nada). Orden: 1 → 2 → 3 → 4.
--
--   ANTES DE EMPEZAR (una vez, a mano en el panel de Supabase):  Database › Extensions › activar «pg_cron» y «pg_net».
--   EN VERCEL (si no están ya): PUSH_ACTIVO=true, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACTO (mailto:…) y CRON_SECRET (una clave larga inventada por Eric). Después, redesplegar.
--   NUNCA pegues una clave en un chat ni en un archivo del proyecto: los valores del paso 2 los escribe Eric directamente aquí, en el SQL Editor.
--
-- ═══════════════════════════════════════════════════ PASO 1 · la migración 0074 (tabla de avisos mandados + funciones + empezar_de_cero) ═══════════════════════════════════════════════════

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

-- Comprobación del paso 1 (tiene que salir «Aplicada»):
-- Comprobación de la migración 0074 (los avisos del viaje con el móvil bloqueado, HOY3). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
-- Mira que exista la tabla de avisos ya mandados con RLS encendido y SIN políticas, las cuatro funciones del servidor (solo service_role puede llamarlas) y que empezar_de_cero ya borre esa tabla (y siga borrando el resto y sin tocar hoy_prueba).
select case
  when to_regclass('public.avisos_viaje_enviados') is not null
   and (select relrowsecurity from pg_class where oid = 'public.avisos_viaje_enviados'::regclass)
   and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'avisos_viaje_enviados')
   and to_regprocedure('public.viajes_en_curso_para_avisos(date, date)') is not null
   and to_regprocedure('public.avisos_viaje_hay_que_mirar(date, date)') is not null
   and to_regprocedure('public.avisos_viaje_reservar(uuid, uuid, text, text, timestamptz)') is not null
   and to_regprocedure('public.avisos_viaje_liberar(uuid, text)') is not null
   and has_function_privilege('service_role', 'public.avisos_viaje_reservar(uuid, uuid, text, text, timestamptz)', 'execute')
   and not has_function_privilege('anon', 'public.avisos_viaje_reservar(uuid, uuid, text, text, timestamptz)', 'execute')
   and not has_function_privilege('authenticated', 'public.avisos_viaje_reservar(uuid, uuid, text, text, timestamptz)', 'execute')
   and to_regprocedure('public.empezar_de_cero(uuid)') is not null
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%avisos_viaje_enviados%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%billetes_personales%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) not like '%hoy_prueba%'
  then 'Aplicada'
  else 'FALTA'
end as migracion_0074;

-- ═══════════════════════════════════════════════════ PASO 2 · los dos secretos del Vault (SOLO una vez, con TUS valores) ═══════════════════════════════════════════════════
-- La dirección de la API y la clave del cron NO están en ningún archivo del proyecto: viven en el Vault de Supabase. Quita los dos «--» de cada línea, escribe tus valores entre las comillas y ejecútalo UNA vez.
--   · avisos_viaje_url   = la dirección completa de la API: https://<tu-dominio>/api/cron/avisos-viaje
--   · avisos_viaje_clave = EXACTAMENTE el mismo valor que CRON_SECRET en Vercel
-- (También se pueden crear a mano en Supabase › Project Settings › Vault › Add new secret, con esos dos nombres.)
-- Para cambiar uno después: select vault.update_secret((select id from vault.secrets where name = 'avisos_viaje_clave'), 'el-valor-nuevo');
--
-- select vault.create_secret('https://<tu-dominio>/api/cron/avisos-viaje', 'avisos_viaje_url');
-- select vault.create_secret('<el mismo valor que CRON_SECRET en Vercel>', 'avisos_viaje_clave');

-- ═══════════════════════════════════════════════════ PASO 3 · la migración 0075 (el planificador: cada minuto, pg_cron + pg_net) ═══════════════════════════════════════════════════

-- 0075 · EL PLANIFICADOR DE LOS AVISOS DEL VIAJE: CADA MINUTO (tanda HOY3, 5-nov). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0075.sql.
--
-- Por qué: en el plan gratis de Vercel un cron solo puede correr UNA vez al día; los avisos del viaje tienen que salir a su hora (las 9:26, las 17:04…). Así que el reloj es de Supabase: `pg_cron` despierta cada minuto una función
-- (`avisos_viaje_disparar`) que, SOLO si hay un viaje en curso con alguien que puede recibir avisos (una suscripción de móvil), llama con `pg_net` a nuestra API (`/api/cron/avisos-viaje`) con una clave secreta.
-- La dirección de la API y la clave NO están en este archivo ni en el código: viven en el Vault de Supabase (dos secretos: `avisos_viaje_url` y `avisos_viaje_clave`; la clave es la misma que CRON_SECRET en Vercel). Se crean UNA vez, con los valores
-- de Eric, en docs/dias/HOY3_SQL_PARA_PEGAR.sql (paso 2). Sin esos secretos, la función no hace nada.
-- Si `pg_cron` o `pg_net` no están disponibles (por ejemplo, una base de pruebas), esta migración no programa nada y lo dice, sin fallar. Antes de pegarla en Supabase: Database › Extensions › activar pg_cron y pg_net.
-- Para pararlo: select cron.unschedule('avisos-viaje');   Para ir más despacio (cada 5 min): cambiar '* * * * *' por '*/5 * * * *' (el servidor admite hasta 30 min de retraso).
begin;

do $planificador$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice '0075: pg_cron o pg_net no están disponibles en esta base de datos: no se programa nada (actívalos en Database > Extensions y vuelve a pegar este archivo).';
    return;
  end if;
  create extension if not exists pg_cron;
  create extension if not exists pg_net;

  execute $f$
    create or replace function public.avisos_viaje_disparar() returns void
    language plpgsql security definer set search_path = public, extensions as $body$
    declare
      v_url text;
      v_clave text;
      v_hoy date := (now() at time zone 'utc')::date;
    begin
      -- Una vez al día (a las 04:00 UTC) se borran los avisos ya mandados de hace más de 60 días.
      if extract(hour from now() at time zone 'utc') = 4 and extract(minute from now() at time zone 'utc') = 0 then
        delete from public.avisos_viaje_enviados where enviado_en < now() - interval '60 days';
      end if;
      -- Sin viaje en curso con alguien a quien avisar, no se llama a la API.
      if not public.avisos_viaje_hay_que_mirar(v_hoy - 1, v_hoy + 1) then return; end if;
      select decrypted_secret into v_url from vault.decrypted_secrets where name = 'avisos_viaje_url' limit 1;
      select decrypted_secret into v_clave from vault.decrypted_secrets where name = 'avisos_viaje_clave' limit 1;
      if v_url is null or v_clave is null then return; end if;
      perform net.http_post(url := v_url, body := '{}'::jsonb, headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_clave), timeout_milliseconds := 25000);
    end $body$
  $f$;
  execute 'revoke all on function public.avisos_viaje_disparar() from public, anon, authenticated';

  -- Si ya estaba programado, se vuelve a programar (así se puede pegar dos veces).
  if exists (select 1 from cron.job where jobname = 'avisos-viaje') then
    perform cron.unschedule('avisos-viaje');
  end if;
  perform cron.schedule('avisos-viaje', '* * * * *', 'select public.avisos_viaje_disparar()');
end
$planificador$;

commit;

-- ═══════════════════════════════════════════════════ PASO 4 · comprobar que todo está en su sitio ═══════════════════════════════════════════════════
-- migracion_0075 tiene que decir «Aplicada» y secretos «listos». ultimas_llamadas sube cuando hay un viaje en curso con un móvil con los avisos encendidos.

-- Comprobación de la migración 0075 (el planificador de cada minuto de los avisos del viaje, HOY3). Pégala en el SQL editor de Supabase: devuelve una fila con tres cosas.
--   migracion_0075: «Aplicada» (la función existe, solo la llama el servidor, y hay una tarea programada «avisos-viaje» activa que corre cada minuto) o «FALTA».
--   secretos: «listos» (están creados en el Vault los dos secretos avisos_viaje_url y avisos_viaje_clave) o «FALTAN: …» (créalos con el paso 2 de docs/dias/HOY3_SQL_PARA_PEGAR.sql). NO enseña sus valores.
--   ultimas_llamadas: cuántas veces ha llamado a la API en la última hora (con un viaje en curso y alguien con móvil suscrito debería rondar 60; sin viaje en curso, 0 es lo normal).
select
  case
    when to_regprocedure('public.avisos_viaje_disparar()') is not null
     and not has_function_privilege('anon', 'public.avisos_viaje_disparar()', 'execute')
     and not has_function_privilege('authenticated', 'public.avisos_viaje_disparar()', 'execute')
     and exists (select 1 from cron.job where jobname = 'avisos-viaje' and active and schedule = '* * * * *')
    then 'Aplicada'
    else 'FALTA'
  end as migracion_0075,
  case
    when (select count(*) from vault.decrypted_secrets where name in ('avisos_viaje_url', 'avisos_viaje_clave')) = 2 then 'listos'
    else 'FALTAN: ' || coalesce((select string_agg(n, ', ') from unnest(array['avisos_viaje_url', 'avisos_viaje_clave']) as n where n not in (select name from vault.decrypted_secrets)), '')
  end as secretos,
  (select count(*) from net._http_response where created > now() - interval '1 hour') as ultimas_llamadas;

-- Para PARARLO en cualquier momento (los avisos del viaje dejan de salir; lo demás sigue igual):  select cron.unschedule('avisos-viaje');
-- Para ir más despacio (cada 5 minutos en vez de cada minuto): select cron.unschedule('avisos-viaje'); select cron.schedule('avisos-viaje', '*/5 * * * *', 'select public.avisos_viaje_disparar()');
