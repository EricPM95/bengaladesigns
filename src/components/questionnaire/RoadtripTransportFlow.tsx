import { useEffect, useRef } from 'react'
import type { Place, TransportOption, VehicleOwnership, VehicleType } from '../../lib/types'
import { useTransportFeasibility } from '../../hooks/useTransportFeasibility'
import { buildFlightOption, getRoadtripCandidates } from '../../lib/roadtripTransport'
import { buildCarAccommodationMessage } from '../../lib/accommodationCopy'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'
import { ChoiceButton } from './ChoiceButton'
import { TransportBanner } from './TransportBanner'
import { SelectedOptionCard } from './SelectedOptionCard'
import { TransportOptionCard } from './TransportOptionCard'

interface RoadtripTransportFlowProps {
  origin: Place | null
  destinationPlace: Place | null
  destinationName: string
  transportOption: TransportOption | null
  vehicleType: VehicleType | null
  vehicleOwnership: VehicleOwnership | null
  /** Aptitud para camper/autocaravana ya conocida (ej. ruta curada confirmada) — tiene prioridad sobre lo que devuelva Claude. */
  knownCamperAccess: boolean | null
  onTransportOptionChange: (option: TransportOption | null) => void
  onVehicleTypeChange: (vehicleType: VehicleType | null) => void
  onVehicleOwnershipChange: (ownership: VehicleOwnership | null) => void
}

const VEHICLE_LABEL: Record<VehicleType, string> = { car: 'Coche', camper: 'Camper / autocaravana' }
const VEHICLE_ICON: Record<VehicleType, string> = { car: '🚗', camper: '🚐' }

/**
 * Flujo de transporte para roadtrip_exclusivo ("Ruta por libre" en la app), aislado del resto
 * de arquetipos.
 *
 * FASE 1 (cómo llegar): la viabilidad geográfica (Paso A, useTransportFeasibility) es universal
 * y no sabe nada de este arquetipo — aquí solo se filtra qué candidatas ofrecer de lo que ya es
 * geográficamente real (Paso B, ver getRoadtripCandidates): ruta con vehículo propio, avión y
 * ferry, nunca tren. Puede haber 1, 2 o las 3 a la vez. Con 1 candidata se asume sin preguntar;
 * con 2+ se muestran como tarjetas, y en ese caso queda un "Cambiar" para deshacer la elección
 * sin perder el resto del formulario.
 * FASE 2 (vehículo, siempre obligatoria): quién eligió "ruta con vehículo propio" solo confirma
 * qué vehículo tiene (la propiedad ya se sabe que es suya). Quién llegó en avión elige
 * coche/camper de alquiler directamente. Quién llegó en ferry primero dice si es su vehículo o
 * lo alquila, y luego el tipo. Si el destino no admite camper/autocaravana (carreteras
 * estrechas, curvas cerradas, restricciones locales — ya sea de una ruta curada conocida o
 * evaluado por Claude), esa opción ni se ofrece — se asume coche directamente, sin preguntar.
 * Cada elección resuelta se muestra como tarjeta confirmada con check (mismo patrón en toda la
 * app), con "Cambiar" cuando hubo una elección real entre 2+ opciones.
 */
