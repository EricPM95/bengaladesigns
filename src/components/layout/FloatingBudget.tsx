import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { subscribeBudgetFly } from '../../lib/budgetFlyBus'
import { useRouteStore } from '../../store/useRouteStore'
import { BudgetPanel } from '../budget/BudgetPanel'
import { Modal } from '../ui/Modal'

interface FlyEvent {
  id: number
  amount: number
}

/** "+123€" que aparece junto al icono y se desliza hacia arriba (hacia la bolsa) mientras se desvanece — confirmación visual breve (~1.3s) de que un coste se acaba de sumar al presupuesto, ver budgetFlyBus.ts. Puramente decorativo: no bloquea ni requiere interacción. */
function BudgetFlyBadges({ events }: { events: FlyEvent[] }) {
  return (
    <AnimatePresence>
      {events.map((event) => (
        <motion.span
          key={event.id}
          initial={{ opacity: 0, y: 4, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], y: -40, scale: [0.9, 1, 1, 0.7] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          className="pointer-events-none absolute -top-1 right-0 z-30 whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-caption font-bold text-white shadow-md"
        >
          +{event.amount.toLocaleString('es-ES')}€
        </motion.span>
      ))}
    </AnimatePresence>
  )
}

export function FloatingBudget() {
  const budget = useRouteStore((state) => state.route?.budget)
  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [flyEvents, setFlyEvents] = useState<FlyEvent[]>([])

  useEffect(
    () =>
      subscribeBudgetFly((amount) => {
        const id = Date.now() + Math.random()
        setFlyEvents((prev) => [...prev, { id, amount }])
        window.setTimeout(() => setFlyEvents((prev) => prev.filter((event) => event.id !== id)), 1300)
      }),
    [],
  )

  if (!budget) return null

  return (
    <>
      <div className="relative hidden shrink-0 items-center justify-between border-t border-border bg-bg-card px-6 py-3 md:flex">
        <span className="relative text-body font-semibold text-text">
          💰 {budget.total}€
          <BudgetFlyBadges events={flyEvents} />
        </span>
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
        <BudgetFlyBadges events={flyEvents} />
      </button>

      <Modal open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <BudgetPanel />
      </Modal>
    </>
  )
}
