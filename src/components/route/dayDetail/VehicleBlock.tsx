import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { GeneralBookingModal } from '../reservas/GeneralBookingModal'
import { Icono } from '../../ui/Icono'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { BOTON_ORO } from '../../ui/botonesOro'

interface VehicleBlockProps {
  /** 'camper': sustituye por completo al bloque de alojamiento (es donde duermes). 'rental-car': aparece ADEMÁS del de alojamiento (logística aparte). */
  kind: 'camper' | 'rental-car'
}

const COPY = {
  camper: { icon: 'autocaravana' as const, title: 'Añade tu camper/autocaravana', modalTitle: 'Camper / Autocaravana', itemLabel: 'la camper/autocaravana', placeholder: 'Northbound, MotorhomeRepublic…' },
  'rental-car': { icon: 'coche' as const, title: 'Añade tu vehículo de alquiler', modalTitle: 'Vehículo de alquiler', itemLabel: 'el vehículo de alquiler', placeholder: 'Europcar, Goldcar…' },
}

/**
 * EL BLOQUE DEL VEHÍCULO, ARRIBA DE LOS DÍAS (V24; Design `Alojamiento Aviso` A1): borde de puntos, su icono, «Añade tu vehículo de alquiler», «Necesario para todo tu viaje» y [+] redondo dorado. Solo si el viaje lleva un
 * vehículo de alquiler (el coche como en Lanzarote o la autocaravana) y SOLO sin reservar: una vez reservado, el bloque DESAPARECE de aquí (decisión de Eric, 19-nov) porque ya sale en RESERVAS. Es una reserva única para todo
 * el viaje; reutiliza la misma reserva y modal genérico que RESERVAS (`rentalVehicleBooking` / GeneralBookingModal): añadirlo aquí o en RESERVAS es la misma acción, mismo dato.
 */
export function VehicleBlock({ kind }: VehicleBlockProps) {
  const booking = useRouteStore((state) => state.rentalVehicleBooking)
  const setRentalVehicleBooking = useRouteStore((state) => state.setRentalVehicleBooking)
  const [modalOpen, setModalOpen] = useState(false)
  const copy = COPY[kind]
  if (booking && !modalOpen) return null

  return (
    <>
      {!booking && (
        <div data-vehiculo-bloque={kind} style={{ minHeight: 60, display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px 9px 10px', borderRadius: 18, background: 'rgba(255,253,248,.55)', border: '1.5px dashed rgba(181,138,46,.55)', boxSizing: 'border-box' }}>
          <span aria-hidden="true" style={{ width: 42, height: 42, flex: 'none', borderRadius: 12, background: '#EFE5D2', color: '#6A4E22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icono nombre={copy.icon} size={22} />
          </span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: "600 14.5px/1.2 'Geist',sans-serif", color: '#1C2230' }}>{copy.title}</span>
            <span style={{ font: "400 12px/1.3 'Geist',sans-serif", color: 'rgba(28,34,48,.55)' }}>Necesario para todo tu viaje</span>
          </span>
          <button
            type="button"
            className="zona-toque"
            data-vehiculo-anadir="1"
            aria-label={copy.title}
            onClick={() => setModalOpen(true)}
            style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', border: 0, ...BOTON_ORO, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
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
        onSave={(reserva) => {
          setRentalVehicleBooking(reserva)
          setModalOpen(false)
        }}
        onRemove={() => quitarConDeshacer('Alquiler quitado del viaje', () => setRentalVehicleBooking(null))}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
