import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { AddReservationSheet } from './AddReservationSheet'
import { GREEN } from './EntradaCard'
import { useStopEntradas } from './useStopEntradas'

const ORANGE = 'rgb(var(--accent-gold))'

function TicketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12" />
    </svg>
  )
}

/**
 * La pestañita de entrada de la tarjeta de DÍAS (Tanda 6n): pegada al borde derecho, a media altura. Sin reservar, naranja con el icono de entrada: abre la
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
        className="absolute right-0 top-1/2 z-20 flex w-[34px] -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-l-xl py-2 text-white shadow-sm"
        style={{ background: reserved ? GREEN : ORANGE }}
      >
        {reserved ? (
          <>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
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
