-- Comprobación de la migración 0072 (empezar_de_cero NO devuelve las pruebas gastadas: ya no borra hoy_prueba ni historia_de_prueba). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
-- Mira que exista la función, que siga borrando todo lo demás (por ejemplo billetes_personales, trips, passes) y que su código YA NO nombre `hoy_prueba` ni `historia_de_prueba`.
select case
  when to_regprocedure('public.empezar_de_cero(uuid)') is not null
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%billetes_personales%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%lo_suyo_del_viaje%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%trip_ex_miembros%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%passes%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) not like '%hoy_prueba%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) not like '%historia_de_prueba%'
  then 'Aplicada'
  else 'FALTA'
end as migracion_0072;
