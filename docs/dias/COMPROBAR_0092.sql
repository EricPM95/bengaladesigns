-- Comprobar la 0092 (solo lee; pégala en el SQL editor de Supabase). Sale UNA sola fila: si `todo` es true (y cada columna también), la 0092 está aplicada.
select
  (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'trips' and column_name = 'route_original' and data_type = 'jsonb') as columna_route_original,
  (to_regprocedure('public.proteger_route_original()') is not null) as funcion_de_proteccion,
  (select count(*) = 1 from pg_trigger where tgrelid = 'public.trips'::regclass and tgname = 'trips_proteger_route_original' and not tgisinternal) as disparador_puesto,
  (
    (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'trips' and column_name = 'route_original' and data_type = 'jsonb')
    and (to_regprocedure('public.proteger_route_original()') is not null)
    and (select count(*) = 1 from pg_trigger where tgrelid = 'public.trips'::regclass and tgname = 'trips_proteger_route_original' and not tgisinternal)
  ) as todo;
