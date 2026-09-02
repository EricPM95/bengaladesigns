import type { Route, RouteMode, WishlistItem } from './types'
import type { MockHotelResult } from './mockAffiliateData'
import type { EsimStatus, GeneralBooking, TransportBooking } from './readiness'
import { supabase } from './supabaseClient'

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
}

/**
 * Sesión anónima (o ya existente, anónima o real) — mismo `auth.uid()` para siempre gracias al
 * flujo nativo de Supabase de "convertir" una sesión anónima en una cuenta real más adelante, así
 * que no hace falta migrar datos cuando eso pase. Requiere "Allow anonymous sign-ins" activado en
 * el dashboard (Authentication → Sign In / Providers) — ver supabase/migrations/0001_*.sql.
 */
export async function bootstrapTraveler(): Promise<string> {
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

/** null = este traveler aún no tiene ningún viaje guardado (usuario nuevo, o solo llegó hasta el cuestionario sin generar ruta). */
export async function loadTrip(travelerId: string): Promise<TripPayload | null> {
  if (!supabase) return null

  const { data, error } = await supabase.from('trips').select('route, bookings, wishlist, ui_state').eq('traveler_id', travelerId).maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    route: data.route as Route,
    bookings: data.bookings as TripBookings,
    wishlist: (data.wishlist ?? []) as WishlistItem[],
    uiState: data.ui_state as TripUiState,
  }
}

/** Un solo viaje activo por traveler (unique en traveler_id, ver la migración) — upsert siempre sustituye el mismo registro. */
export async function saveTrip(travelerId: string, payload: TripPayload): Promise<void> {
  if (!supabase) return

  const { error } = await supabase.from('trips').upsert(
    {
      traveler_id: travelerId,
      route: payload.route,
      bookings: payload.bookings,
      wishlist: payload.wishlist,
      ui_state: payload.uiState,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'traveler_id' },
  )
  if (error) throw error
}
