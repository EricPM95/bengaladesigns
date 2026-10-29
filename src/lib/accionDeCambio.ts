import type { Route } from './types'
import { ultimoCambioDe } from '../../shared/avisos/cambioViaje.js'

/**
 * (Tanda 10N5, apartados 2 y 2b) LO QUE HA HECHO QUIEN CAMBIA EL VIAJE, con nombre propio. Cuando la persona hace algo que la app resuelve moviendo muchos sitios por detrás (añadir el Free Tour, pasar un día
 * a excursión, «Recuperar mi ruta»…), el aviso de los demás tiene que decir lo que decidió ella, no la lista de lo que se movió. Aquí se apunta en la ruta (`route.ultimoCambio`, con un `id` nuevo) y el
 * disparador de la base de datos (migración 0051) lo copia al aviso; `shared/avisos/textos.js` lo convierte en una frase. Pura: no importa el almacén (lo importa él).
 */
export type AccionDeCambio =
  | { tipo: 'free_tour'; dia_n: number; fecha?: string | null; reorganizados?: number }
  | { tipo: 'excursion'; dia_n: number; fecha?: string | null; a: 'excursion' | 'roma'; excursion?: string | null; ciudad?: string | null }
  | { tipo: 'recuperar_ruta' }
  | { tipo: 'recuperar_dia'; dia_n: number; fecha?: string | null }
  | { tipo: 'fechas' }
  | { tipo: 'rehacer' }
  /** (10N9) «Guardar el vuelo» del administrador: la ida y la vuelta juntas, un solo aviso. `medio`: «vuelo», «tren»… */
  | { tipo: 'vuelo'; medio?: string; ida?: { fecha?: string | null; hora: string } | null; vuelta?: { fecha?: string | null; hora: string } | null }

let pendiente: AccionDeCambio | null = null

/** Hace `fn` (que cambia la ruta, quizá en varios pasos) con esta acción apuntada: el primer paso que cambia la ruta la lleva puesta. */
export async function conAccion<T>(accion: AccionDeCambio, fn: () => Promise<T>): Promise<T> {
  const anterior = pendiente
  pendiente = accion
  try {
    return await fn()
  } finally {
    pendiente = anterior
  }
}

export const accionPendiente = (): AccionDeCambio | null => pendiente

/** Gasta la acción pendiente (solo el primer paso la lleva: los siguientes de la misma acción siguen con el mismo `id`). */
export function gastarAccion(): AccionDeCambio | null {
  const a = pendiente
  pendiente = null
  return a
}

/** La ruta `despues` con el `ultimoCambio` de la acción `accion` respecto de `antes`. Sin acción apuntada, la ruta tal cual. */
export function conUltimoCambio(antes: Route | null, despues: Route, accion: AccionDeCambio | null = gastarAccion()): Route {
  if (!accion) return despues
  return { ...despues, ultimoCambio: ultimoCambioDe(antes, despues, accion) as Record<string, unknown> }
}
