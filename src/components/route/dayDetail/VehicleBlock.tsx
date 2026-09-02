import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { GeneralBookingModal } from '../reservas/GeneralBookingModal'

interface VehicleBlockProps {
  /** 'camper': sustituye por completo al bloque de alojamiento (es donde duermes). 'rental-car': aparece ADEMÁS del de alojamiento (logística aparte). */
  kind: 'camper' | 'rental-car'
}

const COPY = {
  camper: { icon: '🚐', title: 'Añade tu camper/autocaravana', modalTitle: 'Camper / Autocaravana', itemLabel: 'la camper/autocaravana', placeholder: 'Northbound, MotorhomeRepublic…' },
  'rental-car': { icon: '🚗', title: 'Añade tu vehículo de alquiler', modalTitle: 'Vehículo de alquiler', itemLabel: 'el vehículo de alquiler', placeholder: 'Europcar, Goldcar…' },
}

/**
 * Bloque "dónde duermes/te mueves" del día 1 del viaje (nunca se repite en días siguientes — es
 * una reserva única para todo el viaje, no por noche/estancia como AccommodationBlock). Reutiliza
 * la misma reserva y modal genérico que RESERVAS (`rentalVehicleBooking`/GeneralBookingModal) —
 * añadirlo aquí o en RESERVAS es la misma acción, mismo dato.
 */
export function VehicleBlock({ kind }: VehicleBlockProps) {
  const booking = useRouteStore((state) => state.rentalVehicleBooking)
  const setRentalVehicleBooking = useRouteStore((state) => state.setRentalVehicleBooking)
  const [modalOpen, setModalOpen] = useState(false)

  const copy = COPY[kind]

  return (
    <>
      {booking ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft/40 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-body">{copy.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-small font-medium text-text">{booking.provider}</p>
            <p className="text-caption text-text-soft">Necesaria para todo tu viaje · €{booking.price}</p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="shrink-0 text-caption font-medium text-accent-hover underline">
            Cambiar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-accent/40 bg-accent-soft/20 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-body">{copy.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-medium text-text">{copy.title}</p>
            <p className="text-caption text-text-soft">Necesaria para todo tu viaje</p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label={copy.title}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-body font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            +
          </button>
        </div>
      )}

      <GeneralBookingModal
        open={modalOpen}
        title={copy.modalTitle}
        itemLabel={copy.itemLabel}
        providerLabel="Empresa de alquiler"
        providerPlaceholder={copy.placeholder}
        initial={booking}
        onSave={setRentalVehicleBooking}
        onRemove={() => setRentalVehicleBooking(null)}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
