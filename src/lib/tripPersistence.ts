import type { Route, RouteMode, WishlistItem } from './types'
import { reservasConDefectos, uiConDefectos } from './reservasPorDefecto'

export { reservasConDefectos, uiConDefectos }
import type { TuAlojamiento } from './tuAlojamiento'
import type { Importe } from './dinero'
import type { EsimStatus, GeneralBooking, TransportBooking } from './readiness'
import type { Reservation, SaleMatch } from './bookings'
import { mapGeneratedRouteToRoute } from './mapGeneratedRoute'
import type { GenerationResumeState } from './routeGenerationOrchestrator'
import { supabase } from './supabaseClient'
import { CENTRAL_MONTH } from './season'
import { cuentasActivas } from './cuentas'
import { useViajeCompartido } from '../store/useViajeCompartido'
import { useSyncStore } from '../store/useSyncStore'
import { recordarBase, sellarRuta } from './sellarCambio'

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

/**
 * El Free Tour se llamaba «Free Tour Centro Histórico» (Tanda 6r: ahora «Free Tour por Roma» en toda la app). Un viaje guardado con el nombre viejo
 * (en sus paradas y en la reserva del Free Tour) lo recibe con el nuevo al cargarse. Los ids no cambian, así que la foto y el enlace son los mismos.
 */
const FREE_TOUR_ANTIGUO = 'Free Tour Centro Histórico'
const FREE_TOUR_NUEVO = 'Free Tour por Roma'
function withCurrentFreeTourName<T>(value: T): T {
  const texto = JSON.stringify(value)
  return texto && texto.includes(FREE_TOUR_ANTIGUO) ? (JSON.parse(texto.replaceAll(FREE_TOUR_ANTIGUO, FREE_TOUR_NUEVO)) as T) : value
}

export interface TripBookings {
  accommodationSelections: Record<string, TuAlojamiento>
  transportBookings: Record<string, TransportBooking>
  insuranceBooking: GeneralBooking | null
  n26Added: boolean
  rentalVehicleBooking: GeneralBooking | null
  esimSelections: Record<string, EsimStatus>
  /** Lo que costó la eSIM de cada país (Tanda 6z2). Viajes guardados antes: sin él. */
  esimPrecios?: Record<string, Importe>
  /** «¿Dónde lo has comprado?» del seguro, la tarjeta y la eSIM (Tanda 6y4). Viajes guardados antes: sin él. */
  dondeComprado?: Record<string, string>
  /** Entradas y excursiones reservadas (fijadas), el código de campaña del viaje y las ventas unidas (PARA_CODE_RESERVAS). Viajes guardados antes: sin ellas. */
  reservations?: Reservation[]
  campaignCode?: string
  sales?: SaleMatch[]
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
  /** Cuentas, parte 2: el viaje es de otra persona y esta está invitada (solo lo ve; no lo cambia). Solo con las cuentas encendidas. */
  esInvitado?: boolean
  /** «Sustituir el anterior» no borra (Tanda 8A2): el viaje de antes pasa a «Viajes guardados» y aquí lleva la fecha en que pasó. null/ausente = un viaje de siempre. Solo con las cuentas encendidas (migración 0024). */
  guardadoEn?: string | null
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

  // Con las cuentas encendidas se piden también los viajes donde esta persona es invitada (la base de datos solo deja ver los suyos y esos); si no, solo los suyos, como siempre.
  const conInvitados = cuentasActivas()
  let consulta = supabase.from('trips').select(conInvitados ? 'id, traveler_id, guardado_en, route, bookings, wishlist, ui_state, generation_state' : 'id, route, bookings, wishlist, ui_state, generation_state')
  if (!conInvitados) consulta = consulta.eq('traveler_id', travelerId)
  const { data: filas, error } = await consulta.order('updated_at', { ascending: false })
  if (error) throw error
  const data = (filas ?? []) as unknown as { id: string; traveler_id?: string; guardado_en?: string | null; route: unknown; bookings: unknown; wishlist: unknown; ui_state: unknown; generation_state: unknown }[]

