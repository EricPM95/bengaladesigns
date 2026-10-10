import { useRouteStore } from '../../store/useRouteStore'
import { useTripReadiness } from '../../hooks/useTripReadiness'
import { hasUnresolvedYellowItems } from '../../lib/readiness'
import type { RouteMode } from '../../lib/types'
import { hayPestanaHoy, modoVisible } from '../../lib/barra'
import type { NombreIcono } from '../../lib/iconos'
import { Icono } from '../ui/Icono'

/** Todas las pestañas, en este orden. Cuáles salen lo decide la versión (src/lib/barra.ts): la gratis no lleva Hoy; la de pago, las cinco. Nunca cambian con el momento del viaje (Tanda 6z3 y 6z6). */
export const PESTANAS: { id: RouteMode; nombre: string; icono: NombreIcono }[] = [
  { id: 'today', nombre: 'Hoy', icono: 'hoy' },
  { id: 'route', nombre: 'Ruta', icono: 'ruta' },
  { id: 'days', nombre: 'Días', icono: 'dias' },
  { id: 'explore', nombre: 'Explorar', icono: 'explorar' },
  { id: 'bookings', nombre: 'Reservas', icono: 'reservas' },
]

/**
 * La barra de abajo (Tanda 6z3, diseño «La barra de abajo»): fija al borde, a todo el ancho, y respeta la zona de abajo del iPhone. Cuatro pestañas en la gratis y cinco en la de pago, con su icono y su nombre debajo; la activa, en una píldora clara.
 * Reservas lleva su «!» mientras falte algo. Nunca cambia ni se esconde según el momento del viaje. Sustituye a la barra de antes (Presupuesto · Perfil · Reservas) y a las pestañas de arriba.
 */
export function BottomBar() {
  const mode = modoVisible(useRouteStore((state) => state.mode))
  const pestanas = PESTANAS.filter((pestana) => pestana.id !== 'today' || hayPestanaHoy())
  const setMode = useRouteStore((state) => state.setMode)
  const setActiveDayId = useRouteStore((state) => state.setActiveDayId)
  const readiness = useTripReadiness()
  const reservasAlert = readiness ? hasUnresolvedYellowItems(readiness.items) : false

  return (
    <nav aria-label="Barra del viaje" className="relative z-30 grid w-full shrink-0 px-1.5 pt-2" style={{ gridTemplateColumns: `repeat(${pestanas.length}, minmax(0, 1fr))`, background: '#1C2230', paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
      {pestanas.map((pestana) => {
        const activa = mode === pestana.id
        const alerta = pestana.id === 'bookings' && reservasAlert
        return (
          <button
            key={pestana.id}
            type="button"
            aria-current={activa ? 'page' : undefined}
            aria-label={alerta ? 'Reservas (falta algo por reservar)' : pestana.nombre}
            onClick={() => {
              // Al volver a Días desde otra pestaña, los días se ven siempre cerrados (la lista), nunca el que se había abierto.
              if (pestana.id === 'days' && mode !== 'days') setActiveDayId(null)
              setMode(pestana.id)
            }}
            className="relative flex h-14 flex-col items-center justify-center gap-1"
            style={{ color: activa ? '#FFFDF8' : 'rgba(255,253,248,.62)' }}
          >
            <span className="flex h-[30px] w-[52px] items-center justify-center rounded-full transition-colors duration-300" style={{ background: activa ? '#FFFDF8' : 'transparent', color: activa ? '#1C2230' : 'rgba(255,253,248,.62)' }}>
              <Icono nombre={pestana.icono} size={22} />
            </span>
            <span className="text-[11px]" style={{ fontWeight: activa ? 600 : 500 }}>
              {pestana.nombre}
            </span>
            {alerta && (
              <span className="absolute right-[calc(50%-26px)] top-0.5 h-4 w-4 rounded-full text-center text-[10px] font-bold leading-4 text-[#1C2230]" style={{ background: 'oklch(0.8 0.14 75)', boxShadow: '0 0 0 2px #1C2230' }} aria-hidden="true">
                !
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
