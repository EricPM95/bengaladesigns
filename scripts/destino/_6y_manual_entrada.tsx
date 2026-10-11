// Entrada que empaqueta la prueba de la 6y, parte C (scripts/destino/pruebaFase6y_manual.mjs): el interior de los días de una ruta a mano, para pintarlo en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { PlaceExplorerScreen, stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { ManualDayFooter } from '../../src/components/route/manualRoute/ManualDayFooter'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useExcursionsStore } from '../../src/store/useExcursionsStore'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { isManualRoute, compareManualExplorer } from '../../src/lib/manualPlan'
import { placeReservedEntrance, reapplyReservations, buildEntradasBloque, manualDayTitle, type Reservation } from '../../src/lib/bookings'
import { reservationOverlaps } from '../../src/lib/reservationOverlaps'
import { construirPresupuesto } from '../../src/lib/presupuesto'
import { pagoActivo, fijarVersion } from '../../src/lib/pago'
import { rehacerDiasSinTocar, rehacerDiaConReservas } from '../../src/lib/rebuildDay'
import { checkTime } from '../../src/lib/checkTime'
import { adjustDay } from '../../src/lib/adjustDay'
import { placeExcursionIn, renameDay } from '../../src/lib/freeDays'
import { diaCorto } from '../../src/lib/nombreDeDia'
import { EntradasYFreeTour } from '../../src/components/route/reservas/EntradasYFreeTour'
import { withCampaign } from '../../src/lib/affiliateLinks'

export {
  createElement, renderToStaticMarkup, DayList, ReservasPanel, PlaceExplorerScreen, stopFromPlace, ManualDayFooter, useRouteStore, useExcursionsStore, fetchDestinationPlaces, fetchDestinationExcursions,
  fetchArrivalInfo, isManualRoute, compareManualExplorer, placeReservedEntrance, reapplyReservations, buildEntradasBloque, manualDayTitle, reservationOverlaps, construirPresupuesto, pagoActivo,
  EntradasYFreeTour, withCampaign, fijarVersion, rehacerDiasSinTocar, rehacerDiaConReservas, checkTime, adjustDay, placeExcursionIn, renameDay, diaCorto,
}
export type { Reservation }
