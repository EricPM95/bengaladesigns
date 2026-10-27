// Entrada que empaqueta la prueba de la Tanda 6y5, parte de las pantallas (scripts/destino/pruebaFase6y5_pantallas.mjs): pinta en el servidor las piezas que cambian y trae el almacén de verdad.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LlegadaYVuelta, HojaHoraLlegada } from '../../src/components/route/reservas/LlegadaYVuelta'
import { UtilParaElViaje } from '../../src/components/route/reservas/UtilParaElViaje'
import { ExcursionesReservas } from '../../src/components/route/reservas/ExcursionesReservas'
import { DatesCalendarBody } from '../../src/components/route/DatesCalendarModal'
import { TrazoCalendar } from '../../src/components/trazo/TrazoCalendar'
import { TarjetaDeViaje } from '../../src/components/logros/pantallas/perfil/TarjetaDeViaje'
import { DayList } from '../../src/components/route/DayList'
import { stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useDatesCalendarStore } from '../../src/store/useDatesCalendarStore'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { legOf, legLine, legWord } from '../../src/lib/reservasLegs'
import { tocarDiaDelRango, rangoCompleto } from '../../src/lib/dateRange'
import { cifrasDelPerfil, resumenDeViaje } from '../../src/lib/viajesPerfil'

export {
  createElement, renderToStaticMarkup, LlegadaYVuelta, HojaHoraLlegada, UtilParaElViaje, ExcursionesReservas, DatesCalendarBody, TrazoCalendar, TarjetaDeViaje, DayList, stopFromPlace, useRouteStore,
  useDatesCalendarStore, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, legOf, legLine, legWord, tocarDiaDelRango, rangoCompleto, cifrasDelPerfil, resumenDeViaje,
}
