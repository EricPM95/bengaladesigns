import { useRouteStore } from '../../store/useRouteStore'
import { BudgetItemRow } from './BudgetItem'
import { AddExtraForm } from './AddExtraForm'

export function BudgetPanel() {
  const budget = useRouteStore((state) => state.route?.budget)
  const removeBudgetItem = useRouteStore((state) => state.removeBudgetItem)

  if (!budget) return null

  const routeItems = budget.items.filter((item) => item.category === 'route')
  const extraItems = budget.items.filter((item) => item.category === 'extra')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-h2 font-semibold text-text">💰 Presupuesto</p>
        <p className="text-h2 font-semibold text-text">€{budget.total}</p>
      </div>

      <div className="space-y-2">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">📍 Ruta</p>
        {routeItems.length === 0 && <p className="text-small text-text-muted">Todavía no hay gastos de ruta</p>}
        {routeItems.map((item) => (
          <BudgetItemRow key={item.id} item={item} onRemove={() => removeBudgetItem(item.id)} />
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">➕ Extras</p>
        {extraItems.map((item) => (
          <BudgetItemRow key={item.id} item={item} onRemove={() => removeBudgetItem(item.id)} />
        ))}
        <AddExtraForm />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-body font-semibold text-text">TOTAL</span>
        <span className="text-body font-semibold text-text">€{budget.total}</span>
      </div>
    </div>
  )
}
