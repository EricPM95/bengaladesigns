import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { AddReservationSheet } from './AddReservationSheet'
import { GREEN } from './EntradaCard'
import { useStopEntradas } from './useStopEntradas'
import { Icono } from '../../ui/Icono'

/** Sin reservar, el frambuesa de la app (`--accent`: «falta»). */
const FALTA = 'rgb(var(--accent))'

function TicketIcon() {
  return (
    <Icono nombre="reservas" size={15} />
  )
}

/**
 * La pestañita de entrada de la tarjeta de DÍAS (Tanda 6n y 6q): en la esquina de abajo a la derecha, en la misma vertical que el «···» de la esquina de arriba y con el mismo hueco hasta el borde. Sin reservar, naranja con el icono de entrada: abre la
 * ficha en su pestaña «Entradas». Reservada, verde con ✓ y la hora: abre la hoja de «Cambiar». Sin entradas en los datos, no sale.
 */
export function EntradaEdgeTab({ stop, onOpenEntradas }: { stop: { id: string; name: string; isFreeTour?: boolean }; onOpenEntradas: () => void }) {
  const route = useRouteStore((state) => state.route)
  const data = useStopEntradas(stop)
  const [changing, setChanging] = useState(false)
  if (!data || !route) return null
  const reserved = data.reservation != null
  return (
    <>
      <button
        type="button"
        onClick={reserved ? () => setChanging(true) : onOpenEntradas}
        aria-label={reserved ? `Entrada reservada${data.shownTime ? ` a las ${data.shownTime}` : ''}. Cambiar` : 'Ver las entradas'}
        className="absolute bottom-2 right-[5px] z-20 flex w-[34px] flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-white shadow-sm"
        style={{ background: reserved ? GREEN : FALTA }}
      >
        {reserved ? (
          <>
            <Icono nombre="hecho" className="h-4 w-4" grosor={3} />
            {data.shownTime && <span style={{ font: "600 9.5px 'Geist Mono',monospace" }}>{data.shownTime}</span>}
          </>
        ) : (
          <TicketIcon />
        )}
      </button>
      {changing && <AddReservationSheet route={route} target={data.target} onClose={() => setChanging(false)} />}
    </>
  )
}
