// Entrada que empaqueta la prueba de la 6y4, parte del presupuesto (scripts/destino/pruebaFase6y4_presupuesto.mjs): pinta en el servidor las piezas que cambian y trae el almacén de verdad.
import { createElement } from 'react'
import { ponerMonedaLocal } from '../../src/lib/moneda'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { PantallaPresupuesto } from '../../src/components/route/presupuesto/PantallaPresupuesto'
import { UtilParaElViaje } from '../../src/components/route/reservas/UtilParaElViaje'
import { AccommodationBlock } from '../../src/components/route/dayDetail/AccommodationBlock'
import { HojaPrecio } from '../../src/components/route/reservas/HojaPrecio'
import { HojaHoraLlegada, LlegadaYVuelta } from '../../src/components/route/reservas/LlegadaYVuelta'
import { TransportBookingModal } from '../../src/components/route/reservas/TransportBookingModal'
import { PlaceExplorerScreen, stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { useRouteStore } from '../../src/store/useRouteStore'
import { usePresupuestoUi } from '../../src/store/usePresupuestoUi'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { legOf, legLine } from '../../src/lib/reservasLegs'
import { barTextOf } from '../../src/lib/arrivalReturn'
import { construirPresupuesto } from '../../src/lib/presupuesto'
import { alojamientoCubierto } from '../../src/lib/tuAlojamiento'
import { nombreDeMoneda, monedaConNombre } from '../../src/lib/dinero'
import { monedaDelViajero } from '../../src/lib/useMoneda'
import { pagoActivo } from '../../src/lib/pago'
import * as PrecioVuela from '../../src/lib/precioVuela'

export {
  createElement, renderToStaticMarkup, DayList, PantallaPresupuesto, UtilParaElViaje, AccommodationBlock, HojaPrecio, HojaHoraLlegada, LlegadaYVuelta, TransportBookingModal, PlaceExplorerScreen, stopFromPlace,
  useRouteStore, usePresupuestoUi, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, legOf, legLine, barTextOf, construirPresupuesto, alojamientoCubierto, nombreDeMoneda,
  monedaConNombre, monedaDelViajero, pagoActivo, PrecioVuela, ponerMonedaLocal,
}
