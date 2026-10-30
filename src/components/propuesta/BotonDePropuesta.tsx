import { createPortal } from 'react-dom'
import { useLaPropuesta } from '../../hooks/useLaPropuesta'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { logrosActivos } from '../../lib/logros'
import { useRouteStore } from '../../store/useRouteStore'
import { AIRE_BAJO_LOS_BOTONES, SOBRE_LOS_LOGROS as SUBE, useFlotantes, useLapizALaVista } from '../flotantes/flotantes'

/**
 * EL LÁPIZ FLOTANTE DE LA PROPUESTA (Tanda 10N, apartado 6; «Propuesta Botón · A»): un círculo azul noche con el lápiz y, encima, el numerito de cambios en oro, justo ENCIMA del botón de los logros.
 *   · Solo sale DESPUÉS DEL PRIMER CAMBIO (nunca «Aún sin cambios»), en todas las pestañas, y solo para quien solo recomienda y antes de que empiece el viaje.
 *   · Al tocarlo, la hoja «Tu propuesta · N cambios» con la lista y [Enviar a Eric]. Nada se envía sin pasar por ella.
 *   · Si ya mandó su propuesta y espera respuesta, el lápiz sigue con el numerito en claro (los que esperan) para poder ver lo enviado.
 * No tapa el botón de los logros (va encima) ni la última parada de una lista (DÍAS y EXPLORAR dejan espacio: `EspacioParaElLapiz`).
 */
export const ALTO_DEL_LAPIZ = 56
const SOBRE_LOS_LOGROS = SUBE

export function useLapizVisible(): { visible: boolean; n: number; enEsperaN: number } {
  const { activa, n, enEsperaN } = useLaPropuesta()
  const pantalla = useRouteStore((s) => s.screen)
  return { visible: activa && pantalla === 'route' && (n > 0 || enEsperaN > 0), n, enEsperaN }
}

export function BotonDePropuesta() {
  const { visible, n, enEsperaN } = useLapizVisible()
  const modo = useRouteStore((s) => s.mode)
  const abrirHoja = usePropuestaStore((s) => s.abrirHoja)
  // (Tanda 10N4 §0b) En todas las pantallas; solo debajo de una hoja abierta, y sube con el botón de los logros para no tapar los botones de abajo (flotantes.ts).
  const { debajo, alto } = useFlotantes()
  useLapizALaVista(visible)
  if (!visible) return null
  const cuantos = n > 0 ? n : enEsperaN
  return createPortal(
    <button
      type="button"
      data-boton-propuesta={n > 0 ? 'sin-enviar' : 'enviada'}
      data-propuesta-n={cuantos}
      aria-label={n > 0 ? `Tu propuesta: ${n} ${n === 1 ? 'cambio' : 'cambios'}` : `Tu propuesta enviada: ${enEsperaN} ${enEsperaN === 1 ? 'cambio' : 'cambios'}`}
      onClick={() => abrirHoja({ modo: 'mia' })}
      className="hoja-pop"
      style={{
        position: 'fixed',
        right: 15,
        bottom: alto !== null ? `${alto + SOBRE_LOS_LOGROS}px` : `calc(env(safe-area-inset-bottom,0px) + ${(modo === 'today' ? 120 : 88) + SOBRE_LOS_LOGROS}px)`,
        width: ALTO_DEL_LAPIZ,
        height: ALTO_DEL_LAPIZ,
        padding: 0,
        borderRadius: '50%',
        background: '#1C2230',
        border: '1.5px solid #B58A2E',
        boxShadow: '0 10px 20px -8px rgba(28,34,48,.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: debajo ? 31 : 100,
      }}
    >
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#FBF3E2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />
      </svg>
      <span
        data-propuesta-numerito
        style={{
          position: 'absolute',
          right: -6,
          top: -6,
          minWidth: 24,
          height: 24,
          padding: '0 6px',
          borderRadius: 999,
          background: n > 0 ? 'linear-gradient(135deg,#F3D88F,#B58A2E)' : '#FBF3E2',
          color: '#1C2230',
          border: '2px solid #F6EFE0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: "700 13px 'Geist'",
        }}
      >
        {cuantos}
      </span>
    </button>,
    document.body,
  )
}

/**
 * (Tanda 10N4 §0b) El hueco al final (px) de cualquier lista o pantalla que se desplaza, para que los botones flotantes no tapen el último elemento: `minimo` si no hay botones;
 * 150 con el botón de los logros y 220 si además está el lápiz. Las pantallas que no son DÍAS/EXPLORAR/RESERVAS lo usan como `paddingBottom`.
 */
export function useHuecoAlFinal(minimo = 40): number {
  const { visible } = useLapizVisible()
  // (10S5) El hueco sale de DÓNDE están de verdad los botones (con la barra de abajo del móvil, que sube el botón de los logros): su borde de arriba más un poco de aire.
  const { suelo } = useFlotantes()
  if (!logrosActivos() && !visible) return minimo
  return Math.max(minimo, suelo + (visible ? SOBRE_LOS_LOGROS + ALTO_DEL_LAPIZ : 58) + AIRE_BAJO_LOS_BOTONES)
}

/** El hueco que se deja al final de DÍAS y EXPLORAR cuando el lápiz está a la vista, para que no tape la última parada ni la última tarjeta. */
export function EspacioParaElLapiz() {
  const { visible } = useLapizVisible()
  // (10S5) También con SOLO el botón de los logros: ninguna pantalla deja contenido debajo de los botones flotantes (regla de los botones flotantes).
  if (!visible && !logrosActivos()) return null
  return <div aria-hidden="true" data-espacio-lapiz style={{ height: visible ? 150 : 96, flex: 'none' }} />
}
