// Entrada que empaqueta la prueba de la Tanda 6y3, parte del formulario (scripts/destino/pruebaFase6y3_formulario.mjs): la barra de pasos y el «¿Estás seguro?» de acortar las fechas de una ruta a mano.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { STEP, stepCounterLabel, stepNamesFor, visibleStepNamesFor } from '../../src/components/trazo/planChoice'
import { ManualShrinkDialog } from '../../src/components/route/DatesChangeDialog'
import { useRouteStore } from '../../src/store/useRouteStore'
import { buildManualRoute } from '../../src/lib/manualRoute'
import { manualRemovalText, manualShrinkNotice, planManualResize, resizeManualRoute } from '../../src/lib/manualDuration'

export { createElement, renderToStaticMarkup, STEP, stepCounterLabel, stepNamesFor, visibleStepNamesFor, ManualShrinkDialog, useRouteStore, buildManualRoute, manualRemovalText, manualShrinkNotice, planManualResize, resizeManualRoute }
