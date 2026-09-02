import { useEffect, useRef } from 'react'
import type { Place, TransportOption } from '../../lib/types'
import { useTransportFeasibility } from '../../hooks/useTransportFeasibility'
import { buildFlightOption, getMultidestinoCandidates } from '../../lib/multidestinoTrenOVueloTransport'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'
import { TransportBanner } from './TransportBanner'
import { TransportOptionCard } from './TransportOptionCard'

interface MultidestinoMixtoTransportFlowProps {
  origin: Place | null
  destinationPlace: Place | null
  destinationName: string
  transportOption: TransportOption | null
  onTransportOptionChange: (option: TransportOption | null) => void
}

/**
 * Flujo de transporte para multidestino_mixto_o_circuito — circuito de fases de naturaleza
 * distinta (ciudad/naturaleza/isla), típico de Tailandia, Vietnam, Malasia, Perú, Colombia.
 *
 * FASE 1 (cómo llegar a la primera fase) es idéntica a la de multidestino_tren_o_vuelo — mismo
 * Paso A universal + Avión/Tren/Autobús, nunca ferry ni roadtrip con vehículo propio (no hay
 * "origen propio" relevante en un viaje intercontinental típico de este arquetipo). Se reutiliza
 * literalmente `getMultidestinoCandidates` en vez de duplicar el filtro — el propio encargo lo
 * describe como "sin cambios" respecto al patrón ya construido.
 *
 * No hay Fase 2 en el cuestionario: a diferencia de multidestino_tren_o_vuelo (pregunta del
 * pase), aquí el resto de decisiones de transporte (Paso 3 — qué se ofrece entre cada par de
 * fases consecutivas, según su tipo) dependen de fases que todavía no existen en este punto —
 * las decide la generación de ruta, no el cuestionario. Ver `phaseTransitionTransport.ts` y
 * `buildArchetypeContext` en server/index.js.
 */
export function MultidestinoMixtoTransportFlow({
  origin,
  destinationPlace,
  destinationName,
  transportOption,
  onTransportOptionChange,
}: MultidestinoMixtoTransportFlowProps) {
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

  return <TransportBanner option={transportOption} prefix="Para llegar:" canChange={hasChoice} onChange={() => onTransportOptionChange(null)} />
}
