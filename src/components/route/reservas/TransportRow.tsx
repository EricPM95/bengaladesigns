import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { precioGuardado, type Importe } from '../../../lib/dinero'
import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { ReservasItemRow } from './ReservasItemRow'
import { enlaceBuscarVuelos } from '../../../lib/enlacesAfiliado'
import { TransportBookingModal } from './TransportBookingModal'

interface TransportRowProps {
  dayId: string
  label: string
}

export function TransportRow({ dayId, label }: TransportRowProps) {
  useMonedaViajero() // (10N7) se repinta al cambiar la moneda
  const booking = useRouteStore((state) => state.transportBookings[dayId])
  const setTransportBooking = useRouteStore((state) => state.setTransportBooking)
  const [open, setOpen] = useState(false)

  return (
    <>
      <ReservasItemRow
        kind="transport"
        label={label}
        resolved={Boolean(booking)}
        subtitle={booking ? [booking.operator, booking.codigo?.trim() ? booking.codigo.trim().toUpperCase() : null, precioGuardado(booking) ? precioEnVista(precioGuardado(booking) as Importe) : null].filter(Boolean).join(' · ') : undefined}
        priority="yellow"
        onClick={() => setOpen(true)}
        bookAction={{
          label: 'Reservar',
          // (6-nov) El enlace de afiliado, en un solo archivo. Esta fila no sabe de qué ciudades es el trayecto (solo su etiqueta): sin búsqueda, el enlace a secas; el vuelo del viaje tiene su [Buscar vuelos] con origen, destino y fechas.
          href: enlaceBuscarVuelos(),
          onGet: () => undefined, // (pulsar abre el buscador y nada más: se añade con «Añadir», Tanda 6z3)
        }}
      />
      <TransportBookingModal
        open={open}
        label={label}
        itemLabel={`el transporte ${label}`}
        initial={booking ?? null}
        onSave={(value) => setTransportBooking(dayId, value)}
        onRemove={() => quitarConDeshacer('Transporte quitado del viaje', () => setTransportBooking(dayId, null))}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
