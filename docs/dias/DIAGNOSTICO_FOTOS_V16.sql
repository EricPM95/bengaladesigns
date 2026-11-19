-- V16 (punto 1): cuántos hechos con foto hay, cuántos tienen su foto unida y cuántos se podrán unir solos. SOLO LECTURA (select). UNA sola fila.
-- «Se podrán unir» = hay UNA sola foto de la misma persona con la misma fecha y hora de cámara (± 1 s): es lo que hace el servidor al abrir la app (`unirFotos`).
with sin as (
  select h.id, h.user_id, h.instante from public.logro_hechos h where h.tipo = 'foto' and h.foto_id is null and h.deshecho_en is null
),
cuadra as (
  select s.id, count(distinct m.photo_id) as fotos
  from sin s left join public.trip_photo_meta m on m.user_id = s.user_id and m.taken_at is not null and abs(extract(epoch from (m.taken_at - s.instante))) < 1
  group by s.id
)
select jsonb_build_object(
  'hechos_con_foto', (select count(*) from public.logro_hechos where tipo = 'foto' and deshecho_en is null),
  'con_foto_id', (select count(*) from public.logro_hechos where tipo = 'foto' and deshecho_en is null and foto_id is not null),
  'sin_foto_id', (select count(*) from sin),
  'se_unen_solos', (select count(*) from cuadra where fotos = 1),
  'sin_ninguna_foto_que_cuadre', (select count(*) from cuadra where fotos = 0),
  'con_dudas_varias_fotos', (select count(*) from cuadra where fotos > 1),
  'fotos_en_el_album', (select count(*) from public.trip_photos),
  'fotos_con_fecha_de_camara', (select count(*) from public.trip_photo_meta where taken_at is not null)
) as resultado;
