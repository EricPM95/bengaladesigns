-- Comprobar la 0093 (solo lee; pégala en el SQL editor de Supabase). Sale UNA sola fila: si `todo` es true (y cada columna también), la 0093 está aplicada.
--   pais_vive_existe ...... BLOQUE A («tu país», sin cambios de base de datos): la columna `pais_vive` de la 0091 existe (lo contestado manda siempre; lo demás se calcula al leer)
--   sueno_columnas ........ BLOQUE B: las cinco columnas del viaje soñado en viajero_primera_vez
--   sueno_funciones ....... BLOQUE B: panel_suenos y panel_sueno_avisar existen y SOLO el servidor puede llamarlas
--   sueno_con_empezar ..... BLOQUE B: «Empezar de cero» sigue borrando viajero_primera_vez (la fila con el sueño se va con ella)
select
  (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name = 'pais_vive') as pais_vive_existe,
  (select count(*) = 5 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name in ('sueno_tipo', 'sueno_nombre', 'sueno_iso', 'sueno_norm', 'sueno_en')) as sueno_columnas,
  (select count(*) = 2 from unnest(array['public.panel_suenos(date, date, integer)', 'public.panel_sueno_avisar(text, text, text, text)']) f
    where to_regprocedure(f) is not null and has_function_privilege('service_role', to_regprocedure(f), 'execute')
      and not has_function_privilege('anon', to_regprocedure(f), 'execute') and not has_function_privilege('authenticated', to_regprocedure(f), 'execute')) as sueno_funciones,
  (to_regprocedure('public.empezar_de_cero(uuid)') is not null
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%viajero_primera_vez%') as sueno_con_empezar,
  (
    (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name = 'pais_vive')
    and (select count(*) = 5 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name in ('sueno_tipo', 'sueno_nombre', 'sueno_iso', 'sueno_norm', 'sueno_en'))
    and (select count(*) = 2 from unnest(array['public.panel_suenos(date, date, integer)', 'public.panel_sueno_avisar(text, text, text, text)']) f
      where to_regprocedure(f) is not null and has_function_privilege('service_role', to_regprocedure(f), 'execute')
        and not has_function_privilege('anon', to_regprocedure(f), 'execute') and not has_function_privilege('authenticated', to_regprocedure(f), 'execute'))
    and to_regprocedure('public.empezar_de_cero(uuid)') is not null
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%viajero_primera_vez%'
  ) as todo;
