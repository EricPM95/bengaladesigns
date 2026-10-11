import { useState } from 'react'
import { COLOR_ICONO } from '../../lib/iconos'
import { Icono } from '../ui/Icono'
import { INK, MONO, SERIF, Title } from './trazoUi'
import type { PlanChoice } from './planChoice'

const R = COLOR_ICONO.falta
const B = COLOR_ICONO.azul
const G = COLOR_ICONO.hecho
const CREMA = '#FFFDF8'

/** Los tres días dibujados sobre el mapa del diseño (docs/diseno/ruta_manual): cada uno con su color y sus puntos. */
const DIAS: { c: string; pts: [number, number][]; draw: string; delay: number; numbered: [number, number][] }[] = [
  { c: R, pts: [[58, 46], [96, 70], [132, 64], [146, 124], [180, 112]], draw: 'M58 46 L96 70 L132 64 L146 124 L180 112', delay: 0.2, numbered: [[58, 46], [96, 70], [132, 64], [146, 124]] },
  { c: B, pts: [[180, 112], [214, 128], [252, 112], [282, 92], [304, 58]], draw: 'M180 112 L214 128 L252 112 L282 92 L304 58', delay: 0.8, numbered: [[214, 128], [252, 112], [282, 92], [304, 58]] },
  { c: G, pts: [[180, 112], [160, 150], [190, 178], [232, 168], [262, 200]], draw: 'M180 112 L160 150 L190 178 L232 168 L262 200', delay: 1.4, numbered: [[160, 150], [190, 178], [232, 168], [262, 200]] },
]

interface StepElegirProps {
  destinationName: string
  days: number | undefined
  /** La tarjeta que se acaba de tocar (se queda pulsada mientras sale el aviso). */
  picked: PlanChoice | null
  onPick: (plan: PlanChoice) => void
}

/**
 * Antes de las experiencias: ¿te montamos el itinerario día a día? (Tanda 6y, diseño en docs/diseno/ruta_manual/Itinerario Eleccion.dc.html.)
 * «¡Sí, hazla por mí!» sigue el formulario de siempre; «Quiero hacerla yo» salta experiencias y lugares y abre la ruta en blanco.
 */
