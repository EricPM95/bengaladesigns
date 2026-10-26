/**
 * LAS ENTRADAS DE UN VIAJE COMPARTIDO (Tanda 10N §8). Funciones puras, sin React ni red.
 *
 * La regla de Eric (25-oct): lo que comparte el grupo (la llegada y la vuelta, el alojamiento) lo pone el dueño y el resto lo ve en gris; lo que paga cada uno (entradas, Free Tour, excursiones)
 * lo compra cada uno. La entrada que compra el dueño puede ser para varias personas (`Reservation.paraQuien`, ids de `Persona`): la ruta es una y la parada pasa al día y a la hora de esa reserva
 * para todos; las personas incluidas la ven «Reservada ✓»; las demás, «Comprar entrada», con el día y la hora del dueño para comprar la suya a la misma hora.
 * Una reserva sin `paraQuien` (las de antes de compartir el viaje) cuenta como «solo para mí»: solo para el dueño.
 */
import type { Persona } from '../store/useViajeCompartido'
import type { Reservation } from './bookings'
import { dayOfReservation } from './bookings'
import { shortOf } from './reservationOverlaps'
import { diaProsa } from './nombreDeDia'
import type { Route, Stop } from './types'

/** ¿Es un viaje compartido? El dueño y, al menos, otra persona. Sin eso, nada de «¿Para quién es?» ni de avisos de grupo. */
export const esViajeCompartido = (gente: readonly Persona[]): boolean => gente.length >= 2

/** El dueño del viaje, si se sabe. */
export const adminDe = (gente: readonly Persona[]): Persona | null => gente.find((p) => p.esAdmin) ?? null

/** Los ids de las personas a las que cubre una reserva DEL DUEÑO. Sin `paraQuien`: solo el dueño. */
export function idsIncluidos(reserva: Pick<Reservation, 'paraQuien'>, gente: readonly Persona[]): string[] {
  if (reserva.paraQuien && reserva.paraQuien.length > 0) return reserva.paraQuien
  const admin = adminDe(gente)
  return admin ? [admin.id] : []
}

/** ¿Cubre esta reserva (del dueño) a esa persona? */
export const incluyeA = (reserva: Pick<Reservation, 'paraQuien'>, gente: readonly Persona[], personaId: string | null | undefined): boolean =>
  Boolean(personaId) && idsIncluidos(reserva, gente).includes(personaId as string)

/** «2 de 4». */
export const cuantosDeCuantos = (marcados: number, total: number): string => `${marcados} de ${total}`

/** «8:00» (sin el cero de delante). */
export const horaCorta = (hhmm: string): string => {
  const [h, m] = String(hhmm).split(':')
  return `${Number(h)}:${m ?? '00'}`
}

/** El nombre de pila de una persona, o 'El dueño' si no tiene uno puesto (las pantallas no inventan un nombre). */
export const nombreDeLaPersona = (p: Pick<Persona, 'nombre'> | null | undefined): string => p?.nombre?.trim() || ''

/** El día de una reserva en prosa: «jueves 26» (con fechas) o «día 2» (sin ellas). */
export function diaDeLaReservaEnPalabras(route: Route, reserva: Reservation): string {
  const dia = dayOfReservation(route, reserva)
  if (dia) return diaProsa(route, dia.dayNumber)
  if (reserva.dateIso) return diaProsa({ answers: { ...route.answers, dateRange: { start: reserva.dateIso, end: reserva.dateIso } } } as Pick<Route, 'answers'>, 1)
  return reserva.dayNumber != null ? `día ${reserva.dayNumber}` : ''
}

/** «el Coliseo» (corto con artículo) o, si los datos del destino no lo traen, el nombre de la reserva. */
export const sitioCorto = (reserva: Reservation, nombresCortos?: Record<string, string>): string => shortOf(reserva, nombresCortos ?? null) ?? reserva.name

const conDe = (s: string): string => s.replace(/^(el) /i, 'del ').replace(/^(la|las|los) /i, (m) => `de ${m}`).replace(/^(?!del |de la |de las |de los )/i, 'de ')

