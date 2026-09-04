import type { RouteMode } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { useTripReadiness } from '../../hooks/useTripReadiness'
import { hasUnresolvedYellowItems } from '../../lib/readiness'

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

/** (!) ámbar junto a "Reservas" — visible mientras quede algún ítem de alta prioridad (transporte, alojamiento/camper, o vehículo altamente recomendado) sin añadir en cualquier destino; el Seguro de viaje no cuenta (ver readiness.ts). */
function AlertDot() {
  return (
    <span
      aria-label="Quedan reservas importantes pendientes"
      title="Quedan reservas importantes pendientes"
      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-gold text-[10px] font-bold leading-none text-white"
    >
      !
    </span>
  )
}

export function ModeSwitcher({ showToday }: ModeSwitcherProps) {
  const mode = useRouteStore((state) => state.mode)
  const setMode = useRouteStore((state) => state.setMode)
  const readiness = useTripReadiness()
  const showBookingsAlert = readiness ? hasUnresolvedYellowItems(readiness.items) : false
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
            className={`flex flex-1 items-center justify-center gap-0.5 border-b-2 px-2 py-3 text-small font-medium transition-colors ${
              active ? 'border-accent text-accent' : 'border-transparent text-text-soft hover:text-text'
            }`}
          >
            {item.label}
            {item.id === 'bookings' && showBookingsAlert && <AlertDot />}
          </button>
        )
      })}
    </div>
  )
}
