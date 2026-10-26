import { create } from 'zustand'
import { supabase } from './supabaseClient'

/**
 * LA HISTORIA DE PRUEBA (Tanda 10P, 1.1). Sin el pase, cada viajero tiene UNA historia gratis por destino: la del sitio que elija. Se gasta a los 3 segundos de escucharla y esa se queda suya
 * (la oye siempre); las demás, con el pase. Se guarda en la CUENTA (tabla `historia_de_prueba`, migración 0033, RLS por usuario) y en una copia local (localStorage) para que funcione sin red o sin
 * cuenta y se sincronice después. Sin la tabla (migración sin aplicar) o sin Supabase, todo sigue con lo local y nada lanza.
 * El día de prueba de HOY NO la gasta (allí `pagoActivo()` es verdadero y ni se mira).
 */

export interface HistoriaGastada {
  sitio: string
  nombre: string
}
export type MapaDeHistorias = Record<string, HistoriaGastada>
export type AccesoDePrueba = 'abierta' | 'suya' | 'cerrada'

const CLAVE_LOCAL = 'trazo:historia-prueba:v1'
/** Segundos escuchando antes de que la historia de prueba se gaste. */
export const SEGUNDOS_PARA_GASTAR = 3

export const claveDeDestino = (destino: string): string => String(destino ?? '').trim().toLowerCase()
export const claveDeSitio = (nombre: string): string => String(nombre ?? '').trim().toLowerCase()

function leerLocal(): MapaDeHistorias {
  try {
    const crudo = JSON.parse(window.localStorage.getItem(CLAVE_LOCAL) ?? '{}')
    return crudo && typeof crudo === 'object' && !Array.isArray(crudo) ? (crudo as MapaDeHistorias) : {}
  } catch {
    return {}
  }
}
function guardarLocal(mapa: MapaDeHistorias): void {
  try {
    window.localStorage.setItem(CLAVE_LOCAL, JSON.stringify(mapa))
  } catch {
    /* sin almacenamiento: vale hasta cerrar la pantalla */
  }
}

/** Pura: ¿cómo está esta historia? abierta = aún no se ha gastado la de este destino; suya = es la gastada; cerrada = ya hay otra. */
export function accesoDePrueba(mapa: MapaDeHistorias, destino: string, nombre: string): AccesoDePrueba {
  const gastada = mapa[claveDeDestino(destino)]
  if (!gastada) return 'abierta'
  return gastada.sitio === claveDeSitio(nombre) ? 'suya' : 'cerrada'
}

interface Estado {
  mapa: MapaDeHistorias
  /** Gasta la historia de prueba de este destino en este sitio (si ya había una, no cambia). */
  gastar: (destino: string, nombre: string) => void
  /** Pone el mapa (lo usa la sincronización y las pruebas). */
  poner: (mapa: MapaDeHistorias) => void
}

export const useHistoriaDePrueba = create<Estado>((set, get) => ({
  mapa: typeof window === 'undefined' ? {} : leerLocal(),
  gastar: (destino, nombre) => {
    const d = claveDeDestino(destino)
    if (!d || get().mapa[d]) return
    const nuevo = { ...get().mapa, [d]: { sitio: claveDeSitio(nombre), nombre: String(nombre).trim() } }
    guardarLocal(nuevo)
    set({ mapa: nuevo })
    void subirHistoria(d, nuevo[d])
  },
  poner: (mapa) => {
    guardarLocal(mapa)
    set({ mapa })
  },
}))

/** Un cliente mínimo de Supabase (para poder probar con uno simulado). */
export interface ClienteHistoria {
  auth: { getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }> }
  from: (tabla: string) => any
}

/** Sube una historia gastada a la cuenta. Nunca lanza; devuelve true si quedó guardada. */
export async function subirHistoria(destino: string, h: HistoriaGastada, cliente: ClienteHistoria | null = supabase as unknown as ClienteHistoria | null): Promise<boolean> {
  if (!cliente) return false
  try {
    const { data } = await cliente.auth.getSession()
    if (!data?.session) return false
    const { error } = await cliente.from('historia_de_prueba').upsert({ destino, sitio: h.sitio, nombre: h.nombre }, { onConflict: 'user_id,destino', ignoreDuplicates: true })
    if (error) {
      console.warn('[historia de prueba] no se pudo guardar en la cuenta (¿falta aplicar la migración 0033?):', error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Sincroniza con la cuenta: lo de la cuenta manda (si ya hay una para un destino, esa es); lo local que la cuenta no tiene se sube. Sin tabla, sin sesión o sin red: se queda con lo local.
 * Devuelve el mapa resultante.
 */
export async function sincronizarHistorias(cliente: ClienteHistoria | null = supabase as unknown as ClienteHistoria | null, local: MapaDeHistorias = useHistoriaDePrueba.getState().mapa): Promise<MapaDeHistorias> {
  if (!cliente) return local
  try {
    const { data: sesion } = await cliente.auth.getSession()
    if (!sesion?.session) return local
    const { data, error } = await cliente.from('historia_de_prueba').select('destino, sitio, nombre')
    if (error || !Array.isArray(data)) return local
    const remoto: MapaDeHistorias = {}
    for (const f of data as { destino: string; sitio: string; nombre: string }[]) remoto[f.destino] = { sitio: f.sitio, nombre: f.nombre }
    const unido = { ...local, ...remoto }
    for (const [destino, h] of Object.entries(local)) if (!remoto[destino]) await subirHistoria(destino, h, cliente)
    return unido
  } catch {
    return local
  }
}

let sincronizada = false
/** Se llama al montar cualquier botón de historia: sincroniza una vez por carga de la app. */
export function sincronizarUnaVez(): void {
  if (sincronizada || typeof window === 'undefined') return
  sincronizada = true
  void sincronizarHistorias().then((m) => {
    if (JSON.stringify(m) !== JSON.stringify(useHistoriaDePrueba.getState().mapa)) useHistoriaDePrueba.getState().poner(m)
  })
}

/** Solo pruebas: vuelve a permitir la sincronización. */
export const _reiniciarSincronizacion = (): void => {
  sincronizada = false
}
