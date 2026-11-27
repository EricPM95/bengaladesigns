import { useSyncExternalStore } from 'react'
import { useMomentosUI } from '../components/logros/momentos/useMomentosUI'

/**
 * (V79, apartado 1; Design «La vuelta en HOY», VL6) «CERRAR MI VIAJE» Y EL RESUMEN QUE SALE UNA SOLA VEZ.
 *  · [Cerrar mi viaje] (la tarjeta de debajo de la del vuelo, ya en el aeropuerto): abre el resumen del viaje y HOY pasa a «después» (`HoyDespuesV2`). No se borra NADA del viaje: solo se apunta, en este móvil, que
 *    la persona lo ha cerrado (`trazo:hoy:viaje-cerrado:<viaje>`).
 *  · Si no lo pulsa, el resumen sale solo, UNA vez (V74): 2 horas después de «Ya en el aeropuerto» (el minuto que apunta la tarjeta de la vuelta en `trazo:hoy:enaeropuerto:<viaje>:<día>`) o, si no pasó por ahí,
 *    2 horas después de la hora del vuelo de vuelta (`hoyYaEsDespues`).
 *  · «Una vez» = por viaje, para siempre (`trazo:hoy:resumen-salio:<viaje>`, en el móvil): salga por la hora o por el botón, no vuelve a salir solo. Se vuelve a abrir a mano desde [Ver el resumen de mi viaje]
 *    (HOY después), «Tus logros» y el resumen del día.
 * Consultas a Supabase: ninguna (todo es del móvil).
 */
const claveCerrado = (id: string) => `trazo:hoy:viaje-cerrado:${id}`
const claveSalio = (id: string) => `trazo:hoy:resumen-salio:${id}`
/** Sin almacenamiento (modo privado): se recuerda mientras la página siga abierta. */
const enMemoria = new Set<string>()
const oyentes = new Set<() => void>()

function hay(clave: string): boolean {
  try {
    return window.localStorage.getItem(clave) === 'si'
  } catch {
    return enMemoria.has(clave)
  }
}
function poner(clave: string): void {
  try {
    window.localStorage.setItem(clave, 'si')
  } catch {
    enMemoria.add(clave) // sin almacenamiento: queda en memoria
  }
}

/** ¿La persona ya pulsó [Cerrar mi viaje]? */
export const viajeCerrado = (tripId: string): boolean => hay(claveCerrado(tripId))
/** ¿El resumen del viaje ya salió solo (o al cerrar el viaje)? */
export const resumenYaSalio = (tripId: string): boolean => hay(claveSalio(tripId))

/** Lo que hace [Cerrar mi viaje]: apunta que está cerrado (HOY pasa a «después»), apunta que el resumen ya salió y lo abre. */
export function cerrarMiViaje(tripId: string): void {
  poner(claveCerrado(tripId))
  poner(claveSalio(tripId))
  oyentes.forEach((f) => f())
  useMomentosUI.getState().abrirResumenViaje()
}

/** El resumen que sale solo, UNA vez por viaje: si aún no había salido, se apunta y se abre (devuelve true); si ya salió, no hace nada (false). */
export function abrirElResumenUnaVez(tripId: string): boolean {
  if (resumenYaSalio(tripId)) return false
  poner(claveSalio(tripId))
  useMomentosUI.getState().abrirResumenViaje()
  return true
}

/** El estado de «viaje cerrado» como dato de React: al pulsar [Cerrar mi viaje], HOY se repinta solo. */
export function useViajeCerrado(tripId: string): boolean {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    () => viajeCerrado(tripId),
    () => false,
  )
}

/** Las horas que pasan desde «Ya en el aeropuerto» (o desde la hora del vuelo) hasta que sale el resumen. */
export const MINUTOS_HASTA_EL_RESUMEN = 120

/**
 * ¿HOY ya es el de «después del viaje»? Pura (la usa `HoyDuranteV2` y la prueba):
 *  · con el viaje cerrado a mano, siempre;
 *  · si no, 2 h después del minuto en que ya estabas en el aeropuerto (`enElSitioMin`) o, si no se apuntó, 2 h después de la hora del vuelo (`vueloMin`).
 */
export function hoyYaEsDespues({ cerrado, ahoraMin, enElSitioMin, vueloMin }: { cerrado: boolean; ahoraMin: number; enElSitioMin: number | null; vueloMin: number | null }): boolean {
  if (cerrado) return true
  const base = enElSitioMin ?? vueloMin
  return base != null && ahoraMin >= Math.max(base, 0) + MINUTOS_HASTA_EL_RESUMEN
}
