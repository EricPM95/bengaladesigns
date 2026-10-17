import type { ReactNode } from 'react'
import { G, GF, Polvo, Trazo, type ConfigEscena } from './cine'

/** Panteón · el óculo: la cúpula se dibuja anillo a anillo y entra el rayo de luz. */
const R = [62, 104, 152, 208, 272, 346]
const circulo = (r: number) => `M${195 + r} 300a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0`

function Arte(): ReactNode {
  return (
    <>
      <defs>
        <radialGradient id="pd" cx="195" cy="300" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#7A5E38" /><stop offset=".3" stopColor="#3E2E1C" /><stop offset="1" stopColor="#110C07" /></radialGradient>
        <linearGradient id="pb" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FFF3D6" stopOpacity=".85" /><stop offset="1" stopColor="#FFF3D6" stopOpacity="0" /></linearGradient>
        <filter id="pf" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
      <circle cx="195" cy="300" r="420" fill="url(#pd)" style={{ opacity: 0, animation: 'ecFade 2.2s .3s ease both' }} />
      {R.slice(0, 5).map((r, i) => (
        <g key={r}>
          <Trazo d={circulo(r)} dl={0.5 + i * 0.42} l={1.3} w={1.2} c={GF} />
          {Array.from({ length: 28 }, (_, c) => {
            const a = ((c + 0.5) * 2 * Math.PI) / 28
            const r1 = r + (R[i + 1] - r) * 0.5
            return <circle key={c} cx={195 + r1 * Math.cos(a)} cy={300 + r1 * Math.sin(a)} r={3 + i} fill="#0E0905" stroke={G} strokeWidth=".8" style={{ opacity: 0, animation: `ecFade .6s ${(0.9 + i * 0.42 + c * 0.02).toFixed(2)}s ease both` }} />
          })}
        </g>
      ))}
      <Trazo d={circulo(346)} dl={2.6} l={1.4} w={1.4} c={GF} />
      <Trazo d="M241 300a46 46 0 1 0 -92 0a46 46 0 1 0 92 0" dl={0.3} l={1} w={2.6} />
      <g style={{ opacity: 0, animation: 'ecFade 1.8s 2.6s ease both' }}>
        <polygon points="183,300 207,300 300,10 90,10" fill="url(#pb)" />
        <ellipse cx="195" cy="64" rx="56" ry="26" fill="#FFF6DE" opacity=".75" filter="url(#pf)" />
      </g>
      <Polvo n={18} x0={150} ancho={90} y0={40} alto={240} dl={2.8} />
      <circle cx="195" cy="300" r="44" fill="#FFFDF5" style={{ opacity: 0, animation: 'ecFade 1s 5s ease both, ecTw 1.6s 5s ease-in-out 3' }} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: '#110C07',
  frases: [{ t: 'Mira hacia arriba…', d: 1, l: 3 }, { t: 'La luz entra por el óculo desde hace casi 2.000 años.', d: 4.2, l: 2.8 }],
  y: 760,
  orbe: { x: 0, y: -260 },
  Arte,
}
export default config
