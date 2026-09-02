import type { DayPlan } from '../../lib/types'
import { mockActivities, mockHotels } from '../../lib/mockAffiliateData'
import { Modal } from '../ui/Modal'
import { FlagIcon } from '../ui/FlagIcon'
import { AffiliateCardCarousel } from '../ui/AffiliateCardCarousel'

interface DestinationDetailModalProps {
  city: string | null
  days: DayPlan[]
  /** "3 noches (Lun 12 abr - Jue 15 abr)" — null mientras no se resuelve el tramo correspondiente. */
  nightsLabel: string | null
  /** Vehículo camper/autocaravana en este destino — se omite la sección de alojamientos, igual que en DIAS/RESERVAS. */
  isCamper: boolean
  onClose: () => void
}

/** Azul de marca de Booking.com (vía agregador Stay22). */
const BOOKING_BLUE = '#003580'
/** Rojo de marca de Civitatis — deliberadamente distinto del azul de Booking, para que quede claro que llevan a sitios distintos. */
const CIVITATIS_RED = '#E2231A'

/**
 * Vista de detalle al pulsar una fila de destino: bandera + nombre centrados arriba, fechas de
 * estancia centradas debajo, "Alojamientos en {destino}" (hoteles vía Stay22, datos mock) y
 * "Actividades en {destino}" (tours vía afiliación, datos mock) — puro escaparate, sin acción de
 * "añadir a mi viaje" aquí (eso se gestiona en DIAS/RESERVAS, ver AccommodationBlock.tsx). Sin
 * mapa/imagen de cabecera — pasa directo de la cabecera a los alojamientos.
 */
export function DestinationDetailModal({ city, days, nightsLabel, isCamper, onClose }: DestinationDetailModalProps) {
  const cityDays = city ? days.filter((day) => day.city === city) : []
  const countryCode = cityDays[0]?.countryCode ?? null
  const hotels = city ? mockHotels(city) : []
  const activities = city ? mockActivities(city) : []

  return (
    <Modal open={city !== null} onClose={onClose}>
      {city && (
        <div className="space-y-4">
          <div className="text-center">
            <FlagIcon countryCode={countryCode} className="mx-auto block text-h2" />
            <h2 className="mt-1 font-display text-h2 font-semibold text-text">{city}</h2>
            {nightsLabel && <p className="mt-1 text-small text-text-soft">{nightsLabel}</p>}
          </div>

          {!isCamper && (
            <div>
              <p className="mb-2 pt-[34px] font-sans text-body font-medium uppercase text-text">🏨 Alojamientos en {city}</p>
              <AffiliateCardCarousel
                cards={hotels.map((hotel) => ({ id: hotel.id, name: hotel.name, price: hotel.pricePerNight, photoUrl: hotel.photoUrl }))}
                priceSuffix="/noche"
              />
              <a href="https://www.booking.com" target="_blank" rel="noopener noreferrer">
                <button
                  type="button"
                  style={{ backgroundColor: BOOKING_BLUE }}
                  className="mt-2 w-full rounded-xl py-2.5 text-body font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Ver más hoteles
                </button>
              </a>
            </div>
          )}

          <div>
            <p className="mb-2 pt-[34px] font-sans text-body font-medium uppercase text-text">🎟 Actividades en {city}</p>
            <AffiliateCardCarousel cards={activities.map((activity) => ({ id: activity.id, name: activity.name, price: activity.price, photoUrl: activity.photoUrl }))} />
            <a href="https://www.civitatis.com" target="_blank" rel="noopener noreferrer">
              <button
                type="button"
                style={{ backgroundColor: CIVITATIS_RED }}
                className="mt-2 w-full rounded-xl py-2.5 text-body font-semibold text-white transition-opacity hover:opacity-90"
              >
                Descubre más experiencias
              </button>
            </a>
          </div>
        </div>
      )}
    </Modal>
  )
}
