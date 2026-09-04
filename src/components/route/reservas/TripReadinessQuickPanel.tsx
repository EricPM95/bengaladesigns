import type { ReadinessItem } from '../../../lib/readiness'
import type { Route } from '../../../lib/types'
import { pickUrgentPendingItems, readinessStateColor } from '../../../lib/readiness'
import { useRouteStore } from '../../../store/useRouteStore'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { ReadinessBreakdownRow } from './ReadinessBreakdownRow'

interface TripReadinessQuickPanelProps {
  open: boolean
  onClose: () => void
  percent: number
  items: ReadinessItem[]
  route: Route
}

const STATE_TEXT_CLASSES = {
  red: 'text-accent-red',
  orange: 'text-accent-gold',
  green: 'text-accent-hover',
}

const STATE_BAR_CLASSES = {
  red: 'bg-accent-red',
  orange: 'bg-accent-gold',
  green: 'bg-accent',
}

const URGENT_ITEMS_LIMIT = 3

/**
 * Panel rápido que abre el indicador de % en la cabecera — resumen, NO la lista completa (esa
 * lista vive únicamente en la pestaña RESERVAS, ver ReservasPanel.tsx/DestinationReservasAccordion.tsx,
 * para no duplicar contenido). Muestra el % en grande, cuántos ítems
 * quedan pendientes, los 2-3 más urgentes (mismas filas interactivas rojo/verde de siempre, vía
 * ReadinessBreakdownRow) y un único CTA que lleva a RESERVAS.
 */
export function TripReadinessQuickPanel({ open, onClose, percent, items, route }: TripReadinessQuickPanelProps) {
  const setMode = useRouteStore((state) => state.setMode)

  const pendingCount = items.filter((item) => !item.resolved).length
  const urgentItems = pickUrgentPendingItems(route, items, URGENT_ITEMS_LIMIT)
  const stateColor = readinessStateColor(percent)
  const stateClass = STATE_TEXT_CLASSES[stateColor]
  const barClass = STATE_BAR_CLASSES[stateColor]

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-center">
          <p className={`font-display text-hero font-bold leading-none ${stateClass}`}>{percent}%</p>
          <p className="mt-2 text-body font-medium text-text">
            {pendingCount === 0 ? '¡Todo listo!' : `Te faltan ${pendingCount} cosa${pendingCount === 1 ? '' : 's'} por reservar`}
          </p>
          <div className="mx-auto mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
            <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${percent}%` }} />
          </div>
        </div>

        {urgentItems.length > 0 && (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
            {urgentItems.map((item) => (
              <ReadinessBreakdownRow key={item.id} item={item} route={route} />
            ))}
          </div>
        )}

        <Button
          onClick={() => {
            setMode('bookings')
            onClose()
          }}
          className="w-full font-bold shadow-sm"
        >
          Ver todo en Reservas
        </Button>
      </div>
    </Modal>
  )
}
