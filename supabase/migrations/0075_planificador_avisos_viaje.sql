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
