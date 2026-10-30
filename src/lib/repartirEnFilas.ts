/**
 * (10S5) Los cuadrados de elegir día ocupan todo el ancho, repartidos a partes iguales. Hasta 4 caben en una fila; con más se parten en las filas justas (5-8 días, dos filas) y cada fila
 * queda igual de llena que las demás (7 días: 4 + 3; 6: 3 + 3). Pura: devuelve las filas, en orden.
 */
export const MAX_POR_FILA = 4

export function repartirEnFilas<T>(elementos: readonly T[], maxPorFila: number = MAX_POR_FILA): T[][] {
  const n = elementos.length
  if (n === 0) return []
  const filas = Math.ceil(n / maxPorFila)
  const base = Math.floor(n / filas)
  const sobran = n % filas
  const out: T[][] = []
  let desde = 0
  for (let i = 0; i < filas; i++) {
    const cuantos = base + (i < sobran ? 1 : 0)
    out.push(elementos.slice(desde, desde + cuantos))
    desde += cuantos
  }
  return out
}
