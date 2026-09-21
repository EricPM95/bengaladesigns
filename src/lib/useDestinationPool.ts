import { useEffect, useState } from 'react'
import { fetchDestinationPlaces, type DestinationPlace } from './destinationPlacesApi'
import type { Excursion } from './types'

/**
 * Catálogo curado del destino (los 61 lugares de Roma hoy), o lista vacía si ese destino no tiene
 * ninguno. Quien llama usa `places.length > 0` para decidir entre la pantalla nueva de explorar
 * lugares y el buscador de Mapbox de siempre: un destino sin JSON curado no tiene pool que filtrar,
 * ordenar por likes ni ordenar por distancia, así que ahí la pantalla nueva no tendría nada que
 * mostrar.
 *
 * `resolved` es lo que evita el parpadeo de abrir el buscador viejo durante el primer render y
 * cambiarlo por la pantalla nueva medio segundo después: mientras sea false, todavía no se sabe qué
 * tiene este destino y no hay que enseñar ninguna de las dos.
 *
 * `enabled` evita pedirlo hasta que hace falta (la pantalla se abre bajo demanda); el cliente ya
 * cachea por destino, así que reabrirla no vuelve a llamar al servidor.
 */
export function useDestinationPool(
  destination: string,
  enabled: boolean,
): { places: DestinationPlace[]; excursions: Excursion[]; loading: boolean; resolved: boolean } {
  const [places, setPlaces] = useState<DestinationPlace[]>([])
  // Las excursiones del destino (6 en Roma) — el filtro "Excursiones" de la pantalla de lugares las
  // saca de aquí, no de la ruta: EXPLORAR no está mirando ningún día concreto.
  const [excursions, setExcursions] = useState<Excursion[]>([])
  const [loading, setLoading] = useState(false)
  const [resolvedFor, setResolvedFor] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !destination) return
    let cancelled = false
    setLoading(true)
    fetchDestinationPlaces(destination).then((found) => {
      if (cancelled) return
      setPlaces(found.places)
      setExcursions(found.excursions)
      setResolvedFor(destination)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [destination, enabled])

  return { places, excursions, loading, resolved: resolvedFor === destination }
}
