import datos from '../../data/hoy/avisos_tiempo.json'
import { parseTimeToMinutes } from './time'
import { hasRealCoordinates } from './distanceMock'
import { isNumberedStop } from './stopKind'
import type { HourlyRain } from './rainForecast'
import type { Coordinates, DayPlan, Stop } from './types'

/**
 * LOS AVISOS DEL TIEMPO EN DIRECTO (HOY1, apartado 6; H12, C14 y C15 de Design). Todo puro: de la previsión por horas (lluvia, nubes bajas, rachas) y de las paradas que quedan, qué avisos tocan y qué se propone.
 * Los umbrales y los sitios NO están aquí: viven en `data/hoy/avisos_tiempo.json`. Nada se mueve solo: `aplicarCambio` la llama el viajero con [Cambiar al plan de lluvia] y `volverAlPlan` es el [Deshacer].
 */
export const UMBRALES = datos.umbrales
export const TEXTOS = datos.lanzarote.textos
type Sitio = { clave: string; nombre: string; solo_si_tapado?: string }
type SitioACubierto = { clave: string; nombre: string; dicho: string; lat: number; lng: number; minutos: number; abre: string; cierra: string; reserva: boolean }
const MIRADORES: Sitio[] = datos.lanzarote.miradores_de_nubes
const DE_VIENTO: Sitio[] = datos.lanzarote.sitios_de_viento
const A_CUBIERTO: SitioACubierto[] = datos.lanzarote.a_cubierto
const PALABRAS_A_CUBIERTO: string[] = datos.lanzarote.ya_a_cubierto_si_el_nombre_contiene

export type TipoAviso = 'lluvia' | 'nubes' | 'viento'
export interface Entra {
  clave: string
  nombre: string
  /** Con artículo, para las frases: «la Cueva de los Verdes». */
  dicho: string
  minutos: number
  reserva: boolean
  coordenadas: Coordinates
}
export interface AvisoTiempo {
  /** Uno por tipo y por día. */
  id: string
  tipo: TipoAviso
  /** El texto del cartel (H12). */
  texto: string
  /** Las paradas que salen (ids) y sus nombres. */
  salen: { id: string; nombre: string }[]
  /** Para «Hoy toca descansar»: todas las que quedan al aire libre con lluvia (puede ser más de las que salen en el cambio). */
  salenTodas?: { id: string; nombre: string }[]
  /** Lo que entra (vacío si «Hoy toca descansar» o si solo se avisa). */
  entra: Entra[]
  /** «Esta tarde», «esta mañana», «hoy». */
  cuando: string
}

export const normalizar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Una parada que ya es a cubierto (un museo, una cueva, un castillo…): con lluvia no sale. */
const yaACubierto = (stop: Stop): boolean => A_CUBIERTO.some((c) => cuenta(stop, c.clave)) || PALABRAS_A_CUBIERTO.some((p) => normalizar(stop.name).includes(p))

const cuenta = (stop: Stop, clave: string) => normalizar(stop.name).includes(clave) || normalizar(stop.fullName ?? '').includes(clave)

/** Las horas (0-23) que ocupa una parada. */
export function horasDeParada(stop: Stop): number[] {
  if (!/^\d{1,2}:\d{2}$/.test(stop.time ?? '')) return []
  const ini = parseTimeToMinutes(stop.time)
  const fin = ini + Math.max(30, stop.durationMinutes || 60)
  const horas: number[] = []
  for (let h = Math.floor(ini / 60); h <= Math.floor((fin - 1) / 60); h++) if (h >= 0 && h <= 23) horas.push(h)
  return horas
}

