import type { ReactNode } from 'react'
import { G, Trazo, type ConfigEscena } from './cine'

/** Boca de la Verdad · la leyenda: la cara de piedra, los ojos se encienden y la boca se cierra de golpe con una mano dentro. */
function Arte(): ReactNode {
  return (
    <>
      <defs>
        <filter id="of" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <circle cx="195" cy="330" r="150" fill="#2B231B" style={{ opacity: 0, animation: 'ecFade 1.2s .2s ease both' }} />
      <Trazo d="M195 180a150 150 0 1 0 .1 0" dl={0.4} l={2} w={2.2} />
      <Trazo d="M126 232Q152 214 178 228M212 228Q238 214 264 232" dl={1.4} l={0.8} w={2} />
      <Trazo d="M195 290V352M176 356Q195 372 214 356" dl={1.8} l={0.8} w={2} />
      <g style={{ opacity: 0, animation: 'ecFade .6s 2.4s ease both' }}>
        <ellipse cx="152" cy="286" rx="18" ry="9" fill="#FFD58A" filter="url(#of)" />
        <ellipse cx="238" cy="286" rx="18" ry="9" fill="#FFD58A" filter="url(#of)" />
        <ellipse cx="152" cy="286" rx="10" ry="5" fill="#FFF0C8" />
        <ellipse cx="238" cy="286" rx="10" ry="5" fill="#FFF0C8" />
      </g>
      {/* la mano entra en la boca */}
      <g style={{ opacity: 0, animation: 'ecFade .5s 3s ease both, ecOrbOut .4s 6.8s ease forwards' }}>
        <path d="M179 520V458M191 510V458M203 510V458M215 520V458" stroke="#D9B98A" strokeWidth="11" strokeLinecap="round" />
        <path d="M172 550H222V500L234 860H158L170 500Z" fill="#D9B98A" />
      </g>
      <ellipse cx="195" cy="412" rx="44" ry="28" fill="#0A0806" style={{ opacity: 0, animation: 'ecFade .5s 2.8s ease both' }} />
      <g stroke={G} strokeWidth="3" style={{ transformOrigin: '195px 412px', animation: 'ecTw .3s 5s ease-in-out 2' }}>
        <path d="M151 412Q195 380 239 412" />
        <path d="M151 412Q195 444 239 412" />
      </g>
      <path d="M110 410Q120 470 160 500M280 410Q270 470 230 500" stroke={G} strokeWidth="1.2" opacity=".5" />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 40%,#2A2420 0%,#0E0B09 72%)',
  frases: [{ t: 'Dicen que muerde a quien miente…', d: 0.6, l: 3.2 }, { t: '¿Te atreves?', d: 4, l: 2.2 }],
  y: 110,
  orbe: { x: 0, y: 160 },
  Arte,
}
export default config
