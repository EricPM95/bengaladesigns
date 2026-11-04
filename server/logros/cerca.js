/**
 * LO QUE HAY CERCA DE DONDE ESTÁ EL VIAJERO (Tanda HOY1, agente B). Funciones puras: las usa el servicio de logros y la prueba.
 *
 * Tres usos, todos con la ubicación del momento (que solo se usa para decidir; nunca se guarda):
 *   1. La cámara de viaje (K2/K3): una foto sin parada. El servidor mira si el viajero está dentro del radio de algún sitio con logro (esté o no en su ruta,
 *      incluidos los `sitios_extra` como La Graciosa) y la foto cuenta para ese sitio; si no hay ninguno, la foto solo es un recuerdo.
 *   2. «Cerca de ti» fuera de ruta (H8, H8b): sitios con algo por ganar que no están en la ruta de hoy.
 *   3. El juego (C16, C17): «Algo brilla cerca de aquí…» a ~500 m del borde del sitio, «Más cerca…» a ~150 m, y la pantalla de siempre al llegar.
 * El radio de cada sitio es el de los logros (`radio_m` de data/logros/<destino>.json); las distancias de aviso se cuentan desde el BORDE del radio
 * (Timanfaya tiene 2,5 km de radio: sin eso «a 150 m» nunca llegaría a decirse antes de estar dentro).
 */

import { conArticulo } from './articulos.js'
import { coordenadasDeSitio, nombreDeSitio } from './datos.js'
import { metros } from './fotos.js'
import { clave } from './motor.js'

/** Distancias del juego, contadas desde el borde del radio del sitio. */
export const METROS_BRILLA = 500
export const METROS_MAS_CERCA = 150
/**
 * Los sitios «isla entera» o «parque nacional» tienen radios de 2,5 km para que la foto valga en cualquier punto (La Graciosa, Timanfaya). Para ADIVINAR dónde estás (los avisos de aquí y la foto sin parada) eso no sirve:
 * desde el Mirador del Río, mirando a La Graciosa a 2,4 km, no estás «en La Graciosa». Aquí el radio se recorta a esto.
 */
export const RADIO_MAXIMO_AVISO_M = 800

/** Un sitio fuera de ruta con algo por ganar «se pasa al lado» (H8b) a menos de esto del borde de su radio. */
export const METROS_JUNTO_A = 150

/** Los ids de sitio que tienen algo que ver con los logros de un destino (datos propios, colección o emblema de sitio). */
export function sitiosConLogro(d) {
  const ids = new Set(Object.keys(d.sitios ?? {}))
  for (const c of d.colecciones ?? []) for (const s of c.sitios ?? []) ids.add(s)
  for (const e of d.emblemas ?? []) if (e.sitio) ids.add(e.sitio)
  return [...ids]
}

/**
 * Lo que tiene un sitio por ganar, dado lo ya ganado (`items`: Map clave → item, como `aItems`).
 * @returns {{ emblemas: {id, nombre}[], pedazos: {coleccion, nombre}[] }}
 */
export function porGanarEn(d, destino, items, sitio) {
  const emblemas = (d.emblemas ?? []).filter((e) => e.sitio === sitio && !items.has(clave(destino, 'emblema', e.id))).map((e) => ({ id: e.id, nombre: e.nombre }))
  const pedazos = (d.colecciones ?? []).filter((c) => c.sitios.includes(sitio) && !items.has(clave(destino, 'pedazo', c.id + ':' + sitio))).map((c) => ({ coleccion: c.id, nombre: c.nombre }))
  return { emblemas, pedazos }
}

/**
 * Los sitios con logro a menos de `margenM` del borde de su radio, del más cercano al más lejano.
 * @param {object} p
 * @param {object} p.datos        los datos de logros (datos.destinos[destino] con sitios, colecciones, emblemas)
 * @param {object} p.catalogos    los catálogos de sitios (con `sitios_extra` ya dentro)
 * @param {string} p.destino      clave del destino ('roma', 'lanzarote')
 * @param {{lat,lng}} p.ubicacion
 * @param {Map} p.items           lo ya ganado
 * @param {Set<string>} [p.sitiosHoy]  ids de los sitios de la ruta de hoy
 * @param {number} [p.margenM]
 */
