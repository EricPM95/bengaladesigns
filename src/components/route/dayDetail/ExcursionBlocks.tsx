import { useState } from 'react'
import type { CuratedAlternative, Excursion } from '../../../lib/types'

/**
 * Prompt 4 — las piezas de excursión de la ficha de un día, en un solo sitio porque comparten el
 * mismo lenguaje visual y se combinan entre ellas según la prominencia del día (ver DayType y
 * getDayConfig en routeAlgorithm.js):
 *
 *   subtle    -> ExcursionLink al final, y nada más.
 *   prominent -> ExcursionBanner encima de las paradas, SIN quitarlas, + ExcursionLink al final.
 *   primary   -> ExcursionOptions como contenido del día + CuratedAlternativeBanner si había ruta.
 *   manual    -> ManualDayOptions.
 *
 * Los precios y valoraciones son PLACEHOLDER hasta integrar Civitatis/GYG — nunca se presentan como
 * una tarifa cerrada, siempre como "desde".
 */

/** Trazo fino y gris, sin relleno — regla de iconos funcionales del proyecto. */
function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
      <path d="m9 4-6 2.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
      <path d="M9 4v13M15 6.5v13" />
    </svg>
  )
}

function BusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
      <rect x="4" y="4" width="16" height="12" rx="2" />
      <path d="M4 10h16M7 20v-2M17 20v-2" />
      <circle cx="8" cy="13.5" r="0.6" fill="currentColor" />
      <circle cx="16" cy="13.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

function formatPrice(excursion: Excursion): string {
  return excursion.priceLabel ?? (excursion.price > 0 ? `${excursion.price}€` : '')
}

function RatingLabel({ excursion }: { excursion: Excursion }) {
  if (!excursion.rating) return null
  return (
    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-caption text-text-soft">
      <span aria-hidden="true">⭐</span>
      {excursion.rating.toFixed(1)}
      {excursion.reviewCount ? <span className="text-text-muted">({excursion.reviewCount.toLocaleString('es')})</span> : null}
    </span>
  )
}

/** Días de prominencia SUTIL: un link y nada más. El 90% de los viajeros no busca una excursión el
    día 2 en Roma, y esto no les debe estorbar. */
export function ExcursionLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 border-t border-border px-3 py-3 text-caption font-medium text-text-soft transition-colors hover:text-accent-hover"
    >
      <CompassIcon />
      {label}
      <span aria-hidden="true">→</span>
    </button>
  )
}

/**
 * Días de prominencia PROMINENTE: el viajero ve su ruta curada Y las excursiones. No pierde nada,
 * elige. Se puede cerrar sin perder la ruta (regla 9) y al cerrarse deja el link sutil de siempre.
 */