export function StepElegir({ destinationName, days, picked, onPick }: StepElegirProps) {
  const [hoverSelf, setHoverSelf] = useState(false)
  // El dibujo se apaga del todo solo al tocar «Quiero hacerla yo»; con el ratón encima solo se atenúa (y en el móvil, donde no hay «encima», nunca se queda atenuado).
  const dibujoOpacity = picked === 'manual' ? 0.25 : hoverSelf ? 0.6 : 1
  const eyebrow = days ? `${destinationName} · ${days} ${days === 1 ? 'día' : 'días'}` : destinationName

  return (
    <>
      <div style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.06em', color: 'rgba(28,34,48,.62)' }}>{eyebrow}</div>
      <Title size={36}>
        ¿Te montamos el itinerario <em style={{ color: R }}>día a día</em>?
      </Title>

      <div
        style={{
          position: 'relative',
          height: 'clamp(150px, 27dvh, 236px)',
          flex: 'none',
          margin: '16px 0',
          borderRadius: 24,
          overflow: 'hidden',
          background: '#EFE7D6',
          boxShadow: '0 1px 2px rgba(28,34,48,.06),0 16px 34px -24px rgba(28,34,48,.45)',
        }}
      >
        {/* El encuadre es el del dibujo (los tres días con sus pines y un margen) y se ve ENTERO en cualquier altura ("meet", no "slice"): el mapa de fondo se extiende más allá para llenar la caja. */}
        <svg viewBox="28 24 290 204" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
          <rect x="-600" y="-400" width="1600" height="1000" fill="#F1EADB" />
          <path d="M-140 40 L-10 60 C40 50 70 80 90 120 S110 200 70 250 L60 330" fill="none" stroke="#D6E3E6" strokeWidth="16" strokeLinecap="round" />
          <path d="M215 -10 L250 40 L330 30 L360 70 L700 70 L700 -200 L215 -200Z" fill="#DCE5CC" />
          <path d="M250 170 Q290 150 330 175 L700 175 L700 420 L240 420Z" fill="#DCE5CC" />
          <path d="M117 -60 L133 300 M184 -60 L168 300 M-250 94 L600 134 M-250 172 L600 158 M200 -60 L320 300 M2 -60 L170 300 M-250 14 L600 76" stroke="#FFFFFF" strokeWidth="5" fill="none" opacity=".85" />
          <path d="M-250 164 L600 80 M270 -60 L195 300 M95 -60 L15 300" stroke="#FFFFFF" strokeWidth="2.5" fill="none" opacity=".7" />
          <g style={{ opacity: dibujoOpacity, transition: 'opacity .5s' }}>
            {DIAS.map((dia) => (
              <path
                key={dia.c}
                d={dia.draw}
                fill="none"
                stroke={dia.c}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="600"
                style={{ animation: `trazo-draw 1.6s ${dia.delay}s cubic-bezier(.4,0,.2,1) backwards` }}
              />
            ))}
            {DIAS.map((dia, d) =>
              dia.numbered.map(([x, y], i) => (
                <g key={`${dia.c}-${i}`} style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `trazo-pin .4s ${0.5 + d * 0.6 + i * 0.25}s cubic-bezier(.3,1.6,.5,1) backwards` }}>
                  <circle cx={x} cy={y} r="11" fill={dia.c} stroke={CREMA} strokeWidth="2" />
                  <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Geist, sans-serif">
                    {i + 1}
                  </text>
                </g>
              )),
            )}
          </g>
        </svg>
        <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', gap: 5 }}>
          {DIAS.map((dia, i) => (
            <span key={dia.c} style={{ height: 24, padding: '0 9px 0 7px', borderRadius: 999, background: 'rgba(255,253,248,.92)', display: 'flex', alignItems: 'center', gap: 5, font: "600 10.5px 'Geist'", color: INK }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dia.c }} />
              Día {i + 1}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          className="trazo-press"
          onClick={() => onPick('auto')}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            minHeight: 112,
            padding: '16px 16px 16px 18px',
            borderRadius: 24,
            border: 'none',
            background: INK,
            color: CREMA,
            textAlign: 'left',
            cursor: 'pointer',
            overflow: 'hidden',
            boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)',
            transform: picked === 'auto' ? 'scale(.98)' : 'none',
            transition: 'transform .25s',
          }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'oklch(0.55 0.17 5 / .35)', filter: 'blur(22px)' }} />
          <span style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ font: `400 25px/1 ${SERIF}` }}>¡Sí, hazla por mí!</span>
              <span style={{ height: 20, padding: '0 7px', borderRadius: 999, background: R, font: `600 9.5px/20px ${MONO}`, letterSpacing: '.1em' }}>RECOMENDADO</span>
            </span>
            <span style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(255,253,248,.72)', textWrap: 'pretty' }}>Lo hacemos todo: el orden de cada día, los tiempos entre sitios, dónde comer y qué reservar.</span>
          </span>
          <span style={{ position: 'relative', width: 40, height: 40, flex: 'none', borderRadius: '50%', background: CREMA, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icono nombre="flecha" size={18} />
          </span>
        </button>

        <button
          type="button"
          className="trazo-press"
          onClick={() => onPick('manual')}
          onPointerEnter={(event) => setHoverSelf(event.pointerType === 'mouse')}
          onPointerLeave={() => setHoverSelf(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            minHeight: 84,
            padding: '14px 16px 14px 18px',
            borderRadius: 22,
            border: `1.5px solid ${hoverSelf ? 'rgba(28,34,48,.3)' : 'rgba(28,34,48,.12)'}`,
            background: CREMA,
            color: INK,
            textAlign: 'left',
            cursor: 'pointer',
            transform: picked === 'manual' ? 'scale(.98)' : 'none',
            transition: 'transform .25s,border-color .25s',
          }}
        >
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ font: `400 22px/1 ${SERIF}` }}>Quiero hacerla yo</span>
            <span style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.62)', textWrap: 'pretty' }}>Crea una ruta a tu gusto: tú eliges los sitios y el orden, y compártela con tus amigos.</span>
          </span>
          <span style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', background: '#F1EADC', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icono nombre="lapiz" size={17} />
          </span>
        </button>
      </div>
    </>
  )
}
