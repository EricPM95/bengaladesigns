import monedasPorPais from '../../shared/dinero/monedasPorPais.json'

/**
 * El dinero de la app (Tanda 6z2): UNA sola forma de guardar un precio para todo lo que el viajero añade al viaje (importe y moneda), y UN solo sitio donde se formatea y se convierte.
 * Nunca lo pone la app: si el viajero no lo escribe, no hay precio (null). Es informativo: no cambia la ruta.
 */
export interface Importe {
  amount: number
  /** Código ISO de moneda en mayúsculas: «EUR», «MXN»… */
  currency: string
}

/** Los cambios del día: cuántas unidades de cada moneda son 1 euro (la moneda base del Banco Central Europeo). Sin el euro, que vale 1. */
export interface Cambio {
  /** «AAAA-MM-DD» del día al que corresponden. */
  fecha: string
  tasas: Record<string, number>
}

// El formato (símbolos, miles, decimales) vive en `shared/dinero/formato.js`: lo usan también el servidor y los datos.
export { conMiles, numeroEs, simboloDe, formatoImporte, rangoImporte, precioTienda, MONEDA_POR_DEFECTO } from '../../shared/dinero/formato.js'

/** ¿Es un importe de verdad (mayor que 0 y con moneda)? */
export function esImporte(valor: unknown): valor is Importe {
  const candidato = valor as Partial<Importe> | null | undefined
  return Boolean(candidato) && typeof candidato?.amount === 'number' && Number.isFinite(candidato.amount) && candidato.amount > 0 && typeof candidato.currency === 'string' && candidato.currency.length > 0
}

/** El texto de un campo de precio → importe, o null si está vacío o no es un número mayor que 0. Admite coma o punto decimal. */
export function importeDeTexto(texto: string, moneda: string): Importe | null {
  const limpio = texto.replace(/[^\d.,]/g, '')
  if (!limpio) return null
  // «1.200,50» (punto de millar y coma decimal) y «1200.50» se entienden los dos.
  const normal = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(limpio) ? limpio.replace(/\./g, '') : limpio
  const valor = Number(normal)
  return Number.isFinite(valor) && valor > 0 ? { amount: Math.round(valor * 100) / 100, currency: moneda } : null
}

/** El importe como texto para un campo de edición (sin la moneda): «54», «54,5». */
export const textoDeImporte = (importe: Importe | null | undefined): string => (importe ? String(importe.amount).replace('.', ',') : '')

/**
 * Lee un precio guardado: el de ahora (`{amount, currency}`) o, en los viajes guardados antes de la 6z2, un número a secas (siempre fue en euros: es lo que se escribía a mano).
 * Es el único sitio que conoce la forma antigua.
 */
export function leerImporte(valor: unknown): Importe | null {
  if (esImporte(valor)) return valor
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? { amount: valor, currency: 'EUR' } : null
}

/** El precio de una compra guardada: el de ahora (`precio`) o, en los viajes de antes de la 6z2, el número a secas que se llamaba `price`. */
export const precioGuardado = (compra: { precio?: unknown; price?: unknown } | null | undefined): Importe | null => leerImporte(compra?.precio) ?? leerImporte(compra?.price)

/** La moneda que se propone a un viajero según el país de su ciudad de origen (código ISO de país en minúsculas); null si no se sabe. */
export function monedaDePais(codigoPais: string | null | undefined): string | null {
  if (!codigoPais) return null
  return (monedasPorPais as Record<string, string>)[codigoPais.toLowerCase()] ?? null
}

/**
 * Pasa un importe a otra moneda con el cambio del día (por el euro). null si falta el cambio de alguna de las dos monedas.
 */
export function convertir(importe: Importe, aMoneda: string, cambio: Cambio | null | undefined): Importe | null {
  if (importe.currency === aMoneda) return importe
  if (!cambio) return null
  const desde = importe.currency === 'EUR' ? 1 : cambio.tasas[importe.currency]
  const hasta = aMoneda === 'EUR' ? 1 : cambio.tasas[aMoneda]
  if (!desde || !hasta) return null
  return { amount: (importe.amount / desde) * hasta, currency: aMoneda }
}

/** Suma exacta de importes de una misma moneda, redondeada al céntimo. */
export const sumar = (importes: Importe[], moneda: string): Importe => ({ amount: Math.round(importes.reduce((total, importe) => total + importe.amount, 0) * 100) / 100, currency: moneda })
