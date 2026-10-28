import { useCallback, useSyncExternalStore } from 'react'
import { type Importe } from './dinero'
import { MONEDA_BASE, formatearPrecio, formatearCentimosBase, type VistaDeMoneda } from './monedaFormato'
import { supabase } from './supabaseClient'
import { useRouteStore } from '../store/useRouteStore'
import { useCambio, pedirCambio, cambioActual } from './useMoneda'

/**
 * UNA SOLA MONEDA PARA CADA VIAJERO, EN TODA LA APP (Tanda 10N7, 2b-5).
 *   · Por defecto, el euro. Cada viajero elige la suya en dos sitios sincronizados («Moneda» del presupuesto y Ajustes del perfil): los dos llaman a `cambiarMoneda`.
 *   · Se guarda en su cuenta (travelers.moneda, migración 0056) y, SIEMPRE, en este móvil (respaldo sin sesión o sin la migración).
 *   · Cada precio se guarda en la moneda en que se apuntó. Para ENSEÑARLO, `formatearPrecio` lo pasa a la moneda del viajero con el cambio del día: «≈ 2.150 MXN · 100 €» (convertido y, en pequeño, el original).
 *     Sin cambio disponible se enseña el original solo, sin romper nada.
 */

export { MONEDA_BASE, formatearPrecio, formatearCentimosBase, hayCambioPara, type VistaDeMoneda, type PrecioFormateado } from './monedaFormato'
const CLAVE = 'trazo:moneda-viajero'

let actual: string | null = null
let cargadaDelMovil = false
const oyentes = new Set<() => void>()

function leerDelMovil(): string | null {
  try {
    const v = window.localStorage.getItem(CLAVE)
    return v && /^[A-Z]{3}$/.test(v) ? v : null
  } catch {
    return null
  }
}

/** La moneda elegida por el viajero (null si nunca eligió: entonces, euros). */
export function monedaElegida(): string | null {
  if (!cargadaDelMovil) {
    cargadaDelMovil = true
    actual = leerDelMovil()
  }
  return actual
}

/** La moneda con la que se enseña todo: la elegida o el euro. */
export const monedaDeVista = (): string => monedaElegida() ?? MONEDA_BASE

function avisar() {
  for (const o of oyentes) o()
}

/** Pone la moneda solo en memoria y en el móvil (lo que llega de la cuenta); no la sube. */
export function ponerMonedaLocal(codigo: string | null): void {
  cargadaDelMovil = true
  const limpio = codigo && /^[A-Z]{3}$/.test(codigo) ? codigo : null
  if (limpio === actual) return
  actual = limpio
  try {
    if (limpio) window.localStorage.setItem(CLAVE, limpio)
    else window.localStorage.removeItem(CLAVE)
  } catch {
    /* sin almacenamiento */
  }
  // Los componentes que leen `monedaDelViajero(route)` se vuelven a pintar al cambiar la ruta guardada.
  const store = useRouteStore.getState()
  if (store.route && store.route.monedaViajero !== limpio) store.setMonedaViajero(limpio ?? MONEDA_BASE)
  avisar()
}

/** Cambia la moneda del viajero: se acuerda en este móvil y, con cuenta, en la cuenta. Devuelve 'nube' | 'local'. */
export async function cambiarMoneda(codigo: string, uid?: string | null): Promise<'nube' | 'local'> {
  ponerMonedaLocal(codigo)
  const id = uid ?? (await uidActual())
  if (id && supabase) {
    try {
      const { error } = await supabase.from('travelers').update({ moneda: codigo }).eq('id', id)
      if (!error) return 'nube'
    } catch {
      /* sin conexión o sin la migración 0056: queda en el móvil */
    }
  }
  return 'local'
}

async function uidActual(): Promise<string | null> {
  try {
    const { data } = (await supabase?.auth.getSession()) ?? { data: null }
    return data?.session?.user?.id ?? null
  } catch {
    return null
  }
}

/** Trae la moneda de la cuenta (al entrar). Si la cuenta no tiene (o aún no hay migración), manda la del móvil. */
export async function cargarMonedaDeLaCuenta(uid: string): Promise<void> {
  if (!supabase) return
  try {
    const { data, error } = await supabase.from('travelers').select('moneda').eq('id', uid).maybeSingle()
    if (error) return
    const codigo = (data as { moneda?: string | null } | null)?.moneda
    if (codigo) ponerMonedaLocal(codigo)
    else if (monedaElegida()) void cambiarMoneda(monedaElegida() as string, uid)
  } catch {
    /* la del móvil */
  }
}

/** Quien necesita volver a pintar al cambiar la moneda. */
export function suscribirMoneda(f: () => void): () => void {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// React

/** La moneda del viajero + el cambio del día + el formateador, y repinta al cambiar la moneda. */
export function useMonedaViajero() {
  const moneda = useSyncExternalStore(suscribirMoneda, monedaDeVista, () => MONEDA_BASE)
  const cambio = useCambio()
  const formatear = useCallback((importe: Importe, opciones?: { mostrarOriginal?: boolean }) => formatearPrecio(importe, { codigo: moneda, cambio }, opciones), [moneda, cambio])
  const base = useCallback((centimos: number) => formatearCentimosBase(centimos, { codigo: moneda, cambio }), [moneda, cambio])
  return { moneda, cambio, vista: { codigo: moneda, cambio } as VistaDeMoneda, formatear, base, cambiar: cambiarMoneda }
}

/**
 * Para los sitios que arman un texto sin ser un componente (títulos, subtítulos…): el precio con la moneda de ahora y el cambio que ya se pidió (si aún no llegó, se enseña el original solo).
 * Quien lo use dentro de un componente debe llamar también a `useMonedaViajero()` para volver a pintarse cuando cambie la moneda o llegue el cambio.
 */
export function precioEnVista(importe: Importe, opciones?: { mostrarOriginal?: boolean }): string {
  void pedirCambio()
  return formatearPrecio(importe, { codigo: monedaDeVista(), cambio: cambioActual() }, opciones).completo
}

/** El precio de una tienda (entrada, excursión, actividad) en la moneda del viajero y, al lado, el original: «≈ 215 MXN · 20 €». Sin moneda en el dato, el euro (igual que `precioTienda`). */
export const precioTiendaEnVista = (importe: number, moneda?: string): string => precioEnVista({ amount: importe, currency: moneda || MONEDA_BASE })
