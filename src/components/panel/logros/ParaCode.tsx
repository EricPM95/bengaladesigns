import { useState, type ReactNode } from 'react'
import { llamar } from '../../../lib/logros'
import { DiagnosticoCompanero } from '../../logros/DiagnosticoCompanero'
import { DORADO_OSCURO, tarjetaBlanca, titulo14 } from './comun'

/**
 * (V35A) «PARA CODE», plegado al final de Herramientas: lo técnico de antes (datos por dentro de cada destino, avisos de datos, interruptores, logros de viajero, simulador y el diagnóstico de «Yo también estaba»).
 * Es lo que tenía el panel viejo (`/?admin=logros`), sin lo que ya tiene su sitio (Avisos de viajeros y Destinos pedidos están en el panel; Sorteo, Personas y Probador, en Logros y Herramientas).
 * Se pide al servidor solo al abrirlo.
 */
interface Aviso { nivel: 'error' | 'aviso'; donde: string; texto: string }
interface DatosDestino {
  clave: string
  ciudad: string
  sitios: Record<string, { radio_m: number; motivo_radio: string; foto_dentro: string | null }>
  patrimonios: Record<string, { nombre: string; unesco: number; fuente: string; sitios?: string[]; por_comprobar?: string[] }>
  sellos: { id: string; nombre: string; grados: { grado: string; desde: number; nombre: string; linea: string }[] }[]
  colecciones: { id: string; grupo: string; nombre: string; al_completar: string; sitios: string[] }[]
  emblemas: { id: string; tipo: string; sitio?: string; nombre: string; linea: string }[]
}
interface Panel {
  ok: boolean
  destinos: Record<string, DatosDestino>
  avisos: Aviso[]
  viajero: { id: string; grupo: string; nombre: string; visible: boolean; escalones: { n: number; nombre: string; visible: boolean }[] }[]
  viajero_apagados?: string[]
  interruptores: { logros: boolean; push: boolean; cobro: boolean }
}

const mini = { margin: 0, font: "400 13px/1.5 'Geist'", color: 'rgba(28,34,48,.75)' } as const

export function ParaCode({ movil }: { movil: boolean }): ReactNode {
  const [abierto, setAbierto] = useState(false)
  const [panel, setPanel] = useState<Panel | null | undefined>(undefined)
  const abrir = () => {
    const nuevo = !abierto
    setAbierto(nuevo)
    if (nuevo && panel === undefined) void llamar<Panel>('/api/admin/logros/datos').then((r) => setPanel(r?.ok ? r : null))
  }
  return (
    <section data-para-code style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button type="button" data-para-code-boton aria-expanded={abierto} onClick={abrir} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 18, background: '#F1EADC', border: '1px solid rgba(28,34,48,.08)', cursor: 'pointer', textAlign: 'left', flexWrap: movil ? 'wrap' : 'nowrap' }}>
        <span style={{ font: "600 14px 'Geist'" }}>Para Code</span>
        <span style={{ flex: 1, font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Datos por dentro de cada destino, simulador y avisos de datos</span>
        <span aria-hidden="true" style={{ font: "700 16px 'Geist'", color: DORADO_OSCURO, transform: abierto ? 'rotate(180deg)' : 'none' }}>⌄</span>
      </button>
      {abierto && (
        <div data-para-code-contenido style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={tarjetaBlanca}><DiagnosticoCompanero /></div>
          {panel === undefined && <p style={mini}>Cargando…</p>}
          {panel === null && <p role="alert" style={mini}>No se han podido leer los datos de los logros.</p>}
          {panel && <Detalle panel={panel} />}
          <p style={mini}>Prueba de las fotos del móvil (qué datos trae una foto de la galería; no sube nada): <a href="/?pruebaFotos=1&logros=on" style={{ color: DORADO_OSCURO, fontWeight: 700 }}>abrir la prueba de las fotos</a>.</p>
        </div>
      )}
    </section>
  )
}

