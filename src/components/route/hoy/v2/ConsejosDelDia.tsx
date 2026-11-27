import { useEffect, useState } from 'react'
import { leerConsejos, type ConsejoDelDia, type IconoDeConsejo } from '../../../../lib/consejosDelDia'

/** Los trazos de cada icono (Design «Consejos del día»: 24×24, línea fina). `ropa` es la chaqueta de `abrigo`; `coche` es nuevo, con el mismo trazo. */
const ABRIGO: [string, string] = ['M9 3.5L5.2 6 3.5 12l2.6 1v7.5h11.8V13l2.6-1-1.7-6L15 3.5c-.4 1.4-1.6 2.2-3 2.2s-2.6-.8-3-2.2z', 'M12 5.7V20.5M9.6 10.5h.01M9.6 14h.01']
const TRAZOS: Record<IconoDeConsejo, [string, string]> = {
  agua: ['M12 3.5C9 8 6.5 10.8 6.5 14.2a5.5 5.5 0 0 0 11 0C17.5 10.8 15 8 12 3.5z', 'M9.3 14.6a2.8 2.8 0 0 0 2.2 2.4'],
  calzado: ['M3 15.5V8l5 1.5 2.5 3.5H19a2 2 0 0 1 2 2v1H3z', 'M3 18.5h18M8 11.5l1.4-1.6M10.6 13l1.2-1.4'],
  banador: ['M5 6h14l-2 11H7z', 'M5 6c1.2 2.2 3.8 3 7 3s5.8-.8 7-3M9.5 17c.3-3 1-5 2.5-5s2.2 2 2.5 5'],
  protector: ['M8.5 3.5h5v3.2h-5z', 'M7 6.7h8a1.5 1.5 0 0 1 1.5 1.5V20H5.5V8.2A1.5 1.5 0 0 1 7 6.7zM8.2 12h5.6M11 9.7v4.6'],
  sombrero: ['M3.5 15.5c0-2.2 3.6-3.5 8.5-3.5s8.5 1.3 8.5 3.5-3.6 3-8.5 3-8.5-.8-8.5-3z', 'M7.8 12.4C8 8.4 9.7 6 12 6s4 2.4 4.2 6.4M8 12.2c2.6.9 5.4.9 8 0'],
  abrigo: ABRIGO,
  efectivo: ['M3.5 8h17v8h-17z', 'M12 14.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4zM6.5 10.5h.01M17.5 13.5h.01'],
  documento: ['M7 3.5h7.5L18.5 8v12.5h-11.5z', 'M14.5 3.5V8h4M9.6 12h6M9.6 15h6M9.6 18h3.5'],
  ropa: ABRIGO,
  coche: ['M4 16v-4l1.8-4.5A1.5 1.5 0 0 1 7.2 6.5h9.6a1.5 1.5 0 0 1 1.4 1L20 12v4z', 'M4 12h16M7.5 16v2M16.5 16v2M7.5 14h.01M16.5 14h.01'],
}

/**
 * (V77, 13) El bloque «CONSEJOS PARA MAÑANA / PARA LA EXCURSIÓN / PARA HOY» (Design «Consejos del día», C1-C3): cada consejo con su icono en su círculo, la palabra en negrita y la frase en gris.
 * `tono="claro"` (la tarjeta de la excursión de HOY): el recuadro marfil del dibujo, círculo azul oscuro con el icono dorado. `tono="oscuro"` (la tarjeta oscura de MAÑANA): el mismo bloque adaptado al fondo
 * (círculo dorado, texto marfil), como las demás líneas de esa tarjeta. Sin consejos, no se pinta nada.
 */
export function BloqueDeConsejos({ consejos, cuando, tono, onCerrar }: { consejos: ConsejoDelDia[]; cuando: string; tono: 'claro' | 'oscuro'; /** (V80) Con X (en la tarjeta de la excursión de HOY): al cerrarlos no vuelven ese día en ese viaje (`avisosUnaVez`). */ onCerrar?: () => void }) {
  if (consejos.length === 0) return null
  const oscuro = tono === 'oscuro'
  return (
    <div
      data-consejos-del-dia={cuando}
      className="flex flex-col gap-0.5 rounded-[20px] px-3 pb-2 pt-3"
      style={oscuro ? { background: 'rgba(255,253,248,.06)', border: '1px solid rgba(251,243,226,.12)' } : { background: '#FBF3E2', border: '1px solid rgba(181,138,46,.4)' }}
    >
      <div className="flex items-center justify-between">
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: oscuro ? '#F3D88F' : '#6F4E37', padding: '0 2px 6px' }}>Consejos para {cuando}</span>
        {onCerrar && (
          <button type="button" onClick={onCerrar} data-consejos-x aria-label="Cerrar los consejos" className="-mr-1.5 -mt-1.5 flex h-11 w-11 flex-none items-center justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.1)', color: '#1C2230' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {consejos.map((c, i) => {
        const [d, d2] = TRAZOS[c.icono] ?? TRAZOS.documento
        return (
          <div key={`${c.icono}-${i}`} data-consejo={c.icono} className="flex items-center gap-3 py-2" style={{ borderTop: oscuro ? '1px solid rgba(251,243,226,.1)' : '1px solid rgba(28,34,48,.07)' }}>
            <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-full" style={{ background: oscuro ? '#F3D88F' : '#1C2230' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={oscuro ? '#6E5018' : '#F3D88F'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
                <path d={d2} />
              </svg>
            </span>
            <span style={{ font: "600 14px/1.3 'Geist'", color: oscuro ? '#FBF3E2' : '#1C2230' }}>
              {c.palabra}
              <span style={{ fontWeight: 500, color: oscuro ? 'rgba(251,243,226,.7)' : 'rgba(28,34,48,.62)' }}>: {c.frase}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Los consejos del día que dicen los datos del destino (carga perezosa, una vez por día). */
export function useConsejos(destino: string | null | undefined, ids: (string | null | undefined)[], titulos: (string | null | undefined)[]): ConsejoDelDia[] {
  const [consejos, setConsejos] = useState<ConsejoDelDia[]>([])
  const clave = `${destino}|${ids.join(',')}|${titulos.join(',')}`
  useEffect(() => {
    let vivo = true
    void leerConsejos(destino, ids, titulos).then((c) => vivo && setConsejos(c))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return consejos
}
