// Entrada que empaqueta la prueba de la Tanda 6y2, parte del formulario (scripts/destino/pruebaFase6y2_formulario.mjs): el día a mano sin nombre, las fechas de la ruta a mano, el camino del formulario y la pantalla de elegir.
// (Tanda 6y3: la pregunta «¿Qué hago con ellas?» ya no existe; ver pruebaFase6y3_formulario.mjs.)
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StepElegir } from '../../src/components/trazo/StepElegir'
import { STEP, shouldSuggestExperiences, stepCounterLabel, stepNamesFor, visibleStepNamesFor } from '../../src/components/trazo/planChoice'
import { DayList } from '../../src/components/route/DayList'
import { useRouteStore } from '../../src/store/useRouteStore'
import { buildManualRoute } from '../../src/lib/manualRoute'
import { planManualResize, resizeManualRoute } from '../../src/lib/manualDuration'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'

export {
  createElement, renderToStaticMarkup, StepElegir, STEP, shouldSuggestExperiences, stepCounterLabel, stepNamesFor, visibleStepNamesFor, DayList, useRouteStore,
  buildManualRoute, planManualResize, resizeManualRoute, fetchDestinationExcursions,
}
