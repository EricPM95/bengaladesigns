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

/* ───────── (V28) El trozo ENTERO en su círculo ───────── */

import { COLECCIONES_POR_PARTES } from '../../dibujos/partes'
import { poligonoDelTrozo } from '../../dibujos/piezas/InsigniaPorPartes'

export interface TrozoEntero {
  /** El polígono exacto del trozo, de 0 a 1 dentro del cuadrado de la insignia. */
  puntos: [number, number][]
  /** Su caja (de 0 a 1). */
  caja: { x0: number; y0: number; x1: number; y1: number }
}

/**
 * El trozo `k` de la colección con su forma exacta (la baldosa que pinta la insignia, no un recorte aproximado). Una colección de una sola pieza (sin trozos) devuelve el círculo del centro de la insignia, con su icono.
 */
export function trozoEntero(coleccion: string, total: number, k: number): TrozoEntero | null {
  const col = COLECCIONES_POR_PARTES[coleccion]?.col
  const poli = total > 1 && col ? poligonoDelTrozo(col, k) : null
  const puntos: [number, number][] = poli ? poli.map(([x, y]) => [x / 200, y / 200]) : Array.from({ length: 36 }, (_, i) => [0.5 + Math.cos((i * 2 * Math.PI) / 36) * 0.17, 0.5 + Math.sin((i * 2 * Math.PI) / 36) * 0.17] as [number, number])
  if (puntos.length === 0) return null
  const xs = puntos.map((p) => p[0])
  const ys = puntos.map((p) => p[1])
  return { puntos, caja: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) } }
}

/**
 * Cómo poner el trozo entero en un círculo de `diametro` px, centrado y a escala para que quepa con margen (`margen`: 0,8 = deja un 10 % libre por cada lado). Devuelve el lado (px) al que dibujar la insignia entera,
 * dónde ponerla (`left`/`top`, relativos al círculo) y el `clip-path` del trozo para ese lado.
 */
export function encajeEnCirculo(t: TrozoEntero, diametro: number, margen = 0.8): { lado: number; left: number; top: number; clip: string } {
  const w = t.caja.x1 - t.caja.x0
  const h = t.caja.y1 - t.caja.y0
  // Centrado en el centro de su caja; la escala la manda el punto del trozo que MÁS se aleja de ese centro (así cabe entero seguro).
  const cx = (t.caja.x0 + t.caja.x1) / 2
  const cy = (t.caja.y0 + t.caja.y1) / 2
  const radio = Math.max(...t.puntos.map(([x, y]) => Math.hypot(x - cx, y - cy)), 0.0001)
  const lado = (diametro * margen) / 2 / radio
  void w
  void h
  return { lado, left: diametro / 2 - cx * lado, top: diametro / 2 - cy * lado, clip: `polygon(${t.puntos.map(([x, y]) => `${(x * lado).toFixed(1)}px ${(y * lado).toFixed(1)}px`).join(',')})` }
}