export function RoadtripTransportFlow({
  origin,
  destinationPlace,
  destinationName,
  transportOption,
  vehicleType,
  vehicleOwnership,
  knownCamperAccess,
  onTransportOptionChange,
  onVehicleTypeChange,
  onVehicleOwnershipChange,
}: RoadtripTransportFlowProps) {
  const { loading, error, feasibility } = useTransportFeasibility(origin, destinationPlace)
  const autoAssumedRef = useRef(false)

  const chooseOption = (option: TransportOption) => {
    onTransportOptionChange(option)
    if (option.id === 'own_vehicle') onVehicleOwnershipChange('own')
  }

  const candidates = feasibility ? getRoadtripCandidates(feasibility, origin) : []
  const hasChoice = candidates.length >= 2
  const camperOk = knownCamperAccess ?? feasibility?.camper_access.feasible ?? true

  // Si solo una vía pasa el filtro de viabilidad, se asume directamente — sin preguntar cuál.
  useEffect(() => {
    if (!feasibility || transportOption || autoAssumedRef.current) return
    if (candidates.length === 1) {
      autoAssumedRef.current = true
      chooseOption(candidates[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feasibility, transportOption, candidates.length])

  // En destinos no aptos para camper/autocaravana, esa opción no se ofrece — se asume coche
  // directamente, sin mostrar la pregunta.
  const atVehicleTypeStep =
    Boolean(transportOption) &&
    !vehicleType &&
    (transportOption?.id === 'own_vehicle' || transportOption?.id === 'flight' || (transportOption?.id === 'ferry' && Boolean(vehicleOwnership)))
  useEffect(() => {
    if (!atVehicleTypeStep || camperOk) return
    onVehicleTypeChange('car')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atVehicleTypeStep, camperOk])

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
          onClick={() => chooseOption(buildFlightOption({ feasible: true, recommended: false, duration_label: '', price_label: '', via_label: '' }))}
        >
          Continuar en avión
        </Button>
      </div>
    )
  }

  // ── FASE 1 — todavía no hay transporte de llegada resuelto ──────────────
  if (!transportOption) {
    if (hasChoice) {
      return (
        <div className="space-y-2">
          <p className="text-small text-text-soft">Hay más de una forma de llegar hasta {destinationName} — ¿cuál prefieres?</p>
          <div className="space-y-2">
            {candidates.map((option) => (
              <TransportOptionCard key={option.id} option={option} onClick={() => chooseOption(option)} />
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

  // ── FASE 2 — ya hay transporte de llegada, falta el vehículo ──────────
  return (
    <div className="space-y-3">
      <TransportBanner
        option={transportOption}
        prefix="Para llegar:"
        canChange={hasChoice}
        onChange={() => onTransportOptionChange(null)}
      />

      {!vehicleType && transportOption.id === 'own_vehicle' && camperOk && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">¿Qué tipo de vehículo tienes?</p>
          <div className="space-y-2">
            <ChoiceButton icon="🚗" label="Coche" selected={false} onClick={() => onVehicleTypeChange('car')} />
            <ChoiceButton icon="🚐" label="Camper / autocaravana" selected={false} onClick={() => onVehicleTypeChange('camper')} />
          </div>
        </div>
      )}

      {!vehicleType && transportOption.id === 'flight' && camperOk && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">¿Cómo te gustaría recorrer {destinationName}?</p>
          <div className="space-y-2">
            <ChoiceButton
              icon="🚗"
              label="En coche"
              description="Un hotel distinto cada noche, a tu ritmo"
              selected={false}
              onClick={() => {
                onVehicleOwnershipChange('rental')
                onVehicleTypeChange('car')
              }}
            />
            <ChoiceButton
              icon="🚐"
              label="En camper o autocaravana"
              description="Duermes donde te lleve el camino"
              selected={false}
              onClick={() => {
                onVehicleOwnershipChange('rental')
                onVehicleTypeChange('camper')
              }}
            />
          </div>
        </div>
      )}

      {!vehicleType && transportOption.id === 'ferry' && !vehicleOwnership && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">¿Te llevas tu vehículo en el ferry o prefieres alquilar uno allí?</p>
          <div className="space-y-2">
            <ChoiceButton icon="🔑" label="Me llevo el mío" selected={false} onClick={() => onVehicleOwnershipChange('own')} />
            <ChoiceButton icon="📋" label="Alquilo uno en destino" selected={false} onClick={() => onVehicleOwnershipChange('rental')} />
          </div>
        </div>
      )}

      {!vehicleType && transportOption.id === 'ferry' && vehicleOwnership && (
        <SelectedOptionCard
          icon={vehicleOwnership === 'own' ? '🔑' : '📋'}
          label={vehicleOwnership === 'own' ? 'Me llevo el mío' : 'Alquilo uno en destino'}
          canChange
          onChange={() => onVehicleOwnershipChange(null)}
        />
      )}

      {!vehicleType && transportOption.id === 'ferry' && vehicleOwnership && camperOk && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">
            {vehicleOwnership === 'own' ? '¿Con qué vehículo vas a vivir esta experiencia?' : `¿Cómo te gustaría recorrer ${destinationName}?`}
          </p>
          <div className="space-y-2">
            <ChoiceButton icon="🚗" label="Coche" selected={false} onClick={() => onVehicleTypeChange('car')} />
            <ChoiceButton icon="🚐" label="Camper / autocaravana" selected={false} onClick={() => onVehicleTypeChange('camper')} />
          </div>
        </div>
      )}

      {atVehicleTypeStep && !camperOk && (
        <p className="flex items-center gap-2 text-small italic text-text-soft">
          <Spinner className="text-accent" />
          Resolviendo tu vehículo...
        </p>
      )}

      {vehicleType && (
        <>
          <SelectedOptionCard
            icon={VEHICLE_ICON[vehicleType]}
            label={VEHICLE_LABEL[vehicleType]}
            prefix="Para moverte:"
            canChange={camperOk}
            onChange={() => onVehicleTypeChange(null)}
          />
          {/* Solo cuando el sistema forzó "coche" sin preguntar (destino no apto para camper) —
              es la única forma que tiene el usuario de saber por qué no se le dejó elegir. Si
              eligió él mismo (coche o camper), la tarjeta con check ya es confirmación suficiente. */}
          {vehicleType === 'car' && !camperOk && (
            <p className="text-small text-text-muted">{buildCarAccommodationMessage(destinationName, true)}</p>
          )}
        </>
      )}
    </div>
  )
}
