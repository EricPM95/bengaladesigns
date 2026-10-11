// Entrada que empaqueta la prueba de la Tanda 6y4, parte del formulario (scripts/destino/pruebaFase6y4_formulario.mjs): el tope del pool, el calendario compartido y su apertura.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { poolSelectionLimit } from '../../src/components/questionnaire/CuratedPlacesPool'
import { stepAfterChoice, STEP } from '../../src/components/trazo/planChoice'
import { TrazoCalendar } from '../../src/components/trazo/TrazoCalendar'
import { DatesCalendarBody, DatesCalendarModal, DATES_CALENDAR_Z } from '../../src/components/route/DatesCalendarModal'
import { useDatesCalendarStore } from '../../src/store/useDatesCalendarStore'
import { useRouteStore } from '../../src/store/useRouteStore'

export { createElement, renderToStaticMarkup, poolSelectionLimit, stepAfterChoice, STEP, TrazoCalendar, DatesCalendarBody, DatesCalendarModal, DATES_CALENDAR_Z, useDatesCalendarStore, useRouteStore }
