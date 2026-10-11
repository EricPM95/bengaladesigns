// Entrada que empaqueta la prueba de la Tanda 6y2 (scripts/destino/pruebaFase6y2_reservas.mjs): el Free Tour a mano, «día completo» a mano, el aviso de la reserva fuera de su día y la lista de «Añadir parada».
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DayList } from '../../src/components/route/DayList'
import { PlaceExplorerScreen, stopFromPlace } from '../../src/components/route/placeExplorer/PlaceExplorerScreen'
import { EntradasYFreeTour } from '../../src/components/route/reservas/EntradasYFreeTour'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'
import { fetchDestinationPlaces } from '../../src/lib/destinationPlacesApi'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { buildEntradasBloque, dayOfReservation } from '../../src/lib/bookings'
import { esDiaCompleto, minutosDelDia } from '../../src/lib/diaCompleto'
import { freeTourAvailable } from '../../src/components/route/reservas/FreeTourSheet'
import { reservasFueraDeSuDia, aplicarAvisoFueraDeDia } from '../../src/lib/reservaFueraDeDia'
import { construirPresupuesto } from '../../src/lib/presupuesto'
import { pagoActivo } from '../../src/lib/pago'
import { useAppNotices } from '../../src/hooks/useAppNotices'

function Campana() {
  const { items } = useAppNotices()
  return createElement('pre', { id: 'campana' }, JSON.stringify(items.map((item) => ({ id: item.id, kind: item.kind, title: item.title, text: item.text, actionLabel: item.actionLabel ?? null, tieneRun: typeof item.run === 'function' }))))
}
const itemsDeLaCampana = (): { id: string; kind: string; title: string; text: string; actionLabel: string | null; tieneRun: boolean }[] => {
  const html = renderToStaticMarkup(createElement(Campana))
  const texto = html.replace(/^<pre id="campana">/, '').replace(/<\/pre>$/, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
  return JSON.parse(texto)
}
let ultimosItems: { run?: () => void; id: string }[] = []
function CampanaConRun() {
  ultimosItems = useAppNotices().items
  return null
}
const ejecutarDeLaCampana = (id: string): boolean => {
  renderToStaticMarkup(createElement(CampanaConRun))
  const item = ultimosItems.find((candidate) => candidate.id === id)
  if (!item?.run) return false
  item.run()
  return true
}

export {
  createElement, renderToStaticMarkup, DayList, PlaceExplorerScreen, stopFromPlace, EntradasYFreeTour, useRouteStore, useAddFlowStore, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo,
  buildEntradasBloque, dayOfReservation, esDiaCompleto, minutosDelDia, freeTourAvailable, reservasFueraDeSuDia, aplicarAvisoFueraDeDia, construirPresupuesto, pagoActivo, itemsDeLaCampana, ejecutarDeLaCampana,
}
