import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { DestinationPlace } from '../../../lib/destinationPlacesApi'
import { findRestaurantSubCategory } from '../../../lib/placeCategories'
import { textoRecomendacion } from '../../../lib/recomendaciones'
import { buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { ClockIcon } from '../../ui/TimeIcons'
import { Icono } from '../../ui/Icono'

interface RestaurantDetailSheetProps {
  /** null = cerrada. */
  restaurant: DestinationPlace | null
  likeCount: number
  /** El número que se puede enseñar (real desde 20, o el de prueba); null = ninguno. */
  likeShown: number | null
  liked: boolean
  onToggleLike: () => void
  onClose: () => void
}

function PinIcon() {
  return (
    <Icono nombre="mapa" className="h-4 w-4 shrink-0" />
  )
}

function PlateIcon() {
  return (
    <Icono nombre="comida" className="h-4 w-4 shrink-0" />
  )
}

function BulbIcon() {
  return (
    <Icono nombre="tips" className="h-4 w-4 shrink-0" />
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <Icono nombre="gusta" className="h-5 w-5 shrink-0" relleno={filled} />
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
export function RestaurantDetailSheet({ restaurant, likeCount, likeShown, liked, onToggleLike, onClose }: RestaurantDetailSheetProps) {
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
                  {textoRecomendacion(likeShown, likeCount)}
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
