/**
 * Cómo se escribe el dinero en toda la app (Tanda 6z2): UN solo sitio, usado por el cliente (`src/lib/dinero.ts`) y por el servidor. Nunca un «€» escrito a mano en lo que ve el viajero: todo importe pasa por aquí.
 * Formato en español: punto de millar (también en cuatro cifras), coma decimal, sin decimales si el número es redondo: «54 €», «54 £», «1.200 Kč», «800 MXN», «54,50 €».
 */

/** Los precios de las tiendas de los datos (entradas, excursiones, traslados) se dan en esta moneda si el dato no dice otra. */
export const MONEDA_POR_DEFECTO = 'EUR'

const SIMBOLOS = { EUR: '€', GBP: '£', CZK: 'Kč', PLN: 'zł', CHF: 'CHF', USD: 'US$', JPY: '¥' }

/** 1240 → «1.240». */
export const conMiles = (numero) => String(numero).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** El número con coma decimal y puntos de millar; sin decimales si es redondo. */
export function numeroEs(valor) {
  const redondo = Math.round(valor * 100) / 100
  if (Number.isInteger(redondo)) return conMiles(redondo)
  const [entera, decimales] = redondo.toFixed(2).split('.')
  return `${conMiles(Number(entera))},${decimales}`
}

/** El símbolo de una moneda («€», «£», «Kč»); sin símbolo propio, su código («MXN»). */
export const simboloDe = (moneda) => SIMBOLOS[moneda] ?? moneda

/** «54 €», «1.200 Kč», «800 MXN». */
export const formatoImporte = (importe) => `${numeroEs(importe.amount)} ${simboloDe(importe.currency)}`

/** «50-55 €»: un precio entre dos importes de la misma moneda. */
export const rangoImporte = (desde, hasta, moneda) => `${numeroEs(desde)}-${numeroEs(hasta)} ${simboloDe(moneda)}`

/** El precio de una tienda tal como lo da la tienda (sin convertir): «14 €». Sin moneda en el dato, la de `MONEDA_POR_DEFECTO`. */
export const precioTienda = (importe, moneda) => formatoImporte({ amount: importe, currency: moneda || MONEDA_POR_DEFECTO })
