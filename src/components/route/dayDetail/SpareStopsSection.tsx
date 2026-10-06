import { useState } from 'react'
import type { Stop } from '../../../lib/types'
import { displayStopName, formatDuration } from '../../../lib/format'

interface SpareStopsSectionProps {
  stops: Stop[]
  onAdd: (stopId: string) => void
}

/**
 * «Si te sobra tiempo» (Tanda 6): lo que queda para si te da tiempo. Plegado al final del día y solo si hay algo; cada parada con su
 * motivo y un «Añadir» que la pasa al día (al final de su franja) y la saca de la lista.
 */
export function SpareStopsSection({ stops, onAdd }: SpareStopsSectionProps) {
  const [open, setOpen] = useState(false)
  if (stops.length === 0) return null
  return (
    <div className="mt-6 rounded-2xl border border-text/[.12] bg-bg-card">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="text-[14px] font-medium text-text">
          Si te sobra tiempo <span className="font-normal text-text/50">· {stops.length}</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 shrink-0 text-text/50 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul className="divide-y divide-text/[.08] border-t border-text/[.08]">
          {stops.map((stop) => (
            <li key={stop.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[16px] leading-[1.2] text-text [overflow-wrap:anywhere]">{displayStopName(stop.name)}</p>
                <p className="mt-0.5 text-[12px] leading-[1.35] text-text/60">
                  {formatDuration(stop.durationMinutes)}
                  {` · ${stop.spareReason ?? 'Para otro momento'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAdd(stop.id)}
                className="shrink-0 rounded-full border-[1.5px] border-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft"
              >
                Añadir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
