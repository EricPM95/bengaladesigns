import { mockHotels, type MockHotelResult } from '../../../lib/mockAffiliateData'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { ConfirmDeleteButton } from '../../ui/ConfirmDeleteButton'

interface AccommodationHotelModalProps {
  city: string | null
  /** Hotel ya guardado para esta estancia, si lo hay — precarga la ficha en modo edición (marca el hotel elegido y ofrece Eliminar). */
  selected?: MockHotelResult | null
  onSelect: (hotel: MockHotelResult) => void
  onRemove?: () => void
  onClose: () => void
}

/**
 * Selección de hotel para una estancia del día — mismo patrón de tarjeta ya usado en "Hoteles en
 * {destino}" (DestinationDetailModal.tsx), con datos mock vía mockHotels() hasta que haya una
 * integración real de Booking/Expedia. Es la misma ficha tanto para añadir como para editar: si ya
 * hay un hotel guardado, aparece marcado como seleccionado (datos precargados) y con un botón
 * Eliminar al final — reutilizada tal cual desde DIAS, RESERVAS y RUTA (misma clave de store).
 */
export function AccommodationHotelModal({ city, selected = null, onSelect, onRemove, onClose }: AccommodationHotelModalProps) {
  const hotels = city ? mockHotels(city) : []

  return (
    <Modal open={city !== null} onClose={onClose}>
      {city && (
        <div className="space-y-4">
          <h2 className="font-display text-h2 font-semibold text-text">Hoteles en {city}</h2>
          <div className="space-y-2">
            {hotels.map((hotel) => {
              const isSelected = selected?.id === hotel.id
              return (
                <div
                  key={hotel.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-small ${
                    isSelected ? 'border-accent bg-accent-soft/40' : 'border-border'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">
                      {hotel.name} {'★'.repeat(hotel.stars)}
                    </p>
                    <p className="text-text-muted">
                      {hotel.provider} · ★{hotel.rating} · €{hotel.pricePerNight}/noche
                    </p>
                  </div>
                  {isSelected ? (
                    <span className="shrink-0 text-caption font-semibold text-accent-hover">✓ Seleccionado</span>
                  ) : (
                    <Button onClick={() => onSelect(hotel)} className="shrink-0 px-3 py-1.5 text-caption">
                      Seleccionar
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          {selected && onRemove && (
            <ConfirmDeleteButton
              itemLabel={`el alojamiento en ${city}`}
              onConfirm={() => {
                onRemove()
                onClose()
              }}
            />
          )}
        </div>
      )}
    </Modal>
  )
}
