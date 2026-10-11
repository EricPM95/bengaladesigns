import { useState } from 'react'
import { precioTienda } from '../../../lib/dinero'
import type { Reservation } from '../../../lib/bookings'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import type { SinEntrada } from '../../../lib/destinationExcursions'
import { notaDeLlegadaSinHora } from '../../../lib/notaDeLlegada'
import { useRouteStore } from '../../../store/useRouteStore'
import { AddReservationSheet } from './AddReservationSheet'
import { openTicketShop } from './EntradaCard'
import { LockIcon, ReservedDetails } from './ReservedMarks'
import { useStopEntradas } from './useStopEntradas'
import { FichaSinEntrada, FichaTuEntrada } from '../dayDetail/FichaPiezas'

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
 * El contenido de la pestaña «Entradas» de la ficha (Tanda 6n; diseño nuevo en la 6y4): todas las entradas de los datos para ese sitio, una debajo de otra (nombre, qué incluye, precio «desde» y
 * [Reservar], que abre la compra en otra pestaña con el aviso corto; nunca el nombre del proveedor). Debajo, «¿Ya la tienes? Añádela»; reservada, «✓ Tu entrada: 10:30» (la hora UNA sola vez) con
 * «Llega unos 30 minutos antes: …» (sin hora calculada; 15 en el Free Tour) y «Cambiar». «Añádela» solo sale si el sitio ya está en algún día del viaje (desde EXPLORAR o «+ Añadir parada» se ven y se reservan las
 * entradas, pero no se añaden). Un sitio sin entradas en los datos no pinta nada (y su pestaña no sale).
 * `sinEntrada` (Tanda 6y4): un sitio que no vende entrada pero cobra por acercarse (la tasa de la Fontana de Trevi) lleva «No necesitas entrada» con lo que diga el dato, y NO lleva [Reservar] ni «Añádela».
 */
export function StopEntradasTab({ stop, sinEntrada = null }: { stop: { id: string; name: string; isFreeTour?: boolean }; sinEntrada?: SinEntrada | null }) {
  const route = useRouteStore((state) => state.route)
  const found = useRouteStop(stop.id)
  const data = useStopEntradas(stop)
  const [sheet, setSheet] = useState(false)
  if (sinEntrada) return <FichaSinEntrada bloque={sinEntrada} />
  if (!route || !data) return null
  const { reservation } = data
  return (
    <div className="space-y-3">
      {data.entradas.map((entrada) => (
        <div key={entrada.nombre} className="rounded-[20px] border border-text/[.07] bg-bg-card p-3.5">
          <div className="flex items-baseline justify-between gap-2.5">
            <p className="font-display text-[19px] leading-[1.1] text-text">{entrada.nombre}</p>
            {entrada.desde != null && <span className="font-display text-[22px] leading-none text-text">{`Desde ${precioTienda(entrada.desde)}`}</span>}
          </div>
          {entrada.incluye && <p className="mt-1.5 text-[13px] leading-[1.5] text-text/72">{entrada.incluye}</p>}
          <button
            type="button"
            onClick={() => openTicketShop(entrada.url ?? buildActivitySearchUrl(`${entrada.nombre} ${route.destination}`))}
            className="mt-3 h-11 w-full whitespace-nowrap rounded-full bg-accent text-small font-semibold text-white active:scale-[.97]"
          >
            {stop.isFreeTour ? 'Reservar Free Tour' : 'Reservar'}
          </button>
        </div>
      ))}
      {reservation ? (
        <FichaTuEntrada hora={reservation.time} nota={notaDeLlegadaSinHora(found?.stop.arrivalNote, found?.stop.arrivalMinutes)}>
          {/* Lo que el viajero apuntó (punto de encuentro, n.º de reserva): sin repetir la hora. */}
          <ReservedDetails reservation={reservation} timeLabel={null} />
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-text/20 bg-bg-card px-2.5 py-1 text-[12px] font-semibold text-text-soft">
              <LockIcon className="h-3 w-3" />
              Fijada
            </span>
            <button type="button" onClick={() => setSheet(true)} className="text-small font-semibold text-text underline underline-offset-2">
              Cambiar
            </button>
          </div>
        </FichaTuEntrada>
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
