import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { isoToLocalDate } from '../../../lib/dateRange'
import { Icono } from '../../ui/Icono'
import type { NombreIcono } from '../../../lib/iconos'
import { CajaBlanca, ojoMono, TarjetaOscura } from './piezas'

const FECHA_LARGA = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' })

/** Lo que tendrá el modo Hoy cuando se active (lista corta; solo de pago, como todo HOY). */
const LO_QUE_TENDRAS: { icono: NombreIcono; texto: string }[] = [
  { icono: 'ubicacion', texto: 'Tu siguiente parada y cómo llegar' },
  { icono: 'reloj', texto: '«No me da tiempo», para saltar lo que no llegues a ver' },
  { icono: 'info', texto: 'Escuchar lo que ves' },
  { icono: 'localizar', texto: 'Lo que tienes cerca' },
  { icono: 'avisos', texto: 'Los avisos del día' },
]

/**
 * HOY antes del viaje (Tanda 6z6; solo de pago). La cuenta atrás y lo que falta por reservar ya no están aquí: están arriba de RESERVAS (TarjetaCuentaAtras).
 * Con fechas: «Tu modo Hoy se activa el {fecha del primer día}», lo que tendrá, y [Ver mi primer día], que abre DÍAS. Sin fechas: «Pon tus fechas para activar tu modo Hoy» y [Pon tus fechas].
 */
export function HoyAntes({ route, startIso, onPonFechas }: { route: Route; startIso: string | null; onPonFechas: () => void }) {
  const setMode = useRouteStore((state) => state.setMode)
  const setActiveDayId = useRouteStore((state) => state.setActiveDayId)
  const verPrimerDia = () => {
    setActiveDayId(route.days[0]?.id ?? null)
    setMode('days')
  }

  if (!startIso) {
    return (
      <TarjetaOscura>
        <span className="relative text-[#FFFDF8]/60" style={ojoMono}>
          Antes del viaje
        </span>
        <span className="relative mt-1.5" style={{ font: "400 30px/1.1 'Instrument Serif',serif" }}>
          Pon tus fechas para activar tu modo Hoy
        </span>
        <button type="button" onClick={onPonFechas} className="relative mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FFFDF8] text-[14.5px] font-semibold text-[#1C2230]">
          <Icono nombre="dias" size={17} />
          Pon tus fechas
        </button>
      </TarjetaOscura>
    )
  }

  return (
    <>
      <TarjetaOscura>
        <span className="relative text-[#FFFDF8]/60" style={ojoMono}>
          Antes del viaje
        </span>
        <span className="relative mt-1.5" style={{ font: "400 30px/1.1 'Instrument Serif',serif" }}>
          Tu modo Hoy se activa el {FECHA_LARGA.format(isoToLocalDate(startIso)).replace(',', '')}
        </span>
      </TarjetaOscura>

      <CajaBlanca>
        <span className="pl-1 text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
          Ese día tendrás
        </span>
        <ul className="flex flex-col gap-1">
          {LO_QUE_TENDRAS.map((fila) => (
            <li key={fila.texto} className="flex min-h-[44px] items-center gap-3 rounded-[14px] px-1.5 py-1">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#1C2230] text-[#FFFDF8]">
                <Icono nombre={fila.icono} size={18} />
              </span>
              <span className="min-w-0 flex-1 text-[14px] leading-[1.3]">{fila.texto}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={verPrimerDia} className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1C2230] text-[14.5px] font-semibold text-[#FFFDF8]">
          <Icono nombre="dias" size={17} />
          Ver mi primer día
        </button>
      </CajaBlanca>
    </>
  )
}
