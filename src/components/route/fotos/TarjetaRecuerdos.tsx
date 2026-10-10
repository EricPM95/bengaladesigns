import { limiteDeFotos } from '../../../lib/fotosViaje'
import { pagoActivo } from '../../../lib/pago'
import { getTodayTripStatus } from '../../../lib/todayMode'
import type { Route } from '../../../lib/types'
import { usePerfilUi } from '../../../store/usePerfilUi'
import { useRouteStore } from '../../../store/useRouteStore'
import { Icono } from '../../ui/Icono'
import { CabeceraCaja, CajaBlanca } from '../hoy/piezas'

/**
 * La tarjeta «Guarda tus recuerdos» (Tanda 6z6): [Subir mis fotos] lleva al álbum del viaje en el Perfil (`abrirAlbum`). Es una pieza suelta: la usa RUTA en la versión gratis
 * (`TarjetaRecuerdosEnRuta`) y la puede usar también HOY después del viaje. `onSubir` cambia a dónde lleva el botón.
 */
export function TarjetaRecuerdos({ route, onSubir }: { route: Route; onSubir?: () => void }) {
  const abrirAlbum = usePerfilUi((state) => state.abrirAlbum)
  const unaPorParada = limiteDeFotos().porParada !== null
  return (
    <CajaBlanca>
      <CabeceraCaja icono="camara" titulo="Guarda tus recuerdos" />
      <p className="text-[14px] leading-snug text-text-soft">Tus fotos del viaje, ordenadas por días.{unaPorParada ? ' Una foto por parada.' : ''}</p>
      <button
        type="button"
        onClick={onSubir ?? (() => abrirAlbum(route.id))}
        className="flex h-11 w-fit items-center gap-2 rounded-full bg-[#1C2230] px-5 text-[14.5px] font-medium text-[#FFFDF8] transition-transform active:scale-[.98]"
      >
        <Icono nombre="camara" size={18} />
        Subir mis fotos
      </button>
    </CajaBlanca>
  )
}

/** ¿Se enseña la tarjeta en RUTA? Solo en la versión gratis y solo cuando el viaje ya ha pasado (en la de pago, esto está en HOY, después del viaje). */
export function verTarjetaRecuerdosEnRuta(route: Route, hoyIso?: string): boolean {
  return !pagoActivo() && getTodayTripStatus(route, hoyIso)?.phase === 'after'
}

/** La tarjeta en la pestaña RUTA: se monta con UNA línea y se decide sola si sale. */
export function TarjetaRecuerdosEnRuta({ route }: { route: Route }) {
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  if (!verTarjetaRecuerdosEnRuta(route, simulada ?? undefined)) return null
  return <TarjetaRecuerdos route={route} />
}
