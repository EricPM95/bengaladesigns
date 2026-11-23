-- Comprobar la 0094 (solo lee; pégala en el SQL editor de Supabase). Sale UNA sola fila: si `todo` es true (y cada columna también), la 0094 está aplicada.
--   franja_columna ........ la columna `franja_edad` existe en viajero_primera_vez
--   franja_solo_seis ...... tiene su CHECK con las seis franjas (18-24, 25-34, 35-44, 45-54, 55-64, 65+)
--   anio_se_queda ......... `anio_nacimiento` sigue ahí (no se borra)
--   respuestas_viejas ..... nadie que tendría 18 o más según su año de nacimiento se ha quedado sin franja
--   con_empezar ........... «Empezar de cero» sigue borrando viajero_primera_vez (la fila entera, con la franja)
select
  (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name = 'franja_edad') as franja_columna,
  (select count(*) >= 1 from pg_constraint c where c.conrelid = 'public.viajero_primera_vez'::regclass and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%franja_edad%' and pg_get_constraintdef(c.oid) like '%18-24%' and pg_get_constraintdef(c.oid) like '%65+%') as franja_solo_seis,
  (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name = 'anio_nacimiento') as anio_se_queda,
  (select count(*) = 0 from public.viajero_primera_vez where franja_edad is null and anio_nacimiento is not null and extract(year from now())::integer - anio_nacimiento >= 18) as respuestas_viejas,
  (to_regprocedure('public.empezar_de_cero(uuid)') is not null
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%viajero_primera_vez%') as con_empezar,
  (
    (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name = 'franja_edad')
    and (select count(*) >= 1 from pg_constraint c where c.conrelid = 'public.viajero_primera_vez'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%franja_edad%' and pg_get_constraintdef(c.oid) like '%18-24%' and pg_get_constraintdef(c.oid) like '%65+%')
    and (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name = 'anio_nacimiento')
    and (select count(*) = 0 from public.viajero_primera_vez where franja_edad is null and anio_nacimiento is not null and extract(year from now())::integer - anio_nacimiento >= 18)
    and to_regprocedure('public.empezar_de_cero(uuid)') is not null
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%viajero_primera_vez%'
  ) as todo;
