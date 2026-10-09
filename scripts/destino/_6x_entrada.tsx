// Entrada que empaqueta la prueba de «las franjas, sin hora» (scripts/destino/pruebaFranjas6x.mjs): la lista de DÍAS (con la tarjeta del día abierta) y lo que necesita, para pintarla en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { MealTimeAccordion } from '../../src/components/route/dayDetail/MealTimeAccordion'
import { HalfDayExcursionBlock, FreeAfternoonBlock } from '../../src/components/route/dayDetail/ExcursionBlocks'
import { useRouteStore } from '../../src/store/useRouteStore'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'

export { createElement, renderToStaticMarkup, DayList, MealTimeAccordion, HalfDayExcursionBlock, FreeAfternoonBlock, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions }
