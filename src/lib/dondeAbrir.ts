/**
 * DÓNDE ABRE LA APP al arrancar con la sesión abierta (Tanda 10G, Eric 23-oct). Pura, para poder probarla sin Supabase:
 *   1. Un viaje con la generación a medias: se retoma.
 *   2. Si hoy es un día de un viaje: ese viaje, en HOY.
 *   3. Si no, tu ÚLTIMO viaje (el guardado más reciente), siempre en RUTA y sin día elegido, aunque antes estuvieras en otra pestaña.
 *   4. Sin viajes, la pantalla de destino de siempre.
 * «Mis viajes» ya no es lo primero que se ve al abrir: se abre desde el Perfil.
 */
export interface ViajeAbrible {
  id: string
  generationState?: unknown | null
}

export type DondeAbrir<T extends ViajeAbrible> =
  | { tipo: 'reanudar'; viaje: T }
  | { tipo: 'hoy'; viaje: T; modo: 'today' }
  | { tipo: 'ultimo'; viaje: T; modo: 'route' }
  | { tipo: 'nada' }

/** `viajes` en el orden de la nube (el más reciente primero). `esDeHoy(viaje)`: ¿hoy cae dentro de ese viaje? */
export function dondeAbrir<T extends ViajeAbrible>(viajes: T[], esDeHoy: (viaje: T) => boolean): DondeAbrir<T> {
  const aMedias = viajes.find((viaje) => viaje.generationState)
  if (aMedias) return { tipo: 'reanudar', viaje: aMedias }
  const deHoy = viajes.find((viaje) => esDeHoy(viaje))
  if (deHoy) return { tipo: 'hoy', viaje: deHoy, modo: 'today' }
  const ultimo = viajes[0]
  if (ultimo) return { tipo: 'ultimo', viaje: ultimo, modo: 'route' }
  return { tipo: 'nada' }
}
