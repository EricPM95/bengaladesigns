-- Comprobar la 0090 (solo lee; pegar en el SQL editor de Supabase). Tiene que salir una sola fila con migracion_0090 = 'Aplicada'.
select case
  when (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'avisos_destino' and column_name in ('avisado_campana_en', 'avisado_correo_en')) = 2
   and (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'avisos_de_viajeros' and column_name = 'notificado_en') = 1
   and (select count(*) from unnest(array[
      'public.panel_fecha(text)', 'public.panel_cosa_aviso(jsonb)', 'public.panel_inicio(timestamptz, text)',
      'public.panel_usuarios(text, text, text, text, text, text, integer, integer, date, uuid)', 'public.panel_usuarios_totales(timestamptz)', 'public.panel_ficha(uuid, date)',
      'public.panel_ventas(timestamptz, text)', 'public.panel_destinos_pedidos(integer)', 'public.panel_destinos_resumen(jsonb)',
      'public.panel_destino_ya_disponible(text, text, boolean, integer)', 'public.panel_destino_correo_devolver(jsonb)',
      'public.panel_reporte_responder(uuid, text)', 'public.panel_reportes_a_notificar(timestamptz, integer)', 'public.panel_reportes_desmarcar(jsonb)']) f
      where to_regprocedure(f) is not null and has_function_privilege('service_role', to_regprocedure(f), 'execute')
        and not has_function_privilege('anon', to_regprocedure(f), 'execute') and not has_function_privilege('authenticated', to_regprocedure(f), 'execute')) = 14
  then 'Aplicada' else 'FALTA' end as migracion_0090;
