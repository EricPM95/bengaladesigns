/** Qué sale después de «+EXP» (8C2). Función pura, para poder probarla. */
import type { ExpDeRespuesta } from '../../../lib/logros'

export type Paso = 'exp' | 'nivel' | 'rango'

/** El cambio de rango si el rango sube (trae su nivel nuevo); si no, el de nivel si el nivel sube; si no, nada. */
export function pasoTrasLaExp(e: Pick<ExpDeRespuesta, 'antes' | 'despues'>): Paso | null {
  if (e.despues.rango_ix > e.antes.rango_ix) return 'rango'
  return e.despues.nivel > e.antes.nivel ? 'nivel' : null
}
