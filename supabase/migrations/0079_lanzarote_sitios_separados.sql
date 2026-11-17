-- 0079 · LANZAROTE: LOS «DOS EN UNO» SE SEPARAN (tanda V4, 17-nov). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0079.sql
--
-- Qué cambia en los datos (data/logros/lanzarote.json): tres sitios de logro que eran «dos en uno» pasan a ser dos sitios cada uno:
--   caleta_de_famara_y_playa_de_famara  → caleta_de_famara (Pueblos con alma) + playa_de_famara (Playas y charcos)
--   el_golfo_y_el_charco_de_los_clicos  → el_golfo_pueblo (Pueblos con alma) + charco_de_los_clicos (Playas y charcos, Los imprescindibles)
--   haria_y_la_casa_museo_cesar_manrique → haria_pueblo (Pueblos con alma) + casa_museo_cesar_manrique (La Lanzarote de César Manrique)
--
-- Qué hace esta migración: a quien ya tenía el pedazo del sitio viejo en una colección le da el pedazo del sitio nuevo que está en ESA colección, con la misma fecha y el mismo viaje
-- (y la animación ya vista: no sale ninguna sorpresa nueva), y borra la fila vieja. Como el sitio viejo estaba en cada colección una vez, cada fila vieja se convierte en una nueva: nadie pierde nada.
-- Los hechos (`logro_hechos`) NO se tocan: el servidor ya cuenta un hecho con el id viejo para los dos sitios nuevos (`sitios_de_parada` de data/logros/lanzarote.json), así que si alguien
-- vuelve a calcular (`recalcular`), sale lo mismo. No crea tablas: nada que añadir a `empezar_de_cero`.
-- Las colecciones que ya estaban completas (Pueblos con alma con 5 sitios) siguen ganadas: lo ganado no se quita aunque ahora tengan más sitios.
begin;

create temporary table _sitios_separados (viejo text primary key, nuevo text not null) on commit drop;
insert into _sitios_separados (viejo, nuevo) values
  ('pueblos_con_alma:caleta_de_famara_y_playa_de_famara',       'pueblos_con_alma:caleta_de_famara'),
  ('playas_y_charcos:caleta_de_famara_y_playa_de_famara',       'playas_y_charcos:playa_de_famara'),
  ('pueblos_con_alma:el_golfo_y_el_charco_de_los_clicos',       'pueblos_con_alma:el_golfo_pueblo'),
  ('playas_y_charcos:el_golfo_y_el_charco_de_los_clicos',       'playas_y_charcos:charco_de_los_clicos'),
  ('lz_imprescindibles:el_golfo_y_el_charco_de_los_clicos',     'lz_imprescindibles:charco_de_los_clicos'),
  ('pueblos_con_alma:haria_y_la_casa_museo_cesar_manrique',     'pueblos_con_alma:haria_pueblo'),
  ('cesar_manrique:haria_y_la_casa_museo_cesar_manrique',       'cesar_manrique:casa_museo_cesar_manrique');

-- 1. El pedazo nuevo, con la fecha y el viaje del viejo.
insert into public.achievements (user_id, logro, escalon, destino, trip_id, ganado_en, animacion_vista)
select a.user_id, 'pedazo', m.nuevo, a.destino, a.trip_id, a.ganado_en, true
from public.achievements a
join _sitios_separados m on m.viejo = a.escalon
where a.logro = 'pedazo' and a.destino = 'lanzarote'
on conflict (user_id, destino, logro, escalon) do nothing;

-- 2. La fila vieja ya no tiene dueño en los datos: fuera.
delete from public.achievements a
using _sitios_separados m
where a.logro = 'pedazo' and a.destino = 'lanzarote' and a.escalon = m.viejo;

commit;
