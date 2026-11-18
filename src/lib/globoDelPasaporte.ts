import { supabase } from './supabaseClient'

/**
 * (V14) La posición del globo de la tarjeta «Mi pasaporte» del Perfil: el punto que el viajero dejó en el centro con el dedo. Se guarda SIEMPRE en este móvil y, con cuenta, en la cuenta
 * (travelers.globo_pasaporte, migración 0080) para que salga igual en otro móvil. Sin la migración, queda en el móvil y no pasa nada más.
 */
export interface PosicionDelGlobo {
  lat: number
  lng: number
}
const CLAVE = 'jutrip.globo_pasaporte'
const valida = (v: unknown): PosicionDelGlobo | null => {
  const o = (typeof v === 'string' ? (() => { try { return JSON.parse(v) } catch { return null } })() : v) as { lat?: unknown; lng?: unknown } | null
  if (!o || typeof o.lat !== 'number' || typeof o.lng !== 'number' || !Number.isFinite(o.lat) || !Number.isFinite(o.lng)) return null
  return { lat: Math.max(-85, Math.min(85, o.lat)), lng: ((((o.lng + 180) % 360) + 360) % 360) - 180 }
}

export function leerGloboLocal(): PosicionDelGlobo | null {
  try {
    return valida(window.localStorage.getItem(CLAVE))
  } catch {
    return null
  }
}

export async function guardarGlobo(uid: string | null, pos: PosicionDelGlobo): Promise<'nube' | 'local' | 'error'> {
  const v = valida(pos)
  if (!v) return 'error'
  let local = true
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(v))
  } catch {
    local = false
  }
  if (uid && supabase) {
    const { error } = await supabase.from('travelers').update({ globo_pasaporte: v }).eq('id', uid)
    if (!error) return 'nube'
  }
  return local ? 'local' : 'error'
}

/** La posición guardada en la cuenta (null sin cuenta, sin posición o sin la migración 0080). */
export async function cargarGloboDeLaCuenta(uid: string): Promise<PosicionDelGlobo | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('travelers').select('globo_pasaporte').eq('id', uid).maybeSingle()
  if (error || !data) return null
  const v = valida((data as { globo_pasaporte?: unknown }).globo_pasaporte)
  if (v) {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(v))
    } catch {
      /* sin almacenamiento */
    }
  }
  return v
}
