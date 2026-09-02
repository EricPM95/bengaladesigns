import { motion } from 'framer-motion'
import { useRouteStore } from '../../store/useRouteStore'
import type { BudgetLevel, Chronotype, TripPace } from '../../lib/types'
import { getCurrentSeason } from '../../lib/season'
import { isTransportFullyResolved } from '../../lib/transportFlow'
import { isCompanionFullyResolved } from '../../lib/companionFlow'
import { classifyInBackground } from '../../lib/classifyInBackground'
import { suggestExperiencesInBackground } from '../../lib/suggestExperiencesInBackground'
import { suggestPlacesOnDemand } from '../../lib/suggestPlacesOnDemand'
import { QuestionCard } from './QuestionCard'
import { ChoiceButton } from './ChoiceButton'
import { OriginInput } from './OriginInput'
import { DurationSelector } from './DurationSelector'
import { CompanionSelector } from './CompanionSelector'
import { ExperienceSelector } from './ExperienceSelector'
import { PlaceSelector } from './PlaceSelector'
import { Button } from '../ui/Button'

const paceOptions: { value: TripPace; icon: string; label: string; description: string }[] = [
  { value: 'zen', icon: '🌿', label: 'Zen', description: '2-3 paradas/día, mañanas tranquilas, pausas largas' },
  { value: 'balanced', icon: '⚖️', label: 'Equilibrado', description: '4-5 paradas/día, flexible' },
  { value: 'nonstop', icon: '⚡', label: 'Sin parar', description: '6+, de sol a sol, verlo todo' },
]

const chronotypeOptions: { value: Chronotype; icon: string; label: string; description: string }[] = [
  { value: 'sunrise', icon: '🌅', label: 'Madrugador', description: 'Empezar a las 6-7am' },
  { value: 'normal', icon: '🕐', label: 'Horario normal', description: '9am-10pm' },
  { value: 'nightowl', icon: '🌙', label: 'Ave nocturna', description: 'Empezar tarde, vida nocturna' },
]

const budgetOptions: { value: BudgetLevel; icon: string; label: string; description: string }[] = [
  { value: 'backpacker', icon: '🎒', label: 'Mochilero', description: 'Hostales, comida callejera' },
  { value: 'comfortable', icon: '🏨', label: 'Cómodo', description: 'Hoteles, buenos restaurantes' },
  { value: 'treatMyself', icon: '💎', label: 'Darme un capricho', description: 'Hoteles boutique, las mejores experiencias' },
]

