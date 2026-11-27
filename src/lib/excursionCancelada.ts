import { useCallback, useSyncExternalStore } from 'react'

/**
 * (V80, apartado 4) LA EXCURSIÓN CANCELADA, en el móvil, por viaje y día: «¿Se ha cancelado la excursión?» → HOY pasa a «Tu día libre en …». No se guarda nada en Supabase y no se borra nada: la reserva sigue en RESERVAS.
 * Lo que se guarda es la FECHA en que se canceló (no un «sí»): si la excursión se cambia a otro día (`[Hacer La Graciosa otro día]`), esa fecha ya no es la del día de excursión y deja de estar cancelada sola;
 * si se deshace el cambio, vuelve a estarlo. Cero peticiones a la red: unos pocos bytes en localStorage.
 */
const clave = (rutaId: string, diaId: string) => `jutrip:excursion-cancelada:${rutaId}:${diaId}`
const memoria = new Map<string, string>()
const oyentes = new Set<() => void>()

export function leerExcursionCancelada(rutaId: string, diaId: string): string | null {
  const k = clave(rutaId, diaId)
  try {
    const t = window.localStorage.getItem(k)
    if (t) return t
  } catch {
    /* sin almacenamiento: vale la memoria de esta sesión */
  }
  return memoria.get(k) ?? null
}

/** Apunta (con la fecha) o borra (null) que la excursión de ese día está cancelada. */
export function ponerExcursionCancelada(rutaId: string, diaId: string, dateIso: string | null): void {
  const k = clave(rutaId, diaId)
  try {
    if (dateIso) window.localStorage.setItem(k, dateIso)
    else window.localStorage.removeItem(k)
  } catch {
    /* sin almacenamiento: solo la memoria */
  }
  if (dateIso) memoria.set(k, dateIso)
  else memoria.delete(k)
  for (const o of [...oyentes]) o()
}

const suscribir = (cb: () => void) => {
  oyentes.add(cb)
  return () => void oyentes.delete(cb)
}

/** `cancelada` = la excursión de ESTE día (y esta fecha) está cancelada. `cancelar` / `deshacer` la apuntan y la borran. */
export function useExcursionCancelada(rutaId: string, diaId: string, dateIso: string): { cancelada: boolean; cancelar: () => void; deshacer: () => void } {
  const guardada = useSyncExternalStore(suscribir, () => leerExcursionCancelada(rutaId, diaId), () => null)
  const cancelar = useCallback(() => ponerExcursionCancelada(rutaId, diaId, dateIso), [rutaId, diaId, dateIso])
  const deshacer = useCallback(() => ponerExcursionCancelada(rutaId, diaId, null), [rutaId, diaId])
  return { cancelada: guardada === dateIso, cancelar, deshacer }
}
