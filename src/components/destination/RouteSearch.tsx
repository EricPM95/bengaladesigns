import { useState } from 'react'
import type { Place } from '../../lib/types'
import { findCuratedRoute } from '../../lib/curatedRoutes'
import { interpretRoute } from '../../lib/interpretRoute'
import { searchPlaces } from '../../lib/mapboxGeocoding'
import { Button } from '../ui/Button'

export interface ConfirmedRoute {
  /** Nombre oficial de la ruta — se usa como `destination`. */
  name: string
  /** Lugar geocodado del punto de inicio típico — se usa como `destinationPlace`. */
  startPlace: Place | null
  /** De la lista curada (siempre conocido) o null si vino de Claude (se preguntará normalmente en Fase 2). */
  camperAccess: boolean | null
}

interface RouteCandidate {
  nombreOficial: string
  paisRegion: string
  puntoInicio: string
  puntoFin: string
  duracionDias: [number, number] | null
  camperAccess: boolean | null
}

interface RouteSearchProps {
  onConfirm: (route: ConfirmedRoute) => void
}

type Status = 'idle' | 'loading' | 'confirming' | 'not_found' | 'geocoding'

/**
 * "¿Buscas una ruta panorámica?" — para rutas/carreteras que Mapbox no puede geocodificar
 * directamente por ser corredores, no puntos (ej. "Ruta 66", "Ruta 40"). Comprueba primero
 * contra la lista curada (`curatedRoutes.ts`); si no hay coincidencia, recurre a Claude como
 * fallback. Nunca se asume automáticamente — siempre se muestra una tarjeta de confirmación.
 */
export function RouteSearch({ onConfirm }: RouteSearchProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [candidate, setCandidate] = useState<RouteCandidate | null>(null)

  const handleSearch = async () => {
    const query = text.trim()
    if (!query) return
    setStatus('loading')
    setCandidate(null)

    const curated = findCuratedRoute(query)
    if (curated) {
      setCandidate({
        nombreOficial: curated.nombre,
        paisRegion: curated.pais_region,
        puntoInicio: curated.punto_inicio.ciudad,
        puntoFin: curated.punto_fin.ciudad,
        duracionDias: curated.duracion_tipica_dias,
        camperAccess: curated.apto_camper_autocaravana,
      })
      setStatus('confirming')
      return
    }

    const result = await interpretRoute(query)
    if (!result.reconocida || !result.nombre_oficial || !result.punto_inicio || !result.punto_fin) {
      setStatus('not_found')
      return
    }

    setCandidate({
      nombreOficial: result.nombre_oficial,
      paisRegion: result.pais_region ?? '',
      puntoInicio: result.punto_inicio,
      puntoFin: result.punto_fin,
      duracionDias: result.duracion_tipica_dias ?? null,
      // Claude, a diferencia de la lista curada, no evalúa aptitud para camper aquí — se
      // preguntará con normalidad en la Fase 2 del transporte, como cualquier otro destino.
      camperAccess: null,
    })
    setStatus('confirming')
  }

  const handleConfirm = async () => {
    if (!candidate) return
    setStatus('geocoding')
    const results = await searchPlaces(candidate.puntoInicio).catch(() => [])
    onConfirm({ name: candidate.nombreOficial, startPlace: results[0] ?? null, camperAccess: candidate.camperAccess })
  }

  const handleReject = () => {
    setCandidate(null)
    setStatus('idle')
    setText('')
  }

  if (!open) {
    return (
      <div className="flex w-full justify-end">
        <button type="button" onClick={() => setOpen(true)} className="text-small text-text-muted underline hover:text-text-soft">
          ¿Buscas una ruta panorámica?
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            handleReject()
          }}
          className="text-small font-medium italic text-text-muted hover:text-text-soft"
        >
          Cancelar
        </button>
      </div>
      <p className="text-small text-text-soft">
        Escribe el nombre de la ruta o carretera panorámica que buscas (ej. "Ruta 66", "Ruta 40 Argentina")
      </p>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setStatus('idle')
            setCandidate(null)
          }}
          placeholder="Ruta 66"
          className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-body text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <Button onClick={handleSearch} disabled={!text.trim() || status === 'loading' || status === 'geocoding'}>
          {status === 'loading' ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {status === 'not_found' && (
        <p className="text-small text-text-soft">
          No hemos reconocido esta ruta con seguridad. Prueba a escribirla de otra forma, o usa el buscador normal de arriba.
        </p>
      )}

      {(status === 'confirming' || status === 'geocoding') && candidate && (
        <div className="space-y-2 rounded-xl border border-border bg-bg p-3">
          <p className="text-body text-text">
            ¿Te refieres a <strong>{candidate.nombreOficial}</strong>
            {candidate.paisRegion && `, en ${candidate.paisRegion}`} — normalmente de {candidate.puntoInicio} a {candidate.puntoFin}?
          </p>
          {candidate.duracionDias && (
            <p className="text-small text-text-muted">
              Se suele hacer en {candidate.duracionDias[0]}-{candidate.duracionDias[1]} días.
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={handleConfirm} disabled={status === 'geocoding'}>
              {status === 'geocoding' ? 'Confirmando...' : 'Sí, es esta'}
            </Button>
            <button type="button" onClick={handleReject} className="text-small font-medium italic text-text-muted hover:text-text-soft">
              No, buscar otra
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
