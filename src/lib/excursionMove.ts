import type { DayPlan, Route } from './types'
import { dateOfDay } from './bookings'
import { esDiaDeExcursion, tituloSimpleDelDia } from './tituloDelDia'

/**
 * (V49) LA EXCURSIÓN GUARDADA EN OTRO DÍA: igual que una entrada grande (el Coliseo) en otra fecha, el DÍA de excursión se MUEVE al día elegido y los días de en medio se recolocan (cada uno pasa un puesto): nunca quedan
 * dos días de excursión. Función pura: la usan la hoja (para enseñar el aviso E1 «Tu excursión a Pompeya, el viernes 27. Para que encaje, cambiamos estos días:») y el almacén (para mover de verdad).
 * Solo se mueve si hay un día de excursión en la ruta (con el interruptor o de tipo excursión) en otro día distinto del elegido, y el elegido no es el de llegada ni el de vuelta (eso lo filtra la hoja).
 */
export interface FilaDeCambio {
  /** El día (su puesto, y por tanto su fecha) donde queda ahora. */
  dayNumber: number
  fechaIso: string | null
  /** El nombre del día (el de DÍAS). */
  nombre: string
  /** Dónde estaba antes (su fecha); null en el día elegido. */
  antesIso: string | null
  antesNumero: number | null
  /** El día elegido, el de la excursión: va el primero y destacado. */
  principal: boolean
}

export interface MovimientoDeExcursion {
  /** Los ids de los días de ciudad en su orden NUEVO (los de vuelta se quedan al final, como estaban). */
  orden: string[]
  filas: FilaDeCambio[]
  /** El día de excursión que se mueve. */
  diaDeExcursionId: string
}

export function movimientoDeExcursion(route: Route, diaElegidoId: string, pinned: (day: DayPlan) => boolean = () => false): MovimientoDeExcursion | null {
  const ciudad = route.days.filter((day) => !day.isReturnLeg)
  const elegido = ciudad.find((day) => day.id === diaElegidoId)
  const exc = ciudad.find((day) => esDiaDeExcursion(day) && day.id !== diaElegidoId)
  if (!elegido || !exc || esDiaDeExcursion(elegido)) return null
  const desde = ciudad.indexOf(exc)
  const hasta = ciudad.indexOf(elegido)
  const nuevo = [...ciudad]
  nuevo.splice(desde, 1)
  nuevo.splice(hasta, 0, exc)
  // Un día de en medio fijado por OTRA excursión reservada no se mueve: la reserva es de esa fecha.
  const cambian = nuevo.filter((day, i) => ciudad[i]?.id !== day.id)
  if (cambian.some((day) => day.id !== exc.id && pinned(day))) return null
  const fechaDelPuesto = (i: number) => dateOfDay(route, { ...ciudad[i], dayNumber: i + 1 })
  const filas: FilaDeCambio[] = nuevo
    .map((day, i) => ({ day, i }))
    .filter(({ day, i }) => ciudad[i]?.id !== day.id)
    .map(({ day, i }) => {
      const antes = ciudad.indexOf(day)
      const principal = day.id === exc.id
      return {
        dayNumber: i + 1,
        fechaIso: fechaDelPuesto(i),
        nombre: tituloSimpleDelDia(route, day),
        antesIso: principal ? null : fechaDelPuesto(antes),
        antesNumero: principal ? null : antes + 1,
        principal,
      }
    })
    .sort((a, b) => Number(b.principal) - Number(a.principal) || a.dayNumber - b.dayNumber)
  return { orden: [...nuevo.map((day) => day.id), ...route.days.filter((day) => day.isReturnLeg).map((day) => day.id)], filas, diaDeExcursionId: exc.id }
}

/** La ruta con los días en el orden nuevo (cada uno con su número según su puesto). */
export function rutaConElMovimiento(route: Route, mov: MovimientoDeExcursion): Route {
  const porId = new Map(route.days.map((day) => [day.id, day]))
  const days = mov.orden.map((id, i) => ({ ...(porId.get(id) as DayPlan), dayNumber: i + 1 }))
  return { ...route, days }
}

const SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
/** «el jueves 26» (siempre fecha; sin fechas del viaje, «el día 3»). */
export function fechaCorta(iso: string | null, dayNumber: number): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return `día ${dayNumber}`
  const d = new Date(`${iso}T12:00:00Z`)
  return `${SEMANA[d.getUTCDay()]} ${d.getUTCDate()}`
}
export const conMayuscula = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1)

/**
 * (V69, apartado 2) [Solo mover la excursión]: el día de excursión y el día que está en el puesto elegido SE INTERCAMBIAN; los demás días se quedan donde están (con «Cambiar los días» pasaría cada día un puesto).
 * Misma forma que `movimientoDeExcursion` (la usa el almacén con `rutaConElMovimiento`); null si no hay día de excursión en otro puesto, o si el día que cambiaría de sitio tiene otra excursión reservada.
 */
export function intercambioDeExcursion(route: Route, diaElegidoId: string, pinned: (day: DayPlan) => boolean = () => false): MovimientoDeExcursion | null {
  const ciudad = route.days.filter((day) => !day.isReturnLeg)
  const elegido = ciudad.find((day) => day.id === diaElegidoId)
  const exc = ciudad.find((day) => esDiaDeExcursion(day) && day.id !== diaElegidoId)
  if (!elegido || !exc || esDiaDeExcursion(elegido) || pinned(elegido)) return null
  const nuevo = [...ciudad]
  const a = ciudad.indexOf(exc)
  const b = ciudad.indexOf(elegido)
  nuevo[a] = elegido
  nuevo[b] = exc
  const fechaDelPuesto = (i: number) => dateOfDay(route, { ...ciudad[i], dayNumber: i + 1 })
  const filas: FilaDeCambio[] = [b, a].map((i) => {
    const day = nuevo[i]
    const principal = day.id === exc.id
    const antes = ciudad.indexOf(day)
    return { dayNumber: i + 1, fechaIso: fechaDelPuesto(i), nombre: tituloSimpleDelDia(route, day), antesIso: principal ? null : fechaDelPuesto(antes), antesNumero: principal ? null : antes + 1, principal }
  })
  return { orden: [...nuevo.map((day) => day.id), ...route.days.filter((day) => day.isReturnLeg).map((day) => day.id)], filas, diaDeExcursionId: exc.id }
}
