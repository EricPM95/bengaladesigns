// Entrada que empaqueta la prueba de la Tanda 6y4, parte de RESERVAS (scripts/destino/pruebaFase6y4_reservas.mjs): acortar las fechas con reservas, «Deshacer» al quitar cualquier reserva,
// la foto del Free Tour y la Fontana de Trevi fuera de las entradas.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { ManualShrinkDialog } from '../../src/components/route/DatesChangeDialog'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore, quitarConDeshacer, removeReservationWithUndo } from '../../src/store/useAddFlowStore'
import { buildManualRoute } from '../../src/lib/manualRoute'
import { manualShrinkNotice, planManualResize } from '../../src/lib/manualDuration'
import { buildEntradasBloque } from '../../src/lib/bookings'
import { buildReadinessItems } from '../../src/lib/readiness'
import { construirPresupuesto } from '../../src/lib/presupuesto'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { pedirFotoDelFreeTour } from '../../src/lib/freeTourManual'

export {
  createElement, renderToStaticMarkup, ReservasPanel, ManualShrinkDialog, useRouteStore, useAddFlowStore, quitarConDeshacer, removeReservationWithUndo, buildManualRoute, manualShrinkNotice, planManualResize,
  buildEntradasBloque, buildReadinessItems, construirPresupuesto, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, stopFromPlace, pedirFotoDelFreeTour,
}
