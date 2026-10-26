-- 0035 · LOS AVISOS NUEVOS DE LA TANDA 10N (viaje compartido, propuesta, reservas y presupuesto). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0034 (esta incluye los tipos de la 0034).
--
-- Qué hace, en palabras sencillas: la campanita (`public.avisos`, migración 0026) solo admite unos tipos de aviso. Esta migración deja TODOS los de la Tanda 10N de una vez (así ninguna otra migración de la
-- tanda tiene que tocar la lista):
--   * `permiso`        a quien le cambian el permiso: «Eric te ha dado permiso para editar el viaje a Roma».
--   * `quitado`        a quien quitan del viaje: «Ya no formas parte del viaje a Roma».
--   * `viaje_cambiado` a los del viaje cuando el dueño o quien puede editar cambia la ruta: «Eric ha cambiado el viaje: ha quitado 2 días».
--   * `sin_enviar`     al invitado, el día antes del viaje: «Tienes 2 cambios sin enviar a Eric».
--   * `reserva_grupo`  una entrada que el dueño compra para varios: «Eric ha reservado el Coliseo para ti: jueves 26, 8:00».
--   * `gasto_pendiente` al dueño (y a quien puede editar): «Ana quiere añadir al presupuesto».
--   * `gasto_resuelto` a quien añadió el gasto: «Eric ha aceptado tu gasto…» o «…ha preferido no sumar tu gasto…».
-- Las propuestas del invitado siguen usando los tipos que ya existen (`recomendacion`, `aceptada`, `rechazada`).
--
-- SI NO SE APLICA: todo funciona igual (el servidor lo avisa en su registro y no rompe nada), pero esos avisos no salen en la campanita.

begin;

alter table public.avisos drop constraint if exists avisos_tipo_check;
alter table public.avisos
  add constraint avisos_tipo_check
  check (tipo in ('recomendacion', 'aceptada', 'rechazada', 'unido', 'd10', 'resumen', 'sorpresas', 'sorteo', 'amigo_viaje',
                  'permiso', 'quitado', 'viaje_cambiado', 'sin_enviar', 'reserva_grupo', 'gasto_pendiente', 'gasto_resuelto'));

commit;
