import type { CSSProperties, ReactNode } from 'react'
import { Chispas, svgAbs, toC, type ConfigEscena } from './cine'

/** Catacumbas · la lamparilla («Emblema Cine», E9): oscuridad total; se enciende la llama de una lamparilla de aceite y su luz va descubriendo las galerías y los nichos (una cruz se ilumina al final). La llama sube hasta el centro. */
const niches: { x: number; y: number; o: number }[] = []
for (let r = 0; r < 10; r++) {
  const y = 290 + r * 52
  niches.push({ x: 22, y, o: 0.9 }, { x: 66, y, o: 0.75 }, { x: 286, y, o: 0.75 }, { x: 330, y, o: 0.9 })
}
const dust = Array.from({ length: 18 }, (_, k) => ({ x: 150 + ((k * 47) % 200), y: 420 + ((k * 61) % 300), r: 0.8 + (k % 3) * 0.5, l: 3 + (k % 4), d: (k % 5) * 0.4 }))
const sparks = Array.from({ length: 8 }, (_, k) => ({ x: 250 + (k % 3) * 3, dx: (k % 2 ? 1 : -1) * (6 + k * 3), l: 1.4 + (k % 3) * 0.4, d: 1.8 + k * 0.35 }))
const spk = toC(Array.from({ length: 6 }, (_, k) => [254 - k * 10, 590 - k * 50] as [number, number]), 6.5, 0.08)
const CRUZ = 'M0 -26V30M0 -26c14 0 18 14 0 18M-18 -6L18 22M18 -6L-18 22'

function Arte({ u }: { u: string }): ReactNode {
  return (
    <>
      <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
        <defs>
          <radialGradient id={`${u}cg`}><stop offset="0" stopColor="#FFFFFF" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity=".65" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
          <mask id={`${u}cm`} maskUnits="userSpaceOnUse" x="0" y="0" width="390" height="844">
            <rect x="0" y="0" width="390" height="844" fill="#000000" />
            <circle cx="254" cy="610" r="620" fill={`url(#${u}cg)`} style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'ecReveal 4.4s 1.2s cubic-bezier(.3,0,.2,1) both, ecFlickM .18s 5.6s ease-in-out infinite alternate' }} />
          </mask>
          <radialGradient id={`${u}lg`}><stop offset="0" stopColor="#FFC66A" stopOpacity=".85" /><stop offset="1" stopColor="#FFC66A" stopOpacity="0" /></radialGradient>
          <filter id={`${u}st`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".035 .07" numOctaves="3" seed="4" />
            <feColorMatrix values="0 0 0 0 .34  0 0 0 0 .23  0 0 0 0 .13  0 0 0 1.2 -.3" />
          </filter>
          <filter id={`${u}cr`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <g mask={`url(#${u}cm)`}>
          <rect x="0" y="0" width="390" height="844" fill="#2A1D12" />
          <rect x="0" y="0" width="390" height="844" filter={`url(#${u}st)`} />
          <path d="M118 844V430A77 100 0 0 1 272 430V844Z" fill="#080504" />
          <path d="M160 844V488A35 52 0 0 1 230 488V844Z" fill="#020101" />
          <path d="M118 844V430A77 100 0 0 1 272 430V844M160 844V488A35 52 0 0 1 230 488V844" fill="none" stroke="#A07C45" strokeWidth="2" />
          <polygon points="0,844 118,760 272,760 390,844" fill="rgba(160,124,69,.18)" />
          {niches.map((n, i) => (
            <rect key={i} x={n.x} y={n.y} width="38" height="28" rx="3" fill="#0B0806" stroke="#8A6A3A" strokeWidth="1.2" opacity={n.o} />
          ))}
          <g transform="translate(66 236)" fill="none" stroke="#C9A25A" strokeWidth="2.6" strokeLinecap="round"><path d={CRUZ} /></g>
          <g transform="translate(66 236)" fill="none" stroke="#FFE3A0" strokeWidth="5" strokeLinecap="round" filter={`url(#${u}cr)`} style={{ opacity: 0, animation: 'ecGlowL 1.4s 4.4s ease both' }}><path d={CRUZ} /></g>
        </g>
        <circle cx="254" cy="604" r="130" fill={`url(#${u}lg)`} style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0, animation: 'ecGrow 1.4s 1s ease-out both, ecPulse 1.4s 2.4s ease-in-out infinite' }} />
        <g style={{ opacity: 0, animation: 'ecFade 1.5s 2.4s ease both' }}>
          {dust.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#FFD9A0" style={{ animation: `ecDust2 ${d.l}s ${d.d}s ease-in-out infinite` }} />
          ))}
        </g>
        <g style={{ opacity: 0, animation: 'ecFade .8s .5s ease both' }} stroke="#E9C77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M146 642a12 12 0 1 1 6 -14" fill="none" />
          <ellipse cx="190" cy="640" rx="44" ry="17" fill="#3A2814" />
          <ellipse cx="190" cy="633" rx="30" ry="8" fill="#4A341C" />
          <circle cx="190" cy="633" r="4" fill="#120B05" />
          <path d="M226 630q22-8 32 2q-4 12-32 12z" fill="#3A2814" />
        </g>
        <path d="M254 632c-8-8-8-20 0-34 8 14 8 26 0 34z" fill="#FFB040" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', opacity: 0, animation: 'ecFlame .9s .8s ease-out both, ecFlick .3s 1.7s ease-in-out infinite alternate' }} />
        <path d="M254 630c-4-4-4-11 0-18 4 7 4 14 0 18z" fill="#FFF6D6" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', opacity: 0, animation: 'ecFlame .9s .9s ease-out both, ecFlick .24s 1.8s ease-in-out infinite alternate' }} />
      </svg>
      {sparks.map((p, i) => (
        <span key={i} style={{ position: 'absolute', left: p.x, top: 596, width: 3, height: 3, borderRadius: '50%', background: '#FFD58A', boxShadow: '0 0 6px #FFB040', ['--dx' as string]: `${p.dx}px`, opacity: 0, animation: `ecSpark ${p.l.toFixed(2)}s ${p.d.toFixed(2)}s ease-out infinite` } as CSSProperties} />
      ))}
      <Chispas pts={spk} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: '#050403',
  frases: [{ t: 'Bajo tus pies, otra Roma…', d: 1.6, l: 3 }, { t: 'Kilómetros de galerías en la oscuridad.', d: 4.8, l: 2.6 }],
  y: 720,
  orbe: { x: 59, y: 298, color: '#FFC66A' },
  orbeD: 6.4,
  orbeL: 1.3,
  halo: 'rgba(255,200,120,.5)',
  Arte,
}
export default config
