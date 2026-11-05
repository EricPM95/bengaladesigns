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
