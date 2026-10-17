import type { ReactNode } from 'react'
import { G, Polvo, Trazo, type ConfigEscena } from './cine'

/** Ojo de la Cerradura · la cúpula: una puerta cerrada con su cerradura brillando; la cámara entra por el ojo y, al fondo del paseo, aparece San Pedro. */
function Arte(): ReactNode {
  return (
    <>
      <defs>
        <filter id="kf" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect x="40" y="120" width="310" height="580" rx="6" fill="#1E4A34" style={{ opacity: 0, animation: 'ecFade 1s .2s ease both' }} />
      <Trazo d="M40 120H350V700H40Z M58 140H160V330H58Z M230 140H332V330H230Z M58 360H160V540H58Z M230 360H332V540H230Z M58 570H332V680H58Z" dl={0.4} l={2} w={3} c="#2C5236" />
      {[[68, 150], [150, 150], [240, 150], [322, 150], [68, 370], [150, 370], [240, 370], [322, 370]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={G} style={{ opacity: 0, animation: `ecFade .4s ${(1.4 + i * 0.1).toFixed(1)}s ease both` }} />
      ))}
      <Trazo d="M181 349.5A24 24 0 1 1 209 349.5L219 404H171Z" dl={1.6} l={1.2} w={2.4} />
      <path d="M181 349.5A24 24 0 1 1 209 349.5L219 404H171Z" stroke="#FFE3A8" strokeWidth="5" filter="url(#kf)" style={{ opacity: 0, animation: 'ecFade 1s 2.8s ease both, ecTw 1.6s 3s ease-in-out infinite' }} />
      {/* se acerca al ojo: el paseo de setos y la cúpula al fondo */}
      <g style={{ opacity: 0, animation: 'ecFade 1.4s 4.6s ease both' }}>
        <polygon points="0,844 0,520 182,330 202,330 390,520 390,844" fill="#1F3B26" />
        <polygon points="120,844 188,330 202,330 270,844" fill="#C9B48A" opacity=".55" />
        <path d="M168 330a27 27 0 0 1 54 0v-4a8 8 0 0 0-8-8h-38a8 8 0 0 0-8 8z" fill="#2B3A50" />
        <ellipse cx="195" cy="312" rx="46" ry="30" fill="#FFF3D6" opacity=".55" filter="url(#kf)" />
      </g>
      <Polvo n={16} x0={120} ancho={150} y0={250} alto={250} dl={3} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: '#0C0F0C',
  frases: [{ t: 'Una puerta en el Aventino…', d: 0.8, l: 2.6 }, { t: 'Asómate.', d: 3.2, l: 1.6 }],
  y: 740,
  orbe: { x: 0, y: 70 },
  Arte,
}
export default config
