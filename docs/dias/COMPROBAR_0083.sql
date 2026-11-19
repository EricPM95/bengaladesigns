-- Comprueba la migración 0083 (juntar un viaje propio con el compartido). UNA sola fila: las dos deben salir en true.
select jsonb_build_object(
  'existe_juntar_viaje_de', exists (select 1 from pg_proc where proname = 'juntar_viaje_de' and pronamespace = 'public'::regnamespace),
  'existe_juntar_mi_viaje', exists (select 1 from pg_proc where proname = 'juntar_mi_viaje' and pronamespace = 'public'::regnamespace)
) as resultado;
