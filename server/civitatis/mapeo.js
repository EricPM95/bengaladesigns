/**
 * De lo que dice la API de consulta a lo que usa la app (parte 1). Funciones PURAS, sin red: se prueban con respuestas guardadas.
 *
 * Reglas que mandan:
 *   · Nunca un número inventado: si la API no da un dato, ese dato no sale (y la app hace lo de hoy).
 *   · Ningún texto nombra a la empresa (regla de la app): las líneas de la API que la nombran se quitan y los enlaces los pone la app con nuestro código de afiliado.
 *   · El sandbox da sus enlaces con un servidor de pruebas (`qa.civitatis.com`): se pasan a la web de verdad (`www.civitatis.com`) para que el viajero nunca llegue a una página de pruebas.
 */

import { stampCivitatis } from '../../shared/affiliate/civitatis.js'

const dosDigitos = (n) => String(n).padStart(2, '0')

/** El enlace de la actividad en la web de verdad (no en el servidor de pruebas) y con nuestro código de afiliado. La campaña del viaje la añade la app al pulsar (CampaignLinks / openTicketShop). */
export function enlaceDeActividad(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const parsed = new URL(url)
    if (!/(^|\.)civitatis\.com$/.test(parsed.hostname)) return null
    parsed.protocol = 'https:'
    parsed.hostname = 'www.civitatis.com'
    return stampCivitatis(parsed.toString())
  } catch {
    return null
  }
}

/** Un texto de la API sin el nombre de la empresa (null si queda vacío o si todo era sobre ella). */
export function sinMarca(texto) {
  if (typeof texto !== 'string') return null
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (!limpio || /civitatis/i.test(limpio)) return null
  return limpio
}

const listaSinMarca = (lista) => (Array.isArray(lista) ? lista.map(sinMarca).filter(Boolean) : [])

/** La nota de la actividad, TAL COMO LA DA la web (de 0 a 10, con un decimal): «9,6/10». No se divide ni se cambia de escala. Sin nota válida, null. */
export function valoracionSobre10(score) {
  const n = Number(score)
  return Number.isFinite(n) && n > 0 && n <= 10 ? Math.round(n * 10) / 10 : null
}

/**
 * El precio «desde» creíble: el que da la actividad si está entre 0 y el máximo creíble; si no, el más barato del calendario (si se tiene); si no, null (la app usa el suyo).
 * Una actividad gratuita (Free Tour) es 0. Devuelve { precio, origen } con origen 'actividad' | 'calendario' | null.
 */
export function precioDesde(actividad, { maximoCreible = 2000, calendarioMinimo = null } = {}) {
  const p = Number(actividad?.minimumPrice)
  if (Number.isFinite(p) && p >= 0 && p <= maximoCreible) return { precio: p, origen: 'actividad' }
  // (Ojo: Number(null) es 0; sin calendario no hay precio.)
  const c = calendarioMinimo == null ? NaN : Number(calendarioMinimo)
  if (Number.isFinite(c) && c >= 0 && c <= maximoCreible) return { precio: c, origen: 'calendario' }
  return { precio: null, origen: null }
}

/** «2 h 30 min», «1 h», «45 min». */
export const minutosEnTexto = (minutos) => {
  const m = Math.round(Number(minutos))
  if (!Number.isFinite(m) || m <= 0) return null
  const h = Math.floor(m / 60)
  const resto = m % 60
  return [h > 0 ? `${h} h` : null, resto > 0 ? `${resto} min` : null].filter(Boolean).join(' ')
}

/** La duración: «2 h 30 min – 3 h» (mínima y máxima) o «3 h». */
export function textoDeDuracion(duracion) {
  if (!duracion || typeof duracion !== 'object') return null
  const min = minutosEnTexto(duracion.min)
  const max = minutosEnTexto(duracion.max ?? duracion.duration)
  if (min && max && min !== max) return `${min} – ${max}`
  return max ?? min
}

/** La política de cancelación en una frase (nunca la de la API tal cual: puede nombrar a la empresa). */
export function textoDeCancelacion(politicas) {
  const lista = Array.isArray(politicas) ? politicas.filter((p) => p && Number.isFinite(Number(p.hours))) : []
  if (lista.length === 0) return null
  const gratis = lista.filter((p) => Number(p.penalty) === 0).sort((a, b) => Number(b.hours) - Number(a.hours))[0]
  if (!gratis || Number(gratis.hours) <= 0) return 'No se puede cancelar sin coste.'
  const horas = Number(gratis.hours)
  const cuando = horas >= 48 && horas % 24 === 0 ? `${horas / 24} días antes` : horas >= 48 ? `${Math.round(horas / 24)} días antes` : `${horas} horas antes`
  return `Cancelación gratuita hasta ${cuando}.`
}

