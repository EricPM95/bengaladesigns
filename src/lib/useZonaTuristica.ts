import { useEffect, useState } from 'react'
import type { Coordinates } from './types'
import { hasRealCoordinates } from './distanceMock'
import { reverseGeocodeZone } from './mapboxReverseGeocode'
import { fetchZonaTuristica } from './zonaTuristicaApi'

export interface ZonaTuristicaResult {
  /** Nombre en bruto (geocodificación administrativa, ej. "Sant'Eustachio") — ancla geográfica interna para la búsqueda de restaurantes, NUNCA se muestra en UI (ver BLOQUE C, feedback de calidad). */
  zonaBusqueda: string
  /** Nombre que un turista reconocería (ej. "Centro Histórico"), o null si ninguno aplica — esto es lo único que debe mostrarse; cuando es null, el título omite la zona por completo. */
  zonaMostrada: string | null
}

/**
 * Resuelve el nombre de zona de unas coordenadas en dos pasos: geocodificación inversa de Mapbox
 * (barrio/rione administrativo, rápido) → traducción a nombre turístico vía /api/zona-turistica
 * (Claude, cacheado por destino+zona en bruto — ver zonaTuristicaApi.ts). Compartido entre
 * MealTimeAccordion.tsx (título de la fila cerrada) y MealDetailSheet.tsx (título de la pantalla
 * completa) — mismo resultado, el segundo uso es gratis gracias al caché en memoria de
 * zonaTuristicaApi.ts.
 */
export function useZonaTuristica(destino: string, city: string, coordinates: Coordinates): ZonaTuristicaResult {
  const [zonaBusqueda, setZonaBusqueda] = useState(city)
  const [zonaMostrada, setZonaMostrada] = useState<string | null>(null)

  useEffect(() => {
    setZonaMostrada(null)
    if (!hasRealCoordinates(coordinates)) return
    let cancelled = false
    reverseGeocodeZone(coordinates).then((zonaBruta) => {
      if (cancelled || !zonaBruta) return
      setZonaBusqueda(zonaBruta)
      fetchZonaTuristica(destino, zonaBruta).then((zonaTuristica) => {
        if (!cancelled) setZonaMostrada(zonaTuristica)
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates.lat, coordinates.lng, destino])

  return { zonaBusqueda, zonaMostrada }
}
