import type { ReactNode } from 'react'
import { svgAbs, type ConfigEscena } from './cine'

/** Ojo de la Cerradura · la cúpula («Emblema Cine», E8): una puerta verde cerrada con su cerradura brillando; la cámara se acerca hasta entrar por el ojo y, al fondo del paseo de setos, aparece la cúpula de San Pedro. */
function Arte({ u }: { u: string }): ReactNode {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '195px 330px', animation: 'ecViewIn 2.4s 3.6s cubic-bezier(.6,0,.3,1) both' }}>
        <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
          <defs>
            <linearGradient id={`${u}cs`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6C9A0" /><stop offset=".55" stopColor="#E9B992" /><stop offset="1" stopColor="#9CB6C8" /></linearGradient>
            <filter id={`${u}cf`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
          </defs>
          <rect x="0" y="0" width="390" height="844" fill={`url(#${u}cs)`} />
          <ellipse cx="195" cy="312" rx="46" ry="30" fill="#FFF3D6" filter={`url(#${u}cf)`} style={{ opacity: 0, animation: 'ecGlowL 1.2s 5.6s ease both' }} />
          <g transform="translate(195 330) scale(1.1) translate(-52 -47)" fill="none" stroke="#2B3A50" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M40 47h24M42 47v-5a10 10 0 0 1 20 0v5M52 32v-4M50 30h4M46 47v-4M58 47v-4" vectorEffect="non-scaling-stroke" />
          </g>
          <polygon points="120,844 188,330 202,330 270,844" fill="#C9B48A" opacity=".55" />
          <polygon points="0,844 0,520 182,330 188,330 120,844" fill="#1F3B26" />
          <polygon points="390,844 390,520 208,330 202,330 270,844" fill="#1F3B26" />
          <path d="M0 600L182 340M390 600L208 340" stroke="#2C5236" strokeWidth="2" />
        </svg>
      </div>
      <svg width="390" height="844" viewBox="0 0 390 844" style={{ ...svgAbs, transformOrigin: '195px 370px', animation: 'ecZoomD 2.4s 3.6s cubic-bezier(.7,0,.3,1) both' }}>
        <defs><filter id={`${u}kf`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter></defs>
        <path fillRule="evenodd" d="M0 0H390V844H0Z M181 349.5A24 24 0 1 1 209 349.5L219 404H171Z" fill="#1E4A34" />
        <path d="M40 120H350V700H40Z M58 140H160V330H58Z M230 140H332V330H230Z M58 360H160V540H58Z M230 360H332V540H230Z M58 570H332V680H58Z" fill="none" stroke="#123222" strokeWidth="3" />
        <path d="M181 349.5A24 24 0 1 1 209 349.5L219 404H171Z" fill="none" stroke="#FFE3A8" strokeWidth="5" filter={`url(#${u}kf)`} style={{ opacity: 0, animation: 'ecFade 1s .8s ease both, ecPulse 1.6s 1.8s ease-in-out infinite' }} />
        <path d="M181 349.5A24 24 0 1 1 209 349.5L219 404H171Z" fill="none" stroke="#E9C77A" strokeWidth="2.2" />
      </svg>
    </>
  )
}
const config: ConfigEscena = {
  fondo: '#0C0F0C',
  frases: [{ t: 'Una puerta en el Aventino…', d: 0.8, l: 2.6 }, { t: 'Asómate.', d: 3.2, l: 1.6 }],
  y: 740,
  Arte,
}
export default config
