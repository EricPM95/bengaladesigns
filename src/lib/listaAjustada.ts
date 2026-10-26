import ajustes from '../../data/pase/lista_ajustes.json'
import { LISTA_DEL_PASE as LISTA_DE_DESIGN, type GrupoDeLista, type ItemDeLista } from './listaDelPase'

/**
 * LA LISTA DEL PASE QUE SE ENSEÑA (Tanda 10P, apartado 1.4): la de Design (`listaDelPase.ts`, generada) con los ajustes de `data/pase/lista_ajustes.json` encima:
 * las filas ocultas mientras la función no exista («Modo "a mi aire"», «El reto del día») y los textos que cambian («Invita a un amigo»). La usan el final de la película, «Todo lo que incluye»
 * y «Con el pase tendrás» de HOY: es la misma lista, así que se ajusta en un solo sitio.
 */
export type { GrupoDeLista, ItemDeLista }
export const FILAS_OCULTAS: readonly string[] = ajustes.ocultas
export const TEXTOS_DE_LINEA: Readonly<Record<string, string>> = ajustes.textos

export const LISTA_DEL_PASE: GrupoDeLista[] = LISTA_DE_DESIGN.map((g) => ({
  ...g,
  items: g.items.filter((i) => !FILAS_OCULTAS.includes(i.titulo)).map((i) => (TEXTOS_DE_LINEA[i.titulo] ? { ...i, linea: TEXTOS_DE_LINEA[i.titulo] } : i)),
}))

/** Una línea partida en trozos, con «HOY» marcado para ponerlo en oro (<Marca>). */
export const partesDeLinea = (linea: string): { t: string; marca: boolean }[] =>
  linea
    .split(/(HOY)/)
    .filter((t) => t !== '')
    .map((t) => ({ t, marca: t === 'HOY' }))