function Detalle({ panel }: { panel: Panel }): ReactNode {
  const destinos = Object.values(panel.destinos)
  const [clave, setClave] = useState(destinos[0]?.clave ?? '')
  const d = panel.destinos[clave] ?? destinos[0]
  return (
    <>
      <div style={tarjetaBlanca}>
        <span style={titulo14}>Interruptores y avisos de los datos</span>
        <p style={mini}>Logros {panel.interruptores.logros ? 'sí' : 'no'} · avisos al móvil {panel.interruptores.push ? 'sí' : 'no'} · cobro {panel.interruptores.cobro ? 'sí' : 'no'}</p>
        {panel.avisos.length === 0 ? <p style={mini}>Ningún aviso: todo cuadra con el catálogo.</p> : (
          <ul style={{ ...mini, margin: 0, paddingLeft: 18 }}>{panel.avisos.map((a, i) => <li key={i} style={{ color: a.nivel === 'error' ? 'oklch(0.5 0.19 5)' : undefined }}><b>{a.nivel === 'error' ? 'Error' : 'Aviso'}</b> · {a.donde}: {a.texto}</li>)}</ul>
        )}
      </div>
      <Simulador clave={d?.clave ?? 'roma'} />
      {d && (
        <div style={tarjetaBlanca}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={titulo14}>Por dentro de</span>
            {destinos.map((x) => (
              <button key={x.clave} type="button" aria-pressed={x.clave === d.clave} onClick={() => setClave(x.clave)} style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid rgba(28,34,48,.16)', background: x.clave === d.clave ? '#1C2230' : '#FFFFFF', color: x.clave === d.clave ? '#F3D88F' : '#1C2230', font: "600 13px 'Geist'", cursor: 'pointer' }}>{x.ciudad}</button>
            ))}
          </div>
          <b style={{ font: "600 13px 'Geist'" }}>Sellos</b>
          {d.sellos.map((s) => <p key={s.id} style={mini}><b>{s.nombre}</b>: {s.grados.map((g) => `${g.grado} desde ${g.desde} («${g.nombre}»)`).join(' · ')}</p>)}
          <b style={{ font: "600 13px 'Geist'" }}>Colecciones</b>
          {d.colecciones.map((c) => <p key={c.id} style={mini}><b>{c.nombre}</b> ({c.grupo}, {c.sitios.length} sitios) · al completarla: «{c.al_completar}»<br />{c.sitios.join(' · ')}</p>)}
          <b style={{ font: "600 13px 'Geist'" }}>Emblemas y radios</b>
          {d.emblemas.map((e) => {
            const s = e.sitio ? d.sitios[e.sitio] : null
            return <p key={e.id} style={mini}><b>{e.nombre}</b> · {e.sitio ?? 'según la hora'} · radio {s ? `${s.radio_m} m` : '—'}{s?.foto_dentro ? ` · foto dentro: ${s.foto_dentro}` : ''}</p>
          })}
          <b style={{ font: "600 13px 'Geist'" }}>Radios de todos los sitios</b>
          <ul style={{ ...mini, margin: 0, paddingLeft: 18 }}>{Object.entries(d.sitios).map(([id, s]) => <li key={id}>{id}: {s.radio_m} m — {s.motivo_radio}</li>)}</ul>
          <b style={{ font: "600 13px 'Geist'" }}>Patrimonios</b>
          {Object.entries(d.patrimonios).map(([id, p]) => <p key={id} style={mini}><b>{p.nombre}</b> (UNESCO {p.unesco}): cuentan {p.sitios?.length ?? 0} · por comprobar {p.por_comprobar?.join(', ') || 'ninguno'}</p>)}
        </div>
      )}
      <div style={tarjetaBlanca}>
        <span style={titulo14}>Logros de viajero (cuáles se ven hoy)</span>
        <p style={mini}>Apagados en data/logros/viajero.json (`activo: false`): {(panel.viajero_apagados ?? []).join(', ') || 'ninguno'}.</p>
        <ul style={{ ...mini, margin: 0, paddingLeft: 18 }}>{panel.viajero.map((l) => <li key={l.id} style={{ opacity: l.visible ? 1 : 0.55 }}><b>{l.nombre}</b> ({l.grupo}) · {l.visible ? 'se ve hoy' : 'todavía no se ve'}</li>)}</ul>
      </div>
    </>
  )
}

function Simulador({ clave }: { clave: string }): ReactNode {
  const [texto, setTexto] = useState('2026-10-10;visto;coliseo;09:00\n2026-10-10;foto;coliseo;09:05\n2026-10-11;foto;fontana_de_trevi;06:30')
  const [salida, setSalida] = useState<{ paso: number; sitio: string; tipo: string; nuevos: { tipo: string; nombre: string }[] }[] | null>(null)
  const [inicio, setInicio] = useState('2026-10-10')
  const [fin, setFin] = useState('2026-10-14')
  const correr = async () => {
    const pasos = texto.split('\n').map((l) => l.split(';').map((x) => x.trim())).filter((p) => p.length >= 3).map(([fecha, tipo, sitio, hora]) => ({ fecha, tipo, sitio, hora }))
    const r = await llamar<{ ok: boolean; pasos: typeof salida }>('/api/admin/logros/simular', { cuerpo: { destino: clave, inicio, fin, pasos } })
    setSalida(r?.pasos ?? [])
  }
  const campo = { minHeight: 40, padding: '0 10px', borderRadius: 10, border: '1.5px solid rgba(28,34,48,.16)', font: "400 14px 'Geist'", width: 130 } as const
  return (
    <div data-simulador style={tarjetaBlanca}>
      <span style={titulo14}>Simulador</span>
      <p style={mini}>Una línea por paso: fecha;visto o foto;id del sitio;hora (hora del destino). No toca la base de datos.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input aria-label="Inicio del viaje" value={inicio} onChange={(e) => setInicio(e.target.value)} style={campo} />
        <input aria-label="Fin del viaje" value={fin} onChange={(e) => setFin(e.target.value)} style={campo} />
      </div>
      <textarea aria-label="Pasos" value={texto} onChange={(e) => setTexto(e.target.value)} rows={6} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid rgba(28,34,48,.16)', padding: 10, font: "400 12.5px/1.4 'Geist Mono',monospace" }} />
      <button type="button" onClick={() => void correr()} style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1C2230', color: '#F3D88F', font: "700 13.5px 'Geist'", cursor: 'pointer' }}>Simular</button>
      {salida && (
        <ol style={{ ...mini, margin: 0, paddingLeft: 18 }}>
          {salida.map((p) => <li key={p.paso}><b>{p.paso}. {p.tipo} · {p.sitio}</b>{p.nuevos.length === 0 ? ' — nada nuevo' : <ul>{p.nuevos.map((m, i) => <li key={i}>{m.tipo}: {m.nombre}</li>)}</ul>}</li>)}
        </ol>
      )}
    </div>
  )
}
