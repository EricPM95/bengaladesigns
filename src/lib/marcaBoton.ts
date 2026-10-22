import type { CSSProperties } from 'react'

/**
 * EL BOTÓN PRINCIPAL, CHAMPÁN (Tanda 10E, «Marca JUTRIP 02»: Continuar, Comprar, Cómo llegar): degradado del marfil #FBF3E2 al champán #EBD9AE, la letra en el oro profundo #6F4E37, con su brillo de
 * arriba y su sombra. Es el de TODOS los botones principales. En clases de Tailwind es `btn-champan` (src/index.css); aquí, el mismo estilo para los botones con `style`.
 * `enOscuro`: sobre un panel de tinta, el borde y la letra en oro pálido (#E9C77A).
 */
export const botonChampan = (enOscuro = false): CSSProperties =>
  enOscuro
    ? { background: 'transparent', border: '1px solid #E9C77A', color: '#E9C77A' }
    : { background: 'linear-gradient(180deg,#FBF3E2 0%,#EBD9AE 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8),0 8px 14px -8px rgba(111,78,55,.45)', color: '#6F4E37' }
