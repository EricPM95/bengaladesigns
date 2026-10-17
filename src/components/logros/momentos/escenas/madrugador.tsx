import type { ReactNode } from 'react'
import { Estrellitas, svgAbs, type ConfigEscena } from './cine'
import { silueta } from './ciudad'

/** Madrugador · el amanecer («Emblema Cine», E10): Roma de noche, con estrellas; el cielo se tiñe de rosa y el sol sale despacio por detrás del Coliseo, el Foro y el Panteón. Su luz llena el centro. (No enseña ninguna hora.) */
const { sk } = silueta()

function Arte({ u }: { u: string }): ReactNode {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#2A2D5A 0%,#7A5C8E 38%,#E58C7A 68%,#F7C68A 100%)', opacity: 0, animation: 'ecFade 4.5s 1.2s ease both' }} />
      <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
        <defs><filter id={`${u}sf`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16" /></filter></defs>
        <g style={{ animation: 'ecOut 1.6s 3s ease forwards' }}>
          <Estrellitas n={26} maxY={440} />
        </g>
        <g style={{ animation: 'ecSunUp2 4.4s 2s cubic-bezier(.3,.1,.3,1) both' }}>
          <circle cx="195" cy="610" r="70" fill="#FFD9A0" opacity=".6" filter={`url(#${u}sf)`} />
          <circle cx="195" cy="610" r="32" fill="#FFE3A8" />
        </g>
        <path fillRule="evenodd" d={sk} fill="#1A1424" />
        <circle cx="195" cy="300" r="110" fill="#FFE7B0" filter={`url(#${u}sf)`} style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0, animation: 'ecGlowUp 1.6s 6.2s ease both' }} />
      </svg>
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'linear-gradient(180deg,#0B1028 0%,#1B2448 60%,#2B2F5C 100%)',
  frases: [{ t: 'Roma todavía duerme…', d: 0.8, l: 3 }, { t: 'Y tú ya estás aquí.', d: 4.2, l: 3 }],
  y: 170,
  halo: 'rgba(255,215,170,.55)',
  anillo: '#FBE3C4',
  Arte,
}
export default config
