import { useState, type CSSProperties, type ReactNode } from 'react'
import { rangoDePeriodo } from '../../../../server/panel/logrosPanelDatos.js'
import { Bandera } from '../banderas'
import { SERIE, TINTA, ORO } from '../estilo'

/**
 * (V35A) Piezas comunes de «Logros y sonidos»: los tipos de lo que contesta el servidor (server/panel/logrosPanel.js), el selector de periodo de Design,
 * la tarjeta blanca, la pastilla de estado y un número con el punto de los miles.
 */
export interface FilaDeDestino {
  clave: string
  nombre: string
  iso: string | null
  estado: 'publicado' | 'oculto' | 'preparacion' | 'proximamente'
  con_datos: boolean
  sitios: number | null
  medallas: number | null
  colecciones: number | null
  emblemas: number | null
  maravillas: number | null
  dias_ruta: number | null
  flojas: string[]
  avisos: number
}
export interface PaginaDeDestino {
  ok: boolean
  clave: string
  nombre: string
  iso: string | null
  estado: FilaDeDestino['estado']
  portada: string | null
  numeros: { sitios: number | null; medallas: number | null; colecciones: number | null; emblemas: number | null; maravillas: number | null; dias_ruta: number | null }
  avisos: string[]
  sellos: { id: string; nombre: string; grados: { grado: 'bronce' | 'plata' | 'oro' | 'diamante'; desde: number; nombre: string; linea: string }[] }[]
  colecciones: { id: string; nombre: string; frase: string; sitios: { id: string; nombre: string; color: string }[] }[]
  emblemas: { id: string; nombre: string; linea: string; etiqueta: 'MARAVILLA' | 'SECRETO' | null; se_gana_en: string }[]
  patrimonios: { nombre: string; sitios: number; por_comprobar: number }[]
}
export interface ResumenDeLogros {
  ok: boolean
  destino: string | null
  destinos: { clave: string; nombre: string }[]
  logros_ganados: number
  personas: number
  cuentas: number | null
  mas_ganado: { nombre: string; personas: number } | null
  medallas: { grado: string; nombre: string; personas: number }[]
  colecciones: { id: string; nombre: string; sitios: number; completadas: number; en_curso: number }[]
  emblemas: { id: string; nombre: string; personas: number }[]
  viajero: { id: string; nombre: string; personas: number }[]
  sorteo: { premio: string | null; destino: string | null; anio: number | null; cierre: string | null; nivel_minimo: number | null; viajes_con_hoy_minimos: number | null }
  truncado?: boolean
}

export const ROSA = 'oklch(0.5 0.19 5)'
export const ROSA_FONDO = 'oklch(0.97 0.03 5)'
export const ROSA_BORDE = 'oklch(0.58 0.19 5 / .3)'
export const DORADO_OSCURO = '#8A6A2C'

/** Pura: un número con el punto de los miles («1.286»), también de cuatro cifras. (`miles` de api.ts no pone el punto en las de cuatro cifras.) */
export const num = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'))

export const tarjetaBlanca: CSSProperties = { borderRadius: 22, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }
export const titulo14: CSSProperties = { font: "600 14px 'Geist'" }
export const mono10 = (color = 'rgba(28,34,48,.5)', espacio = '.12em'): CSSProperties => ({ font: "600 10px 'Geist Mono',monospace", letterSpacing: espacio, color })

/** La barra de pestañas de Design: una píldora crema con las pestañas dentro; la activa, oscura con letra dorada. */
export function Pestanas({ ids, activa, alElegir }: { ids: { id: string; nombre: string }[]; activa: string; alElegir: (id: string) => void }): ReactNode {
  return (
    <div role="tablist" data-pestanas style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: '#EDE3CD', alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' }}>
      {ids.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={t.id === activa} data-pestana={t.id} onClick={() => alElegir(t.id)} style={{ flex: 'none', minHeight: 36, padding: '0 18px', borderRadius: 999, border: 'none', cursor: 'pointer', background: t.id === activa ? TINTA : 'transparent', color: t.id === activa ? ORO : 'rgba(28,34,48,.65)', font: "600 13px 'Geist'", whiteSpace: 'nowrap' }}>
          {t.nombre}
        </button>
      ))}
    </div>
  )
}

export type IdPeriodo = '7d' | 'mes' | '30d' | '6m' | 'anio' | 'todo' | 'custom'
const PERIODOS: { id: IdPeriodo; nombre: string }[] = [
  { id: '7d', nombre: 'Últimos 7 días' },
  { id: 'mes', nombre: 'Este mes' },
  { id: '30d', nombre: 'Últimos 30 días' },
  { id: '6m', nombre: 'Últimos 6 meses' },
  { id: 'anio', nombre: 'Este año' },
  { id: 'todo', nombre: 'Todo' },
]
export const NOMBRE_PERIODO: Record<string, string> = { '7d': 'Últimos 7 días', mes: 'Este mes', '30d': 'Últimos 30 días', '6m': 'Últimos 6 meses', anio: 'Este año', todo: 'Desde siempre', custom: 'Periodo elegido' }

