import { useEffect, useRef } from 'react'
import type { Place, TransportOption, TravelMode, VehicleOwnership, VehicleType } from '../../lib/types'
import { useTransportFeasibility } from '../../hooks/useTransportFeasibility'
import { buildFlightOption, getBaseExcursionesCandidates } from '../../lib/baseExcursionesTransport'
import { buildCarAccommodationMessage } from '../../lib/accommodationCopy'
import { getTravelModeDescription } from '../../lib/travelModeCopy'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'
import { ChoiceButton } from './ChoiceButton'
import { TransportBanner } from './TransportBanner'
import { SelectedOptionCard } from './SelectedOptionCard'
import { TransportOptionCard } from './TransportOptionCard'

interface BaseYExcursionesTransportFlowProps {
  origin: Place | null
  destinationPlace: Place | null
  destinationName: string
  transportOption: TransportOption | null
  vehicleType: VehicleType | null
  vehicleOwnership: VehicleOwnership | null
  vehicleResolved: boolean
  travelMode: TravelMode | null
  onTransportOptionChange: (option: TransportOption | null) => void
  onVehicleTypeChange: (vehicleType: VehicleType | null) => void
  onVehicleOwnershipChange: (ownership: VehicleOwnership | null) => void
  onVehicleResolvedChange: (resolved: boolean) => void
  onTravelModeChange: (mode: TravelMode | null) => void
}

const VEHICLE_LABEL: Record<VehicleType, string> = { car: 'Coche', camper: 'Camper / autocaravana' }
const VEHICLE_ICON: Record<VehicleType, string> = { car: '🚗', camper: '🚐' }

/**
 * Flujo de transporte para base_y_excursiones — destinos con puntos de interés cercanos entre
 * sí, donde el vehículo mejora la experiencia pero NUNCA es obligatorio (a diferencia de
 * roadtrip_exclusivo).
 *
 * FASE 1 (cómo llegar): la viabilidad geográfica (Paso A, useTransportFeasibility) es universal
 * y no sabe nada de este arquetipo — aquí solo se filtra qué candidatas ofrecer de lo que ya es
 * geográficamente real (Paso B, ver getBaseExcursionesCandidates): avión, ferry, tren y road trip
 * con vehículo propio, las cuatro vías. Ferry y road trip nunca conviven a la vez (Paso A ya los
 * garantiza mutuamente excluyentes por construcción geográfica). Con 1 candidata se asume sin
 * preguntar; con 2+ se muestran tarjetas, con "Cambiar" para deshacer.
 * FASE 2 (vehículo, siempre OPCIONAL): avión/tren preguntan primero si quiere alquilar (Sí/No);
 * ferry pregunta directamente propio/alquilar/sin vehículo; "road trip con vehículo propio" ya
 * sabe que es su vehículo, solo pregunta el tipo. El filtro de aptitud para camper/autocaravana
 * (heredado, compartido con roadtrip_exclusivo) se aplica igual. En paralelo, siempre se
 * pregunta "Base fija / Ruta itinerante" — no depende de cómo se resuelva el vehículo.
 */
