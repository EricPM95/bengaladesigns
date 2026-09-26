import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { formatDuration } from '../../../lib/format'
import { KIND_ICON } from '../../../lib/stopKind'
import { TrazoCard } from './TrazoCards'

/**
 * Prompt 6 — la tarjeta de un paseo por barrio. Se parece a una parada pero tiene que leerse como
 * otra cosa: es una SUGERENCIA para un hueco, no una visita que el viaje incluya.
 *
 * Por eso el borde va punteado y no lleva número — el paseo no ocupa posición en la ruta ni tiene pin,
 * va entre medias. No abre ficha ampliada (no hay nada que enseñar: el barrio entero no es un lugar) y
 * sí tiene botón de quitar, porque el algoritmo propone y el viajero dispone.
 */
export function ZoneWalkCard({ stop, startTime, onDismiss }: { stop: MockStopDetail; startTime?: string; onDismiss: () => void }) {
  return (
    <TrazoCard
      kind="monumento"
      iconPath={KIND_ICON.walk}
      dashed
      time={startTime ?? null}
      name={stop.name}
      sub={stop.tips?.[0] ?? null}
      meta={[{ icon: 'hour', text: `~${formatDuration(stop.durationMinutes)} · sugerencia para este hueco` }]}
      noPhoto
      menu={
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Quitar este paseo"
          title="Quitar este paseo"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-[12px] text-text/60 hover:bg-bg-hover"
        >
          ✕
        </button>
      }
    />
  )
}
