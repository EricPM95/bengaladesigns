import { AnimatePresence, motion } from 'framer-motion'
import type { DayPlan } from '../../lib/types'
import { mockActivities, mockHotels } from '../../lib/mockAffiliateData'
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
 * Vista de detalle al pulsar una fila de destino — pantalla completa (no un modal recortado), con
 * una ✕ en la esquina superior izquierda para cerrar y volver a RUTA. Cabecera con bandera junto
 * al nombre + noches en la misma línea, "Alojamientos en {destino}" (hoteles vía Stay22, datos
 * mock) y "Actividades en {destino}" (tours vía afiliación, datos mock) — puro escaparate, sin
 * acción de "añadir a mi viaje" aquí (eso se gestiona en DIAS/RESERVAS, ver AccommodationBlock.tsx).
 */
export function DestinationDetailModal({ city, days, nightsLabel, isCamper, onClose }: DestinationDetailModalProps) {
  const cityDays = city ? days.filter((day) => day.city === city) : []
  const countryCode = cityDays[0]?.countryCode ?? null
  const hotels = city ? mockHotels(city) : []
  const activities = city ? mockActivities(city) : []

  return (
    <AnimatePresence>
      {city && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            className="fixed left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text shadow-md transition-colors hover:bg-bg-hover"
          >
            ✕
          </button>

          <div className="mx-auto w-full max-w-lg space-y-4 px-6 pb-8 pt-20">
            <div className="text-center">
              <p className="flex items-center justify-center gap-2 font-display text-h2 font-semibold text-text">
                <FlagIcon countryCode={countryCode} />
                {city}
              </p>
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
