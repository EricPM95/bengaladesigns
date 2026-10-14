// Entrada que empaqueta la prueba de la Tanda 7, parte UNIFICADO (scripts/destino/pruebaTanda7_unificado.mjs): HOY, el panel de un día de DÍAS, la ficha y la hoja del resumen, pintados en el servidor con el código de verdad.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { DayDetailPanel } from '../../src/components/route/dayDetail/DayDetailPanel'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'
import { mapSingleGeneratedDay, planesDelMotor } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { cargaDatosDeHorario } from '../../src/lib/horarioDeParada'
import { masVisitasDe, diaRecortado } from '../../src/lib/masVisitas'
import { esDiaDeLlegada } from '../../src/lib/tituloDelDia'
import { tarjetaHoyVuelvesDelDia } from '../../src/lib/planLlegadaVuelta'
import { construirResumen } from '../../src/lib/resumenDeVuelo'

export {
  createElement, renderToStaticMarkup, HoyView, DayDetailPanel, useRouteStore, useAddFlowStore, mapSingleGeneratedDay, planesDelMotor, fetchArrivalInfo, fetchDestinationExcursions, fetchDestinationPlaces,
  cargaDatosDeHorario, masVisitasDe, diaRecortado, esDiaDeLlegada, tarjetaHoyVuelvesDelDia, construirResumen,
}
