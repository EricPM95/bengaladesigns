import { Fragment } from 'react'

const PASE = /(Pase de [A-ZÁÉÍÓÚÑ][\p{L}'’-]*(?: [A-ZÁÉÍÓÚÑ][\p{L}'’-]*)*)/u

/**
 * El «Pase de Roma» de los textos, resaltado como en el diseño (letra de los titulares, cursiva, dorado). Funciona con cualquier destino: «Pase de Florencia»…
 * `oscuro`: sobre fondo azul noche (dorado claro); sobre fondo claro, dorado oscuro.
 */
export function TextoConPase({ texto, oscuro = false }: { texto: string; oscuro?: boolean }) {
  const partes = String(texto ?? '').split(PASE)
  return (
    <>
      {partes.map((p, i) =>
        i % 2 === 1 ? (
          <em key={i} data-pase-resaltado style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontWeight: 400, fontSize: '1.15em', color: oscuro ? '#F3D59A' : '#B8903E' }}>
            {p}
          </em>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}