/** «Se puede reservar hasta 3 horas antes», «… hasta el mismo día a las 12:00», «… hasta 2 días antes». */
export function textoDeReservaHasta(adelanto) {
  if (!adelanto || typeof adelanto !== 'object') return null
  const minutos = Number(adelanto.minutes_before)
  if (Number.isFinite(minutos) && minutos > 0) {
    const horas = minutos / 60
    return `Se puede reservar hasta ${Number.isInteger(horas) ? `${horas} ${horas === 1 ? 'hora' : 'horas'}` : `${minutos} minutos`} antes.`
  }
  const dias = Number(adelanto.days)
  if (Number.isFinite(dias) && dias > 0) return `Se puede reservar hasta ${dias} ${dias === 1 ? 'día' : 'días'} antes${adelanto.hour ? `, a las ${String(adelanto.hour).slice(0, 5)}` : ''}.`
  if (adelanto.hour) return `Se puede reservar el mismo día hasta las ${String(adelanto.hour).slice(0, 5)}.`
  return null
}

/** El punto de encuentro: texto y coordenadas (en el mapa). Null si no trae coordenadas válidas. */
export function puntoDeEncuentro(direccion) {
  if (!direccion || typeof direccion !== 'object') return null
  const lat = Number(direccion.latitude)
  const lng = Number(direccion.longitude)
  const texto = sinMarca(direccion.shortAddress) ?? sinMarca(direccion.address)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return texto ? { texto, lat: null, lng: null } : null
  return { texto: texto ?? null, lat, lng }
}

/** Las fotos: la de la tarjeta (miniatura de lista) y las de la galería, de la cabecera y la galería de la API. */
export function fotosDe(fotos) {
  const cabecera = Array.isArray(fotos?.header) ? fotos.header : []
  const galeria = Array.isArray(fotos?.gallery) ? fotos.gallery : []
  const todas = [...cabecera, ...galeria].map((foto) => ({ url: foto?.paths?.list ?? foto?.paths?.grid ?? foto?.paths?.original ?? null, grande: foto?.paths?.original ?? foto?.paths?.list ?? null, pie: sinMarca(foto?.caption) })).filter((foto) => foto.url)
  return { principal: todas[0] ?? null, galeria: todas.slice(0, 8) }
}

/**
 * Lo que la app enseña de una actividad (`GET /activities/{id}`). Todo lo que falta, null o lista vacía.
 * @param {object} a  la respuesta de la API
 * @param {{ maximoCreible?: number, calendarioMinimo?: number|null }} [opciones]
 */
export function fichaDeActividad(a, opciones = {}) {
  if (!a || typeof a !== 'object' || a.id == null) return null
  const { precio, origen } = precioDesde(a, opciones)
  const original = Number(a.originalPrice)
  const gratis = a.isFreeTour === true
  return {
    id: Number(a.id),
    nombre: sinMarca(a.title) ?? 'Actividad',
    gratis,
    desde: precio,
    origenDelPrecio: origen,
    // El precio original solo se tacha si es más alto que el actual y creíble.
    original: Number.isFinite(original) && precio != null && original > precio && original <= (opciones.maximoCreible ?? 2000) ? original : null,
    moneda: typeof a.currency === 'string' ? a.currency : null,
    precioReal: a.amountType === 'PVP',
    valoracion: valoracionSobre10(a.score),
    opiniones: Number.isFinite(Number(a.reviews)) && Number(a.reviews) > 0 ? Number(a.reviews) : null,
    fotos: fotosDe(a.photos),
    incluye: listaSinMarca(a.included),
    noIncluye: listaSinMarca(a.notIncluded),
    cancelacion: textoDeCancelacion(a.cancelPolicies),
    reservarHasta: textoDeReservaHasta(a.advance),
    duracion: textoDeDuracion(a.duration),
    puntoDeEncuentro: puntoDeEncuentro(a.address),
    idiomas: Array.isArray(a.guideLanguages) ? a.guideLanguages.filter((x) => typeof x === 'string') : [],
    maxPersonas: Number(a.maximumPaxPerActivity) > 0 ? Number(a.maximumPaxPerActivity) : null,
    url: enlaceDeActividad(a.url),
  }
}

