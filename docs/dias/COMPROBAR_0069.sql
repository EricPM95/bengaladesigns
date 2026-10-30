-- Comprobación de la migración 0069 («Propón un sitio»). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
select case
  when to_regclass('public.propuestas_de_sitio') is not null
   and (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'propuestas_de_sitio' and column_name in ('id', 'creado', 'nombre', 'comentario', 'destino', 'origen')) = 6
   and coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.propuestas_de_sitio')), false)
  then 'Aplicada'
  else 'FALTA'
end as migracion_0069;

-- Para ver lo que ha propuesto la gente (lo último primero):
-- select creado, destino, nombre, comentario, origen from public.propuestas_de_sitio order by creado desc limit 50;
