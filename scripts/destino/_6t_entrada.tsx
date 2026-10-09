// Entrada que empaqueta la prueba de la Tanda 6t (scripts/destino/pruebaTanda6t.mjs): la barra y la ventana de llegada y de vuelta, y RESERVAS, para pintarlas en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArrivalReturnBar } from '../../src/components/route/dayDetail/ArrivalReturnBar'
import { ArrivalReturnSheet } from '../../src/components/route/dayDetail/ArrivalReturnSheet'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { useRouteStore } from '../../src/store/useRouteStore'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { barTextOf, fetchArrivalInfo, medioOf, tripModes } from '../../src/lib/arrivalReturn'

export { createElement, renderToStaticMarkup, ArrivalReturnBar, ArrivalReturnSheet, ReservasPanel, useRouteStore, fetchDestinationExcursions, fetchArrivalInfo, barTextOf, medioOf, tripModes }
