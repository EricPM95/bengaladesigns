import { Fragment } from 'react'
import { Marca } from '../pase/Marca'

const MARCA = /(HOY|modo Hoy|Pase (?!Dúo|Grupo|Individual)[A-ZÁÉÍÓÚÑ][\p{L}'’-]*(?: [A-ZÁÉÍÓÚÑ][\p{L}'’-]*)*)/u

/**
 * Las marcas de la app dentro de una frase (Tanda 10H): «Pase Roma» (cualquier destino: «Pase Florencia»…) y «HOY» salen SIEMPRE en oro, con la pieza `Marca`: el oro profundo en texto pequeño, el oro oscuro
 * en títulos de 18 px o más (`grande`) y el oro pálido sobre fondo oscuro (`oscuro`). El «Pase X» va en la letra de los titulares, en cursiva (como en el diseño).
 */
export function TextoConPase({ texto, oscuro = false, grande = false }: { texto: string; oscuro?: boolean; grande?: boolean }) {
  const partes = String(texto ?? '').split(MARCA)
  return (
    <>
      {partes.map((p, i) =>
        i % 2 === 1 ? (
          <Marca key={i} oscuro={oscuro} grande={grande} cursiva={p.startsWith('Pase ')}>
            {p}
          </Marca>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}
