-- 0072 · EMPEZAR DE CERO NO DEVUELVE LAS PRUEBAS GASTADAS (Tanda 10S7). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0072.sql.
--
-- Hasta la 0071, `empezar_de_cero` borraba `hoy_prueba` (el día de prueba de HOY, «una por cuenta, para siempre») y `historia_de_prueba` (la historia de prueba de cada destino): cualquiera podía gastar su prueba, empezar de cero y tenerla otra vez, sin fin.
-- Decisión de Eric (31-oct): las pruebas gastadas se quedan SIEMPRE. Esta migración NO edita ninguna anterior: vuelve a crear la función con `create or replace`, partiendo de su ÚLTIMA versión (la de la 0071: 0032 → 0037 → 0040 → 0071) e idéntica a ella salvo DOS líneas menos en el inventario: ('hoy_prueba', 'user_id') y ('historia_de_prueba', 'user_id'). Todo lo demás (orden, traspaso de lo compartido, permisos) queda igual.
-- (`hoy_prueba.trip_id` es `on delete set null` (0031): al borrar los viajes, la prueba gastada solo pierde la referencia al viaje y se queda.) Las filas de OTRAS personas no se tocan, como antes.
-- Cada vez que se cree una tabla con datos de una persona, hay que añadirla en una migración nueva igual (partiendo de la última versión de la función: ahora la 0072) y en el inventario de scripts/destino/pruebaTanda10J.mjs.
begin;

create or replace function public.empezar_de_cero(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_res jsonb := '{}'::jsonb;
  v_n integer;
  v_par record;
  v_traspaso jsonb;
begin
  if p_uid is null then raise exception 'Falta la cuenta.'; end if;
  if not exists (select 1 from auth.users where id = p_uid) then raise exception 'Esa cuenta no existe.'; end if;

  -- 1. Lo compartido pasa a los demás antes de borrar nada.
  v_traspaso := public.preparar_borrado(p_uid);

  -- 2. Lo de la cuenta, tabla a tabla y siempre por su columna de dueño. Las dependencias van antes que de lo que dependen (los viajes, de los últimos).
  for v_par in
    select * from (values
      ('stop_visits', 'user_id'),
      ('trip_photo_meta', 'user_id'),
      ('trip_photos', 'user_id'),
      ('logro_hechos', 'user_id'),
      ('achievements', 'user_id'),
      ('logro_avisos', 'user_id'),
      ('logro_perfil', 'user_id'),
      ('push_suscripciones', 'user_id'),
      ('logro_referidos', 'invitador_id'),
      ('avisos', 'user_id'),
      ('avisos_destino', 'user_id'),
      ('place_likes', 'user_id'),
      ('admin_sin_pase', 'user_id'),
      ('trip_recommendations', 'author_id'),
      ('trip_gastos', 'autor_id'),
      ('trip_pagos', 'marcado_por'),
      ('trip_invitations', 'creada_por'),
      ('trip_members', 'user_id'),
      ('trip_ex_miembros', 'user_id'),
      ('pass_members', 'user_id'),
      ('passes', 'comprador_id'),
      ('billetes_personales', 'user_id'),
      ('lo_suyo_del_viaje', 'user_id'),
      ('reservas_invitado', 'user_id'),
      ('reservas_privadas_admin', 'user_id'),
      ('trips', 'traveler_id'),
      ('fotos_por_borrar', 'user_id')
    ) as t (tabla, columna)
  loop
    if to_regclass('public.' || v_par.tabla) is not null then
      execute format('delete from public.%I where %I = $1', v_par.tabla, v_par.columna) using p_uid;
      get diagnostics v_n = row_count;
      v_res := v_res || jsonb_build_object(v_par.tabla, v_n);
    end if;
  end loop;

  return jsonb_build_object('borrados', v_res, 'traspasado', v_traspaso);
end $$;

revoke all on function public.empezar_de_cero(uuid) from public, anon, authenticated;
grant execute on function public.empezar_de_cero(uuid) to service_role;

commit;
