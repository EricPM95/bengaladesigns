import { useEffect, useState } from 'react'
import type { Place } from '../lib/types'
import type { TransportFeasibility } from '../lib/transportFeasibility'

interface UseTransportFeasibilityResult {
  loading: boolean
  error: boolean
  feasibility: TransportFeasibility | null
}

type Status = 'idle' | 'loading' | 'done' | 'error'

/**
 * Pide a Claude (vía nuestro backend) los hechos de viabilidad geográfica entre origen y
 * destino — Paso A, universal para cualquier arquetipo. Nada de copy ni de qué preguntar: eso
 * lo decide cada arquetipo a partir de este mismo resultado (Paso B).
 */
export function useTransportFeasibility(origin: Place | null, destination: Place | null): UseTransportFeasibilityResult {
  const [status, setStatus] = useState<Status>('idle')
  const [feasibility, setFeasibility] = useState<TransportFeasibility | null>(null)

  useEffect(() => {
    if (!origin || !destination) {
      setStatus('idle')
      setFeasibility(null)
      return
    }

    const controller = new AbortController()
    setStatus('loading')

    fetch('/api/transport-feasibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('request_failed')
        const data = (await response.json()) as TransportFeasibility
        setFeasibility(data)
        setStatus('done')
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setFeasibility(null)
        setStatus('error')
      })

    return () => controller.abort()
  }, [origin?.name, origin?.coordinates.lat, origin?.coordinates.lng, destination?.name, destination?.coordinates.lat, destination?.coordinates.lng])

  const hasInputs = Boolean(origin && destination)
  const loading = hasInputs && (status === 'idle' || status === 'loading')
  const error = status === 'error'

  return { loading, error, feasibility }
}
