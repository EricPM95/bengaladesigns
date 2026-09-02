import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { AccommodationHotelModal } from './AccommodationHotelModal'

interface AccommodationBlockProps {
  city: string
  /** Id del primer día de esta estancia — clave de `accommodationSelections` en el store. */
  segmentDayId: string
  totalNights: number
}

/**
 * Bloque "Añade alojamiento en {destino}" — solo se renderiza en el primer día de cada estancia
 * (ver DayDetailPanel.tsx), con la excepción natural de rutas donde cada día es una parada nueva
 * de 1 noche (roadtrip_exclusivo, etc.): ahí CADA día es ya "el primer día" de su propia estancia
 * de 1 noche, así que el bloque aparece cada día sin necesitar ningún caso especial.
 */
export function AccommodationBlock({ city, segmentDayId, totalNights }: AccommodationBlockProps) {
  const selectedHotel = useRouteStore((state) => state.accommodationSelections[segmentDayId])
  const setAccommodationHotel = useRouteStore((state) => state.setAccommodationHotel)
  const [modalOpen, setModalOpen] = useState(false)

  const nightsPlanned = selectedHotel ? totalNights : 0

  return (
    <>
      {selectedHotel ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft/40 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-body">🛏</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-small font-medium text-text">{selectedHotel.name}</p>
            <p className="text-caption text-text-soft">
              {totalNights} noche{totalNights === 1 ? '' : 's'} · €{selectedHotel.pricePerNight}/noche
            </p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="shrink-0 text-caption font-medium text-accent-hover underline">
            Cambiar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-accent/40 bg-accent-soft/20 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-body">🛏</span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-medium text-text">Añade alojamiento en {city}</p>
            <p className="text-caption text-text-soft">
              {nightsPlanned}/{totalNights} noche{totalNights === 1 ? '' : 's'} por planificar
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label={`Añadir alojamiento en ${city}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-body font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            +
          </button>
        </div>
      )}

      {modalOpen && (
        <AccommodationHotelModal
          city={city}
          selected={selectedHotel ?? null}
          onSelect={(hotel) => {
            setAccommodationHotel(segmentDayId, hotel)
            setModalOpen(false)
          }}
          onRemove={() => setAccommodationHotel(segmentDayId, null)}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
