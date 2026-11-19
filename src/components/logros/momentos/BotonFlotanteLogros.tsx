import { useEffect, useId, useState, type ReactNode } from 'react'
import { logrosActivos } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import type { GradoDeSello } from '../dibujos'
import { pedirEstado, type EstadoLogros } from './api'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'
import { ESTILO_FLOTANTE, useFlotantes } from '../../flotantes/flotantes'

/**
 * EL BOTÓN FLOTANTE DE LOS LOGROS (Tanda 8B, «Logros · el botón del destino»; 8C2: sus estados). Fijo abajo a la derecha, justo encima de la barra de pestañas:
 * un círculo blanco de 58 px con el sello de la ciudad dentro y un aro que marca el avance del sello. Se monta una vez por pantalla del viaje:
 *
 *     <BotonFlotanteLogros />
 *
 * - Con los logros apagados no se monta nada. Se ve en TODAS las pantallas del viaje (Tanda 10N4; `soloEn` lo limita, solo para pruebas) y solo se queda debajo de una hoja abierta: ver flotantes.ts. En HOY sube un poco para no tapar [✓ Visto].
 * - Sus estados: antes del viaje (el sello en gris y el aro a rayas), bronce, plata, oro y diamante (el aro llena lo que lleva) y con algo nuevo sin ver (el puntito).
 * - Si se vio la animación de lo ganado, el botón late (lo hace el vuelo) y no hay puntito; si se saltó, lleva el puntito (`useLogrosStore.puntito`).
 * - Al tocarlo abre la hoja de logros (`HojaLogros`).
 * - Si hay dos montados a la vez (DÍAS y HOY), solo dibuja el primero: nunca salen dos botones.
 */
export const COLOR_DE_GRADO: Record<string, string> = { bronce: '#A8734A', plata: '#8F969E', oro: '#B8964F', diamante: '#7F93C9' }

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

/** (V18, Design B1) El trofeo del botón de los logros: el mismo botón que la cámara (crema con aro dorado), un trofeo de trazo fino y, si hay algo nuevo, el punto de aviso. Ya no hay aro de avance ni medalla: `sello`, `grado` y `fraccion` se aceptan por las pantallas viejas y no se pintan. */
export function BotonVisual({ puntito }: { sello?: string; grado?: GradoDeSello | null; fraccion?: number; puntito: boolean; animado?: boolean }): ReactNode {
  return (
    <>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A5A1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden data-boton-logros-trofeo="1">
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
      </svg>
      {puntito && <span aria-hidden data-punto-de-aviso="1" style={{ position: 'absolute', right: -1, top: -1, width: 13, height: 13, borderRadius: '50%', background: 'oklch(0.55 0.17 5)', border: '2px solid #FFFDF8', animation: 'moPuntito 1.8s ease-in-out infinite' }} />}
    </>
  )
}

export function BotonFlotanteLogros({ soloEn = null }: { soloEn?: string[] | null }): ReactNode {
  if (!logrosActivos()) return null
  return <Boton soloEn={soloEn} />
}

function Boton({ soloEn }: { soloEn: string[] | null }): ReactNode {
  const primero = useSoyElPrimero()
  const modo = useRouteStore((s) => s.mode)
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const puntito = useLogrosStore((s) => s.puntito)
  const ronda = useMomentosUI((s) => s.ronda)
  const [estado, setEstado] = useState<EstadoLogros | null>(null)
  useEffect(() => {
    let vivo = true
    void pedirEstado(tripId).then((e) => vivo && setEstado(e))
    // (V9) Al abrir el viaje se piden ya, por detrás, lo de la hoja de logros (arriba) y «Todos mis logros», para que la primera vez tampoco haya espera.
    if (tripId) void import('../pantallas/todos/api').then((m) => m.useGanados.getState().cargar(false)).catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [tripId, ronda, puntito])

  // (Tanda 10N4 §0b) Se ve en TODAS las pantallas del viaje; solo se queda debajo de una hoja abierta (y sube para no tapar los botones de abajo): ver flotantes.ts.
  const { debajo, alto } = useFlotantes()
  if (!primero || (soloEn !== null && !soloEn.includes(String(modo)))) return null
  const sello = estado?.sellos[0]
  const grado = (sello?.grado ?? null) as GradoDeSello | null
  const fraccion = sello && sello.total > 0 ? sello.n / sello.total : 0
  return (
    <button
      type="button"
      data-boton-logros="1"
      data-flotante="1"
      data-grado={grado ?? 'ninguno'}
      aria-label={`${estado?.ciudad ? `Tus logros en ${estado.ciudad}` : 'Tus logros'}${puntito ? ' (hay algo nuevo)' : ''}`}
      onClick={() => useMomentosUI.getState().abrirHojaLogros()}
      className="mo"
      style={{ right: 21, bottom: alto !== null ? `${alto}px` : `calc(env(safe-area-inset-bottom,0px) + ${modo === 'today' ? 120 : 88}px)`, ...ESTILO_FLOTANTE, position: 'fixed', cursor: 'pointer', zIndex: debajo ? 30 : 99 }}
    >
      <BotonVisual sello={sello?.id ?? 'roma'} grado={grado} fraccion={fraccion} puntito={puntito} />
    </button>
  )
}

export default BotonFlotanteLogros
