import { useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ResumenDeExp } from './api'
import { chispasDeRango } from './chispas'
import { InicialEnMarco, MarcoDeRango } from './MarcoDeRango'
import { movimientoReducido } from './util'
import './perfil.css'

/**
 * CAMBIO DE RANGO (E4 de «Experiencia» en Design): el marco viejo tiembla y se da la vuelta, entra el marco nuevo con un fogonazo, aros y chispas, y se escribe «Ahora eres Explorador» letra a letra
 * con «Nivel 6» debajo. Sale justo después de la EXP ganada (o de subir de nivel) y se pasa tocando. Solo presentación: quien la use decide cuándo.
 *
 * Props:
 *   antes    `ResumenDeExp` de antes del cambio (su marco viejo, normalmente en la última estrella del rango).
 *   despues  `ResumenDeExp` de después (el rango nuevo, su marco y su nombre, que salen del servidor).
 *   onFin    se llama al tocarla (una vez).
 *   inicial  la letra que va dentro del marco.
 * Con «reducir movimiento» sale ya puesta, con el marco nuevo y el texto, sin movimiento.
 */
const SEGUNDOS = 9

export function CambioDeRango({ antes, despues, onFin, inicial = 'V' }: { antes: ResumenDeExp; despues: ResumenDeExp; onFin?: () => void; inicial?: string }): ReactNode {
  const quieto = movimientoReducido()
  const llamado = useRef(false)
  const acabar = () => {
    if (llamado.current) return
    llamado.current = true
    onFin?.()
  }
  const a = (nombre: string, retraso = ''): CSSProperties => (quieto ? {} : { animation: `${nombre} ${SEGUNDOS}s ${retraso} ease both` })
  const marco = (r: ResumenDeExp) => (
    <MarcoDeRango rango={r.rango_ix} estrellas={r.estrellas} leyenda={r.leyenda_estrellas} tam={250}>
      <InicialEnMarco letra={inicial} tam={250} />
    </MarcoDeRango>
  )
  const texto = `Ahora eres ${despues.rango}`
  return createPortal(
    <div
      data-cambio-de-rango
      role="dialog"
      aria-modal="true"
      aria-label={texto}
      onClick={acabar}
      style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'radial-gradient(circle at 50% 38%,#2E3550 0%,#10131F 74%)', color: '#FFFDF8', overflow: 'hidden', cursor: 'pointer', fontFamily: "'Geist',system-ui,sans-serif", WebkitTapHighlightColor: 'transparent', ...(quieto ? {} : { animation: 'pfEntra .4s ease both' }) }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', top: 70, left: '50%', width: 520, height: 520, marginLeft: -260, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(243,213,154,.18) 0 5deg,transparent 5deg 16deg)', WebkitMaskImage: 'radial-gradient(circle,#000 18%,transparent 64%)', maskImage: 'radial-gradient(circle,#000 18%,transparent 64%)', ...(quieto ? {} : { animation: `pfRayos 20s linear infinite, pfBrillo ${SEGUNDOS}s ease both` }) }} />
      <div style={{ position: 'absolute', left: '50%', top: 150, width: 0, height: 0 }}>
        <span style={{ position: 'absolute', left: -125, top: -136, ...(quieto ? { opacity: 0 } : a('pfRangoViejo')) }}>{marco(antes)}</span>
        <span style={{ position: 'absolute', left: -125, top: -136, opacity: quieto ? 1 : 0, ...a('pfRangoNuevo') }}>{marco(despues)}</span>
        {!quieto && (
          <>
            <span aria-hidden="true" style={{ position: 'absolute', left: -150, top: -150, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF,rgba(255,240,200,.7) 36%,transparent 70%)', opacity: 0, animation: `pfRangoFogonazo ${SEGUNDOS}s ease-out both` }} />
            {[
              ['3px', '0s'],
              ['2px', '.18s'],
              ['1.5px', '.36s'],
            ].map(([w, d]) => (
              <span key={d} aria-hidden="true" style={{ position: 'absolute', left: -90, top: -90, width: 180, height: 180, borderRadius: '50%', border: `${w} solid #F3D59A`, boxShadow: '0 0 18px rgba(243,213,154,.6)', opacity: 0, animation: `pfRangoAro ${SEGUNDOS}s ${d} ease-out both` }} />
            ))}
            {chispasDeRango.map((c, i) => (
              <span key={i} aria-hidden="true" style={{ position: 'absolute', left: -3, top: -3, width: c.tam, height: c.tam, borderRadius: '50%', background: c.color, boxShadow: '0 0 10px #FFE7B0', opacity: 0, ['--dx' as string]: c.dx, ['--dy' as string]: c.dy, animation: `pfChispa ${SEGUNDOS}s ease-out both` }} />
            ))}
          </>
        )}
      </div>
      <div style={{ position: 'absolute', left: 24, right: 24, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#F3D59A', ...a('pfLetra') }}>Nuevo rango</span>
        <span style={{ font: "400 40px/1.1 'Instrument Serif',serif", textWrap: 'balance' }}>
          {[...texto].map((ch, i) => (
            <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: quieto ? 1 : 0, ...a('pfLetra', `${(0.1 + i * 0.045).toFixed(2)}s`) }}>
              {ch}
            </span>
          ))}
        </span>
        <span style={{ font: "italic 400 17px/1.35 'Instrument Serif',serif", color: 'rgba(255,253,248,.75)', ...a('pfLetra', '.35s') }}>Nivel {despues.nivel}</span>
      </div>
      <span style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(env(safe-area-inset-bottom,0px) + 40px)', textAlign: 'center', font: "400 11.5px 'Geist'", color: 'rgba(255,253,248,.45)' }}>Toca para seguir</span>
    </div>,
    document.body,
  )
}
