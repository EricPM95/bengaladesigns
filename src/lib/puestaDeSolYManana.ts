import { dayOfReservation } from './bookings'
import sitiosDeAtardecer from '../data/sitiosDeAtardecer.json'
import type { Reservation } from './bookings'
import { haversineMeters } from './distanceMock'
import { displayStopName } from './format'
import { numberedStopsOf } from './stopKind'
import { parseTimeToMinutes } from './time'
import { sunsetMinutesOn } from '../../shared/routeEngine/sunset.js'
import type { Coordinates, DayPlan, Route, Stop } from './types'

/**
 * «LA PUESTA DE SOL Y LO DE MAÑANA», EN HOY (Tanda 10P, 1.3; con el pase y el día de prueba). Dos frases pedidas por Eric (la app ya no enseña horas salvo estas):
 *  · el atardecer: «Al Janículo para el atardecer: el sol se pone a las 17:02», o, sin mirador en la ruta de hoy y con uno cerca a media tarde, «Hoy el sol se pone a las 17:02 · el Janículo está a 15 min»;
 *  · lo de mañana: «Mañana: Vaticano y Trastevere · empiezas a las 9:00», con la reserva con hora si la hay («Tienes entrada a los Museos Vaticanos a las 10:00»). El último día del viaje, nada.
 * La hora del sol la calcula el motor con la fecha del día (`DayPlan.sunsetText`, «Hoy el sol se pone a las 17:05»); aquí solo se lee. Sin ese dato no se dice ninguna hora. Sin React.
 */

const METROS_POR_MINUTO = 80
/** Un mirador del atardecer cuenta como «cerca» hasta esta distancia a pie. */
export const MINUTOS_MAXIMOS_AL_MIRADOR = 25
/** «A media tarde»: la siguiente parada es de las 14:00 en adelante (y el sol aún no se ha puesto). */
export const MEDIA_TARDE_DESDE_MIN = 14 * 60

/** «17:05» → «17:05» tal cual; sin hora en el texto, null. */
export function horaDelSol(day: Pick<DayPlan, 'sunsetText'>): string | null {
  const m = /(\d{1,2}):(\d{2})/.exec(day.sunsetText ?? '')
  return m ? `${Number(m[1])}:${m[2]}` : null
}

/** «el Janículo», «la Villa Borghese»: el nombre con su artículo en minúscula si no lo trae. */
export function conArticuloMinuscula(nombre: string): string {
  const limpio = displayStopName(nombre).trim()
  if (/^(el|la|los|las)\s/i.test(limpio)) return limpio.replace(/^(El|La|Los|Las)\s/, (a) => a.toLowerCase())
  return limpio
}
/**
 * (LG1, retoque de la HOY1, Eric 4-nov) EL ATARDECER (H13), EN ROMA Y EN LANZAROTE. Sale desde unas 2 horas antes de la puesta de sol.
 *  · Si el día tiene parada de atardecer (El Golfo, el Faro de Pechiguera, Famara, el Pincio…): «Hoy ves el atardecer en El Golfo: el sol se pone a las 18:04. Llega un cuarto de hora antes, que es cuando más bonito está.» + [Cómo llegar].
 *  · Si no: «Hoy el sol se pone a las 18:04. Si te apetece verlo, estos sitios están cerca:» y 2 o 3 sitios de atardecer de NUESTROS datos (`src/data/sitiosDeAtardecer.json`, que sale de
 *    `scripts/destino/generarSitiosDeAtardecer.mjs`), los más cercanos a donde está el viajero, con su tiempo (a pie o en coche) y [Cómo llegar]. En Lanzarote, además: «Aquí el sol cae al mar.»
 * La hora del sol: la del motor (`DayPlan.sunsetText`) y, si el día no la lleva (los días de coche de Lanzarote, algunos de Roma), la calculada con la fecha (`shared/routeEngine/sunset.js`).
 */
const SOL_POR_DESTINO: Record<string, { centro: [number, number]; zona: string }> = {
  lanzarote: { centro: [29.0024, -13.6114], zona: 'Atlantic/Canary' },
  roma: { centro: [41.9028, 12.4964], zona: 'Europe/Rome' },
}
/** Desde cuántos minutos antes de la puesta de sol sale la tarjeta, y hasta cuántos después. */
export const ATARDECER_ANTES_MIN = 120
export const ATARDECER_DESPUES_MIN = 15
/** A pie hasta esta duración; más lejos, en coche (solo si va en coche). */
const MAX_A_PIE_MIN = 30
const MAX_EN_COCHE_MIN = 45
const KM_H_COCHE = 40

type SitioAtardecer = { id: string; nombre: string; corto: string; alias: string[]; lat: number; lng: number }
const listaDe = (destino: string | undefined): { mar: boolean; sitios: SitioAtardecer[] } | null => (sitiosDeAtardecer as Record<string, { mar: boolean; sitios: SitioAtardecer[] }>)[(destino ?? '').trim().toLowerCase()] ?? null
const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export interface AtardecerDeDestino {
  /** «18:04». */
  hora: string
  mar: boolean
  sitios: SitioAtardecer[]
}
/** La hora del sol de una fecha en el destino y sus sitios de atardecer; null si el destino no está en la lista o falta la fecha. */
export function atardecerDelDestino(destino: string | undefined, dateIso: string | undefined): AtardecerDeDestino | null {
  const clave = (destino ?? '').trim().toLowerCase()
  const d = SOL_POR_DESTINO[clave]
  const lista = listaDe(destino)
  if (!d || !lista || !dateIso) return null
  const min = sunsetMinutesOn(dateIso, d.centro, d.zona)
  if (min == null) return null
  return { hora: `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`, mar: lista.mar, sitios: lista.sitios }
}
/** El sitio de atardecer de la lista al que corresponde una parada del día, o null. */
export function sitioDeAtardecerDe(sol: AtardecerDeDestino | null, s: Pick<Stop, 'name'>): SitioAtardecer | null {
  if (!sol) return null
  const n = sinTildes(s.name)
  return sol.sitios.find((x) => x.alias.some((a) => n.includes(a))) ?? null
}

export interface SitioCercaDelSol {
  nombre: string
  coordinates: { lat: number; lng: number }
  minutos: number
  modo: 'a_pie' | 'coche'
}
export interface FraseDeAtardecer {
  /** 'parada': el día tiene parada de atardecer; 'cerca': no la tiene y se enseñan sitios cerca; 'solo_hora': no hay sitios a mano, solo la hora. */
  tipo: 'parada' | 'cerca' | 'solo_hora'
  texto: string
  hora: string
  /** El nombre de la parada del atardecer (tipo 'parada'). */
  sitio: string
  parada?: Stop
  /** Los 2 o 3 sitios más cercanos (tipo 'cerca'). */
  cerca: SitioCercaDelSol[]
  /** «Aquí el sol cae al mar.» (Lanzarote) */
  extra: string | null
}

/**
 * La tarjeta del atardecer de HOY, o null (fuera de la ventana de 2 horas, sin hora del sol o sin paradas por hacer).
 * `pendientes`: las paradas de hoy que faltan. `desde`: dónde está el viajero (su ubicación, o la parada anterior / la siguiente / casa).
 */
