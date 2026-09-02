import { useState } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { BudgetPanel } from '../budget/BudgetPanel'
import { Modal } from '../ui/Modal'

export function FloatingBudget() {
  const budget = useRouteStore((state) => state.route?.budget)
  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!budget) return null

  return (
    <>
      <div className="relative hidden shrink-0 items-center justify-between border-t border-border bg-bg-card px-6 py-3 md:flex">
        <span className="text-body font-semibold text-text">💰 {budget.total}€</span>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-small font-medium text-accent hover:text-accent-hover">
          Ver presupuesto {expanded ? '▼' : '▲'}
        </button>

        {expanded && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setExpanded(false)} />
            <div className="absolute bottom-full right-6 z-30 mb-2 max-h-[70vh] w-96 overflow-y-auto rounded-2xl border border-border bg-bg-card p-5 shadow-md">
              <BudgetPanel />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        title={`Ver presupuesto (${budget.total}€)`}
        className="fixed bottom-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-xl shadow-md md:hidden"
      >
        💰
      </button>

      <Modal open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <BudgetPanel />
      </Modal>
    </>
  )
}
