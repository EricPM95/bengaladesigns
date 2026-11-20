import type { CSSProperties, ReactNode } from 'react'

/** (V33) Piezas de estilo del panel, las de Design «Panel Jutrip»: tarjetas blancas, números en serif, pastillas de color. */
export const SERIE = "'Instrument Serif',serif"
export const TINTA = '#1C2230'
export const ORO = '#F3D88F'

export const tarjeta: CSSProperties = { borderRadius: 22, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }
/** (V35A) La tarjeta grande de Design (los bloques con título en serif: «Desde dónde viajan», «Lo que contestaron…»). */
export const tarjetaGrande: CSSProperties = { borderRadius: 24, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }
export const etiquetaMono: CSSProperties = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }
export const boton = (oscuro = false, desactivado = false): CSSProperties => ({
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 999,
  border: oscuro ? 'none' : '1px solid rgba(28,34,48,.2)',
  background: oscuro ? TINTA : '#FFFFFF',
  color: oscuro ? ORO : TINTA,
  font: "600 14px 'Geist'",
  cursor: desactivado ? 'default' : 'pointer',
  opacity: desactivado ? 0.5 : 1,
})

export function Pastilla({ children, fondo = '#F1EADC', color = TINTA }: { children: ReactNode; fondo?: string; color?: string }): ReactNode {
  return <span style={{ flex: 'none', height: 22, padding: '0 9px', borderRadius: 999, background: fondo, color, display: 'inline-flex', alignItems: 'center', font: "600 11px 'Geist'", whiteSpace: 'nowrap' }}>{children}</span>
}

export function Cifra({ etiqueta, valor, pie, destacada = false, oscura = false, chica = false, relleno, tamano }: { etiqueta: string; valor: ReactNode; pie?: ReactNode; destacada?: boolean; oscura?: boolean; chica?: boolean; relleno?: string; tamano?: number }): ReactNode {
  const fondo = oscura ? TINTA : destacada ? 'oklch(0.97 0.03 5)' : '#FFFFFF'
  const borde = oscura ? TINTA : destacada ? 'oklch(0.58 0.19 5 / .35)' : 'rgba(28,34,48,.08)'
  const lc = oscura ? ORO : destacada ? 'oklch(0.5 0.19 5)' : 'rgba(28,34,48,.5)'
  const vc = oscura ? '#FFFDF8' : destacada ? 'oklch(0.5 0.19 5)' : TINTA
  return (
    <div data-cifra={etiqueta} style={{ padding: relleno ?? (chica ? 14 : '14px 16px'), borderRadius: 20, background: fondo, border: `1px solid ${borde}`, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: lc, textTransform: 'uppercase' }}>{etiqueta}</span>
      <span style={{ font: `400 ${tamano ?? (chica ? 26 : 30)}px/1 ${SERIE}`, color: vc }}>{valor}</span>
      {pie && <span style={{ font: "400 12.5px/1.35 'Geist'", color: oscura ? 'rgba(255,253,248,.65)' : 'rgba(28,34,48,.5)' }}>{pie}</span>}
    </div>
  )
}

export function Filtro({ activo, children, onClick, dato }: { activo: boolean; children: ReactNode; onClick: () => void; dato?: string }): ReactNode {
  return (
    <button type="button" data-filtro={dato} aria-pressed={activo} onClick={onClick} style={{ minHeight: 36, padding: '0 14px', borderRadius: 999, background: activo ? TINTA : '#FFFFFF', color: activo ? ORO : TINTA, border: `1px solid ${activo ? TINTA : 'rgba(28,34,48,.14)'}`, font: "600 13px 'Geist'", cursor: 'pointer' }}>
      {children}
    </button>
  )
}

/** Un gráfico de barras sencillo (los pases por día): barras de oro, la más alta al 100 %. */
export function Barras({ valores, alto = 120, etiquetas }: { valores: number[]; alto?: number; etiquetas?: string[] }): ReactNode {
  const max = Math.max(1, ...valores)
  return (
    <div data-barras style={{ height: alto, display: 'flex', alignItems: 'flex-end', gap: 5 }}>
      {valores.map((v, i) => (
        <span key={i} title={`${etiquetas?.[i] ?? ''} ${v}`.trim()} style={{ flex: 1, height: `${Math.max(2, (v / max) * 100)}%`, borderRadius: '6px 6px 2px 2px', background: 'linear-gradient(180deg,#E4C36E,#C99A44)' }} />
      ))}
    </div>
  )
}

export const Vacio = ({ children }: { children: ReactNode }): ReactNode => <p style={{ margin: 0, font: "400 14px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{children}</p>
