-- Comprobar la 0095 (solo lee; pégala en el SQL editor de Supabase). Sale UNA sola fila: si `todo` es true (y cada columna también), la 0095 está aplicada.
select
  (to_regclass('public.documentos_de_entrada') is not null) as tabla,
  (select count(*) = 4 from pg_policies where schemaname = 'public' and tablename = 'documentos_de_entrada') as cuatro_reglas,
  (select relrowsecurity from pg_class where oid = to_regclass('public.documentos_de_entrada')) as con_seguridad_por_filas,
  (pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%documentos_de_entrada%'
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%uso_diario%'
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) not like '%pagos_registro%') as empezar_de_cero_la_incluye,
  (
    to_regclass('public.documentos_de_entrada') is not null
    and (select count(*) = 4 from pg_policies where schemaname = 'public' and tablename = 'documentos_de_entrada')
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%documentos_de_entrada%'
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%uso_diario%'
  ) as todo;
