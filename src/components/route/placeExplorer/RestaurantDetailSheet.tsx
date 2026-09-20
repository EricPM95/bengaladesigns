import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { DestinationPlace } from '../../../lib/destinationPlacesApi'
import { findRestaurantSubCategory } from '../../../lib/placeCategories'
import { buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { ClockIcon } from '../../ui/TimeIcons'

interface RestaurantDetailSheetProps {
  /** null = cerrada. */
  restaurant: DestinationPlace | null
  likeCount: number
  liked: boolean
  onToggleLike: () => void
  onClose: () => void
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function PlateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  )
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.3.3.5.7.5 1.1h6c0-.4.2-.8.5-1.1A6 6 0 0 0 12 3Z" />
    </svg>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d="M12 20s-7-4.6-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.4 12 20 12 20Z" />
    </svg>
  )
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-1 border-t border-border pt-3">
      <h3 className="flex items-center gap-1.5 text-body font-semibold text-text">
        {icon}
        {title}
      </h3>
      <p className="text-small text-text-soft">{children}</p>
    </div>
  )
}

/**
 * Ficha de un restaurante — deliberadamente distinta (y mucho más corta) que la de 3 pestañas de una
 * parada: aquí no hay "qué ver", ni entradas, ni tips de visita. Lo que se pregunta de un sitio para
 * comer es qué pedir, cuánto cuesta, si está abierto y cómo llegar, y eso cabe en una pantalla.
 *
 * Nunca lleva "Añadir a mi ruta": un restaurante no es una parada del itinerario (ver `kind` en
 * destinationPlacesApi.ts). El botón es "Cómo llegar".
 */
export function RestaurantDetailSheet({ restaurant, likeCount, liked, onToggleLike, onClose }: RestaurantDetailSheetProps) {
  const sub = restaurant ? findRestaurantSubCategory(restaurant.sub_category) : null

  return (
    <AnimatePresence>
      {restaurant && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="map-cover-overlay fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-border bg-bg-card px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Volver"
              title="Volver"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-card text-text transition-colors hover:bg-bg-hover"
            >
              ←
            </button>
            <p className="min-w-0 flex-1 truncate text-center text-body font-semibold text-text">{restaurant.name}</p>
            <span className="h-9 w-9 shrink-0" aria-hidden="true" />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-lg space-y-3 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {sub && (
                  <span className="flex items-center gap-1 rounded-full bg-bg-hover px-2.5 py-1 text-caption font-semibold text-text-soft">
                    <span aria-hidden="true">{sub.icon}</span>
                    {sub.label}
                  </span>
                )}
                {restaurant.price_range && (
                  <span className="rounded-full bg-bg-hover px-2.5 py-1 text-caption font-semibold text-text-soft">{restaurant.price_range}</span>
                )}
                {restaurant.avg_price_person && <span className="text-caption text-text-muted">{restaurant.avg_price_person} por persona</span>}
              </div>

              {restaurant.best_for && <p className="text-small text-text-soft">{restaurant.best_for}</p>}

              <div className="flex items-center gap-2 rounded-xl border border-border p-2.5">
                <button
                  type="button"
                  onClick={onToggleLike}
                  aria-pressed={liked}
                  aria-label={liked ? `Quitar me gusta de ${restaurant.name}` : `Me gusta ${restaurant.name}`}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    liked ? 'text-accent' : 'text-text-muted hover:text-text-soft'
                  }`}
                >
                  <HeartIcon filled={liked} />
                </button>
                <p className="text-small text-text-soft">
                  {likeCount === 0
                    ? 'Sé el primero en recomendarlo'
                    : `${likeCount} ${likeCount === 1 ? 'viajero lo recomienda' : 'viajeros lo recomiendan'}`}
                </p>
              </div>

              {restaurant.what_to_order && (
                <Section icon={<PlateIcon />} title="Qué pedir">
                  {restaurant.what_to_order}
                </Section>
              )}

              {restaurant.tip && (
                <Section icon={<BulbIcon />} title="Tip">
                  {restaurant.tip}
                </Section>
              )}

              {restaurant.schedule && (
                <Section icon={<ClockIcon />} title="Horario">
                  {restaurant.schedule}
                </Section>
              )}

              {restaurant.address && (
                <Section icon={<PinIcon />} title="Dirección">
                  {restaurant.address}
                </Section>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-bg-card p-3">
            <a
              // Coordenadas en vez de la dirección escrita: el número de portal romano ("Via dei
              // Vascellari, 29") lo interpretan mal muchas veces; el punto exacto, nunca.
              href={buildGoogleMapsUrlFromHere(`${restaurant.coordinates.lat},${restaurant.coordinates.lng}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-body font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Cómo llegar →
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
