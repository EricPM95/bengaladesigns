import { create } from 'zustand'
import type { Coordinates } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { destinoYaCargado } from './destinationExcursions'
import { buscarLugarPhoton, distanciaKm, referenciasDelViaje } from './buscarLugarPhoton'
import { zonaDeAlojamientoElegida } from './tuAlojamiento'
import { pagoActivo } from './pago'

/**
 * (V64 §6) «TU ALOJAMIENTO ESTÁ EN MONTI». Al guardar la dirección del alojamiento (escrita, puesta en el mapa o leída del documento) se mira en qué zona del destino cae; si no es la que el viajero eligió,
 * sale la hoja que pregunta si se cambia la zona (`HojaZonaDelAlojamiento`). Si no cae en ninguna zona, no se pregunta.
 *
 * Cada zona del destino (`data/pipeline_v2/<destino>.json › zonas_alojamiento`) lleva el punto de su centro; «cae en» = la zona de centro MÁS CERCANO, siempre que esté a menos de `radio_km` de la zona
 * (dato de cada zona; sin él, 2 km, el de una ciudad a pie: Lanzarote lo lleva porque sus zonas son pueblos y comarcas grandes). Vale igual para todos los destinos.
 *
 * Consultas: ninguna a Supabase. Si la dirección no trae su punto (escrita a mano o leída de un PDF), UNA búsqueda en Photon (OpenStreetMap, `buscarLugarPhoton`, ~1-3 KB, 1 o 2 peticiones) cuando
 * el viajero GUARDA (nunca en bucle ni al escribir); la repetida sale de la caché en memoria.
 */
export const RADIO_ZONA_POR_DEFECTO_KM = 2

export interface ZonaDelDestino {
  id: string
  nombre: string
  sub?: string
  coordinates?: Coordinates
  radio_km?: number
}

/** «Monti» (o «Centro» si la zona se llama «Centro (Panteón, Trevi, Navona)»): sin lo que va entre paréntesis. */
export const nombreCortoDeZona = (nombre: string): string => nombre.replace(/\s*\(.*\)\s*$/, '').trim()

/** La zona en la que cae un punto, o null si no cae en ninguna (más lejos que el radio de la más cercana). */
export function zonaDeUnPunto(punto: Coordinates, zonas: ZonaDelDestino[]): ZonaDelDestino | null {
  let mejor: ZonaDelDestino | null = null
  let distanciaMejor = Infinity
  for (const zona of zonas) {
    const c = zona.coordinates
    if (!c || !Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue
    const d = distanciaKm(punto, c)
    if (d < distanciaMejor) {
      mejor = zona
      distanciaMejor = d
    }
  }
  if (!mejor) return null
  return distanciaMejor <= (mejor.radio_km ?? RADIO_ZONA_POR_DEFECTO_KM) ? mejor : null
}

export interface PreguntaDeZona {
  zonaNueva: ZonaDelDestino
  zonaElegida: ZonaDelDestino
  /** La dirección que la ha provocado (para no volver a preguntar lo mismo si el viajero dijo «Dejarlo como está»). */
  clave: string
}

interface EstadoPregunta {
  pregunta: PreguntaDeZona | null
  poner: (p: PreguntaDeZona | null) => void
}
export const useZonaDelAlojamientoUi = create<EstadoPregunta>((set) => ({ pregunta: null, poner: (pregunta) => set({ pregunta }) }))

/** Lo que el viajero ya ha contestado «Dejarlo como está» (dirección + zona elegida): no se vuelve a preguntar. */
const dejadas = new Set<string>()
export const dejarLaZonaComoEsta = (clave: string) => dejadas.add(clave)

/**
 * Mira si la dirección guardada cae en otra zona que la elegida y, si es así, abre la pregunta. Solo con pase (la zona es de pago), solo si el viajero ya había elegido una zona
 * (con «Aún no lo sé» o sin zona no hay nada que contradecir) y solo si el destino tiene zonas con punto. `punto`: el del mapa o de la sugerencia, si lo hay; si no, se busca la dirección.
 */
export async function revisarLaZonaDelAlojamiento({ direccion, punto }: { direccion: string | null | undefined; punto?: Coordinates | null }): Promise<void> {
  const route = useRouteStore.getState().route
  if (!route || !pagoActivo()) return
  const elegidaId = route.accommodationZone
  if (!zonaDeAlojamientoElegida(elegidaId)) return
  const zonas = (destinoYaCargado(route.destination)?.zonasAlojamiento ?? []) as ZonaDelDestino[]
  const elegida = zonas.find((z) => z.id === elegidaId)
  if (!elegida) return
  let donde: Coordinates | null = punto && Number.isFinite(punto.lat) && Number.isFinite(punto.lng) ? { lat: punto.lat, lng: punto.lng } : null
  const texto = direccion?.trim() ?? ''
  if (!donde && texto.length >= 3) {
    const refs = referenciasDelViaje(route)
    const lugares = await buscarLugarPhoton(texto, refs[0] ?? null, refs)
    if (lugares[0]) donde = { lat: lugares[0].lat, lng: lugares[0].lng }
  }
  if (!donde) return
  const cae = zonaDeUnPunto(donde, zonas)
  if (!cae || cae.id === elegida.id) return
  const clave = `${texto || `${donde.lat.toFixed(4)},${donde.lng.toFixed(4)}`}|${elegida.id}`
  if (dejadas.has(clave)) return
  useZonaDelAlojamientoUi.getState().poner({ zonaNueva: cae, zonaElegida: elegida, clave })
}
