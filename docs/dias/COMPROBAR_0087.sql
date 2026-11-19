-- Comprobar la 0087 (solo lee; pegar en el SQL editor de Supabase). Tiene que salir: tabla = true, disparador = true, en_realtime_trip_cambios = true, trips_sigue_en_realtime = false.
select
  (select to_regclass('public.trip_cambios') is not null) as tabla,
  (select exists (select 1 from pg_trigger where tgname = 'trips_anotar_cambio' and not tgisinternal)) as disparador,
  (select exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_cambios')) as en_realtime_trip_cambios,
  (select exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trips')) as trips_sigue_en_realtime,
  (select count(*) from public.trip_cambios) as filas;
