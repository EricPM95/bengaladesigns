/**
 * El servidor de mentira de las cuentas, parte 3 (SOLO desarrollo, `?logrosDemo=1`): contesta lo del cobro, «Mis pases» y lo que haga falta para probar las pantallas sin Supabase.
 * `window.__demoCuentas` cambia lo que contesta (el cobro encendido o no, los pases que tiene, los avisos…). Cada archivo `logrosDemo_*.ts` exporta `responder` y devuelve `undefined` si la ruta no es suya.
 */
import precios from '../../data/pase/precios.json'
import type { PaseMio } from './pagoPase'

export const demoCuentas: {
  cobro: boolean
  pases: PaseMio[]
  [clave: string]: unknown
} = {
  cobro: true,
  pases: [],
}

if (typeof window !== 'undefined') (window as unknown as { __demoCuentas: typeof demoCuentas }).__demoCuentas = demoCuentas

export function responder(ruta: string, url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  void url
  void c
  void opciones
  if (ruta === '/api/pase/config') return demoCuentas.cobro ? { ok: true, cobro: true, modo: 'mentira', moneda: 'EUR', destinos: ['Roma'], precios: { planes: precios.planes } } : { ok: true, cobro: false, modo: null }
  if (ruta === '/api/pases/mios') return { ok: true, pases: demoCuentas.pases }
  return undefined
}
