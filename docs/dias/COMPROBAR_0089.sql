-- Comprobar la 0089 (solo lee; pegar en el SQL editor de Supabase). Tiene que salir una sola fila con migracion_0089 = 'Aplicada'.
select case
  when (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name in ('user_id', 'frecuencia', 'compania', 'anio_nacimiento', 'hecho_en')) = 5
   and exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'viajero_primera_vez' and c.relrowsecurity)
   and (select count(*) from pg_policies where schemaname = 'public' and tablename = 'viajero_primera_vez') >= 3
   and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%viajero_primera_vez%'
  then 'Aplicada' else 'FALTA' end as migracion_0089;
