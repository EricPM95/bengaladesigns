import type { ResumenDeExp } from './api'

/** 1240 → «1.240» (con punto desde los 4 cifras, como en el diseño; `toLocaleString('es-ES')` no agrupa los de 4 cifras). */
export const miles = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** «Nivel 8 · Explorador»; en la Leyenda, con sus estrellas: «Leyenda ★3». */
export function textoDeNivel(e: Pick<ResumenDeExp, 'nivel' | 'rango' | 'leyenda_estrellas'>): string {
  return e.leyenda_estrellas > 0 ? `${e.rango} ★${e.leyenda_estrellas}` : `Nivel ${e.nivel} · ${e.rango}`
}

/** ¿El móvil tiene puesto «reducir movimiento»? Entonces las animaciones salen ya puestas, sin moverse. */
export function movimientoReducido(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

export const suave = (k: number): number => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)
export const entre = (x: number, a: number, b: number): number => Math.max(0, Math.min(1, (x - a) / (b - a)))
