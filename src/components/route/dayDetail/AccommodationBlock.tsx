import { useRouteStore } from '../../../store/useRouteStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { usePagoActivo } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { enlaceComoLlegarAlojamiento } from '../../../lib/direccionAlojamiento'
import { CandadoRedondo } from '../../pase/Candado'
import { useAlojamientoDelViaje } from '../alojamiento/useAlojamientoDelViaje'

interface AccommodationBlockProps {
  city: string
  /** Id del primer día de esta estancia — clave de `accommodationSelections` en el store. */
  segmentDayId: string
  totalNights: number
}

const DORADO_BOTON = 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)'
const FILA = { fontFamily: "'Geist Mono',monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', color: '#6E5018', whiteSpace: 'nowrap' as const }

/**
 * LA TARJETA DEL ALOJAMIENTO DENTRO DEL DÍA 1 (Tanda 10N11 §3; `Piezas/Alojamiento Dias` 01, 02 y 02b). Solo se pinta en el primer día de cada estancia (ver DayDetailPanel.tsx).
 *  - Sin alojamiento (01): «ALOJAMIENTO · ROMA», «Añade tu alojamiento» y [+ Añadir] (abre el mapa de alojamientos).
 *  - Con el pase (02): «ALOJAMIENTO · PRATI» (la zona), el nombre, la dirección y [Ir] (el camino desde donde estés hasta la dirección del hotel: el mismo enlace de [Cómo llegar a tu alojamiento]).
 *  - Sin el pase (02b): «ALOJAMIENTO · ROMA», el nombre (sin zona ni dirección) y [Ir] con el candado dorado sobre azul en la esquina; al tocarlo, el aviso del pase.
 * El alojamiento solo informa: no cambia la ruta (la zona y la dirección, del pase, sí orientan el primer día).
 */
export function AccommodationBlock({ city, segmentDayId }: AccommodationBlockProps) {
  const pago = usePagoActivo()
  const abrirMapa = useAlojamientoUi((state) => state.abrirMapa)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  const hotelDeEstaEstancia = useRouteStore((state) => state.accommodationSelections[segmentDayId])
  const viaje = useAlojamientoDelViaje()
  // La zona y la dirección son las del viaje (de la primera estancia); el nombre, el de esta estancia.
  const esLaPrimera = viaje.primeraEstanciaId === segmentDayId
  const nombre = (hotelDeEstaEstancia?.name ?? '').trim() || null
  const zona = pago && esLaPrimera ? viaje.zonaNombre : null
  const direccion = pago && esLaPrimera ? viaje.direccion : null
  const enlace = pago && esLaPrimera ? enlaceComoLlegarAlojamiento(viaje.direccion) : null
  const etiqueta = `ALOJAMIENTO · ${(zona ?? city).toUpperCase()}`

  const tarjeta = {
    minHeight: 76,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 22,
    background: '#FFFDF8',
    border: '1px solid rgba(181,138,46,.4)',
    boxShadow: '0 10px 22px -16px rgba(60,40,10,.5)',
    boxSizing: 'border-box' as const,
  }
  const icono = (
    <span aria-hidden="true" style={{ width: 46, height: 46, flex: 'none', borderRadius: 14, background: 'radial-gradient(circle at 35% 28%,#FFFDF8,#F3E3B2 70%,#E3C77E)', boxShadow: '0 0 0 1.5px #B58A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-8v5" />
      </svg>
    </span>
  )
  const botonOro = (children: React.ReactNode, props: { onClick?: () => void; href?: string; datos: string; etiqueta: string }) => {
    const estilo = { height: 42, padding: '0 15px', borderRadius: 999, background: DORADO_BOTON, color: '#3A2A0A', boxShadow: '0 8px 14px -8px rgba(110,80,24,.8),inset 0 1px 0 rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: 6, font: "700 13.5px 'Geist',sans-serif", flex: 'none', cursor: 'pointer', textDecoration: 'none', border: 0 } as const
    return props.href ? (
      <a className="zona-toque" href={props.href} target="_blank" rel="noopener noreferrer" data-alojamiento-dia={props.datos} aria-label={props.etiqueta} style={estilo} onClick={(e) => e.stopPropagation()}>
        {children}
      </a>
    ) : (
      <button type="button" className="zona-toque" data-alojamiento-dia={props.datos} aria-label={props.etiqueta} style={estilo} onClick={(e) => { e.stopPropagation(); props.onClick?.() }}>
        {children}
      </button>
    )
  }
  const svgIr = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3A2A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l18-8-8 18-2-8z" />
    </svg>
  )

  // 01: sin alojamiento.
  if (!nombre) {
    return (
      <div data-alojamiento-dia-bloque="vacio" style={tarjeta}>
        {icono}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={FILA}>{etiqueta}</span>
          <span style={{ font: "italic 400 19px/1.1 'Instrument Serif',serif", color: 'rgba(28,34,48,.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Añade tu alojamiento</span>
        </span>
        {botonOro(
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3A2A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Añadir
          </>,
          { onClick: () => abrirMapa(segmentDayId), datos: 'anadir', etiqueta: `Añadir alojamiento en ${city}` },
        )}
      </div>
    )
  }

  // 02 y 02b: con alojamiento. Con el pase, [Ir] lleva a la dirección (si no hay dirección, no sale: al tocar la tarjeta se abre «Tu alojamiento» para ponerla); sin el pase, [Ir] con el candado.
  return (
    <div data-alojamiento-dia-bloque={pago ? 'con-pase' : 'sin-pase'} role="button" tabIndex={0} onClick={() => abrirTuAlojamiento(segmentDayId)} onKeyDown={(e) => { if (e.key === 'Enter') abrirTuAlojamiento(segmentDayId) }} style={{ ...tarjeta, cursor: 'pointer' }} aria-label={`Ver o cambiar tu alojamiento: ${nombre}`}>
      {icono}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={FILA}>{etiqueta}</span>
        <span style={{ font: "400 21px/1.05 'Instrument Serif',serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</span>
        {direccion && <span style={{ fontSize: 12, color: 'rgba(28,34,48,.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{direccion}</span>}
      </span>
      {pago ? (
        enlace && botonOro(<>{svgIr}Ir</>, { href: enlace, datos: 'ir', etiqueta: 'Ir al alojamiento' })
      ) : (
        <span style={{ position: 'relative', flex: 'none', display: 'flex' }}>
          {botonOro(<>{svgIr}Ir</>, { onClick: () => abrirAvisoPase('alojamiento'), datos: 'ir-candado', etiqueta: 'Ir al alojamiento (con el Pase)' })}
          <CandadoRedondo tamano="pequeno" esquina datos="alojamiento-ir" />
        </span>
      )}
    </div>
  )
}
