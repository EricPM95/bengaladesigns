import type { ReactNode } from 'react'
import { Polvo, Trazo, type ConfigEscena } from './cine'

/** Basílica de San Pedro · la tumba: cúpula y baldaquino en oro, un rayo de luz baja al altar y bajo el suelo se enciende la tumba. */
function Arte(): ReactNode {
  return (
    <>
      <defs>
        <linearGradient id="bb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF3D6" stopOpacity=".7" />
          <stop offset="1" stopColor="#FFF3D6" stopOpacity=".05" />
        </linearGradient>
        <filter id="bf" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
      <Trazo d="M60 360Q60 140 195 120Q330 140 330 360" dl={0.4} l={2.2} w={2.4} />
      <Trazo d="M195 120V70M185 82h20" dl={1.6} l={0.8} w={2.4} />
      {[110, 160, 230, 280].map((x, i) => (
        <Trazo key={x} d={`M${x} 360V190`} dl={1.4 + i * 0.2} l={0.8} w={1.4} />
      ))}
      {[150, 240].map((x, i) => (
        <Trazo key={x} d={`M${x} 640C${x - 14} 600 ${x + 14} 560 ${x} 520C${x - 14} 480 ${x + 14} 440 ${x} 400`} dl={2.2 + i * 0.3} l={1.4} w={2.6} />
      ))}
      <Trazo d="M140 400h110" dl={2.8} l={0.6} w={3} />
      <polygon points="184,186 206,186 226,688 164,688" fill="url(#bb)" style={{ opacity: 0, animation: 'ecFade 1.6s 3s ease both' }} />
      <Polvo n={14} x0={170} ancho={50} y0={190} alto={400} dl={3.4} />
      <g style={{ opacity: 0, animation: 'ecFade 1.2s 5s ease both' }}>
        <circle cx="195" cy="730" r="62" fill="#FFD58A" filter="url(#bf)" />
        <rect x="160" y="712" width="70" height="36" rx="4" fill="#FFD58A" />
        <path d="M168 722h54M168 738h54" stroke="#8C6420" strokeWidth="1.4" />
      </g>
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 30%,#2E2618 0%,#100D08 70%)',
  frases: [{ t: 'Bajo el altar…', d: 1, l: 3 }, { t: 'Una tumba de casi 2.000 años.', d: 4.6, l: 2.8 }],
  y: 772,
  orbe: { x: 0, y: 430 },
  Arte,
}
export default config
