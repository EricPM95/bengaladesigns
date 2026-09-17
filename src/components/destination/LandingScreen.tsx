import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Place } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { classifyInBackground } from '../../lib/classifyInBackground'
import { suggestExperiencesInBackground } from '../../lib/suggestExperiencesInBackground'
import { PlaceAutocomplete } from '../ui/PlaceAutocomplete'
import { RouteSearch, type ConfirmedRoute } from './RouteSearch'

/**
 * Pantalla de bienvenida rediseñada — destino y origen JUNTOS en la misma pantalla (antes eran dos
 * pasos separados del cuestionario: DestinationScreen + OriginInput). El "Empezar →" solo se activa
 * con ambos rellenos; al pulsarlo se dispara EXACTAMENTE la misma cadena de efectos que antes
 * (classifyInBackground/suggestExperiencesInBackground/setArchetype forzado para rutas panorámicas
 * confirmadas), solo que ahora agrupada en un único punto de entrada en vez de repartida entre
 * DestinationScreen.handleSelectPlace/handleConfirmRoute y OriginInput.handleSubmitCity.
 */
export function LandingScreen() {
  const setDestination = useRouteStore((state) => state.setDestination)
  const setArchetype = useRouteStore((state) => state.setArchetype)
  const setKnownCamperAccess = useRouteStore((state) => state.setKnownCamperAccess)
  const updateAnswers = useRouteStore((state) => state.updateAnswers)
  const setScreen = useRouteStore((state) => state.setScreen)

  const [destinationText, setDestinationText] = useState('')
  const [destinationPlace, setDestinationPlace] = useState<Place | null>(null)
  // Ruta panorámica confirmada vía "¿Buscas una ruta panorámica?" — alternativa a destinationPlace,
  // nunca ambos a la vez (ver handlePickDestination/handleConfirmRoute).
  const [confirmedRoute, setConfirmedRoute] = useState<ConfirmedRoute | null>(null)

  const [originText, setOriginText] = useState('')
  const [originPlace, setOriginPlace] = useState<Place | null>(null)

  const destinationResolved = Boolean(destinationPlace || confirmedRoute)
  const canStart = destinationResolved && Boolean(originPlace)

  const handlePickDestination = (place: Place) => {
    setDestinationPlace(place)
    setConfirmedRoute(null)
    setDestinationText(place.fullName)
  }

  const handleConfirmRoute = (route: ConfirmedRoute) => {
    setConfirmedRoute(route)
    setDestinationPlace(null)
    setDestinationText(route.name)
  }

  const handleStart = () => {
    if (!canStart || !originPlace) return

    if (confirmedRoute) {
      // Rutas panorámicas confirmadas son inherentemente roadtrip_exclusivo — se fija el
      // arquetipo directo, sin pasar por /api/classify-destination (igual que antes).
      setDestination(confirmedRoute.name, confirmedRoute.startPlace)
      setArchetype('roadtrip_exclusivo', true)
      setKnownCamperAccess(confirmedRoute.camperAccess)
      suggestExperiencesInBackground(confirmedRoute.name)
    } else if (destinationPlace) {
      setDestination(destinationPlace.name, destinationPlace)
      classifyInBackground(destinationPlace.name)
      suggestExperiencesInBackground(destinationPlace.name)
    }

    updateAnswers({ origin: originPlace.name, originPlace })
    // Punto 6 del prompt DEFINITIVO: antes del cuestionario se muestra el "Pool de lugares" del
    // destino (solo consulta, ver PlacesPoolScreen) — esa pantalla se salta sola y pasa directo a
    // 'questionnaire' si el destino no está en el JSON curado, así que aquí siempre se puede
    // apuntar a 'placesPool' sin comprobar nada primero.
    setScreen('placesPool')
  }

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-[100svh] flex-col items-center justify-center bg-onb-bg px-6"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="font-playfair text-lg italic text-onb-accent"
        >
          Viajes Bengala
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
          className="text-center"
        >
          <h1 className="font-playfair text-4xl font-bold leading-[1.15] text-onb-text sm:text-5xl">¿A dónde vamos?</h1>
          <p className="mt-2 font-dmsans text-body text-onb-text-soft">Tu ruta personalizada en minutos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="w-full space-y-3"
        >
          <div className="rounded-onb-md border border-onb-border bg-onb-card p-1.5 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="shrink-0 text-onb-text-muted">🔍</span>
              <PlaceAutocomplete
                value={destinationText}
                onChange={(text) => {
                  setDestinationText(text)
                  setDestinationPlace(null)
                  setConfirmedRoute(null)
                }}
                onSelect={handlePickDestination}
                placeholder="¿A dónde quieres ir?"
                autoFocus
                wrapperClassName="flex-1"
                inputClassName="w-full bg-transparent font-dmsans text-body text-onb-text placeholder:text-onb-text-muted focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 px-3">
              <span className="h-px flex-1 bg-onb-border" />
              <span className="font-dmsans text-caption font-medium uppercase tracking-wide text-onb-text-muted">desde</span>
              <span className="h-px flex-1 bg-onb-border" />
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="shrink-0 text-onb-text-muted">📍</span>
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
                placeholder="¿Desde dónde sales?"
                wrapperClassName="flex-1"
                inputClassName="w-full bg-transparent font-dmsans text-body text-onb-text placeholder:text-onb-text-muted focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className="w-full rounded-onb-full bg-onb-accent py-3.5 font-dmsans text-body font-semibold text-white transition-colors hover:bg-onb-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Empezar →
          </button>

          <RouteSearch onConfirm={handleConfirmRoute} />
        </motion.div>

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => useRouteStore.getState().setScreen('devQuickRoute')}
            className="font-dmsans text-caption font-medium text-onb-text-muted underline hover:text-onb-text-soft"
          >
            🧪 Dev: ruta rápida (sin IA)
          </button>
        )}
      </div>
    </motion.div>
  )
}
