import { useEffect, useRef, useState } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { runGeneration, type GenerationParams, type GenerationResumeState } from './routeGenerationOrchestrator'
import { mapGeneratedRouteToRoute } from './mapGeneratedRoute'
import { applyRealStopSchedule } from './stopScheduling'
import { enrichRoutePhotos } from './placePhoto'
import { saveGenerationCheckpoint } from './tripPersistence'
import type { QuestionnaireAnswers, Route } from './types'

export type GenerationStatus = 'loading' | 'done' | 'error'

/**
 * La generación de la ruta con lo que hay en el store: la usan la pantalla de carga (enlaces compartidos,
 * reanudar un viaje a medias) y el resumen final del formulario Trazo. Sacado tal cual de
 * LoadingScreenContainer (App.tsx): checkpoints guardados en Supabase, reintento desde el último
 * checkpoint y el remate que se reintenta al volver a primer plano si la pestaña se congeló.
 */
export function useRouteGeneration(enabled: boolean) {
  const destination = useRouteStore((state) => state.destination)
  const pendingResume = useSyncStore((state) => state.pendingResume)
  const setPendingResume = useSyncStore((state) => state.setPendingResume)
  const travelerId = useSyncStore((state) => state.travelerId)
  const generationComplete = useSyncStore((state) => state.generationComplete)
  const setGenerationComplete = useSyncStore((state) => state.setGenerationComplete)

  const [status, setStatus] = useState<GenerationStatus>('loading')
  const [checkpoint, setCheckpoint] = useState<GenerationResumeState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [route, setRoute] = useState<Route | null>(null)
  const [attempt, setAttempt] = useState(0)
  const lastCheckpointRef = useRef<GenerationResumeState | null>(null)
  const paramsRef = useRef<GenerationParams | null>(null)

  const finalizeRoute = async (finalCheckpoint: GenerationResumeState, params: GenerationParams) => {
    const mapped = mapGeneratedRouteToRoute(finalCheckpoint.generated, params.destination, params.answers, params.transportContext)
    mapped.mustIncludePlaces = params.mustIncludePlaces ?? []
    // El país del destino: el motor de los destinos curados no lo manda, pero el lugar que eligió el viajero
    // sí lo trae (para la bandera de la pestaña RUTA).
    const destinationCountry = useRouteStore.getState().destinationPlace?.countryCode ?? null
    if (destinationCountry) {
      for (const day of mapped.days) if (!day.countryCode) day.countryCode = destinationCountry.toLowerCase()
    }
    // El motor v3 ya trae las horas definitivas; los demás, el horario real por parada (stopScheduling.ts).
    const scheduled = finalCheckpoint.skeleton?.times_are_final ? mapped : await applyRealStopSchedule(mapped, params.answers.pace ?? 'balanced')
    await enrichRoutePhotos(scheduled).catch(() => {})
    return scheduled
  }

  useEffect(() => {
    if (!enabled || !destination) return
    let cancelled = false
    setStatus('loading')
    setRoute(null)
    setGenerationComplete(false)

    const resumeState = lastCheckpointRef.current ?? pendingResume
    if (pendingResume) setPendingResume(null)

    const store = useRouteStore.getState()
    const params: GenerationParams = resumeState
      ? resumeState.params
      : {
          destination,
          answers: store.answers as QuestionnaireAnswers,
          transportContext: {
            archetype: store.archetype,
            is_region: store.is_region,
            transport_option: store.transport_option,
            vehicle_type: store.vehicle_type,
            vehicle_ownership: store.vehicle_ownership,
            accommodation_mode: store.accommodation_mode,
            travel_mode: store.travel_mode,
            pase_dominante: store.pase_dominante,
            vehiculo_altamente_recomendado: store.vehiculo_altamente_recomendado,
            travel_pass_confirmed: store.travel_pass_confirmed,
          },
          // Destino no curado: lo marcado de la sugerencia; curado: lo marcado del pool. Solo una tiene contenido.
          mustIncludePlaces: [
            ...store.suggested_places.filter((place) => store.selected_place_ids.includes(place.id)).map((place) => place.name),
            ...store.selected_curated_place_names,
          ],
        }

    paramsRef.current = params
    setCheckpoint(resumeState)

    runGeneration(params, resumeState, async (nextCheckpoint) => {
      if (cancelled) return
      lastCheckpointRef.current = nextCheckpoint
      setCheckpoint(nextCheckpoint)
      if (travelerId) {
        try {
          const tripId = useSyncStore.getState().activeTripId
          const savedId = await saveGenerationCheckpoint(travelerId, tripId, nextCheckpoint)
          if (!tripId && savedId) useSyncStore.getState().setActiveTripId(savedId)
        } catch {
          // Sin conexión: la generación sigue en memoria; TripSync ya avisa del guardado.
        }
      }
      if (nextCheckpoint.phase === 'done' && !cancelled) {
        setGenerationComplete(true)
        const scheduled = await finalizeRoute(nextCheckpoint, params)
        if (cancelled) return
        setRoute(scheduled)
        setStatus('done')
      }
    }).catch((error: unknown) => {
      if (cancelled) return
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo generar la ruta.')
      setStatus('error')
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, destination, attempt])

  // Si la pestaña se congeló justo en el remate, se reintenta al volver a primer plano.
  useEffect(() => {
    if (!enabled) return
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      if (!generationComplete || status === 'done' || route) return
      const finalCheckpoint = lastCheckpointRef.current
      const params = paramsRef.current
      if (!finalCheckpoint || finalCheckpoint.phase !== 'done' || !params) return
      finalizeRoute(finalCheckpoint, params).then((scheduled) => {
        setRoute(scheduled)
        setStatus('done')
      })
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, generationComplete, status, route])

  return { status, checkpoint, route, errorMessage, retry: () => setAttempt((value) => value + 1) }
}
