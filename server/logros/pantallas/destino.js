/**
 * LAS PANTALLAS DE UN DESTINO (Tanda 8C2): la página de cada destino, una colección por dentro (el álbum de cromos) y «Mi colección» de logros de viajero.
 * Todo son funciones puras sobre lo que ya calculan motor.js y vistas.js (nada de números escritos a mano) y tres rutas de solo lectura:
 *
 *   GET /api/logros/destino?destino=roma[&trip_id]               sellos, colecciones, emblemas encontrados y los números ya hechos
 *   GET /api/logros/coleccion?destino=roma&coleccion=…[&trip_id]  los sitios de una colección: la fecha de lo visto y, en lo que falta, el día de su ruta
 *   GET /api/logros/mi-coleccion                                  los logros de viajero por grupos, con la clave de cada uno que ya tiene (para abrir su ficha)
 *
 * Los emblemas ocultos que no se han encontrado NUNCA salen: ni su nombre, ni su sitio. Solo cuántos faltan.
 */

import { GLOBAL, clave, parteLocal } from '../motor.js'
import { estadoDestino } from '../vistas.js'

/** La fecha (AAAA-MM-DD) de un instante, en la hora del sitio; si no hay hora de sitio, la del instante. */
const fechaDe = (en, tz) => (en ? (tz ? (parteLocal(en, tz)?.fecha ?? String(en).slice(0, 10)) : String(en).slice(0, 10)) : null)

/** El viaje (el que le pasan) solo vale si es del mismo destino. */
const viajeValido = (viaje, destino) => (viaje && viaje.destino === destino ? viaje : null)

/**
 * La página de un destino. `items`: mapa de claves de lo ganado. `viaje`: el contexto del viaje abierto (o null). Devuelve todo lo que la pantalla pinta:
 * los sellos con su grado, las colecciones (completas primero) con su avance, los emblemas ENCONTRADOS (con su fecha) y cuántos faltan, y los números ya calculados.
 */
export function paginaDeDestino({ datos, destino, items, viaje = null, hoy = null }) {
  const d = datos.destinos[destino]
  if (!d) return null
  const tz = d.timezone
  const v = viajeValido(viaje, destino)
  const e = estadoDestino({ datos, destino, items, viaje: v, hoy })
  const en = (logro, escalon) => items.get(clave(destino, logro, escalon))?.en ?? null

  const sellos = e.sellos.map((s) => {
    const def = d.sellos.find((x) => x.id === s.id)
    return {
      id: s.id,
      nombre: s.nombre,
      coleccion: def.coleccion,
      grado: s.grado,
      nombre_grado: s.nombre_grado,
      n: s.n,
      total: s.total,
      siguiente: s.siguiente,
      fecha: s.grado ? fechaDe(en('sello', `${s.id}:${s.grado}`), tz) : null,
      principal: s.id === d.sello_principal,
    }
  })

  const colecciones = e.colecciones.map((c) => {
    const def = d.colecciones.find((x) => x.id === c.id)
    return {
      id: c.id,
      grupo: c.grupo,
      nombre: c.nombre,
      al_completar: c.al_completar,
      n: c.n,
      total: c.total,
      completa: c.completa,
      en_tu_ruta: c.en_tu_ruta,
      nuevo_hoy: c.nuevo_hoy,
      fecha: c.completa ? fechaDe(en('coleccion', c.id), tz) : null,
      sitios: def.sitios.map((s) => ({ sitio: s, visto: c.sitios.find((x) => x.sitio === s)?.visto ?? false, fecha: fechaDe(en('pedazo', `${c.id}:${s}`), tz) })),
    }
  })

  const completas = colecciones.filter((c) => c.completa).length
  const encontrados = e.secretos.encontrados_lista
    .map((x) => ({ id: x.id, nombre: x.nombre, linea: x.linea, fecha: fechaDe(x.en, tz), en: x.en }))
    .sort((a, b) => new Date(a.en) - new Date(b.en))
    .map(({ en: _en, ...resto }) => resto)
  const totalPiezas = colecciones.length + e.secretos.total
  const principal = sellos.find((s) => s.principal) ?? sellos[0] ?? null

  return {
    ok: true,
    destino,
    ciudad: d.ciudad,
    pais: d.pais_defecto ?? null,
    principal: principal ? { id: principal.id, grado: principal.grado, nombre_grado: principal.nombre_grado } : null,
    sellos,
    colecciones,
    // Los emblemas ocultos: solo los encontrados (con su fecha) y cuántos faltan. Nunca cuáles son ni dónde.
    emblemas: { total: e.secretos.total, encontrados: encontrados.length, faltan: e.secretos.total - encontrados.length, lista: encontrados, texto: e.secretos.texto },
    numeros: {
      colecciones_completas: completas,
      colecciones_total: colecciones.length,
      secretos_encontrados: encontrados.length,
      secretos_total: e.secretos.total,
      // La barra de la página: lo conseguido (colecciones completas + secretos) sobre lo que hay.
      avance: totalPiezas > 0 ? (completas + encontrados.length) / totalPiezas : 0,
    },
    con_tu_ruta_puedes_completar: e.con_tu_ruta_puedes_completar,
    // ¿Hay un viaje abierto a este destino? Sin él, la pantalla no habla de «tu ruta».
    con_ruta: Boolean(v),
  }
}

