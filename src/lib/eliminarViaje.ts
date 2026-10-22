import { create } from 'zustand'
import { buildTripPayload } from '../components/sync/TripSync'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { usePerfilUi } from '../store/usePerfilUi'
import { demoActivo } from './logros'
import { avisarCambioDeFotos, listarFotos, nombreDeArchivo } from './fotosViaje'
import { eliminarViajeEnLaNube, limpiarFotosPendientes, type ViajeABorrar } from './eliminarViajeNube'
import { supabase } from './supabaseClient'
import { bootstrapTraveler, type TripPayload } from './tripPersistence'
import { todayIso } from './dateRange'
import { getTodayTripStatus } from './todayMode'
import { viajesDelPerfil, type ResumenViaje } from './viajesPerfil'

/**
 * ELIMINAR UN VIAJE DESDE EL PERFIL (Tanda 10F). El flujo, de punta a punta:
 *   1. [Editar] en «Mis viajes» → la papelera de cada viaje → `pedir(viaje)`: sube la hoja «¿Eliminar tu viaje a Roma?» (`HojaEliminarViaje`).
 *   2. [Eliminar viaje] → `confirmar()`: el viaje se va de la lista AL MOMENTO y sale «Viaje eliminado» con [Deshacer] durante `SEGUNDOS_PARA_DESHACER`. Si era el viaje abierto, la app abre el siguiente guardado
 *      (o la primera pantalla si no queda ninguno).
 *   3. Pasado el plazo (o al eliminar otro viaje, o al volver a abrir la app dentro del plazo no: el viaje seguiría ahí) se borra de verdad (`eliminarViajeNube.ts`). [Deshacer] lo devuelve entero, sin haber
 *      tocado la nube. Si la app se cierra antes del plazo, no se borra nada: el viaje sigue en la nube y vuelve a salir.
 * Se avisa, nunca se niega: el viaje abierto y el de estar de viaje ahora mismo se pueden eliminar igual. Un viaje que es de otra persona (estás invitada) no se borra para los demás: [Salir de este viaje].
 */
export const SEGUNDOS_PARA_DESHACER = 8

/**
 * Si la app se cierra durante el plazo de [Deshacer], el viaje se borra AL VOLVER A ABRIRLA (la persona ya dijo que quería eliminarlo): al confirmar se apunta aquí lo que hay que borrar, y TripSync lo
 * remata (`procesarPendienteAlAbrir`) antes de cargar los viajes guardados, para que ni salga en la lista ni se abra solo.
 */
const CLAVE_PENDIENTE = 'jutrip:eliminar-pendiente'
const apuntarPendiente = (viaje: ViajeABorrar | null) => {
  try {
    if (viaje) window.localStorage.setItem(CLAVE_PENDIENTE, JSON.stringify(viaje))
    else window.localStorage.removeItem(CLAVE_PENDIENTE)
  } catch {
    /* sin almacenamiento: el borrado queda solo para esta sesión */
  }
}
const leerPendiente = (): ViajeABorrar | null => {
  try {
    const crudo = window.localStorage.getItem(CLAVE_PENDIENTE)
    const v = crudo ? (JSON.parse(crudo) as ViajeABorrar) : null
    return v && typeof v.rutaId === 'string' ? v : null
  } catch {
    return null
  }
}

/** La nube, aparte para poder cambiarla en las pruebas (`ponerNube`). */
export interface NubeDeEliminar {
  eliminar(viaje: ViajeABorrar): Promise<string | null>
  /** Quién más está en el viaje (los nombres de pila de los invitados), o [] si no es compartido. */
  invitados(filaId: string): Promise<string[]>
}

const nubeDeLaApp: NubeDeEliminar = {
  async eliminar(viaje) {
    if (!supabase || demoActivo()) return null
    const userId = await bootstrapTraveler().catch(() => null)
    if (!userId) return 'Necesita conexión con el servidor.'
    const error = await eliminarViajeEnLaNube(supabase, userId, viaje)
    if (!error) void limpiarFotosPendientes(supabase, userId).catch(() => 0)
    return error
  },
  async invitados(filaId) {
    if (!supabase || demoActivo()) return []
    try {
      const { data, error } = await supabase.rpc('gente_del_viaje', { p_trip: filaId })
      if (error || !Array.isArray(data)) return []
      return (data as { nombre: string | null; es_admin: boolean }[]).filter((p) => !p.es_admin).map((p) => (p.nombre ?? '').trim() || 'otra persona')
    } catch {
      return []
    }
  },
}
let nube: NubeDeEliminar = nubeDeLaApp
/** Solo para las pruebas: una nube de mentira. Sin argumento, vuelve la de verdad. */
export function ponerNube(otra?: NubeDeEliminar): void {
  nube = otra ?? nubeDeLaApp
}

