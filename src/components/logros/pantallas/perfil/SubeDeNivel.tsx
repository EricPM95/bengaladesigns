import { useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ResumenDeExp } from './api'
import { chispasDeNivel } from './chispas'
import { InicialEnMarco, MarcoDeRango } from './MarcoDeRango'
import { movimientoReducido } from './util'
import './perfil.css'

/**
 * SUBIR DE NIVEL (E3 de «Experiencia» en Design): pantalla oscura con rayos; el marco con una estrella más, la barra que se llena y vuelve a empezar, «¡Subes de nivel!» y «Nivel 7» que se convierte en «Nivel 8».
 * Sale justo después de la EXP ganada y se pasa tocando («Toca para seguir»). Solo presentación: quien la use decide cuándo.
 *
 * Props:
 *   antes    `ResumenDeExp` de antes de subir (el nivel viejo y su marco).
 *   despues  `ResumenDeExp` de después (el nivel nuevo, con una estrella más).
 *   onFin    se llama al tocarla (una vez).
 *   inicial  la letra que va dentro del marco.
 * Si además cambia el rango, no se usa esta: se usa `CambioDeRango`.
 * Con «reducir movimiento» sale ya puesta, con el nivel nuevo, sin movimiento.
 */
const SEGUNDOS = 8

const pct = (e: ResumenDeExp) => (e.exp_para_siguiente > 0 ? Math.max(0, Math.min(100, (e.exp_en_nivel / e.exp_para_siguiente) * 100)) : 0)

export function SubeDeNivel({ antes, despues, onFin, inicial = 'V' }: { antes: ResumenDeExp; despues: ResumenDeExp; onFin?: () => void; inicial?: string }): ReactNode {
  const quieto = movimientoReducido()
  const llamado = useRef(false)
  const acabar = () => {
    if (llamado.current) return
    llamado.current = true
    onFin?.()
  }
  const a = (nombre: string): CSSProperties => (quieto ? {} : { animation: `${nombre} ${SEGUNDOS}s ease both` })
  const marco = (r: ResumenDeExp) => (
    <MarcoDeRango rango={r.rango_ix} estrellas={r.estrellas} leyenda={r.leyenda_estrellas} tam={250}>
      <InicialEnMarco letra={inicial} tam={250} />
    </MarcoDeRango>
  )
  return createPortal(
    <div
      data-sube-de-nivel
      role="dialog"
      aria-modal="true"
      aria-label={`¡Subes de nivel! Nivel ${despues.nivel}`}
      onClick={acabar}
      style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'radial-gradient(circle at 50% 38%,#2E3550 0%,#141826 72%)', color: '#FFFDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 28px', textAlign: 'center', cursor: 'pointer', fontFamily: "'Geist',system-ui,sans-serif", overflow: 'hidden', WebkitTapHighlightColor: 'transparent', ...(quieto ? {} : { animation: 'pfEntra .4s ease both' }) }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', top: 96, left: '50%', width: 420, height: 420, marginLeft: -210, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(243,213,154,.14) 0 7deg,transparent 7deg 22deg)', WebkitMaskImage: 'radial-gradient(circle,#000 22%,transparent 66%)', maskImage: 'radial-gradient(circle,#000 22%,transparent 66%)', ...(quieto ? {} : { animation: 'pfRayos 26s linear infinite' }) }} />
      <div style={{ position: 'relative', width: 250, height: 273, ...a('pfMarcoEntra') }}>
        <span style={{ position: 'absolute', left: 0, top: 0, ...(quieto ? { opacity: 0 } : a('pfMarcoViejo')) }}>{marco(antes)}</span>
        <span style={{ position: 'absolute', left: 0, top: 0, opacity: quieto ? 1 : 0, ...a('pfMarcoNuevo') }}>{marco(despues)}</span>
        <span aria-hidden="true" style={{ position: 'absolute', left: 125, top: 257, width: 0, height: 0 }}>
          {!quieto && (
            <span style={{ position: 'absolute', left: -26, top: -26, width: 52, height: 52, opacity: 0, animation: `pfEstrellaVuela ${SEGUNDOS}s ease-in both` }}>
              <svg width="52" height="52" viewBox="-10 -10 20 20">
                <defs>
                  <radialGradient id="pfsg">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset=".5" stopColor="#FFF1B8" />
                    <stop offset="1" stopColor="#E3B13F" />
                  </radialGradient>
                </defs>
                <path d="M0 -9L2.5 -3L9 -2.3L4 2L5.6 8.4L0 5L-5.6 8.4L-4 2L-9 -2.3L-2.5 -3Z" fill="url(#pfsg)" stroke="#B5821C" strokeWidth=".8" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          {!quieto &&
            chispasDeNivel.map((c, i) => (
              <span key={i} style={{ position: 'absolute', left: -3, top: -3, width: c.tam, height: c.tam, borderRadius: '50%', background: c.color, boxShadow: '0 0 8px #FFE7B0', opacity: 0, ['--dx' as string]: c.dx, ['--dy' as string]: c.dy, animation: `pfChispa ${SEGUNDOS}s ease-out both` }} />
            ))}
        </span>
      </div>
      <span style={{ width: 250, height: 9, borderRadius: 9, background: 'rgba(255,253,248,.14)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', borderRadius: 9, background: 'linear-gradient(90deg,#E3B13F,#FFF1B8)', ['--b0' as string]: `${pct(antes).toFixed(1)}%`, ['--b1' as string]: `${pct(despues).toFixed(1)}%`, width: quieto ? `${pct(despues).toFixed(1)}%` : undefined, ...a('pfBarra') }} />
      </span>
      <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#F3D59A' }}>¡Subes de nivel!</span>
      <span style={{ position: 'relative', height: 52, width: '100%' }}>
        <span style={{ position: 'absolute', inset: 0, font: "400 46px/1.1 'Instrument Serif',serif", ...(quieto ? { opacity: 0 } : a('pfNivelVa')) }}>Nivel {antes.nivel}</span>
        <span style={{ position: 'absolute', inset: 0, font: "400 46px/1.1 'Instrument Serif',serif", opacity: quieto ? 1 : 0, ...a('pfNivelViene') }}>Nivel {despues.nivel}</span>
      </span>
      <span style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom,0px) + 40px)', font: "400 11.5px 'Geist'", color: 'rgba(255,253,248,.45)' }}>Toca para seguir</span>
    </div>,
    document.body,
  )
}
