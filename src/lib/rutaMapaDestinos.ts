/**
 * EL MAPA DE LA PESTAÑA RUTA (Tanda 10B): solo los destinos del viaje y los puntos por donde se llega, nunca las paradas (eso es el mapa de DÍAS).
 * Los puntos salen de `data/dias/<destino>/_llegada.json → medios`, según el medio con el que se llega:
 *   avión → los aeropuertos · tren → las estaciones · autobús → la estación de autobuses · ferry → el puerto · coche → ningún punto, solo la ciudad.
 * Si el viajero ya eligió el punto que va a usar (su vuelo, su tren, su autobús), ese va resaltado. Iconos finos y en oro, como los demás de la app.
 */
import type { StopsMapMarker } from '../components/map/StopsMapView'
import type { ArrivalInfo, ArrivalMode } from './arrivalReturn'
import { ICONOS, type NombreIcono } from './iconos'
import type { Coordinates } from './types'

/** El icono de cada medio (nombres de `src/lib/iconos.ts`). El coche no lleva puntos. */
export const ICONO_DEL_MEDIO: Record<ArrivalMode, NombreIcono | null> = { avion: 'avion', tren: 'tren', bus: 'bus', ferry: 'barco', coche: null }

const ORO = '#8B6620'
const MARFIL = '#FFFDF8'

export interface MapaDeDestinosEntrada {
  /** El destino y dónde está (el centro de la ciudad). */
  ciudad: string
  centro: Coordinates
  /** El medio con el que se llega y los datos de llegada del destino (null: sin datos). */
  modo: ArrivalMode
  info: ArrivalInfo | null
  /** Los puntos elegidos en la ficha de llegada y de vuelta (ids de `_llegada.json`); ausentes: ninguno resaltado. */
  puntoLlegadaId?: string | null
  puntoSalidaId?: string | null
  /** El medio de la vuelta, si es otro: su punto elegido solo resalta si es de este mismo medio. */
  modoVuelta?: ArrivalMode
}

export interface MapaDeDestinos {
  markers: StopsMapMarker[]
  /** Los ids de los puntos resaltados (llevan un anillo de oro). */
  resaltados: string[]
}

export function construirMapaDeDestinos(entrada: MapaDeDestinosEntrada): MapaDeDestinos {
  const { ciudad, centro, modo, info } = entrada
  const markers: StopsMapMarker[] = [
    { id: 'destino', name: ciudad, coordinates: centro, number: 0, bg: ORO, text: MARFIL, icon: 'ubicacion', iconPath: ICONOS.ubicacion, size: 34 },
  ]
  const resaltados: string[] = []
  const icono = ICONO_DEL_MEDIO[modo]
  const puntos = (icono ? info?.medios[modo]?.puntos : null) ?? []
  const elegidos = new Set<string>()
  if (entrada.puntoLlegadaId) elegidos.add(entrada.puntoLlegadaId)
  if (entrada.puntoSalidaId && (entrada.modoVuelta ?? modo) === modo) elegidos.add(entrada.puntoSalidaId)
  for (const punto of puntos) {
    if (!punto.coordenadas || !icono) continue
    const id = `llegada:${punto.id}`
    const elegido = elegidos.has(punto.id)
    markers.push({
      id,
      name: punto.nombre,
      coordinates: { lat: punto.coordenadas.lat, lng: punto.coordenadas.lng },
      number: 0,
      bg: elegido ? ORO : MARFIL,
      text: elegido ? MARFIL : ORO,
      icon: icono,
      iconPath: ICONOS[icono],
      size: 30,
    })
    if (elegido) resaltados.push(id)
  }
  return { markers, resaltados }
}
