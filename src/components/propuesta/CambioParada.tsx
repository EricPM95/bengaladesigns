import { ParadaFoto } from '../route/hoy/v2/ParadaFoto'

/**
 * «PROPUESTA: CAMBIAR» (pieza «Cambio Parada» del diseño, cuentas parte 3): cambiar una parada por otra va como UNA pareja, en su recuadro. Lo que sale, tachado en rojo; lo que
 * entra, en verde; entre las dos, la flecha de cambio. Se usa en el modo recomendación (RM), en la lista de cambios (RV) y en la hoja del administrador (R2).
 * `grande`: con la foto de cada sitio y sus horas (RM); `pequena`: sin fotos, un círculo con − y + (RV y R2).
 */
export function CambioParada({
  a,
  b,
  fotoA = null,
  fotoB = null,
  detalleA = '',
  detalleB = '',
  tamano = 'grande',
}: {
  a: string
  b: string
  fotoA?: string | null
  fotoB?: string | null
  /** «15:00 · 1 h» (solo en grande) */
  detalleA?: string
  detalleB?: string
  tamano?: 'grande' | 'pequena'
}) {
  const peq = tamano === 'pequena'
  const ROJO = 'oklch(0.55 0.17 5)'
  const VERDE = 'oklch(0.38 0.1 150)'
  const marca = (signo: string, fondo: string) => (
    <span style={{ width: 18, height: 18, flex: 'none', borderRadius: '50%', background: fondo, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 11px 'Geist'" }}>{signo}</span>
  )
  return (
    <div
      data-cambio-parada={tamano}
      style={{ width: '100%', boxSizing: 'border-box', borderRadius: peq ? 12 : 18, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.12)', padding: peq ? '8px 10px' : '10px 12px', display: 'flex', flexDirection: 'column', gap: peq ? 5 : 7, color: '#1C2230' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(0.5 0.12 78)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
        </svg>
        Propuesta: cambiar
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {peq ? marca('−', ROJO) : <ParadaFoto nombre={a} photoUrl={fotoA} vista={false} marca={false} size={40} />}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span data-sale style={{ font: peq ? "500 13px/1.3 'Geist'" : "400 17px/1.1 'Instrument Serif',serif", color: ROJO, textDecoration: 'line-through' }}>
            {a}
          </span>
          {!peq && detalleA && <span style={{ font: "500 11px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{detalleA}</span>}
        </span>
      </div>
      <div aria-hidden="true" style={{ position: 'relative', height: 1, margin: `2px 0 2px ${peq ? 28 : 50}px`, background: 'rgba(28,34,48,.1)' }}>
        <span style={{ position: 'absolute', left: peq ? -21 : -41, top: -11, width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF', border: '1px solid rgba(28,34,48,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(28,34,48,.6)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 4v16M4 16l4 4 4-4M16 20V4M12 8l4-4 4 4" />
          </svg>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {peq ? marca('+', 'oklch(0.55 0.11 150)') : <ParadaFoto nombre={b} photoUrl={fotoB} vista={false} marca={false} size={40} />}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span data-entra style={{ font: peq ? "600 13px/1.3 'Geist'" : "400 17px/1.1 'Instrument Serif',serif", color: VERDE }}>
            {b}
          </span>
          {!peq && detalleB && <span style={{ font: "500 11px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{detalleB}</span>}
        </span>
      </div>
    </div>
  )
}
