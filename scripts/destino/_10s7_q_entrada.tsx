// Entrada que empaqueta pruebaTanda10S7_Q.mjs (la regla «toda parada nueva, la primera del día» y las miniaturas de las entradas con foto).
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'
import { moverParadaAOtroDia, ponerParadaEnElDia } from '../../src/lib/cambiarParada'
import { dondeQueda } from '../../src/lib/dondeQuedaLaParada'
import { placeReservedEntrance, reapplyReservations } from '../../src/lib/bookings'
import { TarjetaReservada, TarjetaPorReservar } from '../../src/components/route/reservas/TarjetasEntradas'

export { createElement, renderToStaticMarkup, useRouteStore, useAddFlowStore, moverParadaAOtroDia, ponerParadaEnElDia, dondeQueda, placeReservedEntrance, reapplyReservations, TarjetaReservada, TarjetaPorReservar }
