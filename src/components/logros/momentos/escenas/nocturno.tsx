import type { ReactNode } from 'react'
import { Estrellitas, svgAbs, type ConfigEscena } from './cine'
import { silueta } from './ciudad'

/** Nocturno · la ciudad se enciende («Emblema Cine», E11): cielo de noche con estrellas que parpadean y sale la luna; se encienden uno a uno los arcos del Coliseo, el Foro y el pórtico del Panteón. (No enseña ninguna hora.) */
const { sk, wins } = silueta()

function Arte({ u }: { u: string }): ReactNode {
  return (
    <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
      <defs><filter id={`${u}nf`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter></defs>
      <Estrellitas n={32} maxY={440} />
      <g style={{ animation: 'ecMoon 2.2s 1s cubic-bezier(.2,.8,.2,1) both' }}>
        <circle cx="318" cy="104" r="54" fill="#DDE3FA" opacity=".35" filter={`url(#${u}nf)`} />
        <path d="M308 72a34 34 0 1 0 38 48 28 28 0 1 1-38-48z" fill="#F3EEDC" />
      </g>
      <path fillRule="evenodd" d={sk} fill="#0A0E1C" />
      {wins.map(([x, y], k) => (
        <ellipse key={k} cx={x} cy={y} rx="3" ry="4" fill="#FFD98C" style={{ opacity: 0, animation: `ecFade .3s ${(2.6 + k * 0.14).toFixed(2)}s ease both` }} />
      ))}
      <circle cx="195" cy="300" r="100" fill="#C9D2F2" filter={`url(#${u}nf)`} style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0, animation: 'ecGlowUp 1.6s 6.6s ease both' }} />
    </svg>
  )
}
const config: ConfigEscena = {
  fondo: 'linear-gradient(180deg,#060A1C 0%,#111A3A 60%,#1C2550 100%)',
  frases: [{ t: 'Cae la noche…', d: 0.8, l: 3 }, { t: 'Y Roma se enciende.', d: 4.4, l: 3 }],
  y: 200,
  halo: 'rgba(190,200,240,.5)',
  anillo: '#C9D2F2',
  Arte,
}
export default config
