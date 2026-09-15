import { useEffect, useRef, useState } from 'react'
import type { Coordinates } from './types'
import { hasRealCoordinates } from './distanceMock'
import { fetchCuratedRestaurants, type CuratedRestaurant } from './mealRecommendationsApi'
import { searchNearbyPlaces, type NearbyPlaceResult } from './nearbyPlacesSearch'

/** ~15-20 min caminando (BLOQUE C, feedback de calidad: el radio por defecto de searchNearbyPlaces se sentía demasiado estrecho) — desplazamiento razonable para ir a comer sin ser absurdo. */
const NEARBY_RESTAURANT_RADIUS_METERS = 1400
/** La pantalla completa (MealDetailSheet.tsx) tiene sitio de sobra — más que el tope de 3 del antiguo acordeón inline, para aprovechar de verdad el radio ampliado. */
const NEARBY_RESULTS_CAP = 8

export interface MealRecommendationsResult {
  /** null mientras no se ha pedido nunca (ver `enabled`) o sigue en curso la primera vez para esta combinación de zona+franja. */
  curated: CuratedRestaurant[] | null
  nearby: NearbyPlaceResult[] | null
  loading: boolean
}

/**
 * "Nuestra selección" (curados, con búsqueda web real, cacheados en Supabase) + "Rápido y cerca"
 * (Mapbox Search Box en vivo, sin curar) para el bloque de comida/cena — ver MealDetailSheet.tsx.
 * Perezoso: solo pide algo la primera vez que `enabled` es true (la pantalla se abre), nunca al
 * montar el trigger/fila.
 *
 * MealDetailSheet.tsx es UNA sola instancia reutilizada para cualquier comida/cena de cualquier
 * parada del día (a diferencia del antiguo acordeón inline, que tenía una instancia propia por
 * franja) — por eso el fetch no puede depender solo de `enabled`: hace falta volver a pedir en
 * cuanto cambia la comida/parada real detrás (`zonaBusqueda`+`franja`+`destino`), aunque `enabled`
 * siga en true todo el rato entre una apertura y otra. `fetchedKeyRef` guarda la última combinación
 * ya pedida para no repetir la llamada si se cierra y se reabre exactamente la misma.
 */
export function useMealRecommendations(
  enabled: boolean,
  destino: string,
  zonaBusqueda: string,
  franja: 'comida' | 'cena',
  coordinates: Coordinates,
): MealRecommendationsResult {
  const [curated, setCurated] = useState<CuratedRestaurant[] | null>(null)
  const [nearby, setNearby] = useState<NearbyPlaceResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedKeyRef = useRef<string | null>(null)

  const key = `${destino.toLowerCase()}|${zonaBusqueda.toLowerCase()}|${franja}`

  useEffect(() => {
    if (!enabled || fetchedKeyRef.current === key) return
    fetchedKeyRef.current = key
    let cancelled = false
    setCurated(null)
    setNearby(null)
    setLoading(true)
    Promise.all([
      fetchCuratedRestaurants(destino, zonaBusqueda, franja),
      hasRealCoordinates(coordinates)
        ? searchNearbyPlaces(['restaurant'], coordinates, 'Restaurante cercano', undefined, NEARBY_RESTAURANT_RADIUS_METERS)
        : Promise.resolve([]),
    ]).then(([curatedResult, nearbyResult]) => {
      if (cancelled) return
      setCurated(curatedResult)
      setNearby(nearbyResult.slice(0, NEARBY_RESULTS_CAP))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key])

  return { curated, nearby, loading }
}
