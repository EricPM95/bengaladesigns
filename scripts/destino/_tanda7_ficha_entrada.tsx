// Entrada que empaqueta la prueba de la Tanda 7, parte FICHA (scripts/destino/pruebaTanda7_ficha.mjs): la ficha de llegada y vuelta, «Para tu zona», la tarjeta «Hoy vuelves a casa», «Día de viaje» y el billete que abre la ficha.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArrivalReturnSheet } from '../../src/components/route/dayDetail/ArrivalReturnSheet'
import { ArrivalDetailSheet } from '../../src/components/route/dayDetail/ArrivalDetailSheet'
import { FichaResumen } from '../../src/components/route/dayDetail/FichaResumen'
import { TarjetaHoyVuelves } from '../../src/components/route/dayDetail/TarjetaHoyVuelves'
import { DayDetailPanel } from '../../src/components/route/dayDetail/DayDetailPanel'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useExploreAperturaStore } from '../../src/store/useExploreAperturaStore'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo, medioOf, puntoDeLaMitad } from '../../src/lib/arrivalReturn'
import { construirFicha, introDeFicha, datoDeFicha, nombreDeZona, horaCorta } from '../../src/lib/fichaLlegada'
import { nombreDelDia, lineaDeViaje, DIA_DE_VIAJE, esDiaDeLlegada } from '../../src/lib/tituloDelDia'
import { buildArrivalDepartureDetail } from '../../src/lib/mockDayDetail'
import { pagoActivo } from '../../src/lib/pago'

export {
  createElement, renderToStaticMarkup, ArrivalReturnSheet, ArrivalDetailSheet, FichaResumen, TarjetaHoyVuelves, DayDetailPanel, useRouteStore, useExploreAperturaStore, fetchDestinationExcursions, fetchArrivalInfo, medioOf, puntoDeLaMitad,
  construirFicha, introDeFicha, datoDeFicha, nombreDeZona, horaCorta, nombreDelDia, lineaDeViaje, DIA_DE_VIAJE, esDiaDeLlegada, buildArrivalDepartureDetail, pagoActivo,
}
