import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouteStore } from '../../store/useRouteStore'
import type { ExperienceId, TripPace } from '../../lib/types'
import { getCurrentSeason } from '../../lib/season'
import { isTransportFullyResolved } from '../../lib/transportFlow'
import { isCompanionFullyResolved } from '../../lib/companionFlow'
import { classifyInBackground } from '../../lib/classifyInBackground'
import { suggestPlacesInBackground } from '../../lib/suggestPlacesInBackground'
import { suggestPlacesOnDemand } from '../../lib/suggestPlacesOnDemand'
import { fetchPoolLevel, type PoolPlace } from '../../lib/placePoolCache'
import { TransportResolutionStep } from './TransportResolutionStep'
import { DurationSelector } from './DurationSelector'
import { CompanionSelector } from './CompanionSelector'
import { ExperienceCategorySelector } from './ExperienceCategorySelector'
import { deriveLegacyExperienceIds } from '../../lib/experienceCategoryBank'
import { PlaceSelector } from './PlaceSelector'
import { CuratedPlacesPool, poolSelectionLimit } from './CuratedPlacesPool'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

// Solo 2 de las 3 opciones de TripPace son alcanzables desde este selector (confirmado por el
// usuario) — bug real encontrado en vivo: "Completo" enviaba 'balanced', pero el backend
// (PACE_LABEL/MIN_STOPS_BY_PACE en server/index.js) trata 'balanced' como una variante de
// "Tranquilo" (mismo espíritu que 'zen', min. 4 paradas) — 'nonstop' es el valor que de verdad
// significa "Completo" ahí (min. 6 paradas, puede apilar dos visitas largas el mismo día). Con
// 'balanced', el pipeline generaba rutas mucho más ligeras de lo esperado para "Completo" — en un
// viaje de pocos días, esto hacía que el esqueleto prefiriera meter una excursión de día completo
// en vez de aprovechar los días en el propio destino.
const paceOptions: { value: TripPace; icon: string; label: string; description: string }[] = [
  { value: 'zen', icon: '🌿', label: 'Tranquilo', description: '2-3 paradas/día, mañanas tranquilas, pausas largas' },
  { value: 'nonstop', icon: '⚡', label: 'Completo', description: '7-8 paradas/día, aprovechando el día al máximo' },
]

type StepId = 'transport' | 'days' | 'companion' | 'experiences' | 'pace' | 'places'

