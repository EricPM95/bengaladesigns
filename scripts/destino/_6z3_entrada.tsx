// Entrada que empaqueta la prueba de «con fechas, los días se llaman por su fecha» (scripts/destino/pruebaDiasFecha6z3.mjs): DÍAS, RESERVAS y las hojas que nombran un día, para pintarlas en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { AddToDaySheet } from '../../src/components/route/freeDay/AddToDaySheet'
import { AddDayChooser } from '../../src/components/route/freeDay/AddDayChooser'
import { WhereSheet } from '../../src/components/route/excursions/WhereSheet'
import { DayPositionPicker } from '../../src/components/route/dayDetail/DayPositionPicker'
import { useRouteStore } from '../../src/store/useRouteStore'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { detectFlightOpportunities } from '../../src/lib/flightOpportunity'
import * as nombreDeDia from '../../src/lib/nombreDeDia'
import { dayLineOf } from '../../src/lib/bookings'
import { legDayText } from '../../src/lib/reservasLegs'

export { createElement, renderToStaticMarkup, DayList, ReservasPanel, AddToDaySheet, AddDayChooser, WhereSheet, DayPositionPicker, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, detectFlightOpportunities, nombreDeDia, dayLineOf, legDayText }
