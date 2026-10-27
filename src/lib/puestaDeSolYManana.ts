import { dayOfReservation } from './bookings'
import type { Reservation } from './bookings'
import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { displayStopName } from './format'
import { numberedStopsOf } from './stopKind'
import { parseTimeToMinutes } from './time'
import type { DayPlan, Route, Stop } from './types'

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
function conArticuloMinuscula(nombre: string): string {
  const limpio = displayStopName(nombre).trim()
  if (/^(el|la|los|las)\s/i.test(limpio)) return limpio.replace(/^(El|La|Los|Las)\s/, (a) => a.toLowerCase())
  return limpio
}
/** «Al Janículo», «A la Villa Borghese», «A Villa Borghese». */
function haciaElSitio(nombre: string): string {
  const limpio = displayStopName(nombre).trim()
  const m = /^(el|la|los|las)\s+(.*)$/i.exec(limpio)
  if (!m) return `A ${limpio}`
  return m[1].toLowerCase() === 'el' ? `Al ${m[2]}` : `A ${m[1].toLowerCase()} ${m[2]}`
}

export interface FraseDeAtardecer {
  tipo: 'siguiente' | 'cerca'
  texto: string
  /** Para marcar en la prueba qué sitio dice la frase. */
  sitio: string
}

/**
 * La frase del atardecer de HOY, o null. `siguiente`: la siguiente parada pendiente de hoy. `otrosMiradores`: miradores del atardecer de la ruta (otros días, «si te sobra tiempo») entre los que buscar uno cerca.
 */
export function fraseDeAtardecer(p: { day: DayPlan; siguiente: Stop | null; pendientes: Stop[]; otrosMiradores: Stop[]; desde?: Stop | null; ahoraMin?: number }): FraseDeAtardecer | null {
  const hora = horaDelSol(p.day)
  if (!hora || !p.siguiente) return null
  if (p.siguiente.isSunset) return { tipo: 'siguiente', sitio: p.siguiente.name, texto: `${haciaElSitio(p.siguiente.name)} para el atardecer: el sol se pone a las ${hora}` }
  // Sin mirador del atardecer en lo que queda de hoy: uno cerca, a media tarde.
  if (p.pendientes.some((s) => s.isSunset)) return null
  // A media tarde: la siguiente parada es de las 14:00 en adelante, o ya son las 14:00 en el reloj del viajero y el sol aún no se ha puesto.
  const t = p.siguiente.time ? parseTimeToMinutes(p.siguiente.time) : NaN
  const [hs, ms] = hora.split(':').map(Number)
  const relojDeTarde = p.ahoraMin !== undefined && p.ahoraMin >= MEDIA_TARDE_DESDE_MIN && p.ahoraMin < hs * 60 + ms
  if (!(t >= MEDIA_TARDE_DESDE_MIN) && !relojDeTarde) return null
  const base = p.desde && hasRealCoordinates(p.desde.coordinates) ? p.desde : hasRealCoordinates(p.siguiente.coordinates) ? p.siguiente : null
  if (!base) return null
  let mejor: { stop: Stop; min: number } | null = null
  for (const mirador of p.otrosMiradores) {
    if (!mirador.isSunset || !hasRealCoordinates(mirador.coordinates)) continue
    const min = Math.max(1, Math.round(haversineMeters(base.coordinates, mirador.coordinates) / METROS_POR_MINUTO))
    if (min <= MINUTOS_MAXIMOS_AL_MIRADOR && (!mejor || min < mejor.min)) mejor = { stop: mirador, min }
  }
  if (!mejor) return null
  return { tipo: 'cerca', sitio: mejor.stop.name, texto: `Hoy el sol se pone a las ${hora} · ${conArticuloMinuscula(mejor.stop.name)} está a ${mejor.min} min` }
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
