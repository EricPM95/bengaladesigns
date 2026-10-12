// Entrada que empaqueta la prueba de la Tanda 6y9, parte de las pantallas (scripts/destino/pruebaFase6y9_pantallas.mjs): la rueda de la hora de una entrada, la hoja del Free Tour y [Ver disponibilidad].
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { FreeTourSheet } from '../../src/components/route/reservas/FreeTourSheet'
import { AddReservationSheet } from '../../src/components/route/reservas/AddReservationSheet'
import { openTicketShop } from '../../src/components/route/reservas/EntradaCard'
import { horasDeLaRueda, AVISO_DISPONIBILIDAD } from '../../src/lib/horarioDeEntrada'
import { FREE_TOUR_FRANJAS, FREE_TOUR_HOURS } from '../../src/lib/freeTourHoras'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'

export { createElement, renderToStaticMarkup, FreeTourSheet, AddReservationSheet, openTicketShop, horasDeLaRueda, AVISO_DISPONIBILIDAD, FREE_TOUR_FRANJAS, FREE_TOUR_HOURS, fetchDestinationExcursions, useRouteStore, useAddFlowStore }
