-- Comprobar la 0091 (solo lee; pégala en el SQL editor de Supabase). Sale UNA sola fila: si `todo` es true (y cada columna también), la 0091 está aplicada.
select
  (select count(*) = 3 from information_schema.columns where table_schema = 'public' and table_name = 'pagos_registro' and column_name in ('user_id', 'comision_cent', 'devuelto_cent')) as pagos_columnas,
  (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name = 'pais_vive') as pais_vive,
  (select count(*) >= 3 from public.destinos_proximamente where clave in ('florencia', 'berlin', 'cartagena_de_indias')) as proximamente_con_los_de_hoy,
  (to_regclass('public.uso_diario') is not null and to_regclass('public.afiliados_clics') is not null and to_regclass('public.cuentas_de_prueba') is not null) as tablas_nuevas,
  (select count(*) = 1 from public.cuentas_de_prueba where email = 'bengala.ingresos+pruebas1@gmail.com') as cuenta_de_pruebas_marcada,
  (select count(*) = 4 from unnest(array['public.pago_anotar(text, uuid, integer)', 'public.pago_anotar_devolucion(text, integer)', 'public.uso_anotar(uuid, text, boolean)', 'public.afiliado_clic(text, text, text)']) f
    where to_regprocedure(f) is not null and has_function_privilege('service_role', to_regprocedure(f), 'execute')
      and not has_function_privilege('anon', to_regprocedure(f), 'execute') and not has_function_privilege('authenticated', to_regprocedure(f), 'execute')) as funciones_solo_del_servidor,
  (to_regprocedure('public.empezar_de_cero(uuid)') is not null
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%uso_diario%'
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%viajero_primera_vez%'
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%avisos_de_viajeros%'
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) not like '%pagos_registro%'
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) not like '%cuentas_de_prueba%') as empezar_de_cero_borra_el_uso_y_deja_los_pagos,
  (
    (select count(*) = 3 from information_schema.columns where table_schema = 'public' and table_name = 'pagos_registro' and column_name in ('user_id', 'comision_cent', 'devuelto_cent'))
    and (select count(*) = 1 from information_schema.columns where table_schema = 'public' and table_name = 'viajero_primera_vez' and column_name = 'pais_vive')
    and (select count(*) >= 3 from public.destinos_proximamente where clave in ('florencia', 'berlin', 'cartagena_de_indias'))
    and to_regclass('public.uso_diario') is not null and to_regclass('public.afiliados_clics') is not null and to_regclass('public.cuentas_de_prueba') is not null
    and (select count(*) = 1 from public.cuentas_de_prueba where email = 'bengala.ingresos+pruebas1@gmail.com')
    and (select count(*) = 4 from unnest(array['public.pago_anotar(text, uuid, integer)', 'public.pago_anotar_devolucion(text, integer)', 'public.uso_anotar(uuid, text, boolean)', 'public.afiliado_clic(text, text, text)']) f
      where to_regprocedure(f) is not null and has_function_privilege('service_role', to_regprocedure(f), 'execute')
        and not has_function_privilege('anon', to_regprocedure(f), 'execute') and not has_function_privilege('authenticated', to_regprocedure(f), 'execute'))
    and to_regprocedure('public.empezar_de_cero(uuid)') is not null
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) like '%uso_diario%'
    and pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) not like '%pagos_registro%'
  ) as todo;
