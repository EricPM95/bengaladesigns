// Entrada que empaqueta la prueba de la 6z6 parte A (scripts/destino/pruebaTanda6z6a.mjs): la barra por versión, la tarjeta de la cuenta atrás en RESERVAS, DÍAS con «HOY» y «día completo», HOY antes y después y el panel de pruebas.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BottomBar, PESTANAS } from '../../src/components/layout/BottomBar'
import { DayList } from '../../src/components/route/DayList'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { HoyView } from '../../src/components/route/hoy/HoyView'
import { PanelDePruebas } from '../../src/components/dev/PanelDePruebas'
import { usePruebasUi } from '../../src/store/usePruebasUi'
import { useRouteStore } from '../../src/store/useRouteStore'
import { modoVisible } from '../../src/lib/barra'
import { diaDeHoy, diaQueSeAbreAlEntrar } from '../../src/lib/diaDeHoy'
import { esDiaCompleto, minutosDelDia, TEXTO_DIA_COMPLETO } from '../../src/lib/diaCompleto'
import { textoDeLoQueFalta } from '../../src/components/route/reservas/TarjetaCuentaAtras'
import { buildEntradasBloque } from '../../src/lib/bookings'
import { legsOf } from '../../src/lib/reservasLegs'
import { pagoActivo, fijarVersion } from '../../src/lib/pago'
import { esEntornoDePrueba, fijarPrueba, pruebaActiva } from '../../src/lib/recomendaciones'
import { mapSingleGeneratedDay } from '../../src/lib/mapGeneratedRoute'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'

export {
  createElement, renderToStaticMarkup, BottomBar, PESTANAS, DayList, ReservasPanel, HoyView, PanelDePruebas, usePruebasUi, useRouteStore, modoVisible, diaDeHoy, diaQueSeAbreAlEntrar,
  esDiaCompleto, minutosDelDia, TEXTO_DIA_COMPLETO, textoDeLoQueFalta, buildEntradasBloque, legsOf, pagoActivo, fijarVersion, esEntornoDePrueba, fijarPrueba, pruebaActiva,
  mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions,
}
