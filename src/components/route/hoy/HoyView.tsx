import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { getTodayTripStatus } from '../../../lib/todayMode'
import { todayIso } from '../../../lib/dateRange'
import { DevDateSimulator } from '../today/DevDateSimulator'
import { HoyAntes } from './HoyAntes'
import { HoyDurante } from './HoyDurante'
import { HoyDespues } from './HoyDespues'

/**
 * La pestaña HOY (Tanda 6z3, diseño «Hoy, según el momento»): sale siempre, con y sin fechas. Lo de dentro cambia según el momento del viaje —antes, durante o después (el día siguiente al último)— y la barra no cambia.
 * Sin fechas (solo el mes), HOY es siempre «antes», con [Pon tus fechas]: nunca pasa a «durante». Un viaje con varios destinos enseña el del día de hoy. En desarrollo, `DevDateSimulator` simula qué día es hoy.
 */
export function HoyView({ route, onPonFechas }: { route: Route; onPonFechas: () => void }) {
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  const setSimulada = useRouteStore((state) => state.setDevSimulatedTodayIso)
  const estado = getTodayTripStatus(route, simulada ?? undefined)
  const hoyIso = simulada ?? todayIso()
  const simulador = import.meta.env.DEV && <DevDateSimulator value={simulada} onChange={setSimulada} />

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-7 pt-1" data-hoy={estado?.phase ?? 'antes-sin-fechas'}>
      {simulador}
      {!estado || estado.phase === 'before' ? (
        <HoyAntes route={route} startIso={estado?.startIso ?? null} hoyIso={hoyIso} onPonFechas={onPonFechas} />
      ) : estado.phase === 'during' ? (
        <HoyDurante route={route} day={estado.context.day} dateIso={estado.context.dateIso} />
      ) : (
        <HoyDespues route={route} startIso={estado.startIso} />
      )}
    </div>
  )
}
