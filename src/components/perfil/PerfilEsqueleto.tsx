import type { CSSProperties, ReactNode } from 'react'
import { nombreVisible } from '../../lib/nombrePersona'

const GRIS = 'rgba(28,34,48,.07)'

/** Un hueco gris claro (el sitio de algo que aún no ha llegado). */
function Hueco({ w, h, r = 12, style }: { w: number | string; h: number; r?: number | string; style?: CSSProperties }): ReactNode {
  return <span aria-hidden="true" style={{ display: 'block', width: w, height: h, borderRadius: r, background: GRIS, flex: 'none', ...style }} />
}

/**
 * EL PERFIL NUEVO VACÍO (Tanda 10N3, §3b.2; con el orden de la 10N5): lo que se ve mientras llega el código del Perfil o sus datos y NO hay nada guardado de la última vez (la primera vez en este móvil). Tiene la misma forma que el
 * de verdad: el círculo del marco, «Hola, …», el nivel y la barra de EXP en pequeño, con los huecos en gris claro. Con lo último que se vio guardado en el móvil esto no sale: sale el Perfil entero al instante.
 * `nombre`: el nombre ya conocido (sale en el «Hola»); `titulo`: si abajo va un hueco con el título «Mis viajes» (sí) o los viajes de este móvil ya pintados (no).
 */
export function PerfilEsqueleto({ nombre = null, titulo = true }: { nombre?: string | null; titulo?: boolean }): ReactNode {
  const visible = nombre ? nombreVisible(nombre) || nombre : null
  return (
    <div data-perfil-cargando="1" aria-busy="true" style={{ padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
        <Hueco w={118} h={118} r="50%" />
        <div style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column', gap: 10 }}>
          {visible ? (
            <h2 style={{ margin: 0, font: "400 34px/1 'Instrument Serif',serif", overflowWrap: 'anywhere' }}>
              Hola, <em>{visible}</em>
            </h2>
          ) : (
            <Hueco w="70%" h={30} r={10} />
          )}
          <Hueco w="52%" h={14} r={7} />
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Hueco w="100%" h={6} r={3} />
        <Hueco w="60%" h={12} r={6} />
      </div>
      {titulo && <Hueco w={140} h={30} r={8} style={{ marginTop: 38 }} />}
    </div>
  )
}
