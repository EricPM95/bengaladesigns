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

const leer = (ruta) => JSON.parse(fs.readFileSync(new URL(ruta, import.meta.url), 'utf8'))

const DESTINOS_CON_LOGROS = ['roma']

export function cargarDatos() {
  const destinos = {}
  for (const clave of DESTINOS_CON_LOGROS) {
    destinos[clave] = leer(`../../data/logros/${clave}.json`)
    // Los sitios del catálogo (para «Conocedor de la ciudad»: cuentan todos, no solo los que tienen logro).
    Object.defineProperty(destinos[clave], 'sitios_catalogo', { value: (cargarCatalogo(clave).places ?? []).map((x) => x.id), enumerable: false })
  }
  return {
    destinos,
    viajero: leer('../../data/logros/viajero.json'),
    ajustes: leer('../../data/logros/ajustes.json'),
    // El pase: los precios y cómo se elige el día de prueba (data/pase/).
    pase: { precios: leer('../../data/pase/precios.json'), ajustes: leer('../../data/pase/ajustes.json') },
  }
}

export function cargarCatalogo(clave) {
  return leer(`../../data/pipeline_v2/${clave}.json`)
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
    for (const p of Object.values(d.patrimonios ?? {})) for (const id of [...(p.sitios ?? []), ...(p.por_comprobar ?? [])]) usados.add(id)
    for (const v of Object.values(d.excepciones_pais ?? {})) for (const id of v.sitios ?? []) usados.add(id)
    for (const id of usados) {
      if (!ids.has(id)) error(`${clave}/${id}`, 'Este sitio no existe en los datos del destino (no lo añado yo: hay que decidir qué hacer).')
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
      if (!col) error(`${clave}/${sello.id}`, `El sello apunta a una colección que no existe (${sello.coleccion}).`)
      else if (sello.grados[sello.grados.length - 1].desde > col.sitios.length) error(`${clave}/${sello.id}`, 'El último grado pide más sitios de los que tiene la colección.')
    }
    if (!d.sellos.some((s) => s.id === d.sello_principal)) error(clave, 'El sello principal no existe.')
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
