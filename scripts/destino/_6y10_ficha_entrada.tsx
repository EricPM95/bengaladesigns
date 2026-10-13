// Entrada que empaqueta la prueba de la Tanda 6y10, parte de la ficha (scripts/destino/pruebaFase6y10_ficha.mjs): la ficha con sus dos etiquetas y el corazón, la cuenta única de «me gusta» y la etiqueta «Trastevere», para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { StopDetailSheet } from '../../src/components/route/dayDetail/StopDetailSheet'
import { PlaceExplorerScreen, stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { RestaurantDetailSheet } from '../../src/components/route/placeExplorer/RestaurantDetailSheet'
import { MeGusta } from '../../src/components/ui/MeGusta'
import { shellFromStop } from '../../src/lib/mockDayDetail'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useMeGustaStore, totalDe, totalesDe, claveDeDestino } from '../../src/store/useMeGustaStore'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada, normalizaNombre } from '../../src/lib/horarioDeParada'
import { etiquetaDeHorario } from '../../src/lib/etiquetaHorario'
import { numeroDeRecomendaciones, textoRecomendacion, conMiles, MIN_RECOMENDACIONES } from '../../src/lib/recomendaciones'
import { compareManualExplorer } from '../../src/lib/manualPlan'
import { fetchPlaceDetail } from '../../src/lib/placeDetailApi'

export {
  createElement,
  renderToStaticMarkup,
  DayList,
  HoyView,
  StopDetailSheet,
  PlaceExplorerScreen,
  stopFromPlace,
  RestaurantDetailSheet,
  MeGusta,
  shellFromStop,
  mapSingleGeneratedDay,
  useRouteStore,
  useMeGustaStore,
  totalDe,
  totalesDe,
  claveDeDestino,
  fetchDestinationPlaces,
  fetchDestinationExcursions,
  fetchArrivalInfo,
  cargaDatosDeHorario,
  datosDeHorarioEnMemoria,
  horarioDeParada,
  normalizaNombre,
  etiquetaDeHorario,
  numeroDeRecomendaciones,
  textoRecomendacion,
  conMiles,
  MIN_RECOMENDACIONES,
  compareManualExplorer,
  fetchPlaceDetail,
}
