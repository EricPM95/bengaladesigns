import { useState } from 'react'
import type { DidntMakeCutItem } from '../../lib/types'
import { addMinutesToTime } from '../../lib/time'
import { buildStopFromDidntMakeCut, buildStopFromQuery } from '../../lib/mockStopFactory'
import { useRouteStore } from '../../store/useRouteStore'
import { Button } from '../ui/Button'

interface AddStopButtonProps {
  dayId: string
  insertAfterTime: string
  suggestions: DidntMakeCutItem[]
}

export function AddStopButton({ dayId, insertAfterTime, suggestions }: AddStopButtonProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const addStop = useRouteStore((state) => state.addStop)
  const markDidntMakeCutAdded = useRouteStore((state) => state.markDidntMakeCutAdded)

  const newTime = addMinutesToTime(insertAfterTime, 15)
  const pendingSuggestions = suggestions.filter((item) => !item.added).slice(0, 2)

  const addFromSuggestion = (item: DidntMakeCutItem) => {
    addStop(dayId, buildStopFromDidntMakeCut(item, newTime))
    markDidntMakeCutAdded(dayId, item.id)
    setOpen(false)
  }

  const addFromQuery = () => {
    if (!query.trim()) return
    addStop(dayId, buildStopFromQuery(query.trim(), newTime))
    setQuery('')
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto block rounded-full px-3 py-1 text-caption font-medium text-text-muted opacity-60 transition-opacity hover:bg-bg-hover hover:opacity-100"
        >
          + Añadir una parada
        </button>
      </div>
    )
  }

  return (
    <div className="px-4">
      <div className="space-y-2 rounded-xl border border-border bg-bg-card p-3">
        {pendingSuggestions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => addFromSuggestion(item)}
            className="block w-full rounded-lg bg-bg-hover px-3 py-2 text-left text-small hover:bg-border"
          >
            <span className="block font-medium text-text">{item.name}</span>
            <span className="block text-text-soft">{item.suggestion}</span>
          </button>
        ))}
        <div className="flex gap-2">
          {/* Búsqueda libre por ahora. Aquí se conectará el autocompletado de Mapbox Geocoding. */}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca un lugar..."
            autoFocus
            autoComplete="off"
            className="flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-small text-text"
          />
          <Button onClick={addFromQuery} disabled={!query.trim()}>
            Añadir
          </Button>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-caption text-text-muted hover:text-text">
          Cancelar
        </button>
      </div>
    </div>
  )
}