/**
 * Una colección por dentro: cada sitio con su nombre, si está visto (y cuándo) y, en los que faltan, si están en la ruta del viaje abierto y en qué día
 * (primer día en que aparece). `nombreDe`: el nombre del sitio en español (del catálogo).
 */
export function coleccionPorDentro({ datos, destino, coleccion, items, viaje = null, nombreDe = (s) => s }) {
  const d = datos.destinos[destino]
  const c = d?.colecciones.find((x) => x.id === coleccion)
  if (!c) return null
  const tz = d.timezone
  const v = viajeValido(viaje, destino)
  const diaDe = (sitio) => {
    for (const dia of v?.dias ?? []) if ((dia.paradas ?? []).some((p) => p.sitio === sitio)) return { numero: dia.numero ?? null, fecha: dia.fecha ?? null }
    return null
  }
  const sitios = c.sitios.map((s) => {
    const it = items.get(clave(destino, 'pedazo', `${c.id}:${s}`))
    const dia = it ? null : diaDe(s)
    return { sitio: s, nombre: nombreDe(s), visto: Boolean(it), fecha: it ? fechaDe(it.en, tz) : null, en_ruta: Boolean(dia), dia }
  })
  const completa = items.get(clave(destino, 'coleccion', c.id))
  const n = sitios.filter((x) => x.visto).length
  return {
    ok: true,
    destino,
    ciudad: d.ciudad,
    coleccion: { id: c.id, nombre: c.nombre, n, total: sitios.length, completa: Boolean(completa), fecha: completa ? fechaDe(completa.en, tz) : null, al_completar: completa ? c.al_completar : null },
    sitios,
    con_ruta: Boolean(v),
  }
}

/** Los textos de los grupos de «Mi colección», en el orden en que van (los de los logros de viajero; los Exclusivos y las 7 maravillas tienen su sitio aparte). */
export const GRUPOS_DE_MI_COLECCION = [
  ['mundo', 'El mundo'],
  ['tiempo', 'El tiempo'],
  ['como_viajas', 'Cómo viajas'],
  ['coleccionista', 'Coleccionista'],
]
const FUERA_DE_MI_COLECCION = new Set(['maravillas'])

/**
 * «Mi colección»: los logros de viajero encendidos (los que da `logrosDeViajero`), por grupos, con la clave de cada escalón o logro ya ganado (para abrir su ficha)
 * y la fecha en que se ganó. `viajero`: la respuesta de `servicio.logrosDeViajero`.
 */
