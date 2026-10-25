/**
 * LO QUE LA APP PIDE A LA API DE CONSULTA (parte 1): el cliente (login, ritmo, 429) + la caché + el mapeo a lo que enseña la app. Todo desde nuestro servidor.
 *
 * Si la API está apagada (interruptor), caída, fuera de horario (el sandbox solo funciona de 7:00 a 2:00, hora de España) o no tiene lo que se pide, cada función devuelve
 * `{ ok: false, motivo }` y quien la usa hace lo de hoy (nuestros datos y nuestros enlaces). Nunca lanza.
 */

import fs from 'node:fs'
import { crearClienteCivitatis } from './cliente.js'
import { crearCache, ttlConTope } from './cache.js'
import { fichaDeActividad, fichaCorta, horasParaLaApp, precioMinimoDelCalendario, diasConHoras, horasLibresDelDia, enlaceDeActividad, tieneHorasFijas } from './mapeo.js'

const leerJson = (ruta) => JSON.parse(fs.readFileSync(new URL(ruta, import.meta.url), 'utf8'))

export const AJUSTES = leerJson('../../data/civitatis/ajustes.json')
const DESTINOS = { roma: leerJson('../../data/civitatis/roma.json') }

/** Los números de actividad de un destino (null si el destino no está curado). */
export function datosDelDestino(nombre) {
  return DESTINOS[String(nombre ?? '').trim().toLowerCase()] ?? null
}

