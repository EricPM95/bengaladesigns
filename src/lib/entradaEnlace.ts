import type { StopEntrada } from './types'
import { buildActivitySearchUrl } from './affiliateLinks'

/**
 * (V28, decisión de Eric 20-nov) A DÓNDE LLEVA EL BOTÓN DE UNA ENTRADA. Nunca a una página que no es la de ese sitio:
 *   1. la página EXACTA de esa actividad en Civitatis (la de la API o la de los datos): con nuestro aid y la campaña al abrirla;
 *   2. si Civitatis no la tiene (`sin_civitatis`), la web OFICIAL de entradas del sitio (`oficial`), SIN aid: «Entradas en la web oficial»;
 *   3. si tampoco hay web oficial, ningún botón.
 * Las entradas antiguas, sin `sin_civitatis`, siguen con el buscador como último recurso (compatibilidad).
 */
export interface EnlaceDeCompra {
  url: string
  /** La web oficial del sitio (no es Civitatis: sin aid). */
  oficial: boolean
}

export function enlaceDeCompraDeEntrada(entrada: Pick<StopEntrada, 'nombre' | 'url' | 'civitatis' | 'oficial' | 'sin_civitatis'>, destino: string): EnlaceDeCompra | null {
  const civitatis = entrada.civitatis?.url ?? entrada.url
  if (civitatis) return { url: civitatis, oficial: false }
  if (entrada.oficial) return { url: entrada.oficial, oficial: true }
  if (entrada.sin_civitatis) return null
  return { url: buildActivitySearchUrl(`${entrada.nombre} ${destino}`), oficial: false }
}

/** El texto del botón: «Ver horas y reservar» (Civitatis) o «Entradas en la web oficial». */
export const textoDelBotonDeEntrada = (enlace: EnlaceDeCompra | null, porDefecto: string): string => (enlace?.oficial ? 'Entradas en la web oficial' : porDefecto)
