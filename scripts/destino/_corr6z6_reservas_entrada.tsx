// Entrada que empaqueta la prueba de la corrección 6z6b de RESERVAS (scripts/destino/pruebaCorr6z6_reservas.mjs): la tarjeta oscura, la clara, la cartera, el «Falta» único y «Útil para el viaje».
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { UtilParaElViaje } from '../../src/components/route/reservas/UtilParaElViaje'
import { BotonCartera } from '../../src/components/presupuesto/BotonCartera'
import { usePresupuestoUi } from '../../src/store/usePresupuestoUi'
import { useRouteStore } from '../../src/store/useRouteStore'
import { buildEntradasBloque } from '../../src/lib/bookings'
import { legsOf } from '../../src/lib/reservasLegs'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'

export { createElement, renderToStaticMarkup, ReservasPanel, UtilParaElViaje, BotonCartera, usePresupuestoUi, useRouteStore, buildEntradasBloque, legsOf, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions }
