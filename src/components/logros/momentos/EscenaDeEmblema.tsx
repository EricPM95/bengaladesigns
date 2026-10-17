import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import './momentos.css'

/**
 * LA ESCENA DE UN EMBLEMA (Tanda 8B). Es lo que sale al descubrirlo y lo que se repite al tocar un emblema guardado (la 8c lo usa así):
 *
 *   <EscenaDeEmblema id="panteon" primeraVez={false} onSeguir={cerrar} />
 *
 * - `primeraVez` + `frase` (las trae el momento del servidor): antes de la escena sale la frase de suspense («¡Eh! Aquí hay algo…») con su espera. Al volver a verlo
 *   guardado (`primeraVez` falso), sin frase ni suspense: va directo a la escena.
 * - La película del Coliseo («Casi 2.000 años esperándote…») sale SIEMPRE entera, también al repetirla: es su principio, no una frase de suspense.
 * - Cada escena está en su archivo (`escenas/`) y se carga solo al abrirla.
 * Ocupa toda la pantalla (fija, por encima de todo). `onSeguir` se llama al pulsar [Seguir].
 */
export interface PropsEscena {
  id: string
  primeraVez?: boolean
  frase?: string | null
  nombre?: string | null
  linea?: string | null
  onSeguir: () => void
  onSaltarTodo?: (() => void) | null
}

const Pelicula = lazy(() => import('./escenas/coliseo'))
const Cine = lazy(() => import('./escenas/cine'))

const ESCENAS = () => import('./escenas/index')

function Negro(): ReactNode {
  return <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#0C0A08' }} />
}

function Escena({ id, nombre, linea, onSeguir, onSaltarTodo }: PropsEscena): ReactNode {
  const [config, setConfig] = useState<import('./escenas/cine').ConfigEscena | null | undefined>(undefined)
  useEffect(() => {
    let vivo = true
    void ESCENAS().then(async (m) => {
      const cargar = m.ESCENAS[id]
      if (!cargar) return vivo && setConfig(null)
      const mod = await cargar()
      if (vivo) setConfig(mod.default)
    })
    return () => {
      vivo = false
    }
  }, [id])
  if (config === undefined) return <Negro />
  const base: import('./escenas/cine').ConfigEscena = config ?? { fondo: 'radial-gradient(circle at 50% 40%,#2E3550 0%,#141826 70%)', frases: [], y: 700, Arte: () => null }
  return <Cine id={id} config={base} nombre={nombre} linea={linea} onSeguir={onSeguir} onSaltarTodo={onSaltarTodo} />
}

/** La espera de antes del emblema: la frase al azar, una luz que late cada vez más rápido y estalla (≈ 3,2 s). Se salta tocando. */
function Suspense3({ frase, alTerminar }: { frase: string; alTerminar: () => void }): ReactNode {
  const aros = [0.75, 1.47, 2.05, 2.5, 2.82]
  const conv = useMemo(
    () =>
      Array.from({ length: 18 }, (_, k) => {
        const a = (k / 18) * Math.PI * 2 + (k % 2) * 0.17
        const r = 150 + (k % 3) * 40
        return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, s: 2 + (k % 3), l: 1.3 + (k % 4) * 0.25, d: 0.6 + (k % 6) * 0.28 }
      }),
    [],
  )
  useEffect(() => {
    const h = window.setTimeout(alTerminar, 3600)
    return () => window.clearTimeout(h)
  }, [alTerminar])
  return (
    <div className="mo" onClick={alTerminar} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#0C0A08', color: '#FFFDF8', cursor: 'pointer', overflow: 'hidden' }} aria-live="polite">
      {/* Los rayos que giran (van creciendo con la espera) y el viñeteado que oscurece los bordes, como en «Logros · Momentos» */}
      <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: '50%', top: '55%', width: 760, height: 760, margin: '-380px 0 0 -380px', borderRadius: '50%', background: 'repeating-conic-gradient(rgba(243,213,154,.16) 0 5deg,transparent 5deg 18deg)', WebkitMaskImage: 'radial-gradient(circle,#000 8%,transparent 62%)', maskImage: 'radial-gradient(circle,#000 8%,transparent 62%)', opacity: 0, animation: 'ecIRays 3.2s ease-in both, moRays 14s linear infinite' }} />
      <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 55%,transparent 38%,rgba(0,0,0,.72) 100%)', pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', left: 24, right: 24, top: '28%', textAlign: 'center', font: "italic 400 34px/1.15 'Instrument Serif',serif", color: '#F3E3B8', textWrap: 'balance', opacity: 0, animation: 'ecIPhrase 3.2s ease both' }}>{frase}</span>
      <div style={{ position: 'absolute', left: '50%', top: '55%', width: 0, height: 0 }}>
        {aros.map((d, i) => (
          <span key={i} style={{ position: 'absolute', left: -40, top: -40, width: 80, height: 80, borderRadius: '50%', border: `${1.5 + i * 0.5}px solid #F3D59A`, boxShadow: '0 0 12px rgba(243,213,154,.6)', opacity: 0, animation: `ecIRing ${(1.1 - d * 0.12).toFixed(2)}s ${d}s cubic-bezier(.2,.7,.3,1) both` }} />
        ))}
        {conv.map((p, i) => (
          <span key={i} style={{ position: 'absolute', left: -2, top: -2, width: p.s, height: p.s, borderRadius: '50%', background: '#FFE7B0', boxShadow: '0 0 8px #FFD58A', ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, opacity: 0, animation: `moConv ${p.l}s ${p.d}s cubic-bezier(.5,0,.8,.6) both` } as CSSProperties} />
        ))}
        <span style={{ position: 'absolute', left: -90, top: -90, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,226,160,.75),rgba(255,200,120,.2) 40%,transparent 70%)', opacity: 0, animation: 'ecIHalo 3.2s ease-in both' }} />
        <span onAnimationEnd={(e) => e.animationName === 'ecICore' && alTerminar()} style={{ position: 'absolute', left: -9, top: -9, width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle,#FFFFFF 30%,#FFE3A8 60%,#F3C46A)', boxShadow: '0 0 18px #FFD58A,0 0 40px rgba(255,200,120,.7)', opacity: 0, animation: 'ecICore 3.2s ease-in-out both' }} />
      </div>
    </div>
  )
}

export function EscenaDeEmblema(props: PropsEscena): ReactNode {
  const { id, primeraVez = false, frase = null } = props
  const sinMov = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const conSuspense = primeraVez && Boolean(frase) && id !== 'coliseo' && !sinMov
  const [espera, setEspera] = useState(conSuspense)
  if (espera && frase) return <Suspense3 frase={frase} alTerminar={() => setEspera(false)} />
  return (
    <Suspense fallback={<Negro />}>
      {id === 'coliseo' ? <Pelicula nombre={props.nombre} linea={props.linea} onSeguir={props.onSeguir} onSaltarTodo={props.onSaltarTodo} /> : <Escena {...props} />}
    </Suspense>
  )
}

export default EscenaDeEmblema
