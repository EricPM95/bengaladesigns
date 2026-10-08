import { useState } from 'react'
import type { Reservation } from '../../../lib/bookings'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { useRouteStore } from '../../../store/useRouteStore'
import { AddReservationSheet } from './AddReservationSheet'
import { openTicketShop } from './EntradaCard'
import { ReservedDetails, ReservedMarks } from './ReservedMarks'
import { useStopEntradas } from './useStopEntradas'

/** La parada de la ruta con ese id (null si no está en ningún día). */
function useRouteStop(stopId: string | null | undefined) {
  return useRouteStore((state) => {
    if (!stopId || !state.route) return null
    for (const day of state.route.days) {
      const stop = day.stops.find((candidate) => candidate.id === stopId)
      if (stop) return { day, stop }
    }
    return null
  })
}

/** La reserva que fija esta parada (null si no está reservada). */
export function useStopReservation(stopId: string | null | undefined): Reservation | null {
  const found = useRouteStop(stopId)
  const reservedId = found?.stop.reservedId
  return useRouteStore((state) => (reservedId ? (state.reservations.find((reservation) => reservation.id === reservedId) ?? null) : null))
}

/**
 * El contenido de la pestaña «Entradas» de la ficha (Tanda 6n): todas las entradas de los datos para ese sitio, una debajo de otra (nombre, qué incluye, precio «desde» y
 * [Reservar], que abre la compra en otra pestaña con el aviso corto; nunca el nombre del proveedor). Debajo, «¿Ya la tienes? Añádela»; reservada, «Ya tienes entrada · hora»
 * con «Cambiar». «Añádela» solo sale si el sitio ya está en algún día del viaje (desde EXPLORAR o «+ Añadir parada» se ven y se reservan las entradas, pero
 * no se añaden). Un sitio sin entradas en los datos no pinta nada (y su pestaña no sale).
 */
export function StopEntradasTab({ stop }: { stop: { id: string; name: string; isFreeTour?: boolean } }) {
  const route = useRouteStore((state) => state.route)
  const found = useRouteStop(stop.id)
  const data = useStopEntradas(stop)
  const [sheet, setSheet] = useState(false)
  if (!route || !data) return null
  const { reservation } = data
  return (
    <div className="space-y-3">
      {data.entradas.map((entrada) => (
        <div key={entrada.nombre} className="rounded-xl border border-border p-3">
          <p className="text-small font-semibold text-text">{entrada.nombre}</p>
          {entrada.incluye && <p className="mt-1 text-small text-text-soft">{entrada.incluye}</p>}
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-small text-text-soft">{entrada.desde != null ? `Desde ${entrada.desde} €` : ''}</span>
            <button
              type="button"
              onClick={() => openTicketShop(entrada.url ?? buildActivitySearchUrl(`${entrada.nombre} ${route.destination}`))}
              className="h-9 whitespace-nowrap rounded-full bg-accent px-4 text-small font-semibold text-white active:scale-[.97]"
            >
              {stop.isFreeTour ? 'Reservar Free Tour' : 'Reservar'}
            </button>
          </div>
        </div>
      ))}
      {reservation ? (
        <div className="rounded-xl border border-accent-green/40 bg-accent-green-soft/60 p-3">
          <ReservedMarks />
          <p className="mt-2 text-small font-semibold text-text">Ya tienes entrada · {reservation.time}</p>
          <ReservedDetails reservation={reservation} timeLabel="Entrada" />
          {/* Lo de llegar antes, el control y el punto de encuentro va aquí, en la ficha (Tanda 6j, 9.4). */}
          {found?.stop.arrivalNote && <p className="mt-2 text-caption text-text-soft">{found.stop.arrivalNote}</p>}
          <button type="button" onClick={() => setSheet(true)} className="mt-2 text-small font-semibold text-text underline underline-offset-2">
            Cambiar
          </button>
        </div>
      ) : (
        data.inTrip && (
          <p className="text-center text-small text-text-soft">
            ¿Ya la tienes?{' '}
            <button type="button" onClick={() => setSheet(true)} className="font-semibold text-text underline underline-offset-2">
              Añádela
            </button>
          </p>
        )
      )}
      {sheet && <AddReservationSheet route={route} target={data.target} onClose={() => setSheet(false)} />}
    </div>
  )
}
