import type { Route, RouteMode, WishlistItem } from './types'
import type { MockHotelResult } from './mockAffiliateData'
import type { EsimStatus, GeneralBooking, TransportBooking } from './readiness'
import { mapGeneratedRouteToRoute } from './mapGeneratedRoute'
import type { GenerationResumeState } from './routeGenerationOrchestrator'
import { supabase } from './supabaseClient'
import { CENTRAL_MONTH } from './season'

/**
 * Viajes guardados antes de pedir el mes (Estaciones, Parte 1): solo traen temporada. Se les asigna
 * el mes central (primavera → abril, verano → julio, otoño → octubre, invierno → enero); con fechas,
 * el mes de la fecha de inicio. Sin migración: `answers` va dentro del jsonb `route`.
 */
function withTripMonth(route: Route): Route {
  const answers = route?.answers
  if (!answers || Number.isInteger(answers.month)) return route
  const month = answers.dateRange?.start ? Number(answers.dateRange.start.slice(5, 7)) - 1 : answers.season ? CENTRAL_MONTH[answers.season] : undefined
  return month === undefined ? route : { ...route, answers: { ...answers, month } }
}

export interface TripBookings {
  accommodationSelections: Record<string, MockHotelResult>
  transportBookings: Record<string, TransportBooking>
  insuranceBooking: GeneralBooking | null
  n26Added: boolean
  rentalVehicleBooking: GeneralBooking | null
  esimSelections: Record<string, EsimStatus>
}

export interface TripUiState {
  mode: RouteMode
  activeDayId: string | null
}

export interface TripPayload {
  route: Route
  bookings: TripBookings
  wishlist: WishlistItem[]
  uiState: TripUiState
  /** Presente y con phase !== 'done' cuando la generación se cerró a mitad — TripSync.tsx la usa para retomar en vez de abrir la ruta directamente. */
  generationState: GenerationResumeState | null
}

/** Un viaje guardado ya identificado por su fila — lo que devuelve loadAllTrips, y lo que hay que pasar de vuelta a saveTrip/deleteTrip para operar sobre ESA fila en concreto. */
export interface SavedTrip extends TripPayload {
  id: string
}

/**
 * Sesión anónima (o ya existente, anónima o real) — mismo `auth.uid()` para siempre gracias al
 * flujo nativo de Supabase de "convertir" una sesión anónima en una cuenta real más adelante, así
 * que no hace falta migrar datos cuando eso pase. Requiere "Allow anonymous sign-ins" activado en
 * el dashboard (Authentication → Sign In / Providers) — ver supabase/migrations/0001_*.sql.
 */
async function bootstrapTravelerUncached(): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado.')

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError

  let userId = sessionData.session?.user.id ?? null

  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    if (!data.user) throw new Error('No se pudo iniciar sesión anónima.')
    userId = data.user.id
  }

  const { error: upsertError } = await supabase.from('travelers').upsert({ id: userId, is_anonymous: true }, { onConflict: 'id', ignoreDuplicates: true })
  if (upsertError) throw upsertError

  return userId
}

/**
 * Bug real encontrado en vivo: TripSync.tsx llama a esto en un `useEffect` sin guarda contra doble
 * invocación — en dev, React StrictMode monta el componente dos veces, y las dos invocaciones
 * arrancan `bootstrapTravelerUncached()` en paralelo ANTES de que ninguna resuelva. Como ninguna ve
 * todavía una sesión existente, AMBAS llaman a `signInAnonymously()` — se crean dos usuarios
 * anónimos distintos, y el cliente de Supabase persiste en localStorage la sesión de quien responda
 * último, mientras el store se queda con el `userId` de quien RESUELVA la promesa último (dos
 * carreras independientes que no tienen por qué coincidir). Resultado: el `travelerId` del store
 * deja de ser el mismo usuario que el token realmente persistido, y cada guardado posterior falla
 * (RLS rechaza el `traveler_id` de un usuario que ya no es el autenticado) — el aviso "Cambios sin
 * guardar" que ve el usuario. Fix: una única promesa compartida a nivel de módulo — la segunda
 * invocación reutiliza la misma sesión en vez de crear una nueva.
 */