export function ExcursionBanner({
  destination,
  highlights,
  onSeeAll,
}: {
  destination: string
  highlights: Excursion[]
  onSeeAll: () => void
}) {
  const [dismissed, setDismissed] = useState(false)
  if (highlights.length === 0) return null
  if (dismissed) return <ExcursionLink label="¿Prefieres una excursión este día?" onClick={onSeeAll} />

  return (
    <section className="rounded-xl border border-accent/30 bg-accent-soft/50 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-body font-semibold text-text">🌍 ¿Te apetece una excursión?</h2>
          <p className="mt-0.5 text-caption text-text-soft">Tienes tu ruta preparada, pero muchos viajeros aprovechan este día para salir de {destination}.</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Ocultar excursiones"
          title="No, gracias"
          className="shrink-0 rounded-lg px-1.5 py-0.5 text-caption text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
        >
          ✕
        </button>
      </div>

      <ul className="mt-2.5 divide-y divide-border/60 rounded-lg bg-bg-card">
        {highlights.map((excursion) => (
          <li key={excursion.id}>
            <button type="button" onClick={onSeeAll} className="flex w-full items-center gap-2 p-2 text-left transition-colors hover:bg-bg-hover">
              <span className="shrink-0 text-base" aria-hidden="true">
                {excursion.emoji ?? '🚌'}
              </span>
              <span className="min-w-0 flex-1 truncate text-small font-medium text-text">{excursion.title}</span>
              {formatPrice(excursion) && <span className="shrink-0 whitespace-nowrap text-caption text-text-soft">desde {formatPrice(excursion)}</span>}
              <RatingLabel excursion={excursion} />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSeeAll}
        className="mt-2.5 w-full rounded-lg bg-accent px-3 py-2 text-small font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Ver todas las excursiones →
      </button>
    </section>
  )
}

/**
 * Días de EXCURSIÓN PURA: las tarjetas son el contenido del día. Un toque selecciona, otro
 * deselecciona — nunca se queda una elegida sin querer, porque elegir aquí es lo que enciende el
 * CTA de reserva.
 */
export function ExcursionOptions({
  options,
  selectedId,
  onSelect,
}: {
  options: Excursion[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const selected = options.find((option) => option.id === selectedId) ?? null

  return (
    <div className="space-y-2">
      {options.map((excursion) => {
        const isSelected = excursion.id === selectedId
        return (
          <button
            key={excursion.id}
            type="button"
            onClick={() => onSelect(isSelected ? null : excursion.id)}
            aria-pressed={isSelected}
            className={`flex w-full gap-3 rounded-xl border p-3 text-left transition-colors ${
              isSelected ? 'border-accent bg-accent-soft' : 'border-border bg-bg-card hover:bg-bg-hover'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? 'border-accent' : 'border-border'
              }`}
            >
              {isSelected && <span className="h-2 w-2 rounded-full bg-accent" />}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="shrink-0 text-base" aria-hidden="true">
                  {excursion.emoji ?? '🚌'}
                </span>
                <span className="min-w-0 flex-1 text-small font-semibold text-text">{excursion.title}</span>
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-soft">
                <span className="whitespace-nowrap">{excursion.durationLabel}</span>
                {formatPrice(excursion) && (
                  <>
                    <span className="text-text-muted" aria-hidden="true">
                      ·
                    </span>
                    <span className="whitespace-nowrap">desde {formatPrice(excursion)}</span>
                  </>
                )}
                {excursion.rating ? (
                  <>
                    <span className="text-text-muted" aria-hidden="true">
                      ·
                    </span>
                    <RatingLabel excursion={excursion} />
                  </>
                ) : null}
              </span>
              {/* La descripción solo cuando está elegida: con seis tarjetas abiertas a la vez no se
                  compara nada, y comparar es justo lo que se viene a hacer a esta pantalla. */}
              {isSelected && excursion.description && <span className="mt-2 block text-caption leading-relaxed text-text-soft">{excursion.description}</span>}
            </span>
          </button>
        )
      })}

      {selected && (
        <button
          type="button"
          // Placeholder deliberado: hasta que estén los enlaces de afiliado (Civitatis/GYG) esto no
          // lleva a ninguna parte, y prometer una reserva que no existe sería peor que no ofrecerla.
          disabled
          className="w-full cursor-not-allowed rounded-xl bg-accent px-3 py-3 text-small font-semibold text-white opacity-70"
        >
          🎟 Reservar {selected.title}
          {formatPrice(selected) ? ` — desde ${formatPrice(selected)}` : ''}
        </button>
      )}
    </div>
  )
}

/**
 * El banner inverso de un día de excursión: si este día TENÍA una ruta escrita a mano, se ofrece
 * volver a ella con un adelanto de lo que contiene. Sin esto, convertir un día en excursión hacía
 * desaparecer contenido curado en silencio — que es exactamente lo que no puede pasar (regla 3).
 */
export function CuratedAlternativeBanner({ alternative, onRestore }: { alternative: CuratedAlternative; onRestore: () => void }) {
  return (
    <button
      type="button"
      onClick={onRestore}
      className="flex w-full items-start gap-2.5 rounded-xl border border-border bg-bg-card p-3 text-left transition-colors hover:bg-bg-hover"
    >
      <span className="mt-0.5 text-text-muted">
        <MapIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small font-semibold text-text">Tenemos una ruta preparada para hoy</span>
        <span className="mt-0.5 block text-caption text-text-soft">
          {alternative.title}
          {alternative.places.length > 0 ? ` · ${alternative.places.join(' · ')}` : ''}
        </span>
        <span className="mt-1 block text-caption font-medium text-accent-hover">¿La prefieres? →</span>
      </span>
    </button>
  )
}

/** Día LIBRE: dos salidas grandes y nada más. El día está en blanco a propósito. */
export function ManualDayOptions({ onSearchPlaces, onSearchExcursions }: { onSearchPlaces: () => void; onSearchExcursions: () => void }) {
  return (
    <div className="space-y-3">
      <p className="px-1 text-small text-text-soft">Monta tu día a medida: explora la ciudad o haz una excursión.</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <MapIcon />, label: 'Buscar lugares', hint: 'Mapa, filtros y buscador', onClick: onSearchPlaces },
          { icon: <BusIcon />, label: 'Buscar excursiones', hint: 'Salir de la ciudad', onClick: onSearchExcursions },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={option.onClick}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-5 text-center transition-colors hover:bg-bg-hover"
          >
            <span className="text-text-muted">{option.icon}</span>
            <span className="text-small font-semibold text-text">{option.label}</span>
            <span className="text-caption text-text-soft">{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** "Montar día manualmente" — la tercera salida, presente en todos los tipos menos el propio manual. */
export function ManualDayLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 px-3 py-3 text-caption font-medium text-text-soft transition-colors hover:text-accent-hover"
    >
      <ClipboardIcon />
      Montar día manualmente
      <span aria-hidden="true">→</span>
    </button>
  )
}

/**
 * El día de excursión, tal como se le presenta al viajero: una propuesta concreta, no un formulario
 * en blanco con seis opciones iguales.
 *
 * Tres piezas, en este orden y por este motivo:
 *   1. La prueba social arriba, porque es lo que contesta "¿y esto por qué me lo propones?".
 *   2. UNA excursión en grande, ya elegida — la más popular del destino. El viajero que dice que sí
 *      no tiene que hacer nada.
 *   3. Las alternativas PLEGADAS. Seis tarjetas abiertas a la vez no se comparan; abrirlas es un
 *      toque para quien quiera comparar de verdad.
 *
 * Y abajo del todo, la salida: seguir en la ciudad. Nunca escondida — un día de excursión que no se
 * pueda rechazar es una imposición, no una propuesta.
 */
export function ExcursionDayProposal({
  destination,
  options,
  selectedId,
  socialProof,
  onSelect,
  onDecline,
}: {
  destination: string
  options: Excursion[]
  selectedId: string | null
  socialProof?: string | null
  onSelect: (id: string | null) => void
  onDecline: () => void
}) {
  const [showAll, setShowAll] = useState(false)
  const featured = options.find((option) => option.id === selectedId) ?? options[0] ?? null
  const alternatives = options.filter((option) => option.id !== featured?.id)
  if (!featured) return null

  return (
    <div className="space-y-3">
      {socialProof && (
        <p className="rounded-xl bg-accent-soft px-3 py-2.5 text-small leading-relaxed text-accent-hover">
          <span aria-hidden="true">✨ </span>
          {socialProof}
        </p>
      )}

      <div className="rounded-xl border border-accent bg-accent-soft p-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none" aria-hidden="true">
            {featured.emoji ?? '🚌'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-text">{featured.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-caption text-text-soft">
              <span className="whitespace-nowrap">{featured.durationLabel}</span>
              {formatPrice(featured) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">desde {formatPrice(featured)}</span>
                </>
              )}
              {featured.rating ? (
                <>
                  <span aria-hidden="true">·</span>
                  <RatingLabel excursion={featured} />
                </>
              ) : null}
            </p>
          </div>
        </div>
        {featured.description && <p className="mt-2 text-caption leading-relaxed text-text-soft">{featured.description}</p>}
        {featured.bookUrl && (
          <a
            href={featured.bookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-full rounded-xl bg-accent py-2.5 text-center text-small font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ver disponibilidad
          </a>
        )}
      </div>

      {alternatives.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowAll((open) => !open)}
            aria-expanded={showAll}
            className="w-full rounded-xl border border-border bg-bg-card py-2 text-caption font-semibold text-text-soft transition-colors hover:bg-bg-hover"
          >
            {showAll ? 'Ocultar alternativas' : `Ver más excursiones (${alternatives.length})`}
          </button>
          {showAll && <ExcursionOptions options={alternatives} selectedId={selectedId} onSelect={onSelect} />}
        </>
      )}

      <button
        type="button"
        onClick={onDecline}
        className="w-full pt-1 text-center text-caption text-text-muted underline transition-colors hover:text-text-soft"
      >
        ¿Prefieres seguir en {destination}? Te montamos otro día de ruta
      </button>
    </div>
  )
}
