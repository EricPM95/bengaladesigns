import { useAvisosStore } from '../../store/useAvisosStore'
import { useRouteStore } from '../../store/useRouteStore'
import { BotonCartera } from '../presupuesto/BotonCartera'
import { useAppNotices } from '../../hooks/useAppNotices'
import { Icono } from '../ui/Icono'
import { LogoPequeno } from '../ui/LogoJutrip'
import { NoticesSheet } from './NoticesSheet'
import { PerfilSheet, precargarPerfil } from './PerfilSheet'
import { usePerfilUi } from '../../store/usePerfilUi'

/** Botón redondo de la cabecera (diseño «La cabecera»): 44 px de toque, sin fondo, la tinta de siempre. */
const BOTON = 'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:bg-text/[.06]'

interface HeaderProps {
  /** El aviso «más días que fechas» abre el calendario de fechas. */
  onOpenDates: () => void
}

/**
 * La cabecera (Tanda 6z3, diseño «La cabecera»): a la izquierda el destino y debajo «13 – 16 oct · 2 personas» (sin fechas, el mes); a la derecha, el Presupuesto (la cartera, abre la pantalla de la 6z2),
 * la campana de los avisos (con su punto si hay algo nuevo) y el Perfil (el círculo, que abre «Mis viajes»; ahí está el «+ Nuevo viaje»; los tips del viaje son la bombilla de RUTA).
 */
export function Header({ onOpenDates }: HeaderProps) {
  const route = useRouteStore((state) => state.route)
  const setMode = useRouteStore((state) => state.setMode)
  const { items, unreadCount: sinLeerLocales } = useAppNotices()
  // La campanita de la cuenta (cuentas parte 3): los avisos del servidor suman al puntito y la campanita se abre también desde fuera (el aviso del móvil, al tocarlo).
  const sinLeerDeLaCuenta = useAvisosStore((state) => state.sinLeer)
  const noticesOpen = useAvisosStore((state) => state.abierta)
  const abrirAvisos = useAvisosStore((state) => state.abrir)
  const cerrarAvisos = useAvisosStore((state) => state.cerrar)
  const setNoticesOpen = (abrir: boolean) => (abrir ? abrirAvisos() : cerrarAvisos())
  const unreadCount = sinLeerLocales + sinLeerDeLaCuenta
  const perfilAbierto = usePerfilUi((state) => state.abierto)
  const abrirPerfil = usePerfilUi((state) => state.abrir)
  const cerrarPerfil = usePerfilUi((state) => state.cerrar)
  if (!route) return null

  return (
    <header className="relative z-20 flex shrink-0 items-center gap-1 bg-bg pb-2.5 pl-5 pr-2.5 pt-1">
      {/* Tanda 10N §2: el logo de JUTRIP (la palabra en Italiana con la estrella sobre la I) en lugar de «Roma / fechas · personas». */}
      <span data-cabecera-logo="1" aria-label="JUTRIP" className="flex min-w-0 flex-1 items-center">
        <LogoPequeno tam={26} />
      </span>
      <BotonCartera />
      <button type="button" onClick={() => setNoticesOpen(true)} aria-label={unreadCount > 0 ? `Avisos (${unreadCount} nuevos)` : 'Avisos'} title="Avisos" className={BOTON}>
        <Icono nombre="avisos" size={23} />
        {unreadCount > 0 && <span className="absolute right-[11px] top-2.5 h-[9px] w-[9px] rounded-full bg-frambuesa" style={{ boxShadow: '0 0 0 2px rgb(var(--bg))' }} aria-hidden="true" />}
      </button>
      <button type="button" onPointerDown={precargarPerfil} onClick={abrirPerfil} aria-label="Perfil y mis viajes" title="Perfil y mis viajes" data-boton-perfil="1" className="flex h-11 w-11 shrink-0 items-center justify-center">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#1C2230] text-[#FFFDF8]" style={{ boxShadow: '0 0 0 2px rgb(var(--bg)),0 0 0 3.5px rgb(var(--accent))' }}>
          <Icono nombre="perfil" size={18} />
        </span>
      </button>

      <PerfilSheet open={perfilAbierto} onClose={cerrarPerfil} />
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
