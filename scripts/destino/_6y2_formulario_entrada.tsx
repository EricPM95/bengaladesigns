// Entrada que empaqueta la prueba de la Tanda 6y2, parte del formulario (scripts/destino/pruebaFase6y2_formulario.mjs): el día a mano sin nombre, las fechas de la ruta a mano, el camino del formulario y el dibujo de elegir.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StepElegir } from '../../src/components/trazo/StepElegir'
import { STEP, shouldSuggestExperiences, stepCounterLabel, stepNamesFor, visibleStepNamesFor } from '../../src/components/trazo/planChoice'
import { DayList } from '../../src/components/route/DayList'
import { ManualDaysDialog, manualDaysQuestionText } from '../../src/components/route/DatesChangeDialog'
import { useRouteStore } from '../../src/store/useRouteStore'
import { buildManualRoute } from '../../src/lib/manualRoute'
import { answerManualAsk, planManualResize, resizeManualRoute, startManualAsk } from '../../src/lib/manualDuration'

export {
  createElement, renderToStaticMarkup, StepElegir, STEP, shouldSuggestExperiences, stepCounterLabel, stepNamesFor, visibleStepNamesFor, DayList, ManualDaysDialog, manualDaysQuestionText, useRouteStore,
  buildManualRoute, answerManualAsk, planManualResize, resizeManualRoute, startManualAsk,
}
