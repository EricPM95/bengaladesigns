// Entrada que empaqueta la prueba de la 6z5 (scripts/destino/pruebaTanda6z5.mjs): el horario de cada parada (módulo, tarjeta de DÍAS y HOY) y «No me da tiempo» en HOY, para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { StopAccordion } from '../../src/components/route/dayDetail/StopAccordion'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { AvisoEntradaReservada, AvisoSaltada, HojaPasarAOtroDia } from '../../src/components/route/hoy/saltar'
import { useRouteStore } from '../../src/store/useRouteStore'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada } from '../../src/lib/horarioDeParada'
import { numberedStopsOf } from '../../src/lib/stopKind'
import { reservasEnCierre } from '../../src/lib/reservaEnCierre'
import { reservationOverlaps } from '../../src/lib/reservationOverlaps'
import { useAppNotices } from '../../src/hooks/useAppNotices'

export { createElement, renderToStaticMarkup, DayList, StopAccordion, HoyView, AvisoEntradaReservada, AvisoSaltada, HojaPasarAOtroDia, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada, numberedStopsOf, reservasEnCierre, reservationOverlaps, useAppNotices }
