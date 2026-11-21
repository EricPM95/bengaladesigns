import type { CSSProperties, ReactNode } from 'react'
import { ETIQUETA_COMPANIA, ETIQUETA_FRECUENCIA, euros, fechaCorta, hace, lineaDePrimeraVez, type UsuarioFila, type UsuariosLista } from '../api'
import { Avatar, MONO, numero, rangoCorto } from './piezas'

/**
 * (V35A, Design P6 / M3) LA LISTA, UNO A UNO: buscador, orden, filtros (Todos · Con pase · Sin pase · Destino · Cada cuánto viaja · Con quién viaja · «Viajan entre…»), la cuenta «X usuarios con estos filtros» y la tabla
 * (en el móvil, una tarjeta por persona). Paginada de 50 en 50. «Viajan entre…» filtra DE VERDAD en el servidor: solo quien tiene un viaje que cae en esas fechas (y a ese destino, si se elige); entonces «Próximo viaje» enseña ese viaje.
 */
export interface FiltrosDeLista {
  q: string
  pase: '' | 'si' | 'no'
  destino: string
  frecuencia: string
  compania: string
  orden: string
  entre: boolean
  desde: string
  hasta: string
  entreDestino: string
  pagina: number
}
export const FILTROS_INICIALES: FiltrosDeLista = { q: '', pase: '', destino: '', frecuencia: '', compania: '', orden: 'viajes', entre: false, desde: '', hasta: '', entreDestino: '', pagina: 1 }

/** Pura: lo que se pide al servidor (`?q=…&entre_desde=…`). */
export function consultaDeFiltros(f: FiltrosDeLista): string {
  const p = new URLSearchParams({ orden: f.orden, pagina: String(f.pagina) })
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.pase) p.set('pase', f.pase)
  if (f.destino) p.set('destino', f.destino)
  if (f.frecuencia) p.set('frecuencia', f.frecuencia)
  if (f.compania) p.set('compania', f.compania)
  if (f.entre) {
    if (f.desde) p.set('entre_desde', f.desde)
    if (f.hasta) p.set('entre_hasta', f.hasta)
    if (f.entreDestino) p.set('entre_destino', f.entreDestino)
  }
  return p.toString()
}

export const ORDENES = [
  ['viajes', 'Más viajes'],
  ['reciente', 'Más reciente'],
  ['acceso', 'Último acceso'],
  ['gastado', 'Más gastado'],
] as const

const MONO_CAB: CSSProperties = { font: `600 10.5px ${MONO}`, letterSpacing: '.1em', color: 'rgba(28,34,48,.55)' }
const COLUMNAS = '1.8fr 1fr .5fr 1.4fr .7fr 1.1fr .7fr 1.6fr'