function getStepTitle(step: StepId, destination: string): { title: string; subtitle?: string } {
  switch (step) {
    case 'transport':
      return { title: '¿Cómo llegas?' }
    case 'days':
      return { title: `Tu viaje a ${destination}` }
    case 'companion':
      return { title: 'Elige tus acompañantes' }
    case 'experiences':
      return { title: 'Elige tus experiencias' }
    case 'pace':
      return { title: 'Tu ritmo' }
    case 'places':
      return { title: '¿Cuáles te hacen ilusión?' }
  }
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
 * confirmar. Para pace (una sola opción, resuelve la pantalla entera) el propio
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
  const setPlacesStepStarted = useRouteStore((state) => state.setPlacesStepStarted)
  const selectedCuratedPlaceNames = useRouteStore((state) => state.selected_curated_place_names)
  const toggleCuratedPlaceSelection = useRouteStore((state) => state.toggleCuratedPlaceSelection)
  const trimCuratedPlaceSelection = useRouteStore((state) => state.trimCuratedPlaceSelection)

  // "Elige lugares" (último paso, ver showPlaces) sustituye el flujo de Claude por el pool curado
  // cuando el destino está en el JSON — un solo lookup barato (sin coste, JSON directo, ver
  // /api/curated-places-pool) en cuanto se conoce el destino decide qué versión del paso mostrar.
  // `null` = todavía no se sabe, `false` = destino no curado (PlaceSelector de siempre).
  const [curatedPool, setCuratedPool] = useState<PoolPlace[] | null | false>(null)
  useEffect(() => {
    if (!destination) return
    let cancelled = false
    setCuratedPool(null)
    fetchPoolLevel(destination, 'pool').then((result) => {
      if (cancelled) return
      setCuratedPool(result.found ? result.places : false)
    })
    return () => {
      cancelled = true
    }
  }, [destination])

  // Ronda 10: el tope de selección del pool depende de la duración del viaje, y el viajero puede
  // volver atrás y acortarlo DESPUÉS de haber marcado lugares (7 marcados en un viaje de 4 días →
  // vuelve atrás y lo deja en 2 días, donde el tope es 5). Sin esto, esos 2 de más seguirían
  // viajando hasta la generación como obligatorios aunque la interfaz ya no los deje marcar.
  useEffect(() => {
    trimCuratedPlaceSelection(poolSelectionLimit(answers.days))
  }, [answers.days, trimCuratedPlaceSelection])

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
  // Dirección del último cambio de paso (adelante/atrás) — decide de qué lado entra/sale la
  // pantalla en la transición de abajo (450ms cubic-bezier(0.22,1,0.36,1), como el prototipo).
  // Mismo patrón que arrivedAtStepRef: se compara contra el índice anterior en un useLayoutEffect
  // para no depender de guardar "por qué botón se llegó aquí" en ningún otro sitio.
  const [direction, setDirection] = useState<1 | -1>(1)
  const prevIndexRef = useRef(0)

  const showDays = isTransportFullyResolved(
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
  const showPlaces = showPace && answers.pace !== undefined

  const steps: StepId[] = [
    'transport',
    ...(showDays ? (['days'] as const) : []),
    ...(showCompanion ? (['companion'] as const) : []),
    ...(showExperiences ? (['experiences'] as const) : []),
    ...(showPace ? (['pace'] as const) : []),
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

  useLayoutEffect(() => {
    if (safeIndex !== prevIndexRef.current) {
      setDirection(safeIndex > prevIndexRef.current ? 1 : -1)
      prevIndexRef.current = safeIndex
    }
  }, [safeIndex])

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

  const { title, subtitle } = getStepTitle(activeStep, destination)

  return (
    <div className="flex min-h-dvh flex-col bg-onb-bg">
      <div className="flex items-center justify-between px-6 pt-6">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Volver"
          title="Volver"
          className="flex h-11 w-11 items-center justify-center rounded-onb-md border border-onb-border bg-onb-card text-lg text-onb-text transition-colors hover:border-onb-accent/50 hover:bg-onb-accent-light"
        >
          ←
        </button>
        <p className="font-dmsans text-caption font-medium uppercase tracking-wide text-onb-text-muted">
          {destination} · Paso {safeIndex + 1} de {steps.length}
        </p>
      </div>

      {/* `flex` + `m-auto` en el hijo (no `justify-center`, que en overflow recorta el principio del
          contenido en vez de dejarlo hacer scroll con normalidad) — centra la pantalla entera en
          ambos ejes cuando el contenido cabe (fechas, ritmo, horario...) y, si no cabe (el
          formulario de familia, la lista de lugares...), simplemente permite scroll desde arriba,
          sin recortes. Transición slide+fade 450ms cubic-bezier(0.22,1,0.36,1) — misma curva y
          duración exactas del prototipo, con dirección invertida al volver atrás (`direction`,
          ver el useLayoutEffect de arriba). */}
      <div className="flex flex-1 overflow-y-auto overflow-x-hidden px-6 pb-10 pt-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="m-auto w-full max-w-lg"
          >
            <h1 className="font-playfair text-h1 font-bold text-onb-text">{title}</h1>
            {subtitle && <p className="mt-1 font-dmsans text-small text-onb-text-soft">{subtitle}</p>}

            <div className="mt-6">
              {activeStep === 'transport' && (
                <TransportResolutionStep
                  destination={destination}
                  destinationPlace={destinationPlace}
                  originPlace={answers.originPlace ?? null}
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
                    <button
                      type="button"
                      onClick={() => {
                        setDatesConfirmed(true)
                        if (suggestedExperiences.length > 0) {
                          suggestPlacesInBackground(destination, suggestedExperiences)
                        }
                        goToNextStep()
                      }}
                      className="w-full rounded-onb-full bg-onb-accent py-3.5 font-dmsans text-body font-semibold text-white transition-colors hover:bg-onb-accent-hover"
                    >
                      Continuar →
                    </button>
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
                <ExperienceCategorySelector
                  season={answers.season}
                  positive={answers.experiencesPositive ?? ['imprescindibles']}
                  negative={answers.experiencesNegative ?? []}
                  onChange={(experiencesPositive, experiencesNegative) =>
                    updateAnswers({ experiencesPositive, experiencesNegative, experiences: deriveLegacyExperienceIds(experiencesPositive) })
                  }
                  onConfirm={() => {
                    const experiencesPositive = answers.experiencesPositive ?? ['imprescindibles']
                    const experiencesNegative = answers.experiencesNegative ?? []
                    const experiences = deriveLegacyExperienceIds(experiencesPositive)
                    // BUG 1: `showPace` (y por tanto el auto-avance basado en que `steps` crezca)
                    // no cambia si `placesStepStarted` ya era true de una vuelta anterior — al
                    // revisitar esta pantalla, cambiar la selección y volver a confirmar, nunca se
                    // disparaba el avance. Igual que pace, se navega explícitamente
                    // en el mismo tap en vez de depender solo del efecto pasivo.
                    updateAnswers({ experiencesPositive, experiencesNegative, experiences })
                    // Precarga temprana SOLO si ya sabemos que el destino no es curado — para uno
                    // curado, "Elige lugares" muestra el pool del JSON (cero coste, ver
                    // CuratedPlacesPool) y jamás debe llamar a Claude. Si `curatedPool` todavía no
                    // resolvió (raro, el lookup ya lleva varios pasos corriendo en paralelo), el
                    // propio paso "places" dispara el fallback al llegar (ver PlacesGrid más abajo)
                    // en vez de arriesgarse aquí a gastar una llamada de más en un destino curado.
                    if (curatedPool === false) suggestPlacesOnDemand(destination, experiences)
                    else setPlacesStepStarted(true)
                    goToNextStep()
                  }}
                />
              )}

              {activeStep === 'pace' && (
                <div className="grid grid-cols-2 gap-3">
                  {paceOptions.map((option) => {
                    const active = answers.pace === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          updateAnswers({ pace: option.value })
                          goToNextStep()
                        }}
                        className={`flex flex-col items-center gap-2 rounded-onb-lg border p-6 text-center transition-colors ${
                          active ? 'border-onb-accent bg-onb-accent-light' : 'border-onb-border bg-onb-card hover:border-onb-accent/50'
                        }`}
                      >
                        <span className="text-3xl leading-none">{option.icon}</span>
                        <span className={`font-dmsans text-body font-semibold ${active ? 'text-onb-accent-hover' : 'text-onb-text'}`}>{option.label}</span>
                        <span className="font-dmsans text-small text-onb-text-soft">{option.description}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {activeStep === 'places' && curatedPool === null && (
                <p className="flex items-center gap-2 text-small italic text-onb-text-soft">
                  <Spinner className="text-onb-accent" />
                  Viendo qué lugares hay en {destination}...
                </p>
              )}

              {activeStep === 'places' && curatedPool && (
                <CuratedPlacesPool
                  destination={destination}
                  places={curatedPool}
                  selectedNames={selectedCuratedPlaceNames}
                  limit={poolSelectionLimit(answers.days)}
                  onToggle={toggleCuratedPlaceSelection}
                />
              )}

              {activeStep === 'places' && curatedPool === false && (
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
        <div className="sticky bottom-0 z-10 border-t border-onb-border bg-onb-card px-6 py-4">
          <div className="mx-auto w-full max-w-lg">
            {curatedPool ? (
              // Destino curado: el pool ya está cargado (cero coste), nunca depende de Claude — el
              // botón siempre puede avanzar, marque o no marque nada el viajero.
              <button
                type="button"
                onClick={handleCreateRoute}
                className="w-full rounded-onb-full bg-onb-accent py-3.5 font-dmsans text-body font-semibold text-white transition-colors hover:bg-onb-accent-hover"
              >
                ✨ Crear mi ruta
              </button>
            ) : (
              <PlacesCreateRouteButton onCreateRoute={handleCreateRoute} />
            )}
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

  // Red de seguridad: normalmente ya se disparó al confirmar experiencias (precarga con ventaja, ver
  // el onConfirm de ExperienceCategorySelector), pero si `curatedPool` todavía no había resuelto en
  // ese momento (destino confirmado no-curado detectado tarde), este paso puede llegar sin haber
  // pedido nunca la sugerencia — suggestPlacesOnDemand ya es idempotente (no repite si el conjunto de
  // experiencias no cambió), así que llamarlo aquí también es seguro.
  useEffect(() => {
    suggestPlacesOnDemand(destination, experiences)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination])

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