export function miColeccion({ datos, viajero, items }) {
  const ganados = [...items.values()].filter((it) => it.logro.startsWith('viajero:'))
  const buscar = (id, escalon) => ganados.find((it) => it.logro === `viajero:${id}` && String(it.escalon) === String(escalon ?? ''))
  const ciudadDe = (it) => (it && it.destino !== GLOBAL ? (datos.destinos[it.destino]?.ciudad ?? null) : null)
  const relleno = (texto, it) => {
    if (!texto) return null
    if (!texto.includes('{')) return texto
    const ciudad = ciudadDe(it)
    return ciudad && !texto.replace('{ciudad}', '').includes('{') ? texto.replace('{ciudad}', ciudad) : null
  }
  const grupos = GRUPOS_DE_MI_COLECCION.map(([id, nombre]) => ({ id, nombre, logros: [] }))
  for (const l of viajero.logros) {
    if (FUERA_DE_MI_COLECCION.has(l.id)) continue
    const grupo = grupos.find((g) => g.id === l.grupo)
    if (!grupo) continue
    const escalones = (l.escalones ?? []).map((e) => {
      const it = buscar(l.id, e.n)
      return { n: e.n, nombre: e.nombre, ganado: Boolean(it), clave: it?.clave ?? null, fecha: it ? String(it.en).slice(0, 10) : null }
    })
    const unico = escalones.length === 0 ? buscar(l.id, '') : null
    const ganadosEsc = escalones.filter((e) => e.ganado)
    const ultimo = ganadosEsc[ganadosEsc.length - 1] ?? null
    const itUltimo = ultimo ? buscar(l.id, ultimo.n) : unico
    grupo.logros.push({
      id: l.id,
      grupo: l.grupo,
      // El nombre del logro que ya tiene (el del último escalón, o el suyo): sin él, la pantalla pone «Por conseguir».
      nombre: escalones.length ? (ultimo?.nombre ?? null) : relleno(l.nombre, unico),
      nombre_logro: relleno(l.nombre, unico),
      como: l.como ?? null,
      linea: l.linea ?? null,
      ganado: escalones.length ? ganadosEsc.length > 0 : Boolean(unico),
      completo: escalones.length ? ganadosEsc.length === escalones.length : Boolean(unico),
      n_ganados: escalones.length ? ganadosEsc.length : unico ? 1 : 0,
      n_total: escalones.length || 1,
      escalon_actual: ultimo?.n ?? null,
      escalones,
      clave: itUltimo?.clave ?? null,
      fecha: itUltimo ? String(itUltimo.en).slice(0, 10) : null,
      avance: l.avance ?? null,
      nuevo: Boolean(l.nuevo),
    })
  }
  const todos = grupos.flatMap((g) => g.logros)
  const total = todos.reduce((s, l) => s + l.n_total, 0)
  const hechos = todos.reduce((s, l) => s + l.n_ganados, 0)
  return { ok: true, grupos: grupos.filter((g) => g.logros.length > 0), numeros: { ganados: hechos, total, avance: total > 0 ? hechos / total : 0 } }
}

/** Rutas de las pantallas de la 8C2 (ver index.js). */
/** El nombre en español de un sitio, según el catálogo del destino (el mismo que `nombreDeSitio` de datos.js; aquí aparte para que este archivo no dependa del disco y el demo del móvil lo pueda importar). */
const nombreDeSitio = (catalogos, destino, id) => (catalogos[destino]?.places ?? []).find((p) => p.id === id)?.name ?? id

export function registrar(app, ctx) {
  const { conUsuario, servicio, datos, catalogos, ahora } = ctx
  const hoyEn = (destino) => parteLocal(ahora(), datos.destinos[destino].timezone).fecha

  app.get('/api/logros/destino', conUsuario(async (req, res, u) => {
    const destino = String(req.query.destino ?? '').trim().toLowerCase()
    if (!datos.destinos[destino]) return res.status(404).json({ ok: false, motivo: 'destino_sin_logros' })
    const c = await servicio.cargar(u.id)
    const viaje = req.query.trip_id ? (c.viajes[String(req.query.trip_id)] ?? null) : null
    return res.json(paginaDeDestino({ datos, destino, items: servicio.aItems(c.logros), viaje, hoy: hoyEn(destino) }))
  }))

  app.get('/api/logros/coleccion', conUsuario(async (req, res, u) => {
    const destino = String(req.query.destino ?? '').trim().toLowerCase()
    if (!datos.destinos[destino]) return res.status(404).json({ ok: false, motivo: 'destino_sin_logros' })
    const c = await servicio.cargar(u.id)
    const viaje = req.query.trip_id ? (c.viajes[String(req.query.trip_id)] ?? null) : null
    const r = coleccionPorDentro({ datos, destino, coleccion: String(req.query.coleccion ?? ''), items: servicio.aItems(c.logros), viaje, nombreDe: (s) => nombreDeSitio(catalogos, destino, s) })
    return res.json(r ?? { ok: false, motivo: 'coleccion_sin_logros' })
  }))

  app.get('/api/logros/mi-coleccion', conUsuario(async (_req, res, u) => {
    const c = await servicio.cargar(u.id)
    const viajero = await servicio.logrosDeViajero(u.id)
    return res.json(miColeccion({ datos, viajero, items: servicio.aItems(c.logros) }))
  }))
}
