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

  return (
    <>
      <ReservasItemRow
        kind="rental-vehicle"
        label="Vehículo de alquiler"
        resolved={Boolean(booking)}
        subtitle={booking ? `${booking.provider} · €${booking.price}` : undefined}
        onClick={() => setOpen(true)}
        bookAction={{
          label: 'Reservar',
          href: url,
          onGet: () => setRentalVehicleBooking({ provider: `Reservado vía ${providerLabel}`, startDate: '', endDate: '', price: 0 }),
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