/** Un desplegable con forma de pastilla (Destino ⌄, Cada cuánto viaja ⌄…): oscura cuando hay algo elegido. */
function Pastilla({ dato, etiqueta, valor, opciones, alCambiar }: { dato: string; etiqueta: string; valor: string; opciones: [string, string][]; alCambiar: (v: string) => void }): ReactNode {
  const activa = Boolean(valor)
  return (
    <label data-filtro={dato} style={{ position: 'relative', height: 34, minHeight: 34, padding: '0 14px', borderRadius: 999, background: activa ? '#1C2230' : '#FFFFFF', color: activa ? '#F3D88F' : '#1C2230', border: `1px solid ${activa ? '#1C2230' : 'rgba(28,34,48,.14)'}`, display: 'flex', alignItems: 'center', gap: 6, font: "600 12.5px 'Geist'", whiteSpace: 'nowrap' }}>
      <select aria-label={etiqueta} value={valor} onChange={(e) => alCambiar(e.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', font: 'inherit' }}>
        <option value="">{etiqueta}</option>
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
      {opciones.find(([v]) => v === valor)?.[1] ?? etiqueta}
      <span aria-hidden="true" style={{ fontSize: 10 }}>⌄</span>
    </label>
  )
}

const pildora = (activo: boolean): CSSProperties => ({ height: 34, minHeight: 34, padding: '0 14px', borderRadius: 999, background: activo ? '#1C2230' : '#FFFFFF', color: activo ? '#F3D88F' : '#1C2230', border: `1px solid ${activo ? '#1C2230' : 'rgba(28,34,48,.14)'}`, display: 'flex', alignItems: 'center', gap: 6, font: "600 12.5px 'Geist'", whiteSpace: 'nowrap', cursor: 'pointer' })

function PasePill({ u }: { u: UsuarioFila }): ReactNode {
  return <span data-pase-pastilla style={{ alignSelf: 'flex-start', height: 22, padding: '0 9px', borderRadius: 999, background: u.pase.tiene ? '#DCEBDD' : '#F1EADC', color: u.pase.tiene ? '#2F6B43' : 'rgba(28,34,48,.6)', display: 'flex', alignItems: 'center', font: "600 11px 'Geist'" }}>{u.pase.tiene ? 'Sí' : 'No'}</span>
}
const textoDePase = (u: UsuarioFila): string => (u.pase.tiene ? u.pase.destinos.map((d) => d.etiqueta).join(', ') : '—')
const textoDeProximo = (u: UsuarioFila): string => (u.proximo_viaje ? `${u.proximo_viaje.destino} · ${rangoCorto(u.proximo_viaje.inicio, u.proximo_viaje.fin)}` : '—')

function FilaDeEscritorio({ u, abrir }: { u: UsuarioFila; abrir: () => void }): ReactNode {
  return (
    <button type="button" data-usuario={u.id} onClick={abrir} style={{ display: 'grid', gridTemplateColumns: COLUMNAS, gap: 12, padding: '12px 18px', alignItems: 'center', border: 'none', borderTop: '1px solid rgba(28,34,48,.06)', background: '#FFFFFF', font: "400 13px/1.3 'Geist'", textAlign: 'left', cursor: 'pointer', color: '#1C2230', width: '100%' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Avatar id={u.id} nombre={u.nombre} />
        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nombre}{u.prueba && <span data-etiqueta-prueba style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: '#E3E8F4', color: '#2A4A94', font: "700 10.5px 'Geist'", letterSpacing: '.04em' }}>Prueba</span>}</span>
          <span style={{ fontSize: 12, color: 'rgba(28,34,48,.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
        </span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column' }}><span>{fechaCorta(u.alta)}</span><span style={{ fontSize: 12, color: 'rgba(28,34,48,.5)' }}>{hace(u.ultimo_acceso)}</span></span>
      <span style={{ fontWeight: 700 }}>{u.nivel}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><PasePill u={u} /><span data-pase-texto style={{ fontSize: 11.5, color: 'rgba(28,34,48,.55)' }}>{textoDePase(u)}</span></span>
      <span data-viajes>{u.viajes.creados} · {u.viajes.hechos}</span>
      <span data-proximo style={{ fontWeight: 600 }}>{textoDeProximo(u)}</span>
      <span data-gastado style={{ fontWeight: 700 }}>{euros(u.gastado_cent, u.moneda)}</span>
      <span style={{ fontSize: 12, color: 'rgba(28,34,48,.65)' }}>{lineaDePrimeraVez(u.primera_vez)}</span>
    </button>
  )
}

function TarjetaDeMovil({ u, abrir }: { u: UsuarioFila; abrir: () => void }): ReactNode {
  const dato = (t: string, v: ReactNode, d: string) => <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: 'rgba(28,34,48,.5)' }}>{t}</span><b data-dato={d}>{v}</b></span>
  return (
    <button type="button" data-usuario={u.id} onClick={abrir} style={{ padding: 14, borderRadius: 20, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', cursor: 'pointer', color: '#1C2230', width: '100%', minHeight: 44 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
        <Avatar id={u.id} nombre={u.nombre} tam={40} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span style={{ font: "700 14.5px 'Geist'" }}>{u.nombre}{u.prueba && <span data-etiqueta-prueba style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: '#E3E8F4', color: '#2A4A94', font: "700 10.5px 'Geist'", letterSpacing: '.04em' }}>Prueba</span>}</span>
          <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
        </span>
        <PasePill u={u} />
      </span>
      {u.pase.tiene && <span data-pase-texto style={{ font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{textoDePase(u)}</span>}
      <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, font: "400 12px 'Geist'", width: '100%' }}>
        {dato('Nivel', u.nivel, 'nivel')}{dato('Viajes', `${u.viajes.creados} · ${u.viajes.hechos}`, 'viajes')}{dato('Gastado', euros(u.gastado_cent, u.moneda), 'gastado')}
      </span>
      <span data-proximo style={{ font: "600 12px 'Geist'" }}>Próximo viaje: <span style={{ fontWeight: 500, color: 'rgba(28,34,48,.7)' }}>{textoDeProximo(u)}</span></span>
      <span style={{ font: "400 12px/1.35 'Geist'", color: 'rgba(28,34,48,.6)' }}>{lineaDePrimeraVez(u.primera_vez)}</span>
    </button>
  )
}

export function Lista({ f, poner, lista, abrir, movil, cargando }: { f: FiltrosDeLista; poner: (p: Partial<FiltrosDeLista>) => void; lista: UsuariosLista | null; abrir: (id: string) => void; movil: boolean; cargando: boolean }): ReactNode {
  const destinos: [string, string][] = (lista?.destinos ?? []).map((d) => [d, d])
  const hayMas = lista ? lista.pagina * lista.por_pagina < lista.total : false
  const cuenta = lista ? `${numero(lista.total)} ${lista.total === 1 ? 'usuario' : 'usuarios'} con estos filtros` : ''
  const todos = !f.pase
  const campoFecha = (valor: string, clave: 'desde' | 'hasta', etiqueta: string) => (
    <input type="date" aria-label={etiqueta} data-entre={clave} value={valor} onChange={(e) => poner({ [clave]: e.target.value, pagina: 1 })} style={{ height: 34, minHeight: 34, padding: '0 8px', borderRadius: 11, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.14)', font: "600 12.5px 'Geist'", color: '#1C2230' }} />
  )
  return (
    <>
      <span style={{ font: `600 10px ${MONO}`, letterSpacing: '.16em', color: 'rgba(28,34,48,.5)', paddingTop: 6 }}>LA LISTA, UNO A UNO</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 14, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.12)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', color: 'rgba(28,34,48,.45)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input type="search" data-buscar aria-label="Busca por nombre o correo" placeholder="Busca por nombre o correo" value={f.q} onChange={(e) => poner({ q: e.target.value, pagina: 1 })} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', font: "400 14px 'Geist'", color: '#1C2230' }} />
        </label>
        {!movil && (
          <label style={{ height: 44, padding: '0 16px', borderRadius: 14, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.12)', display: 'flex', alignItems: 'center', gap: 8, font: "600 13px 'Geist'", position: 'relative' }}>
            Ordenar:
            <select data-orden aria-label="Ordenar" value={f.orden} onChange={(e) => poner({ orden: e.target.value, pagina: 1 })} style={{ border: 'none', background: 'transparent', font: "600 13px 'Geist'", color: '#8A6A2C', cursor: 'pointer', outline: 'none' }}>
              {ORDENES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </label>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" data-filtro="todos" aria-pressed={todos} onClick={() => poner({ pase: '', pagina: 1 })} style={pildora(todos)}>Todos</button>
        <button type="button" data-filtro="con-pase" aria-pressed={f.pase === 'si'} onClick={() => poner({ pase: 'si', pagina: 1 })} style={pildora(f.pase === 'si')}>Con pase</button>
        <button type="button" data-filtro="sin-pase" aria-pressed={f.pase === 'no'} onClick={() => poner({ pase: 'no', pagina: 1 })} style={pildora(f.pase === 'no')}>Sin pase</button>
        {!movil && <Pastilla dato="destino" etiqueta="Destino" valor={f.destino} opciones={destinos} alCambiar={(v) => poner({ destino: v, pagina: 1 })} />}
        {!movil && <Pastilla dato="frecuencia" etiqueta="Cada cuánto viaja" valor={f.frecuencia} opciones={Object.entries(ETIQUETA_FRECUENCIA)} alCambiar={(v) => poner({ frecuencia: v, pagina: 1 })} />}
        {!movil && <Pastilla dato="compania" etiqueta="Con quién viaja" valor={f.compania} opciones={Object.entries(ETIQUETA_COMPANIA)} alCambiar={(v) => poner({ compania: v, pagina: 1 })} />}
        <button type="button" data-filtro="entre" aria-pressed={f.entre} onClick={() => poner({ entre: !f.entre, pagina: 1 })} style={pildora(f.entre)}>Viajan entre… <span aria-hidden="true" style={{ fontSize: 10 }}>⌄</span></button>
      </div>
      {f.entre && (
        <div data-entre-fila style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 16, background: '#FBF3E2', border: '1px solid #D8BE84' }}>
          <span style={{ font: "600 12.5px 'Geist'", color: '#6E5018' }}>Viajan entre…</span>
          {campoFecha(f.desde, 'desde', 'Desde')}
          <span style={{ font: "600 12.5px 'Geist'", color: '#6E5018' }}>–</span>
          {campoFecha(f.hasta, 'hasta', 'Hasta')}
          <label style={{ height: 34, padding: '0 12px', borderRadius: 11, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.14)', display: 'flex', alignItems: 'center', gap: 6, font: "600 12.5px 'Geist'", position: 'relative' }}>
            <select data-entre="destino" aria-label="Destino del viaje" value={f.entreDestino} onChange={(e) => poner({ entreDestino: e.target.value, pagina: 1 })} style={{ border: 'none', background: 'transparent', font: "600 12.5px 'Geist'", cursor: 'pointer', outline: 'none', maxWidth: 160 }}>
              <option value="">Destino: todos</option>
              {destinos.map(([v, t]) => <option key={v} value={v}>Destino: {t}</option>)}
            </select>
          </label>
          <span data-total style={{ marginLeft: 'auto', font: "700 12.5px 'Geist'" }}>{cuenta}</span>
        </div>
      )}
      {!f.entre && lista && <span data-total style={{ font: "600 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{cuenta}</span>}
      {lista === null && !cargando && <p data-sin-lista style={{ margin: 0, font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)' }}>No hemos podido cargar la lista.</p>}
      {lista && lista.usuarios.length === 0 && <p data-lista-vacia style={{ margin: 0, font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Nadie con estos filtros.</p>}
      {lista && lista.usuarios.length > 0 && !movil && (
        <div data-tabla style={{ flex: 'none', borderRadius: 20, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: COLUMNAS, gap: 12, padding: '12px 18px', background: '#F7F1E4' }}>
            <span style={MONO_CAB}>USUARIO</span><span style={MONO_CAB}>ALTA · ÚLTIMO ACCESO</span><span style={MONO_CAB}>NIVEL</span><span style={MONO_CAB}>PASE</span>
            <span style={{ ...MONO_CAB, display: 'flex', flexDirection: 'column' }}>VIAJES<span style={{ fontSize: 9, letterSpacing: '.04em', fontWeight: 500, textTransform: 'none' }}>creados · hechos</span></span>
            <span style={MONO_CAB}>PRÓXIMO VIAJE</span><span style={MONO_CAB}>GASTADO</span><span style={MONO_CAB}>PRIMERA VEZ</span>
          </div>
          {lista.usuarios.map((u) => <FilaDeEscritorio key={u.id} u={u} abrir={() => abrir(u.id)} />)}
        </div>
      )}
      {lista && lista.usuarios.length > 0 && movil && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{lista.usuarios.map((u) => <TarjetaDeMovil key={u.id} u={u} abrir={() => abrir(u.id)} />)}</div>}
      {lista && (lista.pagina > 1 || hayMas) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button type="button" data-pagina-anterior disabled={lista.pagina <= 1} onClick={() => poner({ pagina: lista.pagina - 1 })} style={{ ...pildora(false), opacity: lista.pagina <= 1 ? 0.45 : 1, minHeight: 44 }}>‹ Anterior</button>
          <span data-pagina style={{ font: "600 13px 'Geist'" }}>Página {lista.pagina}</span>
          <button type="button" data-pagina-siguiente disabled={!hayMas} onClick={() => poner({ pagina: lista.pagina + 1 })} style={{ ...pildora(false), opacity: hayMas ? 1 : 0.45, minHeight: 44 }}>Siguiente ›</button>
        </div>
      )}
      <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.5)' }}>Las cifras son totales; la lista es solo para administradores.</span>
    </>
  )
}
