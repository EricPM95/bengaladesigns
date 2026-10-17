import type { ReactNode } from 'react'
import { CapaComun, D, G, GF, svgAbs, type ConfigEscena } from './cine'

/** Boca de la Verdad · la leyenda («Emblema Cine», E7): la cara de piedra se dibuja en oro; una mano entra en la boca, los ojos se encienden y la boca se cierra de golpe, con temblor. La mano sale entera. */
const draw = [
  D('M195 180a150 150 0 1 1 -.1 0', 0.3, 1.8, 3),
  D('M195 196a134 134 0 1 1 -.1 0', 0.8, 1.6, 1.2, GF),
  D('M126 262Q150 246 176 258M214 258Q240 246 264 262', 1.4, 0.8, 2),
  D('M130 286Q152 270 174 286Q152 300 130 286ZM216 286Q238 270 260 286Q238 300 216 286Z', 1.6, 0.9, 2),
  D('M195 290V352M176 356Q195 372 214 356', 1.8, 0.8, 2),
  D('M110 410Q120 470 160 500M280 410Q270 470 230 500M140 470Q150 500 180 512M250 470Q240 500 210 512', 2.1, 1, 1.2, GF),
]

function Arte({ u }: { u: string }): ReactNode {
  return (
    <>
      <svg width="390" height="844" viewBox="0 0 390 844" style={svgAbs}>
        <defs><filter id={`${u}of`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter></defs>
        <circle cx="195" cy="330" r="150" fill="#2B231B" style={{ opacity: 0, animation: 'ecFade 1s .2s ease both' }} />
        <g style={{ opacity: 0, animation: 'ecGlowL .6s 4.4s ease both' }}>
          <ellipse cx="152" cy="286" rx="18" ry="9" fill="#FFD58A" filter={`url(#${u}of)`} />
          <ellipse cx="238" cy="286" rx="18" ry="9" fill="#FFD58A" filter={`url(#${u}of)`} />
          <ellipse cx="152" cy="286" rx="10" ry="5" fill="#FFF0C8" />
          <ellipse cx="238" cy="286" rx="10" ry="5" fill="#FFF0C8" />
        </g>
        <g style={{ animation: 'ecHandIn 1.5s 2.6s cubic-bezier(.2,.8,.2,1) both, ecHandOut 1.1s 6.5s ease-in forwards' }}>
          <path d="M179 420V458M191 410V458M203 410V458M215 420V458" stroke="#D9B98A" strokeWidth="11" strokeLinecap="round" />
          <path d="M172 450H222V500L234 860H158L170 500Z" fill="#D9B98A" />
          <path d="M222 470q12-8 18 4l-8 22" fill="none" stroke="#D9B98A" strokeWidth="10" strokeLinecap="round" />
        </g>
        <ellipse cx="195" cy="412" rx="44" ry="28" fill="#0A0806" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'ecMouth 1.5s 5.2s ease-in-out both' }} />
        <g fill="none" stroke={G} strokeWidth="3" strokeLinecap="round">
          <path d="M151 412Q195 380 239 412" style={{ animation: 'ecLipT 1.5s 5.2s ease-in-out both' }} />
          <path d="M151 412Q195 444 239 412" style={{ animation: 'ecLipB 1.5s 5.2s ease-in-out both' }} />
        </g>
      </svg>
      <CapaComun draw={draw} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 40%,#2A2420 0%,#0E0B09 72%)',
  frases: [{ t: 'Dicen que muerde a quien miente…', d: 0.6, l: 3.2 }, { t: '¿Te atreves?', d: 4, l: 2.2 }],
  y: 110,
  shake: 'ecShake .5s 5.25s ease both',
  Arte,
}
export default config
