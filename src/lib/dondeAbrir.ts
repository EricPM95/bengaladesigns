/**
 * DÓNDE ABRE LA APP al arrancar con la sesión abierta (Tanda 10G, Eric 23-oct; cambiado en la 10K, 24-oct). Pura, para poder probarla sin Supabase. Siempre, antes, la pantalla de inicio de 3,5 s; sin sesión, la
 * pantalla de entrar; con sesión no se pide nada y se va directo, en este orden:
 *   0. Un viaje con la generación a medias: se retoma.
 *   1. Si hoy es un día de alguno de sus viajes: HOY de ese viaje.
 *   2. Si tiene algún viaje POR DELANTE: RUTA del más cercano en fecha, aunque haya tocado otro después. Un viaje sin fechas cuenta como «por delante»: si hay varios sin fechas, el último que tocó.
 *      (Si hay viajes con fechas por delante Y viajes sin fechas, manda el de fecha más cercana: tiene una fecha que el otro no tiene.)
 *   3. Si todos sus viajes ya pasaron: «Mis viajes», con [Crear viaje] a la vista.
 *   4. Si no tiene ningún viaje: «Crear viaje» (la pantalla de destino de siempre).
 */
export interface ViajeAbrible {
  id: string
  generationState?: unknown | null
}

/** Las fechas de un viaje (AAAA-MM-DD, primer y último día). null = el viaje no tiene fechas. */
export interface FechasDeViaje {
  inicio: string
  fin: string
}

export type DondeAbrir<T extends ViajeAbrible> =
  | { tipo: 'reanudar'; viaje: T }
  | { tipo: 'hoy'; viaje: T; modo: 'today' }
  | { tipo: 'ruta'; viaje: T; modo: 'route'; motivo: 'por_delante' | 'sin_fechas' }
  | { tipo: 'misViajes' }
  | { tipo: 'nada' }

/**
 * `viajes` en el orden de la nube (el que tocó más recientemente, primero). `esDeHoy(viaje)`: ¿hoy cae dentro de ese viaje? `fechasDe(viaje)`: sus fechas (null si no las tiene). `hoy`: el día de hoy (AAAA-MM-DD).
 */
export function dondeAbrir<T extends ViajeAbrible>(viajes: T[], esDeHoy: (viaje: T) => boolean, fechasDe: (viaje: T) => FechasDeViaje | null, hoy: string): DondeAbrir<T> {
  const aMedias = viajes.find((viaje) => viaje.generationState)
  if (aMedias) return { tipo: 'reanudar', viaje: aMedias }
  const deHoy = viajes.find((viaje) => esDeHoy(viaje))
  if (deHoy) return { tipo: 'hoy', viaje: deHoy, modo: 'today' }

  // Por delante: con fechas, las que aún no han acabado (la más cercana primero; a igualdad, la que tocó más recientemente); sin fechas, el último que tocó.
  const conFechas = viajes
    .map((viaje, orden) => ({ viaje, orden, fechas: fechasDe(viaje) }))
    .filter((v): v is { viaje: T; orden: number; fechas: FechasDeViaje } => v.fechas !== null)
  const porDelante = conFechas.filter((v) => v.fechas.fin >= hoy).sort((a, b) => (a.fechas.inicio < b.fechas.inicio ? -1 : a.fechas.inicio > b.fechas.inicio ? 1 : a.orden - b.orden))
  if (porDelante[0]) return { tipo: 'ruta', viaje: porDelante[0].viaje, modo: 'route', motivo: 'por_delante' }
  const sinFechas = viajes.find((viaje) => fechasDe(viaje) === null)
  if (sinFechas) return { tipo: 'ruta', viaje: sinFechas, modo: 'route', motivo: 'sin_fechas' }

  return viajes.length > 0 ? { tipo: 'misViajes' } : { tipo: 'nada' }
}
