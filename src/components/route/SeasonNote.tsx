import type { Route, Season } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { INK, INK2, SEASON_FX } from '../trazo/trazoUi'

/** La época del motor (`invierno`, `primavera`, `verano`, `otono`) → la del efecto visual del formulario. */
const FX_OF: Record<string, Season> = { invierno: 'winter', primavera: 'spring', verano: 'summer', otono: 'autumn' }

/**
 * Nota de temporada (decisión del usuario, 2026-09-28): no es un aviso de cuidado, cuenta que la ruta está pensada
 * para su época. Una vez, arriba de la ruta (encima del Día 1), con el mismo efecto de temporada que el formulario
 * (SEASON_FX: el degradado de la época) y se cierra con la X; la marca va en la ruta. No es ventana emergente.
 */
export function SeasonNote({ route }: { route: Route }) {
  const dismissSeasonNote = useRouteStore((state) => state.dismissSeasonNote)
  const note = route.seasonNote
  if (!note || route.seasonNoteDismissed) return null
  const fx = SEASON_FX[FX_OF[note.season] ?? 'spring']
  return (
    <div className="relative overflow-hidden rounded-2xl px-4 py-3.5 pr-10 shadow-[0_10px_28px_-14px_rgba(28,34,48,.45)]" style={{ background: fx.gradient }}>
      <button
        type="button"
        onClick={dismissSeasonNote}
        aria-label="Cerrar nota de temporada"
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[16px] hover:bg-white/10"
        style={{ color: INK2 }}
      >
        ×
      </button>
      <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em]" style={{ color: INK2 }}>
        {fx.name}
      </p>
      <p className="mt-1 text-small leading-relaxed" style={{ color: INK }}>
        {note.text}
      </p>
    </div>
  )
}
