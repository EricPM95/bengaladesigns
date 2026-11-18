import { useEffect, useId, useState, type ReactNode } from 'react'
import { logrosActivos } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { Sello, type GradoDeSello } from '../dibujos'
import { pedirEstado, type EstadoLogros } from './api'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'
import { useFlotantes } from '../../flotantes/flotantes'

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
  const vacio = !grado && fraccion === 0
  return (
    <>
      <svg width="52" height="52" viewBox="0 0 62 62" aria-hidden style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="31" cy="31" r="26" fill="none" stroke="rgba(28,34,48,.1)" strokeWidth="3.5" strokeDasharray={grado ? undefined : '4 3'} />
        <circle cx="31" cy="31" r="26" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={CIRCUNFERENCIA} strokeDashoffset={CIRCUNFERENCIA * (1 - fraccion)} style={animado ? { animation: 'moAro 1.4s .3s ease both' } : undefined} />
      </svg>
      {vacio ? (
        // (V5, 4c) Sin nada ganado, el botón se ve vivo: el trofeo en oro sobre un fondo crema. En cuanto hay algo, vuelve el sello de la ciudad.
        <span data-boton-logros-trofeo="1" style={{ position: 'absolute', left: 13, top: 13 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B58A2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" fill="#F3D88F" />
          </svg>
        </span>
      ) : (
        <span style={{ position: 'absolute', left: 8, top: 8, opacity: grado ? 1 : 0.5 }}>
          <Sello id={sello} grado={grado ?? 'bronce'} apagado={!grado} tam={36} etiqueta={false} />
        </span>
      )}
      {puntito && <span aria-hidden style={{ position: 'absolute', right: 1, top: 1, width: 14, height: 14, borderRadius: '50%', background: 'oklch(0.55 0.17 5)', animation: 'moPuntito 1.8s ease-in-out infinite' }} />}
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
      data-grado={grado ?? 'ninguno'}
      aria-label={`${estado?.ciudad ? `Tus logros en ${estado.ciudad}` : 'Tus logros'}${puntito ? ' (hay algo nuevo)' : ''}`}
      onClick={() => useMomentosUI.getState().abrirHojaLogros()}
      className="mo"
      style={{ position: 'fixed', right: 14, bottom: alto !== null ? `${alto}px` : `calc(env(safe-area-inset-bottom,0px) + ${modo === 'today' ? 120 : 88}px)`, width: 52, height: 52, padding: 0, border: 'none', borderRadius: '50%', background: !grado && fraccion === 0 ? 'linear-gradient(160deg,#FFF8E4,#F6E3AE 70%,#EBCF86)' : '#FFFDF8', cursor: 'pointer', zIndex: debajo ? 30 : 99, boxShadow: '0 0 0 1px rgba(28,34,48,.08),0 12px 22px -10px rgba(28,34,48,.6)' }}
    >
      <BotonVisual sello={sello?.id ?? 'roma'} grado={grado} fraccion={fraccion} puntito={puntito} />
    </button>
  )
}

export default BotonFlotanteLogros
