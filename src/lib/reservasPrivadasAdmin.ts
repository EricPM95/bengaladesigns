import { supabase } from './supabaseClient'
import type { Reservation } from './bookings'
import { useRouteStore } from '../store/useRouteStore'
import type { Route } from './types'

/**
 * LO «SOLO PARA MÍ» DEL ADMINISTRADOR, GUARDADO APARTE (Tanda 10N8 §0b-2; migración 0062, sustituida por la 0064 en la 10N9: solo en la cuenta conjunta). La base de datos saca de `trips.bookings` las reservas cuyo «¿Para quién es?» es solo el administrador y las deja
 * en `reservas_privadas_admin` (solo él las lee). Aquí, en el móvil del administrador, se vuelven a juntar con las suyas al abrir el viaje, y si quita una, se quita también de esa tabla.
 * Sin la migración (la tabla no existe) no hace nada y todo sigue como antes.
 */
let tripActual: string | null = null
let privadas: Reservation[] = []
let vistas = new Set<string>()
let suscrito = false
let miId: string | null = null

/** Igual que `modo_cuentas_del_viaje` de la base de datos (0055): conjunta si se eligió así o, sin elegir, pareja o familia. */
export function esCuentaConjuntaDelServidor(route: Pick<Route, 'answers' | 'modoCuentas'> | null | undefined): boolean {
  if (route?.modoCuentas === 'conjunta') return true
  if (route?.modoCuentas === 'cada_uno') return false
  const c = route?.answers?.companion
  return c === 'couple' || c === 'family'
}

function sincronizar() {
  if (!tripActual) return
  // (10N9) Solo vale en la cuenta conjunta. Si el viaje pasa a «Cada uno lo suyo», la base de datos las devuelve a `trips.bookings`: aquí dejamos de seguirlas (ya están en la lista) y no se borra nada.
  if (!esCuentaConjuntaDelServidor(useRouteStore.getState().route)) {
    privadas = []
    vistas = new Set()
    return
  }
  const { reservations } = useRouteStore.getState()
  const hay = new Set(reservations.map((r) => r.id))
  // Las que el administrador acaba de apuntar «Solo para mí» también se siguen: si luego las quita, se quitan de la tabla.
  for (const r of reservations) {
    if (miId && Array.isArray(r.paraQuien) && r.paraQuien.length === 1 && r.paraQuien[0] === miId) {
      vistas.add(r.id)
      if (!privadas.some((p) => p.id === r.id)) privadas = [...privadas, r]
    }
  }
  // Las que estaban a la vista y ya no: el administrador las ha quitado (o ya no son solo suyas): fuera también de la tabla.
  const quitadas = [...vistas].filter((id) => !hay.has(id))
  if (quitadas.length > 0) {
    vistas = new Set([...vistas].filter((id) => hay.has(id)))
    privadas = privadas.filter((r) => !quitadas.includes(r.id))
    void guardarTabla(tripActual)
  }
  const faltan = privadas.filter((r) => !hay.has(r.id) && !quitadas.includes(r.id))
  if (faltan.length > 0) useRouteStore.setState({ reservations: [...reservations, ...faltan] })
  for (const r of privadas) vistas.add(r.id)
}

async function guardarTabla(tripId: string | null) {
  if (!supabase || !tripId) return
  try {
    await supabase.from('reservas_privadas_admin').update({ reservas: privadas, actualizado_en: new Date().toISOString() }).eq('trip_id', tripId)
  } catch {
    // sin red: la próxima vez
  }
}

/** Trae las reservas «solo para mí» del administrador y las junta con las del viaje abierto. Para quien no es el administrador (o sin la 0062) la tabla no devuelve nada. */
export async function fusionarPrivadasDelAdmin(tripId: string | null): Promise<number> {
  if (!supabase || !tripId) return 0
  try {
    const { data, error } = await supabase.from('reservas_privadas_admin').select('reservas').eq('trip_id', tripId).maybeSingle()
    if (error) return 0
    miId = (await supabase.auth.getUser()).data.user?.id ?? null
    const lista = (Array.isArray((data as { reservas?: unknown } | null)?.reservas) ? (data as { reservas: Reservation[] }).reservas : []).filter((r) => r && typeof r.id === 'string')
    if (tripActual !== tripId) {
      vistas = new Set()
      privadas = []
    }
    tripActual = tripId
    privadas = lista
    if (!suscrito) {
      suscrito = true
      useRouteStore.subscribe(sincronizar)
    }
    sincronizar()
    return lista.length
  } catch {
    return 0
  }
}

/** Solo pruebas: lo que la tabla tiene guardado ahora. */
export const privadasAhora = (): readonly Reservation[] => privadas
