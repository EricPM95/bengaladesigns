import { useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { ReservasItemRow } from './ReservasItemRow'
import { AccommodationHotelModal } from '../dayDetail/AccommodationHotelModal'

interface AccommodationRowProps {
  segmentDayId: string
  city: string
  totalNights: number
}

/** Misma clave de store (`accommodationSelections`) y mismo modal de selección que el bloque de alojamiento en DIAS — añadir aquí o allí actualiza ambos sitios. */
export function AccommodationRow({ segmentDayId, city, totalNights }: AccommodationRowProps) {
  const hotel = useRouteStore((state) => state.accommodationSelections[segmentDayId])
  const setAccommodationHotel = useRouteStore((state) => state.setAccommodationHotel)
  const [open, setOpen] = useState(false)

  return (
    <>
      <ReservasItemRow
        kind="accommodation"
        label={`Alojamiento en ${city}`}
        resolved={Boolean(hotel)}
        subtitle={hotel ? `${hotel.name} · ${totalNights} noche${totalNights === 1 ? '' : 's'}` : undefined}
        onClick={() => setOpen(true)}
        bookAction={{
          label: 'Reservar',
          href: 'https://www.stay22.com',
          onGet: () =>
            setAccommodationHotel(segmentDayId, {
              id: `stay22-${segmentDayId}`,
              name: 'Reservado vía Stay22',
              stars: 0,
              pricePerNight: 0,
              rating: 0,
              provider: 'Booking',
              photoUrl: '',
            }),
        }}
      />
      <AccommodationHotelModal
        city={open ? city : null}
        selected={hotel ?? null}
        onSelect={(selectedHotel) => {
          setAccommodationHotel(segmentDayId, selectedHotel)
          setOpen(false)
        }}
        onRemove={() => setAccommodationHotel(segmentDayId, null)}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
