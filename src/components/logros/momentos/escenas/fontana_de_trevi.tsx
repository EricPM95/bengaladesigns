import type { CSSProperties, ReactNode } from 'react'
import { svgAbs, type ConfigEscena } from './cine'

/** Fontana de Trevi · la moneda («Emblema Cine», E2): bajo el agua, mirando hacia arriba, con rayos y burbujas. Una moneda rompe la superficie, baja girando con su estela y se queda brillando. */
const s = (n: number) => `${n.toFixed(2)}s`

// La moneda baja por una curva (dos tramos de Bézier) y las gotas de la estela se reparten a lo largo de ella.
const TRAMO1: [number, number][] = [[200, 104], [140, 160], [250, 200], [175, 240]]
const TRAMO2: [number, number][] = [[175, 240], [150, 280], [200, 285], [195, 300]]
const bez = (A: [number, number][], v: number): [number, number] => {
  const m = 1 - v
  return [m * m * m * A[0][0] + 3 * m * m * v * A[1][0] + 3 * m * v * v * A[2][0] + v * v * v * A[3][0], m * m * m * A[0][1] + 3 * m * m * v * A[1][1] + 3 * m * v * v * A[2][1] + v * v * v * A[3][1]]
}
const pt = (t: number) => (t < 0.5 ? bez(TRAMO1, t * 2) : bez(TRAMO2, (t - 0.5) * 2))

const caus = [0, 1, 2, 3, 4].map((k) => {
  const y = 40 + k * 26
  let d = `M-30 ${y}`
  for (let x = -30; x < 430; x += 36) d += ` q 18 ${k % 2 ? -9 : 9} 36 0`
  return { p: d, l: 3 + k * 0.5, d: k * 0.3 }
})
const rays = [[110, 40], [170, 30], [235, 36], [300, 44], [60, 52]].map(([x, w], k) => ({ p: `${x - w / 2},90 ${x + w / 2},90 ${x + w * 2.6 + 40},860 ${x - w * 2.6 + 40},860`, o: `${x}px 90px`, l: 5 + k * 0.8, d: k * 0.4 }))
const floor = [[40, 806], [92, 816], [150, 800], [210, 812], [262, 804], [318, 814], [356, 800], [120, 830], [290, 832]].map(([x, y], k) => ({ x, y, l: 2 + (k % 3), d: (k % 4) * 0.5 }))
const bub = Array.from({ length: 14 }, (_, k) => ({ x: 20 + ((k * 61) % 350), y: 760 + ((k * 37) % 70), s: 3 + (k % 4) * 2, l: 5 + (k % 5), d: (k % 7) * 0.6 }))
const trail = Array.from({ length: 10 }, (_, k) => {
  const t = (k + 1) / 11
  const [x, y] = pt(t)
  return { x: Math.round(x + (k % 2 ? 6 : -6)), y: Math.round(y), s: 3 + (k % 3), d: 3.4 + t * 3.4 }
})
const spl = Array.from({ length: 12 }, (_, k) => {
  const a = (k / 12) * Math.PI * 2
  return { x: Math.round(Math.cos(a) * (26 + (k % 3) * 12)), y: Math.round(Math.sin(a) * (18 + (k % 3) * 10) + 20), s: 3 + (k % 3), d: 3.4 + (k % 3) * 0.04 }
})

