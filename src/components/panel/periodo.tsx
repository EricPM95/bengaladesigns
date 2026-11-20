import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { create } from 'zustand'

/**
 * (V35A, Design P1/P5/P5b/M5b) EL SELECTOR DE PERIODO, EL MISMO arriba en cada pantalla con fechas (Inicio, Ventas, Destinos pedidos, Usuarios): Últimos 7 días · Este mes · Últimos 30 días · Últimos 6 meses · Este año · Todo ·
 * Personalizado (calendario de inicio y fin, con [Aplicar]). En el móvil es un desplegable. El periodo elegido es UNO para todo el panel (se acuerda al cambiar de pantalla). `parametrosDePeriodo()` lo pasa al servidor
 * (`?periodo=30d` o `?periodo=custom&desde=…&hasta=…`); el título de cada bloque lo dice (`titulo` que devuelve el servidor, p. ej. «este mes» o «3 nov – 18 nov»).
 */
export type Periodo = '7d' | 'mes' | '30d' | '6m' | 'anio' | 'todo' | 'custom'
export const PERIODOS: { id: Periodo; nombre: string }[] = [
  { id: '7d', nombre: 'Últimos 7 días' },
  { id: 'mes', nombre: 'Este mes' },
  { id: '30d', nombre: 'Últimos 30 días' },
  { id: '6m', nombre: 'Últimos 6 meses' },
  { id: 'anio', nombre: 'Este año' },
  { id: 'todo', nombre: 'Todo' },
  { id: 'custom', nombre: 'Personalizado' },
]
interface EstadoDePeriodo {
  periodo: Periodo
  desde: string
  hasta: string
  poner: (p: Periodo, desde?: string, hasta?: string) => void
}
export const usePeriodo = create<EstadoDePeriodo>((set) => ({
  periodo: 'mes',
  desde: '',
  hasta: '',
  poner: (periodo, desde = '', hasta = '') => set({ periodo, desde, hasta }),
}))

/** Pura: lo que se añade a la dirección de la API (`periodo=30d`, o `periodo=custom&desde=…&hasta=…`). */
export const parametrosDePeriodo = (p: { periodo: Periodo; desde: string; hasta: string }): string =>
  p.periodo === 'custom' && p.desde && p.hasta ? `periodo=custom&desde=${p.desde}&hasta=${p.hasta}` : `periodo=${p.periodo === 'custom' ? 'mes' : p.periodo}`

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const dos = (n: number) => String(n).padStart(2, '0')
const aDia = (a: number, m: number, d: number) => `${a}-${dos(m + 1)}-${dos(d)}`
const hoyLocal = (): string => {
  const f = new Date()
  return aDia(f.getFullYear(), f.getMonth(), f.getDate())
}
const cortoDeDia = (dia: string) => `${Number(dia.slice(8, 10))} ${MESES_CORTOS[Number(dia.slice(5, 7)) - 1]}`
export const textoDeRango = (desde: string, hasta: string): string => (desde && hasta ? (desde === hasta ? cortoDeDia(desde) : `${cortoDeDia(desde)} – ${cortoDeDia(hasta)}`) : '')

