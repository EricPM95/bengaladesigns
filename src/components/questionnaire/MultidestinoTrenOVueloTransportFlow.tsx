import { useEffect, useRef } from 'react'
import type { Place, TransportOption } from '../../lib/types'
import { useTransportFeasibility } from '../../hooks/useTransportFeasibility'
import { buildFlightOption, getMultidestinoCandidates } from '../../lib/multidestinoTrenOVueloTransport'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'
import { ChoiceButton } from './ChoiceButton'
import { TransportBanner } from './TransportBanner'
import { TransportOptionCard } from './TransportOptionCard'
import { SelectedOptionCard } from './SelectedOptionCard'

interface MultidestinoTrenOVueloTransportFlowProps {
  origin: Place | null
  destinationPlace: Place | null
  destinationName: string
  transportOption: TransportOption | null
  /** Nombre del pase de transporte dominante del destino (ej. "JR Pass"), o null si no hay ninguno lo bastante dominante. */
  paseDominante: string | null
  /** Respuesta a "¿Vas a viajar con {paseDominante}?" — null mientras no se ha preguntado. */
  travelPassConfirmed: boolean | null
  onTransportOptionChange: (option: TransportOption | null) => void
  onTravelPassConfirmedChange: (confirmed: boolean | null) => void
}

/**
 * Flujo de transporte para multidestino_tren_o_vuelo — cadena de ciudades conectadas por tren o
 * vuelo interno, nunca coche (Japón, Interrail Europa, corredor NYC-DC-Boston).
 *
 * FASE 1 (cómo llegar a la primera ciudad): mismo Paso A universal que el resto de arquetipos,
 * filtrado a Avión/Tren/Autobús (Paso B, ver getMultidestinoCandidates) — nunca ferry ni roadtrip
 * con vehículo propio, ninguno de los dos encaja en un arquetipo sin coche en ningún tramo.
 *
 * FASE 2 (pregunta del pase, una sola vez): solo si `paseDominante` no es null, justo después de
 * resolver la llegada — "¿Vas a viajar con {paseDominante}?" Sí/No, para todo el viaje. Si es
 * null, no hay Fase 2 en absoluto: se resuelve en cuanto hay transportOption. El transporte de
 * cada tramo entre ciudades de la ruta ya generada (incluida la excepción de tramos que el pase
 * no cubre bien) vive fuera de este cuestionario, en la fase de generación/visualización de ruta.
 */
export function MultidestinoTrenOVueloTransportFlow({
  origin,
  destinationPlace,
  destinationName,
  transportOption,
  paseDominante,
  travelPassConfirmed,
  onTransportOptionChange,
  onTravelPassConfirmedChange,
}: MultidestinoTrenOVueloTransportFlowProps) {
  const { loading, error, feasibility } = useTransportFeasibility(origin, destinationPlace)
  const autoAssumedRef = useRef(false)

  const candidates = feasibility ? getMultidestinoCandidates(feasibility) : []
  const hasChoice = candidates.length >= 2

  // Si solo una vía pasa el filtro, se asume directamente — sin preguntar cuál.
  useEffect(() => {
    if (!feasibility || transportOption || autoAssumedRef.current) return
    if (candidates.length === 1) {
      autoAssumedRef.current = true
      onTransportOptionChange(candidates[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feasibility, transportOption, candidates.length])

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-small italic text-text-soft">
        <Spinner className="text-accent" />
        Viendo cómo se llega hasta {destinationName}...
      </p>
    )
  }

  if (error || !feasibility) {
    return (
      <div className="space-y-2">
        <p className="text-small italic text-text-soft">No hemos podido calcular esto ahora mismo. Seguimos en avión y resolvemos el resto igual.</p>
        <Button
          onClick={() => onTransportOptionChange(buildFlightOption({ feasible: true, recommended: false, duration_label: '', price_label: '', via_label: '' }))}
        >
          Continuar en avión
        </Button>
      </div>
    )
  }

  // ── Fase 1 — todavía no hay transporte de llegada resuelto ──────────────
  if (!transportOption) {
    if (hasChoice) {
      return (
        <div className="space-y-2">
          <p className="text-small text-text-soft">Hay más de una forma de llegar hasta {destinationName} — ¿cuál prefieres?</p>
          <div className="space-y-2">
            {candidates.map((option) => (
              <TransportOptionCard key={option.id} option={option} onClick={() => onTransportOptionChange(option)} />
            ))}
          </div>
        </div>
      )
    }

    // 1 sola vía (o ninguna, con avión de respaldo) — el efecto de arriba la está asumiendo.
    return (
      <p className="flex items-center gap-2 text-small italic text-text-soft">
        <Spinner className="text-accent" />
        Viendo cómo se llega hasta {destinationName}...
      </p>
    )
  }

  // ── Fase 2 (excepcional) — solo si el destino tiene un pase de transporte dominante ──
  return (
    <div className="space-y-3">
      <TransportBanner option={transportOption} prefix="Para llegar:" canChange={hasChoice} onChange={() => onTransportOptionChange(null)} />

      {paseDominante && travelPassConfirmed === null && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">¿Vas a viajar con {paseDominante}?</p>
          <div className="space-y-2">
            <ChoiceButton icon="🎫" label={`Sí, viajaré con el ${paseDominante}`} selected={false} onClick={() => onTravelPassConfirmedChange(true)} />
            <ChoiceButton icon="🎟️" label="No, prefiero billete a billete" selected={false} onClick={() => onTravelPassConfirmedChange(false)} />
          </div>
        </div>
      )}

      {paseDominante && travelPassConfirmed !== null && (
        <SelectedOptionCard
          icon={travelPassConfirmed ? '🎫' : '🎟️'}
          label={travelPassConfirmed ? paseDominante : 'Billete a billete'}
          prefix="Entre ciudades:"
          canChange
          onChange={() => onTravelPassConfirmedChange(null)}
        />
      )}
    </div>
  )
}