/** Lo que enseña la hoja de eliminar. */
export interface DatosDeLaHoja {
  viaje: ResumenViaje
  /** Cuántas fotos de este viaje tiene esta persona (null mientras se cuentan). */
  fotos: number | null
  /** Los nombres de las otras personas del viaje (vacío = no es compartido). */
  invitados: string[]
  esInvitado: boolean
  esElAbierto: boolean
  esAhora: boolean
}

interface Pendiente {
  viaje: ResumenViaje
  eraAbierto: boolean
  /** La copia exacta del viaje que estaba abierto (también si nunca se guardó), para [Deshacer]. */
  copia: TripPayload | null
  filaId: string | null
  esInvitado: boolean
  temporizador: number | null
}

interface EliminarViajeState {
  hoja: DatosDeLaHoja | null
  /** El aviso de abajo: «Viaje eliminado» con [Deshacer], o un error. */
  aviso: { texto: string; deshacer: boolean } | null
  pendiente: Pendiente | null
  pedir: (viaje: ResumenViaje, fotos: number | null) => void
  cerrarHoja: () => void
  confirmar: () => Promise<void>
  deshacer: () => void
  /** Borra de verdad el que está pendiente (el plazo se acabó, o se elimina otro). */
  rematar: () => Promise<void>
  cerrarAviso: () => void
}

/** El siguiente viaje guardado que se abre al eliminar el abierto: el primero de la lista de «Mis viajes» (los próximos antes que los hechos). */
function siguienteGuardado(quedan: NonNullable<ReturnType<typeof useSyncStore.getState>['savedTrips']>) {
  return viajesDelPerfil(quedan, null).find((v) => v.guardado)?.guardado ?? null
}

export const useEliminarViaje = create<EliminarViajeState>((set, get) => ({
  hoja: null,
  aviso: null,
  pendiente: null,

  pedir: (viaje, fotos) => {
    const ruta = useRouteStore.getState().route
    // «Hoy» es el de la app (en desarrollo puede ser el simulado de las pruebas).
    const estado = getTodayTripStatus(viaje.route, useRouteStore.getState().dev_simulated_today_iso ?? todayIso())
    const datos: DatosDeLaHoja = {
      viaje,
      fotos,
      invitados: [],
      esInvitado: Boolean(viaje.guardado?.esInvitado),
      esElAbierto: ruta?.id === viaje.id,
      esAhora: estado?.phase === 'during',
    }
    set({ hoja: datos })
    // Quién más está en el viaje (solo si ya está guardado en la nube).
    if (viaje.guardado) {
      void nube.invitados(viaje.guardado.id).then((nombres) => {
        const actual = get().hoja
        if (actual && actual.viaje.id === viaje.id) set({ hoja: { ...actual, invitados: nombres } })
      })
    }
  },

  cerrarHoja: () => set({ hoja: null }),

  confirmar: async () => {
    const hoja = get().hoja
    if (!hoja) return
    // Si había otro eliminado esperando su plazo, se remata ya: solo se puede deshacer el último.
    await get().rematar()
    const viaje = hoja.viaje
    const sync = useSyncStore.getState()
    const rutaStore = useRouteStore.getState()
    const eraAbierto = rutaStore.route?.id === viaje.id
    const copia = eraAbierto ? buildTripPayload() : null
    const filaId = viaje.guardado?.id ?? null
    // Fuera de la lista, al momento.
    if (sync.savedTrips) sync.setSavedTrips(sync.savedTrips.filter((t) => t.id !== filaId && t.route.id !== viaje.id))
    if (eraAbierto) {
      const siguiente = siguienteGuardado(useSyncStore.getState().savedTrips ?? [])
      sync.setResumeTrip(null)
      if (siguiente) {
        sync.setActiveTripId(siguiente.id)
        rutaStore.hydrateTrip(siguiente)
      } else {
        // Ninguno más: la primera pantalla (crear viaje), sin viaje abierto (si no, el guardado automático lo volvería a crear).
        sync.setActiveTripId(null)
        useRouteStore.setState({ route: null })
        useRouteStore.getState().resetQuestionnaire()
        useRouteStore.getState().setScreen('destination')
      }
      usePerfilUi.getState().cerrar()
    }
    const temporizador = window.setTimeout(() => void get().rematar(), SEGUNDOS_PARA_DESHACER * 1000)
    apuntarPendiente({ rutaId: viaje.id, filaId, esInvitado: hoja.esInvitado })
    set({
      hoja: null,
      pendiente: { viaje, eraAbierto, copia, filaId, esInvitado: hoja.esInvitado, temporizador },
      aviso: { texto: hoja.esInvitado ? 'Has salido del viaje' : 'Viaje eliminado', deshacer: true },
    })
  },

  deshacer: () => {
    const p = get().pendiente
    if (!p) return
    if (p.temporizador !== null) window.clearTimeout(p.temporizador)
    const sync = useSyncStore.getState()
    // De vuelta en la lista (el viaje guardado tal cual, sin haber tocado la nube).
    if (p.viaje.guardado) {
      const actual = sync.savedTrips ?? []
      if (!actual.some((t) => t.id === p.viaje.guardado!.id)) sync.setSavedTrips([...actual, p.viaje.guardado])
    }
    if (p.eraAbierto && p.copia) {
      sync.setActiveTripId(p.filaId)
      useRouteStore.getState().hydrateTrip(p.copia)
    }
    apuntarPendiente(null)
    set({ pendiente: null, aviso: null })
  },

  rematar: async () => {
    const p = get().pendiente
    if (!p) return
    if (p.temporizador !== null) window.clearTimeout(p.temporizador)
    set({ pendiente: null, aviso: get().aviso?.deshacer ? null : get().aviso })
    const error = await nube.eliminar({ rutaId: p.viaje.id, filaId: p.filaId, esInvitado: p.esInvitado })
    apuntarPendiente(null)
    if (error) {
      // No se pudo: el viaje vuelve a su sitio (ni fotos sin viaje ni viaje perdido a medias) y se dice.
      const sync = useSyncStore.getState()
      if (p.viaje.guardado) {
        const actual = sync.savedTrips ?? []
        if (!actual.some((t) => t.id === p.viaje.guardado!.id)) sync.setSavedTrips([...actual, p.viaje.guardado])
      }
      set({ aviso: { texto: `${error} El viaje sigue en tu lista.`, deshacer: false } })
      return
    }
    avisarCambioDeFotos()
  },

  cerrarAviso: () => set({ aviso: null }),
}))

