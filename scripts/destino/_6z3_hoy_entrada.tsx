// Entrada que empaqueta la prueba de la 6z3 (scripts/destino/pruebaTanda6z3.mjs): la barra de abajo, la cabecera y HOY en sus cuatro momentos, para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BottomBar, PESTANAS } from '../../src/components/layout/BottomBar'
import { Header } from '../../src/components/layout/Header'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { useRouteStore } from '../../src/store/useRouteStore'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { subtituloDelViaje } from '../../src/lib/resumenViaje'

export { createElement, renderToStaticMarkup, BottomBar, PESTANAS, Header, HoyView, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, subtituloDelViaje }
