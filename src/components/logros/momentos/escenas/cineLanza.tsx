import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Emblema } from '../../dibujos'
import '../momentos.css'
import './lanza/lanza.css'
import { estiloBoton, estiloSaltar, Lienzo, sinMovimiento } from './cine'

/**
 * EL CINE DE LOS EMBLEMAS DE LANZAROTE (Tanda V3, «Emblemas Lanza Cine» y «Piezas/Emblema Cine Lanza» de Design). Hermano de `cine.tsx` (el de Roma): el mismo lienzo de 390 × 844,
 * el mismo [Seguir] y el mismo «toca para ir directo al emblema», pero con la línea de tiempo de Design para Lanzarote (≈ 14 s):
 *   0,2 s   la frase de suspense (sola, sobre el fondo);       3,2 a 9 s   el sitio dibujándose, con sus dos frases (a los 3,8 y a los 7 s);
 *   10 s    la escena se aleja y una luz converge al centro;   11 s        el emblema emerge;   12,6 s su nombre;   13,4 s su línea.
 * Cada escena es un archivo de `escenas/lanza/` (generado desde Design con `scripts/destino/generarEscenasLanza.mjs`) y se carga solo al abrirla.
 * `primeraVez`: con la frase de suspense (lo de la primera vez). Si no (al tocar un emblema ya guardado), la película empieza directa en el sitio, sin esos 3 s de suspense.
 */
export interface ConfigLanza {
  tipo: 'lanza'
  id: string
  nombre: string
  linea: string
  bg: string
  halo: string
  frase: string
  c1: string
  c2: string
  /** El dibujo del sitio (SVG de 390 × 844). `§` se sustituye por un id único para sus gradientes. */
  svg: string
}

/** Lo que dura la frase de suspense antes de que el sitio empiece a dibujarse (Design: el primer dibujo entra a los 3,2 s). */
export const SUSPENSE_S = 3
/** Cuándo entra el botón [Seguir] (la línea del emblema entra a los 13,4 s y dura 0,9). */
export const SEGUIR_S = 14.3

const frase: CSSProperties = { position: 'absolute', left: 28, right: 28, top: 722, font: "italic 400 24px/1.25 'Instrument Serif',serif", color: '#F3E3B8', textShadow: '0 2px 12px rgba(0,0,0,.7)', textAlign: 'center', textWrap: 'balance', opacity: 0 }

export default function CineLanza({ config, primeraVez = false, onSeguir, onSaltarTodo }: { config: ConfigLanza; primeraVez?: boolean; onSeguir: () => void; onSaltarTodo?: (() => void) | null }): ReactNode {
  const t0 = primeraVez ? 0 : SUSPENSE_S
  const [fin, setFin] = useState(sinMovimiento())
  const [verBoton, setVerBoton] = useState(sinMovimiento())
  const u = 'lz' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const raiz = useRef<HTMLDivElement>(null)
  const svg = useMemo(() => config.svg.split('§').join(u), [config.svg, u])
  const particulas = useMemo(
    () =>
      Array.from({ length: 18 }, (_, k) => {
        const a = (k / 18) * Math.PI * 2 + 0.3
        const r = 150 + (k % 4) * 50
        return { s: 3 + (k % 3), dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r * 1.2), at: 9.9 + (k % 6) * 0.14 }
      }),
    [],
  )

  // Sin suspense, la película empieza ya en el sitio: todas las animaciones se adelantan lo que dura la frase.
  useLayoutEffect(() => {
    if (t0 === 0 || fin) return
    for (const a of raiz.current?.getAnimations({ subtree: true }) ?? []) a.currentTime = t0 * 1000
  }, [t0, fin])

  useEffect(() => {
    if (fin) {
      setVerBoton(true)
      return undefined
    }
    const h = window.setTimeout(() => setVerBoton(true), (SEGUIR_S - t0) * 1000)
    const h2 = window.setTimeout(() => setFin(true), (SEGUIR_S - t0) * 1000 + 1100)
    return () => {
      window.clearTimeout(h)
      window.clearTimeout(h2)
    }
  }, [fin, t0])

  const an = (nombre: string, dur: string, at: number, extra = '') => (fin ? 'none' : `${nombre} ${dur} ${at}s ${extra} both`)
  const op = fin ? 1 : 0
  return (
    <div ref={raiz} className="mo" data-escena-lanza={config.id} data-fin={fin ? '1' : '0'} role="dialog" aria-modal="true" aria-label={`Emblema: ${config.nombre}`} onClick={() => setFin(true)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: config.bg, color: '#FFFDF8', fontFamily: "'Geist',system-ui,sans-serif", cursor: 'pointer', userSelect: 'none', overflow: 'hidden', textAlign: 'center' }}>
      <Lienzo>
        {!fin && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {primeraVez && <span data-frase-suspense="" style={{ position: 'absolute', left: 30, right: 30, top: 330, font: "italic 400 34px/1.15 'Instrument Serif',serif", color: '#F3E3B8', textWrap: 'balance', opacity: 0, animation: 'lzPhrase 3s .2s ease both' }}>{config.frase}</span>}
            <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 52%', animation: 'lzRecede 1.6s 10s ease both' }}>
              <svg width="390" height="844" viewBox="0 0 390 844" style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
            <div style={{ position: 'absolute', left: 195, top: 440, width: 0, height: 0 }}>
              {particulas.map((q, i) => (
                <span key={i} style={{ position: 'absolute', left: -3, top: -3, width: q.s, height: q.s, borderRadius: '50%', background: '#FFE7B0', boxShadow: '0 0 10px #FFD58A', ['--dx' as string]: `${q.dx}px`, ['--dy' as string]: `${q.dy}px`, opacity: 0, animation: `lzConv 1.4s ${q.at.toFixed(2)}s cubic-bezier(.5,0,.8,.6) both` } as CSSProperties} />
              ))}
              <span style={{ position: 'absolute', left: -60, top: -60, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF 12%,rgba(255,226,160,.8) 40%,transparent 70%)', opacity: 0, animation: 'lzCore 1.5s 10.7s ease-out both' }} />
            </div>
            <span style={{ ...frase, animation: 'lzCap 3.2s 3.8s ease both' }}>{config.c1}</span>
            <span style={{ ...frase, animation: 'lzCap 3.2s 7s ease both' }}>{config.c2}</span>
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div data-vuelo="logros" style={{ position: 'relative', width: 300, height: 240, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op, animation: an('lzEmerge', '1.7s', 11, 'ease-out') }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle,${config.halo},transparent 66%)`, opacity: fin ? 0.55 : 0, transform: fin ? 'scale(1.15)' : undefined, animation: an('lzHalo', '2s', 11, 'ease') }} />
            <div style={{ position: 'relative', width: 240, height: 240, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Emblema id={config.id} animado tam={285} />
            </div>
          </div>
          <span data-titulo="" style={{ font: "400 36px/1.05 'Instrument Serif',serif", textWrap: 'balance', padding: '0 24px', opacity: op, animation: an('lzUp', '.9s', 12.6, 'ease') }}>{config.nombre}</span>
          <span data-linea="" style={{ maxWidth: 310, font: "400 15.5px/1.45 'Geist',sans-serif", color: 'rgba(255,253,248,.85)', textWrap: 'pretty', opacity: op, animation: an('lzUp', '.9s', 13.4, 'ease') }}>{config.linea}</span>
        </div>
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
