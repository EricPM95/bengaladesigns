/**
 * (V13) LAS INSIGNIAS DE LAS COLECCIONES, POR PARTES. Las 18 (11 de Roma y 7 de Lanzarote) son ahora las de Design (`Piezas/Insignia Lanza Codigo`; en «Los imprescindibles de Roma» y «Las 4 joyas de Roma», además,
 * los trozos con su icono, `Piezas/Insignia Pieza`, y la medalla del centro encima): cada trozo es su propia forma, UN TROZO POR SITIO, en el orden de los datos (`partes.ts`).
 *   · trozo ganado = entero en color; el que no, entero en gris; nunca a medias, nunca en diagonal, nunca recortando una imagen;
 *   · el centro y el marco cambian solos con el estado (sin empezar, a medias y completa);
 *   · `nuevos` + `fase` (0 a 4) son para el momento «Un pedazo nuevo»: el trozo nuevo llega volando (1), encaja (2), se llena de color con un destello (3) y queda (4). Sin `nuevos`, todo está quieto.
 * Un solo componente para todas las pantallas (hoja de logros, colección por dentro, resumen, «Todos mis logros», vitrina, momentos y compartir).
 */
import { useMemo } from 'react'
import InsigniaPorPartes from './piezas/InsigniaPorPartes'
import InsigniaPieza from './piezas/InsigniaPieza'
import { COLECCIONES_POR_PARTES } from './partes'
import './iconosSitios'

/** Las dos colecciones de Roma cuyos trozos llevan icono (los pone Design): «Los imprescindibles» y «Las 4 joyas». */
const CON_ICONOS: Record<string, 'impr' | 'joyas'> = { r1: 'impr', r3: 'joyas' }

export interface PropsInsigniaPartes {
  coleccion: string
  /** Los sitios ganados (ids de los datos). */
  ganados?: string[]
  completa?: boolean
  tam?: number
  /** Los sitios que se acaban de ganar (el momento «Un pedazo nuevo»); sin `fase`, ya están ganados. */
  nuevos?: string[]
  /** 0 = el trozo nuevo aún no ha llegado … 4 = encajado y en color. Sin `nuevos`, no se usa. */
  fase?: 0 | 1 | 2 | 3 | 4
}

/** Los índices (trozos) ganados y el del trozo nuevo de una colección. Pura: sale de los sitios, no de la pantalla. */
export function trozosDeColeccion(coleccion: string, ganados: string[], completa: boolean, nuevos: string[] = []): { total: number; set: number[]; nuevo: number } | null {
  const info = COLECCIONES_POR_PARTES[coleccion]
  if (!info) return null
  const nuevoSitio = nuevos.find((s) => info.sitios.includes(s))
  const nuevo = nuevoSitio ? info.sitios.indexOf(nuevoSitio) : -1
  const set = info.sitios.map((s, i) => (i !== nuevo && (completa || ganados.includes(s) || nuevos.includes(s)) ? i : -1)).filter((i) => i >= 0)
  return { total: info.sitios.length, set, nuevo }
}

export function InsigniaPartes({ coleccion, ganados = [], completa = false, tam = 120, nuevos = [], fase = 4 }: PropsInsigniaPartes) {
  const info = COLECCIONES_POR_PARTES[coleccion]
  const t = useMemo(() => trozosDeColeccion(coleccion, ganados, completa, nuevos), [coleccion, ganados, completa, nuevos])
  if (!info || !t) return <span style={{ width: tam, height: tam, display: 'inline-block' }} />
  const lista = t.set.join(',')
  const iconos = CON_ICONOS[info.col]
  const animando = t.nuevo >= 0
  if (iconos) {
    const ms = Math.round(tam * 0.6)
    return (
      <span data-insignia-partes={coleccion} data-trozos={t.total} data-ganados={t.set.length + (animando && fase >= 3 ? 1 : 0)} style={{ position: 'relative', width: tam, height: tam, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        {/* Los trozos con su icono; el nuevo, cuando le toca (la pieza lo anima ella sola, con su vuelo y su destello). */}
        <InsigniaPieza key={animando ? `n${fase >= 1 ? 1 : 0}` : 'q'} kind={iconos} set={lista} have={t.set.length} neu={animando && fase >= 1 ? t.nuevo : -1} dark={false} delay={animando ? 0 : -30} scale={tam / 150} />
        <span style={{ position: 'absolute', left: '50%', top: '50%', width: ms, height: ms, margin: `${-ms / 2}px 0 0 ${-ms / 2}px`, pointerEvents: 'none' }}>
          <InsigniaPorPartes col={info.col} set={lista} med size={ms} nw={animando ? t.nuevo : ''} ph={fase} />
        </span>
      </span>
    )
  }
  return (
    <span data-insignia-partes={coleccion} data-trozos={t.total} data-ganados={t.set.length + (animando && fase >= 3 ? 1 : 0)} style={{ display: 'inline-flex', flex: 'none' }}>
      <InsigniaPorPartes col={info.col} set={lista} size={tam} nw={animando ? t.nuevo : ''} ph={fase} />
    </span>
  )
}
