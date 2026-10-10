import type { Route } from './types'
import { formatHeaderDateRangeShortEs } from './dateRange'
import { personasDelViaje } from './useMoneda'

const MES_LARGO = new Intl.DateTimeFormat('es-ES', { month: 'long' })

/** El mes del viaje cuando no hay fechas («octubre»); null si el formulario no lo dice. */
export function mesDelViaje(route: Route): string | null {
  const mes = route.answers.month
  return typeof mes === 'number' && mes >= 0 && mes <= 11 ? MES_LARGO.format(new Date(2027, mes, 1)) : null
}

/**
 * La línea de debajo del destino en la cabecera (Tanda 6z3): «13 – 16 oct · 2 personas»; sin fechas, el mes («octubre · 2 personas»). Sin número de personas, sin esa parte.
 */
export function subtituloDelViaje(route: Route): string {
  const rango = route.answers.dateRange
  const cuando = rango?.start && rango?.end ? formatHeaderDateRangeShortEs(rango.start, rango.end) : (mesDelViaje(route) ?? '')
  const personas = personasDelViaje(route)
  return [cuando, personas ? `${personas} ${personas === 1 ? 'persona' : 'personas'}` : ''].filter(Boolean).join(' · ')
}
