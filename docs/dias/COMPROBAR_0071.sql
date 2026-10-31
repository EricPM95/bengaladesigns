-- Comprobación de la migración 0071 (empezar_de_cero también borra billetes_personales). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
-- Mira que exista la función y que su código nombre la tabla `billetes_personales` (la 0032 sola no la nombra).
select case
  when to_regprocedure('public.empezar_de_cero(uuid)') is not null
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%billetes_personales%'
  then 'Aplicada'
  else 'FALTA'
end as migracion_0071;