export const llueveEnHora = (m: HourlyRain, h: number): boolean => (m.probability[h] ?? 0) >= UMBRALES.lluvia.probabilidad_pct || (m.precipitation[h] ?? 0) >= UMBRALES.lluvia.mm_por_hora
export const hayNubesEnHora = (m: HourlyRain, h: number): boolean => (m.cloud?.[h] ?? 0) >= UMBRALES.nubes.nubes_bajas_pct
export const hayVientoEnHora = (m: HourlyRain, h: number): boolean => (m.gust?.[h] ?? 0) >= UMBRALES.viento.rachas_kmh

/** Lo que queda por hacer del día: con número, sin ver, sin saltar y sin reserva fija (las reservas no se tocan nunca). */
export function paradasQueQuedan(day: DayPlan): Stop[] {
  return day.stops.filter((s) => isNumberedStop(s) && !s.isArrival && !s.checkedInAt && !s.saltada)
}

/** «esta mañana» / «esta tarde» / «hoy» según las horas con lluvia. */
export function cuandoLlueve(horas: number[]): string {
  if (horas.every((h) => h < 14)) return 'esta mañana'
  if (horas.every((h) => h >= 14)) return 'esta tarde'
  return 'hoy'
}

const km = (a: Coordinates, b: Coordinates) => {
  const r = Math.PI / 180
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r)
  const y = (b.lat - a.lat) * r
  return Math.sqrt(x * x + y * y) * 6371
}

const aMinutos = (hhmm: string) => parseTimeToMinutes(hhmm)

/** Los sitios a cubierto que se pueden proponer para una hora: no están ya en el día, abren a esa hora, y se ordenan por cercanía al sitio que sale. Los que piden reserva van al final. */
export function aCubiertoPara(day: DayPlan, salen: Stop[], cuantos: number): Entra[] {
  const centro = salen.find((s) => hasRealCoordinates(s.coordinates))?.coordinates ?? day.stops.find((s) => hasRealCoordinates(s.coordinates))?.coordinates
  const hora = salen[0]?.time && /^\d{1,2}:\d{2}$/.test(salen[0].time) ? aMinutos(salen[0].time) : null
  const candidatos = A_CUBIERTO.filter((c) => !day.stops.some((s) => cuenta(s, c.clave))).filter((c) => (hora == null ? true : hora >= aMinutos(c.abre) && hora + Math.min(c.minutos, 45) <= aMinutos(c.cierra)))
  const ordenados = [...candidatos].sort((a, b) => Number(a.reserva) - Number(b.reserva) || (centro ? km(centro, { lat: a.lat, lng: a.lng }) - km(centro, { lat: b.lat, lng: b.lng }) : 0))
  return ordenados.slice(0, cuantos).map((c) => ({ clave: c.clave, nombre: c.nombre, dicho: c.dicho, minutos: c.minutos, reserva: c.reserva, coordenadas: { lat: c.lat, lng: c.lng } }))
}

