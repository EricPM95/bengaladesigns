// Entrada que empaqueta la prueba V1b (scripts/destino/pruebaV1b.mjs): la lista de viajes ligera, abrir el viaje entero y los vistos de una sola vez, con el código de verdad de la app.
export { loadAllTrips, viajeEntero, saveTrip, loadOneTrip } from '../../src/lib/tripPersistence'
export { copiarVistosDeLosViajes } from '../../src/lib/vistosApi'
export { abrirViajeGuardado } from '../../src/lib/abrirViaje'
export { resumenDeViaje, viajesDelPerfil } from '../../src/lib/viajesPerfil'
export { getTodayTripStatus, getTodayTripContext } from '../../src/lib/todayMode'
export { dondeAbrir } from '../../src/lib/dondeAbrir'
export { useSyncStore } from '../../src/store/useSyncStore'
export { useRouteStore } from '../../src/store/useRouteStore'
