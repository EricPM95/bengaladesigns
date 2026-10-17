import type { ReactNode } from 'react'
import { Estrellitas, type ConfigEscena } from './cine'
import { SILUETA } from './madrugador'

/** Nocturno · la ciudad se enciende: cielo de noche con estrellas que parpadean, sale la luna y se encienden las ventanas una a una. */
const VENTANAS: [number, number][] = [...Array.from({ length: 7 }, (_, k): [number, number] => [24 + k * 28, 560]), ...Array.from({ length: 5 }, (_, k): [number, number] => [24 + k * 28, 590]), [171, 594], [199, 594], [262.5, 604], [286.5, 604], [74, 610], [102, 610], [130, 610]]

function Arte(): ReactNode {
  return (
    <>
      <defs>
        <filter id="nf" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <Estrellitas n={32} maxY={440} />
      <g style={{ opacity: 0, animation: 'ecFade 2s 1.2s ease both' }}>
        <circle cx="318" cy="104" r="54" fill="#DDE3FA" opacity=".35" filter="url(#nf)" />
        <path d="M308 72a34 34 0 1 0 38 48 28 28 0 1 1-38-48z" fill="#F3EEDC" />
      </g>
      <path d={SILUETA} fill="#0A0E1C" />
      {VENTANAS.map(([x, y], k) => (
        <ellipse key={k} cx={x} cy={y} rx="3" ry="4" fill="#FFD98C" style={{ opacity: 0, animation: `ecFade .5s ${(2.6 + k * 0.16).toFixed(2)}s ease both` }} />
      ))}
      <circle cx="195" cy="300" r="100" fill="#C9D2F2" filter="url(#nf)" style={{ opacity: 0, animation: 'ecFade 1.5s 6s ease both' }} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'linear-gradient(180deg,#060A1C 0%,#111A3A 60%,#1C2550 100%)',
  frases: [{ t: 'Cae la noche…', d: 0.8, l: 3 }, { t: 'Y Roma se enciende.', d: 4.4, l: 3 }],
  y: 200,
  orbe: { x: 0, y: 310, color: '#C9D2F2' },
  halo: 'rgba(190,200,240,.5)',
  anillo: '#C9D2F2',
  Arte,
}
export default config
