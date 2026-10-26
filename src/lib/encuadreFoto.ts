import type { CSSProperties } from 'react'

/**
 * EL ENCUADRE DE LA FOTO DEL PERFIL (Tanda 10N3, §3b.4). La foto guardada es la entera (no se recorta); lo que se ajusta es qué parte se ve dentro del círculo:
 *   x, y   el CENTRO de lo que se ve, sobre la foto entera (0 a 1; 0,5 / 0,5 = el centro);
 *   zoom   1 = la foto justa para llenar el círculo (como `object-fit: cover`); 4 = cuatro veces más cerca.
 * Se guarda junto a la foto (travelers.foto_encuadre, migración 0044) y TODOS los sitios donde sale la foto lo aplican con el mismo componente (`FotoEncuadrada`).
 */
export interface Encuadre {
  x: number
  y: number
  zoom: number
}

export const ZOOM_MAXIMO = 4
export const ENCUADRE_CENTRADO: Encuadre = { x: 0.5, y: 0.5, zoom: 1 }

const numero = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Lo que llega de la nube o del móvil, validado: un encuadre bueno o null. */
export function leerEncuadre(valor: unknown): Encuadre | null {
  let v = valor
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v)
    } catch {
      return null
    }
  }
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const x = numero(o.x)
  const y = numero(o.y)
  const zoom = numero(o.zoom)
  if (x === null || y === null || zoom === null) return null
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)), zoom: Math.min(ZOOM_MAXIMO, Math.max(1, zoom)) }
}

/** ¿Es el encuadre de siempre (centrado y sin acercar)? Entonces no hace falta guardar nada. */
export const esCentrado = (e: Encuadre | null | undefined): boolean => !e || (Math.abs(e.x - 0.5) < 0.002 && Math.abs(e.y - 0.5) < 0.002 && Math.abs(e.zoom - 1) < 0.002)

/** Qué parte de la foto (como fracción de su ancho y de su alto) llena el círculo con `zoom` 1. `aspecto` = ancho / alto de la foto. */
export function parteVisible(aspecto: number, zoom: number): { vw: number; vh: number } {
  const a = aspecto > 0 && Number.isFinite(aspecto) ? aspecto : 1
  const vw = (a >= 1 ? 1 / a : 1) / zoom
  const vh = (a >= 1 ? 1 : a) / zoom
  return { vw, vh }
}

/** Mantiene el encuadre dentro de la foto: el círculo nunca enseña fuera de ella. */
export function limitarEncuadre(e: Encuadre, aspecto: number): Encuadre {
  const zoom = Math.min(ZOOM_MAXIMO, Math.max(1, e.zoom))
  const { vw, vh } = parteVisible(aspecto, zoom)
  return { x: Math.min(1 - vw / 2, Math.max(vw / 2, e.x)), y: Math.min(1 - vh / 2, Math.max(vh / 2, e.y)), zoom }
}

/** El estilo de la imagen dentro de su círculo (un cuadrado `position: relative; overflow: hidden`): todo en porcentajes del círculo, así vale a cualquier tamaño. */
export function estiloDeEncuadre(e: Encuadre, aspecto: number): CSSProperties {
  const l = limitarEncuadre(e, aspecto)
  const { vw } = parteVisible(aspecto, l.zoom)
  const ancho = 100 / vw
  const alto = ancho / (aspecto > 0 ? aspecto : 1)
  return { position: 'absolute', maxWidth: 'none', width: `${ancho}%`, height: `${alto}%`, left: `${50 - l.x * ancho}%`, top: `${50 - l.y * alto}%`, pointerEvents: 'none', userSelect: 'none' }
}

/** Dos encuadres iguales (para saber si hay algo que guardar). */
export const mismoEncuadre = (a: Encuadre | null | undefined, b: Encuadre | null | undefined): boolean => {
  const x = a ?? ENCUADRE_CENTRADO
  const y = b ?? ENCUADRE_CENTRADO
  return Math.abs(x.x - y.x) < 0.002 && Math.abs(x.y - y.y) < 0.002 && Math.abs(x.zoom - y.zoom) < 0.002
}
