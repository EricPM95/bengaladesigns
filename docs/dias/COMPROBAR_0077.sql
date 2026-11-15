-- Comprobación de la migración 0077 (los avisos programados, tanda V1). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
-- Mira que existan las dos tablas, que las funciones solo las pueda llamar service_role, que la mirada barata use los avisos programados y que la tarea avisos-viaje corra cada 5 minutos.
select case
  when to_regclass('public.avisos_plan') is not null
   and to_regclass('public.avisos_programados') is not null
   and to_regprocedure('public.avisos_viajes_por_planificar(date, date)') is not null
   and to_regprocedure('public.avisos_viaje_para_plan(uuid)') is not null
   and to_regprocedure('public.avisos_programados_guardar(uuid, text, jsonb)') is not null
   and to_regprocedure('public.avisos_programados_debidos(timestamptz, integer)') is not null
   and to_regprocedure('public.avisos_programados_listo(uuid, text)') is not null
   and pg_get_functiondef(to_regprocedure('public.avisos_viaje_hay_que_mirar(date, date)')) like '%avisos_programados%'
   and has_function_privilege('service_role', 'public.avisos_programados_debidos(timestamptz, integer)', 'execute')
   and not has_function_privilege('anon', 'public.avisos_programados_debidos(timestamptz, integer)', 'execute')
   and not has_function_privilege('authenticated', 'public.avisos_programados_debidos(timestamptz, integer)', 'execute')
  then 'Aplicada'
  else 'FALTA'
end as migracion_0077;

-- La tarea (si pg_cron está): debe salir «*/5 * * * *» y active = true.
select jobname, schedule, active from cron.job where jobname = 'avisos-viaje';
