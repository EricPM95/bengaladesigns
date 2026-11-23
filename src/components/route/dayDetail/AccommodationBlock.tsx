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
  /** (10S10 §6) El [+] lleva a RESERVAS › Alojamiento (sin él, abre el mapa de alojamientos como antes). */
  onAnadir?: () => void
}

const DORADO_REDONDO = 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)'
// (V42 §5.4, Design «02 · Días · con alojamiento») Con el alojamiento puesto, todo en verde: borde, cama, ✓ en la esquina del icono y la etiqueta.
const VERDE = 'oklch(0.5 0.1 150)'
const FILA = { fontFamily: "'Geist Mono',monospace", fontSize: 8.5, fontWeight: 600, letterSpacing: '.14em', color: VERDE, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }
/** El nombre corto de la zona: «Centro (Panteón, Trevi, Navona)» → «Centro». */
export const zonaCorta = (zona: string): string => zona.replace(/\s*[([].*$/, '').trim() || zona

/**
 * EL BLOQUE DEL ALOJAMIENTO, ARRIBA DE LOS DÍAS (V24; Design `Alojamiento Aviso` A1, A2, B1 y B2). Antes vivía dentro del día 1 (tanda 10N11); ahora va fuera, encima del primer día de cada destino, y no se repite dentro de los días.
 *  - Sin alojamiento (A1): borde de puntos, la cama, «Añade tu alojamiento», «Para ajustar tu ruta a tu zona» y [+] redondo dorado (abre RESERVAS › Alojamiento).
 *  - Con el pase (A2): «TU ALOJAMIENTO · PRATI» (la zona), el nombre, la dirección y [Ir] (el camino desde donde estés hasta el hotel: el mismo enlace de [Cómo llegar a tu alojamiento]). Se queda siempre.
 *  - Sin el pase: «TU ALOJAMIENTO · ROMA», el nombre y [Ir] con el candado (al tocarlo, el aviso del pase).
 * El alojamiento solo informa: no cambia la ruta (la zona y la dirección, del pase, sí orientan el primer día).
 */
export function AccommodationBlock({ city, segmentDayId, onAnadir }: AccommodationBlockProps) {
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
  const etiqueta = `ALOJAMIENTO · ${zonaCorta(zona ?? city).toUpperCase()}`

  const cama = (color: string, tamano: number) => (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-11v5M7 11.5a1.6 1.6 0 1 0 0-.1" />
    </svg>
  )
  const svgIr = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F6EFE0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l18-8-8 18-2-8z" />
    </svg>
  )

  // A1: sin alojamiento.
  if (!nombre) {
    return (
      <div data-alojamiento-dia-bloque="vacio" style={{ minHeight: 60, display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px 9px 10px', borderRadius: 18, background: 'rgba(255,253,248,.55)', border: '1.5px dashed rgba(181,138,46,.55)', boxSizing: 'border-box' }}>
        <span aria-hidden="true" style={{ width: 42, height: 42, flex: 'none', borderRadius: 12, background: '#EFE5D2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cama('#6A4E22', 22)}</span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ font: "600 14.5px/1.2 'Geist',sans-serif", color: '#1C2230' }}>Añade tu alojamiento</span>
          <span style={{ font: "400 12px/1.3 'Geist',sans-serif", color: 'rgba(28,34,48,.55)' }}>Para ajustar tu ruta a tu zona</span>
        </span>
        <button
          type="button"
          className="zona-toque"
          data-alojamiento-dia="anadir"
          aria-label={`Añadir alojamiento en ${city}`}
          onClick={(e) => {
            e.stopPropagation()
            if (onAnadir) onAnadir()
            else abrirMapa(segmentDayId)
          }}
          style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', border: 0, background: DORADO_REDONDO, boxShadow: '0 6px 12px -8px rgba(110,80,24,.8)', color: '#4A3510', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    )
  }

  // A2 (V42 §5.4, Design «02 · Días · con alojamiento»): con alojamiento, todo en verde (borde, cama y ✓ en la esquina del icono); arriba «ALOJAMIENTO · ZONA» (corta, con «…» antes del botón si no cabe), debajo el nombre y la dirección tal como la puso el viajero, con su pin; y a la derecha el botón REDONDO oscuro con la flecha (sin la palabra «Ir»), solo si hay dirección.
  // Con el pase, la flecha lleva a la dirección (solo si hay dirección); sin el pase, la flecha con el candado (al tocarla, el aviso del pase: es la invitación al Pase).
  const botonRedondo = { width: 38, height: 38, borderRadius: '50%', background: '#1C2230', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28)', color: '#F6EFE0', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', cursor: 'pointer', border: 0, padding: 0, textDecoration: 'none' } as const
  const pinChico = (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </svg>
  )
  return (
    <div
      data-alojamiento-dia-bloque={pago ? 'con-pase' : 'sin-pase'}
      role="button"
      tabIndex={0}
      onClick={() => abrirTuAlojamiento(segmentDayId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') abrirTuAlojamiento(segmentDayId)
      }}
      aria-label={`Ver o cambiar tu alojamiento: ${nombre}`}
      style={{ minHeight: 60, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px 8px 8px', borderRadius: 18, background: '#FFFDF8', border: '1.2px solid rgba(63,125,88,.55)', boxShadow: '0 12px 22px -16px rgba(40,90,60,.35)', boxSizing: 'border-box', cursor: 'pointer' }}
    >
      <span aria-hidden="true" data-alojamiento-cama style={{ position: 'relative', width: 42, height: 42, flex: 'none', borderRadius: 12, background: 'rgba(63,125,88,.16)', border: `1.2px solid ${VERDE}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cama(VERDE, 20)}
        <span data-alojamiento-visto style={{ position: 'absolute', top: -6, right: -6, width: 17, height: 17, borderRadius: '50%', background: VERDE, border: '2px solid #FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span data-alojamiento-etiqueta style={FILA}>{etiqueta}</span>
        <span data-alojamiento-nombre style={{ font: "400 18px/1.1 'Instrument Serif',serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</span>
        {direccion && (
          <span data-alojamiento-direccion style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(28,34,48,.55)', minWidth: 0 }}>
            {pinChico}
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{direccion}</span>
          </span>
        )}
      </span>
      {pago ? (
        enlace && (
          <a className="zona-toque" href={enlace} target="_blank" rel="noopener noreferrer" data-alojamiento-dia="ir" aria-label="Ir al alojamiento" style={botonRedondo} onClick={(e) => e.stopPropagation()}>
            {svgIr}
          </a>
        )
      ) : (
        <span style={{ position: 'relative', flex: 'none', display: 'flex' }}>
          <button type="button" className="zona-toque" data-alojamiento-dia="ir-candado" aria-label="Ir al alojamiento (con el Pase)" style={botonRedondo} onClick={(e) => { e.stopPropagation(); abrirAvisoPase('alojamiento') }}>
            {svgIr}
          </button>
          <CandadoRedondo tamano="pequeno" esquina datos="alojamiento-ir" />
        </span>
      )}
    </div>
  )
}
