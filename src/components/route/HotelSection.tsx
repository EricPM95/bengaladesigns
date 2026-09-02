import type { HotelSection as HotelSectionData } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'

interface HotelSectionProps {
  hotel: HotelSectionData
  dayId: string
}

export function HotelSection({ hotel, dayId }: HotelSectionProps) {
  const confirmHotel = useRouteStore((state) => state.confirmHotel)

  if (hotel.confirmed) {
    return (
      <div className="px-4 py-4">
        <p className="text-body font-medium text-text">🏨 Hotel: resuelto ✓</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 px-4 py-4">
      <p className="text-body font-medium text-text">🏨 Dónde alojarte en {hotel.city}</p>
      <p className="text-small text-text-soft">Mejor zona para tu ruta: {hotel.recommendedArea}</p>

      <div className="space-y-1.5">
        {hotel.options.map((option) => (
          <div key={option.id} className="flex items-center justify-between gap-2 text-small">
            <span className="text-text">
              {option.name} {'★'.repeat(option.stars)}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-text-soft">€{option.pricePerNight}/noche</span>
              {option.bookUrl && (
                <a
                  href={option.bookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-bg-hover px-2.5 py-1 text-caption font-medium text-text transition-colors hover:bg-border"
                >
                  Reservar →
                </a>
              )}
            </span>
          </div>
        ))}
      </div>

      {hotel.browseUrl && (
        <a href={hotel.browseUrl} target="_blank" rel="noopener noreferrer" className="block text-small font-medium text-accent hover:text-accent-hover">
          🔍 Ver más en Booking.com →
        </a>
      )}

      <button type="button" onClick={() => confirmHotel(dayId)} className="text-small font-medium text-accent hover:text-accent-hover">
        ✅ Ya tengo mi hotel
      </button>
    </div>
  )
}
