import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { DayPlan } from '../../lib/types'
import { FlagIcon } from '../ui/FlagIcon'
import { AffiliateCardCarousel } from '../ui/AffiliateCardCarousel'
import { BOOKING_BLUE, CIVITATIS_RED, buildActivitySearchUrl } from '../../lib/affiliateLinks'
import { useAlojamientoUi } from '../../store/useAlojamientoUi'
import { destinationExcursions } from '../../lib/destinationExcursions'
import { Icono } from '../ui/Icono'

interface DestinationDetailModalProps {
  city: string | null
  days: DayPlan[]
  /** "3 noches (Lun 12 abr - Jue 15 abr)" — null mientras no se resuelve el tramo correspondiente. */
  nightsLabel: string | null
  /** Vehículo camper/autocaravana en este destino — se omite la sección de alojamientos, igual que en DIAS/RESERVAS. */
  isCamper: boolean
  onClose: () => void
}


/**
 * Vista de detalle al pulsar una fila de destino — pantalla completa (no un modal recortado), con
 * una ✕ en la esquina superior izquierda para cerrar y volver a RUTA. Cabecera con bandera junto
 * al nombre + noches en la misma línea, "Alojamientos en {destino}" (el botón abre el mapa de alojamientos de la app, Tanda 6z) y "Actividades en {destino}" (el enlace de Civitatis) — sin
 * datos de ejemplo y sin acción de "añadir a mi viaje" aquí (eso se gestiona en DIAS/RESERVAS, ver AccommodationBlock.tsx).
 */
export function DestinationDetailModal({ city, days, nightsLabel, isCamper, onClose }: DestinationDetailModalProps) {
  const cityDays = city ? days.filter((day) => day.city === city) : []
  const countryCode = cityDays[0]?.countryCode ?? null
  const excursions = city ? destinationExcursions(city) : []

  // (En el body, por encima de la barra, la cabecera y el mapa: pantalla completa de verdad. PARA_CODE_TODO_2026-10-01, 6.1.)
  return createPortal(
    <AnimatePresence>
      {city && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="map-cover-overlay fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-bg"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            className="fixed left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text shadow-md transition-colors hover:bg-bg-hover"
          >
            <Icono nombre="cerrar" size={18} />
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
                <p className="mb-2 pt-[34px] font-sans text-body font-medium uppercase text-text"><Icono nombre="cama" size={16} className="mr-1.5 inline-block align-[-3px]" />Alojamientos en {city}</p>
                <button
                  type="button"
                  onClick={() => useAlojamientoUi.getState().abrirMapa()}
                  style={{ backgroundColor: BOOKING_BLUE }}
                  className="mt-2 w-full rounded-xl py-2.5 text-body font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Buscar alojamiento
                </button>
              </div>
            )}

            <div>
              <p className="mb-2 pt-[34px] font-sans text-body font-medium uppercase text-text"><Icono nombre="reservas" size={16} className="mr-1.5 inline-block align-[-3px]" />Actividades en {city}</p>
              <a href={buildActivitySearchUrl(city)} target="_blank" rel="noopener noreferrer">
                <button
                  type="button"
                  style={{ backgroundColor: CIVITATIS_RED }}
                  className="mt-2 w-full rounded-xl py-2.5 text-body font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Descubre más experiencias
                </button>
              </a>
            </div>

            {/* Solo si hay excursiones que enseñar: sin datos, el bloque no sale. */}
            {excursions.length > 0 && (
              <div>
                <p className="mb-2 pt-[34px] font-sans text-body font-medium uppercase text-text"><Icono nombre="excursion" size={16} className="mr-1.5 inline-block align-[-3px]" />Excursiones desde {city}</p>
                <AffiliateCardCarousel cards={excursions.map((excursion) => ({ id: excursion.id, name: excursion.name, photoUrl: excursion.photoUrl }))} />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
