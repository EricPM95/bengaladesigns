// Entrada que empaqueta la prueba de la 6z6 parte C (scripts/destino/pruebaTanda6z6c.mjs): HOY de pago durante el viaje (Cerca de ti, Escuchar, avisos de cierre, día completo), EXPLORAR y «Escuchar», para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { Escuchar } from '../../src/components/route/hoy/Escuchar'
import { CercaDeTi } from '../../src/components/route/hoy/CercaDeTi'
import { PlaceExplorerScreen } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { StopMenu } from '../../src/components/route/dayDetail/StopMenu'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useExploreAperturaStore } from '../../src/store/useExploreAperturaStore'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { cargaDatosDeHorario, horarioDeParada } from '../../src/lib/horarioDeParada'
import { numberedStopsOf } from '../../src/lib/stopKind'
import { avisosDeCierre } from '../../src/lib/avisosDeHoy'
import { esDiaCompleto, TEXTO_DIA_COMPLETO } from '../../src/lib/diaCompleto'
import { crearEscucha, elegirVoz, hayVozEnEspañol, textoParaEscuchar, textoResumenDeParada, trocearTexto } from '../../src/lib/useEscuchar'
import { explorarConBanosYFuentes, explorarConCercania } from '../../src/lib/explorarDePago'
import { ICONOS } from '../../src/lib/iconos'

export {
  createElement, renderToStaticMarkup, HoyView, Escuchar, CercaDeTi, PlaceExplorerScreen, StopMenu, useRouteStore, useExploreAperturaStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, fetchDestinationPlaces,
  cargaDatosDeHorario, horarioDeParada, numberedStopsOf, avisosDeCierre, esDiaCompleto, TEXTO_DIA_COMPLETO, crearEscucha, elegirVoz, hayVozEnEspañol, textoParaEscuchar, textoResumenDeParada, trocearTexto, explorarConBanosYFuentes, explorarConCercania, ICONOS,
}
