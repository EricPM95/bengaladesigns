/**
 * LOS DATOS DE LOS LOGROS (Tanda 8A): se leen de data/logros/*.json. Nada de lo que cambia de un destino a otro está escrito en el código.
 *
 *   data/logros/<destino>.json   sellos, colecciones, emblemas y datos de cada sitio (radio, foto dentro, país, Patrimonio)
 *   data/logros/viajero.json     los logros de viajero, sus escalones y sus nombres
 *   data/logros/ajustes.json     números y listas que se pueden cambiar (plazo, horas de Madrugador y Nocturno, orden de los momentos…)
 *
 * `validarDatos` cruza todo con el catálogo del destino (data/pipeline_v2/<destino>.json): un sitio que no existe allí es un aviso (y /admin/logros y la prueba lo enseñan).
 * No toca el motor de rutas.
 */

import fs from 'node:fs'
import { soloActivos } from './viajeroActivo.js'

export { soloActivos }

const leer = (ruta) => JSON.parse(fs.readFileSync(new URL(ruta, import.meta.url), 'utf8'))

/** (LZ3) Lanzarote lleva logros, pero mientras esté oculto (server/destinosCurados.js › DESTINOS_OCULTOS) solo los ve el administrador: el servicio lo quita de los datos de quien no lo es (`datosVisiblesPara`). */
const DESTINOS_CON_LOGROS = ['roma', 'lanzarote']

export function cargarDatos() {
  const destinos = {}
  for (const clave of DESTINOS_CON_LOGROS) {
    destinos[clave] = leer(`../../data/logros/${clave}.json`)
    // Los sitios del catálogo (para «Conocedor de la ciudad»: cuentan todos, no solo los que tienen logro).
    // Los puntos de llegada y de salida del destino (aeropuertos, estaciones…): de ahí sale la hora a la que el motor da libre al viajero (solo se lee; no se toca el motor).
    const rutaLlegada = new URL(`../../data/dias/${clave}/_llegada.json`, import.meta.url)
    Object.defineProperty(destinos[clave], 'llegadaInfo', { value: fs.existsSync(rutaLlegada) ? JSON.parse(fs.readFileSync(rutaLlegada, 'utf8')) : null, enumerable: false })
    Object.defineProperty(destinos[clave], 'sitios_catalogo', { value: (cargarCatalogo(clave).places ?? []).map((x) => x.id), enumerable: false })
  }
  return {
    destinos,
    viajero: soloActivos(leer('../../data/logros/viajero.json')),
    exp: leer('../../data/logros/exp.json'),
    ajustes: leer('../../data/logros/ajustes.json'),
    // El pase: los precios y cómo se elige el día de prueba (data/pase/).
    pase: { precios: leer('../../data/pase/precios.json'), ajustes: leer('../../data/pase/ajustes.json') },
  }
}

export function cargarCatalogo(clave) {
  const catalogo = leer(`../../data/pipeline_v2/${clave}.json`)
  // (LZ3) Sitios que no son parada ni están en EXPLORAR (La Graciosa) pero tienen emblema: `sitios_extra` de data/logros/<destino>.json. Solo para los logros; el motor de rutas no los ve.
  const logros = fs.existsSync(new URL(`../../data/logros/${clave}.json`, import.meta.url)) ? leer(`../../data/logros/${clave}.json`) : null
  const extra = logros?.sitios_extra ?? null
  // (V16) Un sitio de logro que junta DOS lugares (El Golfo y el Charco, la Caleta y la Playa de Famara) lleva su `centro` (el punto medio) en los datos de logros: para los logros, el sitio se mide desde ahí
  // (así vale una foto en cualquiera de los dos). Solo para los logros; el motor de rutas sigue con la coordenada de la parada.
  const centros = Object.entries(logros?.sitios ?? {}).filter(([, s]) => s?.centro && Number.isFinite(s.centro.lat) && Number.isFinite(s.centro.lng))
  const con = (places) => (centros.length === 0 ? places : places.map((p) => { const c = centros.find(([id]) => id === p.id)?.[1].centro; return c ? { ...p, coordinates: [c.lat, c.lng] } : p }))
  if (!extra) return centros.length === 0 ? catalogo : { ...catalogo, places: con(catalogo.places ?? []) }
  return { ...catalogo, places: con([...(catalogo.places ?? []), ...Object.entries(extra).map(([id, e]) => ({ id, name: e.name, coordinates: e.coordinates }))]) }
}

