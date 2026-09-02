import type { TicketOption } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'

interface TourOptionsProps {
  ticketOptions: TicketOption[]
  contextLabel: string
}

export function TourOptions({ ticketOptions, contextLabel }: TourOptionsProps) {
  const budgetItems = useRouteStore((state) => state.route?.budget.items ?? [])
  const addBudgetItem = useRouteStore((state) => state.addBudgetItem)
  const removeBudgetItem = useRouteStore((state) => state.removeBudgetItem)

  return (
    <div className="space-y-1.5">
      {ticketOptions.map((option) => {
        const budgetId = `budget-${option.id}`
        const added = budgetItems.some((item) => item.id === budgetId)

        return (
          <div key={option.id} className="flex items-center justify-between gap-2 text-small">
            <span className="text-text-soft">
              {option.label} <span className="font-medium text-text">€{option.price}</span>
            </span>
            <div className="flex shrink-0 gap-1.5">
              {option.bookUrl && (
                <a
                  href={option.bookUrl}
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
                        icon: '🎟',
                        label: `${contextLabel} — ${option.label}`,
                        amount: option.price,
                        category: 'route',
                        sourceType: 'tour',
                        refId: option.id,
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
      })}
    </div>
  )
}
