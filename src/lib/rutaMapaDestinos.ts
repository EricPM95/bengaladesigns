/**
 * EL MAPA DE LA PESTAÑA RUTA (Tanda 10B): solo los destinos del viaje y los puntos por donde se llega, nunca las paradas (eso es el mapa de DÍAS).
 * Los puntos salen de `data/dias/<destino>/_llegada.json → medios`, según el medio con el que se llega:
 *   avión → los aeropuertos · tren → las estaciones · autobús → la estación de autobuses · ferry → el puerto · coche → ningún punto, solo la ciudad.
 * Si el viajero ya eligió el punto que va a usar (su vuelo, su tren, su autobús), ese va resaltado. Iconos finos y en oro, como los demás de la app.
 */
import type { StopsMapMarker } from '../components/map/StopsMapView'
import { arrivalModeOf, type ArrivalInfo, type ArrivalMode } from './arrivalReturn'
import { haversineMeters } from './distanceMock'
import { ICONOS, type NombreIcono } from './iconos'
import type { Coordinates } from './types'

/** El icono de cada medio (nombres de `src/lib/iconos.ts`). El coche no lleva puntos. */
export const ICONO_DEL_MEDIO: Record<ArrivalMode, NombreIcono | null> = { avion: 'avion', tren: 'tren', bus: 'bus', ferry: 'barco', coche: null }

const ORO = '#A67C52'
const MARFIL = '#FFFDF8'

/** A partir de cuántos km el medio que se deduce de su origen es el avión (por debajo no se puede saber si va en tren, autobús o coche). */
export const KM_PARA_DEDUCIR_AVION = 500

/**
 * Cómo llega, para el mapa de RUTA (Tanda 10C): el medio que eligió en el formulario; si no eligió, el que se deduce de su origen (lejos: avión); si tampoco se puede deducir (sin origen, o tan cerca
 * que podría ir de varias maneras), `null`: el mapa enseña el punto donde conecta todo (en Roma, Termini).
 */
export function deducirMedio({ opcionElegida, origen, destino }: { opcionElegida?: string | null; origen?: Coordinates | null; destino?: Coordinates | null }): ArrivalMode | null {
  if (opcionElegida) return arrivalModeOf(opcionElegida, 1)
  if (origen && destino && haversineMeters(origen, destino) / 1000 >= KM_PARA_DEDUCIR_AVION) return 'avion'
  return null
}

export interface MapaDeDestinosEntrada {
  /** El destino y dónde está (el centro de la ciudad). */
  ciudad: string
  centro: Coordinates
  /** El medio con el que se llega (null: no se puede deducir) y los datos de llegada del destino (null: sin datos). */
  modo: ArrivalMode | null
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
  // Sin medio que deducir: el punto donde conecta todo (el primero del tren: en Roma, Termini), con el icono del tren.
  const icono = modo ? ICONO_DEL_MEDIO[modo] : info?.medios.tren ? 'tren' : null
  const puntos = (modo ? (icono ? info?.medios[modo]?.puntos : null) : info?.medios.tren?.puntos.slice(0, 1)) ?? []
  const elegidos = new Set<string>()
  if (entrada.puntoLlegadaId) elegidos.add(entrada.puntoLlegadaId)
  if (entrada.puntoSalidaId && (entrada.modoVuelta ?? modo) === modo && modo !== null) elegidos.add(entrada.puntoSalidaId)
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