/**
 * (LZ3) Los datos de logros que puede ver una persona: sin los destinos ocultos si no es administrador. Roma queda exactamente igual.
 * `ocultos`: Set de claves (DESTINOS_OCULTOS). Sin ocultos o con administrador: los mismos datos (el mismo objeto).
 */
export function datosVisiblesPara(datos, ocultos, esAdminCuenta) {
  if (esAdminCuenta || !ocultos || ocultos.size === 0 || !Object.keys(datos.destinos).some((c) => ocultos.has(c))) return datos
  return { ...datos, destinos: Object.fromEntries(Object.entries(datos.destinos).filter(([c]) => !ocultos.has(c))) }
}

/** El destino de los logros por su nombre («Roma», «roma »). null si ese destino no tiene logros. */
export function claveDeDestino(datos, nombre) {
  const buscado = String(nombre ?? '').trim().toLowerCase()
  return Object.values(datos.destinos).find((d) => d.clave === buscado || d.destino.toLowerCase() === buscado)?.clave ?? null
}

/**
 * Comprueba los datos contra el catálogo. Devuelve una lista de avisos `{ nivel: 'error'|'aviso', donde, texto }`. Sin avisos, está todo bien.
 * `catalogos`: { roma: <contenido de data/pipeline_v2/roma.json> }.
 */
/** (V78) Paradas que ya no están en el catálogo pero se conservan a propósito en `sitios_de_parada` (clave `destino/id`). */
const PARADAS_ANTIGUAS_CONSERVADAS = new Set(['lanzarote/haria_y_la_casa_museo_cesar_manrique'])

