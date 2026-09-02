import type { Excursion } from '../../lib/types'
import { formatReviewCount } from '../../lib/format'
import { useRouteStore } from '../../store/useRouteStore'

interface ExcursionSectionProps {
  excursions: Excursion[]
}

export function ExcursionSection({ excursions }: ExcursionSectionProps) {
  const budgetItems = useRouteStore((state) => state.route?.budget.items ?? [])
  const addBudgetItem = useRouteStore((state) => state.addBudgetItem)
  const removeBudgetItem = useRouteStore((state) => state.removeBudgetItem)

  const halfDay = excursions.filter((excursion) => excursion.length === 'half-day')
  const fullDay = excursions.filter((excursion) => excursion.length === 'full-day')

  const renderExcursion = (excursion: Excursion) => {
    const budgetId = `budget-${excursion.id}`
    const added = budgetItems.some((item) => item.id === budgetId)

    return (
      <div key={excursion.id} className="space-y-1.5 rounded-xl border border-border p-3">
        <p className="text-body font-medium text-text">{excursion.title}</p>
        <p className="text-small text-text-soft">
          {excursion.durationLabel} · €{excursion.price}
          {excursion.rating && ` · ★${excursion.rating} (${formatReviewCount(excursion.reviewCount ?? 0)})`}
        </p>
        <div className="flex gap-1.5 pt-1">
          {excursion.bookUrl && (
            <a
              href={excursion.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-bg-hover px-2.5 py-1 text-caption font-medium text-text transition-colors hover:bg-border"
            >
              🎟 Reservar
            </a>
          )}
          <button
            type="button"
            onClick={() =>
              added
                ? removeBudgetItem(budgetId)
                : addBudgetItem({
                    id: budgetId,
                    icon: '🚌',
                    label: excursion.title,
                    amount: excursion.price,
                    category: 'route',
                    sourceType: 'tour',
                    refId: excursion.id,
                  })
            }
            className={`rounded-lg px-2.5 py-1 text-caption font-medium transition-colors ${
              added ? 'bg-accent-soft text-accent-hover' : 'bg-bg-hover text-text hover:bg-border'
            }`}
          >
            {added ? '✓ Añadido' : '+ Presupuesto'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <p className="text-body font-medium text-text">🚌 La IA sugiere estas experiencias:</p>
      {halfDay.length > 0 && (
        <div>
          <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-muted">Medio día</p>
          <div className="space-y-2">{halfDay.map(renderExcursion)}</div>
        </div>
      )}
      {fullDay.length > 0 && (
        <div>
          <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-muted">Día completo</p>
          <div className="space-y-2">{fullDay.map(renderExcursion)}</div>
        </div>
      )}
    </div>
  )
}
