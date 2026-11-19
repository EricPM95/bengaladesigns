-- Comprobación de la migración 0086 (empezar_de_cero con los avisos de «Cuéntanos», V20). Pégala en el SQL editor de Supabase: devuelve UNA fila con un solo jsonb.
-- `aplicada` tiene que ser true y `faltan` 0. La función tiene que borrar avisos_de_viajeros, seguir borrando lo de antes (avisos_viaje_enviados, billetes_personales, trip_gastos...),
-- NO nombrar hoy_prueba ni historia_de_prueba y ser solo del servidor.
with c as (
  select pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) as f
)
select jsonb_build_object(
  'aplicada', (f like '%avisos_de_viajeros%' and f like '%avisos_viaje_enviados%' and f like '%billetes_personales%' and f like '%trip_gastos%' and f not like '%hoy_prueba%' and f not like '%historia_de_prueba%'
               and has_function_privilege('service_role', 'public.empezar_de_cero(uuid)', 'execute') and not has_function_privilege('authenticated', 'public.empezar_de_cero(uuid)', 'execute')),
  'faltan', (case when f like '%avisos_de_viajeros%' then 0 else 1 end) + (case when f like '%avisos_viaje_enviados%' and f like '%billetes_personales%' and f like '%trip_gastos%' then 0 else 1 end)
            + (case when f like '%hoy_prueba%' or f like '%historia_de_prueba%' then 1 else 0 end)
            + (case when has_function_privilege('service_role', 'public.empezar_de_cero(uuid)', 'execute') and not has_function_privilege('authenticated', 'public.empezar_de_cero(uuid)', 'execute') then 0 else 1 end)
) as migracion_0086
from c;
