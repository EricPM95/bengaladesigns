import type { PlacePurchaseInfo } from '../../../lib/mockDayDetail'
import { Button } from '../../ui/Button'
import { AffiliateCardCarousel } from '../../ui/AffiliateCardCarousel'
import { TextLink } from './TextLink'

interface PurchaseSectionProps {
  purchase: PlacePurchaseInfo
}

/**
 * Sección de compra de una parada — dos formas según `afiliacion_disponible`:
 * - true: "Entradas, tours y visitas" — entradas y tours unificados en un único carrusel de
 *   tarjetas (foto + nombre + precio, sin distinguir formato entre uno y otro) + un botón CTA.
 *   Nunca se nombra al proveedor de afiliación. El formato de lista con precio a la derecha queda
 *   reservado exclusivamente para "Tickets" — no se usa aquí.
 * - false: "Tickets", solo la entrada oficial conocida (si hay precio) + enlace de texto a la web
 *   oficial — sin botón, no hay monetización posible en ese caso.
 */
export function PurchaseSection({ purchase }: PurchaseSectionProps) {
  if (!purchase.afiliacion_disponible) {
    const officialTicket = purchase.entradas[0]
    return (
      <div className="space-y-2">
        <h4 className="text-body font-semibold text-text">Tickets</h4>
        {officialTicket && (
          <div className="flex items-center justify-between gap-3 text-small">
            <div>
              <p className="font-medium text-text">{officialTicket.nombre}</p>
              {officialTicket.nota && <p className="text-caption text-text-muted">{officialTicket.nota}</p>}
            </div>
            <span className="shrink-0 font-semibold text-text">{officialTicket.precio === 0 ? 'Gratis' : `${officialTicket.precio}€`}</span>
          </div>
        )}
        <TextLink href="#">Comprar en la web oficial</TextLink>
      </div>
    )
  }

  const cards = [
    ...purchase.entradas.map((entrada, index) => ({ id: `entrada-${index}`, name: entrada.nombre, price: entrada.precio, photoUrl: entrada.imagen ?? '' })),
    ...(purchase.tours ?? []).map((tour, index) => ({ id: `tour-${index}`, name: tour.nombre, price: tour.precio, photoUrl: tour.imagen })),
  ]
  if (cards.length === 0) return null

  return (
    <div className="space-y-3">
      <h4 className="text-body font-semibold text-text">Entradas, tours y visitas</h4>
      <AffiliateCardCarousel cards={cards} />
      <Button className="w-full font-bold shadow-sm">Reservar →</Button>
    </div>
  )
}
