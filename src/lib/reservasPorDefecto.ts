import type { TripBookings, TripUiState } from './tripPersistence'

/**
 * (10S2) Un viaje guardado con las reservas vacías (`bookings = {}`, de una versión antigua, de un guardado a medias o de un estado sin hidratar) tumbaba la app entera con «Algo ha ido mal» al abrirlo:
 * `Object.entries(undefined)` al calcular el presupuesto. Toda lectura de `bookings` / `ui_state` de la nube pasa por aquí y se completa con lo de siempre (nada guardado = vacío), sin cambiar lo guardado.
 */
export function reservasConDefectos(b: Partial<TripBookings> | null | undefined): TripBookings {
  const x = (b && typeof b === 'object' ? b : {}) as Partial<TripBookings>
  const dic = <T>(v: T | undefined | null): T => (v && typeof v === 'object' && !Array.isArray(v) ? v : ({} as T))
  return {
    ...x,
    accommodationSelections: dic(x.accommodationSelections),
    transportBookings: dic(x.transportBookings),
    insuranceBooking: x.insuranceBooking ?? null,
    n26Added: x.n26Added === true,
    rentalVehicleBooking: x.rentalVehicleBooking ?? null,
    esimSelections: dic(x.esimSelections),
  }
}

export function uiConDefectos(u: Partial<TripUiState> | null | undefined): TripUiState {
  const x = (u && typeof u === 'object' ? u : {}) as Partial<TripUiState>
  return { mode: x.mode ?? 'route', activeDayId: x.activeDayId ?? null }
}
