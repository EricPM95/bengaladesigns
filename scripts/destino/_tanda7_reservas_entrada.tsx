// Entrada que empaqueta la prueba de la Tanda 7, parte RESERVAS (scripts/destino/pruebaTanda7_reservas.mjs): las casillas nuevas de la ida y la vuelta, el punto obligatorio, la zona, la dirección,
// el aviso de cambio de fechas, «Deshacer» al quitar el vuelo, el billete y la tarjeta de la gratis.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LlegadaYVuelta } from '../../src/components/route/reservas/LlegadaYVuelta'
import { AlojamientoReservas } from '../../src/components/route/reservas/AlojamientoReservas'
import { BotonComoLlegarAlojamiento } from '../../src/components/route/alojamiento/BotonComoLlegarAlojamiento'
import { BilleteDeVuelo } from '../../src/components/route/dayDetail/BilleteDeVuelo'
import { TarjetaTuUltimoDia } from '../../src/components/route/dayDetail/TarjetaTuUltimoDia'
import { DayDetailPanel } from '../../src/components/route/dayDetail/DayDetailPanel'
import { ReservasPanel } from '../../src/components/route/ReservasPanel'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore, quitarConDeshacer } from '../../src/store/useAddFlowStore'
import { useAppNotices } from '../../src/hooks/useAppNotices'
import { fetchDestinationExcursions } from '../../src/lib/destinationExcursions'
import { fetchArrivalInfo, medioOf, puntoPorDefecto, puntoDeLaMitad } from '../../src/lib/arrivalReturn'
import { legOf } from '../../src/lib/reservasLegs'
import { billeteDe, codigoDeUnPunto } from '../../src/lib/billete'
import { enlaceComoLlegarAlojamiento, direccionDelAlojamiento } from '../../src/lib/direccionAlojamiento'
import { camposDelViajero, vueltaCambiada, sellarVueltaAlAbrir } from '../../src/lib/datosDelViajero'
import { rehacerPorCambioDeVuelo } from '../../src/lib/cambioDeVuelo'
import { pagoActivo } from '../../src/lib/pago'

/** Pinta los avisos de la campana como JSON (el gancho solo lee del almacén; en el servidor no corren los efectos). */
function AvisosProbe() {
  const { items } = useAppNotices()
  return createElement('pre', null, JSON.stringify(items.map((item) => ({ id: item.id, kind: item.kind, title: item.title, text: item.text, actionLabel: item.actionLabel ?? null, tieneRun: Boolean(item.run) }))))
}

export {
  createElement, renderToStaticMarkup, LlegadaYVuelta, AlojamientoReservas, BotonComoLlegarAlojamiento, BilleteDeVuelo, TarjetaTuUltimoDia, DayDetailPanel, ReservasPanel, useRouteStore, useAddFlowStore, quitarConDeshacer,
  AvisosProbe, fetchDestinationExcursions, fetchArrivalInfo, medioOf, puntoPorDefecto, puntoDeLaMitad, legOf, billeteDe, codigoDeUnPunto, enlaceComoLlegarAlojamiento, direccionDelAlojamiento, camposDelViajero, vueltaCambiada, sellarVueltaAlAbrir,
  rehacerPorCambioDeVuelo, pagoActivo,
}
