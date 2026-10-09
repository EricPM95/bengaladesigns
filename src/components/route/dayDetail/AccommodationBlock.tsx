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

  // (Tanda 6t, diseño «1b»: solo el aspecto. Una fila sin caja: el icono de la cama en un círculo, el texto en cursiva con su línea pequeña y el botón redondo; puesto, el ✓ verde. Lo que hace y sus textos, los de siempre.)
  const VERDE = 'oklch(0.55 0.11 150)'
  const fila = (hecho: boolean, titulo: string, sub: string, accion: string, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-label={accion} className="flex h-12 w-full items-center gap-2.5 rounded-[14px] bg-transparent px-1 text-left text-text">
      <span
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
        style={{ border: `1.5px solid ${hecho ? VERDE : 'rgba(28,34,48,.4)'}`, color: hecho ? VERDE : 'rgba(28,34,48,.4)' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 21v-3M21 21v-3M7 10V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px whitespace-nowrap">
        <span className="truncate font-display text-[17px] italic leading-[1.1]">{titulo}</span>
        <span className="text-[11px] text-text/50">{sub}</span>
      </span>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[16px] font-medium leading-none"
        style={{ background: hecho ? VERDE : '#F1EADC', color: hecho ? '#fff' : 'oklch(0.52 0.15 45)' }}
      >
        {hecho ? '✓' : '+'}
      </span>
    </button>
  )

  return (
    <>
      {selectedHotel
        ? fila(true, selectedHotel.name, `${totalNights} noche${totalNights === 1 ? '' : 's'} · €${selectedHotel.pricePerNight}/noche`, 'Cambiar alojamiento', () => setModalOpen(true))
        : fila(false, `Añade alojamiento en ${city}`, `${nightsPlanned}/${totalNights} noche${totalNights === 1 ? '' : 's'} por planificar`, `Añadir alojamiento en ${city}`, () => setModalOpen(true))}
      <div aria-hidden="true" className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(28,34,48,.12),transparent)' }} />

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
