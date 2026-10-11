// Entrada que empaqueta la prueba de la Tanda 6y, parte A (scripts/destino/pruebaFase6y_formulario.mjs): la pantalla de elegir, el resumen corto, la ruta a mano y lo que se pinta sin experiencias.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StepElegir } from '../../src/components/trazo/StepElegir'
import { StepManualSummary } from '../../src/components/trazo/StepManualSummary'
import { AVISO_DE_ELEGIR, STEP, backStepFrom, isSummaryStep, shouldGenerateRoute, stepAfterChoice, stepNamesFor, usesExperiences } from '../../src/components/trazo/planChoice'
import { DayList } from '../../src/components/route/DayList'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { PlaceExplorerScreen } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { FreeTourSheet, routeHasFreeTour, freeTourAvailable } from '../../src/components/route/reservas/FreeTourSheet'
import { useRouteStore } from '../../src/store/useRouteStore'
import { buildManualRoute, manualDayName, manualTripDays, transportContextOf, withManualDayNames } from '../../src/lib/manualRoute'
import { rehacerDiasSinTocar, rehacerDiaConReservas, aplicarFreeTour } from '../../src/lib/rebuildDay'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { ICONOS } from '../../src/lib/iconos'

export {
  createElement, renderToStaticMarkup, StepElegir, StepManualSummary, AVISO_DE_ELEGIR, STEP, backStepFrom, isSummaryStep, shouldGenerateRoute, stepAfterChoice, stepNamesFor, usesExperiences, DayList, ReservasPanel,
  PlaceExplorerScreen, FreeTourSheet, routeHasFreeTour, freeTourAvailable, useRouteStore, buildManualRoute, manualDayName, manualTripDays, transportContextOf, withManualDayNames, rehacerDiasSinTocar,
  rehacerDiaConReservas, aplicarFreeTour, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, ICONOS,
}
