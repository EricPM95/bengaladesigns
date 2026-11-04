/**
 * La insignia de una colección PINTADA y partida en gajos (Tanda LZ3; «Piezas/Insignia Lanza Pro» de Design), para CUALQUIER destino:
 * vale para cualquier imagen con N gajos alrededor de un centro. Gajo ganado = en color; gajo que falta = en gris; completa = toda en color.
 * Cada gajo es un sitio: `on[j]` dice si el gajo j (el j-ésimo desde `a0`, en sentido horario) está ganado.
 * Para meter otra imagen (p. ej. las de Roma, cuando Eric las cambie) basta una entrada nueva en `GAJOS_DE_COLECCION` (`gajosColecciones.ts`):
 * la imagen, su tamaño, el centro, el número de gajos y el ángulo donde empieza el primero.
 * `animada`: el mismo brillo y movimiento que las insignias de Roma (barrido de luz sobre lo ganado y, si está completa, el halo que respira).
 */
import type { CSSProperties } from 'react'
import './dibujos.css'

export interface GeometriaDeGajos {
  /** Ruta pública de la imagen (WebP o PNG). */
  imagen: string
  /** Ancho y alto de la imagen, en píxeles. */
  iw: number
  ih: number
  /** Centro de los gajos, en píxeles de la imagen. */
  cx: number
  cy: number
  /** Número de gajos. */
  n: number
  /** Ángulo (grados, 0 = derecha, sentido horario) donde empieza el gajo 0. */
  a0: number
  /** (LZ3b) Para una imagen cuyos gajos NO son iguales: los ángulos donde empieza cada gajo (en sentido horario; el último acaba donde empieza el primero). Si está, manda sobre `n` y `a0`. */
  cortes?: number[]
}

const pc = (v: number, total: number) => ((v / total) * 100).toFixed(2) + '%'

/** El recorte (clip-path) del gajo j. */
export function recorteDeGajo(g: GeometriaDeGajos, j: number): string {
  const c = g.cortes
  const st = 360 / g.n
  const ang0 = c ? c[j] : g.a0 + j * st
  let ang1 = c ? c[(j + 1) % c.length] : g.a0 + (j + 1) * st
  if (c && ang1 <= ang0) ang1 += 360
  const A = (ang0 * Math.PI) / 180
  const B = (ang1 * Math.PI) / 180
  const pts: [number, number][] = [[g.cx, g.cy]]
  const pasos = 6
  for (let q = 0; q <= pasos; q++) {
    const t = A + ((B - A) * q) / pasos
    pts.push([g.cx + Math.cos(t) * 400, g.cy + Math.sin(t) * 400])
  }
  return 'polygon(' + pts.map(([x, y]) => pc(x, g.iw) + ' ' + pc(y, g.ih)).join(',') + ')'
}

/** Alto y ancho (en píxeles) con que sale la imagen para un `tam` (el lado mayor). */
export function medidasDeGajos(g: GeometriaDeGajos, tam: number): { w: number; h: number } {
  const sc = tam / Math.max(g.iw, g.ih)
  return { w: Math.round(g.iw * sc), h: Math.round(g.ih * sc) }
}

export function InsigniaGajos({ geo, on, tam = 150, animada = false, completa: completaForzada }: { geo: GeometriaDeGajos; on: boolean[]; tam?: number; animada?: boolean; completa?: boolean }) {
  const { w, h } = medidasDeGajos(geo, tam)
  const lit = on.map((x, j) => (x && j < geo.n ? j : -1)).filter((j) => j >= 0)
  // (LZ3b) Una colección con más sitios que gajos dibujados (Pueblos con alma: 5 sitios y 4 trozos) solo está completa cuando están todos sus sitios.
  const completa = completaForzada ?? lit.length >= geo.n
  const base: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }
  const mascara: CSSProperties = { WebkitMaskImage: `url(${geo.imagen})`, maskImage: `url(${geo.imagen})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }
  return (
    <span className={animada ? 'dib-mov' : 'dib-quieto'} data-gajos={geo.n} data-ganados={lit.length} style={{ display: 'inline-block', width: tam, height: tam, flex: 'none' }}>
      <span style={{ position: 'relative', display: 'block', width: w, height: h, margin: `${(tam - h) / 2}px ${(tam - w) / 2}px` }}>
        {completa && animada && <span style={{ position: 'absolute', inset: '8%', borderRadius: '50%', background: 'radial-gradient(circle,oklch(0.86 0.09 85 / .45),transparent 70%)', animation: 'dibGlow 3.6s ease-in-out infinite' }} />}
        <img src={geo.imagen} alt="" draggable={false} style={{ ...base, ...(completa ? {} : { filter: 'grayscale(1) brightness(1.18) contrast(.8)', opacity: 0.88 }) }} />
        {completa ? (
          <img src={geo.imagen} alt="" draggable={false} data-gajo="todo" style={base} />
        ) : (
          <>
            {lit.map((j) => (
              <img key={j} src={geo.imagen} alt="" draggable={false} data-gajo={j} style={{ ...base, clipPath: recorteDeGajo(geo, j) }} />
            ))}
            {lit.length > 0 && <img src={geo.imagen} alt="" draggable={false} data-gajo="centro" style={{ ...base, clipPath: `circle(${((40 / geo.iw) * 100).toFixed(1)}% at ${pc(geo.cx, geo.iw)} ${pc(geo.cy, geo.ih)})` }} />}
          </>
        )}
        {animada && lit.length > 0 && (
          <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...mascara }}>
            <span style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '26%', background: 'linear-gradient(90deg,transparent,rgba(255,248,220,.5),transparent)', animation: 'dibShine 4.4s 1.2s ease-in-out infinite' }} />
          </span>
        )}
      </span>
    </span>
  )
}
