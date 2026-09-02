import { useEffect, useRef } from 'react'
import type { Place, TransportOption, VehicleOwnership, VehicleType } from '../../lib/types'
import { useTransportFeasibility } from '../../hooks/useTransportFeasibility'
import { buildFlightOption, getUrbanoCandidates } from '../../lib/urbanoTransport'
import { buildCarAccommodationMessage } from '../../lib/accommodationCopy'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'
import { ChoiceButton } from './ChoiceButton'
import { TransportBanner } from './TransportBanner'
import { TransportOptionCard } from './TransportOptionCard'
import { SelectedOptionCard } from './SelectedOptionCard'

interface UrbanoTransportFlowProps {
  origin: Place | null
  destinationPlace: Place | null
  destinationName: string
  transportOption: TransportOption | null
  /** true cuando el destino tiene transporte público insuficiente (ver clasificación de destino) — activa la pregunta de alquiler de coche. */
  requiereCoche: boolean
  vehicleType: VehicleType | null
  vehicleResolved: boolean
  onTransportOptionChange: (option: TransportOption | null) => void
  onVehicleTypeChange: (vehicleType: VehicleType | null) => void
  onVehicleOwnershipChange: (ownership: VehicleOwnership | null) => void
  onVehicleResolvedChange: (resolved: boolean) => void
}

const VEHICLE_LABEL: Record<VehicleType, string> = { car: 'Coche', camper: 'Camper / autocaravana' }
const VEHICLE_ICON: Record<VehicleType, string> = { car: '🚗', camper: '🚐' }

/**
 * Flujo de transporte para urbano_clasico — ciudades donde te mueves a pie y en transporte
 * público. Reutiliza el mismo cálculo universal de viabilidad geográfica (Paso A) que
 * roadtrip_exclusivo y base_y_excursiones — la única diferencia en Fase 1 es el filtro de qué
 * candidatos ofrecer (Paso B, ver getUrbanoCandidates en src/lib/urbanoTransport.ts).
 *
 * FASE 2 tiene DOS ramas independientes, nunca simultáneas:
 * - Llegó por **Ruta por libre con vehículo propio** → siempre pregunta el tipo de vehículo
 *   ("¿Qué tipo de vehículo tienes?" → Coche/Camper, filtrado por aptitud de carretera), igual
 *   que roadtrip_exclusivo y base_y_excursiones — ya parte de un vehículo real, solo falta saber
 *   cuál. Camper cambia el alojamiento (ver describeAccommodationType en el backend: aparcamiento
 *   o camping en las afueras con buena conexión de transporte público, no hotel céntrico).
 * - Cualquier otra llegada (avión/tren/autobús/ferry) → solo si `requiereCoche` (ciudad de
 *   transporte público insuficiente) pregunta si quiere ALQUILAR un coche, sin preguntar tipo
 *   (nunca Camper/Autocaravana aquí: parte de cero, sin vehículo propio que arrastrar).
 *
 * Aviso universal: cuando `vehicleType === 'camper'` (hoy solo posible desde la rama de vehículo
 * propio, pero el aviso no depende de por qué rama llegó ni de ningún dato de la ciudad) se
 * muestra siempre el mismo texto explicando que la autocaravana se queda aparcada en las afueras
 * y que el centro se recorre a pie/transporte público — nunca condicionado a la ciudad concreta.
 */