/**
 * Al abrir la app: si se cerró durante el plazo de [Deshacer], se borra ahora lo que quedó pendiente (antes de cargar los viajes guardados). Si la nube falla, se deja apuntado para el próximo intento.
 * Devuelve true si había algo pendiente.
 */
export async function procesarPendienteAlAbrir(): Promise<boolean> {
  const pendiente = leerPendiente()
  if (!pendiente) return false
  const error = await nube.eliminar(pendiente).catch(() => 'fallo')
  if (!error) apuntarPendiente(null)
  return true
}

/**
 * [Guardar en mi galería] antes de eliminar: baja todas las fotos de este viaje. Donde el navegador deja compartir archivos (iPhone, Android) sale UNA hoja de compartir con todas («Guardar N imágenes»);
 * si no, se descargan una a una. Es el mismo camino que ya había para una foto (`guardarEnMiGaleria`, en fotosViaje.ts), hecho para todas. Devuelve el error en palabras sencillas, o null.
 */
export async function guardarTodasMisFotos(rutaId: string, alAvanzar?: (hechas: number, total: number) => void): Promise<string | null> {
  const ERROR = 'No se han podido bajar las fotos. Inténtalo de nuevo.'
  const fotos = await listarFotos(rutaId)
  if (fotos.length === 0) return null
  try {
    const archivos: File[] = []
    for (const foto of fotos) {
      const respuesta = await fetch(foto.url)
      if (!respuesta.ok) return ERROR
      archivos.push(new File([await respuesta.blob()], nombreDeArchivo(foto), { type: 'image/jpeg' }))
      alAvanzar?.(archivos.length, fotos.length)
    }
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: archivos })) {
      try {
        await navigator.share({ files: archivos })
        return null
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') return null // (cerró la hoja: no es un fallo)
      }
    }
    for (const archivo of archivos) {
      const enlace = document.createElement('a')
      enlace.href = URL.createObjectURL(archivo)
      enlace.download = archivo.name
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      window.setTimeout(() => URL.revokeObjectURL(enlace.href), 10_000)
      await new Promise((r) => window.setTimeout(r, 250))
    }
    return null
  } catch {
    return ERROR
  }
}

// Solo desarrollo: lo que usan las pruebas (`window.__eliminarViaje`, `__ponerNubeEliminar`, `__procesarEliminarPendiente`). (`import.meta.env` puede no existir cuando una prueba carga esto fuera de Vite.)
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  const w = window as unknown as Record<string, unknown>
  w.__eliminarViaje = useEliminarViaje
  w.__ponerNubeEliminar = ponerNube
  w.__procesarEliminarPendiente = procesarPendienteAlAbrir
}
