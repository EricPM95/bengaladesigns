import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Emblema } from '../../dibujos'
import '../momentos.css'

/**
 * EL CINE DE LOS EMBLEMAS (Tanda 8B). Una escena de ~10 s por emblema, dibujada con SVG y CSS (sin vídeo ni GIF), sobre un lienzo de 390 × 844 que se ajusta
 * a la pantalla: se dibuja el sitio, una luz viaja hasta el centro, estalla y aparece el emblema con su nombre. Cada emblema tiene su archivo en esta carpeta y
 * se carga solo al abrirlo (`escenas/index.ts`). Toca la pantalla para ir directo al emblema; [Seguir] sigue.
 * Textos (nombre, línea, lugar) y colores salen de «Emblema Cine» del diseño.
 */

export const G = '#E9C77A'
export const GF = 'rgba(233,199,122,.55)'
const s2 = (n: number) => `${n.toFixed(2)}s`

export interface ConfigEscena {
  fondo: string
  /** Las dos frases que acompañan (texto, segundo en que entran, cuánto duran). */
  frases: { t: string; d: number; l: number }[]
  /** Altura (px del lienzo) donde salen las frases. */
  y: number
  /** De dónde sale la luz que llega al centro (por defecto, de arriba). */
  orbe?: { x: number; y: number; color?: string }
  halo?: string
  anillo?: string
  Arte: (p: { u: string }) => ReactNode
}

/** Textos por emblema (el diseño). Si el momento trae nombre y línea del servidor, mandan esos. */
export const TEXTOS: Record<string, { nombre: string; linea: string; lugar: string }> = {
  coliseo: { nombre: 'Una maravilla del mundo', linea: 'El mayor anfiteatro de la Antigüedad.', lugar: 'Coliseo · Roma' },
  panteon: { nombre: 'Bajo una cúpula de casi 2.000 años', linea: 'La mayor cúpula de hormigón sin armar del mundo.', lugar: 'Panteón · Roma' },
  fontana_de_trevi: { nombre: 'Volverás a Roma', linea: 'Dice la leyenda que quien lanza una moneda de espaldas, vuelve.', lugar: 'Fontana de Trevi · Roma' },
  foro_romano: { nombre: 'Donde empezó todo', linea: 'Aquí latía la antigua Roma: se votaba, se juzgaba y se comerciaba.', lugar: 'Foro Romano · Roma' },
  museos_vaticanos: { nombre: 'Bajo el techo de Miguel Ángel', linea: 'Miguel Ángel pintó la bóveda de la Sixtina en cuatro años, de 1508 a 1512.', lugar: 'Museos Vaticanos · Vaticano' },
  plaza_san_pedro: { nombre: 'La frontera que no se ve', linea: 'Acabas de cruzar una frontera sin darte cuenta.', lugar: 'Plaza de San Pedro · Vaticano' },
  basilica_san_pedro: { nombre: 'Sobre la tumba de San Pedro', linea: 'Bajo el altar mayor está, según la tradición, la tumba del apóstol.', lugar: 'Basílica de San Pedro · Vaticano' },
  boca_de_la_verdad: { nombre: 'Has dicho la verdad', linea: 'Cuenta la leyenda que muerde la mano de quien miente.', lugar: 'Boca de la Verdad · Roma' },
  ojo_cerradura: { nombre: 'Has mirado por la cerradura', linea: 'Por este agujero se ve la cúpula de San Pedro, enmarcada.', lugar: 'Ojo de la Cerradura · Aventino' },
  catacumbas: { nombre: 'La Roma de debajo', linea: 'Kilómetros de galerías donde se enterraron los primeros cristianos.', lugar: 'Catacumbas de San Calixto · Roma' },
  madrugador: { nombre: 'Madrugador', linea: 'Roma antes que nadie.', lugar: 'Roma' },
  nocturno: { nombre: 'Nocturno', linea: 'Roma con las luces encendidas.', lugar: 'Roma' },
}

