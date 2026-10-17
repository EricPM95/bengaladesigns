import type { ReactNode } from 'react'
import { CapaComun, D, GF, svgAbs, type ConfigEscena, type TrazoD } from './cine'

/** Museos Vaticanos · la Creación («Emblema Cine», E4): la bóveda de la Sixtina se dibuja panel a panel y se llena de color; dos manos llegan hasta casi tocarse, salta la chispa, late y aparece el emblema. */
const xs = [56, 151, 246]
const ys = [140, 290, 440]
const C = ['#C99A6E', '#8EA3B0', '#D9B88A', '#A9785A', '#B9C4B4', '#D2A77C', '#8E9DAA', '#C8A06F', '#B48B66']
function construir() {
  const draw: TrazoD[] = [D('M30 110H360V620H30Z', 0.3, 1.8, 2), D('M30 110L56 140M360 110L332 140M30 620L56 580M360 620L332 580', 1.2, 0.8, 1.2, GF)]
  const mpan: { x: number; y: number; f: string; d: number }[] = []
  ys.forEach((y, r) =>
    xs.forEach((x, c) => {
      const k = r * 3 + c
      draw.push(D(`M${x} ${y}h86v140h-86Z`, 0.8 + k * 0.15, 0.9, 1.4))
      mpan.push({ x, y, f: C[k], d: 2.4 + k * 0.12 })
    }),
  )
  return { draw, mpan }
}
const DATOS = construir()

function Arte({ u }: { u: string }): ReactNode {
  return (
    <>
      <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
        <defs><filter id={`${u}mf`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter></defs>
        {DATOS.mpan.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width="86" height="140" rx="6" fill={p.f} style={{ fillOpacity: 0, animation: `ecFillTo 1.2s ${p.d.toFixed(2)}s ease both` }} />
        ))}
        <g transform="translate(75 216) scale(4)" fill="none" stroke="#F3D59A" strokeLinecap="round" strokeLinejoin="round">
          <g style={{ animation: 'ecHL 2s 3.4s cubic-bezier(.4,0,.2,1) both' }}>
            <path d="M-2 29h10c3 0 6-1 9-2.5L27 21M13 28c1 2.5 4 3.5 7 2.5M17 26.5l2.2 2.2" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
          </g>
          <g style={{ animation: 'ecHR 2s 3.4s cubic-bezier(.4,0,.2,1) both' }}>
            <path d="M62 13H52c-3 0-6 1-9 2.5L33 21M47 14c-1-2.5-4-3.5-7-2.5M43 15.5l-2.2-2.2" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
          </g>
        </g>
        <circle cx="195" cy="300" r="34" fill="#FFF4D6" filter={`url(#${u}mf)`} style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0, animation: 'ecGrow .6s 5.6s ease both, ecBeat .45s 6.3s ease-in-out 3' }} />
        <circle cx="195" cy="300" r="5" fill="#FFFFFF" style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0, animation: 'ecGrow .4s 5.6s ease both' }} />
      </svg>
      <CapaComun draw={DATOS.draw} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 40%,#2C2230 0%,#120E14 70%)',
  frases: [{ t: 'Levanta la vista…', d: 0.8, l: 2.6 }, { t: 'Dos dedos a punto de tocarse.', d: 3.8, l: 3 }],
  y: 700,
  Arte,
}
export default config
