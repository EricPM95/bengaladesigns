/**
 * Las 18 insignias de colección (11 de Roma y 7 de Lanzarote), DIBUJADAS POR PARTES (V13): cada trozo es su propia forma, un trozo por sitio en el orden de los datos, ganado = entero en color, el que falta = entero
 * en gris. Las dibuja `InsigniaPartes` con las piezas de Design (`Piezas/Insignia Lanza Codigo` y `Piezas/Insignia Pieza`). Este archivo es solo la puerta de siempre (`InsigniaDibujo`, `sitiosDeColeccion`).
 */
import { InsigniaPartes } from './InsigniaPartes'
import { COLECCIONES_POR_PARTES } from './partes'

export function sitiosDeColeccion(coleccion: string): string[] {
  return COLECCIONES_POR_PARTES[coleccion]?.sitios ?? []
}

/** La insignia de una colección con sus pedazos. `nuevos` + `fase` son para el momento «Un pedazo nuevo». */
export function InsigniaDibujo({ coleccion, ganados = [], completa = false, tam = 120, nuevos, fase }: { coleccion: string; ganados?: string[]; completa?: boolean; tam?: number; animada?: boolean; nuevos?: string[]; fase?: 0 | 1 | 2 | 3 | 4 }) {
  return <InsigniaPartes coleccion={coleccion} ganados={ganados} completa={completa} tam={tam} nuevos={nuevos} fase={fase} />
}
