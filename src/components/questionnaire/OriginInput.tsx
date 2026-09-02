import { useEffect, useState } from 'react'
import type { DestinationArchetype, Place, TransportOption, TravelMode, VehicleOwnership, VehicleType } from '../../lib/types'
import { PlaceAutocomplete } from '../ui/PlaceAutocomplete'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { ChoiceButton } from './ChoiceButton'
import { RoadtripTransportFlow } from './RoadtripTransportFlow'
import { BaseYExcursionesTransportFlow } from './BaseYExcursionesTransportFlow'
import { UrbanoTransportFlow } from './UrbanoTransportFlow'
import { MultidestinoTrenOVueloTransportFlow } from './MultidestinoTrenOVueloTransportFlow'
import { MultidestinoMixtoTransportFlow } from './MultidestinoMixtoTransportFlow'

interface OriginInputProps {
  destination: string
  destinationPlace: Place | null
  archetype: DestinationArchetype | null
  /** true cuando Claude no pudo decidir con seguridad entre roadtrip_exclusivo y base_y_excursiones. */
  archetypeAmbiguous: boolean
  /** true cuando la llamada de clasificación de destino falló — distinto de "todavía cargando". */
  archetypeClassificationFailed: boolean
  onRetryClassification: () => void
  /** Solo relevante para urbano_clasico: transporte público insuficiente, activa la pregunta de coche en su Fase 2. */
  requiereCoche: boolean
  /** Solo relevante para multidestino_tren_o_vuelo: nombre del pase de transporte dominante, o null. */
  paseDominante: string | null
  /** Respuesta a "¿Vas a viajar con {paseDominante}?" — null mientras no se ha preguntado. */
  travelPassConfirmed: boolean | null
  transportOption: TransportOption | null
  vehicleType: VehicleType | null
  vehicleOwnership: VehicleOwnership | null
  /** Aptitud para camper/autocaravana ya conocida (ej. ruta curada confirmada) — null si se debe preguntar con normalidad. */
  knownCamperAccess: boolean | null
  vehicleResolved: boolean
  travelMode: TravelMode | null
  onOriginResolved: (origin: string, originPlace?: Place) => void
  onResolveArchetype: (archetype: DestinationArchetype) => void
  onTransportOptionChange: (option: TransportOption | null) => void
  onVehicleTypeChange: (vehicleType: VehicleType | null) => void
  onVehicleOwnershipChange: (ownership: VehicleOwnership | null) => void
  onVehicleResolvedChange: (resolved: boolean) => void
  onTravelModeChange: (mode: TravelMode | null) => void
  onTravelPassConfirmedChange: (confirmed: boolean | null) => void
}

// Arquetipo todavía sin flujo propio (se reconstruye uno a uno) — por ahora se asume avión
// directamente, sin preguntar nada, para no bloquear el resto del cuestionario.
const PLACEHOLDER_FLIGHT_OPTION: TransportOption = {
  id: 'flight',
  icon: '✈️',
  title: 'Avión',
  description: '',
  subtitle: '',
  estimated_duration: '',
  estimated_price: '',
  recommended: false,
  includes_vehicle: false,
  vehicle_type: null,
  accommodation_type: 'hotel',
}

function PlaceholderTransportFlow({
  destination,
  transportOption,
  onTransportOptionChange,
}: {
  destination: string
  transportOption: TransportOption | null
  onTransportOptionChange: (option: TransportOption | null) => void
}) {
  useEffect(() => {
    if (!transportOption) onTransportOptionChange(PLACEHOLDER_FLIGHT_OPTION)
  }, [transportOption, onTransportOptionChange])

  return (
    <p className="text-small italic text-text-soft">
      🚧 Este tipo de destino todavía no tiene su propio flujo de transporte — de momento asumimos avión hasta {destination}.
    </p>
  )
}

/**
 * Cuando Claude no puede decidir con seguridad entre roadtrip_exclusivo y base_y_excursiones
 * (ej. destinos que se pueden vivir igual de bien recorriendo en coche que quedándose en una
 * base), se le pregunta directamente al usuario en vez de asumir. No hay lista curada fija de
 * destinos ambiguos — la detección es 100% dinámica, decidida por Claude en cada caso.
 */
function ArchetypeChoiceQuestion({
  destination,
  onResolveArchetype,
}: {
  destination: string
  onResolveArchetype: (archetype: DestinationArchetype) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-small text-text-soft">¿Cómo te gustaría vivir {destination}?</p>
      <div className="space-y-2">
        <ChoiceButton
          icon="🚗"
          label="Ruta panorámica en coche"
          description="Vas cambiando de sitio cada noche, la carretera es la experiencia"
          selected={false}
          onClick={() => onResolveArchetype('roadtrip_exclusivo')}
        />
        <ChoiceButton
          icon="🏡"
          label="Explorar sus pueblos y puntos de interés desde una base"
          description="Te quedas en una zona y sales a explorar"
          selected={false}
          onClick={() => onResolveArchetype('base_y_excursiones')}
        />
      </div>
    </div>
  )
}

