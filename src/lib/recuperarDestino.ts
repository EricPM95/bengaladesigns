/**
 * «Recuperar mi ruta» por destino (Tanda 6j, punto 8): funciones puras, sin store ni navegador (se prueban con node,
 * ver scripts/destino/pruebaVarita.mjs). Solo `import type`, para que node pueda cargar este archivo tal cual.
 *
 * La copia de la ruta inicial es una sola (`Route.originalRoute`, la del viaje entero); se recupera por destino
 * filtrando sus días por `city`. Un viaje guardado antes de esta tanda vale igual: no lleva nada nuevo.
 */
import type { DayPlan, Route } from './types'

/** Suma días a una fecha ISO (misma cuenta que addDaysToIso de dateRange.ts, repetida para no importar nada en runtime). */
function sumarDias(iso: string, dias: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + dias)
  return date.toISOString().slice(0, 10)
}

/** Días entre dos fechas ISO (b - a). */
const diasEntre = (a: string, b: string): number => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)

const copiar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T

/** Un día sin lo que cambia sin que el viajero haya tocado nada (número, copia de seguridad) para compararlo con el original. */
const huella = (day: DayPlan): string => {
  const { dayNumber: _n, originalSnapshot: _s, colorIndex: _c, ...resto } = day
  return JSON.stringify(resto)
}

/** ¿Tiene ese destino cambios respecto a la ruta inicial? (días añadidos o quitados, paradas, orden, comidas, interruptor…) */
export function destinoCambiado(route: Route, city: string): boolean {
  const original = route.originalRoute
  if (!original) return false
  const ahora = route.days.filter((day) => day.city === city)
  const antes = original.days.filter((day) => day.city === city)
  if (ahora.length !== antes.length) return true
  if (ahora.some((day, i) => huella(day) !== huella(antes[i]))) return true
  // El interruptor del día 4 en un lado que no es el de por defecto: se guarda en las respuestas.
  const conInterruptor = ahora.some((day) => day.interruptor) || antes.some((day) => day.interruptor)
  return conInterruptor && route.answers.diaCuatro !== original.answers.diaCuatro
}

/**
 * Los días de `city` vuelven tal como salieron al crear el viaje: paradas, orden, comidas, interruptor del día 4 (en su
 * posición por defecto) y fuera los días creados con «Crear mi propio día» o «+ Añadir día» (la copia original no los tiene).
 * Los días de los demás destinos no se tocan. Los días de `city` entran donde estaba el primero de ellos (si el
 * destino se había quedado sin días, detrás del último día que el viaje conserve de los que iban antes en la copia).
 * Renumera los días 1..n y ajusta la duración y las fechas del viaje al nuevo número de días.
 * Sin copia original, o sin días de ese destino en ella, devuelve la ruta tal cual.
 */
export function recuperarDestino(route: Route, city: string): Route {
  const original = route.originalRoute
  if (!original) return route
  const vuelven = copiar(original.days.filter((day) => day.city === city))
  if (vuelven.length === 0) return route

  // Dónde entran: en el sitio del primer día actual del destino; si no queda ninguno, tras el último día conservado que ya iba antes.
  const primero = route.days.findIndex((day) => day.city === city)
  const resto = route.days.filter((day) => day.city !== city)
  let en = resto.length
  if (primero >= 0) en = route.days.slice(0, primero).filter((day) => day.city !== city).length
  else {
    const idsAntes = new Set(original.days.slice(0, original.days.findIndex((day) => day.city === city)).map((day) => day.id))
    en = resto.reduce((ultimo, day, i) => (idsAntes.has(day.id) ? i + 1 : ultimo), 0)
  }
  const dias = [...resto.slice(0, en), ...vuelven, ...resto.slice(en)].map((day, i) => (day.dayNumber === i + 1 ? day : { ...day, dayNumber: i + 1 }))

  // Un viaje de un solo destino vuelve entero a sus respuestas (fechas y duración incluidas), como siempre.
  let answers: Route['answers']
  if (resto.length === 0) answers = copiar(original.answers)
  else {
    const delta = vuelven.length - route.days.filter((day) => day.city === city).length
    const rango = route.answers.dateRange
    // Si el viaje empezaba en este destino y el principio se había movido (se quitó el día 1), vuelve el principio original.
    const empezaba = original.days[0]?.city === city && original.answers.dateRange
    const inicio = rango && empezaba ? original.answers.dateRange!.start : rango?.start
    answers = {
      ...route.answers,
      days: Math.max(1, (route.answers.days ?? route.days.length) + delta),
      dateRange: rango && inicio ? { ...rango, start: inicio, end: sumarDias(rango.end, delta - diasEntre(inicio, rango.start)) } : rango,
    }
  }
  // El interruptor del día 4 solo afecta a ese destino: vuelve el de por defecto (se quita lo que el viajero eligió).
  const tieneInterruptor = vuelven.some((day) => day.interruptor) || route.days.some((day) => day.city === city && day.interruptor)
  if (tieneInterruptor) {
    answers = { ...answers }
    delete answers.diaCuatro
  }
  return { ...route, days: dias, answers, editedManually: resto.length === 0 ? false : route.editedManually }
}