export interface Periodo { id: IdPeriodo; desde: string; hasta: string }
/** Pura: de un periodo elegido a las fechas que se mandan al servidor (ISO o vacío = sin límite). */
export function fechasDe(p: Periodo, ahora = new Date()): { desde: string | null; hasta: string | null } {
  if (p.id === 'custom') return { desde: p.desde ? new Date(`${p.desde}T00:00:00`).toISOString() : null, hasta: p.hasta ? new Date(`${p.hasta}T23:59:59`).toISOString() : null }
  return rangoDePeriodo(p.id, ahora)
}

/** El selector de periodo («PERIODO · Últimos 7 días · Este mes … · Personalizado»). */
export function SelectorDePeriodo({ periodo, alCambiar, movil }: { periodo: Periodo; alCambiar: (p: Periodo) => void; movil: boolean }): ReactNode {
  const [abierto, setAbierto] = useState(periodo.id === 'custom')
  const caja: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: 4, borderRadius: 999, background: '#EDE3CD', maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' }
  const pastilla = (activo: boolean): CSSProperties => ({ flex: 'none', minHeight: 36, padding: '0 14px', borderRadius: 999, border: 'none', cursor: 'pointer', background: activo ? TINTA : 'transparent', color: activo ? ORO : 'rgba(28,34,48,.65)', font: "600 13px 'Geist'", whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8 })
  return (
    <div data-periodo style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: movil ? 10 : 14, maxWidth: '100%' }}>
        <span style={{ ...mono10('rgba(28,34,48,.5)', '.14em'), flex: 'none' }}>PERIODO</span>
        <div style={caja}>
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" data-periodo-id={p.id} aria-pressed={periodo.id === p.id} onClick={() => { setAbierto(false); alCambiar({ ...periodo, id: p.id }) }} style={pastilla(periodo.id === p.id)}>{p.nombre}</button>
          ))}
          <button type="button" data-periodo-id="custom" aria-pressed={periodo.id === 'custom'} onClick={() => { setAbierto(true); alCambiar({ ...periodo, id: 'custom' }) }} style={pastilla(periodo.id === 'custom')}>
            Personalizado
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" /></svg>
          </button>
        </div>
      </div>
      {abierto && (
        <div data-periodo-fechas style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', font: "500 13px 'Geist'" }}>
          Del
          <input type="date" aria-label="Desde" value={periodo.desde} onChange={(e) => alCambiar({ ...periodo, id: 'custom', desde: e.target.value })} style={{ minHeight: 40, padding: '0 10px', borderRadius: 10, border: '1.5px solid rgba(28,34,48,.16)', font: "400 14px 'Geist'" }} />
          al
          <input type="date" aria-label="Hasta" value={periodo.hasta} onChange={(e) => alCambiar({ ...periodo, id: 'custom', hasta: e.target.value })} style={{ minHeight: 40, padding: '0 10px', borderRadius: 10, border: '1.5px solid rgba(28,34,48,.16)', font: "400 14px 'Geist'" }} />
        </div>
      )}
    </div>
  )
}

const ESTADOS = {
  publicado: { texto: 'Publicado', fondo: '#DCEBDD', color: '#2F6B43' },
  oculto: { texto: 'Solo administradores', fondo: '#F6E8C8', color: '#7A5A14' },
  preparacion: { texto: 'En preparación', fondo: '#EFE6D2', color: '#6B5A32' },
  proximamente: { texto: 'Próximamente', fondo: '#E3E8F4', color: '#2A4A94' },
} as const
export function PastillaDeEstado({ estado, chica = false }: { estado: FilaDeDestino['estado']; chica?: boolean }): ReactNode {
  const e = ESTADOS[estado]
  return <span data-estado={estado} style={{ minHeight: chica ? 20 : 24, padding: chica ? '2px 5px' : '0 10px', borderRadius: 999, background: e.fondo, color: e.color, display: 'inline-flex', alignItems: 'center', font: `700 ${chica ? 8.5 : 11.5}px 'Geist'`, whiteSpace: chica ? 'normal' : 'nowrap', textAlign: 'center', lineHeight: 1.1 }}>{chica && estado === 'oculto' ? 'Oculto' : e.texto}</span>
}

/** Un bloque de carga o de «no se ha podido» para cuando el servidor no contesta. */
export function Cargando({ datos, children }: { datos: unknown; children: ReactNode }): ReactNode {
  if (datos === undefined) return <p style={{ margin: 0, font: "400 14px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Cargando…</p>
  if (datos === null) return <p role="alert" style={{ margin: 0, font: "400 14px 'Geist'", color: ROSA }}>No se han podido leer los datos. Comprueba que has entrado con tu cuenta de administrador.</p>
  return <>{children}</>
}

export { Bandera, SERIE, TINTA, ORO }
