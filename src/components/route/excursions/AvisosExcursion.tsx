import type { Excursion } from '../../../lib/types'

/**
 * (10R) Lo que una excursión dice debajo de su precio, en una sola pieza para todas las pantallas:
 *  · «Precio orientativo» (pequeño) mientras el precio no viene de la API del operador; con la API, el de verdad y sin esa línea.
 *  · «No reembolsable», a la vista y en estilo de aviso (no escondido), cuando la cancelación lo es.
 */
export function PrecioOrientativo({ excursion, className = '' }: { excursion: Excursion; className?: string }) {
  if (!excursion.priceOrientativo || (excursion.price <= 0 && !excursion.priceLabel)) return null
  return (
    <span data-precio-orientativo="1" className={`block text-[10.5px] leading-tight text-text-muted ${className}`}>
      Precio orientativo
    </span>
  )
}

export function AvisoNoReembolsable({ excursion, className = '' }: { excursion: Excursion; className?: string }) {
  if (excursion.cancellation !== 'no_reembolsable') return null
  return (
    <p data-no-reembolsable="1" className={`flex items-start gap-2 rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-caption font-semibold leading-snug text-accent-hover ${className}`}>
      <span aria-hidden="true" className="mt-px shrink-0">!</span>
      <span>No reembolsable{excursion.cancellationNote ? `. ${excursion.cancellationNote}` : ''}</span>
    </p>
  )
}

/** La cancelación gratuita, en pequeño (solo si el dato lo dice; sin dato no se dice nada). */
export function CancelacionGratuita({ excursion, className = '' }: { excursion: Excursion; className?: string }) {
  if (excursion.cancellation !== 'gratuita') return null
  return (
    <span data-cancelacion-gratuita="1" className={`block text-[10.5px] leading-tight text-text-muted ${className}`}>
      {excursion.cancellationNote ?? 'Cancelación gratuita'}
    </span>
  )
}

/** Todo junto, para colgarlo debajo de la línea de duración / precio / nota. */
export function AvisosExcursion({ excursion, className = '' }: { excursion: Excursion; className?: string }) {
  const sinNada = !excursion.priceOrientativo && !excursion.cancellation
  if (sinNada) return null
  return (
    <div className={`space-y-1 ${className}`}>
      <PrecioOrientativo excursion={excursion} />
      <CancelacionGratuita excursion={excursion} />
      <AvisoNoReembolsable excursion={excursion} className="mt-1.5" />
    </div>
  )
}
