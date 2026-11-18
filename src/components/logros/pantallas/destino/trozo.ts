import { piezaDeInsignia } from '../../momentos/hoja/piezaDeInsignia'

/**
 * (V9) EL TROZO DE LA INSIGNIA QUE ES DE CADA SITIO. La insignia de una colección está partida en tantos trozos como sitios y cada trozo es siempre su sitio, en el orden de `sitios` de la colección
 * (`piezaDeInsignia`: la misma forma que dibuja `dibujos/Insignia.tsx`). Esta función saca, por muestreo de esa misma regla, el recorte (un polígono convexo en tanto por uno del cuadrado de la insignia)
 * y el centro de cada trozo: sirve para enseñarlo pequeño en la esquina de la tarjeta de su sitio y para iluminarlo en la insignia grande. Pura (sin React) para poder probarla.
 */
export interface Trozo {
  /** Los puntos del recorte, de 0 a 1 dentro del cuadrado de la insignia. */
  puntos: [number, number][]
  /** El centro del trozo, de 0 a 1. */
  centro: [number, number]
}

const cruz = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

/** El casco convexo (cadena monótona) de un montón de puntos. */
export function cascoConvexo(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (p.length < 3) return p
  const bajo: [number, number][] = []
  for (const q of p) {
    while (bajo.length >= 2 && cruz(bajo[bajo.length - 2]!, bajo[bajo.length - 1]!, q) <= 0) bajo.pop()
    bajo.push(q)
  }
  const alto: [number, number][] = []
  for (const q of [...p].reverse()) {
    while (alto.length >= 2 && cruz(alto[alto.length - 2]!, alto[alto.length - 1]!, q) <= 0) alto.pop()
    alto.push(q)
  }
  return [...bajo.slice(0, -1), ...alto.slice(0, -1)]
}

/** El trozo `k` de una colección con `total` sitios (o null si nunca cae ahí ningún toque). */
export function trozoDeInsignia(coleccion: string, total: number, k: number): Trozo | null {
  const paso = 1 / 40
  const dentro: [number, number][] = []
  for (let i = 0; i <= 40; i++) {
    for (let j = 0; j <= 40; j++) {
      const x = i * paso
      const y = j * paso
      if (piezaDeInsignia(coleccion, total, x, y) === k) dentro.push([x, y])
    }
  }
  if (dentro.length === 0) return null
  // Los bordes del muestreo se estiran medio paso para que el recorte no deje un hilo sin pintar entre trozos vecinos.
  const mitad = paso / 2
  const ampliados: [number, number][] = dentro.flatMap(([x, y]) => [[x - mitad, y - mitad], [x + mitad, y - mitad], [x - mitad, y + mitad], [x + mitad, y + mitad]] as [number, number][])
  const casco = cascoConvexo(ampliados).map(([x, y]) => [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))] as [number, number])
  const cx = dentro.reduce((s, p) => s + p[0], 0) / dentro.length
  const cy = dentro.reduce((s, p) => s + p[1], 0) / dentro.length
  return { puntos: casco, centro: [cx, cy] }
}

/** `clip-path` de un trozo para una insignia de `tam` px de lado. */
export const recorteDeTrozo = (t: Trozo, tam: number): string => `polygon(${t.puntos.map(([x, y]) => `${(x * tam).toFixed(1)}px ${(y * tam).toFixed(1)}px`).join(',')})`
