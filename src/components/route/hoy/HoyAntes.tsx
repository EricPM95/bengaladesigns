import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { isoToLocalDate } from '../../../lib/dateRange'
import { Icono } from '../../ui/Icono'
import { filasDeHoy } from '../../../lib/listaDeHoy'
import { IconoDeLista } from '../../pase/IconoDeLista'
import { CajaBlanca, ojoMono, TarjetaOscura } from './piezas'

const FECHA_LARGA = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' })

/** La lista corta de lo que tendrá HOY (también la usa HOY sin el pase, Tanda 10C). */
export function ListaLoQueTendras() {
  // (Tanda 10I: sale de la lista del pase —la del final de la película—, no escrita aparte: los mismos nombres, líneas e iconos.)
  return (
    <ul className="flex flex-col gap-1" data-lista-hoy>
      {filasDeHoy().map((fila) => (
        <li key={fila.titulo} className="flex min-h-[44px] items-center gap-3 rounded-[14px] px-1.5 py-1">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#1C2230] text-[#FFFDF8]">
            <IconoDeLista icono={fila.icono} size={18} color="#FFFDF8" grosor={1.7} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[14px] font-semibold leading-[1.25]">{fila.titulo}</span>
            <span className="text-[12px] leading-[1.3] text-text/60">{fila.linea}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

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
        <span className="relative" style={{ font: "400 30px/1.1 'Instrument Serif',serif" }}>
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
        <span className="relative" style={{ font: "400 30px/1.1 'Instrument Serif',serif" }}>
          Tu modo Hoy se activa el {FECHA_LARGA.format(isoToLocalDate(startIso)).replace(',', '')}
        </span>
      </TarjetaOscura>

      <CajaBlanca>
        <span className="pl-1 text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
          Ese día tendrás
        </span>
        <ListaLoQueTendras />
        <button type="button" onClick={verPrimerDia} className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full btn-champan text-[14.5px] font-semibold ">
          <Icono nombre="dias" size={17} />
          Ver mi primer día
        </button>
      </CajaBlanca>
    </>
  )
}
