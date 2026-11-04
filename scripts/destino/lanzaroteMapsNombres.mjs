// LZ3b: a cada sitio de Lanzarote le pone `maps_consulta` («Jameos del Agua, Haría»: Maps lo busca por su nombre y su pueblo y lleva donde ellos saben) o `maps_por_coordenada: true` (nombre ambiguo o que Maps no conoce: se abre nuestra coordenada).
//   node scripts/destino/lanzaroteMapsNombres.mjs
import fs from 'node:fs'
const f = 'data/pipeline_v2/lanzarote.json'
const d = JSON.parse(fs.readFileSync(f, 'utf8'))
const NOMBRE = {
  montanas_del_fuego: 'Parque Nacional de Timanfaya, Yaiza',
  jameos_del_agua: 'Jameos del Agua, Haría',
  cueva_de_los_verdes: 'Cueva de los Verdes, Haría',
  mirador_del_rio: 'Mirador del Río, Haría',
  fundacion_cesar_manrique: 'Fundación César Manrique, Tahíche',
  el_golfo_y_el_charco_de_los_clicos: 'Charco de los Clicos, El Golfo, Yaiza',
  playas_de_papagayo: 'Playa de Papagayo, Yaiza',
  jardin_de_cactus: 'Jardín de Cactus, Guatiza',
  los_hervideros: 'Los Hervideros, Yaiza',
  salinas_de_janubio: 'Salinas de Janubio, Yaiza',
  teguise: 'Villa de Teguise, Lanzarote',
  haria_y_la_casa_museo_cesar_manrique: 'Casa-Museo César Manrique, Haría',
  casa_museo_del_campesino: 'Casa Museo del Campesino, Mozaga',
  caleta_de_famara_y_playa_de_famara: 'Caleta de Famara, Teguise',
  arrecife_charco_de_san_gines_y_el_paseo: 'Charco de San Ginés, Arrecife',
  castillo_de_san_jose: 'Castillo de San José, Arrecife',
  lagomar: 'LagOmar, Nazaret, Teguise',
  ermita_de_las_nieves: 'Ermita de las Nieves, Teguise',
  mirador_de_guinate: 'Mirador de Guinate, Haría',
  castillo_de_santa_barbara: 'Castillo de Santa Bárbara, Teguise',
  punta_mujeres_y_arrieta: 'Arrieta, Haría',
  playa_de_la_garita: 'Playa de La Garita, Arrieta, Haría',
  puerto_del_carmen_puerto_viejo: 'Puerto Viejo, Puerto del Carmen, Tías',
  volcan_del_cuervo: 'Volcán del Cuervo, Tinajo',
  caldera_blanca: 'Caldera Blanca, Tinajo',
}
// Los que van por coordenada (nombre ambiguo o que Maps no conoce): la lista que se le da a Eric.
const COORDENADA = ['la_geria_y_sus_bodegas', 'caleton_blanco', 'ciudad_estratificada_rofera_de_teseguite', 'playa_de_montana_bermeja', 'las_grietas_montana_blanca', 'mirador_del_bosquecillo', 'mirador_de_haria', 'mirador_de_los_helechos', 'playa_blanca_y_el_faro_de_pechiguera']
for (const p of d.places) {
  delete p.maps_consulta
  delete p.maps_por_coordenada
  if (NOMBRE[p.id]) p.maps_consulta = NOMBRE[p.id]
  else if (COORDENADA.includes(p.id)) p.maps_por_coordenada = true
  else throw new Error('sitio sin decidir: ' + p.id)
}
fs.writeFileSync(f, JSON.stringify(d, null, 1) + '\n')
console.log(`${Object.keys(NOMBRE).length} por nombre, ${COORDENADA.length} por coordenada`)
