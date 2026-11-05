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
