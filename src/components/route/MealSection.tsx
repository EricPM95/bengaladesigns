import type { MealSlot } from '../../lib/types'
import { formatReviewCount } from '../../lib/format'

interface MealSectionProps {
  meal: MealSlot
}

export function MealSection({ meal }: MealSectionProps) {
  return (
    <div className="px-4 py-4">
      <p className="text-body font-medium text-text">
        🍽 {meal.time} → {meal.label}
      </p>
      {meal.nearbyNote && <p className="mt-1 text-small text-text-soft">{meal.nearbyNote}</p>}

      <div className="mt-2 space-y-1.5">
        {meal.restaurants.map((restaurant) => (
          <div key={restaurant.id} className="text-small">
            <div className="flex items-center justify-between gap-2">
              <span className="text-text">
                <span className="text-text-muted">{restaurant.priceTier}</span> {restaurant.name} — {restaurant.cuisine}
                {restaurant.rating != null && ` ★${restaurant.rating} (${formatReviewCount(restaurant.reviewCount ?? 0)})`}
              </span>
              <span className="shrink-0 text-text-soft">{restaurant.priceRange}</span>
            </div>
            {restaurant.description && <p className="text-caption text-text-soft">{restaurant.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