const dosDigitos = (n) => String(n).padStart(2, '0')
/** «AAAA-MM-DD» de hoy más `dias` (hora de España; da igual la zona para pedir un rango de fechas). */
export function fechaMas(hoy, dias) {
  const d = new Date(`${hoy}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return `${d.getUTCFullYear()}-${dosDigitos(d.getUTCMonth() + 1)}-${dosDigitos(d.getUTCDate())}`
}
const esFecha = (f) => /^\d{4}-\d{2}-\d{2}$/.test(String(f ?? ''))

/**
 * @param {{ activa?: boolean, cliente?: ReturnType<typeof crearClienteCivitatis>, cache?: ReturnType<typeof crearCache>, ajustes?: typeof AJUSTES, ahora?: () => number }} [opciones]
 */
export function crearServicioCivitatis(opciones = {}) {
  const activa = opciones.activa ?? false
  const cliente = opciones.cliente ?? crearClienteCivitatis()
  const cache = opciones.cache ?? crearCache()
  const ajustes = opciones.ajustes ?? AJUSTES
  const ahora = opciones.ahora ?? (() => Date.now())
  const ttl = (que) => ttlConTope(ajustes.ttl_segundos?.[que] ?? 3600) // (tope duro de 4 h: lo pidió el proveedor el 19-oct)
  const lang = ajustes.idioma ?? 'es'
  const moneda = ajustes.moneda ?? 'EUR'
  const apagada = { ok: false, motivo: 'apagada' }
  /** ¿Puede ESTA petición usar la API? Por defecto, lo que diga `activa`; con la API solo para admin, el servidor mira el email del usuario (ver permiso.js). Nunca lanza. */
  const permitida = async (req) => {
    if (!activa) return false
    if (!opciones.permitida) return true
    try {
      return (await opciones.permitida(req)) === true
    } catch {
      return false
    }
  }
  const opcionesDePrecio = { maximoCreible: ajustes.precio_maximo_creible_eur ?? 2000 }

  const pedirCacheado = (clave, que, ruta, peticion, fresco = false) => cache.obtener(clave, ttl(que), () => cliente.pedir(ruta, peticion), { fresco })

  /** La actividad entera, ya mapeada. Si la actividad no da un precio creíble, se mira el calendario más corto para tener uno. */
  async function actividad(id, { fresco = false } = {}) {
    if (!activa) return apagada
    const r = await pedirCacheado(`act:${id}:${lang}:${moneda}`, 'actividad', `/activities/${id}`, { consulta: { lang, currency: moneda } }, fresco)
    if (!r.ok) return r
    let ficha = fichaDeActividad(r.datos, opcionesDePrecio)
    if (!ficha) return { ok: false, motivo: 'respuesta_rara' }
    if (ficha.desde == null && !ficha.gratis) {
      const hoy = new Date(ahora()).toISOString().slice(0, 10)
      const cal = await calendario(id, hoy, fechaMas(hoy, 30))
      if (cal.ok) ficha = fichaDeActividad(r.datos, { ...opcionesDePrecio, calendarioMinimo: precioMinimoDelCalendario(cal.datos) })
    }
    return { ok: true, datos: ficha, viejo: r.viejo === true }
  }

  /** El calendario en bruto de una actividad entre dos fechas. */
  async function calendario(id, desde, hasta, { fresco = false } = {}) {
    if (!activa) return apagada
    if (!esFecha(desde) || !esFecha(hasta)) return { ok: false, motivo: 'fechas_malas' }
    return pedirCacheado(`cal:${id}:${desde}:${hasta}:${moneda}`, 'calendario', `/calendar/activities/${id}`, { consulta: { dateFrom: desde, dateTo: hasta, currency: moneda } }, fresco)
  }

  /** Las horas libres de una actividad un día. `fresco`: sin la caché (al abrir el selector de hora). */
  async function horasLibres(id, fecha, { fresco = false } = {}) {
    if (!activa) return apagada
    const r = await calendario(id, fecha, fecha, { fresco })
    if (!r.ok) return r
    return { ok: true, datos: horasParaLaApp(r.datos, fecha, ajustes.plazas), viejo: r.viejo === true }
  }

  /** Las horas del Free Tour de un rango de días: { 'AAAA-MM-DD': [{ hora, plazas, aviso }] } (los días sin hora libre, con []). */
  async function freeTourHoras(id, desde, hasta, { fresco = false } = {}) {
    if (!activa) return apagada
    const r = await calendario(id, desde, hasta, { fresco })
    if (!r.ok) return r
    const dias = {}
    let dia = desde
    for (let i = 0; i < 400 && dia <= hasta; i++) {
      dias[dia] = horasParaLaApp(r.datos, dia, ajustes.plazas).horas
      dia = fechaMas(dia, 1)
    }
    return { ok: true, datos: { dias, conHoras: diasConHoras(r.datos) }, viejo: r.viejo === true }
  }

  /** Las horas libres de cada día de un rango (la hora recomendada de la ficha): { conHorasFijas, dias: { 'AAAA-MM-DD': { sinPlazas, horas } } }. Un rango de más de 60 días no se pide. */
  async function horasEnRango(id, desde, hasta, { fresco = false } = {}) {
    if (!activa) return apagada
    if (!esFecha(desde) || !esFecha(hasta) || desde > hasta || fechaMas(desde, 60) < hasta) return { ok: false, motivo: 'fechas_malas' }
    const r = await calendario(id, desde, hasta, { fresco })
    if (!r.ok) return r
    const dias = {}
    for (let dia = desde, i = 0; i < 70 && dia <= hasta; i++, dia = fechaMas(dia, 1)) {
      const { sinPlazas, horas } = horasParaLaApp(r.datos, dia, ajustes.plazas)
      dias[dia] = { sinPlazas, horas }
    }
    return { ok: true, datos: { actividadId: Number(id), conHorasFijas: tieneHorasFijas(r.datos), dias }, viejo: r.viejo === true }
  }

  /** Las actividades cerca de unas coordenadas (la pestaña «Entradas» de un sitio que no tiene número de lugar de Google). `distancia` en km. */
  async function cercaDe(lat, lng, distancia = 0.3, limite = 6) {
    if (!activa) return apagada
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return { ok: false, motivo: 'coordenadas_malas' }
    const clave = `cerca:${Number(lat).toFixed(4)}:${Number(lng).toFixed(4)}:${distancia}:${limite}:${lang}`
    const r = await cache.obtener(clave, ttl('cerca'), () => cliente.pedir('/findByCoord', { metodo: 'POST', consulta: { lang, currency: moneda, limit: limite }, cuerpo: { lat: Number(lat), long: Number(lng), distance: distancia } }))
    if (!r.ok) return r
    return { ok: true, datos: (Array.isArray(r.datos) ? r.datos : []).map((a) => fichaCorta(a, opcionesDePrecio)).filter(Boolean), viejo: r.viejo === true }
  }

  /** El enlace de traslados de un destino (por su número). */
  async function traslados(destinoId) {
    if (!activa) return apagada
    const r = await pedirCacheado(`traslados:${lang}`, 'traslados', '/destinations/transfers', { consulta: { lang } })
    if (!r.ok) return r
    const hallado = (Array.isArray(r.datos) ? r.datos : []).find((d) => Number(d.id) === Number(destinoId))
    const url = hallado ? enlaceDeActividad(hallado.url) : null
    return url ? { ok: true, datos: { url }, viejo: r.viejo === true } : { ok: false, motivo: 'sin_traslados' }
  }

  /** De un enlace a su número de actividad. */
  async function resolver(url) {
    if (!activa) return apagada
    const r = await pedirCacheado(`resolver:${url}`, 'resolver', '/activities/resolve', { consulta: { url } })
    return r.ok && r.datos?.activity_id != null ? { ok: true, datos: { id: Number(r.datos.activity_id), meta: r.datos.meta ?? null } } : r.ok ? { ok: false, motivo: 'respuesta_rara' } : r
  }

  /**
   * Las entradas de cada sitio del destino con datos reales: para los sitios con números en `data/civitatis/<destino>.json › entradas`, las entradas pasan a ser esas actividades
   * (hasta dos por sitio). Un sitio sin números, o cuya API falle, se queda como estaba (las nuestras). Devuelve las `entradas_por_sitio` nuevas y cuántos sitios se han enriquecido.
   */
  async function enriquecerEntradas(destino, entradasPorSitio) {
    const datos = datosDelDestino(destino)
    if (!activa || !datos) return { entradasPorSitio, enriquecidos: 0 }
    const ids = [...new Set(Object.entries(datos.entradas ?? {}).filter(([k]) => !k.startsWith('_')).flatMap(([, v]) => v))]
    const fichas = new Map()
    await Promise.all(
      ids.map(async (id) => {
        const r = await actividad(id)
        if (r.ok) fichas.set(id, r.datos)
      }),
    )
    const salida = { ...entradasPorSitio }
    let enriquecidos = 0
    for (const [sitio, lista] of Object.entries(datos.entradas ?? {})) {
      if (sitio.startsWith('_') || !salida[sitio]) continue // (un sitio sin entradas en nuestros datos no gana pestaña)
      const nuevas = lista.map((id) => fichas.get(id)).filter(Boolean)
      if (nuevas.length === 0) continue
      salida[sitio] = nuevas.map((f) => ({ nombre: f.nombre, incluye: f.incluye[0] ?? null, desde: f.desde, url: f.url, civitatis: f }))
      enriquecidos++
    }
    return { entradasPorSitio: salida, enriquecidos }
  }

  /**
   * Las excursiones con precio y valoración reales: para las de `data/civitatis/<destino>.json › excursiones`, `price_from_eur`, `rating` (de 0 a 10, como en la web; `rating_max: 10`) y `review_count` salen de la API y
   * `provisional_pricing` pasa a false; el punto de encuentro, si la API lo da. Las demás se quedan como estaban.
   */
  async function enriquecerExcursiones(destino, opcionesDelDestino) {
    const datos = datosDelDestino(destino)
    if (!activa || !datos) return { opciones: opcionesDelDestino, enriquecidas: 0 }
    let enriquecidas = 0
    const opciones2 = await Promise.all(
      (opcionesDelDestino ?? []).map(async (opcion) => {
        const id = datos.excursiones?.[opcion.id]
        if (!id) return opcion
        const r = await actividad(id)
        if (!r.ok) return opcion
        const f = r.datos
        if (f.desde == null || f.valoracion == null || f.opiniones == null) return opcion // (sin los tres datos, sigue provisional: nunca media nota real)
        enriquecidas++
        return { ...opcion, price_from_eur: f.desde, rating: f.valoracion, rating_max: 10, review_count: f.opiniones, provisional_pricing: false, meeting_point: f.puntoDeEncuentro?.texto ?? opcion.meeting_point ?? null, civitatis: f }
      }),
    )
    return { opciones: opciones2, enriquecidas }
  }

  return { activa, permitida, actividad, calendario, horasLibres, horasEnRango, freeTourHoras, cercaDe, traslados, resolver, enriquecerEntradas, enriquecerExcursiones, cliente, cache, ajustes, horasLibresDelDia }
}
