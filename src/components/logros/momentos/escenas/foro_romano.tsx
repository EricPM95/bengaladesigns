import type { ReactNode } from 'react'
import { Fantasma, G, GF, Polvo, Trazo, type ConfigEscena } from './cine'

/** Foro Romano · donde empezó todo: ruinas en fantasma, el Miliario de Oro en el centro y cinco calzadas que se abren hacia ti. */
function Arte(): ReactNode {
  const caminos = ['M195 330C170 420 90 520 40 640', 'M195 330C185 440 150 560 120 700', 'M195 330C195 450 195 580 195 740', 'M195 330C205 440 240 560 270 700', 'M195 330C220 420 300 520 350 640']
  return (
    <>
      <Fantasma d="M30 250V190M30 190h50M55 190V250M110 250V170M110 170h40M130 170V250M240 250V180M240 180h60M270 180V250M320 250V200M320 200h40M345 200V250" dl={0.4} />
      <Fantasma d="M20 250H370" dl={0.5} da="2 6" />
      <Trazo d="M185 330V250M205 330V250M185 250h20M182 242h26M190 236h10" dl={0.8} l={1.4} w={2.6} />
      <Trazo d="M180 332h30" dl={1.6} l={0.6} w={3} />
      {caminos.map((d, i) => (
        <g key={i}>
          <Trazo d={d} dl={2 + i * 0.35} l={1.8} w={2} />
          <path d={d} stroke={GF} strokeWidth="9" strokeDasharray="1 11" style={{ opacity: 0, animation: `ecFade 1s ${(3 + i * 0.35).toFixed(2)}s ease both` }} />
        </g>
      ))}
      <Polvo n={20} x0={60} ancho={280} y0={380} alto={320} color={G} dl={3.8} />
      <circle cx="195" cy="300" r="6" fill="#FFE7B0" style={{ opacity: 0, animation: 'ecFade 1s 5s ease both, ecTw 1.4s 5s ease-in-out infinite' }} />
    </>
  )
}
const config: ConfigEscena = {
  fondo: 'radial-gradient(circle at 50% 46%,#2E2218 0%,#130D09 72%)',
  frases: [{ t: 'Aquí, en el corazón del Foro…', d: 1, l: 3 }, { t: 'Todos los caminos del Imperio empezaban en esta columna.', d: 4.4, l: 3 }],
  y: 200,
  orbe: { x: 0, y: 380 },
  Arte,
}
export default config
