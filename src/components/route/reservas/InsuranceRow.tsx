import { formatoImporte, precioGuardado, type Importe } from '../../../lib/dinero'
import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { ReservasItemRow } from './ReservasItemRow'
import { GeneralBookingModal } from './GeneralBookingModal'

export function InsuranceRow() {
  const booking = useRouteStore((state) => state.insuranceBooking)
  const setInsuranceBooking = useRouteStore((state) => state.setInsuranceBooking)
  const dateRange = useRouteStore((state) => state.route?.answers.dateRange)
  const [open, setOpen] = useState(false)

  return (
    <>
      <ReservasItemRow
        kind="insurance"
        label="Seguro de viaje"
        resolved={Boolean(booking)}
        subtitle={booking ? [booking.provider, precioGuardado(booking) ? formatoImporte(precioGuardado(booking) as Importe) : null].filter(Boolean).join(' · ') : undefined}
        priority="red"
        onClick={() => setOpen(true)}
        bookAction={{
          label: 'Obtener con 5% dto.',
          href: 'https://www.iatiseguros.com',
          onGet: () =>
            setInsuranceBooking({ provider: 'IATI Seguros (5% dto.)', startDate: dateRange?.start ?? '', endDate: dateRange?.end ?? '', precio: null }),
        }}
      />
      <GeneralBookingModal
        open={open}
        title="Seguro de viaje"
        itemLabel="el seguro de viaje"
        providerLabel="Aseguradora"
        providerPlaceholder="Mondo, Allianz…"
        initial={booking}
        onSave={setInsuranceBooking}
        onRemove={() => setInsuranceBooking(null)}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
