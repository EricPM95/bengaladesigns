/**
 * LA FILA DE LOS MOMENTOS (Tanda V3, regla de Eric, para todos los destinos). Todo lo que ocupa la pantalla —las sorpresas de una ronda (pedazos, emblema, colección, sello…), el resumen del
 * día, el del viaje, la hoja de logros, «Hoy empiezas a ganar logros» y la «+EXP» con la subida de nivel y el cambio de rango— pasa por esta fila:
 *   · NUNCA hay dos a la vez, ni uno que empiece antes de que se cierre el anterior;
 *   · el que llega con la pantalla ocupada espera; al cerrarse lo que había, sale el siguiente que esperaba (el primero de `ORDEN_DE_LA_FILA`);
 *   · mientras está abierta la hoja del Visto o un «Compartir» (los abre la persona, encima de lo que mira), no sale nada.
 * Pura: sin React ni almacenes, para poder probarla (`pruebaV3`). Los anfitriones (`MomentosHost`, `ExpHost`) piden y sueltan; el almacén que la guarda es `useMomentosUI`.
 */
export type PantallaDeMomentos = 'ronda' | 'resumenDia' | 'exp' | 'primerDia' | 'resumenViaje' | 'hojaLogros'

/**
 * El orden en que salen los que esperan: primero las sorpresas de lo que se acaba de ganar (dentro de la ronda, lo del sitio —el pedazo, el emblema— y después lo general —la colección completa, el
 * sello, el reto—; eso lo ordena `plan.ts` con `ajustes.json › orden_momentos`), luego el resumen del día, la EXP (con la subida de nivel y el cambio de rango, que van pegadas) y lo demás.
 */
export const ORDEN_DE_LA_FILA: readonly PantallaDeMomentos[] = ['ronda', 'resumenDia', 'exp', 'primerDia', 'resumenViaje', 'hojaLogros']

export interface Fila {
  /** Lo que está en pantalla ahora (null = nada). */
  mostrando: PantallaDeMomentos | null
  /** Lo que espera su turno. */
  esperan: PantallaDeMomentos[]
}
export const filaVacia = (): Fila => ({ mostrando: null, esperan: [] })

/** Si la pantalla está libre, pasa al primero que espera. `bloqueado`: la hoja del Visto o un «Compartir» abiertos por la persona. */
export function repartir(f: Fila, bloqueado: boolean): Fila {
  if (f.mostrando || bloqueado) return f
  const siguiente = ORDEN_DE_LA_FILA.find((k) => f.esperan.includes(k))
  if (!siguiente) return f
  return { mostrando: siguiente, esperan: f.esperan.filter((k) => k !== siguiente) }
}

/** Pide la pantalla. Si ya está mostrándose o esperando, no cambia nada. */
export function pedir(f: Fila, k: PantallaDeMomentos, bloqueado: boolean): Fila {
  if (f.mostrando === k || f.esperan.includes(k)) return repartir(f, bloqueado)
  return repartir({ ...f, esperan: [...f.esperan, k] }, bloqueado)
}

/** Suelta la pantalla (se ha cerrado, o ya no hace falta): si estaba mostrándose, sale el siguiente de la fila. */
export function soltar(f: Fila, k: PantallaDeMomentos, bloqueado: boolean): Fila {
  return repartir({ mostrando: f.mostrando === k ? null : f.mostrando, esperan: f.esperan.filter((x) => x !== k) }, bloqueado)
}
