import type { DayPlan } from '../../../lib/types'

/**
 * Tarjeta de descanso (Tanda 6b): entre la última parada de la tarde y la cena. Sin foto, tono suave, icono lineal fino.
 * El texto llega ya montado del servidor.
 */
export function RestCard({ card, children }: { card: NonNullable<DayPlan['restCard']>; children?: React.ReactNode }) {
  return (
    <div className="mx-0 my-3 flex items-start gap-3 rounded-2xl bg-bg-hover px-4 py-3.5">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-text/50" aria-hidden="true">
        <path d="M17 8h1a3 3 0 0 1 0 6h-1M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zM8 3v2M12 3v2" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[16px] leading-[1.2] text-text">{card.title}</p>
        <p className="mt-1 text-[13px] leading-[1.45] text-text/65">{card.text}</p>
        {children}
      </div>
    </div>
  )
}