/** Un trazo dorado que se dibuja solo. */
export function Trazo({ d, dl, l = 1.2, w = 2, c = G }: { d: string; dl: number; l?: number; w?: number; c?: string }): ReactNode {
  return <path d={d} pathLength={100} stroke={c} strokeWidth={w} style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: `ecDraw ${s2(l)} ${s2(dl)} cubic-bezier(.4,0,.2,1) both` }} />
}
/** Un trazo fantasma (punteado) que aparece despacio. */
export function Fantasma({ d, dl, da = '4 5', w = 1.4, c = GF }: { d: string; dl: number; da?: string; w?: number; c?: string }): ReactNode {
  return <path d={d} stroke={c} strokeWidth={w} strokeDasharray={da} style={{ opacity: 0, animation: `ecFade 1.2s ${s2(dl)} ease both` }} />
}
/** Polvo o luciérnagas que flotan. */
export function Polvo({ n = 16, x0 = 120, ancho = 150, y0 = 250, alto = 250, color = '#FFF3D6', dl = 0 }: { n?: number; x0?: number; ancho?: number; y0?: number; alto?: number; color?: string; dl?: number }): ReactNode {
  return (
    <>
      {Array.from({ length: n }, (_, k) => (
        <circle key={k} cx={x0 + ((k * 41) % ancho)} cy={y0 + ((k * 67) % alto)} r={1 + (k % 3) * 0.6} fill={color} style={{ opacity: 0, animation: `ecFade .8s ${s2(dl + (k % 5) * 0.4)} ease both, ecDust ${3 + (k % 4)}s ${s2((k % 5) * 0.4)} ease-in-out infinite` }} />
      ))}
    </>
  )
}
export function Estrellitas({ n, maxY }: { n: number; maxY: number }): ReactNode {
  return (
    <>
      {Array.from({ length: n }, (_, k) => (
        <circle key={k} cx={(((k * k * 7 + k * 37) % 100) * 3.9).toFixed(1)} cy={(((4 + ((k * k * 13 + k * 7) % 46)) * maxY) / 50).toFixed(1)} r={0.8 + (k % 3) * 0.5} fill="#FFFDF8" style={{ animation: `ecTw ${s2(2 + (k % 4) * 0.7)} ${s2((k % 5) * 0.4)} ease-in-out infinite` }} />
      ))}
    </>
  )
}

/** Un lienzo de 390 × 844 que se ajusta (sin deformar) al tamaño de la pantalla. */
export function Lienzo({ children }: { children: ReactNode }): ReactNode {
  const ref = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  useLayoutEffect(() => {
    const medir = () => {
      const el = ref.current
      if (!el) return
      setK(Math.max(0.5, Math.min(el.clientWidth / 390, el.clientHeight / 844)))
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 390, height: 844, marginLeft: -195, marginTop: -422, transform: `scale(${k})`, transformOrigin: 'center' }}>{children}</div>
    </div>
  )
}

