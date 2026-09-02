import { useState } from 'react'
import type { DidntMakeCutItem } from '../../lib/types'
import { buildStopFromDidntMakeCut } from '../../lib/mockStopFactory'
import { useRouteStore } from '../../store/useRouteStore'
import { ImpactBanner } from './ImpactBanner'

interface ExtrasPanelProps {
  dayId: string
  items: DidntMakeCutItem[]
  defaultTime: string
}

export function ExtrasPanel({ dayId, items, defaultTime }: ExtrasPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [impactMessage, setImpactMessage] = useState<string | null>(null)
  const addStop = useRouteStore((state) => state.addStop)
  const markDidntMakeCutAdded = useRouteStore((state) => state.markDidntMakeCutAdded)

  const pending = items.filter((item) => !item.added)
  if (pending.length === 0) return null

  const handleAdd = (item: DidntMakeCutItem) => {
    addStop(dayId, buildStopFromDidntMakeCut(item, defaultTime))
    markDidntMakeCutAdded(dayId, item.id)
    setImpactMessage(`Esto añade ${item.name} a tu día. ${item.suggestion}`)
    setTimeout(() => setImpactMessage(null), 4000)
  }

  return (
    <div className="px-4 py-4">
      <button type="button" onClick={() => setCollapsed((v) => !v)} className="flex w-full items-center justify-between text-body font-medium text-text">
        <span>📌 No entraron en la ruta</span>
        <span className="text-text-muted">{collapsed ? '▾' : '▴'}</span>
      </button>

      {!collapsed && (
        <div className="mt-3 space-y-3">
          {pending.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-3">
              <p className="text-body font-medium text-text">{item.name}</p>
              <p className="mt-0.5 text-small italic text-text-soft">"{item.reason}"</p>
              <p className="mt-0.5 text-small text-text-soft">→ {item.suggestion}</p>
              <button
                type="button"
                onClick={() => handleAdd(item)}
                className="mt-2 rounded-lg bg-accent-soft px-3 py-1.5 text-caption font-medium text-accent-hover hover:bg-border"
              >
                Añadir a la ruta
              </button>
            </div>
          ))}
        </div>
      )}

      <ImpactBanner message={impactMessage} />
    </div>
  )
}
