import { useState } from 'react'
import type { Reservation } from '../../../lib/bookings'
import { entranceTargetFor, stopHasEntrance } from '../../../lib/bookings'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { AddReservationSheet } from './AddReservationSheet'
import { ReservedDetails, ReservedMarks } from './ReservedMarks'

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
 * Lo de la reserva en la pestaña «Entradas» de una parada (PARA_CODE_RESERVAS, 6): reservada, las dos marcas y «Ya tienes entrada · {hora}» en lugar
 * de los enlaces para comprar; sin reservar y con entrada, «¿Ya la has reservado? Añade tu confirmación».
 */
export function StopReservationBlock({ stopId }: { stopId: string }) {
  const route = useRouteStore((state) => state.route)
  const found = useRouteStop(stopId)
  const reservation = useStopReservation(stopId)
  const info = useDestinationExcursions(route?.destination)
  const [adding, setAdding] = useState(false)
  if (!route || !found) return null

  if (reservation) {
    return (
      <div className="rounded-xl border border-accent-green/40 bg-accent-green-soft/60 p-3">
        <ReservedMarks />
        <p className="mt-2 text-small font-semibold text-text">Ya tienes entrada · {reservation.time}</p>
        <ReservedDetails reservation={reservation} timeLabel="Entrada" />
      </div>
    )
  }
  if (!stopHasEntrance(found.stop)) return null
  const target = { kind: 'entrada' as const, ...entranceTargetFor(found.stop.name, info.entradas), currentDayId: found.day.id }
  return (
    <>
      <button type="button" onClick={() => setAdding(true)} className="w-full rounded-xl border border-text/15 bg-bg-card py-2.5 text-center text-small font-semibold text-text-soft transition-colors hover:bg-bg-hover">
        ¿Ya la has reservado? Añade tu confirmación
      </button>
      {adding && <AddReservationSheet route={route} target={target} onClose={() => setAdding(false)} />}
    </>
  )
}
