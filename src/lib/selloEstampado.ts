import { supabase } from './supabaseClient'

/**
 * El sello de un viaje se estampa UNA sola vez. (V14) Se apuntaba solo en este móvil; (V15) ahora también en la CUENTA (`travelers.sellos_estampados`, migración 0081): en otro móvil o tras reinstalar
 * sale [Ver mi sello]. Cada entrada: `{ [id del viaje]: { fecha, en } }` (la fecha del sello, el primer día del viaje, y cuándo se estampó). Lo estampado en un móvil sin la migración o antes de ella se
 * sube solo a la cuenta al abrir la app (`sincronizarSellosConLaCuenta`). Sin la migración: solo en el móvil, como antes.
 */
const CLAVE = 'jutrip.sellos_estampados'

export type SellosEstampados = Record<string, { fecha: string | null; en: string }>

/** Lo que haya en el móvil: el formato nuevo (un objeto) o el de la V14 (una lista de ids). */
export function leerSellosLocales(): SellosEstampados {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? '{}')
    if (Array.isArray(v)) return Object.fromEntries(v.map(String).map((id) => [id, { fecha: null, en: new Date(0).toISOString() }]))
    return v && typeof v === 'object' ? (v as SellosEstampados) : {}
  } catch {
    return {}
  }
}

const escribirLocal = (m: SellosEstampados): void => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(m))
  } catch {
    /* sin almacenamiento */
  }
}

let uidActual: string | null = null

export const selloYaEstampado = (tripId: string | null | undefined): boolean => Boolean(tripId) && Boolean(leerSellosLocales()[String(tripId)])

/** Dónde vive lo de la cuenta. Por defecto, travelers.sellos_estampados; las pruebas ponen otro (ponerCuentaDePrueba) para hacer de «otro móvil» sin tocar Supabase. */
export interface AlmacenDeCuenta {
  leer: (uid: string) => Promise<SellosEstampados | null>
  escribir: (uid: string, m: SellosEstampados) => Promise<boolean>
}
const deSupabase: AlmacenDeCuenta = {
  leer: async (uid) => {
    if (!supabase) return null
    const { data, error } = await supabase.from('travelers').select('sellos_estampados').eq('id', uid).maybeSingle()
    if (error) return null
    const v = (data as { sellos_estampados?: unknown } | null)?.sellos_estampados ?? {}
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as SellosEstampados) : {}
  },
  escribir: async (uid, m) => {
    if (!supabase) return false
    const { error } = await supabase.from('travelers').update({ sellos_estampados: m }).eq('id', uid)
    return !error
  },
}
let almacen: AlmacenDeCuenta = deSupabase
export function ponerCuentaDePrueba(a: AlmacenDeCuenta | null): void {
  almacen = a ?? deSupabase
}
const guardarEnLaCuenta = (uid: string, m: SellosEstampados): Promise<boolean> => almacen.escribir(uid, m)

/** Apunta que el sello de este viaje ya se estampó: en el móvil al instante y, con cuenta, en la cuenta. `fecha`: la del sello (el primer día del viaje). */
export function marcarSelloEstampado(tripId: string, fecha: string | null = null): void {
  const m = leerSellosLocales()
  if (m[tripId]) return
  m[tripId] = { fecha, en: new Date().toISOString() }
  escribirLocal(m)
  if (uidActual) void guardarEnLaCuenta(uidActual, m)
}

/**
 * Al abrir la app con cuenta: junta lo estampado en el móvil con lo de la cuenta. Lo de la cuenta pasa al móvil (así sale [Ver mi sello] aquí) y lo que solo estaba en el móvil sube a la cuenta.
 * Devuelve cuántos sellos subió. Sin la migración 0081 (la lectura falla) no toca nada.
 */
export async function sincronizarSellosConLaCuenta(uid: string): Promise<number> {
  uidActual = uid
  const cuenta = await almacen.leer(uid) // null: sin cuenta o sin la migración 0081
  if (cuenta === null) return 0
  const local = leerSellosLocales()
  const union: SellosEstampados = { ...cuenta }
  let subidos = 0
  for (const [id, v] of Object.entries(local)) {
    if (!union[id]) {
      union[id] = v
      subidos++
    }
  }
  escribirLocal(union)
  if (subidos > 0) await guardarEnLaCuenta(uid, union)
  return subidos
}
