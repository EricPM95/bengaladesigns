import type { DayPlan, Stop } from '../../lib/types'
import { dayColorPastel, dayColorStrong } from '../../lib/dayColors'

interface AllDaysMapPlaceholderProps {
  destination: string
  days: DayPlan[]
  /** null = muestra las paradas de todos los días; con valor, aísla solo las de ese día (ver CombinedDaysMapView.tsx). */
  selectedDayId: string | null
}

const PAD = 16

interface ProjectedStop {
  stop: Stop
  dayId: string
  dayIndex: number
  x: number
  y: number
}

/** Misma proyección simple que MapPlaceholder.tsx, pero sobre las paradas de TODOS los días a la vez — el encuadre no cambia al filtrar por día, solo qué pines se muestran, para que no "salte" el mapa al tocar un chip. */
function projectAllDays(days: DayPlan[]): ProjectedStop[] {
  const entries = days.flatMap((day, dayIndex) => day.stops.map((stop) => ({ stop, dayId: day.id, dayIndex })))
  if (entries.length === 0) return []

  const lats = entries.map((entry) => entry.stop.coordinates.lat)
  const lngs = entries.map((entry) => entry.stop.coordinates.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latRange = maxLat - minLat || 0.01
  const lngRange = maxLng - minLng || 0.01
  const span = 100 - PAD * 2

  return entries.map((entry) => ({
    ...entry,
    x: PAD + ((entry.stop.coordinates.lng - minLng) / lngRange) * span,
    y: 100 - PAD - ((entry.stop.coordinates.lat - minLat) / latRange) * span,
  }))
}

/** Variante de MapPlaceholder.tsx para el mapa combinado — un pin por parada de TODOS los días, coloreado según `dayColorPastel(dayIndex)`/`dayColorStrong(dayIndex)` (mismo par pastel-fondo + oscuro-número que el círculo de cada parada en DIAS, ver StopAccordion.tsx), opcionalmente aislado a un solo día. */
export function AllDaysMapPlaceholder({ destination, days, selectedDayId }: AllDaysMapPlaceholderProps) {
  const allPoints = projectAllDays(days)
  const visiblePoints = selectedDayId ? allPoints.filter((point) => point.dayId === selectedDayId) : allPoints
  const bgSeed = destination.toLowerCase().replace(/\s+/g, '-')

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(https://picsum.photos/seed/${bgSeed}-map/900/900)` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      {allPoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg bg-black/40 px-4 py-2 text-small text-white/80 backdrop-blur-sm">{destination}</p>
        </div>
      )}

      {visiblePoints.map(({ stop, dayIndex, x, y }) => (
        <span
          key={stop.id}
          title={`Día ${dayIndex + 1} · ${stop.name}`}
          style={{ left: `${x}%`, top: `${y}%`, backgroundColor: dayColorPastel(dayIndex), color: dayColorStrong(dayIndex) }}
          className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-caption font-semibold shadow-md ring-2 ring-white/80"
        >
          {dayIndex + 1}
        </span>
      ))}
    </div>
  )
}
