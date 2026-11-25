import type { CSSProperties } from 'react'
import { BOTON_ORO } from '../components/ui/botonesOro'

/**
 * V53 §1: YA NO HAY CHAMPÁN: `botonChampan()` devuelve `BOTON_ORO` (el dorado de Design). Antes: EL BOTÓN PRINCIPAL, CHAMPÁN (Tanda 10E, «Marca JUTRIP 02»: Continuar, Comprar, Cómo llegar): degradado del marfil #FBF3E2 al champán #EBD9AE, la letra en el oro profundo #6F4E37, con su brillo de
 * arriba y su sombra. Es el de TODOS los botones principales. En clases de Tailwind es `btn-champan` (src/index.css); aquí, el mismo estilo para los botones con `style`.
 * `enOscuro`: sobre un panel de tinta, el borde y la letra en oro pálido (#E9C77A).
 */
export const botonChampan = (enOscuro = false): CSSProperties =>
  enOscuro
    ? { background: 'transparent', border: '1px solid #E9C77A', color: '#E9C77A' }
    : { ...BOTON_ORO }
