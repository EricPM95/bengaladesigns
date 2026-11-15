-- Comprobación de la migración 0078 (la lista de viajes ligera, tanda V1b). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
-- Mira que existan las dos funciones, que la lista sea «security invoker» (la seguridad por filas manda) y que la pueda llamar quien ha entrado (no el público).
select case
  when to_regprocedure('public.viajes_lista(boolean)') is not null
   and to_regprocedure('public.dia_ligero(jsonb)') is not null
   and (select not prosecdef from pg_proc where oid = to_regprocedure('public.viajes_lista(boolean)'))
   and has_function_privilege('authenticated', 'public.viajes_lista(boolean)', 'execute')
   and not has_function_privilege('anon', 'public.viajes_lista(boolean)', 'execute')
  then 'Aplicada'
  else 'FALTA'
end as migracion_0078;
