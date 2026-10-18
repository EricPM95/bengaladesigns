import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { logrosActivos } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { Sello, type GradoDeSello } from '../dibujos'
import { pedirEstado, type EstadoLogros } from './api'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'

/**
 * EL BOTÓN FLOTANTE DE LOS LOGROS (Tanda 8B, «Logros · el botón del destino»; 8C2: sus estados). Fijo abajo a la derecha, justo encima de la barra de pestañas:
 * un círculo blanco de 58 px con el sello de la ciudad dentro y un aro que marca el avance del sello. Se monta una vez por pantalla del viaje:
 *
 *     <BotonFlotanteLogros />
 *
 * - Con los logros apagados no se monta nada. Solo se ve en RUTA, DÍAS y HOY (`soloEn` lo cambia). En HOY sube un poco para no tapar [✓ Visto].
 * - Sus estados: antes del viaje (el sello en gris y el aro a rayas), bronce, plata, oro y diamante (el aro llena lo que lleva) y con algo nuevo sin ver (el puntito).
 * - Si se vio la animación de lo ganado, el botón late (lo hace el vuelo) y no hay puntito; si se saltó, lleva el puntito (`useLogrosStore.puntito`).
 * - Al tocarlo abre la hoja de logros (`HojaLogros`).
 * - Si hay dos montados a la vez (DÍAS y HOY), solo dibuja el primero: nunca salen dos botones.
 */
export const COLOR_DE_GRADO: Record<string, string> = { bronce: '#A8734A', plata: '#8F969E', oro: '#B8964F', diamante: '#7F93C9' }
const CIRCUNFERENCIA = 163

const montados: string[] = []
const oyentes = new Set<() => void>()
function useSoyElPrimero(): boolean {
  const id = useId()
  const [, repintar] = useState(0)
  useEffect(() => {
    montados.push(id)
    const avisar = () => repintar((x) => x + 1)
    oyentes.add(avisar)
    oyentes.forEach((f) => f())
    return () => {
      montados.splice(montados.indexOf(id), 1)
      oyentes.delete(avisar)
      oyentes.forEach((f) => f())
    }
  }, [id])
  return montados[0] === id
}

/** Lo de dentro del botón: el aro de avance, el sello y el puntito. Se dibuja igual en el botón de verdad y en la hoja de estados del escaparate. */
export function BotonVisual({ sello, grado, fraccion, puntito, animado = true }: { sello: string; grado: GradoDeSello | null; fraccion: number; puntito: boolean; animado?: boolean }): ReactNode {
  const color = grado ? COLOR_DE_GRADO[grado] : 'transparent'
  return (
    <>
      <svg width="58" height="58" viewBox="0 0 62 62" aria-hidden style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="31" cy="31" r="26" fill="none" stroke="rgba(28,34,48,.1)" strokeWidth="3.5" strokeDasharray={grado ? undefined : '4 3'} />
        <circle cx="31" cy="31" r="26" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={CIRCUNFERENCIA} strokeDashoffset={CIRCUNFERENCIA * (1 - fraccion)} style={animado ? { animation: 'moAro 1.4s .3s ease both' } : undefined} />
      </svg>
      <span style={{ position: 'absolute', left: 10, top: 10, opacity: grado ? 1 : 0.5 }}>
        <Sello id={sello} grado={grado ?? 'bronce'} apagado={!grado} tam={38} etiqueta={false} />
      </span>
      {puntito && <span aria-hidden style={{ position: 'absolute', right: 1, top: 1, width: 14, height: 14, borderRadius: '50%', background: 'oklch(0.55 0.17 5)', animation: 'moPuntito 1.8s ease-in-out infinite' }} />}
    </>
  )
}

export function BotonFlotanteLogros({ soloEn = ['route', 'days', 'today'] }: { soloEn?: string[] }): ReactNode {
  if (!logrosActivos()) return null
  return <Boton soloEn={soloEn} />
}

/** Lo que el botón no puede tapar en HOY: los botones de las tarjetas ([Visto], [No me da tiempo], [Seguir]…). */
const BOTONES_DE_HOY = '[data-hoy-siguiente] button, [data-hoy-siguiente] a, [data-hoy-llegada-tarde] button, [data-hoy-todo-visto] button, [data-hoy-llegada] button'

