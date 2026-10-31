-- Comprobación de la migración 0071 (empezar_de_cero también borra billetes_personales, partiendo de la versión de la 0040). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
-- Mira que exista la función y que su código nombre la tabla nueva (`billetes_personales`) Y las cuatro que añadió la 0040 (`admin_sin_pase`, `trip_gastos`, `trip_pagos`, `trip_ex_miembros`).
select case
  when to_regprocedure('public.empezar_de_cero(uuid)') is not null
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%billetes_personales%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%trip_gastos%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%trip_pagos%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%trip_ex_miembros%'
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%admin_sin_pase%'
  then 'Aplicada'
  else 'FALTA'
end as migracion_0071;
