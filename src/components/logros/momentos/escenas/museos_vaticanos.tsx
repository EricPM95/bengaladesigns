import type { ReactNode } from 'react'
import { G, GF, Trazo, type ConfigEscena } from './cine'

/** Museos Vaticanos · la Creación: la bóveda de la Sixtina se dibuja panel a panel y dos manos casi se tocan. */
const COLORES = ['#5B4A3A', '#6A5844', '#4F4A5E', '#7A6246', '#58503F', '#6B4F4A']
function Arte(): ReactNode {
  const paneles = Array.from({ length: 12 }, (_, i) => ({ x: 22 + (i % 3) * 120, y: 70 + Math.floor(i / 3) * 150, c: COLORES[i % 6] }))
  return (
    <>
      <defs>
        <filter id="mf" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      {paneles.map((p, i) => (
        <g key={i}>
          <Trazo d={`M${p.x} ${p.y}h108v132h-108z`} dl={0.4 + i * 0.22} l={1} w={1.6} c={GF} />
          <rect x={p.x + 2} y={p.y + 2} width="104" height="128" rx="6" fill={p.c} style={{ opacity: 0, animation: `ecFade 1.2s ${(1.2 + i * 0.22).toFixed(2)}s ease both` }} />
        </g>
      ))}
      <g transform="translate(75 216) scale(4)" fill="none" stroke="#F3D59A" strokeLinecap="round" strokeLinejoin="round">
        <g style={{ opacity: 0, animation: 'ecFade 1s 4.2s ease both' }}>
          <path d="M-2 29h10c3 0 6-1 9-2.5L27 21M13 28c1 2.5 4 3.5 7 2.5M17 26.5l2.2 2.2" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
        </g>
        <g style={{ opacity: 0, animation: 'ecFade 1s 4.2s ease both' }}>
          <path d="M62 13H52c-3 0-6 1-9 2.5L33 21M47 14c-1-2.5-4-3.5-7-2.5M43 15.5l-2.2-2.2" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
        </g>
      </g>
      <circle cx="195" cy="300" r="34" fill="#FFF4D6" filter="url(#mf)" style={{ opacity: 0, animation: 'ecFade .8s 5.6s ease both, ecTw 1s 5.6s ease-in-out 3' }} />
      <circle cx="195" cy="300" r="5" fill="#FFFFFF" style={{ opacity: 0, animation: 'ecFade .6s 5.6s ease both' }} />
      <path d="M20 40h350" stroke={G} strokeWidth="1" opacity=".3" />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 40%,#2C2230 0%,#120E14 70%)',
  frases: [{ t: 'Levanta la vista…', d: 0.8, l: 2.6 }, { t: 'Dos dedos a punto de tocarse.', d: 3.8, l: 3 }],
  y: 700,
  orbe: { x: 0, y: -200 },
  Arte,
}
export default config
