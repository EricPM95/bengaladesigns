import { convertir, formatoImporte, type Cambio, type Importe } from './dinero'

/** Dar formato a los precios en la moneda del viajero (Tanda 10N7). Solo funciones puras: sin React ni red (las usan las pruebas). */
export const MONEDA_BASE = 'EUR'

export interface VistaDeMoneda {
  /** La moneda del viajero. */
  codigo: string
  cambio: Cambio | null | undefined
}

export interface PrecioFormateado {
  /** Lo principal: en la moneda del viajero («≈ 2.150 MXN») o, si no se pudo convertir o ya era la suya, el original. */
  texto: string
  /** El original en pequeño («100 €»), solo si hubo conversión. */
  original: string | null
  /** Todo junto: «≈ 2.150 MXN · 100 €». */
  completo: string
  /** ¿Es una aproximación convertida («≈»)? */
  aproximado: boolean
  /** La moneda del precio es otra y no hay cambio para pasarla a la del viajero. */
  sinCambio: boolean
}

/** Redondeo de lo convertido: enteros desde 100, dos decimales por debajo. */
const redondear = (v: number): number => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 100) / 100)

/**
 * Un precio guardado → cómo se enseña. `mostrarOriginal` (por defecto sí) añade el original en pequeño; `false` solo el convertido (titulares).
 * Si la moneda es la del viajero: tal cual. Si no hay cambio: el original solo y `sinCambio`.
 */
export function formatearPrecio(importe: Importe, vista: VistaDeMoneda, opciones: { mostrarOriginal?: boolean } = {}): PrecioFormateado {
  const original = formatoImporte(importe)
  if (importe.currency === vista.codigo) return { texto: original, original: null, completo: original, aproximado: false, sinCambio: false }
  const convertido = convertir(importe, vista.codigo, vista.cambio)
  if (!convertido) return { texto: original, original: null, completo: original, aproximado: false, sinCambio: true }
  const texto = `≈ ${formatoImporte({ amount: redondear(convertido.amount), currency: vista.codigo })}`
  const mostrar = opciones.mostrarOriginal !== false
  return { texto, original: mostrar ? original : null, completo: mostrar ? `${texto} · ${original}` : texto, aproximado: true, sinCambio: false }
}

/** Céntimos en la base del grupo (euros) → texto en la moneda del viajero («≈ 322 MXN»), o en euros si es la suya o no hay cambio. */
export function formatearCentimosBase(centimos: number, vista: VistaDeMoneda): string {
  return formatearPrecio({ amount: centimos / 100, currency: MONEDA_BASE }, vista, { mostrarOriginal: false }).texto
}

/** ¿Se puede enseñar en esa moneda? (euro o con cambio del día). */
export const hayCambioPara = (codigo: string, cambio: Cambio | null | undefined): boolean => codigo === MONEDA_BASE || Boolean(cambio?.tasas?.[codigo])
