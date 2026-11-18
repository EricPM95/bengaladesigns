import { COLECCIONES_POR_PARTES } from '../../dibujos/partes'

/**
 * «Tocar un pedazo dice su nombre» (Tanda 8C2; V13: las insignias por partes). Dado un toque dentro del dibujo de una insignia de colección, dice qué pedazo (el número de su sitio en la colección) es.
 * Cada pedazo es siempre su sitio, en el orden de los datos (`dibujos/partes.ts`). Las insignias de Design (`Piezas/Insignia Lanza Codigo`) están partidas en tantos SECTORES como sitios, desde las 12 y en el
 * sentido de las agujas del reloj, alrededor del centro de su forma: el trozo `k` es el sector `k`. Función pura: `x` e `y` van de 0 a 1 dentro del cuadrado de la insignia (0,0 = arriba a la izquierda).
 */

/** El centro de cada forma, en tanto por uno del cuadrado (el `c` de `SHAPES` de la pieza de Design, entre 200). */
const CENTRO: Record<string, [number, number]> = {
  r2: [0.5, 0.49],
  r5: [0.5, 0.56],
  r8: [0.5, 0.53],
  '4': [0.5, 0.56],
  '6': [0.5, 0.53],
}

const mod = (a: number, n: number) => ((a % n) + n) % n

export function piezaDeInsignia(coleccion: string, total: number, x: number, y: number): number | null {
  if (!(total > 0) || x < 0 || x > 1 || y < 0 || y > 1) return null
  const clave = COLECCIONES_POR_PARTES[coleccion]?.col
  const [cx, cy] = (clave && CENTRO[clave]) || [0.5, 0.5]
  const dx = x - cx
  const dy = y - cy
  // El centro es la medalla (no es ningún trozo).
  if (Math.hypot(dx, dy) < 0.13) return null
  const grados = (Math.atan2(dy, dx) * 180) / Math.PI
  return Math.floor(mod(grados + 90, 360) / (360 / total)) % total
}