export function UrbanoTransportFlow({
  origin,
  destinationPlace,
  destinationName,
  transportOption,
  requiereCoche,
  vehicleType,
  vehicleResolved,
  onTransportOptionChange,
  onVehicleTypeChange,
  onVehicleOwnershipChange,
  onVehicleResolvedChange,
}: UrbanoTransportFlowProps) {
  const { loading, error, feasibility } = useTransportFeasibility(origin, destinationPlace)
  const autoAssumedRef = useRef(false)

  const candidates = feasibility ? getUrbanoCandidates(feasibility, origin) : []
  const hasChoice = candidates.length >= 2
  const camperOk = feasibility?.camper_access.feasible ?? true

  const chooseOption = (option: TransportOption) => {
    onTransportOptionChange(option)
    if (option.id === 'own_vehicle') onVehicleOwnershipChange('own')
  }

  // Si solo una vía pasa el filtro, se asume directamente — sin preguntar cuál.
  useEffect(() => {
    if (!feasibility || transportOption || autoAssumedRef.current) return
    if (candidates.length === 1) {
      autoAssumedRef.current = true
      chooseOption(candidates[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feasibility, transportOption, candidates.length])

  const isOwnVehicle = transportOption?.id === 'own_vehicle'
  const atVehicleTypeStep = isOwnVehicle && !vehicleResolved

  // En destinos no aptos para camper/autocaravana, esa opción no se ofrece — se asume coche
  // directamente, sin mostrar la pregunta.
  useEffect(() => {
    if (!atVehicleTypeStep || camperOk) return
    onVehicleTypeChange('car')
    onVehicleResolvedChange(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atVehicleTypeStep, camperOk])

  // Deshacer el tipo de vehículo propio — la propiedad ("own") sigue siendo cierta, solo se
  // vuelve a preguntar coche/camper.
  const resetOwnVehicleType = () => {
    onVehicleTypeChange(null)
    onVehicleResolvedChange(false)
  }

  // Deshacer la decisión de alquilar — a diferencia de arriba, aquí sí se resetea la propiedad,
  // porque "alquilar" es la elección que se está deshaciendo.
  const resetRental = () => {
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

  // ── Fase 1 — todavía no hay transporte de llegada resuelto ──────────────
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

  // ── Fase 2 ──
  return (
    <div className="space-y-3">
      <TransportBanner option={transportOption} prefix="Para llegar:" canChange={hasChoice} onChange={() => onTransportOptionChange(null)} />

      {atVehicleTypeStep && camperOk && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">¿Qué tipo de vehículo tienes?</p>
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

      {isOwnVehicle && vehicleResolved && vehicleType && (
        <>
          <SelectedOptionCard
            icon={VEHICLE_ICON[vehicleType]}
            label={VEHICLE_LABEL[vehicleType]}
            prefix="Para moverte:"
            canChange={camperOk}
            onChange={resetOwnVehicleType}
          />
          {vehicleType === 'car' && !camperOk && (
            <p className="text-small text-text-muted">{buildCarAccommodationMessage(destinationName, true)}</p>
          )}
        </>
      )}

      {!isOwnVehicle && requiereCoche && !vehicleResolved && (
        <div className="space-y-2">
          <p className="text-small text-text-soft">
            El transporte público en {destinationName} es limitado — ¿te gustaría alquilar un coche para moverte con comodidad?
          </p>
          <div className="space-y-2">
            <ChoiceButton
              icon="🚗"
              label="Sí, quiero alquilar"
              selected={false}
              onClick={() => {
                onVehicleOwnershipChange('rental')
                onVehicleTypeChange('car')
                onVehicleResolvedChange(true)
              }}
            />
            <ChoiceButton
              icon="🚕"
              label="No, prefiero moverme sin vehículo"
              selected={false}
              onClick={() => {
                onVehicleOwnershipChange(null)
                onVehicleTypeChange(null)
                onVehicleResolvedChange(true)
              }}
            />
          </div>
        </div>
      )}

      {!isOwnVehicle && requiereCoche && vehicleResolved && vehicleType && (
        <SelectedOptionCard icon="🚗" label="Coche" prefix="Para moverte:" canChange onChange={resetRental} />
      )}
      {!isOwnVehicle && requiereCoche && vehicleResolved && !vehicleType && (
        <SelectedOptionCard icon="🚕" label="Sin vehículo" prefix="Para moverte:" canChange onChange={resetRental} />
      )}

      {vehicleType === 'camper' && (
        <p className="text-small text-text-soft">
          En {destinationName} tu camper/autocaravana se quedará aparcada en una zona periférica con buena conexión — te recomendamos moverte por el
          centro a pie o en transporte público.
        </p>
      )}
    </div>
  )
}
