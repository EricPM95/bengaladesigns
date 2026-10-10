import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { getTodayTripStatus } from '../../../lib/todayMode'
import { pagoActivo } from '../../../lib/pago'
import { HoyAntes } from './HoyAntes'
import { HoyDurante } from './HoyDurante'
import { HoyDespues } from './HoyDespues'

/**
 * La pestaña HOY (Tanda 6z3 y 6z6): SOLO de pago (en la gratis la pestaña no está; ver src/lib/barra.ts). Lo de dentro cambia según el momento del viaje —antes, durante o después (el día siguiente al último)— y la barra no cambia.
 * Sin fechas (solo el mes), HOY es siempre «antes», con [Pon tus fechas]: nunca pasa a «durante». Un viaje con varios destinos enseña el del día de hoy. El simulador de fecha vive ahora en el panel de pruebas (solo en local y vistas previas).
 */
export function HoyView({ route, onPonFechas }: { route: Route; onPonFechas: () => void }) {
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  const estado = getTodayTripStatus(route, simulada ?? undefined)
  if (!pagoActivo()) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-7 pt-1" data-hoy={estado?.phase ?? 'antes-sin-fechas'}>
      {!estado || estado.phase === 'before' ? (
        <HoyAntes route={route} startIso={estado?.startIso ?? null} onPonFechas={onPonFechas} />
      ) : estado.phase === 'during' ? (
        <HoyDurante route={route} day={estado.context.day} dateIso={estado.context.dateIso} />
      ) : (
        <HoyDespues route={route} startIso={estado.startIso} />
      )}
    </div>
  )
}