/** «Eric va el jueves 26 a las 8:00»: la línea de la pestaña Entradas de la ficha. */
export const textoQuienVa = (quien: string, route: Route, reserva: Reservation): string => `${quien || 'El dueño'} va el ${diaDeLaReservaEnPalabras(route, reserva)} a las ${horaCorta(reserva.time)}`

export const esDeLaReserva = (stop: Stop, reserva: Reservation): boolean => !stop.passThrough && (reserva.refId === 'Free Tour' ? Boolean(stop.isFreeTour) : !stop.isFreeTour && reserva.placeNames.includes(stop.name))

export interface EntradaNoCuadra {
  id: string
  texto: string
  /** Lo que se le propone al invitado: la hora o el día de la ruta (la propuesta es de la parte C; aquí solo el aviso y el gancho). */
  cambio: { reservaId: string; sitio: string; deDia: string; aDia: string }
}

/**
 * «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26»: la entrada que ha comprado la persona (no el dueño) no cae en el día en que la ruta tiene ese sitio. La ruta es
 * la del dueño: si no cuadra, el invitado puede proponer el cambio. Sin fechas, «el día 2». Si la ruta no tiene ese sitio por dentro, no hay nada con lo que comparar.
 */
export function entradasQueNoCuadran(route: Route, mias: readonly Reservation[], nombresCortos?: Record<string, string>): EntradaNoCuadra[] {
  const avisos: EntradaNoCuadra[] = []
  for (const mia of mias) {
    if (mia.kind !== 'entrada') continue
    let aqui: { dayNumber: number; id: string } | null = null
    for (const day of route.days) {
      if (day.stops.some((stop) => esDeLaReserva(stop, mia) && stop.visitMode !== 'fuera')) {
        aqui = { dayNumber: day.dayNumber, id: day.id }
        break
      }
    }
    const suyo = dayOfReservation(route, mia)
    // Su entrada cae fuera del viaje o en un día distinto del que la ruta tiene el sitio.
    const suyoTexto = diaDeLaReservaEnPalabras(route, mia)
    if (!aqui || (suyo && suyo.id === aqui.id) || !suyoTexto) continue
    const sitio = sitioCorto(mia, nombresCortos)
    const deDia = diaProsa(route, aqui.dayNumber)
    avisos.push({
      id: `entrada-no-cuadra:${mia.id}`,
      texto: `Tu entrada ${conDe(sitio)} es el ${suyoTexto}, y en la ruta está el ${deDia}.`,
      cambio: { reservaId: mia.id, sitio, deDia, aDia: suyoTexto },
    })
  }
  return avisos
}

/** Lo que lleva el aviso «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26» para poder proponer el cambio (Tanda 10N3 §3). */
export interface CambioDeReservaPropuesto {
  reservaId: string
  /** «el Coliseo». */
  sitio: string
  /** El día de la reserva del invitado («viernes 27»): el día al que quiere pasar la parada. */
  diaDeLaReserva: string
  /** El día en que la ruta tiene ahora ese sitio («jueves 26»). */
  diaDeLaRuta: string
  /** La fecha de su reserva (aaaa-mm-dd), si el viaje tiene fechas. */
  dateIso?: string | null
}

/**
 * [Proponer el cambio] del aviso de una entrada que no cuadra. GANCHO para la propuesta (Tanda 10N3, E1): este módulo solo lanza el evento `trazo:proponer-cambio-reserva` con los datos del aviso
 * (`detail: CambioDeReservaPropuesto`); quien arma la propuesta (pasar la parada de `diaDeLaRuta` a `diaDeLaReserva`) escucha ese evento. Devuelve false si nadie lo atiende.
 */
export function proponerCambioDeReserva(cambio: CambioDeReservaPropuesto): boolean {
  if (typeof window === 'undefined') return false
  const evento = new CustomEvent('trazo:proponer-cambio-reserva', { detail: cambio, cancelable: true })
  window.dispatchEvent(evento)
  return evento.defaultPrevented
}
