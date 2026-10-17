import type { ReactNode } from 'react'
import { CapaComun, D, GF, svgAbs, type ConfigEscena } from './cine'

/** Basílica de San Pedro · la tumba («Emblema Cine», E6): la cúpula y el baldaquino con sus columnas retorcidas se dibujan en oro, baja un rayo de luz hasta el altar; bajo el suelo se enciende la tumba y su luz sube hasta el centro. */
const tw = (x: number, ph: number) => {
  let d = `M${x} 496`
  for (let k = 0; k < 8; k++) d += `q${(k + ph) % 2 ? -9 : 9} 12 0 24`
  return d
}
let val = 'M124 496'
for (let k = 0; k < 8; k++) val += 'q8.875 10 17.75 0'
const draw = [
  D('M75 340A120 160 0 0 1 315 340', 0.4, 1.8, 2.4),
  D('M105 340A90 120 0 0 1 285 340', 0.8, 1.4, 1.2, GF),
  D('M195 180V340M135 205Q150 260 150 340M255 205Q240 260 240 340', 1.1, 1, 1, GF),
  D('M182 184V156H208V184M195 156V136M187 143h16', 1.4, 0.9, 1.6),
  D('M56 340H334M66 356H324', 1.6, 1, 1.6),
  D('M82 356V700M308 356V700', 1.8, 1.4, 2),
  D('M18 700H372', 2, 1, 2),
  D('M124 476H266V496H124Z', 2.4, 0.9, 1.8),
  D(val, 2.6, 0.8, 1.2),
  D('M150 476Q195 440 240 476M195 452V430M187 438h16', 2.7, 0.9, 1.6),
  D(tw(142, 0), 2.8, 1.4, 2),
  D(tw(142, 1), 2.9, 1.4, 1.2, GF),
  D(tw(248, 0), 2.8, 1.4, 2),
  D(tw(248, 1), 2.9, 1.4, 1.2, GF),
  D('M132 690H156M238 690H262', 3.2, 0.6, 1.6),
  D('M168 660H222V690H168Z', 3.1, 0.8, 1.6),
]

function Arte({ u }: { u: string }): ReactNode {
  return (
    <>
      <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
        <defs>
          <linearGradient id={`${u}bb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF3D6" stopOpacity=".7" /><stop offset="1" stopColor="#FFF3D6" stopOpacity=".05" /></linearGradient>
          <filter id={`${u}bf`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>
        <g style={{ opacity: 0, animation: 'ecFade 1.4s 3.4s ease both' }}>
          <polygon points="184,186 206,186 226,688 164,688" fill={`url(#${u}bb)`} style={{ animation: 'ecPulse 3s 4.8s ease-in-out infinite' }} />
        </g>
        <circle cx="195" cy="730" r="62" fill="#FFD58A" filter={`url(#${u}bf)`} style={{ opacity: 0, animation: 'ecGlowL 1.2s 5s ease both' }} />
        <rect x="160" y="712" width="70" height="36" rx="4" fill="#FFD58A" style={{ opacity: 0, animation: 'ecGlowL 1.2s 5s ease both' }} />
        <path d="M168 722h54M168 738h54" stroke="#8C6420" strokeWidth="1.4" style={{ opacity: 0, animation: 'ecFade 1s 5.2s ease both' }} />
      </svg>
      <CapaComun draw={draw} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 30%,#2E2618 0%,#100D08 70%)',
  frases: [{ t: 'Bajo el altar…', d: 1, l: 3 }, { t: 'Una tumba de casi 2.000 años.', d: 4.6, l: 2.8 }],
  y: 772,
  orbe: { x: 0, y: 430, color: '#FFD58A' },
  orbeD: 6.2,
  orbeL: 1.4,
  Arte,
}
export default config