function Calendario({ inicial, alAplicar, movil }: { inicial: { desde: string; hasta: string }; alAplicar: (desde: string, hasta: string) => void; movil: boolean }): ReactNode {
  const base = (inicial.hasta || hoyLocal()).slice(0, 7).split('-').map(Number)
  const [mostrado, setMostrado] = useState<[number, number]>([base[0], base[1] - 1])
  const [desde, setDesde] = useState(inicial.desde)
  const [hasta, setHasta] = useState(inicial.hasta)
  const [a, m] = mostrado
  const primerDia = (new Date(a, m, 1).getDay() + 6) % 7 // lunes = 0
  const dias = new Date(a, m + 1, 0).getDate()
  const celdas = useMemo(() => [...Array.from({ length: primerDia }, () => null), ...Array.from({ length: dias }, (_, i) => i + 1)], [primerDia, dias])
  const tocar = (d: number) => {
    const dia = aDia(a, m, d)
    if (!desde || (desde && hasta)) {
      setDesde(dia)
      setHasta('')
    } else if (dia < desde) {
      setHasta(desde)
      setDesde(dia)
    } else setHasta(dia)
  }
  const fin = hasta || desde
  const mover = (k: number) => setMostrado(([aa, mm]) => (mm + k < 0 ? [aa - 1, 11] : mm + k > 11 ? [aa + 1, 0] : [aa, mm + k]))
  return (
    <div data-calendario style={{ borderRadius: movil ? '26px 26px 0 0' : 22, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', boxShadow: '0 26px 50px -18px rgba(28,34,48,.6)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, width: movil ? '100%' : 310, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" data-cal-anterior aria-label="Mes anterior" onClick={() => mover(-1)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(28,34,48,.12)', background: 'transparent', font: "400 16px 'Geist'", cursor: 'pointer' }}>‹</button>
        <span style={{ font: "400 21px 'Instrument Serif',serif" }}>{MESES[m]} {a}</span>
        <button type="button" data-cal-siguiente aria-label="Mes siguiente" onClick={() => mover(1)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(28,34,48,.12)', background: 'transparent', font: "400 16px 'Geist'", cursor: 'pointer' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', font: "500 10px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(28,34,48,.5)', textAlign: 'center' }}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => <span key={x}>{x}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', rowGap: 2 }}>
        {celdas.map((d, i) => {
          if (d === null) return <span key={`v${i}`} />
          const dia = aDia(a, m, d)
          const extremo = dia === desde || dia === fin
          const dentro = Boolean(desde && fin && dia >= desde && dia <= fin)
          return (
            <span key={dia} style={{ height: 34, background: dentro ? '#F6E7C0' : 'transparent', borderRadius: dia === desde ? '17px 0 0 17px' : dia === fin ? '0 17px 17px 0' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button type="button" data-cal-dia={dia} onClick={() => tocar(d)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: extremo ? '#1C2230' : 'transparent', color: extremo ? '#F3D88F' : '#1C2230', font: `${extremo ? 700 : 500} 13px 'Geist'`, cursor: 'pointer' }}>{d}</button>
            </span>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
        <span data-cal-texto style={{ font: "600 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{textoDeRango(desde, fin) || 'Elige inicio y fin'}</span>
        <button type="button" data-cal-aplicar disabled={!desde} onClick={() => desde && alAplicar(desde, fin || desde)} style={{ height: 38, padding: '0 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', color: '#4A3510', font: "700 13.5px 'Geist'", opacity: desde ? 1 : 0.5, cursor: desde ? 'pointer' : 'default' }}>Aplicar</button>
      </div>
    </div>
  )
}

/** El selector. `movil`: un desplegable (con el calendario abajo para «Personalizado»). Arriba de cada pantalla con fechas, igual en todas. */
export function SelectorDePeriodo({ movil }: { movil: boolean }): ReactNode {
  const { periodo, desde, hasta, poner } = usePeriodo()
  const [abierto, setAbierto] = useState(false)
  useEffect(() => {
    if (!abierto) return undefined
    const f = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [abierto])
  const etiquetaPersonal = periodo === 'custom' && desde && hasta ? textoDeRango(desde, hasta) : 'Personalizado'
  const elegir = (p: Periodo) => {
    if (p === 'custom') setAbierto(true)
    else {
      setAbierto(false)
      poner(p)
    }
  }
  const aplicar = (d: string, h: string) => {
    poner('custom', d, h)
    setAbierto(false)
  }
  const calendario = abierto && (
    <div data-calendario-caja style={movil ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60 } : { position: 'absolute', left: 70, top: 48, zIndex: 20 }}>
      {movil && <div onClick={() => setAbierto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,34,48,.35)', zIndex: -1 }} />}
      <Calendario inicial={{ desde, hasta }} alAplicar={aplicar} movil={movil} />
    </div>
  )
  if (movil) {
    return (
      <div data-selector-periodo data-movil style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <span style={{ flex: 'none', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }}>PERIODO</span>
        <select data-periodo-desplegable aria-label="Periodo" value={periodo} onChange={(e) => elegir(e.target.value as Periodo)} style={{ flex: 1, minHeight: 44, borderRadius: 999, border: 'none', background: '#EDE3CD', padding: '0 16px', font: "600 13px 'Geist'", color: '#1C2230' }}>
          {PERIODOS.map((p) => <option key={p.id} value={p.id}>{p.id === 'custom' ? etiquetaPersonal : p.nombre}</option>)}
        </select>
        {periodo === 'custom' && !abierto && <button type="button" data-cambiar-fechas onClick={() => setAbierto(true)} style={{ minHeight: 44, borderRadius: 999, border: '1px solid rgba(28,34,48,.2)', background: '#fff', padding: '0 14px', font: "600 12.5px 'Geist'" }}>Fechas</button>}
        {calendario}
      </div>
    )
  }
  return (
    <div data-selector-periodo style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
      <span style={{ flex: 'none', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }}>PERIODO</span>
      <div role="tablist" aria-label="Periodo" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: '#EDE3CD', overflow: 'hidden', minWidth: 0 }}>
        {PERIODOS.map((p) => {
          const on = p.id === periodo
          return (
            <button key={p.id} type="button" role="tab" aria-selected={on} data-periodo={p.id} onClick={() => elegir(p.id)} style={{ flex: 'none', height: 34, padding: '0 18px', borderRadius: 999, border: 'none', background: on ? '#1C2230' : 'transparent', color: on ? '#F3D88F' : 'rgba(28,34,48,.7)', display: 'flex', alignItems: 'center', gap: 6, font: "600 12.5px 'Geist'", whiteSpace: 'nowrap', cursor: 'pointer' }}>
              {p.id === 'custom' ? etiquetaPersonal : p.nombre}
              {p.id === 'custom' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" /></svg>}
            </button>
          )
        })}
      </div>
      {calendario}
    </div>
  )
}

/** Un título de bloque con el periodo detrás: «Pases vendidos · este mes». */
export const TituloConPeriodo = ({ texto, titulo }: { texto: string; titulo?: string | null }): ReactNode => (
  <span data-titulo-bloque style={{ font: "600 14px 'Geist'" }}>
    {texto}{titulo ? ` · ${titulo}` : ''}
  </span>
)
