// Entrada que empaqueta la prueba de la Tanda 6y3 (scripts/destino/pruebaFase6y3_reservas.mjs): el orden de «Añadir parada» a mano, quitar el Free Tour a mano, los botones del aviso y la foto del Free Tour.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore, removeReservationWithUndo } from '../../src/store/useAddFlowStore'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { compareManualExplorer } from '../../src/lib/manualPlan'
import { isManualFreeTourReservation, withoutManualFreeTour, pedirFotoDelFreeTour } from '../../src/lib/freeTourManual'
import { reservasFueraDeSuDia, aplicarAvisoFueraDeDia } from '../../src/lib/reservaFueraDeDia'

export {
  createElement, renderToStaticMarkup, DayList, stopFromPlace, useRouteStore, useAddFlowStore, removeReservationWithUndo, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo,
  compareManualExplorer, isManualFreeTourReservation, withoutManualFreeTour, pedirFotoDelFreeTour, reservasFueraDeSuDia, aplicarAvisoFueraDeDia,
}
