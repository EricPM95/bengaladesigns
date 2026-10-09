import { useState } from 'react'
import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { buildCamperRentalLink } from '../../lib/vehicleRentalLinks'
import { SleepingIllustration } from './SleepingIllustration'

interface MissingAccommodationBannerProps {
  route: Route
}

const bannerWrapperClass = 'relative m-3 flex shrink-0 items-center gap-3 overflow-hidden rounded-2xl bg-accent-lilac p-4'
const dismissButtonClass = 'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-text-soft hover:bg-bg-card/60'
const ctaClass = 'rounded-full bg-accent px-4 py-2 text-caption font-semibold text-white transition-colors hover:bg-accent-hover'

/**
 * Banner destacado en la parte superior de DIAS con la "solución para dormir" pendiente del
 * viaje — Alojamiento o Camper/Autocaravana, NUNCA ambos a la vez (mismo estilo, mismo icono de
 * dismiss). Descartable con la X (estado local, no persiste entre visitas) sin completar la acción.
 *
 * Camper: el CTA es un enlace externo real a Northbound/MotorhomeRepublic (ver
 * vehicleRentalLinks.ts) — no hay catálogo curado en la app para campers, a diferencia de hoteles,
 * así que aquí solo se nudge a reservar fuera; el booking real se anota luego a mano en
 * VehicleBlock.tsx (DIAS día 1) o RESERVAS, mismo dato (`rentalVehicleBooking`).
 * Alojamiento: ya no se pinta (Tanda 6z).
 */
export function MissingAccommodationBanner({ route }: MissingAccommodationBannerProps) {
  const rentalVehicleBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const isCamper = route.transportContext.vehicle_type === 'camper'
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'

  if (isCamper) {
    if (!hasRentalVehicle || rentalVehicleBooking) return null
    const countryCode = route.days[0]?.countryCode ?? null
    const { url, label } = buildCamperRentalLink(countryCode)

    return (
      <div className={bannerWrapperClass}>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Cerrar aviso" className={dismissButtonClass}>
          ×
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-body font-semibold text-text">¿Necesitas tu camper?</h3>
          <p className="text-small text-text-soft">Parece que aún no tienes tu camper/autocaravana reservada</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block">
            <button type="button" className={ctaClass}>
              Reserva en {label}
            </button>
          </a>
        </div>

        <SleepingIllustration className="h-20 w-24 shrink-0" />
      </div>
    )
  }

  // (Tanda 6z: el aviso lila «¿Necesitas alojamiento?» ya no se pinta en DÍAS; el alojamiento se pide desde el primer día de cada destino, RESERVAS y el «Hoteles» de EXPLORAR.)
  return null
}
