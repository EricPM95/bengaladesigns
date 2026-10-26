-- 0032 · EMPEZAR DE CERO (Tanda 10J). Deja una cuenta como recién creada: borra, en UNA transacción, todo lo que cuelga de ESA cuenta y nada más. La cuenta (`auth.users`) y su ficha
-- (`travelers`: nombre, email, foto del perfil, zona) se quedan. Solo la llama el servidor, con la clave de servicio, y solo para la cuenta de administrador (LOGROS_ADMIN_EMAILS lo comprueba el servidor
-- antes de llegar aquí). El móvil no puede llamarla: sin permisos para anon ni authenticated.
--
-- Se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir: no duplica nada). SIN ella, el botón [Empezar de cero] dice «No se ha podido» y no se borra nada.
-- Necesita la 0021 (`preparar_borrado`). Las tablas de migraciones que aún no estén aplicadas se saltan solas.
--
-- QUÉ HACE, EN ORDEN
--   1. `preparar_borrado(uid)` (la misma regla que al borrar una cuenta): un viaje con invitados pasa a administrarlo el invitado que entró primero; un pase con otras personas se queda con ellas.
--      Así NUNCA se borra nada de otra cuenta. (Solo si la cuenta usaba el pase de OTRA persona, a esa persona le baja una plaza: lo mismo que ya pasa al borrar una cuenta.)
--   2. Se borran las filas de la cuenta, siempre con `columna = uid` (nunca por un filtro amplio): vistos, fotos y sus anotaciones, hechos / logros / avisos / EXP, suscripción a los avisos, día de
--      prueba, invitaciones que hizo a amigos (lo suyo como INVITADOR), campanita, «avísame cuando llegue», «me gusta», recomendaciones e invitaciones de viaje que creó,
--      su sitio en viajes y pases de otros, los pases que compró y los viajes que son suyos (con sus reservas, entradas, vuelos y alojamientos, que viven dentro de la fila del viaje).
--   3. NO se tocan (Tanda 10N): el interruptor «sin pase» (`admin_sin_pase`: es un ajuste de las pruebas, no algo de la cuenta), la cuenta, `travelers`, `invitaciones_app` (su enlace para invitar), `logro_referidos` donde ella es la INVITADA (es el registro de quien la invitó), `pagos_registro`
--      (el registro de los cobros: no cuelga de ninguna cuenta y no se borra nunca), nada de Stripe, ni nada de otra cuenta.
-- Los archivos de las fotos (Storage) no se pueden borrar desde SQL: los borra el servidor.

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
      ('trip_recommendations', 'author_id'),
      ('trip_invitations', 'creada_por'),
      ('trip_members', 'user_id'),
      ('pass_members', 'user_id'),
      ('passes', 'comprador_id'),
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
