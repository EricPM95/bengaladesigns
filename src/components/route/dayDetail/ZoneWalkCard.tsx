import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { formatDuration } from '../../../lib/format'

/**
 * Prompt 6 — la tarjeta de un paseo por barrio. Se parece a una parada pero tiene que leerse como
 * otra cosa: es una SUGERENCIA para un hueco, no una visita que el viaje incluya.
 *
 * Por eso el borde va punteado y el círculo lleva un icono en vez de número — el paseo no ocupa
 * posición en la ruta, va entre medias. No abre ficha ampliada (no hay nada que enseñar: el barrio
 * entero no es un lugar) y sí tiene botón de quitar, porque el algoritmo propone y el viajero
 * dispone: obligar a añadir otra cosa para deshacerse de una sugerencia es fricción.
 */
export function ZoneWalkCard({ stop, startTime, onDismiss }: { stop: MockStopDetail; startTime?: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-bg-hover/40 p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-card text-text-muted" aria-hidden="true">
        <WalkIcon />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {startTime && <span className="shrink-0 text-caption text-text-muted">{startTime}</span>}
          <p className="min-w-0 flex-1 text-small font-semibold italic text-text-soft">{stop.name}</p>
        </div>
        <p className="mt-0.5 text-caption text-text-muted">~{formatDuration(stop.durationMinutes)} · sugerencia para este hueco</p>
        {stop.tips?.[0] && <p className="mt-1.5 line-clamp-2 text-caption leading-relaxed text-text-soft">{stop.tips[0]}</p>}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Quitar este paseo"
        title="Quitar este paseo"
        className="shrink-0 rounded-lg px-1.5 py-0.5 text-caption text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
      >
        ✕
      </button>
    </div>
  )
}

/** Trazo fino y gris, sin relleno — regla de iconos funcionales del proyecto. */
function WalkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="13" cy="4" r="1.6" />
      <path d="M11 21l1.5-5-2.5-2.5L11 9l3 1.5 2.5 1" />
      <path d="M10 13.5L7.5 21M14 10.5L12 8" />
    </svg>
  )
}