/** Una línea de la lista de actividades de un sitio o de un destino (menos datos que la ficha entera). */
export function fichaCorta(a, opciones = {}) {
  const f = fichaDeActividad(a, opciones)
  return f ? { id: f.id, nombre: f.nombre, gratis: f.gratis, desde: f.desde, valoracion: f.valoracion, opiniones: f.opiniones, foto: f.fotos.principal?.url ?? null, puntoDeEncuentro: f.puntoDeEncuentro, url: f.url } : null
}

// ── El calendario ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** El precio más barato de ADULTO (la tarifa que se puede reservar sola, no la de niños) que sale en un calendario, para cuando la actividad no da un «desde» creíble. */
export function precioMinimoDelCalendario(calendario) {
  let minimo = null
  for (const tarifa of Object.values(calendario?.baseRates ?? {})) {
    for (const hora of tarifa?.hours ?? []) {
      for (const rate of hora?.rates ?? []) {
        for (const categoria of rate?.categories ?? []) {
          if (categoria?.canBookAlone !== true) continue // (niños y menores no pueden reservar solos: su precio no es el «desde» de la actividad)
          const p = Number(categoria?.price)
          if (Number.isFinite(p) && p > 0 && (minimo == null || p < minimo)) minimo = p
        }
      }
    }
  }
  return minimo
}

/**
 * Las horas LIBRES de un día según el calendario: [{ hora: '11:00', plazas: 36 | null }]. `plazas` es el número real de la API; -1 (sin límite) y lo que no dice, null.
 * Una hora sin plazas (quota 0) no sale. Un día que no está en el calendario, o sin ninguna hora libre, da [].
 */
export function horasLibresDelDia(calendario, fechaIso) {
  const dia = (calendario?.schedule ?? []).find((d) => d?.date === fechaIso)
  if (!dia) return []
  const horas = new Map()
  for (const id of dia.baseRatesId ?? []) {
    for (const h of calendario?.baseRates?.[id]?.hours ?? []) {
      if (!/^\d{1,2}:\d{2}$/.test(String(h?.hour ?? ''))) continue
      const hora = String(h.hour).length === 4 ? `0${h.hour}` : String(h.hour)
      const cuota = Number(h.quota)
      if (Number.isFinite(cuota) && cuota === 0) continue // agotada
      const plazas = Number.isFinite(cuota) && cuota > 0 ? cuota : null
      const previa = horas.get(hora)
      horas.set(hora, { hora, plazas: previa ? (previa.plazas == null || plazas == null ? null : previa.plazas + plazas) : plazas })
    }
  }
  return [...horas.values()].sort((x, y) => x.hora.localeCompare(y.hora))
}

/**
 * La frase de las plazas, solo si quedan pocas y con el número REAL de la API: 1 → «Última plaza»; hasta `ultimasHasta` → «Últimas 3 plazas»; hasta `avisarHasta` → «5 plazas disponibles».
 * Con más, o sin número, null: no se dice nada.
 */
export function textoDePlazas(plazas, { avisarHasta = 10, ultimasHasta = 3 } = {}) {
  const n = Number(plazas)
  if (plazas == null || !Number.isInteger(n) || n <= 0 || n > avisarHasta) return null
  if (n === 1) return 'Última plaza'
  if (n <= ultimasHasta) return `Últimas ${n} plazas`
  return `${n} plazas disponibles`
}

/** Las horas libres de un día ya con su frase de plazas, listas para la app. `sinPlazas`: el día no tiene ninguna hora libre. */
export function horasParaLaApp(calendario, fechaIso, ajustesPlazas) {
  const libres = horasLibresDelDia(calendario, fechaIso)
  return { fecha: fechaIso, sinPlazas: libres.length === 0, horas: libres.map((h) => ({ hora: h.hora, plazas: h.plazas, aviso: textoDePlazas(h.plazas, ajustesPlazas) })) }
}

/** ¿La actividad trabaja con horas fijas? (Alguna franja del calendario con hora válida, aunque esté agotada.) Sin horas fijas (entrada abierta todo el día), no hay hora que recomendar. */
export function tieneHorasFijas(calendario) {
  return Object.values(calendario?.baseRates ?? {}).some((tarifa) => (tarifa?.hours ?? []).some((h) => /^\d{1,2}:\d{2}$/.test(String(h?.hour ?? ''))))
}

/** Pasa «9:5» o «09:05» a «09:05» (o null). */
export const horaNormalizada = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  return m ? `${dosDigitos(Number(m[1]))}:${m[2]}` : null
}

/** Los días de un calendario que tienen al menos una hora libre (para el Free Tour: «hay tour esos días»). */
export function diasConHoras(calendario) {
  return (calendario?.schedule ?? []).filter((d) => horasLibresDelDia(calendario, d.date).length > 0).map((d) => d.date)
}
