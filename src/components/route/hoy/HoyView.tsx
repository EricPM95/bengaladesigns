import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { getTodayTripStatus } from '../../../lib/todayMode'
import { useEffect } from 'react'
import { pagoActivo, fijarDiaDePrueba } from '../../../lib/pago'
import { useSyncStore } from '../../../store/useSyncStore'
import { usePaseEstado } from '../../../lib/paseEstado'
import { filaDeHoySinPase } from '../../../lib/diaDePrueba'
import { todayIso } from '../../../lib/dateRange'
import { FranjaDiaDePrueba } from './TarjetaDeLaPrueba'
import { CON_PASE, HoyAntesDelDiseno, HoySinPase } from './HoySinPase'
import { HoyDurante } from './HoyDurante'
import { HoyDespues } from './HoyDespues'
import { hoyV2Activo } from '../../../lib/hoyV2'
import { HoyV2 } from './v2/HoyV2'

/**
 * La pestaña HOY (Tanda 6z3 y 6z6): SOLO de pago (en la gratis la pestaña no está; ver src/lib/barra.ts). Lo de dentro cambia según el momento del viaje —antes, durante o después (el día siguiente al último)— y la barra no cambia.
 * Sin fechas (solo el mes), HOY es siempre «antes», con [Pon tus fechas]: nunca pasa a «durante». Un viaje con varios destinos enseña el del día de hoy. El simulador de fecha vive ahora en el panel de pruebas (solo en local y vistas previas).
 */
export function HoyView({ route, onPonFechas }: { route: Route; onPonFechas: () => void }) {
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  const estado = getTodayTripStatus(route, simulada ?? undefined)
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  // El día de prueba (Tanda 10H) se apaga al salir de HOY.
  useEffect(() => () => fijarDiaDePrueba(false), [])
  fijarDiaDePrueba(false)
  // (Tanda 10N4 §1) Mientras no se sabe lo del pase, HOY no se pinta ni «con pase» ni «sin pase» (sin parpadeo).
  if (pase.sabido === false) return <div className="min-h-0 flex-1" data-hoy="cargando" />
  const completa = pagoActivo()
  // Sin el pase (Tanda 10C): la pestaña está, y enseña lo de antes del viaje y la invitación al pase.
  const fila = !completa
    ? filaDeHoySinPase({ fase: estado?.startIso ? (estado.phase ?? null) : null, hoyIso: simulada ?? todayIso(), inicioIso: estado?.startIso ?? null, prueba: pase.prueba ?? { estado: pase.pruebaGastada ? 'gastada' : 'pendiente' }, tripId, destino: route.destination })
    : null
  // El día de la prueba (de 00:00 a 23:59, hora del destino): HOY entero y, arriba, la franja. (Se enciende ANTES de pintar lo de dentro: todo lo de pago de HOY sale abierto ese día.)
  const diaDePrueba = fila?.tipo === 'hoy_es_prueba' && pase.puede
  if (diaDePrueba) fijarDiaDePrueba(true)
  if (!completa && !diaDePrueba) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-7 pt-1" data-hoy="sin-pase">
        <HoySinPase route={route} startIso={estado?.startIso ?? null} fase={estado?.phase ?? null} simulada={simulada} onPonFechas={onPonFechas} />
      </div>
    )
  }
  if (hoyV2Activo()) return <HoyV2 route={route} onPonFechas={onPonFechas} />

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-7 pt-1" data-hoy={estado?.phase ?? 'antes-sin-fechas'}>
      {!estado || estado.phase === 'before' ? (
        // (Tanda 10D: con el pase, lo mismo que sin él pero sin el candado «Pase de Roma» ni [Ver el Pase de Roma].)
        <HoyAntesDelDiseno route={route} startIso={estado?.startIso ?? null} simulada={simulada} pase={CON_PASE} onPonFechas={onPonFechas} />
      ) : estado.phase === 'during' ? (
        <>
          {diaDePrueba && fila ? <FranjaDiaDePrueba fila={fila} /> : null}
          <HoyDurante route={route} day={estado.context.day} dateIso={estado.context.dateIso} />
        </>
      ) : (
        <HoyDespues route={route} startIso={estado.startIso} />
      )}
    </div>
  )
}
