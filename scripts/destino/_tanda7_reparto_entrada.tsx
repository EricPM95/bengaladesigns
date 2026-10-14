// Entrada que empaqueta la prueba de la Tanda 7, parte REPARTO (scripts/destino/pruebaTanda7_reparto.mjs): la generación de verdad del cliente (esqueleto → lugares → bloques → día de vuelta),
// el rehacer por cambio de fechas o de vuelo, [Añadir en un día nuevo] y las tarjetas del día de vuelta.
import { runGeneration } from '../../src/lib/routeGenerationOrchestrator'
import { useRouteStore } from '../../src/store/useRouteStore'
import { addFreeDay } from '../../src/lib/freeDays'
import { datosParaMotor, llegadaVueltaDe } from '../../src/lib/llegadaVuelta'
import { fetchArrivalInfo, tripModes } from '../../src/lib/arrivalReturn'
import { rehacerPorCambioDeVuelo, terminarRehacer } from '../../src/lib/cambioDeVuelo'
import { tarjetaHoyVuelvesDelDia } from '../../src/lib/planLlegadaVuelta'
import { transportContextOf, buildManualRoute } from '../../src/lib/manualRoute'
import { anadirExcursionEnDiaNuevo } from '../../src/store/excursionSinHuecoActions'
import { vueltaCambiada } from '../../src/lib/datosDelViajero'
import { useAddFlowStore } from '../../src/store/useAddFlowStore'
import { useResumenVueloStore } from '../../src/store/useResumenVueloStore'
import { nombreDeDia } from '../../src/lib/nombreDeDia'
import { pagoActivo } from '../../src/lib/pago'

export {
  runGeneration, useRouteStore, addFreeDay, datosParaMotor, llegadaVueltaDe, fetchArrivalInfo, tripModes, rehacerPorCambioDeVuelo, terminarRehacer, tarjetaHoyVuelvesDelDia, transportContextOf, buildManualRoute,
  anadirExcursionEnDiaNuevo, vueltaCambiada, useAddFlowStore, useResumenVueloStore, nombreDeDia, pagoActivo,
}