export function validarDatos(datos, catalogos) {
  const avisos = []
  const error = (donde, texto) => avisos.push({ nivel: 'error', donde, texto })
  const aviso = (donde, texto) => avisos.push({ nivel: 'aviso', donde, texto })
  for (const [clave, d] of Object.entries(datos.destinos)) {
    const catalogo = catalogos[clave]
    if (!catalogo) {
      error(clave, 'No hay catálogo de sitios para este destino.')
      continue
    }
    const ids = new Set((catalogo.places ?? []).map((p) => p.id))
    const nombres = new Map((catalogo.places ?? []).map((p) => [p.id, p.name]))
    const usados = new Set()
    for (const c of d.colecciones) for (const s of c.sitios) usados.add(s)
    for (const e of d.emblemas) if (e.sitio) usados.add(e.sitio)
    for (const id of Object.keys(d.sitios)) usados.add(id)
    // (V4) Las paradas que llevan a varios sitios: la parada es del catálogo y cada sitio tiene sus datos (radio, país…).
    for (const [parada, lista] of Object.entries(d.sitios_de_parada ?? {})) {
      usados.add(parada)
      for (const s of lista) {
        usados.add(s)
        if (!d.sitios[s]) error(`${clave}/${parada}`, `La parada lleva al sitio ${s}, que no tiene sus datos (radio, país…).`)
      }
    }
    for (const [id, s] of Object.entries(d.sitios)) for (const otro of s.aparta_de ?? []) if (!d.sitios[otro]) error(`${clave}/${id}`, `Aparta de ${otro}, que no es un sitio con datos.`)
    // (V78) `puntos_de_foto` de cada sitio: desde dónde se ve de lejos (lat/lng, radio de 50 a 150 m, nombre y fuente). Solo cuentan para decidir qué sitio gana una foto (cerca.js › sitiosQueCuentaUnaFoto).
    for (const [id, s] of Object.entries(d.sitios)) {
      if (s.puntos_de_foto === undefined) continue
      if (!Array.isArray(s.puntos_de_foto)) {
        error(`${clave}/${id}`, '`puntos_de_foto` tiene que ser una lista.')
        continue
      }
      for (const [i, p] of s.puntos_de_foto.entries()) {
        const donde = `${clave}/${id}/puntos_de_foto/${i}`
        if (!Number.isFinite(p?.lat) || !Number.isFinite(p?.lng)) error(donde, 'Un punto de foto sin lat/lng.')
        if (!p?.nombre) aviso(donde, 'Un punto de foto sin nombre.')
        if (!p?.fuente) aviso(donde, 'Un punto de foto sin fuente.')
        if (!Number.isFinite(p?.radio_m) || p.radio_m < 50 || p.radio_m > 150) aviso(donde, 'El radio de un punto de foto va de 50 a 150 m.')
      }
    }
    for (const m of Object.values(d.momentos ?? {})) for (const id of Array.isArray(m.sitios) ? m.sitios : []) usados.add(id)
    for (const p of Object.values(d.patrimonios ?? {})) for (const id of [...(p.sitios ?? []), ...(p.por_comprobar ?? [])]) usados.add(id)
    for (const v of Object.values(d.excepciones_pais ?? {})) for (const id of v.sitios ?? []) usados.add(id)
    for (const id of usados) {
      // (V78) EXCEPCIÓN EXPLÍCITA: la parada vieja «haria_y_la_casa_museo_cesar_manrique» (la V67 la separó en «haria_pueblo» y «casa_museo_cesar_manrique») se conserva a propósito en `sitios_de_parada`: los viajes ya creados
      // y los hechos con ese id se corrigen con `migrarHariaPartida` y siguen valiendo para los dos sitios. Es un aviso, no un error. Cualquier otro id que falte sigue siendo error.
      if (!ids.has(id)) {
        if (PARADAS_ANTIGUAS_CONSERVADAS.has(`${clave}/${id}`) && d.sitios_de_parada?.[id]) aviso(`${clave}/${id}`, 'Parada antigua conservada a propósito en `sitios_de_parada` (ya no está en el catálogo; la cubre `migrarHariaPartida`).')
        else error(`${clave}/${id}`, 'Este sitio no existe en los datos del destino (no lo añado yo: hay que decidir qué hacer).')
      }
    }
    for (const c of d.colecciones) {
      for (const s of c.sitios) if (!d.sitios[s]) aviso(`${clave}/${c.id}`, `El sitio ${s} está en la colección pero no tiene sus datos (radio, país…).`)
      if (new Set(c.sitios).size !== c.sitios.length) error(`${clave}/${c.id}`, 'Un sitio repetido en la colección.')
    }
    for (const [id, s] of Object.entries(d.sitios)) {
      if (!Number.isFinite(s.radio_m) || s.radio_m <= 0) aviso(`${clave}/${id}`, 'Sitio sin radio de ubicación.')
      if (!s.pais) aviso(`${clave}/${id}`, 'Sitio sin país.')
      if (catalogo.places && ids.has(id)) {
        const p = catalogo.places.find((x) => x.id === id)
        if (!Array.isArray(p.coordinates) || p.coordinates.length !== 2) error(`${clave}/${id}`, 'El sitio no tiene coordenadas en los datos.')
      }
    }
    for (const [pid, p] of Object.entries(d.patrimonios ?? {})) {
      if (!p.unesco) aviso(`${clave}/${pid}`, 'Patrimonio sin número de la UNESCO.')
      for (const id of p.por_comprobar ?? []) aviso(`${clave}/${pid}`, `${id} está por comprobar con la UNESCO: no cuenta todavía.`)
    }
    // Un sitio no puede estar en dos Patrimonios a la vez.
    const vistosEnPatrimonio = new Map()
    for (const [pid, p] of Object.entries(d.patrimonios ?? {})) for (const id of p.sitios ?? []) {
      if (vistosEnPatrimonio.has(id)) error(`${clave}/${id}`, `Está en dos Patrimonios (${vistosEnPatrimonio.get(id)} y ${pid}).`)
      vistosEnPatrimonio.set(id, pid)
    }
    if (!d.pais_defecto) aviso(clave, 'Sin país por defecto: los sitios sin país no cuentan para ningún país.')
    for (const sello of d.sellos) {
      const col = d.colecciones.find((c) => c.id === sello.coleccion)
      if (!col) error(`${clave}/${sello.id}`, `La medalla apunta a una colección que no existe (${sello.coleccion}).`)
      else if (sello.grados[sello.grados.length - 1].desde > col.sitios.length) error(`${clave}/${sello.id}`, 'El último grado pide más sitios de los que tiene la colección.')
    }
    if (!d.sellos.some((s) => s.id === d.sello_principal)) error(clave, 'La medalla principal no existe.')
    const secretos = d.emblemas.length
    if (secretos < 1) aviso(clave, 'Sin emblemas.')
    void nombres
  }
  return avisos
}

/** El nombre del sitio en español, según el catálogo (para los mensajes). */
export function nombreDeSitio(catalogos, clave, id) {
  return (catalogos[clave]?.places ?? []).find((p) => p.id === id)?.name ?? id
}

/** Las coordenadas [lat, lng] de un sitio, según el catálogo. */
export function coordenadasDeSitio(catalogos, clave, id) {
  const c = (catalogos[clave]?.places ?? []).find((p) => p.id === id)?.coordinates
  return Array.isArray(c) && c.length === 2 ? { lat: c[0], lng: c[1] } : null
}
