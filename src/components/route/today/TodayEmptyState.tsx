import { formatShortDateEs } from '../../../lib/dateRange'
import { useRouteStore } from '../../../store/useRouteStore'
import { Button } from '../../ui/Button'

interface TodayEmptyStateProps {
  phase: 'before' | 'after'
  startIso: string
}

/**
 * Estado vacío de Modo Hoy cuando la fecha actual (o simulada) no cae dentro del viaje — nunca se
 * muestra junto al contenido de parada actual/check-in, solo en su lugar. "before": puramente
 * informativo, sin ningún botón. "after": con enlace a la pestaña RUTA para revisar el itinerario.
 */
export function TodayEmptyState({ phase, startIso }: TodayEmptyStateProps) {
  const setMode = useRouteStore((state) => state.setMode)

  return (
    <div className="mx-4 flex flex-col items-center gap-3 rounded-2xl border border-border bg-bg-card p-8 text-center">
      <span className="text-4xl" aria-hidden="true">
        {phase === 'before' ? '🧳' : '📅'}
      </span>

      {phase === 'before' ? (
        <p className="text-body text-text-soft">Vuelve aquí a partir del {formatShortDateEs(startIso)} para ver tu día en directo.</p>
      ) : (
        <>
          <p className="text-body text-text-soft">Este viaje ya terminó — puedes revisar tu ruta completa en la pestaña Ruta.</p>
          <Button onClick={() => setMode('route')}>Ver mi ruta</Button>
        </>
      )}
    </div>
  )
}
