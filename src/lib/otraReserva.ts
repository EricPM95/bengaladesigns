/**
 * (Tanda 10S4, apartado 4) [Añadir otra reserva] de RESERVAS: una casilla libre con sugerencias de sitios nuestros con entrada.
 *  - Sugerencia elegida (un sitio nuestro): la hoja de siempre y el sitio entra TAMBIÉN en la ruta, en el día elegido, como PRIMERA parada de ese día con la hora de la reserva, sin quitar nada del día.
 *  - Lo escrito, tal cual (no sabemos dónde está): solo en RESERVAS. Su `refId` lleva el prefijo `otra:` y la reserva va marcada `noMueve` (el motor no la mueve ni rehace nada por ella).
 * Pura salvo `anadirComoPrimeraParada`, que usa el almacén (igual que `ponerParadaEnElDia`).
 */
import type { DestinationPlace } from './destinationPlacesApi'
import type { Reservation } from './bookings'
import { buscar } from './busqueda'
import { ponerParadaEnElDia } from './cambiarParada'
import { freeTourStopFrom, FREE_TOUR_REF } from './freeTourManual'
import { stopFromPlace } from '../components/route/placeExplorer/PlaceExplorerScreen'
import { useRouteStore } from '../store/useRouteStore'

export const PREFIJO_OTRA_RESERVA = 'otra:'

/** ¿Es una reserva escrita a mano en [Añadir otra reserva] (sin sitio nuestro detrás)? */
export function esReservaLibre(reserva: Pick<Reservation, 'refId'> | null | undefined): boolean {
  return Boolean(reserva && reserva.refId.startsWith(PREFIJO_OTRA_RESERVA))
}

/** Un sitio nuestro con entrada que se puede sugerir. */
export interface SugerenciaDeEntrada {
  /** El nombre con el que se reserva (el del sitio, o el del Free Tour). */
  nombre: string
  place: DestinationPlace
  isFreeTour: boolean
  /** El nombre con el que se pide su foto pequeña. */
  fotoNombre: string
}

/** Los sitios con entrada del destino (las claves de `entradasPorSitio`) como candidatos a sugerir, con su ficha del catálogo. */
export function candidatosDeEntrada(sitiosConEntrada: string[], places: DestinationPlace[], freeTourEntry: DestinationPlace | null): SugerenciaDeEntrada[] {
  const out: SugerenciaDeEntrada[] = []
  for (const nombre of sitiosConEntrada) {
    if (/^free tour\b/i.test(nombre)) {
      if (freeTourEntry) out.push({ nombre: freeTourEntry.name, place: freeTourEntry, isFreeTour: true, fotoNombre: freeTourEntry.photo_name ?? freeTourEntry.name })
      continue
    }
    const place = places.find((candidato) => candidato.kind === 'place' && candidato.name === nombre)
    if (place) out.push({ nombre, place, isFreeTour: false, fotoNombre: place.name })
  }
  return out
}

/** Las sugerencias para lo escrito: sin acentos ni mayúsculas, palabras a medias, una letra equivocada y el nombre en italiano (alias del sitio). Hasta 4, la mejor primero. */
export function sugerenciasPara(texto: string, candidatos: SugerenciaDeEntrada[]): SugerenciaDeEntrada[] {
  return buscar(candidatos, texto, (c) => [c.nombre, ...(c.place.search_aliases ?? [])], { max: 4 })
}

/**
 * Mete el sitio sugerido en la ruta como PRIMERA parada del día elegido (sin pase y, de momento, con pase también), sin quitar nada. Si el día ya lleva el sitio, no añade otro y devuelve la parada que hay.
 * `reserva` trae la hora y el id (el Free Tour necesita su id para crear su parada). Devuelve `{ dayId, stopId }` para llevar al viajero a ella, o null si el día no admite paradas (excursión, vuelta) o no hay ruta.
 */
export function anadirComoPrimeraParada(dayId: string, sugerencia: SugerenciaDeEntrada, reserva: Pick<Reservation, 'id' | 'name' | 'placeNames' | 'time'>): { dayId: string; stopId: string } | null {
  const route = useRouteStore.getState().route
  const dia = route?.days.find((d) => d.id === dayId)
  if (!route || !dia || dia.isReturnLeg || dia.dayType === 'excursion') return null
  const nombres = reserva.placeNames
  const yaEsta = dia.stops.find((parada) => !parada.passThrough && (sugerencia.isFreeTour ? parada.isFreeTour : !parada.isFreeTour && nombres.includes(parada.name)))
  if (yaEsta) return { dayId, stopId: yaEsta.id }
  const parada = sugerencia.isFreeTour
    ? freeTourStopFrom(sugerencia.place, { ...reserva, placeNames: [sugerencia.nombre] })
    : { ...stopFromPlace(sugerencia.place, ''), time: reserva.time }
  const id = ponerParadaEnElDia(dayId, { ...parada, time: reserva.time }, { conPase: false })
  if (!id) return null
  void pedirFotoDeLaParada(id, sugerencia, dia.city || route.destination)
  return { dayId, stopId: id }
}

/** La foto real de la parada recién añadida (la misma lógica que el resto de paradas); sin foto, el recuadro neutro. Nunca rompe nada. */
async function pedirFotoDeLaParada(stopId: string, sugerencia: SugerenciaDeEntrada, ciudad: string): Promise<void> {
  try {
    const { fetchPlacePhoto } = await import('./placePhoto')
    const url = await fetchPlacePhoto(sugerencia.fotoNombre, ciudad, sugerencia.place.wikipedia_title, 'regular')
    if (!url) return
    useRouteStore.setState((actual) => ({
      route: actual.route ? { ...actual.route, days: actual.route.days.map((otro) => ({ ...otro, stops: otro.stops.map((p) => (p.id === stopId && !p.photoUrl ? { ...p, photoUrl: url } : p)) })) } : actual.route,
    }))
  } catch {
    // (Sin foto: la parada se queda con el recuadro neutro.)
  }
}

export { FREE_TOUR_REF }
