import type { BudgetItem as BudgetItemData } from '../../lib/types'

interface BudgetItemRowProps {
  item: BudgetItemData
  onRemove: () => void
}

export function BudgetItemRow({ item, onRemove }: BudgetItemRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 text-small">
      <span className="text-text">
        {item.icon} {item.label}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="font-medium text-text">€{item.amount}</span>
        <button type="button" onClick={onRemove} title="Remove" className="text-text-muted hover:text-accent-warm">
          ✕
        </button>
      </span>
    </div>
  )
}