function Arte({ u }: { u: string }): ReactNode {
  return (
    <>
      <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
        <defs>
          <radialGradient id={`${u}sw`} cx=".5" cy="0" r=".9"><stop offset="0" stopColor="#E8FFFB" stopOpacity=".95" /><stop offset=".45" stopColor="#9FE6E6" stopOpacity=".4" /><stop offset="1" stopColor="#9FE6E6" stopOpacity="0" /></radialGradient>
          <linearGradient id={`${u}ry`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2FFFC" stopOpacity=".55" /><stop offset="1" stopColor="#F2FFFC" stopOpacity="0" /></linearGradient>
          <filter id={`${u}bl`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id={`${u}bs`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" /></filter>
        </defs>
        <ellipse cx="195" cy="20" rx="260" ry="190" fill={`url(#${u}sw)`} style={{ animation: 'ecFade 1.6s .1s ease both' }} />
        <g fill="none" stroke="rgba(235,255,252,.55)" strokeWidth="1.4" filter={`url(#${u}bs)`} style={{ opacity: 0, animation: 'ecFade 1.4s .3s ease both' }}>
          {caus.map((c, i) => (
            <path key={i} d={c.p} style={{ animation: `ecWave ${s(c.l)} ${s(c.d)} ease-in-out infinite` }} />
          ))}
        </g>
        <g filter={`url(#${u}bl)`} style={{ opacity: 0, animation: 'ecFade 2s .6s ease both' }}>
          {rays.map((r, i) => (
            <g key={i} style={{ transformOrigin: r.o, animation: `ecRay ${s(r.l)} ${s(r.d)} ease-in-out infinite` }}>
              <polygon points={r.p} fill={`url(#${u}ry)`} />
            </g>
          ))}
        </g>
        <path d="M-20 790c60-26 120-30 180-14s120 18 250-10V860H-20z" fill="#0A3442" style={{ opacity: 0, animation: 'ecFade 1.6s .8s ease both' }} />
        <path d="M-20 812c80-16 150-10 220 2s120 6 210-8V860H-20z" fill="#072A36" style={{ opacity: 0, animation: 'ecFade 1.6s .9s ease both' }} />
        {floor.map((c, i) => (
          <ellipse key={i} cx={c.x} cy={c.y} rx="5" ry="1.8" fill="#E8C774" style={{ animation: `ecTw ${s(c.l)} ${s(c.d)} ease-in-out infinite` }} />
        ))}
        <g fill="none" stroke="rgba(240,255,252,.9)" strokeWidth="1.6">
          {[0, 1, 2].map((k) => (
            <ellipse key={k} cx="200" cy="104" rx="70" ry="10" style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0, animation: `ecRip 1.5s ${s(3.35 + k * 0.3)} ease-out both` }} />
          ))}
        </g>
        <circle cx="195" cy="300" r="80" fill="#FFE7A8" filter={`url(#${u}bl)`} style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0, animation: 'ecGlowUp 1.5s 7s ease-in both' }} />
      </svg>
      {bub.map((b, i) => (
        <span key={'b' + i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.s, height: b.s, borderRadius: '50%', border: '1px solid rgba(235,255,252,.75)', background: 'radial-gradient(circle at 35% 30%,rgba(255,255,255,.7),rgba(255,255,255,.05) 60%)', opacity: 0, animation: `ecBub ${s(b.l)} ${s(b.d)} ease-in infinite` }} />
      ))}
      {trail.map((b, i) => (
        <span key={'t' + i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.s, height: b.s, borderRadius: '50%', border: '1px solid rgba(235,255,252,.85)', opacity: 0, animation: `ecTrail 1.6s ${s(b.d)} ease-out both` }} />
      ))}
      {spl.map((p, i) => (
        <span key={'s' + i} style={{ position: 'absolute', left: 198, top: 104, width: p.s, height: p.s, borderRadius: '50%', border: '1px solid rgba(240,255,252,.9)', ['--dx' as string]: `${p.x}px`, ['--dy' as string]: `${p.y}px`, opacity: 0, animation: `ecSpl 1s ${s(p.d)} cubic-bezier(.2,.7,.4,1) both` } as CSSProperties} />
      ))}
      <span style={{ position: 'absolute', inset: 0, animation: 'ecOut .5s 8.45s ease both', pointerEvents: 'none' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, width: 30, height: 30, margin: '-15px 0 0 -15px', offsetPath: "path('M200 104 C 140 160 250 200 175 240 S 200 285 195 300')", offsetRotate: '0deg', opacity: 0, animation: 'ecSink 3.6s 3.4s cubic-bezier(.25,.6,.35,1) both' }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#FFF6D2,#E2B65A 55%,#8C6420)', boxShadow: '0 0 16px rgba(255,214,130,.9)', animation: 'ecFlip .7s 3.4s linear 5, ecBeat .55s 7.1s ease-in-out 3' }} />
        </span>
      </span>
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'linear-gradient(180deg,#5FC6CF 0%,#1F8A9A 20%,#0F5466 52%,#06283A 100%)',
  frases: [{ t: 'De espaldas, con la mano derecha…', d: 1, l: 2.8 }, { t: '…y Roma te espera de vuelta.', d: 4.3, l: 3 }],
  y: 560,
  dim: 8.1,
  fl: 8.45,
  x: [9.9, 10.15, 10.4, 10.8],
  halo: 'rgba(160,240,245,.5)',
  anillo: '#BFF3F4',
  Arte,
}
export default config
