import { useEffect, useId, useState, type ReactNode } from 'react'
import { logrosActivos } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { Sello, type GradoDeSello } from '../dibujos'
import { pedirEstado, type EstadoLogros } from './api'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'

/**
 * EL BOTÓN FLOTANTE DE LOS LOGROS (Tanda 8B, «Logros · el botón del destino», apartados 21 y 23). Fijo abajo a la derecha, justo encima de la barra de pestañas:
 * un círculo blanco de 58 px con el sello de la ciudad dentro y un aro que marca el avance del sello. Se monta una vez por pantalla del viaje:
 *
 *     <BotonFlotanteLogros />
 *
 * - Con los logros apagados no se monta nada. Solo se ve en RUTA, DÍAS y HOY (`soloEn` lo cambia).
 * - Si se vio la animación de lo ganado, el botón late (lo hace el vuelo) y no hay puntito; si se saltó, lleva el puntito (`useLogrosStore.puntito`).
 * - Al tocarlo abre una hoja sencilla con lo que ya hay (`HojaLogros`; la hoja de verdad es de la 8c).
 * - Si hay dos montados a la vez (DÍAS y HOY), solo dibuja el primero: nunca salen dos botones.
 */
const COLOR_ARO: Record<string, string> = { bronce: '#C58A55', plata: '#9AA1A9', oro: '#D9B26A', diamante: '#7E96D8' }
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

export function BotonFlotanteLogros({ soloEn = ['route', 'days', 'today'] }: { soloEn?: string[] }): ReactNode {
  if (!logrosActivos()) return null
  return <Boton soloEn={soloEn} />
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

  if (!primero || !soloEn.includes(String(modo))) return null
  const sello = estado?.sellos[0]
  const grado = (sello?.grado ?? null) as GradoDeSello | null
  const fraccion = sello && sello.total > 0 ? sello.n / sello.total : 0
  const color = grado ? COLOR_ARO[grado] : '#9AA1A9'
  return (
    <button
      type="button"
      data-boton-logros="1"
      aria-label={`${estado?.ciudad ? `Tus logros en ${estado.ciudad}` : 'Tus logros'}${puntito ? ' (hay algo nuevo)' : ''}`}
      onClick={() => useMomentosUI.getState().abrirHojaLogros()}
      className="mo"
      style={{ position: 'fixed', right: 14, bottom: 'calc(env(safe-area-inset-bottom,0px) + 88px)', width: 58, height: 58, padding: 0, border: 'none', borderRadius: '50%', background: '#FFFDF8', cursor: 'pointer', zIndex: 40, boxShadow: '0 0 0 1px rgba(28,34,48,.08),0 12px 22px -10px rgba(28,34,48,.6)' }}
    >
      <svg width="58" height="58" viewBox="0 0 62 62" aria-hidden style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="31" cy="31" r="26" fill="none" stroke="rgba(28,34,48,.1)" strokeWidth="3.5" />
        <circle cx="31" cy="31" r="26" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={CIRCUNFERENCIA} strokeDashoffset={CIRCUNFERENCIA * (1 - fraccion)} style={{ animation: 'moAro 1.4s .3s ease both' }} />
      </svg>
      <span style={{ position: 'absolute', left: 10, top: 10, opacity: grado ? 1 : 0.35 }}>
        <Sello id={sello?.id ?? 'roma'} grado={grado ?? 'bronce'} tam={38} />
      </span>
      {puntito && <span aria-hidden style={{ position: 'absolute', right: 1, top: 1, width: 14, height: 14, borderRadius: '50%', background: 'oklch(0.55 0.17 5)', animation: 'moPuntito 1.8s ease-in-out infinite' }} />}
    </button>
  )
}

export default BotonFlotanteLogros
