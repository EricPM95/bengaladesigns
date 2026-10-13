// Entrada que empaqueta la prueba de la Tanda 6y4, parte de LISTAS (scripts/destino/pruebaFase6y4_listas.mjs): el almacén de la ruta de verdad, con sus reservas, para repetir lo que hace el viajero.
import { useRouteStore } from '../../src/store/useRouteStore'
import { mapGeneratedRouteToRoute } from '../../src/lib/mapGeneratedRoute'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { dayOfReservation, isBigReservation } from '../../src/lib/bookings'
import { reservasParaMotor } from '../../src/lib/engineReservas'
import { rehacerDiasSinTocar, rehacerDiaConReservas } from '../../src/lib/rebuildDay'

export { fetchDestinationExcursions, useRouteStore, mapGeneratedRouteToRoute, dayOfReservation, isBigReservation, reservasParaMotor, rehacerDiasSinTocar, rehacerDiaConReservas }
