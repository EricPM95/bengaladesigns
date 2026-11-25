import type { ReactNode } from 'react'

/**
 * LA ETIQUETA (la píldora pequeña) del resto de la app (Noche 24-25 nov, «una sola forma»; la de `Piezas/Entradas Billete` E1: «En tu ruta»). Una sola pieza para «En tu ruta», «Free Tour · En tu ruta», «Cerrado»… :
 *   · `tono="oro"` (por defecto): fondo crema dorado (#F3E3B2) y letra marrón (#6E5018) — «En tu ruta», lo que informa.
 *   · `tono="destacada"`: dorado macizo con letra blanca — «Te lo recomendamos» (la tarjeta destacada de la lista de días).
 *   · `tono="gris"`: sin relleno y con borde fino — «Cerrado», «Excursión».
 * Es del mundo «el resto»; HOY usa las suyas.
 */
export function Etiqueta({ children, tono = 'oro', datos }: { children: ReactNode; tono?: 'oro' | 'destacada' | 'gris'; datos?: Record<string, string> }): ReactNode {
  const estilo =
    tono === 'destacada'
      ? { background: '#B58A2E', color: '#FFFFFF', font: "700 10.5px 'Geist'" }
      : tono === 'gris'
        ? { background: 'transparent', color: 'rgba(28,34,48,.6)', border: '1px solid rgba(28,34,48,.15)', font: "500 10.5px 'Geist'" }
        : { background: '#F3E3B2', color: '#6E5018', font: "600 10.5px 'Geist'" }
  return (
    <span {...datos} className={`inline-flex flex-none items-center self-start whitespace-nowrap rounded-full ${tono === 'destacada' ? 'h-[19px] px-2' : 'h-[22px] px-[9px]'}`} style={estilo}>
      {children}
    </span>
  )
}
