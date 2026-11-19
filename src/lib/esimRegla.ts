/**
 * (V22) La regla pura de la eSIM (sin leer ningún archivo: la lista de países la pone quien la llama; ver `esim.ts`). Hace falta eSIM si el viajero sale de un país y va a otro donde su tarifa no le sirve sin pagar de más:
 * NO si es el mismo país o si los dos están en el «roaming como en casa» (UE y EEE); SÍ en todo lo demás (también Reino Unido → UE). Sin país de origen o de destino, `'desconocido'`.
 */
export type NecesidadDeEsim = 'si' | 'no' | 'desconocido'

export function reglaDeEsim(origen: string | null | undefined, destino: string | null | undefined, comoEnCasa: ReadonlySet<string>): NecesidadDeEsim {
  const o = (origen ?? '').trim().toLowerCase()
  const d = (destino ?? '').trim().toLowerCase()
  if (!o || !d) return 'desconocido'
  if (o === d) return 'no'
  if (comoEnCasa.has(o) && comoEnCasa.has(d)) return 'no'
  return 'si'
}

/** El país de salida del viaje: el de la ciudad del formulario; null si no se sabe. */
export const paisDeSalida = (answers: { originPlace?: { countryCode?: string | null } | null } | null | undefined): string | null => answers?.originPlace?.countryCode?.toLowerCase() ?? null

/** La clave de la tarjeta de eSIM de cada país en «Útil para el viaje»: la primera es «esim» (como siempre) y las demás «esim-<país>». */
export const idDeTarjetaEsim = (indice: number, countryCode: string): string => (indice === 0 ? 'esim' : `esim-${countryCode}`)
