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
 *
 * `curatedZone`, cuando llega (rutas del pipeline v2, ver MealSlot.curatedZone/meal_zones en
 * routeAlgorithm.js), se usa TAL CUAL — se salta la geocodificación en vivo entera (ni Mapbox ni
 * Claude), tanto para `zonaMostrada` como para `zonaBusqueda` (la zona curada, ej. "Monti", es un
 * ancla de búsqueda de restaurantes igual de buena o mejor que un barrio administrativo en bruto).
 * Encontrado en vivo: la geocodificación en vivo no tiene por qué coincidir con la zona que el
 * propio destino curado considera "la zona del día" (ej. Foro Romano cae geográficamente cerca del
 * límite con "Centro Storico" aunque el curador lo clasifique como "Roma Antigua") — con datos
 * curados de por medio, mejor confiar en ellos que en una geocodificación independiente.
 */
export function useZonaTuristica(destino: string, city: string, coordinates: Coordinates, curatedZone?: string | null): ZonaTuristicaResult {
  const [zonaBusqueda, setZonaBusqueda] = useState(curatedZone || city)
  const [zonaMostrada, setZonaMostrada] = useState<string | null>(curatedZone || null)

  useEffect(() => {
    if (curatedZone) {
      setZonaBusqueda(curatedZone)
      setZonaMostrada(curatedZone)
      return
    }
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
  }, [coordinates.lat, coordinates.lng, destino, curatedZone])

  return { zonaBusqueda, zonaMostrada }
}
