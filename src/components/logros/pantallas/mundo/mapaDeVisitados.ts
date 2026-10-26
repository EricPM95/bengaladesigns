import type { Relleno } from './Globo'
import { centroDeVarios, zoomParaPais } from './proyeccion'
import type { Pais } from './paises'

/** Los colores suaves con que se pintan los países visitados (los mismos del pasaporte por dentro). */
export const COLORES_DE_PAIS = ['oklch(0.74 0.14 65)', 'oklch(0.68 0.12 150)', 'oklch(0.66 0.1 240)', 'oklch(0.66 0.1 300)', 'oklch(0.72 0.13 35)', 'oklch(0.68 0.1 195)']

/** Sin ningún país visitado, el mapa se ve centrado en Europa. */
export const VISTA_DE_EUROPA = { lat: 48, lng: 12, z: 1.5 }

/**
 * LA VISTA DEL MAPA DEL PASAPORTE (Tanda 10P, 1.8): centrado en los países visitados —el punto medio de todos; con uno solo, acercado a él; sin ninguno, en Europa— y con cada uno pintado.
 * La usan la tarjeta «Mi pasaporte» del Perfil y el globo grande del pasaporte, así que fuera y dentro se ve lo mismo.
 * @param catalogo  el catálogo de países (data/logros/paises_mundo.json)
 * @param visitados los códigos (iso, en minúsculas) de los países visitados
 */
export function mapaDeVisitados(catalogo: Pais[] | null, visitados: string[]): { inicial: { lat: number; lng: number; z: number }; rellenos: Record<string, Relleno> } {
  const porIso = new Map((catalogo ?? []).map((p) => [p.i, p]))
  const conocidos = [...new Set(visitados)].map((i) => porIso.get(i)).filter((p): p is Pais => Boolean(p))
  const rellenos: Record<string, Relleno> = {}
  conocidos.forEach((p, k) => {
    rellenos[p.i] = { f: COLORES_DE_PAIS[k % COLORES_DE_PAIS.length], s: 'rgba(28,34,48,.5)' }
  })
  if (conocidos.length === 0) return { inicial: VISTA_DE_EUROPA, rellenos }
  if (conocidos.length === 1) return { inicial: { lat: conocidos[0].lat, lng: conocidos[0].lng, z: zoomParaPais(conocidos[0].p === 1) }, rellenos }
  const c = centroDeVarios(conocidos)
  return { inicial: { lat: c.lat, lng: c.lng, z: 1 }, rellenos }
}
