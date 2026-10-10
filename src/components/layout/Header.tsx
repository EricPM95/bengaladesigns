import { useState } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { usePresupuestoUi } from '../../store/usePresupuestoUi'
import { useAppNotices } from '../../hooks/useAppNotices'
import { subtituloDelViaje } from '../../lib/resumenViaje'
import { Icono } from '../ui/Icono'
import { NoticesSheet } from './NoticesSheet'
import { PerfilSheet } from './PerfilSheet'
import { usePerfilUi } from '../../store/usePerfilUi'

/** Botón redondo de la cabecera (diseño «La cabecera»): 44 px de toque, sin fondo, la tinta de siempre. */
const BOTON = 'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:bg-text/[.06]'

interface HeaderProps {
  /** Los tips del viaje: antes la bombilla de la cabecera, ahora dentro del Perfil. */
  onTips: () => void
  /** El aviso «más días que fechas» abre el calendario de fechas. */
  onOpenDates: () => void
}

/**
 * La cabecera (Tanda 6z3, diseño «La cabecera»): a la izquierda el destino y debajo «13 – 16 oct · 2 personas» (sin fechas, el mes); a la derecha, el Presupuesto (la cartera, abre la pantalla de la 6z2),
 * la campana de los avisos (con su punto si hay algo nuevo) y el Perfil (el círculo, que abre «Mis viajes»; ahí están ahora el «+ Nuevo viaje» y los tips).
 */
export function Header({ onTips, onOpenDates }: HeaderProps) {
  const route = useRouteStore((state) => state.route)
  const setMode = useRouteStore((state) => state.setMode)
  const abrirPresupuesto = usePresupuestoUi((state) => state.abrir)
  const { items, unreadCount } = useAppNotices()
  const [noticesOpen, setNoticesOpen] = useState(false)
  const perfilAbierto = usePerfilUi((state) => state.abierto)
  const abrirPerfil = usePerfilUi((state) => state.abrir)
  const cerrarPerfil = usePerfilUi((state) => state.cerrar)
  if (!route) return null

  return (
    <header className="relative z-20 flex shrink-0 items-center gap-1 bg-bg pb-2.5 pl-5 pr-2.5 pt-1">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-display text-[30px] leading-none text-text">{route.destination}</span>
        <span className="truncate text-text/55" style={{ font: "500 11px 'Geist Mono',monospace", letterSpacing: '.06em' }}>
          {subtituloDelViaje(route)}
        </span>
      </span>
      <button type="button" onClick={abrirPresupuesto} aria-label="Presupuesto" title="Presupuesto" className={BOTON}>
        <Icono nombre="presupuesto" size={23} />
      </button>
      <button type="button" onClick={() => setNoticesOpen(true)} aria-label={unreadCount > 0 ? `Avisos (${unreadCount} nuevos)` : 'Avisos'} title="Avisos" className={BOTON}>
        <Icono nombre="avisos" size={23} />
        {unreadCount > 0 && <span className="absolute right-[11px] top-2.5 h-[9px] w-[9px] rounded-full bg-accent" style={{ boxShadow: '0 0 0 2px rgb(var(--bg))' }} aria-hidden="true" />}
      </button>
      <button type="button" onClick={abrirPerfil} aria-label="Perfil y mis viajes" title="Perfil y mis viajes" className="flex h-11 w-11 shrink-0 items-center justify-center">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#1C2230] text-[#FFFDF8]" style={{ boxShadow: '0 0 0 2px rgb(var(--bg)),0 0 0 3.5px rgb(var(--accent))' }}>
          <Icono nombre="perfil" size={18} />
        </span>
      </button>

      <PerfilSheet open={perfilAbierto} onClose={cerrarPerfil} onTips={onTips} />
      {noticesOpen && (
        <NoticesSheet
          items={items}
          onClose={() => setNoticesOpen(false)}
          onAction={(action) => {
            setNoticesOpen(false)
            if (action === 'open-dates') onOpenDates()
            if (action === 'open-reservas') setMode('bookings')
          }}
        />
      )}
    </header>
  )
}
