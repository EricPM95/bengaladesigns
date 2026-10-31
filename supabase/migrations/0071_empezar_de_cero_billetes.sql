-- 0071 · EMPEZAR DE CERO TAMBIÉN BORRA EL BILLETE (Tanda 10S5). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0071.sql.
--
-- La 0070 creó `billetes_personales` (el billete de cada persona, privado) y no estaba en el inventario de `empezar_de_cero`: al empezar de cero, los billetes de esa cuenta se quedaban.
-- Esta migración NO edita ninguna anterior: vuelve a crear la función con `create or replace`, partiendo de su ÚLTIMA versión (la de la 0040: 0032 → 0037 → 0040), idéntica salvo TRES cosas: (1) CINCO líneas nuevas en el inventario, siempre con `columna = uid`: ('billetes_personales', 'user_id') (0070) y cuatro tablas que ninguna versión anterior borraba y que destapó pruebaTanda10J (Eric las pidió el 31-oct): `lo_suyo_del_viaje` (0049), `reservas_invitado` (0038), `reservas_privadas_admin` (0062/0064) e `historia_de_prueba` (0033); y (2) `trip_ex_miembros` pasa a borrarse DESPUÉS de `trip_members`: al borrar la fila de `trip_members` de la cuenta, el disparador `recordar_ex_miembro` (0040) vuelve a apuntarla como ex miembro, y con el orden de la 0040 esa fila se quedaba en los viajes compartidos (la detectó pruebaTanda10J).
-- (Si alguna tabla aún no existe —la 0070, por ejemplo—, se salta sola: la función comprueba `to_regclass` antes de borrar.) Los billetes de OTRAS personas no se tocan.
-- Cada vez que se cree una tabla con datos de una persona, hay que añadirla en una migración nueva igual (partiendo de la última versión de la función) y en el inventario de scripts/destino/pruebaTanda10J.mjs.

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
      ('hoy_prueba', 'user_id'),
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
      ('historia_de_prueba', 'user_id'),
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
