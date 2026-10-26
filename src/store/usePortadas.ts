import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

/**
 * LAS PORTADAS DE «MIS VIAJES» (Tanda 10N3, §3b.6): la foto de fondo de la tarjeta de cada viaje. Por defecto sale la foto del destino (la misma para todos los viajes a ese sitio); la persona
 * puede cambiarla por una de las fotos de su viaje o por una de su galería, o volver a la del destino. Lo elegido se guarda POR PERSONA y por viaje: en la cuenta (travelers.portadas, migración 0044)
 * y siempre en este móvil (por si aún no está la migración o no hay cuenta). Sin elección (`undefined`) y con el viaje ya hecho, sale sola la primera foto suya si la tiene.
 */
export type Portada =
  /** Volver a la del destino (aunque el viaje esté hecho y tenga fotos). */
  | { f: 'destino' }
  /** Una foto de este viaje (la de una de sus paradas): su id y su ruta en el almacén `fotos-viaje`. */
  | { f: 'viaje'; id: string; ruta: string }
  /** Una foto de la galería: su ruta en el almacén `perfiles` (con cuenta) o la propia foto pequeña en `data` (sin cuenta). */
  | { f: 'galeria'; ruta?: string; data?: string }

const CLAVE = 'trazo:portadas'

/** Pura: lo que llega de la nube o del móvil, validado. Lo que no se entiende se descarta. */
export function leerPortadas(valor: unknown): Record<string, Portada> {
  let v = valor
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v)
    } catch {
      return {}
    }
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const salida: Record<string, Portada> = {}
  for (const [id, p] of Object.entries(v as Record<string, unknown>)) {
    if (!p || typeof p !== 'object') continue
    const o = p as Record<string, unknown>
    if (o.f === 'destino') salida[id] = { f: 'destino' }
    else if (o.f === 'viaje' && typeof o.id === 'string' && typeof o.ruta === 'string') salida[id] = { f: 'viaje', id: o.id, ruta: o.ruta }
    else if (o.f === 'galeria' && (typeof o.ruta === 'string' || typeof o.data === 'string')) salida[id] = { f: 'galeria', ...(typeof o.ruta === 'string' ? { ruta: o.ruta } : {}), ...(typeof o.data === 'string' ? { data: o.data } : {}) }
  }
  return salida
}

const leerLocal = (): Record<string, Portada> => {
  try {
    return leerPortadas(window.localStorage.getItem(CLAVE))
  } catch {
    return {}
  }
}
const guardarLocal = (m: Record<string, Portada>) => {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(m))
  } catch {
    /* sin almacenamiento: queda en la cuenta */
  }
}

interface PortadasState {
  uid: string | null
  porViaje: Record<string, Portada>
  /** Lo llama `useMiPerfil.cargar` al entrar con una cuenta: las portadas de la cuenta mandan sobre las de este móvil (que se suben si la cuenta no tiene ninguna). */
  iniciar: (uid: string, deLaCuenta: unknown) => void
  /** Elige la portada de un viaje; `null` la quita (vuelve al automático). */
  elegir: (tripId: string, portada: Portada | null) => Promise<'nube' | 'local' | 'error'>
}

export const usePortadas = create<PortadasState>((set, get) => ({
  uid: null,
  porViaje: leerLocal(),
  iniciar: (uid, deLaCuenta) => {
    const nube = leerPortadas(deLaCuenta)
    const mezcla = { ...get().porViaje, ...nube }
    set({ uid, porViaje: mezcla })
    guardarLocal(mezcla)
  },
  elegir: async (tripId, portada) => {
    const siguiente = { ...get().porViaje }
    if (portada) siguiente[tripId] = portada
    else delete siguiente[tripId]
    set({ porViaje: siguiente })
    guardarLocal(siguiente)
    const { uid } = get()
    if (uid && supabase) {
      const { error } = await supabase.from('travelers').update({ portadas: siguiente }).eq('id', uid)
      if (!error) return 'nube'
    }
    return 'local'
  },
}))

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __portadas: typeof usePortadas }).__portadas = usePortadas
