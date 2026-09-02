import type { RouteMode } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'

const BASE_MODES: { id: RouteMode; label: string }[] = [
  { id: 'route', label: 'Ruta' },
  { id: 'days', label: 'Días' },
  { id: 'explore', label: 'Explorar' },
  { id: 'bookings', label: 'Reservas' },
]

interface ModeSwitcherProps {
  /** true cuando la fecha real de hoy cae dentro del viaje — antepone la pestaña "Hoy" (ver getTodayTripContext). */
  showToday: boolean
}

export function ModeSwitcher({ showToday }: ModeSwitcherProps) {
  const mode = useRouteStore((state) => state.mode)
  const setMode = useRouteStore((state) => state.setMode)
  const modes = showToday ? [{ id: 'today' as const, label: 'Hoy' }, ...BASE_MODES] : BASE_MODES

  return (
    <div className="flex items-center border-b border-border bg-bg-card px-2">
      {modes.map((item) => {
        const active = mode === item.id

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`flex-1 border-b-2 px-2 py-3 text-small font-medium transition-colors ${
              active ? 'border-accent text-accent' : 'border-transparent text-text-soft hover:text-text'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
