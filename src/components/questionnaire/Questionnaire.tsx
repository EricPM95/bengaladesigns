import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouteStore } from '../../store/useRouteStore'
import type { BudgetLevel, Chronotype, ExperienceId, TripPace } from '../../lib/types'
import { getCurrentSeason } from '../../lib/season'
import { isTransportFullyResolved } from '../../lib/transportFlow'
import { isCompanionFullyResolved } from '../../lib/companionFlow'
import { classifyInBackground } from '../../lib/classifyInBackground'
import { suggestExperiencesInBackground } from '../../lib/suggestExperiencesInBackground'
import { suggestPlacesInBackground } from '../../lib/suggestPlacesInBackground'
import { suggestPlacesOnDemand } from '../../lib/suggestPlacesOnDemand'
import { ChoiceButton } from './ChoiceButton'
import { OriginInput } from './OriginInput'
import { DurationSelector } from './DurationSelector'
import { CompanionSelector } from './CompanionSelector'
import { ExperienceSelector } from './ExperienceSelector'
import { PlaceSelector } from './PlaceSelector'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

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

type StepId = 'origin' | 'days' | 'companion' | 'experiences' | 'pace' | 'chronotype' | 'budget' | 'places'

const STEP_TITLES: Record<StepId, { title: string; subtitle?: string }> = {
  origin: { title: '¿Desde dónde viajas?' },
  days: { title: '¿Cuántos días?' },
  companion: { title: 'Elige tus acompañantes' },
  experiences: { title: 'Elige tus experiencias' },
  pace: { title: 'Tu ritmo' },
  chronotype: { title: 'Elige tu horario' },
  budget: { title: 'Presupuesto' },
  places: { title: 'Elige lugares' },
}

