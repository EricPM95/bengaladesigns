import type { Stop } from '../../lib/types'

interface MapPlaceholderProps {
  destination: string
  stops: Stop[]
  activeStopId?: string | null
  onSelectStop?: (stopId: string) => void
}

const PAD = 16

function projectStops(stops: Stop[]) {
  if (stops.length === 0) return []
  const lats = stops.map((s) => s.coordinates.lat)
  const lngs = stops.map((s) => s.coordinates.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latRange = maxLat - minLat || 0.01
  const lngRange = maxLng - minLng || 0.01
  const span = 100 - PAD * 2

  return stops.map((stop) => ({
    stop,
    x: PAD + ((stop.coordinates.lng - minLng) / lngRange) * span,
    y: 100 - PAD - ((stop.coordinates.lat - minLat) / latRange) * span,
  }))
}

export function MapPlaceholder({ destination, stops, activeStopId, onSelectStop }: MapPlaceholderProps) {
  const points = projectStops(stops)
  const bgSeed = destination.toLowerCase().replace(/\s+/g, '-')

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(https://picsum.photos/seed/${bgSeed}-map/900/900)` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg bg-black/40 px-4 py-2 text-small text-white/80 backdrop-blur-sm">{destination}</p>
        </div>
      )}

      {points.length > 1 && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#2DD4BF"
            strokeWidth="0.6"
            strokeDasharray="2 1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {points.map(({ stop, x, y }, index) => (
        <button
          key={stop.id}
          type="button"
          title={stop.name}
          onClick={() => onSelectStop?.(stop.id)}
          style={{ left: `${x}%`, top: `${y}%` }}
          className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-caption font-semibold text-white shadow-md transition-transform hover:scale-110 ${
            activeStopId === stop.id ? 'bg-accent-warm ring-2 ring-white' : 'bg-accent'
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  )
}