/**
 * En HOY, cuánto hay que subir el botón para que no tape ningún botón de las tarjetas: si lo pisa, se coloca justo encima del más alto que pise (hasta 3 pasadas). Se
 * recalcula al mover la pantalla, al girar y cada medio segundo (la tarjeta cambia de alto sola). Fuera de HOY no hace nada.
 */
function useSubirParaNoTapar(activo: boolean, base: number, lado: number): number | null {
  const [alto, setAlto] = useState<number | null>(null)
  const cuadro = useRef(0)
  useEffect(() => {
    if (!activo) {
      setAlto(null)
      return undefined
    }
    const medir = () => {
      cuadro.current = 0
      const vh = window.innerHeight
      const botones = Array.from(document.querySelectorAll(BOTONES_DE_HOY)).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
      const sonda = document.createElement('div')
      sonda.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)'
      document.body.appendChild(sonda)
      const safe = parseFloat(getComputedStyle(sonda).paddingBottom) || 0
      sonda.remove()
      let bottom = base + safe
      const inicio = bottom
      for (let i = 0; i < 3; i++) {
        const arriba = vh - bottom - lado
        const abajo = vh - bottom
        const pisan = botones.filter((r) => r.bottom > arriba - 6 && r.top < abajo + 6 && r.right > window.innerWidth - 14 - lado - 6)
        if (pisan.length === 0) break
        bottom = vh - Math.min(...pisan.map((r) => r.top)) + 10
      }
      const nuevo = bottom === inicio ? null : bottom
      setAlto((a) => (a === nuevo || (a !== null && nuevo !== null && Math.abs(a - nuevo) < 1) ? a : nuevo))
    }
    const pedir = () => {
      if (!cuadro.current) cuadro.current = window.requestAnimationFrame(medir)
    }
    medir()
    const t = window.setInterval(pedir, 500)
    window.addEventListener('scroll', pedir, true)
    window.addEventListener('resize', pedir)
    return () => {
      window.clearInterval(t)
      window.removeEventListener('scroll', pedir, true)
      window.removeEventListener('resize', pedir)
      if (cuadro.current) window.cancelAnimationFrame(cuadro.current)
    }
  }, [activo, base, lado])
  return alto
}

function Boton({ soloEn }: { soloEn: string[] }): ReactNode {
  const primero = useSoyElPrimero()
  const modo = useRouteStore((s) => s.mode)
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const puntito = useLogrosStore((s) => s.puntito)
  const ronda = useMomentosUI((s) => s.ronda)
  const [estado, setEstado] = useState<EstadoLogros | null>(null)
  useEffect(() => {
    let vivo = true
    void pedirEstado(tripId).then((e) => vivo && setEstado(e))
    return () => {
      vivo = false
    }
  }, [tripId, ronda, puntito])

  const alto = useSubirParaNoTapar(modo === 'today', 120, 58)
  if (!primero || !soloEn.includes(String(modo))) return null
  const sello = estado?.sellos[0]
  const grado = (sello?.grado ?? null) as GradoDeSello | null
  const fraccion = sello && sello.total > 0 ? sello.n / sello.total : 0
  return (
    <button
      type="button"
      data-boton-logros="1"
      data-grado={grado ?? 'ninguno'}
      aria-label={`${estado?.ciudad ? `Tus logros en ${estado.ciudad}` : 'Tus logros'}${puntito ? ' (hay algo nuevo)' : ''}`}
      onClick={() => useMomentosUI.getState().abrirHojaLogros()}
      className="mo"
      style={{ position: 'fixed', right: 14, bottom: alto !== null ? `${alto}px` : `calc(env(safe-area-inset-bottom,0px) + ${modo === 'today' ? 120 : 88}px)`, width: 58, height: 58, padding: 0, border: 'none', borderRadius: '50%', background: '#FFFDF8', cursor: 'pointer', zIndex: 40, boxShadow: '0 0 0 1px rgba(28,34,48,.08),0 12px 22px -10px rgba(28,34,48,.6)' }}
    >
      <BotonVisual sello={sello?.id ?? 'roma'} grado={grado} fraccion={fraccion} puntito={puntito} />
    </button>
  )
}

export default BotonFlotanteLogros
