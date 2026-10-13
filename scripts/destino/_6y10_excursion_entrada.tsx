// Entrada que empaqueta la prueba de la Tanda 6y10, parte de la excursión con los días llenos (scripts/destino/pruebaFase6y10_excursion.mjs).
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AddToDaySheet } from '../../src/components/route/freeDay/AddToDaySheet'
import { CambiarDiaSheet } from '../../src/components/route/excursions/ExcursionSinHueco'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'
import { anadirExcursionEnDiaNuevo, cambiarDiaPorExcursion } from '../../src/store/excursionSinHuecoActions'
import { opcionesDeCambio, paradasQueSePierden, perdidaDeCambiar, textoDeConfirmar, pesoDeParada } from '../../src/lib/excursionSinHueco'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { dateOfDay } from '../../src/lib/bookings'

export {
  createElement, renderToStaticMarkup, AddToDaySheet, CambiarDiaSheet, useRouteStore, useAddFlowStore, anadirExcursionEnDiaNuevo, cambiarDiaPorExcursion,
  opcionesDeCambio, paradasQueSePierden, perdidaDeCambiar, textoDeConfirmar, pesoDeParada, fetchDestinationExcursions, dateOfDay,
}
