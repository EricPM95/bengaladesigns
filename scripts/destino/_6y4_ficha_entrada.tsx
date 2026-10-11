// Entrada que empaqueta la prueba de la Tanda 6y4, parte de la ficha (scripts/destino/pruebaFase6y4_ficha.mjs): la ficha nueva, la etiqueta «Trastevere» y la hora de la entrada, para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { StopDetailSheet } from '../../src/components/route/dayDetail/StopDetailSheet'
import { FichaComoLlegar, FichaHorario, FichaPestanas, FichaPorElCamino, FichaQueVeras, FichaSinEntrada, FichaTip, FichaTuEntrada, lineasDe, siglaDeLinea } from '../../src/components/route/dayDetail/FichaPiezas'
import { EtiquetaBarrio } from '../../src/components/ui/EtiquetaBarrio'
import { PlaceExplorerScreen, stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { EntradasYFreeTour } from '../../src/components/route/reservas/EntradasYFreeTour'
import { Escuchar } from '../../src/components/route/hoy/Escuchar'
import { BotonFotoParada } from '../../src/components/route/fotos/BotonFotoParada'
import { limiteDeFotos, modoDeFoto } from '../../src/lib/fotosViaje'
import { notaDeLlegadaSinHora } from '../../src/lib/notaDeLlegada'
import { shellFromStop } from '../../src/lib/mockDayDetail'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { useRouteStore } from '../../src/store/useRouteStore'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { buildEntradasBloque } from '../../src/lib/bookings'
import { dayColor } from '../../src/lib/dayColors'
import { cargaDatosDeHorario } from '../../src/lib/horarioDeParada'
import { fetchPlaceDetail } from '../../src/lib/placeDetailApi'

export {
  createElement,
  renderToStaticMarkup,
  DayList,
  HoyView,
  StopDetailSheet,
  FichaComoLlegar,
  FichaHorario,
  FichaPestanas,
  FichaPorElCamino,
  FichaQueVeras,
  FichaSinEntrada,
  FichaTip,
  FichaTuEntrada,
  lineasDe,
  siglaDeLinea,
  EtiquetaBarrio,
  PlaceExplorerScreen,
  stopFromPlace,
  EntradasYFreeTour,
  Escuchar,
  BotonFotoParada,
  limiteDeFotos,
  modoDeFoto,
  notaDeLlegadaSinHora,
  shellFromStop,
  mapSingleGeneratedDay,
  useRouteStore,
  fetchDestinationPlaces,
  fetchDestinationExcursions,
  fetchArrivalInfo,
  buildEntradasBloque,
  dayColor,
  cargaDatosDeHorario,
  fetchPlaceDetail,
}
