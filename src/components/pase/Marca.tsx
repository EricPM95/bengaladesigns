import type { ReactNode } from 'react'

/**
 * LA MARCA EN LOS TEXTOS (Tanda 10H, Eric 24-oct): «HOY» y «Pase de {Destino}» van SIEMPRE en oro, para que se reconozcan como algo de la app. Una sola pieza, que se usa dentro de cualquier frase, con la regla de
 * lectura de Marca JUTRIP: en texto pequeño, el oro profundo (#6F4E37); en títulos de 18 px o más, el oro oscuro (#A67C52); sobre los paneles oscuros, el oro pálido (#E9C77A).
 *   <Marca>HOY</Marca>      <Marca grande>Pase de Roma</Marca>      <Marca oscuro>HOY</Marca>
 * Para frases ya escritas (con «HOY» o «Pase de X» dentro) está `TextoConPase`, que reparte el texto y usa esta pieza.
 */
export const ORO_PEQUENO = '#6F4E37'
export const ORO_TITULO = '#A67C52'
export const ORO_PALIDO = '#E9C77A'

export const colorDeMarca = ({ grande = false, oscuro = false }: { grande?: boolean; oscuro?: boolean }): string => (oscuro ? ORO_PALIDO : grande ? ORO_TITULO : ORO_PEQUENO)

export function Marca({ children, grande = false, oscuro = false, cursiva = false }: { children: ReactNode; grande?: boolean; oscuro?: boolean; cursiva?: boolean }) {
  if (cursiva) {
    return (
      <em data-marca data-pase-resaltado style={{ color: colorDeMarca({ grande, oscuro }), fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontWeight: 400, fontSize: '1.15em' }}>
        {children}
      </em>
    )
  }
  return (
    <span data-marca style={{ color: colorDeMarca({ grande, oscuro }), fontWeight: 600, ...(cursiva ? { fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontWeight: 400, fontSize: '1.15em' } : {}) }}>
      {children}
    </span>
  )
}
