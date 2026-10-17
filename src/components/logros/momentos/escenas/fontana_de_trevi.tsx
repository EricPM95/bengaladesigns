import type { ReactNode } from 'react'
import type { ConfigEscena } from './cine'

/** Fontana de Trevi · la moneda: bajo el agua, mirando hacia arriba; una moneda baja girando y se queda brillando. */
function Arte(): ReactNode {
  return (
    <>
      <defs>
        <radialGradient id="sw" cx=".5" cy="0" r=".9"><stop offset="0" stopColor="#E8FFFB" stopOpacity=".95" /><stop offset=".45" stopColor="#9FE6E6" stopOpacity=".4" /><stop offset="1" stopColor="#9FE6E6" stopOpacity="0" /></radialGradient>
        <linearGradient id="ry" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2FFFC" stopOpacity=".55" /><stop offset="1" stopColor="#F2FFFC" stopOpacity="0" /></linearGradient>
        <filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
      </defs>
      <ellipse cx="195" cy="20" rx="260" ry="190" fill="url(#sw)" />
      <g filter="url(#bl)">
        {[[110, 40], [170, 30], [235, 36], [300, 44], [60, 52]].map(([x, w], k) => (
          <polygon key={k} points={`${x - w / 2},90 ${x + w / 2},90 ${x + w * 2.6 + 40},860 ${x - w * 2.6 + 40},860`} fill="url(#ry)" style={{ transformOrigin: `${x}px 90px`, animation: `ecTw ${5 + k * 0.8}s ${k * 0.4}s ease-in-out infinite` }} />
        ))}
      </g>
      <path d="M-20 790c60-26 120-30 180-14s120 18 250-10V860H-20z" fill="#0A3442" />
      <path d="M-20 812c80-16 150-10 220 2s120 6 210-8V860H-20z" fill="#072A36" />
      {[[40, 806], [92, 816], [150, 800], [210, 812], [262, 804], [318, 814], [356, 800]].map(([x, y], k) => (
        <ellipse key={k} cx={x} cy={y} rx="5" ry="1.8" fill="#E8C774" style={{ animation: `ecTw ${2 + (k % 3)}s ${(k % 4) * 0.5}s ease-in-out infinite` }} />
      ))}
      {[0, 1, 2].map((k) => (
        <ellipse key={k} cx="200" cy="104" rx="70" ry="10" stroke="rgba(240,255,252,.9)" strokeWidth="1.6" style={{ opacity: 0, transformOrigin: '200px 104px', animation: `ecShock 1.6s ${(3.35 + k * 0.3).toFixed(2)}s ease-out both` }} />
      ))}
      {Array.from({ length: 12 }, (_, k) => (
        <circle key={k} cx={200 + (k % 2 ? 7 : -7) * (1 + (k % 3))} cy={110 + k * 17} r={2 + (k % 3)} fill="none" stroke="rgba(235,255,252,.8)" style={{ opacity: 0, animation: `ecFade .5s ${(3.6 + k * 0.28).toFixed(2)}s ease both, ecOrbOut .4s ${(4.4 + k * 0.28).toFixed(2)}s ease forwards` }} />
      ))}
      {/* la moneda baja girando */}
      <g style={{ opacity: 0, animation: 'ecFade .3s 3.4s ease both, ecOrbOut .4s 6.6s ease forwards' }}>
        <ellipse cx="195" cy="300" rx="20" ry="20" fill="#E9C77A" stroke="#FFF3D0" strokeWidth="2" style={{ transformOrigin: '195px 300px', animation: 'ecTw 1.2s 3.4s ease-in-out infinite' }} />
        <path d="M195 290v20M190 295h8a3 3 0 0 1 0 6h-6a3 3 0 0 0 0 6h8" stroke="#8C6420" strokeWidth="1.6" />
      </g>
      <circle cx="195" cy="300" r="80" fill="#FFE7A8" filter="url(#bl)" style={{ opacity: 0, animation: 'ecFade 1.5s 6s ease both' }} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'linear-gradient(180deg,#5FC6CF 0%,#1F8A9A 20%,#0F5466 52%,#06283A 100%)',
  frases: [{ t: 'De espaldas, con la mano derecha…', d: 1, l: 2.8 }, { t: '…y Roma te espera de vuelta.', d: 4.3, l: 3 }],
  y: 560,
  orbe: { x: 5, y: 0 },
  halo: 'rgba(255,226,160,.55)',
  Arte,
}
export default config
