import type { CSSProperties, ReactNode } from 'react'
import { SERIE } from '../estilo'

/** (V35A, Design P6) Piezas pequeñas de la pantalla «Usuarios»: la tarjeta blanca, el título de bloque, las fechas cortas y el número con punto de miles. */
export const CAJA: CSSProperties = { borderRadius: 22, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }
export const MONO = "'Geist Mono',monospace"
export const ORO_BARRA = 'linear-gradient(90deg,#E4C36E,#C99A44)'

/** Pura: un número con el punto de los miles, también de cuatro cifras («1.280»). */
export const numero = (v: number): string => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const Titulo = ({ children, dato }: { children: ReactNode; dato?: string }): ReactNode => (
  <span data-bloque={dato} style={{ font: "600 14px 'Geist'" }}>
    {children}
  </span>
)

export const Cuadro = ({ dato, children, estilo }: { dato: string; children: ReactNode; estilo?: CSSProperties }): ReactNode => (
  <div data-bloque={dato} style={{ ...CAJA, ...estilo }}>
    {children}
  </div>
)

/** Un bloque que todavía no tiene datos (V35B): lo dice con «Pronto», sin inventar nada. */
export const Pronto = ({ children }: { children: ReactNode }): ReactNode => (
  <div data-pronto style={{ display: 'flex', alignItems: 'center', gap: 8, font: "500 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>
    <span style={{ height: 22, padding: '0 9px', borderRadius: 999, background: '#F1EADC', display: 'inline-flex', alignItems: 'center', font: "600 11px 'Geist'", color: '#8A6A2C' }}>Pronto</span>
    {children}
  </div>
)

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const partes = (d: string): [number, number, number] => [Number(d.slice(0, 4)), Number(d.slice(5, 7)), Number(d.slice(8, 10))]

/** Pura: «26–29 nov» (mismo mes), «28 nov – 3 dic» (distinto mes) o «26 nov». Sin año, para la lista. */
export function rangoCorto(inicio: string | null | undefined, fin: string | null | undefined): string {
  if (!inicio) return '—'
  const [, m1, d1] = partes(inicio)
  if (!fin || fin === inicio) return `${d1} ${MESES[m1 - 1]}`
  const [, m2, d2] = partes(fin)
  return m1 === m2 ? `${d1}–${d2} ${MESES[m2 - 1]}` : `${d1} ${MESES[m1 - 1]} – ${d2} ${MESES[m2 - 1]}`
}
/** Pura: «26 – 29 nov 2026» (con año, para la ficha). */
export function rangoLargo(inicio: string | null | undefined, fin: string | null | undefined): string {
  if (!inicio) return 'Sin fechas'
  const [a1, m1, d1] = partes(inicio)
  if (!fin || fin === inicio) return `${d1} ${MESES[m1 - 1]} ${a1}`
  const [a2, m2, d2] = partes(fin)
  if (a1 !== a2) return `${d1} ${MESES[m1 - 1]} ${a1} – ${d2} ${MESES[m2 - 1]} ${a2}`
  return m1 === m2 ? `${d1} – ${d2} ${MESES[m2 - 1]} ${a2}` : `${d1} ${MESES[m1 - 1]} – ${d2} ${MESES[m2 - 1]} ${a2}`
}
/** Pura: «12 nov» de un instante (en la hora de Madrid). */
export const diaCorto = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const dia = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
  return `${Number(dia.slice(8, 10))} ${MESES[Number(dia.slice(5, 7)) - 1]}`
}
/** Pura: «12 mar 2026». */
export const fechaLarga = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const dia = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
  return `${Number(dia.slice(8, 10))} ${MESES[Number(dia.slice(5, 7)) - 1]} ${dia.slice(0, 4)}`
}
/** Pura: «Hoy · 09:14», «Ayer · 18:02» o «12 nov · 09:14» (hora de Madrid); `hoy` = «AAAA-MM-DD». */
export function ultimoAcceso(iso: string | null | undefined, hoy: string): string {
  if (!iso) return '—'
  const f = new Date(iso)
  const dia = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(f)
  const hora = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).format(f)
  const ayer = new Date(`${hoy}T12:00:00Z`)
  ayer.setUTCDate(ayer.getUTCDate() - 1)
  const nombre = dia === hoy ? 'Hoy' : dia === ayer.toISOString().slice(0, 10) ? 'Ayer' : diaCorto(iso)
  return `${nombre} · ${hora}`
}

/** El círculo con la inicial: un color por persona (siempre el mismo para la misma). */
const AVATARES = ['linear-gradient(140deg,#F8E7BC,#C99A44)', 'linear-gradient(140deg,#DDEBFA,#8AA8D8)', 'linear-gradient(140deg,#DDF1DC,#8AC09A)', 'linear-gradient(140deg,#F1E6FA,#B89AD8)', 'linear-gradient(140deg,#FADCDC,#D89A9A)', 'linear-gradient(140deg,#FBEFC8,#D8B860)']
export function Avatar({ id, nombre, tam = 34 }: { id: string; nombre: string; tam?: number }): ReactNode {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return (
    <span aria-hidden="true" style={{ flex: 'none', width: tam, height: tam, borderRadius: '50%', background: AVATARES[h % AVATARES.length], display: 'flex', alignItems: 'center', justifyContent: 'center', font: `400 ${Math.round(tam / 2)}px ${SERIE}`, color: '#2A1D10' }}>
      {(nombre.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}
