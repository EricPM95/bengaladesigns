// Entrada que empaqueta la prueba de la Tanda 7, parte «mover a otro día», «cambiar parada», «5 días · 4 noches» y «Cerrado este día» (scripts/destino/pruebaTanda7_mover.mjs), para pintarlas en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ListaDeDias, ETIQUETA_DIA_DE_EXCURSION } from '../../src/components/route/dayDetail/ListaDeDias'
import { StopAccordion } from '../../src/components/route/dayDetail/StopAccordion'
import { HojaPasarAOtroDia } from '../../src/components/route/hoy/saltar'
import { HoyDespues } from '../../src/components/route/hoy/HoyDespues'
import { FILTROS_DE_CAMBIAR_PARADA, preguntaDeCambiarParada } from '../../src/components/route/dayDetail/CambiarParada'
import { PlaceExplorerScreen, stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { TrazoCalendar } from '../../src/components/trazo/TrazoCalendar'
import { TripCard } from '../../src/components/myTrips/TripCard'
import { rangoDelViaje } from '../../src/components/route/ReservasPanel'
import { resumenDeViaje } from '../../src/lib/viajesPerfil'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'
import { moverParadaAOtroDia, cambiarParadaPorOtra, paradaQueSustituye, mensajeDeCambiarParada } from '../../src/lib/cambiarParada'
import { textoDeDuracion, textoDeDias, textoDeNoches, diasDelViaje } from '../../src/lib/duracionViaje'
import { ICONOS } from '../../src/lib/iconos'
import { CERRADO_ESTE_DIA } from '../../src/lib/placeHoursOnDate'
import { shellFromStop } from '../../src/lib/mockDayDetail'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada } from '../../src/lib/horarioDeParada'

export {
  createElement,
  renderToStaticMarkup,
  ListaDeDias,
  ETIQUETA_DIA_DE_EXCURSION,
  StopAccordion,
  HojaPasarAOtroDia,
  HoyDespues,
  FILTROS_DE_CAMBIAR_PARADA,
  preguntaDeCambiarParada,
  PlaceExplorerScreen,
  stopFromPlace,
  TrazoCalendar,
  TripCard,
  rangoDelViaje,
  resumenDeViaje,
  useRouteStore,
  useAddFlowStore,
  moverParadaAOtroDia,
  cambiarParadaPorOtra,
  paradaQueSustituye,
  mensajeDeCambiarParada,
  textoDeDuracion,
  textoDeDias,
  textoDeNoches,
  diasDelViaje,
  ICONOS,
  CERRADO_ESTE_DIA,
  shellFromStop,
  fetchDestinationPlaces,
  fetchDestinationExcursions,
  fetchArrivalInfo,
  cargaDatosDeHorario,
  datosDeHorarioEnMemoria,
  horarioDeParada,
}