/** El texto «A o B» / «A, B o C». */
export const listaDeNombres = (nombres: string[]): string => (nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} o ${nombres[nombres.length - 1]}`)

const rellena = (texto: string, valores: Record<string, string>) => texto.replace(/\{(\w+)\}/g, (_, k: string) => valores[k] ?? '')

/** Los avisos del tiempo que tocan ahora. Lluvia: en todo destino de coche con sitios a cubierto (Lanzarote). Nubes y viento: solo los sitios de las listas. Roma conserva el aviso de lluvia de siempre (RainAlert). */
export function calcularAvisos(day: DayPlan, meteo: HourlyRain, esLanzarote: boolean): AvisoTiempo[] {
  if (!esLanzarote) return []
  const quedan = paradasQueQuedan(day).filter((s) => !s.reservedId)
  const avisos: AvisoTiempo[] = []

  // ── Lluvia: las paradas que quedan con lluvia en sus horas, y que NO están ya a cubierto ──
  const alAire = quedan.filter((s) => !yaACubierto(s) && horasDeParada(s).some((h) => llueveEnHora(meteo, h)))
  const todasLasQueQuedan = paradasQueQuedan(day)
  const horasMojadas = [...new Set(todasLasQueQuedan.flatMap(horasDeParada).filter((h) => llueveEnHora(meteo, h)))]
  if (horasMojadas.length > 0 && alAire.length > 0) {
    const salen = alAire.slice(0, 2)
    const entra = aCubiertoPara(day, salen, salen.length)
    const cuando = cuandoLlueve(horasMojadas)
    avisos.push({
      id: 'lluvia',
      tipo: 'lluvia',
      cuando,
      salen: salen.map((s) => ({ id: s.id, nombre: s.name })),
      salenTodas: alAire.map((s) => ({ id: s.id, nombre: s.name })),
      entra,
      texto: entra.length > 0 ? rellena(TEXTOS.lluvia, { cuando, sitios: listaDeNombres(entra.map((e) => e.dicho)) }) : rellena(TEXTOS.lluvia_sin_sitio, { cuando }),
    })
  }

  // ── Nubes en el norte sobre un mirador del día ──
  const tapados = quedan.filter((s) => MIRADORES.some((m) => cuenta(s, m.clave)) && horasDeParada(s).some((h) => hayNubesEnHora(meteo, h)))
  if (tapados.length > 0) {
    const primero = tapados[0]
    const sitio = MIRADORES.find((m) => cuenta(primero, m.clave))!
    // «Guinate si solo está tapado el Río»: si lo tapado es solo el Río y Guinate no está ya en el día, se cambia por Guinate.
    const soloElRio = tapados.length === 1 && sitio.solo_si_tapado && !day.stops.some((s) => cuenta(s, sitio.solo_si_tapado!))
    const guinate = soloElRio ? MIRADORES.find((m) => m.clave === sitio.solo_si_tapado) : null
    const guinateCoord = guinate ? { lat: 29.18433, lng: -13.50116 } : null
    const entra: Entra[] = guinate && guinateCoord ? [{ clave: guinate.clave, nombre: guinate.nombre, dicho: 'el Mirador de Guinate', minutos: 20, reserva: false, coordenadas: guinateCoord }] : aCubiertoPara(day, [primero], 1)
    avisos.push({
      id: 'nubes',
      tipo: 'nubes',
      cuando: 'hoy',
      salen: [{ id: primero.id, nombre: primero.name }],
      entra,
      texto: entra.length > 0 ? rellena(TEXTOS.nubes_con_cambio, { sitio: sitio.nombre, nuevo: entra[0].nombre }) : rellena(TEXTOS.nubes, { sitio: sitio.nombre }),
    })
  }

  // ── Viento fuerte en Las Grietas, Los Hervideros o los miradores de Famara ──
  const ventosos = quedan.filter((s) => DE_VIENTO.some((v) => cuenta(s, v.clave)) && horasDeParada(s).some((h) => hayVientoEnHora(meteo, h)))
  if (ventosos.length > 0) {
    const primero = ventosos[0]
    const sitio = DE_VIENTO.find((v) => cuenta(primero, v.clave))!
    const entra = aCubiertoPara(day, [primero], 1)
    avisos.push({ id: 'viento', tipo: 'viento', cuando: 'hoy', salen: [{ id: primero.id, nombre: primero.name }], entra, texto: rellena(TEXTOS.viento, { sitio: sitio.nombre }) })
  }
  return avisos
}

/** C15: ¿ha parado de llover? Llovió en alguna de las horas de antes (`llovia_en_las_ultimas_horas`) y esta hora y las siguientes (`horas_seguidas`) quedan por debajo de las cifras de «ha parado». Sin lluvia antes, no «ha parado»: aún no ha empezado. */
export function haParadoDeLlover(meteo: HourlyRain, horaAhora: number): boolean {
  const u = UMBRALES.ha_parado
  let llovia = false
  for (let i = 1; i <= u.llovia_en_las_ultimas_horas; i++) if (horaAhora - i >= 0 && llueveEnHora(meteo, horaAhora - i)) llovia = true
  if (!llovia) return false
  for (let i = 0; i < u.horas_seguidas; i++) {
    const h = horaAhora + i
    if (h > 23) break
    if ((meteo.probability[h] ?? 0) >= u.probabilidad_pct_menos_de || (meteo.precipitation[h] ?? 0) >= u.mm_por_hora_menos_de) return false
  }
  return true
}

/** Una parada nueva para lo que entra. Va a la hora de la que sale y dura lo que dura el sitio, sin pasar de la hora de la siguiente. */
function paradaNueva(e: Entra, hora: string, hastaMin: number | null, id: string): Stop {
  const ini = /^\d{1,2}:\d{2}$/.test(hora) ? aMinutos(hora) : 0
  let dur = e.minutos
  if (hastaMin != null && hastaMin > ini) dur = Math.max(20, Math.min(dur, hastaMin - ini))
  return { id, time: hora, name: e.nombre, description: '', durationMinutes: dur, coordinates: e.coordenadas, photoUrl: '', addedByUser: true } as Stop
}

/**
 * [Cambiar al plan de lluvia]: las paradas que salen se sustituyen (misma hora) por lo que entra; sin lo que entra («Hoy toca descansar»), simplemente salen. Las reservas no se tocan. Se guarda la copia para el [Deshacer].
 */
export function aplicarCambio(day: DayPlan, aviso: AvisoTiempo, descansar = false): DayPlan {
  if (day.rainBackup) return day
  const ids = new Set((descansar ? (aviso.salenTodas ?? aviso.salen) : aviso.salen).map((s) => s.id))
  const original = day.stops
  const nuevos: Stop[] = []
  let entradas = 0
  for (let i = 0; i < original.length; i++) {
    const s = original[i]
    if (!ids.has(s.id) || s.reservedId) {
      nuevos.push(s)
      continue
    }
    const e = descansar ? undefined : aviso.entra[entradas++]
    if (!e) continue
    const siguiente = original.slice(i + 1).find((o) => /^\d{1,2}:\d{2}$/.test(o.time ?? '') && !ids.has(o.id))
    nuevos.push(paradaNueva(e, s.time, siguiente ? aMinutos(siguiente.time) : null, `tiempo-${aviso.tipo}-${e.clave}`))
  }
  // Lo que entra y sobra (más sitios que paradas que salen) no se añade: nunca crece el día.
  return { ...day, stops: nuevos, rainBackup: { stops: original, motivo: descansar ? 'descansar' : aviso.tipo } }
}

/**
 * [Deshacer] y [Volver al plan]: vuelve el plan de antes, pero lo que ya se ha visto o saltado desde el cambio se queda marcado (no se pierde nada de lo hecho).
 */
export function volverAlPlan(day: DayPlan): DayPlan {
  const copia = day.rainBackup
  if (!copia) return day
  const actuales = new Map(day.stops.map((s) => [s.id, s]))
  const stops = copia.stops.map((s) => {
    const ahora = actuales.get(s.id)
    return ahora ? { ...s, checkedInAt: ahora.checkedInAt ?? s.checkedInAt, saltada: ahora.saltada ?? s.saltada } : s
  })
  // Una parada que entró por el aviso y ya está vista se queda (es lo que se hizo de verdad).
  for (const s of day.stops) if (s.id.startsWith('tiempo-') && s.checkedInAt && !stops.some((o) => o.id === s.id)) stops.push(s)
  stops.sort((a, b) => (/^\d/.test(a.time) && /^\d/.test(b.time) ? aMinutos(a.time) - aMinutos(b.time) : 0))
  return { ...day, stops, rainBackup: null }
}

/** ¿El cambio guardado lo hizo este aviso (y no el «Si llueve» de Roma)? */
export const motivoDelCambio = (day: DayPlan): TipoAviso | 'descansar' | null => day.rainBackup?.motivo ?? null