export function sitiosCerca({ datos, catalogos, destino, ubicacion, items, sitiosHoy = new Set(), margenM = METROS_BRILLA }) {
  if (!ubicacion || !Number.isFinite(ubicacion.lat) || !Number.isFinite(ubicacion.lng)) return []
  const d = datos.destinos[destino]
  if (!d) return []
  const salida = []
  for (const id of sitiosConLogro(d)) {
    const coords = coordenadasDeSitio(catalogos, destino, id)
    if (!coords) continue
    const radioDatos = d.sitios?.[id]?.radio_m ?? 150
    const radio = Math.min(radioDatos, RADIO_MAXIMO_AVISO_M)
    const m = metros(ubicacion, coords)
    const alBorde = Math.max(0, m - radio)
    if (alBorde > margenM) continue
    const { emblemas, pedazos } = porGanarEn(d, destino, items, id)
    salida.push({
      sitio: id,
      nombre: nombreDeSitio(catalogos, destino, id),
      // «en el Coliseo» · «en La Graciosa» y «al Coliseo» · «a la Boca de la Verdad»: con el artículo de cada sitio (data/logros/articulos.json), para decir «Estás en…» y «Estás junto a…».
      en_sitio: conArticulo(destino, nombreDeSitio(catalogos, destino, id), 'en'),
      a_sitio: conArticulo(destino, nombreDeSitio(catalogos, destino, id), 'a'),
      metros: Math.round(m),
      radio_m: radioDatos,
      al_borde_m: Math.round(alBorde),
      dentro: m <= radio,
      en_ruta_hoy: sitiosHoy.has(id),
      hay_emblema: emblemas.length > 0,
      emblema_nombre: emblemas[0]?.nombre ?? null,
      hay_pedazo: pedazos.length > 0,
      coleccion_nombre: pedazos[0]?.nombre ?? null,
    })
  }
  return salida.sort((a, b) => a.al_borde_m - b.al_borde_m || a.metros - b.metros)
}

/**
 * El sitio al que cuenta una foto hecha SIN parada: el más cercano en cuyo radio está el viajero y que aún tiene algo por ganar.
 * Si está dentro de varios, el que tiene un emblema por ganar antes que el que solo tiene pedazo, y luego el más cercano.
 * null si no está en ninguno (la foto solo es un recuerdo).
 */
export function sitioDeFotoLibre({ datos, catalogos, destino, ubicacion, items }) {
  const dentro = sitiosCerca({ datos, catalogos, destino, ubicacion, items, margenM: 0 }).filter((s) => s.dentro && (s.hay_emblema || s.hay_pedazo))
  if (dentro.length === 0) return null
  dentro.sort((a, b) => Number(b.hay_emblema) - Number(a.hay_emblema) || a.metros - b.metros)
  return dentro[0].sitio
}

/**
 * Qué enseñar a partir de lo que hay cerca (lo decide el servidor para que móvil y prueba digan lo mismo):
 *   - `juego`: 'llegada' (dentro del radio de un sitio con emblema por ganar), 'mas_cerca' (a ≤150 m del borde), 'brilla' (a ≤500 m) o null.
 *   - `fuera_de_ruta`: el sitio con algo por ganar en cuyo radio estás y que no está en la ruta de hoy (H8).
 *   - `junto_a`: un sitio fuera de ruta con pedazo por ganar a ≤150 m del borde y aún no dentro (H8b).
 */
export function queEnsenar(cerca) {
  const conEmblema = cerca.filter((s) => s.hay_emblema)
  const mejorEmblema = conEmblema[0] ?? null
  let juego = null
  if (mejorEmblema) juego = mejorEmblema.dentro ? 'llegada' : mejorEmblema.al_borde_m <= METROS_MAS_CERCA ? 'mas_cerca' : mejorEmblema.al_borde_m <= METROS_BRILLA ? 'brilla' : null
  const fuera = cerca.find((s) => s.dentro && !s.en_ruta_hoy && (s.hay_emblema || s.hay_pedazo)) ?? null
  const junto = cerca.find((s) => !s.dentro && !s.en_ruta_hoy && s.hay_pedazo && s.al_borde_m <= METROS_JUNTO_A) ?? null
  return { juego, juego_sitio: mejorEmblema?.sitio ?? null, fuera_de_ruta: fuera?.sitio ?? null, junto_a: junto?.sitio ?? null }
}

/**
 * EL RETO DEL DÍA (C18): «Hoy puedes completar … te faltan 2». Una colección con 1 a 3 pedazos por ganar y TODOS esos sitios en la ruta de hoy (así se completa hoy sin cambiar nada).
 * Si hay varias, la que menos le falta y, a igual, la más avanzada. null si ninguna.
 * @returns {{ coleccion: string, nombre: string, faltan: number, total: number, sitios: {sitio, nombre, ganado, hoy}[] } | null}
 */
export function retoDelDia({ datos, catalogos, destino, items, sitiosHoy = new Set() }) {
  const d = datos.destinos[destino]
  if (!d) return null
  let mejor = null
  for (const c of d.colecciones ?? []) {
    const sinGanar = c.sitios.filter((s) => !items.has(clave(destino, 'pedazo', c.id + ':' + s)))
    if (sinGanar.length === 0 || sinGanar.length > 3) continue
    if (!sinGanar.every((s) => sitiosHoy.has(s))) continue
    const reto = { coleccion: c.id, nombre: c.nombre, faltan: sinGanar.length, total: c.sitios.length, sitios: c.sitios.map((s) => ({ sitio: s, nombre: nombreDeSitio(catalogos, destino, s), ganado: !sinGanar.includes(s), hoy: sitiosHoy.has(s) })) }
    if (!mejor || reto.faltan < mejor.faltan || (reto.faltan === mejor.faltan && reto.total - reto.faltan > mejor.total - mejor.faltan)) mejor = reto
  }
  return mejor
}
