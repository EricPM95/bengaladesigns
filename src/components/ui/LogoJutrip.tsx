import { useId } from 'react'
import { estrellaJutripHtml, palabraJutripHtml } from '../../../shared/marca/logoJutrip.js'

/**
 * El logo de JUTRIP (Tanda 10E, «Piezas/Logo JUTRIP» de Design), dibujado con código: la palabra JUTRIP en Italiana con su degradado de oro y la estrella sobre la I. El dibujo vive en
 * `shared/marca/logoJutrip.js` (el mismo que usa la pantalla de apertura de index.html). `tono`: «claro» sobre marfil o crema, «oscuro» sobre tinta o azul noche.
 * `tam` es el cuerpo de la letra en px (el `fs` de Design: 46 en Entrar, 40 sobre tinta en el pase y la cuenta).
 */
const idLimpio = (id: string) => `jt${id.replace(/[^a-zA-Z0-9]/g, '')}`

export function LogoJutrip({ tam = 46, tono = 'claro' }: { tam?: number; tono?: 'claro' | 'oscuro' }) {
  const id = idLimpio(useId())
  return <span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: palabraJutripHtml({ tam, tono, id }) }} />
}

/** El logo pequeño de una línea (la primera pantalla y el formulario): el mismo logo nuevo, la palabra en Italiana con la estrella sobre la I, QUIETO (la animación es solo de la apertura). `tam` es el cuerpo de la letra. */
export function LogoPequeno({ tono = 'claro', tam = 22 }: { tono?: 'claro' | 'oscuro'; tam?: number }) {
  const id = idLimpio(useId())
  return <span data-logo-pequeno style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: palabraJutripHtml({ tam, tono, id }) }} />
}

/** La palabra JUTRIP con su estrella: la pantalla de entrar la lleva arriba (`fs` 46 en Design). */
export function PalabraJutrip({ tam = 46, tono = 'claro' }: { tam?: number; tono?: 'claro' | 'oscuro' }) {
  const id = idLimpio(useId())
  return <span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: palabraJutripHtml({ tam, tono, id }) }} />
}

/** Solo la estrella del logo (el `mark="star"` de Design). */
export function EstrellaJutrip({ tam = 22 }: { tam?: number }) {
  const id = idLimpio(useId())
  return <span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: estrellaJutripHtml({ tam, id }) }} />
}
