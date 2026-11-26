import type { ReactNode } from 'react'
import FichaDeLogro from './FichaDeLogro'
import type { PantallaDe } from './useLogrosPantallas'

/**
 * (V72) «UNA COLECCIÓN POR DENTRO» YA NO EXISTE COMO PANTALLA APARTE: abrir `{ t: 'coleccion', destino, coleccion }` (el «Ver la colección ›» de las listas, el resumen del viaje, la hoja de logros…)
 * sube la ficha en grande de esa colección (`todos/FichaGrande.tsx`, la misma de la página del destino), sobre lo que hubiera detrás. Cerrarla vuelve a donde estabas.
 */
export default function FichaDeColeccion({ pantalla }: { pantalla: PantallaDe<'coleccion'> }): ReactNode {
  return <FichaDeLogro pantalla={{ t: 'ficha', clave: `coleccion:${pantalla.destino}:${pantalla.coleccion}` }} />
}
