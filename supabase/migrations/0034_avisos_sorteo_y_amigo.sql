-- 0034 · LOS AVISOS DEL SORTEO Y DEL AMIGO (Tanda 10P, apartados 1.5 y 1.6). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
--
-- Qué hace, en palabras sencillas: la campanita (`public.avisos`, migración 0026) solo admitía siete tipos de aviso. Esta migración añade dos:
--   * `sorteo`       el aviso dorado del día que alguien entra en el sorteo: «¡Ya estás en el sorteo de 2027!». Una sola vez por año (la clave del aviso es `sorteo:2027`).
--   * `amigo_viaje`  el de quien invita: «Ana ha hecho su primer viaje con HOY: +200 EXP». Una sola vez por amigo (la clave es `amigo:<id del amigo>`).
-- No crea tablas ni columnas nuevas: las invitaciones siguen en `logro_referidos` (0025/0026) y la EXP se calcula siempre desde ahí (server/logros/exp.js).
--
-- SI NO SE APLICA: la EXP por invitar y el sorteo funcionan igual (el billete, la página y el panel de Eric); solo faltan los dos avisos de la campanita (el servidor lo avisa en su registro
-- y sigue sin romper nada).
--
-- «EMPEZAR DE CERO» (0032): `avisos` ya está en su lista (se borra por `user_id`) y `logro_referidos` ya se trata ahí, así que esta migración no necesita tocar la 0032.

begin;

alter table public.avisos drop constraint if exists avisos_tipo_check;
alter table public.avisos
  add constraint avisos_tipo_check
  check (tipo in ('recomendacion', 'aceptada', 'rechazada', 'unido', 'd10', 'resumen', 'sorpresas', 'sorteo', 'amigo_viaje'));

commit;
