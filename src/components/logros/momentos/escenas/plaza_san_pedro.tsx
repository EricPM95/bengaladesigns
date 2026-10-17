import type { ReactNode } from 'react'
import { G, GF, Trazo, type ConfigEscena } from './cine'

/** Plaza de San Pedro · la frontera: la columnata abraza el obelisco; unas huellas cruzan la raya blanca y se enciende «VATICANO». */
function Arte(): ReactNode {
  const huellas = Array.from({ length: 6 }, (_, i) => ({ x: i % 2 ? 188 : 202, y: 560 - i * 28 }))
  return (
    <>
      <defs>
        <filter id="lf" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <Trazo d="M60 560Q60 190 195 190Q330 190 330 560" dl={0.4} l={2.2} w={2.4} />
      <Trazo d="M92 560Q92 230 195 230Q298 230 298 560" dl={0.9} l={2} w={1.6} c={GF} />
      {Array.from({ length: 9 }, (_, i) => (
        <Trazo key={i} d={`M${64 + i * 32} 540v-30`} dl={1.2 + i * 0.1} l={0.6} w={3} />
      ))}
      <Trazo d="M195 400V300M190 300h10M195 290v-12" dl={1.8} l={1} w={2.4} />
      <Trazo d="M150 300h90v-30l-45-30-45 30z" dl={2.2} l={1.4} w={1.6} c={GF} />
      <circle cx="195" cy="300" r="7" fill={G} />
      <text x="262" y="446" fontFamily="Geist Mono" fontWeight="600" fontSize="11" letterSpacing="4" fill="rgba(255,253,248,.45)">ITALIA</text>
      {huellas.map((h, i) => (
        <ellipse key={i} cx={h.x} cy={h.y} rx="5" ry="8" fill="#F3D59A" style={{ opacity: 0, animation: `ecFade .5s ${(3 + i * 0.45).toFixed(2)}s ease both` }} />
      ))}
      <g style={{ opacity: 0, animation: 'ecFade 1s 5.6s ease both' }}>
        <path d="M123 407.2H267" stroke="#FFF3D6" strokeWidth="7" filter="url(#lf)" />
        <path d="M123 407.2H267" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="7 6" />
        <text x="195" y="380" textAnchor="middle" fontFamily="Geist Mono" fontWeight="700" fontSize="13" letterSpacing="5" fill="#FFE7A8">VATICANO</text>
      </g>
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 40%,#25283A 0%,#0F111C 72%)',
  frases: [{ t: 'Unos pasos más…', d: 1, l: 2.6 }, { t: 'Sin darte cuenta, cambias de país.', d: 4.4, l: 3 }],
  y: 64,
  orbe: { x: 0, y: 140 },
  Arte,
}
export default config
