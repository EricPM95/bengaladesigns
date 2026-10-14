// Entrada que empaqueta la prueba de la Tanda 7, parte CONEXIÓN (scripts/destino/pruebaTanda7_conexion.mjs): lo que la app manda a los motores, la hoja del resumen, los avisos de la campana,
// «Deshacer» con el rehacer cortado, la gratis sin nada de esto y [Añadir en un día nuevo] antes del día de vuelta.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { HojaResumenVuelo } from '../../src/components/route/reservas/HojaResumenVuelo'
import { NoticesSheet } from '../../src/components/layout/NoticesSheet'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useAddFlowStore, quitarConDeshacer } from '../../src/store/useAddFlowStore'
import { useResumenVueloStore } from '../../src/store/useResumenVueloStore'
import { useAvisosVueloStore } from '../../src/store/useAvisosVueloStore'
import { useAppNotices } from '../../src/hooks/useAppNotices'
import { fetchArrivalInfo } from '../../src/lib/arrivalReturn'
import { datosParaMotor, llegadaVueltaDe } from '../../src/lib/llegadaVuelta'
import { construirResumen, textoDiaCambiadoATu, TEXTO_AL_BORRAR, conFechasDeLosDias, textoDeLaVuelta } from '../../src/lib/resumenDeVuelo'
import { rehacerPorCambioDeVuelo, terminarRehacer, cortarRehacerPorVuelo, conservarLoCambiadoAMano } from '../../src/lib/cambioDeVuelo'
import { avisosParaLaCampana, bloqueDeReservasDelAviso } from '../../src/lib/avisosDeVuelo'
import { claveDeLosAvisos } from '../../src/hooks/useAvisosDeVuelo'
import { mapGeneratedRouteToRoute } from '../../src/lib/mapGeneratedRoute'
import * as nombreDeDia from '../../src/lib/nombreDeDia'
import { pasarDiaARoma } from '../../src/lib/pasarDiaARoma'
import { anadirExcursionEnDiaNuevo } from '../../src/store/excursionSinHuecoActions'
import { vueltaCambiada } from '../../src/lib/datosDelViajero'

/** Pinta los avisos de la campana como JSON (el gancho solo lee del almacén; en el servidor no corren los efectos). */
function AvisosProbe() {
  const { items } = useAppNotices()
  return createElement('pre', null, JSON.stringify(items.map((item) => ({ id: item.id, kind: item.kind, title: item.title, text: item.text, acciones: (item.acciones ?? []).map((accion) => accion.label), actionLabel: item.actionLabel ?? null }))))
}

export {
  createElement, renderToStaticMarkup, HojaResumenVuelo, NoticesSheet, useRouteStore, useAddFlowStore, quitarConDeshacer, useResumenVueloStore, useAvisosVueloStore, AvisosProbe, fetchArrivalInfo, datosParaMotor, llegadaVueltaDe,
  construirResumen, textoDiaCambiadoATu, TEXTO_AL_BORRAR, conFechasDeLosDias, textoDeLaVuelta, rehacerPorCambioDeVuelo, terminarRehacer, cortarRehacerPorVuelo, conservarLoCambiadoAMano, avisosParaLaCampana, bloqueDeReservasDelAviso,
  claveDeLosAvisos, mapGeneratedRouteToRoute, nombreDeDia, pasarDiaARoma, anadirExcursionEnDiaNuevo, vueltaCambiada,
}
