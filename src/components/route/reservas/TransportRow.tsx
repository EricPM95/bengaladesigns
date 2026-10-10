import { formatoImporte, precioGuardado, type Importe } from '../../../lib/dinero'
import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { ReservasItemRow } from './ReservasItemRow'
import { TransportBookingModal } from './TransportBookingModal'

interface TransportRowProps {
  dayId: string
  label: string
}

export function TransportRow({ dayId, label }: TransportRowProps) {
  const booking = useRouteStore((state) => state.transportBookings[dayId])
  const setTransportBooking = useRouteStore((state) => state.setTransportBooking)
  const [open, setOpen] = useState(false)

  return (
    <>
      <ReservasItemRow
        kind="transport"
        label={label}
        resolved={Boolean(booking)}
        subtitle={booking ? [booking.operator, precioGuardado(booking) ? formatoImporte(precioGuardado(booking) as Importe) : null].filter(Boolean).join(' · ') : undefined}
        priority="yellow"
        onClick={() => setOpen(true)}
        bookAction={{
          label: 'Reservar',
          href: 'https://www.skyscanner.net',
          onGet: () => undefined, // (pulsar abre el buscador y nada más: se añade con «Añadir», Tanda 6z3)
        }}
      />
      <TransportBookingModal
        open={open}
        label={label}
        itemLabel={`el transporte ${label}`}
        initial={booking ?? null}
        onSave={(value) => setTransportBooking(dayId, value)}
        onRemove={() => setTransportBooking(dayId, null)}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