export function Questionnaire() {
  const destination = useRouteStore((state) => state.destination)
  const destinationPlace = useRouteStore((state) => state.destinationPlace)
  const archetype = useRouteStore((state) => state.archetype)
  const archetypeAmbiguous = useRouteStore((state) => state.archetype_ambiguous)
  const archetypeClassificationFailed = useRouteStore((state) => state.archetype_classification_failed)
  const requiereCoche = useRouteStore((state) => state.requiere_coche)
  const paseDominante = useRouteStore((state) => state.pase_dominante)
  const travelPassConfirmed = useRouteStore((state) => state.travel_pass_confirmed)
  const transportOption = useRouteStore((state) => state.transport_option)
  const vehicleOwnership = useRouteStore((state) => state.vehicle_ownership)
  const vehicleType = useRouteStore((state) => state.vehicle_type)
  const vehicleResolved = useRouteStore((state) => state.vehicle_resolved)
  const travelMode = useRouteStore((state) => state.travel_mode)
  const knownCamperAccess = useRouteStore((state) => state.known_camper_access)
  const companionCapacityAcknowledged = useRouteStore((state) => state.companion_capacity_acknowledged)
  const suggestedExperiences = useRouteStore((state) => state.suggested_experiences)
  const suggestedExperiencesLoading = useRouteStore((state) => state.suggested_experiences_loading)
  const suggestedExperiencesFailed = useRouteStore((state) => state.suggested_experiences_failed)
  const placesStepStarted = useRouteStore((state) => state.places_step_started)
  const suggestedPlaces = useRouteStore((state) => state.suggested_places)
  const suggestedPlacesLoading = useRouteStore((state) => state.suggested_places_loading)
  const suggestedPlacesFailed = useRouteStore((state) => state.suggested_places_failed)
  const selectedPlaceIds = useRouteStore((state) => state.selected_place_ids)
  const toggleSelectedPlace = useRouteStore((state) => state.toggleSelectedPlace)
  const toggleSelectAllPlaces = useRouteStore((state) => state.toggleSelectAllPlaces)
  const resolveArchetypeChoice = useRouteStore((state) => state.resolveArchetypeChoice)
  const setTransportOption = useRouteStore((state) => state.setTransportOption)
  const setVehicleOwnership = useRouteStore((state) => state.setVehicleOwnership)
  const setVehicleType = useRouteStore((state) => state.setVehicleType)
  const setVehicleResolved = useRouteStore((state) => state.setVehicleResolved)
  const setCompanionCapacityAcknowledged = useRouteStore((state) => state.setCompanionCapacityAcknowledged)
  const setTravelMode = useRouteStore((state) => state.setTravelMode)
  const setTravelPassConfirmed = useRouteStore((state) => state.setTravelPassConfirmed)
  const answers = useRouteStore((state) => state.answers)
  const updateAnswers = useRouteStore((state) => state.updateAnswers)
  const setScreen = useRouteStore((state) => state.setScreen)
  const resetQuestionnaire = useRouteStore((state) => state.resetQuestionnaire)

  if (!destination) return null

  const handleBack = () => {
    resetQuestionnaire()
    setScreen('destination')
  }

  const showDays =
    answers.origin !== undefined &&
    isTransportFullyResolved(
      archetype,
      transportOption,
      vehicleType,
      vehicleOwnership,
      vehicleResolved,
      travelMode,
      requiereCoche,
      paseDominante,
      travelPassConfirmed,
    )
  const showCompanion = showDays && answers.days !== undefined
  const showExperiences =
    showCompanion &&
    isCompanionFullyResolved(
      answers.companion,
      answers.companionAdults,
      answers.companionChildrenAges,
      answers.companionGroupSize,
      archetype,
      vehicleType,
      companionCapacityAcknowledged,
    )
  const showPlaces = showExperiences && !suggestedExperiencesLoading && placesStepStarted
  const showPace = showPlaces && !suggestedPlacesLoading
  const showChronotype = showPace && answers.pace !== undefined
  const showBudget = showChronotype && answers.chronotype !== undefined
  const isComplete = showBudget && answers.budgetLevel !== undefined

  return (
    <div className="mx-auto max-w-lg space-y-4 px-6 py-16">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Volver a elegir destino"
        title="Volver a elegir destino"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg-card text-lg text-text transition-colors hover:border-border-accent hover:bg-bg-hover"
      >
        ←
      </button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 text-center">
        <p className="text-small uppercase tracking-wide text-text-muted">Planificando tu viaje</p>
        <h1 className="font-display text-h1 text-text">{destination}</h1>
      </motion.div>

      <QuestionCard title="¿Desde dónde viajas?">
        <OriginInput
          destination={destination}
          destinationPlace={destinationPlace}
          archetype={archetype}
          archetypeAmbiguous={archetypeAmbiguous}
          archetypeClassificationFailed={archetypeClassificationFailed}
          onRetryClassification={() => classifyInBackground(destination)}
          requiereCoche={requiereCoche}
          paseDominante={paseDominante}
          travelPassConfirmed={travelPassConfirmed}
          transportOption={transportOption}
          vehicleType={vehicleType}
          vehicleOwnership={vehicleOwnership}
          knownCamperAccess={knownCamperAccess}
          vehicleResolved={vehicleResolved}
          travelMode={travelMode}
          onOriginResolved={(origin, originPlace) => updateAnswers({ origin, originPlace })}
          onResolveArchetype={resolveArchetypeChoice}
          onTransportOptionChange={setTransportOption}
          onVehicleTypeChange={setVehicleType}
          onVehicleOwnershipChange={setVehicleOwnership}
          onVehicleResolvedChange={setVehicleResolved}
          onTravelModeChange={setTravelMode}
          onTravelPassConfirmedChange={setTravelPassConfirmed}
        />
      </QuestionCard>

      {showDays && (
        <QuestionCard title="¿Cuántos días?">
          <DurationSelector
            days={answers.days}
            dateRange={answers.dateRange}
            season={answers.season}
            onChange={updateAnswers}
          />
        </QuestionCard>
      )}

      {showCompanion && (
        <QuestionCard title="Elige tus acompañantes">
          <CompanionSelector
            companion={answers.companion}
            companionAdults={answers.companionAdults}
            companionChildrenAges={answers.companionChildrenAges}
            companionGroupSize={answers.companionGroupSize}
            archetype={archetype}
            vehicleType={vehicleType}
            capacityAcknowledged={companionCapacityAcknowledged}
            onChange={updateAnswers}
            onCapacityAcknowledgedChange={setCompanionCapacityAcknowledged}
            onResetVehicle={() => {
              setVehicleType(null)
              setVehicleResolved(false)
            }}
          />
        </QuestionCard>
      )}

      {showExperiences && (
        <QuestionCard title="Elige tus experiencias">
          <ExperienceSelector
            destinationName={destination}
            suggested={suggestedExperiences}
            loading={suggestedExperiencesLoading}
            failed={suggestedExperiencesFailed}
            selected={answers.experiences ?? []}
            onChange={(experiences) => updateAnswers({ experiences })}
            onRetry={() => suggestExperiencesInBackground(destination)}
            placesStepStarted={placesStepStarted}
            onConfirm={() => suggestPlacesOnDemand(destination, answers.experiences ?? [])}
          />
        </QuestionCard>
      )}

      {showPlaces && (
        <QuestionCard title="Elige lugares">
          <PlaceSelector
            destinationName={destination}
            places={suggestedPlaces}
            loading={suggestedPlacesLoading}
            failed={suggestedPlacesFailed}
            selectedIds={selectedPlaceIds}
            experiences={answers.experiences ?? []}
            onToggle={toggleSelectedPlace}
            onToggleAll={toggleSelectAllPlaces}
            onRetry={() => suggestPlacesOnDemand(destination, answers.experiences ?? [])}
          />
        </QuestionCard>
      )}

      {showPace && (
        <QuestionCard title="Tu ritmo">
          <div className="space-y-2">
            {paceOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                icon={option.icon}
                label={option.label}
                description={option.description}
                selected={answers.pace === option.value}
                onClick={() => updateAnswers({ pace: option.value })}
              />
            ))}
          </div>
        </QuestionCard>
      )}

      {showChronotype && (
        <QuestionCard title="Elige tu horario">
          <div className="space-y-2">
            {chronotypeOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                icon={option.icon}
                label={option.label}
                description={option.description}
                selected={answers.chronotype === option.value}
                onClick={() => updateAnswers({ chronotype: option.value })}
              />
            ))}
          </div>
        </QuestionCard>
      )}

      {showBudget && (
        <QuestionCard title="Presupuesto">
          <div className="space-y-2">
            {budgetOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                icon={option.icon}
                label={option.label}
                description={option.description}
                selected={answers.budgetLevel === option.value}
                onClick={() => updateAnswers({ budgetLevel: option.value })}
              />
            ))}
          </div>
        </QuestionCard>
      )}

      {isComplete && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-2 text-center">
          <Button
            onClick={() => {
              // Si el usuario nunca fijó fechas exactas ni eligió estación, aplicamos la
              // estación actual del sistema para no bloquear el flujo.
              if (answers.days !== undefined && !answers.dateRange && !answers.season) {
                updateAnswers({ season: getCurrentSeason() })
              }
              setScreen('loading')
            }}
            className="w-full"
          >
            ✨ Crear mi ruta
          </Button>
        </motion.div>
      )}
    </div>
  )
}
