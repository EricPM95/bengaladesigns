import type { Route } from './types'
import type { LegKind } from './reservasLegs'
import { useRouteStore } from '../store/useRouteStore'
import { pagoActivo } from './pago'

/**
 * EL ENGANCHE `onCambioDeVuelo` (Tanda 7): cada vez que el viajero PONE, CAMBIA o BORRA una hora de Roma, un punto de Roma o la zona del alojamiento en RESERVAS, las pantallas (`LlegadaYVuelta`,
 * `AlojamientoReservas`) llaman a `onCambioDeVuelo(cambio)`. `ReservasPanel` lo recibe como prop opcional y, si no se le pasa otro, usa `rehacerPorCambioDeVuelo`. Este es el único punto por donde
 * entra «los días se rehacen solos» y «sale la hoja del resumen»: los otros agentes (el rehacer y la hoja del resumen) se enganchan aquí, sin tocar las pantallas de RESERVAS.
 *
 * NO avisan de un cambio: el código del vuelo, la compañía, el precio, las casillas opcionales (el otro punto y la otra hora) ni la dirección del alojamiento; para el motor no cambian nada.
 */
export interface CambioDeVuelo {
  /** Qué ha cambiado: la hora de Roma de la ida o de la vuelta, su punto, la zona del alojamiento, o el vuelo entero quitado. */
  que: 'hora' | 'punto' | 'zona' | 'quitar'
  /** La mitad afectada (`arrival` = llegada, `departure` = vuelta); `null` en la zona. */
  mitad: LegKind | null
}

export type EnCambioDeVuelo = (cambio: CambioDeVuelo) => void

/**
 * El rehacer de siempre (el de «gana el último» y la barrita fina de `ActualizandoRuta`: `regenerateRouteForDates`, que rehace los destinos curados SIN Claude), puesto en marcha por un cambio de
 * vuelo. Solo de pago, solo en rutas nuestras de un destino curado y sin cambios a mano: los días cambiados a mano no se tocan (esa decisión, y la de qué se rehace de verdad, son del agente del rehacer).
 */
export function rehacerPorCambioDeVuelo(_cambio: CambioDeVuelo, route?: Route | null): boolean {
  if (!pagoActivo()) return false
  const ruta = route ?? useRouteStore.getState().route
  if (!ruta || ruta.planMode === 'manual' || ruta.editedManually) return false
  const curado = ruta.days.some((day) => day.timesAreFinal)
  if (!curado) return false
  useRouteStore.getState().regenerateRouteForDates(ruta.answers.dateRange)
  return true
}
