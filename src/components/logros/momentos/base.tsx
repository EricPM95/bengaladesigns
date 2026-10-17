import type { CSSProperties, ReactNode } from 'react'
import './momentos.css'

/** Lo común de las pantallas oscuras de los momentos: fondo, estrellas, rayos, [Saltar todo], textos y el botón [Seguir]. Todo sale de «Logros · Momentos». */
export const ORO = '#F3D59A'
export const FONDO_NOCHE = 'radial-gradient(circle at 50% 36%,#2E3550 0%,#141826 68%)'
export const FONDO_CALIDO = 'radial-gradient(circle at 50% 36%,#3A3026 0%,#17120E 70%)'

export const estrellas = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ x: `${(i * 37 + 11) % 100}%`, y: `${(i * 53 + 7) % 72}%`, s: 1 + (i % 3), d: 2 + (i % 4) }))

export function Estrellas({ n = 24 }: { n?: number }): ReactNode {
  return (
    <>
      {estrellas(n).map((s, i) => (
        <span key={i} aria-hidden style={{ position: 'absolute', left: s.x, top: s.y, width: s.s, height: s.s, borderRadius: '50%', background: '#FFFDF8', opacity: 0.2, animation: `moTw ${s.d}s ${(i % 5) * 0.3}s ease-in-out infinite` }} />
      ))}
    </>
  )
}

export function Rayos({ color = 'rgba(255,225,170,.2)', halo = 'rgba(255,215,160,.45)' }: { color?: string; halo?: string }): ReactNode {
  return (
    <>
      <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: '50%', top: '36%', width: 520, height: 520, margin: '-260px 0 0 -260px', borderRadius: '50%', background: `repeating-conic-gradient(${color} 0 6deg,transparent 6deg 20deg)`, WebkitMaskImage: 'radial-gradient(circle,#000 20%,transparent 66%)', maskImage: 'radial-gradient(circle,#000 20%,transparent 66%)', animation: 'moRays 40s linear infinite' }} />
      <span aria-hidden style={{ position: 'absolute', left: '50%', top: '36%', width: 320, height: 320, margin: '-160px 0 0 -160px', borderRadius: '50%', background: `radial-gradient(circle,${halo},transparent 68%)`, animation: 'moGlow 3.4s ease-in-out infinite' }} />
    </>
  )
}

interface PropsPantalla {
  fondo?: string
  /** Etiqueta para lectores de pantalla. */
  etiqueta: string
  onSeguir: () => void
  onSaltarTodo?: (() => void) | null
  /** Para la barra de arriba de «Un solo Visto, muchas cosas»: cuántas pantallas hay y en cuál vamos. */
  paso?: { actual: number; total: number } | null
  cta?: string | null
  ctaEn?: string
  children: ReactNode
}

export function PantallaOscura({ fondo = FONDO_CALIDO, etiqueta, onSeguir, onSaltarTodo, paso, cta = 'Seguir', ctaEn = '1.8s', children }: PropsPantalla): ReactNode {
  return (
    <div
      role="dialog"
      aria-label={etiqueta}
      aria-modal="true"
      onClick={onSeguir}
      className="mo"
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: fondo, color: '#FFFDF8', overflow: 'hidden', fontFamily: "'Geist',system-ui,sans-serif", textAlign: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {paso && paso.total > 1 && (
        <div style={{ position: 'absolute', left: 16, right: 96, top: 'calc(env(safe-area-inset-top,0px) + 30px)', display: 'flex', gap: 4 }} aria-hidden>
          {Array.from({ length: paso.total }, (_, i) => (
            <span key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= paso.actual ? ORO : 'rgba(255,253,248,.2)' }} />
          ))}
        </div>
      )}
      {onSaltarTodo && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSaltarTodo()
          }}
          style={{ position: 'absolute', right: 8, top: 'calc(env(safe-area-inset-top,0px) + 14px)', minWidth: 60, height: 44, padding: '0 14px', border: 'none', background: 'transparent', color: 'rgba(255,253,248,.75)', font: "600 13px 'Geist'", cursor: 'pointer', zIndex: 5 }}
        >
          Saltar todo
        </button>
      )}
      {children}
      {cta && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSeguir()
          }}
          style={{ position: 'absolute', left: 26, right: 26, bottom: 'calc(env(safe-area-inset-bottom,0px) + 40px)', height: 54, border: 'none', borderRadius: 999, background: 'linear-gradient(110deg,#D9BE85,#F3E3B8 50%,#D9BE85)', color: '#2A1D10', font: "700 15px 'Geist'", cursor: 'pointer', opacity: 0, animation: `moUp .7s ${ctaEn} ease both`, zIndex: 5 }}
        >
          {cta}
        </button>
      )}
    </div>
  )
}

export const Ojo = ({ children, color = ORO, en = '1.5s' }: { children: ReactNode; color?: string; en?: string }): ReactNode => (
  <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color, opacity: 0, animation: `moUp .7s ${en} ease both`, padding: '0 24px' }}>{children}</span>
)
export const Titulo = ({ children, en = '1.7s', tam = 34 }: { children: ReactNode; en?: string; tam?: number }): ReactNode => (
  <span style={{ font: `400 ${tam}px/1.05 'Instrument Serif',serif`, textWrap: 'balance', opacity: 0, animation: `moUp .7s ${en} ease both`, padding: '0 24px' }}>{children}</span>
)
export const Sub = ({ children, en = '1.9s' }: { children: ReactNode; en?: string }): ReactNode => (
  <span style={{ maxWidth: 320, font: "italic 400 18px/1.35 'Instrument Serif',serif", color: 'rgba(255,253,248,.8)', textWrap: 'balance', opacity: 0, animation: `moUp .7s ${en} ease both`, padding: '0 24px' }}>{children}</span>
)

/** Zona central de una pantalla: dibujo arriba y textos debajo. */
export function Centro({ children, estilo }: { children: ReactNode; estilo?: CSSProperties }): ReactNode {
  return <div style={{ position: 'relative', flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 110, ...estilo }}>{children}</div>
}

/** Lo que vuela al botón cuando se pasa a la siguiente pantalla (el reproductor lo busca por `data-vuelo`). */
export function Vuelo({ children, estilo }: { children: ReactNode; estilo?: CSSProperties }): ReactNode {
  return (
    <div data-vuelo="" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', ...estilo }}>
      {children}
    </div>
  )
}
