import type { CSSProperties, ReactNode } from 'react'
import type { Encuadre } from '../../../../lib/encuadreFoto'
import { FotoEncuadrada } from '../../../ui/FotoEncuadrada'

/**
 * EL MARCO DE RANGO («Marco Estatus» de Design, versión con las imágenes de los 10 marcos). Rodea la foto del viajero (o su inicial) en todas partes: cada rango tiene el suyo
 * y cada nivel dentro del rango enciende una estrella más debajo. En el último rango (Leyenda), con `leyenda` estrellas, sale la insignia «★N».
 *
 * Los marcos son imágenes WebP de `public/marcos/` (se hacen con `scripts/destino/marcos8c.mjs`): se bajan SOLO cuando este componente se pinta, y la pestaña de los 10 marcos solo al abrirse.
 * El hueco (`hueco-N.webp`) recorta la foto con la forma exacta de la ventana de cada marco.
 *
 * Props:
 *   rango     0 a 9: el rango (`rango_ix` que manda el servidor).
 *   estrellas 1 a 5: el nivel dentro del rango (`estrellas` de `ResumenDeExp`). Con `sinEstrellas` no se pintan.
 *   tam       el ANCHO en píxeles; el alto es 1,09 veces el ancho (las estrellas van debajo del marco).
 *   leyenda   estrellas de Leyenda (`leyenda_estrellas`); con 1 o más y el último rango, sale «★N».
 *   children  lo que va dentro de la ventana (la foto o la inicial); sin nada, la silueta de Design.
 *   etiqueta  el texto para lectores de pantalla («Marco Explorador, nivel 2 de 5»).
 */
export const NUMERO_DE_RANGOS = 10

/** Las URLs de las imágenes de un rango (0 a 9). */
export const urlDeMarco = (rango: number): string => `/marcos/marco-${Math.max(0, Math.min(NUMERO_DE_RANGOS - 1, rango)) + 1}.webp`
export const urlDeHueco = (rango: number): string => `/marcos/hueco-${Math.max(0, Math.min(NUMERO_DE_RANGOS - 1, rango)) + 1}.webp`

const ESTRELLA = 'M0 -8L2.3 -2.6L8 -2L3.6 1.8L5 7.4L0 4.3L-5 7.4L-3.6 1.8L-8 -2L-2.3 -2.6Z'

/** La silueta de Design (cabeza y hombros) para cuando no hay foto ni inicial. */
function Silueta(): ReactNode {
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 38%,#6C7896,#2A3148 70%)' }}>
      <span style={{ position: 'absolute', left: '38%', top: '34%', width: '24%', height: '24%', borderRadius: '50%', background: '#F3E3C8' }} />
      <span style={{ position: 'absolute', left: '30%', top: '60%', width: '40%', height: '34%', borderRadius: '50% 50% 0 0', background: '#F3E3C8' }} />
    </span>
  )
}

export function MarcoDeRango({ rango, estrellas = 1, tam = 110, leyenda = 0, children, etiqueta, sinEstrellas = false, style }: { rango: number; estrellas?: number; tam?: number; leyenda?: number; children?: ReactNode; etiqueta?: string; sinEstrellas?: boolean; style?: CSSProperties }): ReactNode {
  const r = Math.max(0, Math.min(NUMERO_DE_RANGOS - 1, Math.round(rango)))
  const nivel = Math.max(1, Math.min(5, Math.round(estrellas)))
  const alto = Math.round((tam * 262) / 240)
  const hueco = `url(${urlDeHueco(r)}) center/100% 100% no-repeat`
  return (
    <span role="img" aria-label={etiqueta} data-marco-de-rango={r} data-estrellas={nivel} style={{ position: 'relative', display: 'inline-block', width: tam, height: alto, flex: 'none', ...style }}>
      <span style={{ position: 'absolute', left: 0, top: 0, width: '100%', aspectRatio: '1/1' }}>
        <span style={{ position: 'absolute', inset: 0, WebkitMask: hueco, mask: hueco, overflow: 'hidden' }}>{children ?? <Silueta />}</span>
        <img src={urlDeMarco(r)} alt="" width={tam} height={tam} loading="lazy" decoding="async" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(20,16,30,.3))', pointerEvents: 'none' }} />
      </span>
      {!sinEstrellas && (
        <svg width="100%" height="100%" viewBox="0 0 240 262" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const on = i < nivel
            return (
              <g key={i} transform={`translate(${(120 + (i - 2) * 26).toFixed(1)} 250) scale(${on ? 1.15 : 0.9})`}>
                <path d={ESTRELLA} fill={on ? '#FFF1B8' : '#1C2230'} stroke={on ? '#B5821C' : 'rgba(255,255,255,.5)'} strokeWidth="1" strokeLinejoin="round" />
              </g>
            )
          })}
        </svg>
      )}
      {r === NUMERO_DE_RANGOS - 1 && leyenda > 0 && (
        <span style={{ position: 'absolute', right: '-2%', bottom: 0, height: '11%', minWidth: '16%', padding: '0 3%', borderRadius: 999, background: '#1C2230', color: '#F3D59A', boxShadow: '0 0 0 2px #F3D59A', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `700 ${Math.max(8, Math.round(tam * 0.07))}px 'Geist Mono',monospace` }}>
          ★{leyenda}
        </span>
      )}
    </span>
  )
}

/** La inicial dentro del marco (cuando no hay foto): el círculo oscuro de Design con la letra en la serif de la app. */
export function InicialEnMarco({ letra, tam, foto = null, encuadre = null }: { letra: string; tam: number; foto?: string | null; encuadre?: Encuadre | null }): ReactNode {
  // Con foto (la suya o la de Google), la foto llena la ventana del marco; sin foto, la inicial.
  if (foto) return <FotoEncuadrada src={foto} encuadre={encuadre} datos="emblema" />
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 38%,#2E3550,#1C2230 75%)', color: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `400 ${Math.round(tam * 0.4)}px/1 'Instrument Serif',serif` }}>
      {letra}
    </span>
  )
}
