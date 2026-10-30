import { useEffect, useMemo, useState } from 'react'
import type { DestinationPlace } from './destinationPlacesApi'
import { buscar, normalizarTexto } from './busqueda'
import { useDestinationPool } from './useDestinationPool'
import { getPoolPhoto, prefetchPoolPhotos } from './placePhoto'
import { haversineMeters, hasRealCoordinates } from './distanceMock'

/**
 * (Tanda 10S5, apartado 1) «Añadir parada» (AddStopScreen) y AttractionsFinder buscan PRIMERO en nuestros sitios (con su foto, horario, entrada e historia) y debajo, con el título «Otros sitios», lo del mapa.
 * Aquí: el catálogo de nuestros sitios del viaje (el del destino y, si es otro, el de la ciudad del día), la búsqueda con la forma de buscar de la 10S4 (`busqueda.ts`: sin acentos, a medias, con erratas, en italiano),
 * sus fotos pequeñas y la quita de lo del mapa que ya es uno de los nuestros (para no verlo dos veces).
 */
export const TITULO_OTROS_SITIOS = 'Otros sitios'

/** Los sitios nuestros que se pueden visitar y encajan con lo escrito: el mejor primero. Sin restaurantes, baños ni la entrada del Free Tour (esos no son una parada de este buscador). */
export function buscarEnNuestrosSitios(places: readonly DestinationPlace[], texto: string, max = 5): DestinationPlace[] {
  const visitables = places.filter((place) => place.kind === 'place' && !place.solo_entradas && !place.fuera_de_lista)
  return buscar(visitables, texto, (place) => [place.name, ...(place.search_aliases ?? [])], { max })
}

/**
 * Lo del mapa SIN lo que ya es uno de nuestros sitios: un resultado del mapa que se llama como uno de los nuestros (por nombre o alias) y está a menos de 400 m es el mismo sitio y no se repite en «Otros sitios».
 * Con nuestros sitios vacíos, devuelve todo.
 */
export function sinLosNuestros<T extends { name: string; coordinates: { lat: number; lng: number } }>(delMapa: readonly T[], nuestros: readonly DestinationPlace[]): T[] {
  if (nuestros.length === 0) return [...delMapa]
  return delMapa.filter((candidato) => {
    const nombre = normalizarTexto(candidato.name)
    return !nuestros.some((place) => {
      const mismoNombre = [place.name, ...(place.search_aliases ?? [])].some((texto) => normalizarTexto(texto) === nombre)
      if (!mismoNombre) return false
      return !hasRealCoordinates(candidato.coordinates) || !hasRealCoordinates(place.coordinates) || haversineMeters(candidato.coordinates, place.coordinates) < 400
    })
  })
}

/** Una línea con lo que el viajero quiere ver de un sitio nuestro: su horario y si lleva entrada («09:00-19:00 · Con entrada»). */
export function lineaDeSitio(place: Pick<DestinationPlace, 'schedule' | 'requires_ticket' | 'duration_min'>): string {
  const partes: string[] = []
  if (place.schedule) partes.push(place.schedule)
  partes.push(place.requires_ticket ? 'Con entrada' : 'Acceso libre')
  return partes.join(' · ')
}

/** La historia corta del sitio (la de «Por qué te lo recomendamos»), recortada a una frase larga. */
export function historiaCorta(place: Pick<DestinationPlace, 'por_que_recomendamos'>, max = 110): string | null {
  const texto = (place.por_que_recomendamos ?? '').trim()
  if (!texto) return null
  if (texto.length <= max) return texto
  const corte = texto.slice(0, max)
  return `${corte.slice(0, Math.max(corte.lastIndexOf(' '), 40))}…`
}

/** Los sitios nuestros del viaje para lo escrito, con sus fotos (de partida las ya guardadas; el resto llega y repinta). `activo` evita pedir el catálogo hasta que se abre la pantalla. */
export function useSitiosNuestros(destino: string, ciudad: string, texto: string, activo: boolean): { nuestros: DestinationPlace[]; todos: DestinationPlace[]; foto: (place: DestinationPlace) => string | null; cargando: boolean } {
  const principal = useDestinationPool(destino, activo)
  const distinta = Boolean(ciudad) && ciudad.trim().toLowerCase() !== destino.trim().toLowerCase()
  const secundaria = useDestinationPool(distinta ? ciudad : '', activo && distinta)
  const todos = useMemo(() => {
    const vistos = new Set<string>()
    const lista: DestinationPlace[] = []
    for (const place of [...principal.places, ...secundaria.places]) {
      if (vistos.has(place.name)) continue
      vistos.add(place.name)
      lista.push(place)
    }
    return lista
  }, [principal.places, secundaria.places])
  const nuestros = useMemo(() => buscarEnNuestrosSitios(todos, texto), [todos, texto])
  const [, repintar] = useState(0)
  const clave = nuestros.map((place) => place.name).join('|')
  useEffect(() => {
    if (nuestros.length === 0 || !destino) return undefined
    let cancelado = false
    void prefetchPoolPhotos(destino, nuestros.map((place) => place.photo_name ?? place.name)).then(() => {
      if (!cancelado) repintar((n) => n + 1)
    })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, destino])
  const foto = (place: DestinationPlace) => getPoolPhoto(destino, place.photo_name ?? place.name)
  return { nuestros, todos, foto, cargando: principal.loading || secundaria.loading }
}