/**
 * Cuestionario como flujo de pantallas completas — una pregunta a la vez, con flecha de volver
 * (excepto en "destino", que vive fuera de este componente). El orden y las condiciones de
 * desbloqueo (showX) son las mismas de siempre; lo único que cambia es que ahora cada una se
 * muestra en su propia pantalla en vez de apilarse todas en una página larga.
 *
 * Avanza sola al tocar una opción, sin ningún botón "Continuar" visible — el ÚNICO caso con botón
 * explícito es "fechas" (`activeStep === 'days'`), a propósito: ahí es fácil equivocarse, así que
 * el avance automático queda desactivado (ver el guard `isViewingDays` en el efecto) y hace falta
 * confirmar. Para pace/chronotype/budget (una sola opción, resuelve la pantalla entera) el propio
 * `onClick` llama a `goToNextStep()` en el mismo tap — origen y acompañantes son flujos internos
 * más complejos sin un único "tap final", así que se detectan por el efecto de abajo en cuanto
 * `steps` crece. Retroceder con la flecha nunca borra la respuesta ya dada.
 *
 * IMPORTANTE: `suggested_places` (el streaming de /api/suggest-places) NUNCA se lee aquí arriba —
 * vive solo dentro de PlacesGrid/PlacesCreateRouteFooter más abajo, cada uno con su propia
 * suscripción. Se probó a leerlo aquí (para el botón "Crear mi ruta") y rompía justo la animación
 * de "avanza sola": con un lugar nuevo llegando cada ~1s, este componente entero volvía a
 * renderizar a ese ritmo, y esos renders de más pisaban a media transición la animación de salida
 * de framer-motion (mode="wait" espera a que termine para desmontar) — el usuario se quedaba
 * viendo la pantalla anterior indefinidamente aunque el paso ya hubiera avanzado por dentro. Aislar
 * esa suscripción en componentes hijos evita que sus renders se propaguen hacia arriba.
 */
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
  const setDatesConfirmed = useRouteStore((state) => state.setDatesConfirmed)
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

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  // Para el paso actualmente en pantalla: ¿ya existía el paso siguiente en el momento en que se
  // llegó a él (adelante o atrás)? Si sí, es una simple revisita a una respuesta ya dada — no debe
  // autoavanzar solo por eso. Si en algún momento posterior, SIN cambiar de paso, el siguiente pasa
  // a existir cuando antes no existía, es que el usuario acaba de completar (o re-completar tras
  // editar) este paso — ahí sí toca avanzar. Sustituye a comparar solo la LONGITUD global de
  // `steps`: ese chequeo fallaba al volver atrás a un paso ya desbloqueado, cambiar la respuesta y
  // confirmarla de nuevo — la longitud global de `steps` no "crecía" (esos pasos posteriores ya
  // estaban contados desde la primera vez), así que el auto-avance nunca se disparaba y el usuario
  // se quedaba bloqueado sin poder continuar (BUG 1).
  const arrivedAtStepRef = useRef<{ index: number; nextExisted: boolean }>({ index: 0, nextExisted: false })

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
  // "Elige lugares" (showPlaces) va al FINAL del cuestionario, justo antes del botón — pero se
  // dispara (placesStepStarted + suggestPlacesOnDemand) en cuanto se confirman las experiencias,
  // varios pasos antes de mostrarse (ver ExperienceSelector.onConfirm más abajo): así la sugerencia
  // de Claude ya está lista (o casi) cuando el usuario por fin llega a esta pantalla, en vez de
  // hacerle esperar aquí.
  const showPace = showExperiences && !suggestedExperiencesLoading && placesStepStarted
  const showChronotype = showPace && answers.pace !== undefined
  const showBudget = showChronotype && answers.chronotype !== undefined
  const showPlaces = showBudget && answers.budgetLevel !== undefined

  const steps: StepId[] = [
    'origin',
    ...(showDays ? (['days'] as const) : []),
    ...(showCompanion ? (['companion'] as const) : []),
    ...(showExperiences ? (['experiences'] as const) : []),
    ...(showPace ? (['pace'] as const) : []),
    ...(showChronotype ? (['chronotype'] as const) : []),
    ...(showBudget ? (['budget'] as const) : []),
    ...(showPlaces ? (['places'] as const) : []),
  ]

  const safeIndex = Math.min(currentStepIndex, steps.length - 1)
  const activeStep = steps[safeIndex]
  const nextStepExists = safeIndex < steps.length - 1

  // En cuanto la pregunta activa queda resuelta y se desbloquea la siguiente, avanza sola a esa
  // pantalla — mismo momento en que antes aparecía la tarjeta siguiente más abajo en la página
  // larga. Solo avanza si el paso siguiente NO existía ya cuando se llegó al actual (si volvió
  // atrás a revisar una respuesta anterior que ya estaba resuelta, no lo saca de ahí solo por
  // eso) — ver el comentario junto a `arrivedAtStepRef` más arriba para el porqué de este cambio.
  // "Fechas" es la única excepción explícita — se queda ahí y exige el botón "Continuar" propio de
  // esa pantalla en vez de avanzar sola (ver más abajo), porque ahí es fácil equivocarse de fecha.
  // useLayoutEffect (no useEffect) a propósito — corrige el índice ANTES de que el navegador pinte
  // el frame, así nunca se llega a ver el instante en que el paso siguiente ya existe pero
  // `currentStepIndex` todavía no lo refleja: ese único frame intermedio era el "parpadeo" que se
  // veía antes.
  useLayoutEffect(() => {
    const isViewingDays = activeStep === 'days'
    if (arrivedAtStepRef.current.index !== safeIndex) {
      arrivedAtStepRef.current = { index: safeIndex, nextExisted: nextStepExists }
      return
    }
    if (!nextStepExists) {
      // Sigue sin existir el siguiente paso, o ha dejado de existir porque el usuario está a
      // media edición de una respuesta anterior (ej. cambió de "a mi aire" a "aventura en tribu"
      // y todavía no ha rellenado las edades) — se anota aquí para que la PRÓXIMA vez que sí
      // exista se detecte como una transición real, nunca como "ya existía desde que llegamos".
      // Sin esto, un false→true→false→true mientras no se cambia de pantalla dejaba la marca de
      // "ya existía" congelada en el true más antiguo y el auto-avance dejaba de dispararse tras
      // volver a completar la respuesta.
      arrivedAtStepRef.current.nextExisted = false
      return
    }
    if (!isViewingDays && !arrivedAtStepRef.current.nextExisted) {
      arrivedAtStepRef.current.nextExisted = true
      setCurrentStepIndex(safeIndex + 1)
    }
  }, [safeIndex, nextStepExists, activeStep])

  if (!destination) return null

  const handleBack = () => {
    if (safeIndex === 0) {
      resetQuestionnaire()
      setScreen('destination')
      return
    }
    setCurrentStepIndex(safeIndex - 1)
  }

  /** Avanza a la pantalla siguiente en el MISMO tap que responde la pregunta — batcheado por React
      en un único render, así que nunca hay un frame intermedio que "parpadee" antes de cambiar de
      pantalla (a diferencia de esperar a que el efecto de arriba reaccione un tick después). Solo
      hace falta llamarlo explícitamente en las preguntas de una sola opción (pace/chronotype/
      budget) — origen y acompañantes son flujos internos más complejos, sin un único "tap final"
      claro, y se resuelven vía el efecto de arriba en cuanto quedan completos. */
  const goToNextStep = () => setCurrentStepIndex((index) => Math.min(index, steps.length - 1) + 1)

  const handleCreateRoute = () => {
    // Si el usuario nunca fijó fechas exactas ni eligió estación, aplicamos la estación actual
    // del sistema para no bloquear el flujo.
    if (answers.days !== undefined && !answers.dateRange && !answers.season) {
      updateAnswers({ season: getCurrentSeason() })
    }
    setScreen('loading')
  }

  const { title, subtitle } = STEP_TITLES[activeStep]

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="flex items-center justify-between px-6 pt-6">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Volver"
          title="Volver"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg-card text-lg text-text transition-colors hover:border-border-accent hover:bg-bg-hover"
        >
          ←
        </button>
        <p className="text-caption font-medium uppercase tracking-wide text-text-muted">
          {destination} · Paso {safeIndex + 1} de {steps.length}
        </p>
      </div>

      {/* `flex` + `m-auto` en el hijo (no `justify-center`, que en overflow recorta el principio del
          contenido en vez de dejarlo hacer scroll con normalidad) — centra la pantalla entera en
          ambos ejes cuando el contenido cabe (fechas, ritmo, horario...) y, si no cabe (el
          formulario de familia, la lista de lugares...), simplemente permite scroll desde arriba,
          sin recortes. */}
      <div className="flex flex-1 overflow-y-auto px-6 pb-10 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="m-auto w-full max-w-lg"
          >
            <h1 className="font-display text-h1 font-semibold text-text">{title}</h1>
            {subtitle && <p className="mt-1 text-small text-text-soft">{subtitle}</p>}

            <div className="mt-6">
              {activeStep === 'origin' && (
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
              )}

              {activeStep === 'days' && (
                <div className="space-y-4">
                  <DurationSelector days={answers.days} dateRange={answers.dateRange} season={answers.season} onChange={updateAnswers} />
                  {/* Única pantalla con botón "Continuar" explícito, sin avance automático — aquí
                      es más fácil equivocarse de fecha que en el resto del cuestionario, así que
                      conviene que el usuario confirme antes de seguir. Este tap es también el
                      momento en que se dispara la precarga en segundo plano del pool de lugares
                      (ver suggestPlacesInBackground.ts y el comentario en
                      suggestExperiencesInBackground.ts) — si la sugerencia de experiencias de
                      Claude ya resolvió, se lanza aquí mismo; si no, la lanzará ella sola en
                      cuanto resuelva (dates_confirmed ya estará en true para entonces). */}
                  {answers.days !== undefined && (
                    <Button
                      onClick={() => {
                        setDatesConfirmed(true)
                        if (suggestedExperiences.length > 0) {
                          suggestPlacesInBackground(destination, suggestedExperiences)
                        }
                        goToNextStep()
                      }}
                      className="w-full"
                    >
                      Continuar →
                    </Button>
                  )}
                </div>
              )}

              {activeStep === 'companion' && (
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
              )}

              {activeStep === 'experiences' && (
                <ExperienceSelector
                  destinationName={destination}
                  suggested={suggestedExperiences}
                  loading={suggestedExperiencesLoading}
                  failed={suggestedExperiencesFailed}
                  selected={answers.experiences ?? []}
                  onChange={(experiences) => updateAnswers({ experiences })}
                  onRetry={() => suggestExperiencesInBackground(destination)}
                  onConfirm={() => {
                    // BUG 1: `showPace` (y por tanto el auto-avance basado en que `steps` crezca)
                    // no cambia si `placesStepStarted` ya era true de una vuelta anterior — al
                    // revisitar esta pantalla, cambiar la selección y volver a confirmar, nunca se
                    // disparaba el avance. Igual que pace/chronotype/budget, se navega explícitamente
                    // en el mismo tap en vez de depender solo del efecto pasivo.
                    suggestPlacesOnDemand(destination, answers.experiences ?? [])
                    goToNextStep()
                  }}
                />
              )}

              {activeStep === 'pace' && (
                <div className="space-y-2">
                  {paceOptions.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      icon={option.icon}
                      label={option.label}
                      description={option.description}
                      selected={answers.pace === option.value}
                      onClick={() => {
                        updateAnswers({ pace: option.value })
                        goToNextStep()
                      }}
                    />
                  ))}
                </div>
              )}

              {activeStep === 'chronotype' && (
                <div className="space-y-2">
                  {chronotypeOptions.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      icon={option.icon}
                      label={option.label}
                      description={option.description}
                      selected={answers.chronotype === option.value}
                      onClick={() => {
                        updateAnswers({ chronotype: option.value })
                        goToNextStep()
                      }}
                    />
                  ))}
                </div>
              )}

              {activeStep === 'budget' && (
                <div className="space-y-2">
                  {budgetOptions.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      icon={option.icon}
                      label={option.label}
                      description={option.description}
                      selected={answers.budgetLevel === option.value}
                      onClick={() => {
                        updateAnswers({ budgetLevel: option.value })
                        goToNextStep()
                      }}
                    />
                  ))}
                </div>
              )}

              {activeStep === 'places' && (
                <PlacesGrid
                  destination={destination}
                  experiences={answers.experiences ?? []}
                  onRetry={() => suggestPlacesOnDemand(destination, answers.experiences ?? [])}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {activeStep === 'places' && (
        <div className="sticky bottom-0 z-10 border-t border-border bg-bg-card px-6 py-4">
          <div className="mx-auto w-full max-w-lg">
            <PlacesCreateRouteButton onCreateRoute={handleCreateRoute} />
          </div>
        </div>
      )}
    </div>
  )
}

