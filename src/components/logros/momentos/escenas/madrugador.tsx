import type { ReactNode } from 'react'
import { Estrellitas, type ConfigEscena } from './cine'

/** Madrugador · el amanecer: Roma de noche con estrellas; el cielo se tiñe de rosa y el sol sale despacio tras las siluetas. */
export const SILUETA = 'M0 844V620H10V532Q70 508 122 522V540H136V556H150V620H158V562H210V620H238V586L270 566L302 586V578H296V572A42 42 0 0 1 380 572V578H374V620H390V844Z'

function Arte(): ReactNode {
  return (
    <>
      <defs>
        <filter id="sf" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16" /></filter>
        <linearGradient id="alba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B1028" stopOpacity="0" /><stop offset="1" stopColor="#F6C9A0" /></linearGradient>
      </defs>
      <Estrellitas n={26} maxY={440} />
      <rect x="0" y="300" width="390" height="544" fill="url(#alba)" style={{ opacity: 0, animation: 'ecFade 4s 1.4s ease both' }} />
      <g style={{ transform: 'translateY(160px)', animation: 'ecAlba 5s 1.4s cubic-bezier(.3,.6,.3,1) forwards' }}>
        <circle cx="195" cy="610" r="70" fill="#FFD9A0" opacity=".6" filter="url(#sf)" />
        <circle cx="195" cy="610" r="32" fill="#FFE3A8" />
      </g>
      <path d={SILUETA} fill="#1A1424" />
      <circle cx="195" cy="300" r="110" fill="#FFE7B0" filter="url(#sf)" style={{ opacity: 0, animation: 'ecFade 1.5s 6s ease both' }} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'linear-gradient(180deg,#0B1028 0%,#1B2448 60%,#2B2F5C 100%)',
  frases: [{ t: 'Roma todavía duerme…', d: 0.8, l: 3 }, { t: 'Y tú ya estás aquí.', d: 4.2, l: 3 }],
  y: 170,
  orbe: { x: 0, y: 310, color: '#FFE3A8' },
  halo: 'rgba(255,215,170,.55)',
  anillo: '#FBE3C4',
  Arte,
}
export default config
