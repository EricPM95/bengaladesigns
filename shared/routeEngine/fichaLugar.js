/**
 * Lo que la ficha de un lugar saca de los datos del destino (Tanda 6y4), sin escribir ningún nombre de sitio en el código:
 *  · `etiquetasDeBarrio`: la etiqueta de barrio («Trastevere») de cada lugar cuya ZONA la lleva (`zones[zona].etiqueta_barrio`). Un lugar de otra zona no lleva nada.
 *  · `sinEntradaDe` / `sinEntradaPorSitio`: el bloque «No necesitas entrada» de un sitio que no vende entrada pero cobra por acercarse (`entrada_de_pago` del lugar, p. ej. la tasa de la Fontana
 *    de Trevi). Los importes y horarios salen SOLO de los campos del dato (comprobados con la fuente oficial al curarlo); sin un campo, esa parte no se escribe. Sin `entrada_de_pago`, null.
 */

import { titulosDePaseoLibre } from './sitios.js'

const quitaCero =(hhmm) => String(hhmm).replace(/^0/, '')
const mayuscula = (texto) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto)

/** «lunes» → «los lunes»; «lunes y viernes» (dos) o «lunes, martes y viernes» (más). */
function losDias(dias) {
  const lista = dias.map((dia) => String(dia))
  const unidos = lista.length > 1 ? `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}` : (lista[0] ?? '')
  return `los ${unidos}`
}

/** El mapa nombre de lugar → etiqueta de barrio, de los lugares cuya zona tiene `etiqueta_barrio`. */
export function etiquetasDeBarrio(data) {
  const resultado = {}
  const zonas = data?.zones ?? {}
  for (const place of data?.places ?? []) {
    const etiqueta = zonas[place.zone]?.etiqueta_barrio
    if (typeof etiqueta === 'string' && etiqueta.trim() && place.name) resultado[place.name] = etiqueta.trim()
  }
  // (Tanda 6y5) El paseo de la zona lleva la etiqueta de su zona, igual que sus lugares: el paseo por barrio («Pasear por Trastevere») y el paseo libre («Pasea y piérdete por Trastevere»,
  // y su versión iluminada). Los restaurantes no: no están en `places` ni en los paseos.
  const etiquetaDe = (zona) => {
    const etiqueta = zonas[zona]?.etiqueta_barrio
    return typeof etiqueta === 'string' && etiqueta.trim() ? etiqueta.trim() : null
  }
  for (const walk of data?.zone_walks ?? []) {
    const etiqueta = etiquetaDe(walk.zone)
    if (etiqueta && walk.name) resultado[walk.name] = etiqueta
  }
  for (const [zona, config] of Object.entries(data?.destination_config?.paseo_libre?.zonas ?? {})) {
    const etiqueta = etiquetaDe(zona)
    if (etiqueta && config?.nombre) for (const titulo of titulosDePaseoLibre(config)) resultado[titulo] = etiqueta
  }
  return resultado
}

/**
 * El bloque «No necesitas entrada» de un lugar: `{ titulo, libre, concepto, precio, detalle }`. `precio` es null si el dato no lo trae; `detalle` junta solo lo que el dato dice
 * (horario de pago, días que abren más tarde, última entrada, quién no paga, cómo se paga). null si el lugar no cobra por acercarse.
 */
export function sinEntradaDe(place) {
  const pago = place?.entrada_de_pago
  if (!pago || typeof pago !== 'object') return null
  const [abre, cierra] = String(pago.horario_de_pago ?? '').split('-')
  const partes = []
  if (abre && cierra) {
    const tarde = pago.viernes_desde ? ` (${pago.desde_tarde_dias?.length ? losDias(pago.desde_tarde_dias) : 'los viernes'}, desde las ${quitaCero(pago.viernes_desde)})` : ''
    partes.push(`De ${quitaCero(abre)} a ${quitaCero(cierra)}${tarde}.`)
  }
  if (pago.ultima_entrada) partes.push(`Última entrada a las ${quitaCero(pago.ultima_entrada)}.`)
  if (pago.gratis) partes.push(`Gratis ${pago.gratis}.`)
  if (pago.como_se_paga) partes.push(`${mayuscula(`se paga ${pago.como_se_paga}`)}.`)
  return {
    titulo: pago.titulo ?? mayuscula(pago.que ?? '') ?? null,
    libre: pago.libre ?? null,
    concepto: pago.que ?? null,
    precio: pago.precio ?? null,
    detalle: partes.join(' ') || null,
  }
}

/** El mapa nombre de lugar → bloque «No necesitas entrada», de los lugares con `entrada_de_pago`. */
export function sinEntradaPorSitio(data) {
  const resultado = {}
  for (const place of data?.places ?? []) {
    const bloque = sinEntradaDe(place)
    if (bloque && place.name) resultado[place.name] = bloque
  }
  return resultado
}
