import type { ReactNode } from 'react'
import { CapaComun, D, GF, svgAbs, type ConfigEscena, type PuntoD, type TrazoD } from './cine'

/** Panteón · el óculo («Emblema Cine», E1): la cúpula se dibuja anillo a anillo, entra el rayo de luz por el óculo con polvo flotando, el óculo late tres veces. */
const R = [62, 104, 152, 208, 272, 346]
const N = 28
const P = (r: number, a: number) => `${(195 + r * Math.cos(a)).toFixed(1)} ${(300 + r * Math.sin(a)).toFixed(1)}`

function construir() {
  const draw: TrazoD[] = []
  const cells: { d: string; dl: number }[] = []
  for (let i = 0; i < 5; i++) {
    const ra = R[i]
    const rb = R[i + 1]
    const dr = rb - ra
    let out = ''
    let inn = ''
    for (let c = 0; c < N; c++) {
      const a0 = ((c + 0.14) * 2 * Math.PI) / N
      const a1 = ((c + 0.86) * 2 * Math.PI) / N
      const am = (a0 + a1) / 2
      const da = (a1 - a0) / 2
      const r0 = ra + dr * 0.12
      const r1 = rb - dr * 0.12
      const q = (f1: number, f2: number) => `M${P(r0 + (r1 - r0) * f1, am - da * f2)}L${P(r1 - (r1 - r0) * f1, am - da * f2)}L${P(r1 - (r1 - r0) * f1, am + da * f2)}L${P(r0 + (r1 - r0) * f1, am + da * f2)}Z`
      out += q(0, 1)
      inn += q(0.3, 0.55)
    }
    draw.push(
      D(`M${195 + ra} 300a${ra} ${ra} 0 1 0 ${-2 * ra} 0a${ra} ${ra} 0 1 0 ${2 * ra} 0`, 0.5 + i * 0.42, 1.3, 1.2, GF),
      D(out, 0.7 + i * 0.42, 1.5, 1.3),
      D(inn, 1 + i * 0.42, 1.3, 0.9, GF),
    )
    cells.push({ d: inn, dl: 1.4 + i * 0.42 })
  }
  draw.push(D(`M${195 + 346} 300a346 346 0 1 0 -692 0a346 346 0 1 0 692 0`, 2.6, 1.4, 1.4, GF), D('M241 300a46 46 0 1 0 -92 0a46 46 0 1 0 92 0', 0.3, 1, 2.6))
  const dust = Array.from({ length: 18 }, (_, k) => ({ x: 150 + ((k * 37) % 90), y: 40 + ((k * 71) % 240), r: 1 + (k % 3) * 0.7, l: 3 + (k % 4), d: (k % 5) * 0.5 }))
  return { draw, cells, dust }
}
const DATOS = construir()

function Arte({ u }: { u: string }): ReactNode {
  const { draw, cells, dust } = DATOS
  const dots: PuntoD[] = []
  return (
    <>
      <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
        <defs>
          <radialGradient id={`${u}pd`} cx="195" cy="300" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#7A5E38" /><stop offset=".3" stopColor="#3E2E1C" /><stop offset="1" stopColor="#110C07" /></radialGradient>
          <linearGradient id={`${u}pb`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FFF3D6" stopOpacity=".85" /><stop offset="1" stopColor="#FFF3D6" stopOpacity="0" /></linearGradient>
          <filter id={`${u}pf`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
          <filter id={`${u}pf2`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="26" /></filter>
        </defs>
        <circle cx="195" cy="300" r="420" fill={`url(#${u}pd)`} style={{ opacity: 0, animation: 'ecFade 2.2s .3s ease both' }} />
        {cells.map((c, i) => (
          <path key={i} d={c.d} fill="#0E0905" style={{ opacity: 0, animation: `ecFadeTo 1s ${c.dl.toFixed(2)}s ease both` }} />
        ))}
        <g style={{ transformOrigin: '195px 300px', animation: 'ecOrbit 16s 2.6s linear infinite' }}>
          <g style={{ opacity: 0, animation: 'ecFade 1.8s 2.6s ease both' }}>
            <polygon points="183,300 207,300 300,10 90,10" fill={`url(#${u}pb)`} />
            <ellipse cx="195" cy="64" rx="110" ry="54" fill="#FFE7B0" opacity=".55" filter={`url(#${u}pf2)`} />
            <ellipse cx="195" cy="64" rx="56" ry="26" fill="#FFF6DE" opacity=".75" filter={`url(#${u}pf)`} />
            {dust.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#FFF3D6" style={{ animation: `ecDust2 ${d.l}s ${d.d}s ease-in-out infinite` }} />
            ))}
          </g>
        </g>
        <circle cx="195" cy="300" r="96" fill="#FFF3D6" filter={`url(#${u}pf2)`} style={{ opacity: 0, animation: 'ecFade 1s .4s ease both, ecPulse 2.6s 1.6s ease-in-out infinite' }} />
        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'ecBeat .45s 5s ease-in-out 3' }}>
          <circle cx="195" cy="300" r="44" fill="#FFFDF5" style={{ opacity: 0, animation: 'ecFade .8s .4s ease both' }} />
        </g>
      </svg>
      <span style={{ position: 'absolute', left: -5, top: 100, width: 400, height: 400, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(255,240,200,.2) 0 3deg,transparent 3deg 12deg)', WebkitMaskImage: 'radial-gradient(circle,#000 14%,transparent 60%)', maskImage: 'radial-gradient(circle,#000 14%,transparent 60%)', opacity: 0, animation: 'ecFade 1.4s 1.4s ease both, ecOrbit 40s 1.4s linear infinite' }} />
      <CapaComun draw={draw} dots={dots} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: '#110C07',
  frases: [{ t: 'Mira hacia arriba…', d: 1, l: 3 }, { t: 'La luz entra por el óculo desde hace casi 2.000 años.', d: 4.2, l: 2.8 }],
  y: 760,
  orbe: { x: 0, y: 0 },
  orbeD: 6.6,
  orbeL: 1.3,
  Arte,
}
export default config
