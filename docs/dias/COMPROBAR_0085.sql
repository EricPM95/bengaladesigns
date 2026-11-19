-- Comprobación de la migración 0085 («Cuéntanos», V20). Pégala en el SQL editor de Supabase: devuelve UNA fila con un solo jsonb.
-- `aplicada` tiene que ser true y `faltan` 0 (la lista `que_falta` dice qué cosa falta si no).
with c as (
  select
    (to_regclass('public.avisos_de_viajeros') is not null) as tabla,
    coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.avisos_de_viajeros')), false) as rls,
    (select count(*) from pg_policies where schemaname = 'public' and tablename = 'avisos_de_viajeros') as politicas,
    (select count(*) from storage.buckets where id = 'avisos-viajeros' and public = false) as almacen_privado,
    (select count(*) from storage.buckets where id = 'fotos-de-viajeros' and public = true) as almacen_publico,
    (select count(*) from pg_constraint where conname = 'avisos_tipo_check' and pg_get_constraintdef(oid) like '%gracias_viajero%') as tipo_campana,
    (select count(*) from unnest(array[
      'public.aviso_viajero_guardar(jsonb)', 'public.avisos_viajeros_listar(text, text, text, integer)', 'public.aviso_viajero_obtener(uuid)', 'public.aviso_viajero_marcar(uuid, text, text)',
      'public.avisos_viajeros_destinos()', 'public.avisos_viajeros_ya_esta(text, text)', 'public.aviso_viajero_foto_usada(uuid, jsonb)', 'public.fotos_de_viajeros(text)']) f
      where to_regprocedure(f) is not null and has_function_privilege('service_role', to_regprocedure(f), 'execute')
        and not has_function_privilege('anon', to_regprocedure(f), 'execute') and not has_function_privilege('authenticated', to_regprocedure(f), 'execute')) as funciones_bien
)
select jsonb_build_object(
  'aplicada', (tabla and rls and politicas = 0 and almacen_privado = 1 and almacen_publico = 1 and tipo_campana = 1 and funciones_bien = 8),
  'faltan', (case when tabla then 0 else 1 end) + (case when rls then 0 else 1 end) + politicas + (1 - almacen_privado) + (1 - almacen_publico) + (1 - tipo_campana) + (8 - funciones_bien),
  'que_falta', to_jsonb(array_remove(array[
    case when not tabla then 'tabla' end, case when not rls then 'rls' end, case when politicas > 0 then 'politicas (no debe haber)' end,
    case when almacen_privado <> 1 then 'almacen avisos-viajeros privado' end, case when almacen_publico <> 1 then 'almacen fotos-de-viajeros publico' end,
    case when tipo_campana <> 1 then 'tipo gracias_viajero en la campana' end, case when funciones_bien <> 8 then 'funciones (solo service_role)' end], null))
) as migracion_0085
from c;
