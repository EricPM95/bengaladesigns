import type { Route } from '../../../../lib/types'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useSyncStore } from '../../../../store/useSyncStore'
import { useLogrosStore } from '../../../../store/useLogrosStore'
import { getTodayTripStatus } from '../../../../lib/todayMode'
import { responderPregunta } from '../../../../lib/logros'
import { usePaseEstado } from '../../../../lib/paseEstado'
import { HoyDespuesV2 } from './HoyDespuesV2'
import { CabeceraHoy, HoyAntesV2, ojoDeViaje } from './HoyAntesV2'
import { HoyDuranteV2 } from './HoyDuranteV2'
import { HojaPregunta } from './HojasV2'

/** HOY, versión 2 (Tanda 8B). Lo elige HoyView cuando `hoyV2Activo()`. Antes, durante o después, y la pregunta de las 12:00 del día de prueba cuando el servidor la pide. */
export function HoyV2({ route, onPonFechas }: { route: Route; onPonFechas: () => void }) {
  const simulada = useRouteStore((s) => s.dev_simulated_today_iso)
  const tripId = useSyncStore((s) => s.activeTripId)
  const pregunta = useLogrosStore((s) => s.pregunta)
  const pase = usePaseEstado(tripId)
  const estado = getTodayTripStatus(route, simulada ?? undefined)

  const responder = async (r: 'hoy' | 'manana') => {
    const store = useLogrosStore.getState()
    store.limpiarPregunta()
    if (!tripId) return
    const res = await responderPregunta(tripId, r)
    res?.respuestas.forEach((x) => useLogrosStore.getState().recibir(x))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-7 pt-1" data-hoy={estado?.phase ?? 'antes-sin-fechas'} data-hoy-v2="1">
      {!estado || estado.phase === 'before' ? (
        <>
          <CabeceraHoy ojo={ojoDeViaje(route, estado?.startIso ?? null)} titulo={`Tu viaje a ${route.destination}`} />
          <HoyAntesV2 startIso={estado?.startIso ?? null} simulada={simulada} pase={pase} onPonFechas={onPonFechas} />
        </>
      ) : estado.phase === 'during' ? (
        <HoyDuranteV2 route={route} day={estado.context.day} dateIso={estado.context.dateIso} pase={pase} />
      ) : (
        <HoyDespuesV2 route={route} startIso={estado.startIso} />
      )}
      {pregunta && estado?.phase === 'during' && <HojaPregunta texto={pregunta.texto} onResponder={responder} />}
    </div>
  )
}