interface PlacesGridProps {
  destination: string
  experiences: ExperienceId[]
  onRetry: () => void
}

/**
 * Aislado del render de Questionnaire a propósito (ver el comentario grande más arriba) — se
 * suscribe DIRECTAMENTE a `suggested_places`/loading/failed/selected_place_ids, así que solo ESTE
 * componente vuelve a renderizar en cada lugar nuevo que llega por streaming, no toda la pantalla.
 */
function PlacesGrid({ destination, experiences, onRetry }: PlacesGridProps) {
  const suggestedPlaces = useRouteStore((state) => state.suggested_places)
  const suggestedPlacesLoading = useRouteStore((state) => state.suggested_places_loading)
  const suggestedPlacesFailed = useRouteStore((state) => state.suggested_places_failed)
  const selectedPlaceIds = useRouteStore((state) => state.selected_place_ids)
  const toggleSelectedPlace = useRouteStore((state) => state.toggleSelectedPlace)
  const toggleSelectAllPlaces = useRouteStore((state) => state.toggleSelectAllPlaces)

  return (
    <PlaceSelector
      destinationName={destination}
      places={suggestedPlaces}
      loading={suggestedPlacesLoading}
      failed={suggestedPlacesFailed}
      selectedIds={selectedPlaceIds}
      experiences={experiences}
      onToggle={toggleSelectedPlace}
      onToggleAll={toggleSelectAllPlaces}
      onRetry={onRetry}
    />
  )
}

