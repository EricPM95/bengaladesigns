import type { ReactNode } from 'react'
import { Polvo, type ConfigEscena } from './cine'

/** Catacumbas · la lamparilla: oscuridad total, se enciende una llama de aceite y su luz va descubriendo las galerías y los nichos. */
function Arte(): ReactNode {
  const nichos: { x: number; y: number }[] = []
  for (let r = 0; r < 10; r++) {
    const y = 290 + r * 52
    nichos.push({ x: 22, y }, { x: 66, y }, { x: 286, y }, { x: 330, y })
  }
  return (
    <>
      <defs>
        <radialGradient id="cg"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity=".65" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
        <mask id="cm" maskUnits="userSpaceOnUse" x="0" y="0" width="390" height="844">
          <rect x="0" y="0" width="390" height="844" fill="#000" />
          <circle cx="254" cy="610" r="620" fill="url(#cg)" style={{ opacity: 0, transformOrigin: '254px 610px', animation: 'ecEmb 5s 1.6s ease-out both' }} />
        </mask>
        <radialGradient id="lg"><stop offset="0" stopColor="#FFC66A" stopOpacity=".85" /><stop offset="1" stopColor="#FFC66A" stopOpacity="0" /></radialGradient>
        <filter id="cr" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <g mask="url(#cm)">
        <rect x="0" y="0" width="390" height="844" fill="#2A1D12" />
        <path d="M118 844V430A77 100 0 0 1 272 430V844Z" fill="#080504" />
        <path d="M160 844V488A35 52 0 0 1 230 488V844Z" fill="#020101" />
        <path d="M118 844V430A77 100 0 0 1 272 430V844M160 844V488A35 52 0 0 1 230 488V844" fill="none" stroke="#A07C45" strokeWidth="2" />
        {nichos.map((n, i) => (
          <rect key={i} x={n.x} y={n.y} width="38" height="28" rx="3" fill="#0B0806" stroke="#8A6A3A" strokeWidth="1.2" opacity=".85" />
        ))}
        <g transform="translate(66 236)" fill="none" stroke="#C9A25A" strokeWidth="2.6" strokeLinecap="round"><path d="M0 -26V30M0 -26c14 0 18 14 0 18M-18 -6L18 22M18 -6L-18 22" /></g>
      </g>
      <circle cx="254" cy="604" r="130" fill="url(#lg)" style={{ animation: 'ecTw 1.4s ease-in-out infinite' }} />
      <g style={{ transformOrigin: '254px 604px', animation: 'ecDust 1.2s ease-in-out infinite' }}>
        <path d="M254 590c-9 8-9 20 0 28 9-8 9-20 0-28z" fill="#FFC66A" />
        <path d="M254 600c-4 5-4 11 0 15 4-4 4-10 0-15z" fill="#FFF3D0" />
        <rect x="244" y="618" width="20" height="8" rx="3" fill="#8A6A3A" />
      </g>
      <Polvo n={18} x0={150} ancho={200} y0={420} alto={300} color="#FFC66A" dl={3} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: '#050403',
  frases: [{ t: 'Bajo tus pies, otra Roma…', d: 1.6, l: 3 }, { t: 'Kilómetros de galerías en la oscuridad.', d: 4.8, l: 2.6 }],
  y: 720,
  orbe: { x: 59, y: 298, color: '#FFC66A' },
  halo: 'rgba(255,200,120,.5)',
  Arte,
}
export default config
