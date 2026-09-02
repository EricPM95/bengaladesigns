export interface AffiliateCard {
  id: string
  name: string
  price: number
  photoUrl: string
}

interface AffiliateCardCarouselProps {
  cards: AffiliateCard[]
  /** Ej. "/noche" para hoteles — vacío para actividades (precio por persona/entrada, sin sufijo). */
  priceSuffix?: string
}

/** Carrusel horizontal de tarjetas foto+nombre+precio — mismo formato ya usado en PurchaseSection.tsx (entradas/tours de un día), reutilizado aquí para hoteles y actividades en la ficha de destino de RUTA. */
export function AffiliateCardCarousel({ cards, priceSuffix = '' }: AffiliateCardCarouselProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {cards.map((card) => (
        <div key={card.id} className="w-40 shrink-0 overflow-hidden rounded-xl border border-border">
          <img src={card.photoUrl} alt="" className="h-24 w-full object-cover" />
          <div className="space-y-0.5 p-2">
            <p className="line-clamp-2 text-caption font-medium text-text">{card.name}</p>
            <p className="text-small font-semibold text-text">{card.price === 0 ? 'Gratis' : `€${card.price}${priceSuffix}`}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
