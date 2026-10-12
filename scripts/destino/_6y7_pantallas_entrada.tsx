// Entrada que empaqueta la prueba de la Tanda 6y7, parte de las pantallas (scripts/destino/pruebaFase6y7_pantallas.mjs): pinta en el servidor las piezas que cambian y trae el almacén de verdad.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DatesCalendarBody } from '../../src/components/route/DatesCalendarModal'
import { RehacerRuta } from '../../src/components/route/RehacerRuta'
import { ActualizandoRuta } from '../../src/components/ui/ActualizandoRuta'
import { StepDates } from '../../src/components/trazo/StepDates'
import { StepSummary } from '../../src/components/trazo/StepSummary'
import { STEP, backStepFrom, stepCounterLabel, stepNamesFor, usesPool, visibleStepNamesFor } from '../../src/components/trazo/planChoice'
import { poolSelectionLimit } from '../../src/components/questionnaire/CuratedPlacesPool'
import { useRouteStore } from '../../src/store/useRouteStore'

export { createElement, renderToStaticMarkup, DatesCalendarBody, RehacerRuta, ActualizandoRuta, StepDates, StepSummary, STEP, backStepFrom, stepCounterLabel, stepNamesFor, usesPool, visibleStepNamesFor, poolSelectionLimit, useRouteStore }
