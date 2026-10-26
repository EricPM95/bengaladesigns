// Entrada que empaqueta la prueba de la Tanda 6y5, parte de las historias (scripts/destino/pruebaFase6y5_historias.mjs): la barra «Escuchar historia», el botón «Historia» de HOY y la ficha, para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { HistoriaDeParada } from '../../src/components/route/hoy/HoyDurante'
import { Escuchar } from '../../src/components/route/hoy/Escuchar'
import { StopDetailSheet } from '../../src/components/route/dayDetail/StopDetailSheet'
import { useRouteStore } from '../../src/store/useRouteStore'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { cargaDatosDeHorario } from '../../src/lib/horarioDeParada'
import { numberedStopsOf } from '../../src/lib/stopKind'
import { accesoHistoria, textoHistoria } from '../../src/lib/historia'
import { fetchPlaceDetail, toStopDescription, toStopTips } from '../../src/lib/placeDetailApi'
import { EVENTO_PAGAR, pedirPago } from '../../src/lib/pago'
import { useHistoriaDePrueba } from '../../src/lib/historiaDePrueba'

export {
  createElement, renderToStaticMarkup, HoyView, HistoriaDeParada, Escuchar, StopDetailSheet, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, fetchDestinationPlaces,
  cargaDatosDeHorario, numberedStopsOf, accesoHistoria, textoHistoria, fetchPlaceDetail, toStopDescription, toStopTips, EVENTO_PAGAR, pedirPago, useHistoriaDePrueba,
}
