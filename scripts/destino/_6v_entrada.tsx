// Entrada que empaqueta la prueba de la Tanda 6v (scripts/destino/pruebaTanda6v.mjs): RESERVAS, sus bloques y los avisos, para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { EntradasYFreeTour } from '../../src/components/route/reservas/EntradasYFreeTour'
import { useRouteStore } from '../../src/store/useRouteStore'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { reservationOverlaps } from '../../src/lib/reservationOverlaps'
import { useAppNotices } from '../../src/hooks/useAppNotices'

export { createElement, renderToStaticMarkup, ReservasPanel, EntradasYFreeTour, useRouteStore, fetchDestinationExcursions, fetchArrivalInfo, reservationOverlaps, useAppNotices }
