import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'

interface ContextBannerProps {
  route: Route
}

/**
 * Banner de contexto (decisión del 2026-09-26): uno solo, encima del Día 1, que explica por qué la ruta
 * es como es (invierno, pocos días, ritmo tranquilo). El texto lo elige y rellena el motor a partir de
 * las plantillas del JSON del destino; aquí solo se pinta. Se cierra con la X y no vuelve a salir en ese
 * viaje: la marca va en la ruta (`contextBannerDismissed`), no en el estado del componente.
 */
export function ContextBanner({ route }: ContextBannerProps) {
  const dismissContextBanner = useRouteStore((state) => state.dismissContextBanner)
  if (!route.contextBanner || route.contextBannerDismissed) return null
  return (
    <div className="relative rounded-2xl border border-border bg-bg-card px-4 py-3 pr-9">
      <button
        type="button"
        onClick={dismissContextBanner}
        aria-label="Cerrar aviso"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover"
      >
        ×
      </button>
      <p className="text-small leading-relaxed text-text-soft">{route.contextBanner}</p>
    </div>
  )
}
