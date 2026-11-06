-- Comprobación de la migración 0076 (los compañeros de un viaje compartido reciben los avisos). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
-- Mira que la mirada del planificador (avisos_viaje_hay_que_mirar) tenga en cuenta a los compañeros (trip_members) y que solo la pueda llamar service_role.
select case
  when to_regprocedure('public.avisos_viaje_hay_que_mirar(date, date)') is not null
   and pg_get_functiondef(to_regprocedure('public.avisos_viaje_hay_que_mirar(date, date)')) like '%trip_members%'
   and has_function_privilege('service_role', 'public.avisos_viaje_hay_que_mirar(date, date)', 'execute')
   and not has_function_privilege('anon', 'public.avisos_viaje_hay_que_mirar(date, date)', 'execute')
   and not has_function_privilege('authenticated', 'public.avisos_viaje_hay_que_mirar(date, date)', 'execute')
  then 'Aplicada'
  else 'FALTA'
end as migracion_0076;
