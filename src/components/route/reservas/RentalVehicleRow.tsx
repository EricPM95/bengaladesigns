import { formatoImporte, precioGuardado, type Importe } from '../../../lib/dinero'
import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { buildCamperRentalLink, buildCarRentalLink } from '../../../lib/vehicleRentalLinks'
import { ReservasItemRow } from './ReservasItemRow'
import { GeneralBookingModal } from './GeneralBookingModal'

export function RentalVehicleRow() {
  const booking = useRouteStore((state) => state.rentalVehicleBooking)
  const setRentalVehicleBooking = useRouteStore((state) => state.setRentalVehicleBooking)
  const route = useRouteStore((state) => state.route)
  const [open, setOpen] = useState(false)

  const isCamper = route?.transportContext.vehicle_type === 'camper'
  const { url, label: providerLabel } = isCamper ? buildCamperRentalLink(route?.days[0]?.countryCode ?? null) : buildCarRentalLink()
  const priority = route?.transportContext.vehiculo_altamente_recomendado ? 'yellow' : 'gray'

  return (
    <>
      <ReservasItemRow
        kind="rental-vehicle"
        label="Vehículo de alquiler"
        resolved={Boolean(booking)}
        subtitle={booking ? [booking.provider, precioGuardado(booking) ? formatoImporte(precioGuardado(booking) as Importe) : null].filter(Boolean).join(' · ') : undefined}
        priority={priority}
        onClick={() => setOpen(true)}
        bookAction={{
          label: 'Reservar',
          href: url,
          onGet: () => undefined, // (pulsar abre la tienda y nada más: se añade con «Añadir», Tanda 6z3)
        }}
      />
      <GeneralBookingModal
        open={open}
        title="Vehículo de alquiler"
        itemLabel="el vehículo de alquiler"
        providerLabel="Empresa de alquiler"
        providerPlaceholder="Europcar, Goldcar…"
        initial={booking}
        onSave={setRentalVehicleBooking}
        onRemove={() => setRentalVehicleBooking(null)}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