  // (Tanda 10N §10) Lo que se cargó es la «línea base»: un viaje igual en la nube no es un cambio de otra persona.
  for (const row of data) {
    rutaVista.set(row.id, canonico(row.route))
  }
  const viajes = (data ?? []).map((row) => filaAViaje(row, travelerId, conInvitados))
  // (10N8 §4) La ruta con la que se compara el siguiente guardado es la que se pone en pantalla (con los nombres ya al día), no la cruda de la nube.
  for (const v of viajes) recordarBase(v.id, v.route)
  return viajes
}

type FilaDeViaje = { id: string; traveler_id?: string; guardado_en?: string | null; route: unknown; bookings: unknown; wishlist: unknown; ui_state: unknown; generation_state: unknown }

function filaAViaje(row: FilaDeViaje, travelerId: string, conInvitados: boolean): SavedTrip {
  const generationState = row.generation_state as GenerationResumeState | null
  return {
    id: row.id as string,
    route: withCurrentFreeTourName(withTripMonth(row.route as Route)),
    bookings: withCurrentFreeTourName(reservasConDefectos(row.bookings as Partial<TripBookings> | null)),
    wishlist: (row.wishlist ?? []) as WishlistItem[],
    uiState: uiConDefectos(row.ui_state as Partial<TripUiState> | null),
    generationState: generationState && generationState.phase !== 'done' ? generationState : null,
    ...(conInvitados && row.traveler_id && row.traveler_id !== travelerId ? { esInvitado: true } : {}),
    ...(conInvitados && row.guardado_en ? { guardadoEn: row.guardado_en } : {}),
  }
}

/**
 * (Tanda 10N §10) UN viaje, tal como está ahora en la nube: lo que llega en directo cuando otra persona del viaje lo cambia. `null` si ya no se puede ver (te han quitado, o se borró);
 * `undefined` si no se pudo preguntar (sin conexión: se sigue con lo que hay).
 */
export async function loadOneTrip(travelerId: string, tripId: string): Promise<{ viaje: SavedTrip; canonica: string } | null | undefined> {
  if (!supabase) return undefined
  const { data, error } = await supabase.from('trips').select('id, traveler_id, guardado_en, route, bookings, wishlist, ui_state, generation_state').eq('id', tripId).maybeSingle()
  if (error) return undefined
  if (!data) return null
  const fila = data as unknown as FilaDeViaje
  const viaje = filaAViaje(fila, travelerId, cuentasActivas())
  recordarBase(tripId, viaje.route)
  return { viaje, canonica: canonico(fila.route) }
}

/** El mismo texto para la misma ruta aunque las claves vengan en otro orden (la base de datos las reordena): así se reconoce el eco del propio guardado. */
export function canonico(valor: unknown): string {
  const ordenar = (v: unknown): unknown => (Array.isArray(v) ? v.map(ordenar) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, ordenar((v as Record<string, unknown>)[k])])) : v)
  return JSON.stringify(ordenar(valor))
}

