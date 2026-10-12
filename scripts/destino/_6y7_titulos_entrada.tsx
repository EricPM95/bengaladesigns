// Entrada que empaqueta la prueba de la Tanda 6y7, parte de los TÍTULOS DE LOS DÍAS (scripts/destino/pruebaFase6y7_titulos.mjs): DÍAS y HOY con el código de verdad de la app.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { useRouteStore } from '../../src/store/useRouteStore'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { nombreDelDia, gruposQueNombranElDia, grupoDeParada, paradasParaElTitulo, tituloSimpleDelDia, nombrePropioDelDia } from '../../src/lib/tituloDelDia'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'

export {
  createElement, renderToStaticMarkup, DayList, HoyView, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions,
  nombreDelDia, gruposQueNombranElDia, grupoDeParada, paradasParaElTitulo, tituloSimpleDelDia, nombrePropioDelDia, fetchDestinationPlaces, stopFromPlace,
}