let bootstrapPromise: Promise<string> | null = null

export function bootstrapTraveler(): Promise<string> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapTravelerUncached().catch((error) => {
      // Un intento fallido no debe dejar el módulo bloqueado para siempre — el siguiente montaje
      // (o un reintento manual) debe poder volver a intentarlo desde cero.
      bootstrapPromise = null
      throw error
    })
  }
  return bootstrapPromise
}

/** Todos los viajes guardados de este traveler, más recientes primero — [] si todavía no tiene ninguno. */
export async function loadAllTrips(travelerId: string): Promise<SavedTrip[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('trips')
    .select('id, route, bookings, wishlist, ui_state, generation_state')
    .eq('traveler_id', travelerId)
    .order('updated_at', { ascending: false })
  if (error) throw error

  return (data ?? []).map((row) => {
    const generationState = row.generation_state as GenerationResumeState | null
    return {
      id: row.id as string,
      route: withTripMonth(row.route as Route),
      bookings: row.bookings as TripBookings,
      wishlist: (row.wishlist ?? []) as WishlistItem[],
      uiState: row.ui_state as TripUiState,
      generationState: generationState && generationState.phase !== 'done' ? generationState : null,
    }
  })
}

/**
 * Guarda un viaje — `tripId` null significa que todavía no existe como fila (primer guardado de un
 * viaje nuevo): inserta y devuelve el `id` generado, que quien llama debe recordar (ver
 * useSyncStore.activeTripId) para que los guardados siguientes actualicen ESA fila en vez de crear
 * una nueva cada vez. Con `tripId` ya conocido, actualiza esa fila.
 */
export async function saveTrip(travelerId: string, tripId: string | null, payload: TripPayload): Promise<string> {
  if (!supabase) throw new Error('Supabase no configurado.')

  const row = {
    route: payload.route,
    bookings: payload.bookings,
    wishlist: payload.wishlist,
    ui_state: payload.uiState,
    generation_state: null,
    updated_at: new Date().toISOString(),
  }

  if (tripId) {
    const { error } = await supabase.from('trips').update(row).eq('id', tripId)
    if (error) throw error
    return tripId
  }

  const { data, error } = await supabase.from('trips').insert({ traveler_id: travelerId, ...row }).select('id').single()
  if (error) throw error
  return data.id as string
}

/**
 * Guarda el progreso de una generación en curso — se llama tras CADA fase/bloque completado (ver
 * onCheckpoint en routeGenerationOrchestrator.ts), así que si el usuario cierra la pestaña a mitad,
 * la próxima apertura retoma justo aquí (ver TripSync.tsx) en vez de perder lo ya generado. No
 * escribe nada durante la fase 'skeleton' — todavía no hay un Route válido que guardar (esa fase es
 * además la más rápida de repetir si se pierde). Igual que saveTrip: `tripId` null crea la fila
 * (primer checkpoint real de un viaje nuevo) y devuelve su id; con `tripId` ya conocido, la
 * actualiza. Cuando `checkpoint.phase` es 'done', limpia generation_state a null — el guardado
 * normal (saveTrip/autosave) toma el relevo a partir de ahí.
 */
export async function saveGenerationCheckpoint(travelerId: string, tripId: string | null, checkpoint: GenerationResumeState): Promise<string | null> {
  if (!supabase) return tripId
  if (checkpoint.phase === 'skeleton') return tripId

  const route = mapGeneratedRouteToRoute(checkpoint.generated, checkpoint.params.destination, checkpoint.params.answers, checkpoint.params.transportContext)
  const row = {
    route,
    generation_state: checkpoint.phase === 'done' ? null : checkpoint,
    updated_at: new Date().toISOString(),
  }

  if (tripId) {
    const { error } = await supabase.from('trips').update(row).eq('id', tripId)
    if (error) throw error
    return tripId
  }

  const { data, error } = await supabase.from('trips').insert({ traveler_id: travelerId, ...row }).select('id').single()
  if (error) throw error
  return data.id as string
}

/** Borra la fila de un viaje guardado — pantalla "Mis viajes" (papelera + confirmación). */
export async function deleteTrip(tripId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('trips').delete().eq('id', tripId)
  if (error) throw error
}
