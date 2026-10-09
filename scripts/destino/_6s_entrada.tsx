// Entrada que empaqueta la prueba de la Tanda 6s (scripts/destino/pruebaTanda6s.mjs): el panel RESERVAS y lo que necesita, para pintarlo en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { useRouteStore } from '../../src/store/useRouteStore'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { buildEntradasBloque, hasEnoughDaysForExcursions } from '../../src/lib/bookings'
import { legsOf, legLine, legsTag } from '../../src/lib/reservasLegs'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { pagoActivo } from '../../src/lib/pago'

export { fetchArrivalInfo, createElement, renderToStaticMarkup, ReservasPanel, useRouteStore, fetchDestinationExcursions, buildEntradasBloque, hasEnoughDaysForExcursions, legsOf, legLine, legsTag, pagoActivo }
