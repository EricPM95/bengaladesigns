-- Comprobar LIMPIAR_ORIGINALROUTE (solo lee; pégala en el SQL editor de Supabase). Sale UNA sola fila: si `todo` es true (y cada columna también), la limpieza está hecha.
select
  (select count(*) = 0 from public.trips where route ? 'originalRoute') as ningun_viaje_con_copia,
  (select count(*) = 0 from pg_trigger where tgrelid = 'public.trips'::regclass and not tgisinternal and tgenabled <> 'O') as disparadores_de_trips_encendidos,
  (
    (select count(*) = 0 from public.trips where route ? 'originalRoute')
    and (select count(*) = 0 from pg_trigger where tgrelid = 'public.trips'::regclass and not tgisinternal and tgenabled <> 'O')
  ) as todo;