/** Mismo aislamiento que PlacesGrid, y por la misma razón — el botón "Crear mi ruta" también necesita suggested_places, pero no debe hacer que Questionnaire entero vuelva a renderizar por ello. */
function PlacesCreateRouteButton({ onCreateRoute }: { onCreateRoute: () => void }) {
  const suggestedPlaces = useRouteStore((state) => state.suggested_places)
  const suggestedPlacesLoading = useRouteStore((state) => state.suggested_places_loading)
  const suggestedPlacesFailed = useRouteStore((state) => state.suggested_places_failed)

  // Con streaming, "cargando" y "ya hay lugares que elegir" pueden ser ciertos a la vez — el viaje
  // solo necesita los lugares que el usuario MARQUE, así que en cuanto hay alguno donde elegir no
  // hace falta esperar a que terminen de llegar los 18-30. Solo bloquea si todavía no hay nada (o
  // si ni eso se consiguió).
  return (
    <Button onClick={onCreateRoute} disabled={suggestedPlaces.length === 0 && (suggestedPlacesLoading || suggestedPlacesFailed)} className="w-full">
      {suggestedPlaces.length === 0 && suggestedPlacesLoading ? (
        <>
          <Spinner className="text-white" />
          Cargando lugares...
        </>
      ) : (
        '✨ Crear mi ruta'
      )}
    </Button>
  )
}
