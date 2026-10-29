import type { Route } from './types'

/**
 * LA CUENTA DEL VIAJE SEGÚN LAS PERSONAS (Tanda 10N10 §5a). Ya no se elige «cómo llevar las cuentas»: lo decide la app.
 *   · una persona               -> 'solo'    (sin interruptor: «Total del viaje»);
 *   · dos personas o una familia -> 'conjunta' («Mi cuenta | Cuenta conjunta»);
 *   · tres o más que no son familia -> 'grupo'  («Mi cuenta | Cuenta del grupo»).
 * Pura, sin React ni red. Igual que `modo_cuentas_del_viaje` de la base de datos (migración 0067).
 */
export type CuentaDelViaje = 'solo' | 'conjunta' | 'grupo'

export const esFamilia = (route: Pick<Route, 'answers'> | null | undefined): boolean => route?.answers?.companion === 'family'

export function cuentaDelViaje(personas: number, familia: boolean): CuentaDelViaje {
  if (personas <= 1) return 'solo'
  return familia || personas === 2 ? 'conjunta' : 'grupo'
}

/** Lo que se enseña en la pestaña común: «Cuenta conjunta» / «Cuenta del grupo». */
export const nombreDeLaCuentaComun = (cuenta: CuentaDelViaje): string => (cuenta === 'grupo' ? 'Cuenta del grupo' : 'Cuenta conjunta')

/**
 * Las personas entre las que se reparte lo que se apuntó SIN decir «entre quién» (la cuenta conjunta de cuando eran dos). Al pasar de dos a tres (no familia) se queda con esas dos y no se reparte entre tres:
 * la app del administrador apunta en la ruta `cuentaConjuntaCon` quiénes eran cuando el viaje era de dos. Con tres o más sin eso, es entre todos.
 */
export function entreSinDecir(route: Pick<Route, 'answers' | 'cuentaConjuntaCon'> | null | undefined, cuenta: CuentaDelViaje, todos: readonly string[]): string[] {
  const con = route?.cuentaConjuntaCon
  if (cuenta === 'grupo' && Array.isArray(con) && con.length === 2) return [...con]
  return [...todos]
}
