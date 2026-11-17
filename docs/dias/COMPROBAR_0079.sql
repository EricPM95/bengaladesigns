-- Comprobación de la migración 0079 (Lanzarote: los «dos en uno» separados, tanda V4). Pégala en el SQL editor de Supabase. Solo LEE.
--
-- ANTES de aplicar la 0079 (para saber cuántos pedazos se convertirán): la primera consulta cuenta las filas viejas por colección y sitio, y las personas distintas.
select escalon as pedazo_viejo, count(*) as filas, count(distinct user_id) as personas
from public.achievements
where logro = 'pedazo' and destino = 'lanzarote'
  and escalon in (
    'pueblos_con_alma:caleta_de_famara_y_playa_de_famara', 'playas_y_charcos:caleta_de_famara_y_playa_de_famara',
    'pueblos_con_alma:el_golfo_y_el_charco_de_los_clicos', 'playas_y_charcos:el_golfo_y_el_charco_de_los_clicos', 'lz_imprescindibles:el_golfo_y_el_charco_de_los_clicos',
    'pueblos_con_alma:haria_y_la_casa_museo_cesar_manrique', 'cesar_manrique:haria_y_la_casa_museo_cesar_manrique')
group by escalon
order by escalon;

-- DESPUÉS de aplicarla: devuelve «Aplicada» si ya no queda ninguna fila vieja, o «FALTA» si queda alguna.
select case
  when not exists (
    select 1 from public.achievements
    where logro = 'pedazo' and destino = 'lanzarote'
      and escalon in (
        'pueblos_con_alma:caleta_de_famara_y_playa_de_famara', 'playas_y_charcos:caleta_de_famara_y_playa_de_famara',
        'pueblos_con_alma:el_golfo_y_el_charco_de_los_clicos', 'playas_y_charcos:el_golfo_y_el_charco_de_los_clicos', 'lz_imprescindibles:el_golfo_y_el_charco_de_los_clicos',
        'pueblos_con_alma:haria_y_la_casa_museo_cesar_manrique', 'cesar_manrique:haria_y_la_casa_museo_cesar_manrique'))
  then 'Aplicada'
  else 'FALTA'
end as migracion_0079;
