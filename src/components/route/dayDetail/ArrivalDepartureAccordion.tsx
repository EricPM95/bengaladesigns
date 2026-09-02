import { useState } from 'react'
import { buildPrivateTransferCta, type ArrivalDepartureDetail } from '../../../lib/mockDayDetail'
import { Button } from '../../ui/Button'
import { TextLink } from './TextLink'
import { TipBox } from './TipBox'

interface ArrivalDepartureAccordionProps {
  detail: ArrivalDepartureDetail
  expanded: boolean
  onToggle: () => void
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22L12 21l4.5 1.5V20.5L14 19v-5.5l7 2.5z" />
    </svg>
  )
}

/**
 * Acordeón de llegada/vuelta — badge de avión (en vez de número), pestañas de aeropuerto si el
 * destino tiene más de uno, tabla de tiempos+precios de transporte público, tabla de distancias a
 * zonas de alojamiento típicas, un tip, un enlace a horarios oficiales y un CTA de traslado
 * privado — siempre después de la info de transporte público, nunca como primera opción.
 */
export function ArrivalDepartureAccordion({ detail, expanded, onToggle }: ArrivalDepartureAccordionProps) {
  const [airportIndex, setAirportIndex] = useState(0)
  const airport = detail.airports[airportIndex]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-bg-hover">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-hover text-white" aria-hidden="true">
          <PlaneIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-text">{detail.headline}</p>
          <p className="truncate text-caption text-text-soft">{detail.subtitle}</p>
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border p-3">
          {detail.airports.length > 1 && (
            <div className="flex gap-1.5">
              {detail.airports.map((option, index) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setAirportIndex(index)}
                  className={`rounded-lg border px-2.5 py-1 text-caption font-semibold transition-colors ${
                    index === airportIndex ? 'border-accent text-accent' : 'border-border text-text-soft hover:border-border-accent'
                  }`}
                >
                  {option.name} {option.code && `(${option.code})`}
                </button>
              ))}
            </div>
          )}

          <p className="text-small text-text-soft">{detail.whyRecommendation}</p>

          <div className="space-y-1.5">
            <h4 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Cómo llegar al centro</h4>
            <div className="divide-y divide-border rounded-lg border border-border">
              {airport.transitOptions.map((option) => (
                <div key={option.name} className="flex items-center justify-between gap-3 px-3 py-2 text-small">
                  <span className="text-text">
                    {option.name}
                    {option.stopName && <span className="text-text-muted"> · {option.stopName}</span>}
                  </span>
                  <span className="shrink-0 font-medium text-text-soft">
                    {option.durationLabel} · {option.price === 0 ? 'Gratis' : `${option.price}€`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Desde ahí a tu zona de alojamiento</h4>
            <div className="divide-y divide-border rounded-lg border border-border">
              {airport.hotelZoneDistances.map((zone) => (
                <div key={zone.zone} className="flex items-center justify-between gap-3 px-3 py-2 text-small">
                  <span className="text-text">{zone.zone}</span>
                  <span className="shrink-0 text-right font-medium text-text-soft">
                    {zone.durationLabel}
                    {zone.price ? ` · ${zone.price}€` : ''}
                    {zone.stopName && <span className="block text-caption text-text-muted">{zone.stopName}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <TipBox>{airport.tip}</TipBox>

          <p className="text-caption text-text-muted">{detail.disclaimer}</p>

          <TextLink href="#">{airport.officialLinkLabel}</TextLink>

          {/* flightHour siempre null por ahora — no hay datos de vuelo registrados en Reservas todavía. */}
          <Button className="w-full font-bold shadow-sm">
            {buildPrivateTransferCta(airport.transitOptions, airport.privateTransferMinutes, null)} →
          </Button>
        </div>
      )}
    </div>
  )
}
