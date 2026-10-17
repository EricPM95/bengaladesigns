import type { CSSProperties, ReactNode } from 'react'

/**
 * Los fuegos artificiales de las maravillas del mundo (Tanda 8B). SOLO se usan en las maravillas: la película del Coliseo y «El final de las 7 maravillas» (esta tiene los suyos en FinalSieteMaravillas.tsx).
 * Puro CSS: cada estallido es una estela, un fogonazo y unas chispas que salen en círculo (las claves de animación están en `momentos.css`).
 * Posiciones en % de la pantalla; `desde` es el segundo en que empieza el primero.
 */
const rnd = (k: number) => {
  const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}
const COL = ['#F3D59A', '#FFFFFF', '#F2B45A']

// [x%, y%, radio, chispas, segundo]
const ESTALLIDOS: [number, number, number, number, number][] = [
  [26, 22, 80, 16, 0],
  [74, 19, 100, 18, 0.6],
  [18, 13, 120, 22, 1.0],
  [80, 12, 130, 22, 1.25],
  [50, 30, 440, 46, 1.55],
]

export function Fuegos({ desde = 0, grandes = true }: { desde?: number; grandes?: boolean }): ReactNode {
  const lista = grandes ? ESTALLIDOS : ESTALLIDOS.slice(0, 4)
  return (
    <div aria-hidden className="mo-con-mov" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {lista.map(([x, y, radio, n, t], b) => {
        const grande = b === 4
        const cs = grande ? 230 : 110
        const d = `${(desde + t).toFixed(2)}s`
        const td = `${(desde + t - 0.55).toFixed(2)}s`
        return (
          <span key={b} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}>
            <span style={{ position: 'absolute', left: -1.5, top: 0, width: 3, height: `${Math.round(y * 6)}px`, background: 'linear-gradient(180deg,#FFF3D0,transparent)', transformOrigin: '50% 0', opacity: 0, animation: `mcTrail .6s ${td} ease-out both` }} />
            <span style={{ position: 'absolute', left: -cs / 2, top: -cs / 2, width: cs, height: cs, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF,rgba(255,226,160,.6) 35%,transparent 70%)', opacity: 0, animation: `moFwCore .9s ${d} ease-out both` }} />
            {Array.from({ length: n }, (_, j) => {
              const a = (j / n) * Math.PI * 2 + rnd(b * 50 + j) * 0.2
              const dist = radio * (0.7 + rnd(b * 90 + j) * 0.35)
              const s = grande ? 6 : 4 + (j % 2)
              const c = COL[(j + b) % 3]
              const estilo = { position: 'absolute', left: -s / 2, top: -s / 2, width: s, height: s, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}`, ['--dx' as string]: `${Math.cos(a) * dist}px`, ['--dy' as string]: `${Math.sin(a) * dist}px`, opacity: 0, animation: `moFw ${((grande ? 1.9 : 1.4) + rnd(j + b) * 0.3).toFixed(2)}s ${d} cubic-bezier(.15,.7,.3,1) both` } as CSSProperties
              return <span key={j} style={estilo} />
            })}
          </span>
        )
      })}
    </div>
  )
}

/** Brillitos de cuatro puntas que caen despacio (el «confeti» dorado del final). */
export function Destellos({ desde = 0, n = 30 }: { desde?: number; n?: number }): ReactNode {
  return (
    <div aria-hidden className="mo-con-mov" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: n }, (_, i) => {
        const s = 5 + Math.round(rnd(i) * 5)
        const estilo = { position: 'absolute', left: `${5 + rnd(i * 3 + 1) * 90}%`, top: `${10 + rnd(i * 7 + 2) * 38}%`, width: s, height: s, background: i % 3 ? '#F3D59A' : '#FFF3D0', clipPath: 'polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)', ['--dx' as string]: `${(rnd(i + 9) - 0.5) * 70}px`, ['--dy' as string]: `${380 + rnd(i + 4) * 300}px`, opacity: 0, animation: `moGlit ${(3 + rnd(i + 5) * 1.5).toFixed(2)}s ${(desde + rnd(i + 11) * 0.9).toFixed(2)}s cubic-bezier(.3,.1,.6,1) both` } as CSSProperties
        return <span key={i} style={estilo} />
      })}
    </div>
  )
}
