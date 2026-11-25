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
export const HORA_DE_NOCHE = 22

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
export function diaPendienteDeResumen(route: Route, hoyIso: string, hora: number, yaSalio: (dateIso: string) => boolean, /** (V59) Ese día tiene aún la hoja de cierre («Por hoy ya está» / «Ayer te quedaron…») por enseñar: el resumen sale DESPUÉS, al cerrarla. */ esperaLaHoja: (dateIso: string, dia: Route['days'][number]) => boolean = () => false): string | null {
  const inicio = route.answers.dateRange?.start
  if (!inicio) return null
  const ayer = addDaysToIso(hoyIso, -1)
  const candidatos = [hora >= HORA_DE_NOCHE ? hoyIso : null, ayer].filter((x): x is string => x !== null)
  for (const iso of candidatos) {
    const dia = route.days.find((d) => addDaysToIso(inicio, d.dayNumber - 1) === iso)
    if (!dia || yaSalio(iso) || esperaLaHoja(iso, dia)) continue
    const paradas = resolveRealStops(dia).filter(isNumberedStop)
    if (paradas.some(marcada)) return iso
  }
  return null
}

/** (V59) Abre el resumen de ese día UNA sola vez (lo apunta en el móvil): lo usan el anfitrión de los momentos y la hoja de cierre al cerrarse. `manana`: sale a la mañana siguiente («Tu día de ayer en Roma»). */
export function abrirElResumenDeUnDia(tripId: string, dateIso: string, manana: boolean, abrir: (de: { iso: string; manana: boolean }) => void): boolean {
  try {
    if (window.localStorage.getItem(claveDelResumen(tripId, dateIso)) === 'si') return false
    window.localStorage.setItem(claveDelResumen(tripId, dateIso), 'si')
  } catch {
    /* sin almacenamiento: puede salir otra vez */
  }
  abrir({ iso: dateIso, manana })
  return true
}