export function fraseDeAtardecer(p: { day: DayPlan; pendientes: Stop[]; desde?: Coordinates | null; ahoraMin?: number; delDestino?: AtardecerDeDestino | null; enCoche?: boolean }): FraseDeAtardecer | null {
  const hora = horaDelSol(p.day) ?? p.delDestino?.hora ?? null
  if (!hora) return null
  const [hs, ms] = hora.split(':').map(Number)
  const sol = hs * 60 + ms
  if (p.ahoraMin !== undefined && (p.ahoraMin < sol - ATARDECER_ANTES_MIN || p.ahoraMin > sol + ATARDECER_DESPUES_MIN)) return null
  const mar = Boolean(p.delDestino?.mar)
  const extra = mar ? 'Aquí el sol cae al mar.' : null
  // La parada del atardecer del día: una marcada por el motor (`isSunset`) o una de la lista de sitios de atardecer.
  const delDia = p.pendientes.find((s) => s.isSunset) ?? p.pendientes.find((s) => sitioDeAtardecerDe(p.delDestino ?? null, s))
  if (delDia) {
    const lugar = sitioDeAtardecerDe(p.delDestino ?? null, delDia)?.corto ?? conArticuloMinuscula(delDia.name)
    return { tipo: 'parada', hora, sitio: delDia.name, parada: delDia, cerca: [], extra, texto: `Hoy ves el atardecer en ${lugar}: el sol se pone a las ${hora}. Llega un cuarto de hora antes, que es cuando más bonito está.` }
  }
  const sinSitios: FraseDeAtardecer = { tipo: 'solo_hora', hora, sitio: '', cerca: [], extra, texto: `Hoy el sol se pone a las ${hora}.` }
  if (!p.delDestino || !p.desde) return sinSitios
  const cerca: SitioCercaDelSol[] = []
  for (const x of p.delDestino.sitios) {
    const m = haversineMeters(p.desde, { lat: x.lat, lng: x.lng })
    const aPie = Math.max(1, Math.round(m / METROS_POR_MINUTO))
    const coche = Math.max(2, Math.round(((m * 1.3) / 1000 / KM_H_COCHE) * 60))
    if (aPie <= MAX_A_PIE_MIN) cerca.push({ nombre: x.nombre, coordinates: { lat: x.lat, lng: x.lng }, minutos: aPie, modo: 'a_pie' })
    else if (p.enCoche && coche <= MAX_EN_COCHE_MIN) cerca.push({ nombre: x.nombre, coordinates: { lat: x.lat, lng: x.lng }, minutos: coche, modo: 'coche' })
  }
  cerca.sort((a, b) => a.minutos - b.minutos)
  const tres = cerca.slice(0, 3)
  if (tres.length === 0) return sinSitios
  // (HOY2b 6, Eric 5-nov. Antes: título «Hoy el sol se pone a las 18:04. Si te apetece verlo, estos sitios están cerca:» y, DESPUÉS de los dos puntos, «Aquí el sol cae al mar.». Ahora: el título solo dice la hora; debajo, de corrido,
  // «Aquí el sol se esconde en el mar. Si te apetece verlo, te recomendamos estos sitios:» (la frase del mar, solo en Lanzarote) y, cada sitio con su foto, su tiempo y [Cómo llegar].)
  return { tipo: 'cerca', hora, sitio: '', cerca: tres, extra: `${mar ? 'Aquí el sol se esconde en el mar. ' : ''}Si te apetece verlo, te recomendamos estos sitios:`, texto: `Hoy el sol se pone a las ${hora}` }
}

export interface TarjetaDeManana {
  texto: string
  /** «Tienes entrada a los Museos Vaticanos a las 10:00», si mañana hay una reserva con hora. */
  reserva: string | null
  diaId: string
}

const horaCorta = (hhmm: string): string => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm)
  return m ? `${Number(m[1])}:${m[2]}` : hhmm
}

/** El día siguiente del viaje a `day`, o null si es el último (el último día no lleva «lo de mañana»). */
export function diaSiguiente(route: Pick<Route, 'days'>, day: DayPlan): DayPlan | null {
  const i = route.days.findIndex((d) => d.id === day.id)
  return i >= 0 ? (route.days[i + 1] ?? null) : null
}

/** ¿Toca enseñar lo de mañana? Después de la última parada, o a partir de la hora de la cena. */
export function tocaLoDeManana(p: { paradasDeHoy: number; quedanPendientes: boolean; cenaMin: number | null; ahoraMin: number }): boolean {
  if (p.paradasDeHoy > 0 && !p.quedanPendientes) return true
  return p.cenaMin !== null && p.ahoraMin >= p.cenaMin
}

/**
 * La tarjeta de «Mañana». `nombreDelDia`: el título del día de mañana (el mismo de DÍAS, `nombreDelDia`). `nombreCorto`: el nombre de la entrada con su artículo («los Museos Vaticanos»).
 */
export function tarjetaDeManana(p: {
  route: Route
  day: DayPlan
  reservations: Reservation[]
  nombreDelDia: (dia: DayPlan) => string
  nombreCorto?: (r: Reservation) => string | null
}): TarjetaDeManana | null {
  const manana = diaSiguiente(p.route, p.day)
  if (!manana) return null
  const titulo = p.nombreDelDia(manana)
  const primera = numberedStopsOf(manana).find((s) => !s.saltada && s.time)
  const empieza = primera?.time ? horaCorta(primera.time) : null
  const entradas = p.reservations
    .filter((r) => r.kind === 'entrada' && !r.fueraDeRuta && r.time && dayOfReservation(p.route, r)?.id === manana.id)
    .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
  const e = entradas[0]
  const quien = e ? (p.nombreCorto?.(e) ?? displayStopName(e.placeNames[0] ?? e.name)) : null
  return {
    diaId: manana.id,
    texto: empieza ? `Mañana: ${titulo} · empiezas a las ${empieza}` : `Mañana: ${titulo}`,
    reserva: e && quien ? `Tienes entrada a ${quien} a las ${horaCorta(e.time)}` : null,
  }
}
