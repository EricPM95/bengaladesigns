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
        label={`Transporte: ${label}`}
        resolved={Boolean(booking)}
        subtitle={booking ? `${booking.operator} · €${booking.price}` : undefined}
        priority="yellow"
        onClick={() => setOpen(true)}
        bookAction={{
          label: 'Reservar',
          href: 'https://www.skyscanner.net',
          onGet: () => setTransportBooking(dayId, { operator: 'Reservado vía Skyscanner', dateTime: '', price: 0, locator: '' }),
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
