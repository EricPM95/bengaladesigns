/**
 * «Tocar un pedazo dice su nombre» (Tanda 8C2). Dado un toque dentro del dibujo de una insignia de colección, dice qué pedazo (el número de su sitio en la colección) es. Cada pedazo es siempre su
 * sitio, en el orden de `sitios` de la colección (data/logros/roma.json); las formas son las de `dibujos/Insignia.tsx`, así que si allí cambia la forma de una colección, hay que cambiarla aquí.
 * Función pura: `x` e `y` van de 0 a 1 dentro del cuadrado de la insignia (0,0 = esquina de arriba a la izquierda).
 */
export type FormaDeInsignia = 'octogono' | 'vati' | 'joyas' | 'cinta' | 'cuna'

/** Las colecciones con una forma propia; el resto son «cuñas» (la insignia partida en tantos trozos como sitios). */
export const FORMA_POR_COLECCION: Record<string, FormaDeInsignia> = {
  imprescindibles: 'octogono',
  pais_mas_pequeno: 'vati',
  cuatro_joyas: 'joyas',
  caravaggio: 'cinta',
}

const grados = (dx: number, dy: number) => (Math.atan2(dy, dx) * 180) / Math.PI
const mod = (a: number, n: number) => ((a % n) + n) % n

export function piezaDeInsignia(coleccion: string, total: number, x: number, y: number): number | null {
  if (!(total > 0) || x < 0 || x > 1 || y < 0 || y > 1) return null
  const forma = FORMA_POR_COLECCION[coleccion] ?? 'cuna'
  const dx = x - 0.5
  const dy = y - 0.5
  const radio = Math.hypot(dx, dy)
  if (forma === 'cinta') return Math.min(total - 1, Math.max(0, Math.floor(((x - 0.01) / 0.98) * total)))
  if (radio < 0.08 && forma !== 'joyas') return null
  const a = grados(dx, dy)
  if (forma === 'octogono') return radio < 0.2 ? null : Math.floor(mod(a + 112.5, 360) / 45) % 8
  if (forma === 'joyas') {
    // El rombo: arriba, derecha, izquierda, abajo (las 4 joyas giradas 45°).
    if (a >= -135 && a < -45) return 0
    if (a >= -45 && a < 45) return 1
    if (a >= 45 && a < 135) return 3
    return 2
  }
  if (forma === 'vati') {
    // El escudo partido en dos mitades (museos a la izquierda, basílica a la derecha) y las llaves cruzadas en el centro (la plaza).
    if (Math.abs(dx) < 0.17 && y > 0.3 && y < 0.9) return Math.min(2, total - 1)
    return dx < 0 ? 0 : Math.min(1, total - 1)
  }
  // Cuñas: la primera empieza arriba y gira a la derecha (+0,3 rad), como `cuña(j, n)` del dibujo.
  const paso = 360 / total
  return Math.floor(mod(a - (-90 + (0.3 * 180) / Math.PI), 360) / paso) % total
}
