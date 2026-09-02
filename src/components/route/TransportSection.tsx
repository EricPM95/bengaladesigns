import type { TransportSegment, TransportSegmentAlternative } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { transportModeIcon } from '../../lib/cityTransitionTransport'

interface TransportSectionProps {
  transport: TransportSegment
  dayId: string
}

const MODE_LABEL: Record<TransportSegment['mode'], string> = {
  flight: 'Vuelo',
  car: 'Coche',
  train: 'Tren',
  bus: 'Autobús',
  ferry: 'Ferry',
  multimodal: 'Trayecto',
  campervan: 'Autocaravana',
  transfer: 'Transfer organizado',
}

function AlternativeCard({ alternative, onClick }: { alternative: TransportSegmentAlternative; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-left transition-colors hover:border-border-accent hover:bg-bg-hover"
    >
      <span className="flex items-center gap-2 text-body font-medium text-text">
        <span className="text-lg leading-none">{transportModeIcon(alternative.mode)}</span>
        {MODE_LABEL[alternative.mode]}
      </span>
      {(alternative.durationLabel || alternative.priceLabel) && (
        <p className="mt-1.5 text-small text-text-muted">{[alternative.durationLabel, alternative.priceLabel].filter(Boolean).join(' · ')}</p>
      )}
    </button>
  )
}

/**
 * Transporte entre dos tramos de una ruta ya generada — lo rellenan multidestino_tren_o_vuelo
 * (Paso 4, vía `buildTransportSegment` en `cityTransitionTransport.ts`) y
 * multidestino_mixto_o_circuito (Paso 3, vía `buildPhaseTransportSegment` en
 * `phaseTransitionTransport.ts`) — mismo componente para ambos, solo cambia quién construyó el
 * `TransportSegment`. Sin alternativas → resuelto automáticamente (pase, excepción de pase,
 * fallback de autobús/transfer), siempre con el motivo visible si fue forzado. Con alternativas →
 * tarjetas para elegir entre las vías reales, con "Cambiar" una vez resuelto.
 */
export function TransportSection({ transport, dayId }: TransportSectionProps) {
  const chooseTransportSegment = useRouteStore((state) => state.chooseTransportSegment)
  const resetTransportSegment = useRouteStore((state) => state.resetTransportSegment)

  if (!transport.confirmed && transport.alternatives.length > 0) {
    return (
      <div className="space-y-2 px-4 py-4">
        <p className="text-body font-medium text-text">
          🧭 Cómo llegar: {transport.fromCity} → {transport.toCity}
        </p>
        <div className="space-y-2">
          {transport.alternatives.map((alternative) => (
            <AlternativeCard key={alternative.mode} alternative={alternative} onClick={() => chooseTransportSegment(dayId, alternative)} />
          ))}
        </div>
      </div>
    )
  }

  const canChange = transport.alternatives.length > 0

  return (
    <div className="space-y-2 px-4 py-4">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-accent bg-accent-soft px-4 py-3">
        <span className="flex items-center gap-2 text-body font-medium text-accent-hover">
          <span className="text-lg leading-none">{transportModeIcon(transport.mode)}</span>
          <span>
            {transport.fromCity} → {transport.toCity}: {MODE_LABEL[transport.mode]}
          </span>
          <span aria-hidden="true">✓</span>
        </span>
        {canChange && (
          <button
            type="button"
            onClick={() => resetTransportSegment(dayId)}
            className="shrink-0 text-small font-medium italic text-accent hover:text-accent-hover"
          >
            Cambiar
          </button>
        )}
      </div>

      {transport.forcedReason && <p className="text-small text-text-muted">{transport.forcedReason}</p>}

      {transport.rentalPickupCity && transport.rentalReturnCity && transport.rentalPickupCity !== transport.rentalReturnCity && (
        <p className="text-small text-text-muted">
          🔑 Recogida en {transport.rentalPickupCity} · Devolución en {transport.rentalReturnCity} — puede llevar cargo por devolución en otra ciudad,
          revísalo al reservar.
        </p>
      )}

      {(transport.durationLabel || transport.priceLabel || transport.searchUrl) && (
        <p className="text-small text-text-soft">
          {[transport.durationLabel, transport.priceLabel].filter(Boolean).join(' · ')}
          {transport.searchUrl && (
            <>
              {' · '}
              <a href={transport.searchUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:text-accent-hover">
                🔍 Buscar {MODE_LABEL[transport.mode].toLowerCase()} →
              </a>
            </>
          )}
        </p>
      )}
    </div>
  )
}