export function BaseYExcursionesTransportFlow({
  origin,
  destinationPlace,
  destinationName,
  transportOption,
  vehicleType,
  vehicleOwnership,
  vehicleResolved,
  travelMode,
  onTransportOptionChange,
  onVehicleTypeChange,
  onVehicleOwnershipChange,
  onVehicleResolvedChange,
  onTravelModeChange,
}: BaseYExcursionesTransportFlowProps) {
  const { loading, error, feasibility } = useTransportFeasibility(origin, destinationPlace)
  const autoAssumedRef = useRef(false)

  const chooseOption = (option: TransportOption) => {
    onTransportOptionChange(option)
    if (option.id === 'own_vehicle') onVehicleOwnershipChange('own')
  }

  const candidates = feasibility ? getBaseExcursionesCandidates(feasibility, origin) : []
  const hasChoice = candidates.length >= 2
  const camperOk = feasibility?.camper_access.feasible ?? true

  // Si solo una vía pasa el filtro (o ninguna, con avión de respaldo), se asume directamente.
  useEffect(() => {
    if (!feasibility || transportOption || autoAssumedRef.current) return
    if (candidates.length === 1) {
      autoAssumedRef.current = true
      chooseOption(candidates[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feasibility, transportOption, candidates.length])

  const isFlightOrTrain = transportOption?.id === 'flight' || transportOption?.id === 'train'
  const isFerry = transportOption?.id === 'ferry'
  const isOwnVehicle = transportOption?.id === 'own_vehicle'

  // En destinos no aptos para camper/autocaravana, esa opción no se ofrece — se asume coche
  // directamente, sin mostrar la pregunta.
  const atVehicleTypeStep =
    !vehicleResolved &&
    Boolean(transportOption) &&
    (isOwnVehicle || (isFlightOrTrain && vehicleOwnership === 'rental') || (isFerry && vehicleOwnership !== null))
  useEffect(() => {
    if (!atVehicleTypeStep || camperOk) return
    onVehicleTypeChange('car')
    onVehicleResolvedChange(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atVehicleTypeStep, camperOk])

  const resetVehicle = () => {
    onVehicleTypeChange(null)
    onVehicleOwnershipChange(null)
    onVehicleResolvedChange(false)
  }

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

    // 1 sola candidata (avión) — el efecto de arriba la está asumiendo.
    return (
      <p className="flex items-center gap-2 text-small italic text-text-soft">
        <Spinner className="text-accent" />
        Viendo cómo se llega hasta {destinationName}...
      </p>
    )
  }

  // ── FASE 2 — vehículo (opcional) + estilo de exploración (en paralelo) ──
  return (
    <div className="space-y-3">
      <TransportBanner
        option={transportOption}
        prefix="Para llegar:"
        canChange={hasChoice}
        onChange={() => onTransportOptionChange(null)}
      />

      {/* Avión / Tren: primero preguntan si quiere alquilar */}
      {!vehicleResolved && isFlightOrTrain && vehicleOwnership === null && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">¿Te gustaría alquilar un vehículo en {destinationName}?</p>
          <div className="space-y-2">
            <ChoiceButton icon="📋" label="Sí, quiero alquilar" selected={false} onClick={() => onVehicleOwnershipChange('rental')} />
            <ChoiceButton
              icon="🚕"
              label="No, prefiero moverme sin vehículo"
              selected={false}
              onClick={() => {
                onVehicleOwnershipChange(null)
                onVehicleResolvedChange(true)
              }}
            />
          </div>
        </div>
      )}
      {!vehicleResolved && isFlightOrTrain && vehicleOwnership === 'rental' && (
        <SelectedOptionCard icon="📋" label="Sí, quiero alquilar" canChange onChange={() => onVehicleOwnershipChange(null)} />
      )}

      {/* Ferry: pregunta directamente propio / alquilar / sin vehículo */}
      {!vehicleResolved && isFerry && vehicleOwnership === null && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">¿Vienes con tu propio vehículo, prefieres alquilar uno en destino, o vas sin vehículo?</p>
          <div className="space-y-2">
            <ChoiceButton icon="🔑" label="Con mi propio vehículo" selected={false} onClick={() => onVehicleOwnershipChange('own')} />
            <ChoiceButton icon="📋" label="Alquilar uno en destino" selected={false} onClick={() => onVehicleOwnershipChange('rental')} />
            <ChoiceButton
              icon="🚕"
              label="Sin vehículo"
              selected={false}
              onClick={() => {
                onVehicleOwnershipChange(null)
                onVehicleResolvedChange(true)
              }}
            />
          </div>
        </div>
      )}
      {!vehicleResolved && isFerry && vehicleOwnership !== null && (
        <SelectedOptionCard
          icon={vehicleOwnership === 'own' ? '🔑' : '📋'}
          label={vehicleOwnership === 'own' ? 'Con mi propio vehículo' : 'Alquilar uno en destino'}
          canChange
          onChange={() => onVehicleOwnershipChange(null)}
        />
      )}

      {/* Coche/Camper: para road trip con vehículo propio, o tras responder que sí alquila (avión/tren/ferry) */}
      {atVehicleTypeStep && camperOk && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">
            {isOwnVehicle
              ? '¿Qué tipo de vehículo tienes?'
              : isFerry && vehicleOwnership === 'own'
                ? '¿Con qué vehículo vas a vivir esta experiencia?'
                : `¿Cómo te gustaría recorrer ${destinationName}?`}
          </p>
          <div className="space-y-2">
            <ChoiceButton
              icon="🚗"
              label="Coche"
              selected={false}
              onClick={() => {
                onVehicleTypeChange('car')
                onVehicleResolvedChange(true)
              }}
            />
            <ChoiceButton
              icon="🚐"
              label="Camper / autocaravana"
              selected={false}
              onClick={() => {
                onVehicleTypeChange('camper')
                onVehicleResolvedChange(true)
              }}
            />
          </div>
        </div>
      )}

      {atVehicleTypeStep && !camperOk && (
        <p className="flex items-center gap-2 text-small italic text-text-soft">
          <Spinner className="text-accent" />
          Resolviendo tu vehículo...
        </p>
      )}

      {vehicleResolved && vehicleType && (
        <>
          <SelectedOptionCard
            icon={VEHICLE_ICON[vehicleType]}
            label={VEHICLE_LABEL[vehicleType]}
            prefix="Para moverte:"
            canChange={camperOk}
            onChange={resetVehicle}
          />
          {vehicleType === 'car' && !camperOk && (
            <p className="text-small text-text-muted">{buildCarAccommodationMessage(destinationName, true)}</p>
          )}
        </>
      )}
      {vehicleResolved && !vehicleType && (
        <SelectedOptionCard icon="🚕" label="Sin vehículo" prefix="Para moverte:" canChange onChange={resetVehicle} />
      )}

      {/* En paralelo a todo lo anterior: cómo prefiere explorar la zona */}
      {!travelMode && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">¿Cómo prefieres explorar {destinationName}?</p>
          <div className="space-y-2">
            <ChoiceButton
              icon="🏠"
              label="Base fija"
              description={getTravelModeDescription('base_fija', vehicleType)}
              selected={false}
              onClick={() => onTravelModeChange('base_fija')}
            />
            <ChoiceButton
              icon="🗺️"
              label="Ruta itinerante"
              description={getTravelModeDescription('itinerante', vehicleType)}
              selected={false}
              onClick={() => onTravelModeChange('itinerante')}
            />
          </div>
        </div>
      )}
      {travelMode && (
        <SelectedOptionCard
          icon={travelMode === 'base_fija' ? '🏠' : '🗺️'}
          label={travelMode === 'base_fija' ? 'Base fija' : 'Ruta itinerante'}
          canChange
          onChange={() => onTravelModeChange(null)}
        />
      )}
    </div>
  )
}
