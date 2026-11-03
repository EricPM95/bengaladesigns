/**
 * LZ1 (C): compara la tabla de coche de Mapbox con los tiempos que traen los documentos de Lanzarote
 * (REVISION_BORRADOR_1.md «Tiempos en coche que he encontrado» y los ⚠️ de DIAS_CURADOS_LANZAROTE.md).
 * Escribe data/dias/lanzarote/_comparacion_tiempos.json y lo imprime en forma de tabla markdown.
 * Cuadra = dentro de ±5 min o ±20 % del dato del documento (o dentro de su rango).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drive, km } from './calcularDiasLanzarote.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
// [desde, hasta, mínimo del documento, máximo del documento, fuente / nota]
export const PARES = [
  ['puerto_del_carmen', 'orzola_puerto_de_la_graciosa', 43, 43, 'rome2rio'],
  ['playa_blanca', 'jameos_del_agua', 55, 55, 'rome2rio'],
  ['playa_blanca', 'mirador_del_rio', 68, 68, 'rome2rio'],
  ['teguise', 'cueva_de_los_verdes', 21, 21, 'rome2rio'],
  ['casa_museo_del_campesino', 'teguise', 7, 7, 'rome2rio (dato de taxi)'],
  ['mancha_blanca', 'caleta_de_famara_y_playa_de_famara', 20, 20, 'rome2rio (Tinajo a Famara); la estimación de Cuervo a Famara era 25-30'],
  ['volcan_del_cuervo', 'caleta_de_famara_y_playa_de_famara', 25, 30, 'estimación del documento (D5)'],
  ['caleta_de_famara_y_playa_de_famara', 'costa_teguise', 25, 25, 'rome2rio'],
  ['playa_blanca', 'costa_teguise', 36, 36, 'Wanderlog (poco fiable)'],
  ['costa_teguise', 'jardin_de_cactus', 17, 17, 'Wanderlog'],
  ['jardin_de_cactus', 'arrecife_charco_de_san_gines_y_el_paseo', 20, 20, 'blog'],
  ['el_golfo_y_el_charco_de_los_clicos', 'salinas_de_janubio', 10, 15, 'blog («menos de 15 min», no 10)'],
  ['salinas_de_janubio', 'playa_blanca_y_el_faro_de_pechiguera', 12, 12, 'blog'],
  ['salinas_de_janubio', 'arrecife_charco_de_san_gines_y_el_paseo', 35, 40, 'blog'],
  ['casa_museo_del_campesino', 'la_geria_y_sus_bodegas', 20, 20, 'La Voz de Lanzarote (Campesino a La Geria por Masdache)'],
  ['orzola_puerto_de_la_graciosa', 'mirador_del_rio', 20, 20, 'La Voz de Lanzarote'],
  ['teguise', 'mirador_de_haria', 35, 35, 'La Voz de Lanzarote (por Las Nieves; el directo puede ser menos)'],
  ['playa_blanca', 'el_golfo_y_el_charco_de_los_clicos', 20, 20, 'Splodz Blogz (blog)'],
  ['el_golfo_y_el_charco_de_los_clicos', 'arrecife_charco_de_san_gines_y_el_paseo', 30, 30, 'Splodz Blogz (blog)'],
  ['el_golfo_y_el_charco_de_los_clicos', 'volcan_del_cuervo', 15, 20, 'Splodz Blogz («algo más de 15 min»)'],
  ['arrecife', 'mancha_blanca', 20, 25, 'Ayuntamiento de Tinajo (Arrecife a Tinajo)'],
  ['playa_blanca', 'mancha_blanca', 35, 40, 'Ayuntamiento de Tinajo (Playa Blanca a Tinajo)'],
  ['montanas_del_fuego', 'la_geria_y_sus_bodegas', 25, 25, 'estimación del documento (⚠️ Islote a Stratvs)'],
  ['la_geria_y_sus_bodegas', 'los_hervideros', 25, 25, 'estimación del documento (⚠️)'],
  ['la_geria_y_sus_bodegas', 'el_golfo_y_el_charco_de_los_clicos', 20, 20, 'estimación del documento (por la LZ-704)'],
  ['fundacion_cesar_manrique', 'jardin_de_cactus', 12, 15, 'estimación del documento (⚠️)'],
  ['jardin_de_cactus', 'teguise', 15, 15, 'estimación del documento (⚠️)'],
  ['casa_museo_del_campesino', 'arrecife_charco_de_san_gines_y_el_paseo', 15, 15, 'estimación del documento (⚠️ Mozaga a Arrecife)'],
  ['mirador_del_rio', 'haria_y_la_casa_museo_cesar_manrique', 15, 15, 'estimación del documento'],
  ['haria_y_la_casa_museo_cesar_manrique', 'fundacion_cesar_manrique', 25, 25, 'estimación del documento (⚠️ Haría a Tahíche)'],
  ['caleta_de_famara_y_playa_de_famara', 'playa_de_la_garita', 25, 25, 'estimación del documento (⚠️ Famara a La Garita)'],
  ['playa_blanca', 'playas_de_papagayo', 15, 20, 'estimación del documento (por la pista; Mapbox no conoce la pista de tierra)'],
  ['mancha_blanca', 'montanas_del_fuego', 7, 7, '4,5 km (MITECO); a 4,5 km serían unos 7 min'],
  ['aeropuerto_ace', 'puerto_del_carmen', 10, 10, 'DATOS_CIVITATIS_Y_LLEGADA.md (llegar)'],
  ['aeropuerto_ace', 'costa_teguise', 13, 13, 'DATOS_CIVITATIS_Y_LLEGADA.md'],
  ['aeropuerto_ace', 'playa_blanca', 28, 28, 'DATOS_CIVITATIS_Y_LLEGADA.md'],
  ['puerto_del_carmen', 'orzola_puerto_de_la_graciosa', 43, 43, 'ídem (ya arriba)'],
]
const uniq = []
for (const p of PARES) if (!uniq.some((q) => q[0] === p[0] && q[1] === p[1])) uniq.push(p)

export function comparar() {
  return uniq.map(([a, b, lo, hi, fuente]) => {
    const mapbox = drive(a, b), k = km(a, b)
    const ok = mapbox >= Math.min(lo - 5, lo * 0.8) && mapbox <= Math.max(hi + 5, hi * 1.2)
    const dif = mapbox < lo ? mapbox - lo : mapbox > hi ? mapbox - hi : 0
    return { desde: a, hasta: b, documento: lo === hi ? `${lo}` : `${lo}-${hi}`, mapbox_min: mapbox, km: k, cuadra: ok, diferencia_min: dif, fuente }
  })
}

const NL = String.fromCharCode(10)
const nom = (id) => id.replace(/_/g, ' ')
export function seccion(r) {
  const no = r.filter((x) => !x.cuadra)
  const L = ['', '## Tiempos que no cuadran con los documentos', '']
  L.push('Se han comparado ' + r.length + ' trayectos que traen los documentos (REVISION_BORRADOR_1 y los ⚠️ de los días) con Mapbox. Cuadra = dentro de 5 min o del 20 %. **' + no.length + ' no cuadran:**', '')
  for (const x of no) L.push('- **' + nom(x.desde) + ' a ' + nom(x.hasta) + '**: el documento dice ' + x.documento + ' min y Mapbox ' + x.mapbox_min + ' min (' + x.km + ' km). ' + (x.mapbox_min > Number(x.documento.split('-').pop()) ? 'Mapbox es más lento.' : 'Mapbox es más rápido.') + ' Fuente del documento: ' + x.fuente + '.')
  L.push('', 'Lectura: en los trayectos largos hacia el norte (Playa Blanca a Jameos, a Mirador del Río, Puerto del Carmen a Órzola) Mapbox sale de 5 a 11 min más lento que rome2rio; por eso los días que rozan el tope de 3 h hay que leerlos con ese margen en contra.', '')
  L.push('### Todos los trayectos comparados', '', '| Trayecto | Documento (min) | Mapbox (min · km) | ¿Cuadra? | Fuente del documento |', '|---|---|---|---|---|')
  for (const x of r) L.push('| ' + nom(x.desde) + ' → ' + nom(x.hasta) + ' | ' + x.documento + ' | ' + x.mapbox_min + ' · ' + x.km + ' | ' + (x.cuadra ? 'sí' : '**NO** (' + (x.diferencia_min > 0 ? '+' : '') + x.diferencia_min + ')') + ' | ' + x.fuente + ' |')
  return L.join(NL) + NL
}

if (process.argv[1] && process.argv[1].endsWith('compararTiemposLanzarote.mjs')) {
  const r = comparar()
  writeFileSync(join(ROOT, 'data/dias/lanzarote/_comparacion_tiempos.json'), JSON.stringify(r, null, 1) + NL)
  const inf = join(ROOT, 'docs/destinos/lanzarote/INFORME_DIAS_MAPBOX.md')
  let md = readFileSync(inf, 'utf8')
  const k = md.indexOf(NL + '## Tiempos que no cuadran')
  if (k >= 0) md = md.slice(0, k) + NL
  writeFileSync(inf, md.replace(/\n+$/, NL) + seccion(r))
  console.log(r.length + ' trayectos, ' + r.filter((x) => !x.cuadra).length + ' no cuadran')
}
