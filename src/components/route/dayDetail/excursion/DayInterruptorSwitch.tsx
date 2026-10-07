import type { ReactNode } from 'react'

/**
 * El interruptor [Roma | Excursión] del día 4 (Tanda 6g, diseño «2a · Interruptor»).
 * Va en la tarjeta del día, debajo del título, y se ve aunque la tarjeta esté plegada: por eso el clic no sube a la tarjeta.
 * El elegido va en blanco con sombra; en «Excursión» lleva un circulito con la foto de la excursión elegida (o su color).
 */
interface DayInterruptorSwitchProps {
  mode: 'roma' | 'excursion'
  onChange: (target: 'roma' | 'excursion') => void
  excursionColor?: string | null
  excursionPhotoUrl?: string | null
  busy?: boolean
}

/** Icono de casa, trazo fino y sin relleno. */
function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px] shrink-0" aria-hidden="true">
      <path d="M3 11l9-7 9 7M5 10v10h14V10" />
    </svg>
  )
}

export function DayInterruptorSwitch({ mode, onChange, excursionColor, excursionPhotoUrl, busy = false }: DayInterruptorSwitchProps) {
  const option = (target: 'roma' | 'excursion', label: string, lead: ReactNode) => {
    const active = mode === target
    return (
      <button
        type="button"
        aria-pressed={active}
        disabled={busy}
        onClick={() => {
          if (!active) onChange(target)
        }}
        className={`flex min-h-[44px] flex-1 items-center justify-center gap-[7px] rounded-full text-[13.5px] font-semibold transition-colors disabled:cursor-wait ${
          active ? 'bg-bg-card text-text shadow-[0_1px_3px_rgba(28,34,48,.18)]' : 'bg-transparent text-text/60'
        }`}
      >
        {lead}
        {label}
      </button>
    )
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1.5">
      <div role="group" aria-label="Qué hacer este día" aria-busy={busy} className={`flex gap-1 rounded-full bg-bg-hover p-1 ${busy ? 'opacity-70' : ''}`}>
        {option('roma', 'Roma', <HouseIcon />)}
        {option(
          'excursion',
          'Excursión',
          <span
            aria-hidden="true"
            className="relative block h-4 w-4 shrink-0 overflow-hidden rounded-full bg-accent-soft"
            style={excursionColor ? { backgroundColor: excursionColor } : undefined}
          >
            {excursionPhotoUrl && <img src={excursionPhotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          </span>,
        )}
      </div>
      {busy && (
        <span role="status" className="px-2 font-mono text-[10.5px] uppercase tracking-[.12em] text-text/60">
          Preparando el día…
        </span>
      )}
    </div>
  )
}
