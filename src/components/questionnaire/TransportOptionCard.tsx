import type { TransportOption } from '../../lib/types'
import { Badge } from '../ui/Badge'

interface TransportOptionCardProps {
  option: TransportOption
  onClick: () => void
}

/**
 * Tarjeta de una opción de transporte de llegada (Fase 1) — compartida por cualquier arquetipo,
 * no reimplementada por cada uno. La etiqueta "Recomendada" es una propiedad del sistema de
 * tarjetas en sí, no de la lógica de un arquetipo concreto: se muestra siempre que
 * `option.recommended` venga marcado desde Paso A (viabilidad geográfica, ver
 * src/lib/transportFeasibility.ts), sea cual sea el arquetipo que la esté mostrando.
 */
export function TransportOptionCard({ option, onClick }: TransportOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-left transition-colors hover:border-border-accent hover:bg-bg-hover"
    >
      {option.recommended && (
        <span className="absolute right-3 top-3">
          <Badge variant="accent">Recomendada</Badge>
        </span>
      )}
      <span className="flex items-center gap-2 pr-24 text-body font-medium text-text">
        <span className="text-lg leading-none">{option.icon}</span>
        {option.title}
      </span>
      {option.description && <p className="mt-1 text-small text-text-soft">{option.description}</p>}
      {option.subtitle && <p className="mt-1 text-small italic text-accent-hover">{option.subtitle}</p>}
      {(option.estimated_duration || option.estimated_price) && (
        <p className="mt-1.5 text-small text-text-muted">{[option.estimated_duration, option.estimated_price].filter(Boolean).join(' · ')}</p>
      )}
    </button>
  )
}
