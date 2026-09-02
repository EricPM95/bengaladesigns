interface FreeTimeBannerProps {
  minutes: number
  onAddNearby: () => void
}

/** "Vas bien de tiempo" — banner pasivo de Modo Hoy, activo siempre que hay margen libre suficiente antes de la siguiente parada (sin necesidad de check-in). */
export function FreeTimeBanner({ minutes, onAddNearby }: FreeTimeBannerProps) {
  return (
    <button
      type="button"
      onClick={onAddNearby}
      className="flex w-full items-center justify-between gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-left text-small font-medium text-accent-hover transition-colors hover:bg-border"
    >
      <span>Vas {minutes} min bien de tiempo</span>
      <span className="shrink-0">Añadir algo cerca de aquí →</span>
    </button>
  )
}
