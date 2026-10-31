-- Comprobación de la migración 0073 (contador de lecturas de documentos, 10S8). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
-- Mira que exista la tabla con RLS encendido y SIN políticas, las dos funciones, y que solo el servidor (service_role) pueda llamarlas.
select case
  when to_regclass('public.lecturas_de_documentos') is not null
   and (select relrowsecurity from pg_class where oid = 'public.lecturas_de_documentos'::regclass)
   and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lecturas_de_documentos')
   and to_regprocedure('public.registrar_lectura(uuid, integer)') is not null
   and to_regprocedure('public.devolver_lectura(uuid)') is not null
   and has_function_privilege('service_role', 'public.registrar_lectura(uuid, integer)', 'execute')
   and not has_function_privilege('anon', 'public.registrar_lectura(uuid, integer)', 'execute')
   and not has_function_privilege('authenticated', 'public.registrar_lectura(uuid, integer)', 'execute')
  then 'Aplicada'
  else 'FALTA'
end as migracion_0073;
