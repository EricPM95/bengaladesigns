import type { ReactNode } from 'react'
import { CapaComun, D, G, GH, svgAbs, type ConfigEscena } from './cine'

/** Plaza de San Pedro · la frontera («Emblema Cine», E5): la columnata de Bernini abraza el obelisco; unas huellas suben por la calle desde Italia; al pisar la raya blanca la frontera brilla y aparece «VATICANO». */
const draw = [
  D('M156.6 207.2A120 94.4 0 0 0 156.6 392.8', 0.5, 1.8, 3),
  D('M233.4 207.2A120 94.4 0 0 1 233.4 392.8', 0.5, 1.8, 3),
  D('M177.4 206.4V160.8M212.6 206.4V160.8', 1.6, 0.8, 1.4),
  D('M156.6 159.2h76.8M163 159.2v-16a32 32 0 0 1 64 0v16M195 111.2v-12.8M188.6 104.8h12.8M175.8 159.2v-12.8M214.2 159.2v-12.8', 1.9, 1.6, 2.2),
]
const ghost = [GH('M163 231.2A91.2 70.4 0 0 0 163 368.8M227 231.2A91.2 70.4 0 0 1 227 368.8', 2.4, '1 7', 2.4, G), GH('M172 844V420M218 844V420', 2.6, '6 8', 1.2)]
const steps = Array.from({ length: 13 }, (_, k) => ({ x: k % 2 ? 204 : 186, y: 812 - k * 34, d: 3.4 + k * 0.22 }))

function Arte({ u }: { u: string }): ReactNode {
  return (
    <>
      <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
        <defs><filter id={`${u}lf`} x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="4" /></filter></defs>
        <circle cx="195" cy="300" r="7" fill="#E9C77A" style={{ opacity: 0, animation: 'ecFade .6s 1.4s ease both' }} />
        <text x="262" y="446" textAnchor="start" fontFamily="Geist Mono" fontWeight="600" fontSize="11" letterSpacing="4" fill="rgba(255,253,248,.45)" style={{ opacity: 0, animation: 'ecFade .8s 2.4s ease both' }}>ITALIA</text>
        {steps.map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx="5" ry="8" fill="#F3D59A" style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0, animation: `ecStep .7s ${p.d.toFixed(2)}s ease both` }} />
        ))}
        <path d="M123 407.2H267" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="7 6" style={{ opacity: 0, animation: 'ecFade .8s 2.6s ease both' }} />
        <path d="M123 407.2H267" stroke="#FFF3D6" strokeWidth="7" filter={`url(#${u}lf)`} style={{ opacity: 0, animation: 'ecGlowL 1s 6.2s ease both' }} />
        <path d="M123 407.2H267" stroke="#FFF3D6" strokeWidth="3" strokeDasharray="7 6" style={{ opacity: 0, animation: 'ecGlowL 1s 6.2s ease both, ecMarch 1.2s 6.2s linear infinite' }} />
        <text x="195" y="360" textAnchor="middle" fontFamily="Geist Mono" fontWeight="700" fontSize="13" letterSpacing="5" fill="#FFE7A8" style={{ opacity: 0, animation: 'ecFade .8s 6.4s ease both' }}>VATICANO</text>
      </svg>
      <CapaComun ghost={ghost} draw={draw} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 40%,#25283A 0%,#0F111C 72%)',
  frases: [{ t: 'Unos pasos más…', d: 1, l: 2.6 }, { t: 'Sin darte cuenta, cambias de país.', d: 4.4, l: 3 }],
  y: 64,
  orbe: { x: 0, y: 0 },
  orbeD: 6.8,
  orbeL: 1,
  Arte,
}
export default config