export function OriginInput({
  destination,
  destinationPlace,
  archetype,
  archetypeAmbiguous,
  archetypeClassificationFailed,
  onRetryClassification,
  requiereCoche,
  paseDominante,
  travelPassConfirmed,
  transportOption,
  vehicleType,
  vehicleOwnership,
  knownCamperAccess,
  vehicleResolved,
  travelMode,
  onOriginResolved,
  onResolveArchetype,
  onTransportOptionChange,
  onVehicleTypeChange,
  onVehicleOwnershipChange,
  onVehicleResolvedChange,
  onTravelModeChange,
  onTravelPassConfirmedChange,
}: OriginInputProps) {
  const [originText, setOriginText] = useState('')
  const [originPlace, setOriginPlace] = useState<Place | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmitCity = () => {
    if (!originPlace || submitted) return
    setSubmitted(true)
    onOriginResolved(originPlace.name, originPlace)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <PlaceAutocomplete
          value={originText}
          onChange={(text) => {
            setOriginText(text)
            setOriginPlace(null)
          }}
          onSelect={(place) => {
            setOriginText(place.fullName)
            setOriginPlace(place)
          }}
          disabled={submitted}
          placeholder="Barcelona"
          autoFocus
          wrapperClassName="flex-1"
        />
        {!submitted && (
          <Button onClick={handleSubmitCity} disabled={!originPlace}>
            Continuar
          </Button>
        )}
      </div>

      {submitted && !archetype && !archetypeAmbiguous && !archetypeClassificationFailed && (
        <p className="flex items-center gap-2 text-small italic text-text-soft">
          <Spinner className="text-accent" />
          Viendo qué tipo de destino es {destination}...
        </p>
      )}

      {submitted && archetypeClassificationFailed && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">No hemos podido determinar qué tipo de destino es {destination} ahora mismo.</p>
          <Button onClick={onRetryClassification}>Reintentar</Button>
        </div>
      )}

      {submitted && archetypeAmbiguous && <ArchetypeChoiceQuestion destination={destination} onResolveArchetype={onResolveArchetype} />}

      {submitted && archetype === 'roadtrip_exclusivo' && (
        <RoadtripTransportFlow
          origin={originPlace}
          destinationPlace={destinationPlace}
          destinationName={destination}
          transportOption={transportOption}
          vehicleType={vehicleType}
          vehicleOwnership={vehicleOwnership}
          knownCamperAccess={knownCamperAccess}
          onTransportOptionChange={onTransportOptionChange}
          onVehicleTypeChange={onVehicleTypeChange}
          onVehicleOwnershipChange={onVehicleOwnershipChange}
        />
      )}

      {submitted && archetype === 'base_y_excursiones' && (
        <BaseYExcursionesTransportFlow
          origin={originPlace}
          destinationPlace={destinationPlace}
          destinationName={destination}
          transportOption={transportOption}
          vehicleType={vehicleType}
          vehicleOwnership={vehicleOwnership}
          vehicleResolved={vehicleResolved}
          travelMode={travelMode}
          onTransportOptionChange={onTransportOptionChange}
          onVehicleTypeChange={onVehicleTypeChange}
          onVehicleOwnershipChange={onVehicleOwnershipChange}
          onVehicleResolvedChange={onVehicleResolvedChange}
          onTravelModeChange={onTravelModeChange}
        />
      )}

      {submitted && archetype === 'urbano_clasico' && (
        <UrbanoTransportFlow
          origin={originPlace}
          destinationPlace={destinationPlace}
          destinationName={destination}
          transportOption={transportOption}
          requiereCoche={requiereCoche}
          vehicleType={vehicleType}
          vehicleResolved={vehicleResolved}
          onTransportOptionChange={onTransportOptionChange}
          onVehicleTypeChange={onVehicleTypeChange}
          onVehicleOwnershipChange={onVehicleOwnershipChange}
          onVehicleResolvedChange={onVehicleResolvedChange}
        />
      )}

      {submitted && archetype === 'multidestino_tren_o_vuelo' && (
        <MultidestinoTrenOVueloTransportFlow
          origin={originPlace}
          destinationPlace={destinationPlace}
          destinationName={destination}
          transportOption={transportOption}
          paseDominante={paseDominante}
          travelPassConfirmed={travelPassConfirmed}
          onTransportOptionChange={onTransportOptionChange}
          onTravelPassConfirmedChange={onTravelPassConfirmedChange}
        />
      )}

      {submitted && archetype === 'multidestino_mixto_o_circuito' && (
        <MultidestinoMixtoTransportFlow
          origin={originPlace}
          destinationPlace={destinationPlace}
          destinationName={destination}
          transportOption={transportOption}
          onTransportOptionChange={onTransportOptionChange}
        />
      )}

      {submitted &&
        archetype &&
        archetype !== 'roadtrip_exclusivo' &&
        archetype !== 'base_y_excursiones' &&
        archetype !== 'urbano_clasico' &&
        archetype !== 'multidestino_tren_o_vuelo' &&
        archetype !== 'multidestino_mixto_o_circuito' && (
          <PlaceholderTransportFlow destination={destination} transportOption={transportOption} onTransportOptionChange={onTransportOptionChange} />
        )}
    </div>
  )
}
