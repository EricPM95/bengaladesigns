-- Comprueba la migración 0082 (El Golfo y Famara, un solo sitio cada uno). UNA sola fila: todos los números deben ser 0.
select jsonb_build_object(
  'hechos_con_id_viejo', (select count(*) from public.logro_hechos where destino = 'lanzarote' and sitio in ('el_golfo_pueblo', 'charco_de_los_clicos', 'caleta_de_famara', 'playa_de_famara') and deshecho_en is null),
  'pedazos_con_id_viejo', (select count(*) from public.achievements where destino = 'lanzarote' and logro = 'pedazo' and (escalon like '%:el_golfo_pueblo' or escalon like '%:charco_de_los_clicos' or escalon like '%:caleta_de_famara' or escalon like '%:playa_de_famara'))
) as resultado;
