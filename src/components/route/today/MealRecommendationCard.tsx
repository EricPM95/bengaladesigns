import type { MealSlot } from '../../../lib/types'
import { formatReviewCount } from '../../../lib/format'

interface MealRecommendationCardProps {
  meal: MealSlot
}

/** Formato reducido de MealSection (ver MealSection.tsx) para Modo Hoy — mismo contenido, en tarjeta compacta. */
export function MealRecommendationCard({ meal }: MealRecommendationCardProps) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-bg-card p-3">
      <p className="text-small font-semibold text-text">
        🍽 {meal.label} — cerca de ti
      </p>
      {meal.nearbyNote && <p className="text-caption text-text-soft">{meal.nearbyNote}</p>}

      <div className="space-y-1">
        {meal.restaurants.slice(0, 2).map((restaurant) => (
          <div key={restaurant.id} className="flex items-center justify-between gap-2 text-caption">
            <span className="text-text">
              <span className="text-text-muted">{restaurant.priceTier}</span> {restaurant.name} — {restaurant.cuisine}
              {restaurant.rating != null && ` ★${restaurant.rating} (${formatReviewCount(restaurant.reviewCount ?? 0)})`}
            </span>
            <span className="shrink-0 text-text-soft">{restaurant.priceRange}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
