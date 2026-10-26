/**
 * EL PRECIO DEL PASE EN LA MONEDA DEL VIAJERO (Tanda 10P, apartado 1.7). Los precios en euros son SIEMPRE los de data/pase/precios.json; aquí solo se enseñan en otra moneda, con «≈», como información.
 * REGLA DE ERIC: que nunca pague más de lo que vio. El cambio es el del día (Banco Central Europeo, `/api/cambio`) MÁS UN 4 % (lo máximo que cobra Stripe en Adaptive Pricing: 2–4 %), REDONDEADO SIEMPRE
 * HACIA ARRIBA al paso de cada moneda: lo que se enseña es igual o un poco más que lo que Stripe cobrará, nunca menos. Al pagar manda Stripe (la página de pago cobra en su moneda; a JUTRIP le llega en euros).
 */
export const RECARGO_STRIPE = 1.04

/** Una moneda lista para enseñar precios: su código y cuántas unidades son 1 euro. */
export interface MonedaDelPase {
  codigo: string
  tasa: number
}

/** El paso al que se redondea (hacia arriba) en cada moneda: 0,1 en las que valen casi un euro, 1 en las de 2–10 por euro, 10 en pesos mexicanos, 100 en pesos colombianos o chilenos, 1.000 en rupias. */
export function pasoDeRedondeo(tasa: number): number {
  if (tasa < 2) return 0.1
  if (tasa < 10) return 1
  if (tasa < 100) return 10
  if (tasa < 2000) return 100
  return 1000
}

/** Lo que se enseña de un importe en euros: su valor en la moneda con el cambio del día + 4 %, redondeado hacia arriba al paso. Un epsilon evita que 140,0000001 salte a 150. */
export function importeEnsenado(euros: number, m: MonedaDelPase): number {
  const paso = pasoDeRedondeo(m.tasa)
  const bruto = (euros * m.tasa * RECARGO_STRIPE) / paso
  return Math.ceil(bruto - 1e-9) * paso
}

/** Lo MÁXIMO que Stripe puede cobrar por un importe en euros, en la moneda local (cambio del día + 4 %), sin redondear. */
export const maximoQueCobraStripe = (euros: number, m: MonedaDelPase): number => euros * m.tasa * RECARGO_STRIPE

const numero = (v: number, paso: number): string => {
  const dec = paso < 1 ? 2 : 0
  return v.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

/** «≈ 140 MXN» (en euros, sin «≈»: «6,99 €»). */
export function textoEnMoneda(euros: number, m: MonedaDelPase | null): string {
  if (!m || m.codigo === 'EUR') return `${(Math.round(euros * 100) / 100).toFixed(2).replace('.', ',')} €`
  return `≈ ${numero(importeEnsenado(euros, m), pasoDeRedondeo(m.tasa))} ${m.codigo}`
}

/** «Ahorras ≈ 60 MXN»: la diferencia de los dos números YA redondeados (tachado − precio), para que la cuenta cuadre siempre. */
export function ahorroEnMoneda(tachadoEuros: number, precioEuros: number, m: MonedaDelPase | null): string {
  if (!m || m.codigo === 'EUR') return `Ahorras ${(Math.round((tachadoEuros - precioEuros) * 100) / 100).toFixed(2).replace('.', ',')} €`
  const paso = pasoDeRedondeo(m.tasa)
  const dif = Math.round((importeEnsenado(tachadoEuros, m) - importeEnsenado(precioEuros, m)) / paso) * paso
  return `Ahorras ≈ ${numero(dif, paso)} ${m.codigo}`
}

/** La moneda elegida por el viajero EN EL PASE (se acuerda en el móvil); si no hay, la del viajero. */
const CLAVE = 'trazo:moneda-pase'
export function monedaGuardada(): string | null {
  try {
    return window.localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}
export function guardarMoneda(codigo: string): void {
  try {
    window.localStorage.setItem(CLAVE, codigo)
  } catch {
    /* sin almacenamiento */
  }
}

/** El código a usar de verdad: el pedido si hay cambio para él; si no, el euro (nunca se inventa un cambio). */
export function monedaUsable(codigo: string, tasas: Record<string, number> | undefined | null): MonedaDelPase | null {
  if (!codigo || codigo === 'EUR') return null
  const tasa = tasas?.[codigo]
  return tasa && tasa > 0 ? { codigo, tasa } : null
}
