import type { RouteMode } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { useTripReadiness } from '../../hooks/useTripReadiness'
import { hasUnresolvedYellowItems } from '../../lib/readiness'

const BASE_MODES: { id: RouteMode; label: string }[] = [
  { id: 'route', label: 'Ruta' },
  { id: 'days', label: 'Días' },
  { id: 'explore', label: 'Explorar' },
  // (Reservas pasa a la barra de abajo, con su «!»: PROMPT_UI_REPASO_2 1.)
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
      className="flex h-[17px] w-[17px] items-center justify-center rounded-full bg-accent-gold text-[11px] font-bold leading-none text-white"
    >
      !
    </span>
  )
}

export function ModeSwitcher({ showToday }: ModeSwitcherProps) {
  const mode = useRouteStore((state) => state.mode)
  const setMode = useRouteStore((state) => state.setMode)
  const setActiveDayId = useRouteStore((state) => state.setActiveDayId)
  const readiness = useTripReadiness()
  const showBookingsAlert = readiness ? hasUnresolvedYellowItems(readiness.items) : false
  const modes = showToday ? [{ id: 'today' as const, label: 'Hoy' }, ...BASE_MODES] : BASE_MODES

  return (
    <nav className="grid shrink-0 border-b border-text/[.09] px-2" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}>
      {modes.map((item) => {
        const active = mode === item.id

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              // Al volver a Días desde otra pestaña, los días se ven siempre cerrados (la lista), nunca el que se había abierto.
              if (item.id === 'days' && mode !== 'days') setActiveDayId(null)
              setMode(item.id)
            }}
            className={`relative flex h-[46px] items-center justify-center gap-1.5 text-[15px] transition-colors ${active ? 'font-semibold text-text' : 'font-normal text-text/55 hover:text-text'}`}
          >
            {item.label}
            {item.id === 'bookings' && showBookingsAlert && <AlertDot />}
            {/* Subrayado terracota que crece desde el centro (diseño "Trazo Itinerario"). */}
            <span
              aria-hidden="true"
              className="absolute bottom-[-1px] left-[14%] right-[14%] h-[2.5px] rounded-full bg-accent transition-transform duration-300"
              style={{ transform: active ? 'scaleX(1)' : 'scaleX(0)', transitionTimingFunction: 'cubic-bezier(.2,.8,.2,1)' }}
            />
          </button>
        )
      })}
    </nav>
  )
}
