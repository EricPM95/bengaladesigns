import { useId } from 'react'
import { logoJutripHtml, logoPequenoHtml, palabraJutripHtml } from '../../../shared/marca/logoJutrip.js'

/**
 * El logo de JUTRIP (Tanda 10, logo P4 de Design), dibujado con código: la estrella con su anillo y su ruta de puntos, y debajo la palabra en Bodoni Moda. El dibujo vive en
 * `shared/marca/logoJutrip.js` (el mismo que usa la pantalla de apertura de index.html). `tono`: «claro» sobre marfil o crema, «oscuro» sobre tinta o azul noche.
 */
const idLimpio = (id: string) => `jt${id.replace(/[^a-zA-Z0-9]/g, '')}`

export function LogoJutrip({ tam = 120, tono = 'claro', palabra = true }: { tam?: number; tono?: 'claro' | 'oscuro'; palabra?: boolean }) {
  const id = idLimpio(useId())
  return <span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: logoJutripHtml({ tam, tono, id, palabra }) }} />
}

/** El logo pequeño de una línea (la estrella y JUTRIP): arriba en el formulario y en el panel de la web grande. */
export function LogoPequeno({ tono = 'claro', tam = 21 }: { tono?: 'claro' | 'oscuro'; tam?: number }) {
  const id = idLimpio(useId())
  return <span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: logoPequenoHtml({ tono, id, tam }) }} />
}

/** Solo la palabra JUTRIP (la pantalla de entrar la lleva arriba, más pequeña, sin estrella ni recuadro). */
export function PalabraJutrip({ tam = 30, tono = 'claro' }: { tam?: number; tono?: 'claro' | 'oscuro' }) {
  return <span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: palabraJutripHtml({ tam, tono }) }} />
}
