import { create } from 'zustand'
import type { Momento, RespuestaDeHecho } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'

/**
 * EL ESTADO DE LAS PANTALLAS DEL VISTO Y LAS FOTOS (Tanda 8b): el aviso de 5 segundos, las hojas (V2-V5, «Guarda un recuerdo»), la cámara de la app, la galería, «Lo de ayer también cuenta»
 * y la pantalla de los permisos. También recuerda, en el móvil, qué paradas se marcaron como vistas y aún esperan su foto (para V6).
 * Mientras haya CUALQUIERA de estas cosas abierta, las sorpresas esperan (`useLogrosStore.hojaAbierta`).
 */
export interface ParadaVista {
  tripId: string
  dayId: string
  dayNumber: number
  stopId: string
  /** El nombre tal como lo escribe la ruta. */
  nombre: string
}

export type TipoDeHoja = 'ganado' | 'sin_ubicacion' | 'lejos' | 'oculto' | 'recuerdo'
export interface Hoja {
  tipo: TipoDeHoja
  parada: ParadaVista
  nombreSitio: string
  /** El pedazo ganado (V2), tal como lo da el servidor. */
  pedazo?: Momento | null
  mensaje?: string | null
  fotoDentro?: string | null
}

export type QueFalta = 'sorpresa' | 'pedazo' | 'recuerdo'
export interface PendienteLocal {
  tripId: string
  falta: QueFalta
  nombre: string
  fotoDentro?: string | null
}

/** A dónde va la foto: la parada y cómo está (para la etiqueta «Emblema Oculto» de la cámara y la línea de «foto dentro»). */
export interface DestinoDeFoto {
  parada: ParadaVista
  nombreSitio: string
  oculto: boolean
  fotoDentro?: string | null
  /** Para qué hoja volver / de dónde viene (informativo). */
  alTerminar?: () => void
}

const CLAVE_PENDIENTES = 'trazo:logros:pendientes-de-foto'
function leer(): Record<string, PendienteLocal> {
  try {
    return JSON.parse(window.localStorage.getItem(CLAVE_PENDIENTES) ?? '{}') ?? {}
  } catch {
    return {}
  }
}
function guardar(p: Record<string, PendienteLocal>) {
  try {
    window.localStorage.setItem(CLAVE_PENDIENTES, JSON.stringify(p))
  } catch {
    /* sin almacenamiento */
  }
}

interface VistoState {
  aviso: { id: number; parada: ParadaVista; nombre: string } | null
  hoja: Hoja | null
  cola: Hoja[]
  permisos: boolean
  camara: DestinoDeFoto | null
  /** La línea de «dentro no se pueden hacer fotos» antes de abrir la cámara. */
  avisoDentro: DestinoDeFoto | null
  galeria: (DestinoDeFoto & { error: string | null; subiendo: boolean }) | null
  ayer: boolean
  /** Las paradas de «Lo de ayer también cuenta» (V8). */
  paradasAyer: { stopId: string; nombre: string; fotoDentro?: string | null }[]
  /** Lo que el servidor dice que falta por parada (días anteriores y después del viaje): alimenta V6. */
  servidor: Record<string, PendienteLocal>
  /** Un mensaje corto de una foto guardada («Foto guardada»). */
  nota: string | null
  pendientes: Record<string, PendienteLocal>
  poner: (parcial: Partial<VistoState>) => void
  anotarPendiente: (stopId: string, p: PendienteLocal) => void
  quitarPendiente: (stopId: string) => void
}

export const useVistoStore = create<VistoState>((set) => ({
  aviso: null,
  hoja: null,
  cola: [],
  permisos: false,
  camara: null,
  avisoDentro: null,
  galeria: null,
  ayer: false,
  paradasAyer: [],
  servidor: {},
  nota: null,
  pendientes: typeof window === 'undefined' ? {} : leer(),
  poner: (parcial) => {
    set(parcial)
    sincronizarBloqueo()
  },
  anotarPendiente: (stopId, p) =>
    set((s) => {
      const siguientes = { ...s.pendientes, [stopId]: p }
      guardar(siguientes)
      return { pendientes: siguientes }
    }),
  quitarPendiente: (stopId) =>
    set((s) => {
      if (!(stopId in s.pendientes)) return {}
      const { [stopId]: _fuera, ...resto } = s.pendientes
      guardar(resto)
      return { pendientes: resto }
    }),
}))

/** Hay algo abierto del Visto o las fotos: las sorpresas esperan. Se llama sola cada vez que cambia el estado. */
function sincronizarBloqueo() {
  const s = useVistoStore.getState()
  const abierta = Boolean(s.aviso || s.hoja || s.cola.length || s.permisos || s.camara || s.avisoDentro || s.galeria || s.ayer)
  if (useLogrosStore.getState().hojaAbierta !== abierta) useLogrosStore.getState().ponerHojaAbierta(abierta)
}

/** Cierra la hoja de ahora y saca la siguiente de la cola, si la hay. */
export function cerrarHoja() {
  const { cola, poner } = useVistoStore.getState()
  const [siguiente, ...resto] = cola
  poner({ hoja: siguiente ?? null, cola: resto })
}

export function abrirHoja(h: Hoja) {
  const { hoja, cola, poner } = useVistoStore.getState()
  if (hoja) poner({ cola: [...cola, h] })
  else poner({ hoja: h })
}

/** Lo que gana la foto: se suma a lo que espera en el almacén de los momentos. */
export function recibirRespuesta(r: RespuestaDeHecho | null) {
  useLogrosStore.getState().recibir(r)
}
