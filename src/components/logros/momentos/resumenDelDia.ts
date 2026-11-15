import { addDaysToIso } from '../../../lib/dateRange'
import { resolveRealStops } from '../../../lib/todayMode'
import { isNumberedStop } from '../../../lib/stopKind'
import type { Route } from '../../../lib/types'

/**
 * CUÁNDO SALE EL RESUMEN DEL DÍA (V3, Eric): UNA vez al final de cada día, nunca tras cada foto ni cada ronda de sorpresas. Pura (sin React) para poder probarla.
 *   · Al marcar la última parada del día (hecha o SALTADA) → `diaCompleto` (lo mira el anfitrión al cambiar la ruta).
 *   · Si el día acaba sin marcar la última: la primera vez que se abre la app esa noche (desde `HORA_DE_NOCHE`) o al día siguiente → `diaPendienteDeResumen`.
 * Cada día sale una sola vez (`claveDelResumen` guarda que ya salió). Hace falta que ese día se haya usado: al menos una parada hecha o saltada.
 */
export const HORA_DE_NOCHE = 21

export const claveDelResumen = (tripId: string, dateIso: string): string => `trazo:logros:resumendia:${tripId}:${dateIso}`

const marcada = (p: { checkedInAt?: string | null; saltada?: boolean }): boolean => Boolean(p.checkedInAt) || Boolean(p.saltada)

/** ¿Están todas las paradas numeradas del día hechas o saltadas? (con al menos una) */
export function diaCompleto(route: Route, dateIso: string): boolean {
  const inicio = route.answers.dateRange?.start
  if (!inicio) return false
  const dia = route.days.find((d) => addDaysToIso(inicio, d.dayNumber - 1) === dateIso)
  if (!dia) return false
  const paradas = resolveRealStops(dia).filter(isNumberedStop)
  return paradas.length > 0 && paradas.every(marcada)
}

/** El día (ISO) cuyo resumen toca enseñar AHORA por haber acabado sin marcar la última parada: el de hoy si ya es de noche, o el de ayer; el más reciente que no haya salido y se haya usado. */
export function diaPendienteDeResumen(route: Route, hoyIso: string, hora: number, yaSalio: (dateIso: string) => boolean): string | null {
  const inicio = route.answers.dateRange?.start
  if (!inicio) return null
  const ayer = addDaysToIso(hoyIso, -1)
  const candidatos = [hora >= HORA_DE_NOCHE ? hoyIso : null, ayer].filter((x): x is string => x !== null)
  for (const iso of candidatos) {
    const dia = route.days.find((d) => addDaysToIso(inicio, d.dayNumber - 1) === iso)
    if (!dia || yaSalio(iso)) continue
    const paradas = resolveRealStops(dia).filter(isNumberedStop)
    if (paradas.some(marcada)) return iso
  }
  return null
}