/** El `route` que esta pestaña guardó la última vez, tal cual (para no tratar como «cambio de otra persona» el eco de nuestro propio guardado). */
const ultimoGuardado = new Map<string, string>()
/** (10N8 §4) Los últimos guardados de esta pestaña: con dos guardados seguidos, el eco del PRIMERO llega cuando ya se ha guardado el segundo. Antes solo se recordaba el último y ese eco parecía un cambio de otra persona (aviso «Han cambiado el viaje» para quien lo había cambiado, y la ruta viva se pisaba con la del primer guardado). */
const recientes = new Map<string, string[]>()
function recordarGuardado(tripId: string, canonica: string): void {
  ultimoGuardado.set(tripId, canonica)
  recientes.set(tripId, [...(recientes.get(tripId) ?? []), canonica].slice(-8))
}
/** ¿Esta ruta de la nube es una de las que guardó esta pestaña hace un momento? */
export const fueGuardadaAqui = (tripId: string, canonica: string): boolean => (recientes.get(tripId) ?? []).includes(canonica)
/** La ruta de la nube (en forma canónica) que esta pestaña cargó o puso por última vez, por viaje. */
export const rutaVista = new Map<string, string>()
export const rutaGuardadaAqui = (tripId: string): string | undefined => ultimoGuardado.get(tripId)

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
    if (cuentasActivas()) {
      // (Tanda 10N8 §4) La ruta sale con lo que ha pasado (`ultimoCambio`): de ahí sale el aviso nuevo de los demás.
      const respaldo = useSyncStore.getState().savedTrips?.find((v) => v.id === tripId)?.route ?? null
      const ruta = sellarRuta(tripId, payload.route, respaldo)
      recordarGuardado(tripId, canonico(ruta))
      // (Tanda 10N §4a) Quien tiene «Puede editar» guarda la ruta y la lista de deseos (NO el vuelo, el alojamiento ni las fechas, que son del administrador).
      if (permisoDeEsteViaje() === 'editar') {
        const { error } = await supabase.from('trips').update({ route: ruta, wishlist: payload.wishlist, updated_at: row.updated_at }).eq('id', tripId).select('id')
        if (error) throw error
        recordarBase(tripId, ruta)
        return tripId
      }
      // Solo el administrador cambia el viaje: si es de otra persona (esta está invitada), la base de datos no toca nada y aquí tampoco se avisa de un fallo.
      const { error } = await supabase.from('trips').update({ ...row, route: ruta }).eq('id', tripId).eq('traveler_id', travelerId).select('id')
      if (error) throw error
      recordarBase(tripId, ruta)
      return tripId
    }
    const { error } = await supabase.from('trips').update(row).eq('id', tripId)
    if (error) throw error
    return tripId
  }

  const { data, error } = await supabase.from('trips').insert({ traveler_id: travelerId, ...row }).select('id').single()
  if (error) throw error
  // (Tanda 10S3 §3) El primer guardado de un viaje nuevo también es NUESTRO: se apunta para que su eco de Realtime no salga como «Han cambiado el viaje».
  anotarGuardadoPropio(data.id as string, payload.route)
  return data.id as string
}

/** (10S3 §3) Apunta como «guardado aquí» una ruta que acabamos de escribir en la nube (viaje nuevo o paso de la generación), para reconocer su eco. */
function anotarGuardadoPropio(tripId: string, ruta: unknown): void {
  const canonica = canonico(ruta)
  recordarGuardado(tripId, canonica)
  rutaVista.set(tripId, canonica)
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
    anotarGuardadoPropio(tripId, route)
    return tripId
  }

  const { data, error } = await supabase.from('trips').insert({ traveler_id: travelerId, ...row }).select('id').single()
  if (error) throw error
  anotarGuardadoPropio(data.id as string, route)
  return data.id as string
}

/**
 * «Sustituir el anterior» (Tanda 8A2): el viaje de antes NO se borra; pasa a «Viajes guardados» (`guardado_en`), igual que en la pregunta del primer día («¿Cuál haces?»).
 * `restaurar: true` lo devuelve a «Mis viajes». Necesita la migración 0024; sin ella devuelve un aviso y no cambia nada.
 */
export async function guardarViajeAparte(tripId: string, restaurar = false): Promise<string | null> {
  if (!supabase) return 'Necesita conexión con el servidor.'
  const { error } = await supabase.from('trips').update({ guardado_en: restaurar ? null : new Date().toISOString() }).eq('id', tripId)
  return error ? 'No se ha podido guardar el viaje aparte. Inténtalo de nuevo.' : null
}

/** Borra la fila de un viaje guardado — pantalla "Mis viajes" (papelera + confirmación). */
export async function deleteTrip(tripId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('trips').delete().eq('id', tripId)
  if (error) throw error
}

/** Mi permiso en el viaje abierto (lo dice `gente_del_viaje`): solo `editar` cambia lo que se guarda. Sin lista de gente cargada, nada especial. */
function permisoDeEsteViaje(): 'editar' | null {
  const yo = useViajeCompartido.getState().gente.find((p) => p.esYo)
  return yo?.permiso === 'editar' ? 'editar' : null
}
