-- Tanda V16 (3b): El Golfo y el Charco de los Clicos, y la Caleta y la Playa de Famara, vuelven a ser UN solo sitio cada uno. SIN APLICAR: la aplica Eric.
--
-- Lo que ya tenía alguien con los ids viejos pasa al sitio nuevo, sin perder ni duplicar nada:
--   · logro_hechos.sitio:  el_golfo_pueblo y charco_de_los_clicos  → el_golfo_y_el_charco_de_los_clicos
--                          caleta_de_famara y playa_de_famara      → caleta_de_famara_y_playa_de_famara
--   · achievements (los pedazos «colección:sitio»): lo mismo dentro del escalón. Primero se ponen los nuevos (sin pisar los que ya existan) y después se borran los viejos.
--   · El emblema «El charco verde» no cambia (su id es «el_golfo»).
-- Un «Visto» sin parada guardado con DOS ids viejos del mismo viaje no se puede juntar (chocaría con su índice único): se queda como está y sale contado en `visto_sin_pasar`.
-- Devuelve UNA sola fila con lo que ha hecho.

begin;

create temp table _v16_mapa (viejo text primary key, nuevo text not null) on commit drop;
insert into _v16_mapa values
  ('el_golfo_pueblo', 'el_golfo_y_el_charco_de_los_clicos'),
  ('charco_de_los_clicos', 'el_golfo_y_el_charco_de_los_clicos'),
  ('caleta_de_famara', 'caleta_de_famara_y_playa_de_famara'),
  ('playa_de_famara', 'caleta_de_famara_y_playa_de_famara');

create temp table _v16_cuenta (hechos_pasados int, pedazos_nuevos int, pedazos_viejos_borrados int, visto_sin_pasar int) on commit drop;
insert into _v16_cuenta values (0, 0, 0, 0);

-- 1. Los hechos (fotos y Vistos con parada).
with pasados as (
  update public.logro_hechos h set sitio = m.nuevo
  from _v16_mapa m
  where h.destino = 'lanzarote' and h.sitio = m.viejo and (h.tipo = 'foto' or h.stop_id is not null)
  returning h.id
)
update _v16_cuenta set hechos_pasados = (select count(*) from pasados);

-- 2. Los pedazos ganados: se crean con el sitio nuevo (sin pisar los que ya existan)…
with nuevos as (
  insert into public.achievements (user_id, logro, escalon, destino, trip_id, ganado_en, animacion_vista, frase, detalle)
  select a.user_id, a.logro, split_part(a.escalon, ':', 1) || ':' || m.nuevo, a.destino, a.trip_id, a.ganado_en, a.animacion_vista, a.frase, a.detalle
  from public.achievements a
  join _v16_mapa m on a.escalon like '%:' || m.viejo
  where a.destino = 'lanzarote' and a.logro = 'pedazo'
  on conflict (user_id, destino, logro, escalon) do nothing
  returning id
)
update _v16_cuenta set pedazos_nuevos = (select count(*) from nuevos);

-- …y los viejos se borran.
with borrados as (
  delete from public.achievements a
  using _v16_mapa m
  where a.destino = 'lanzarote' and a.logro = 'pedazo' and a.escalon like '%:' || m.viejo
  returning a.id
)
update _v16_cuenta set pedazos_viejos_borrados = (select count(*) from borrados);

-- 3. Los Vistos sin parada que no se han podido pasar.
update _v16_cuenta set visto_sin_pasar = (
  select count(*) from public.logro_hechos h join _v16_mapa m on h.sitio = m.viejo
  where h.destino = 'lanzarote' and h.tipo = 'visto' and h.stop_id is null and h.deshecho_en is null
);

select jsonb_build_object('hechos_pasados', hechos_pasados, 'pedazos_nuevos', pedazos_nuevos, 'pedazos_viejos_borrados', pedazos_viejos_borrados, 'visto_sin_pasar', visto_sin_pasar) as resultado from _v16_cuenta;

commit;