export function sinMovimiento(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

export const estiloBoton: CSSProperties = { position: 'absolute', left: 26, right: 26, bottom: 'calc(env(safe-area-inset-bottom,0px) + 40px)', height: 54, border: 'none', borderRadius: 999, background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)', color: '#2A1D10', font: "700 15px 'Geist'", cursor: 'pointer', zIndex: 5 }
export const estiloSaltar: CSSProperties = { position: 'absolute', right: 8, top: 'calc(env(safe-area-inset-top,0px) + 14px)', minWidth: 60, height: 44, padding: '0 14px', border: 'none', background: 'transparent', color: 'rgba(255,253,248,.75)', font: "600 13px 'Geist'", cursor: 'pointer', zIndex: 6 }

/** Lo que se ve al final: el emblema, su nombre y su línea. `animado`: entra con el estallido; si no, ya está puesto (tras tocar para saltar). */
export function Revelacion({ id, nombre, linea, lugar, animado, base = 8, halo = 'rgba(255,226,160,.55)', anillo = '#F3D59A', cabecera = true }: { id: string; nombre: string; linea: string; lugar: string; animado: boolean; base?: number; halo?: string; anillo?: string; cabecera?: boolean }): ReactNode {
  const an = (nombreAnim: string, dur: string, t: number, extra = '') => (animado ? `${nombreAnim} ${dur} ${s2(t)} ${extra} both` : 'none')
  const op = animado ? 0 : 1
  return (
    <>
      {animado && (
        <>
          <span aria-hidden style={{ position: 'absolute', left: 115, top: 220, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF,rgba(255,255,255,.6) 30%,transparent 70%)', opacity: 0, animation: an('ecFlash', '1.1s', base, 'ease-out') }} />
          <span aria-hidden style={{ position: 'absolute', left: 120, top: 225, width: 150, height: 150, borderRadius: '50%', border: `2px solid ${anillo}`, opacity: 0, animation: an('ecShock', '1.4s', base, 'ease-out') }} />
        </>
      )}
      <div data-vuelo="logros" style={{ position: 'absolute', left: 97.5, top: 202.5, width: 195, height: 195, filter: `drop-shadow(0 0 24px ${halo})`, zIndex: 3, opacity: op, animation: an('ecEmb', '1.1s', base, 'cubic-bezier(.2,.8,.2,1)') }}>
        <Emblema id={id} animado tam={195} />
      </div>
      <div style={{ position: 'absolute', left: 26, right: 26, top: 432, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', color: '#FFFDF8' }}>
        {cabecera && <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#F3D59A', opacity: op, animation: an('ecUp', '.7s', base + 1.2) }}>¡Has descubierto un Emblema Oculto!</span>}
        <span style={{ font: "400 34px/1.05 'Instrument Serif',serif", textWrap: 'balance', opacity: op, animation: an('ecUp', '.7s', base + 1.45) }}>{nombre}</span>
        <span style={{ maxWidth: 310, font: "italic 400 18px/1.35 'Instrument Serif',serif", color: 'rgba(255,253,248,.8)', textWrap: 'balance', opacity: op, animation: an('ecUp', '.7s', base + 1.7) }}>{linea}</span>
        <span style={{ font: "500 11px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(255,253,248,.55)', opacity: op, animation: an('ecUp', '.7s', base + 1.7) }}>{lugar}</span>
      </div>
    </>
  )
}

interface PropsCine {
  id: string
  config: ConfigEscena
  nombre?: string | null
  linea?: string | null
  onSeguir: () => void
  onSaltarTodo?: (() => void) | null
}

/** La escena de cine de un emblema (la del Coliseo tiene la suya, `coliseo.tsx`). */
export default function CineEmblema({ id, config, nombre, linea, onSeguir, onSaltarTodo }: PropsCine): ReactNode {
  const t = TEXTOS[id] ?? { nombre: nombre ?? '', linea: linea ?? '', lugar: '' }
  const [fin, setFin] = useState(sinMovimiento())
  const [verBoton, setVerBoton] = useState(sinMovimiento())
  useEffect(() => {
    if (fin) {
      setVerBoton(true)
      return undefined
    }
    const h = window.setTimeout(() => setVerBoton(true), 10100)
    const h2 = window.setTimeout(() => setFin(true), 11200)
    return () => {
      window.clearTimeout(h)
      window.clearTimeout(h2)
    }
  }, [fin])
  const u = `ec${id}`
  const orbe = config.orbe ?? { x: 0, y: -300 }
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label={`Emblema: ${nombre ?? t.nombre}`} onClick={() => setFin(true)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: config.fondo, color: '#FFFDF8', fontFamily: "'Geist',system-ui,sans-serif", cursor: 'pointer', userSelect: 'none', overflow: 'hidden' }}>
      <Lienzo>
        {!fin && (
          <>
            <div style={{ position: 'absolute', inset: 0, animation: 'ecRecede 1.2s 7.6s ease both' }}>
              <svg width="390" height="844" viewBox="0 0 390 844" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', inset: 0 }}>
                <config.Arte u={u} />
              </svg>
            </div>
            <span aria-hidden style={{ position: 'absolute', left: 195, top: 300, width: 64, height: 64, margin: '-32px 0 0 -32px', borderRadius: '50%', background: `radial-gradient(circle,#FFFFFF 0%,${orbe.color ?? '#FFE7A8'} 35%,transparent 70%)`, ['--x0' as string]: `${orbe.x}px`, ['--y0' as string]: `${orbe.y}px`, opacity: 0, animation: 'ecOrb 1.2s 6.6s cubic-bezier(.4,0,.2,1) both, ecOrbOut .4s 8s ease forwards' } as CSSProperties} />
            {config.frases.map((f, i) => (
              <span key={i} style={{ position: 'absolute', left: 28, right: 28, top: config.y, textAlign: 'center', font: "italic 400 24px/1.25 'Instrument Serif',serif", color: '#F3E3B8', textWrap: 'balance', opacity: 0, animation: `ecPh ${s2(f.l)} ${s2(f.d)} ease both` }}>{f.t}</span>
            ))}
          </>
        )}
        <Revelacion id={id} nombre={nombre ?? t.nombre} linea={linea ?? t.linea} lugar={t.lugar} animado={!fin} halo={config.halo} anillo={config.anillo} />
      </Lienzo>
      {onSaltarTodo && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onSaltarTodo() }} style={estiloSaltar}>Saltar todo</button>
      )}
      {verBoton && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onSeguir() }} style={{ ...estiloBoton, opacity: fin ? 1 : 0, animation: fin ? 'none' : 'ecUp .7s ease both' }}>Seguir</button>
      )}
    </div>
  )
}
