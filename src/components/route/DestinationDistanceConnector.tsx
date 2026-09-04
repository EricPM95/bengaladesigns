import { useEffect, useState } from 'react'
import type { Coordinates } from '../../lib/types'
import { getRoutedDistance } from '../../lib/mapboxDirections'

interface DestinationDistanceConnectorProps {
  from: Coordinates | null
  to: Coordinates | null
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

/**
 * Línea gris discreta entre dos destinos consecutivos de la lista de RUTA, con un chip de
 * distancia (km reales, vía Mapbox Directions) centrado encima — puramente visual por ahora, sin
 * acción al pulsarlo (pedido explícito). Usa el centroide de paradas de cada tramo
 * (`segmentCentroid`, mismo punto que ya usan los pines del mapa multi-destino) — si algún tramo
 * todavía no tiene paradas, `from`/`to` llega null y el conector simplemente no se muestra (no hay
 * coordenada real de la que partir, mejor omitirlo que inventar una distancia).
 */
export function DestinationDistanceConnector({ from, to }: DestinationDistanceConnectorProps) {
  const [km, setKm] = useState<number | null>(null)

  useEffect(() => {
    setKm(null)
    if (!from || !to) return
    let cancelled = false
    getRoutedDistance('driving', from, to).then((result) => {
      if (!cancelled && result) setKm(Math.round(result.meters / 1000))
    })
    return () => {
      cancelled = true
    }
  }, [from?.lat, from?.lng, to?.lat, to?.lng])

  if (km === null) return null

  return (
    <div className="relative flex h-9 items-center justify-center">
      <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-border" />
      <span className="relative z-10 flex items-center gap-1 rounded-full border border-border bg-bg-card px-2.5 py-1 text-caption font-medium text-text-soft">
        <SearchIcon />
        {km} km
      </span>
    </div>
  )
}
