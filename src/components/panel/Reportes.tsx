import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { TIPOS, metaDe, type TipoAviso } from '../../lib/cuentanos/tipos'
import { hace, mandar, pedir } from './api'
import { SERIE } from './estilo'
import { irAFicha } from './navegar'

/**
 * (V35A, Design P2/P2b/P2c/M2/M2b/M2c) REPORTES: la lista con desplegables de Tipo y Estado (y Destino), cada reporte con su icono, lo que dice, de dónde y QUIÉN lo mandó, y su estado de verdad (Nuevo · Visto · Hecho · Descartado).
 * Al abrir uno: el contexto en palabras (desde dónde, aparato, si quiere respuesta), el sitio y lo que pone ahora la app, las fotos, el historial de respuestas y UNA sola caja para contestar, con «y marcar como hecho».
 * El estado que se enseña es SIEMPRE el que devuelve el servidor tras cada acción (nunca uno que se quedó atrás).
 */
interface ItemDeLista {
  id: string
  creado: string
  tipo: TipoAviso
  estado: string
  titulo: string
  destino: string | null
  con_cuenta: boolean
  quien: { id: string; nombre: string; email: string } | null
}
interface Detalle {
  ok: boolean
  reporte: { id: string; creado: string; tipo: TipoAviso; estado: string; titulo: string; destino: string | null; con_cuenta: boolean; avisame: boolean; texto: string; fotos_urls: string[]; captura_url: string | null }
  quien: { id: string; nombre: string; email: string } | null
  contexto: { l: string; v: string }[]
  tecnico: Record<string, string | null>
  sitio: { nombre: string; id: string; destino: string } | null
  en_la_app: { etiqueta: string; valor: string } | null
  dice_el_viajero: string | null
  historial: { quien: 'viajero' | 'tu'; cuando: string; texto: string }[]
  se_puede_responder: boolean
}
const ESTADOS = [['nuevo', 'Nuevo'], ['visto', 'Visto'], ['hecho', 'Hecho'], ['descartado', 'Descartado'], ['usada', 'Usada']] as const
export const NOMBRE_DE_ESTADO: Record<string, string> = Object.fromEntries(ESTADOS)
export const COLOR_ESTADO: Record<string, [string, string]> = { nuevo: ['oklch(0.97 0.03 5)', 'oklch(0.5 0.19 5)'], visto: ['#E3E8F4', '#2A4A94'], hecho: ['#DCEBDD', '#2F6B43'], descartado: ['#EEE8DA', '#8A7A5A'], usada: ['#DCEBDD', '#2F6B43'] }
const RESULTADO: Record<string, string> = {
  enviado: 'Le ha llegado a la campana y por correo.',
  sin_cuenta: 'Le ha llegado a la campana. Por correo no: mandó el reporte sin cuenta.',
  no_avisame: 'Le ha llegado a la campana. Por correo no: no pidió que le avisáramos.',
  sin_clave: 'Le ha llegado a la campana. El correo está apagado (falta RESEND_API_KEY en Vercel).',
  fallo: 'Le ha llegado a la campana, pero el correo ha fallado.',
}

function PastillaDeEstado({ estado, grande }: { estado: string; grande?: boolean }): ReactNode {
  const [fondo, color] = COLOR_ESTADO[estado] ?? COLOR_ESTADO.visto
  return (
    <span data-estado-pastilla={estado} style={{ flex: 'none', height: grande ? 26 : 24, padding: `0 ${grande ? 12 : 10}px`, borderRadius: 999, background: fondo, color, display: 'flex', alignItems: 'center', font: `700 ${grande ? 12 : 11.5}px 'Geist'` }}>
      {NOMBRE_DE_ESTADO[estado] ?? estado}
    </span>
  )
}

function Desplegable({ etiqueta, valor, opciones, alCambiar, dato }: { etiqueta: string; valor: string; opciones: [string, string][]; alCambiar: (v: string) => void; dato: string }): ReactNode {
  const texto = opciones.find(([v]) => v === valor)?.[1] ?? 'Todos'
  return (
    <label style={{ position: 'relative', height: 42, padding: '0 14px', borderRadius: 14, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.14)', display: 'flex', alignItems: 'center', gap: 8, font: "500 12px 'Geist'", color: 'rgba(28,34,48,.5)', cursor: 'pointer' }}>
      {etiqueta} <b style={{ fontSize: 13, color: '#1C2230' }}>{texto}</b> <span style={{ fontSize: 10 }}>⌄</span>
      <select data-desplegable={dato} aria-label={etiqueta} value={valor} onChange={(e) => alCambiar(e.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}>
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  )
}

function Icono({ tipo, tam }: { tipo: TipoAviso; tam: number }): ReactNode {
  const m = metaDe(tipo)
  return (
    <span style={{ flex: 'none', width: tam, height: tam, borderRadius: tam > 38 ? 12 : 12, background: m.fondo, color: m.trazo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={tam / 2} height={tam / 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={m.icono} /></svg>
    </span>
  )
}

function FichaDeReporte({ id, movil, alCambiar, alVolver }: { id: string; movil: boolean; alCambiar: () => void; alVolver: () => void }): ReactNode {
  const [d, setD] = useState<Detalle | null>(null)
  const [texto, setTexto] = useState('')
  const [hecho, setHecho] = useState(false)
  const [resultado, setResultado] = useState('')
  const [haciendo, setHaciendo] = useState(false)
  const [tecnico, setTecnico] = useState(false)
  const cargar = useCallback(async () => setD(await pedir<Detalle>(`/api/admin/reportes/${id}`)), [id])
  useEffect(() => {
    setD(null)
    setTexto('')
    setHecho(false)
    setResultado('')
    void cargar()
  }, [cargar])
  if (!d) return <div style={{ flex: 1.25, padding: 20 }}>Cargando…</div>
  const r = d.reporte
  const m = metaDe(r.tipo)
  const cambiar = async (estado: string) => {
    setHaciendo(true)
    await mandar(`/api/admin/avisos-viajeros/${r.id}`, { estado }, 'PATCH')
    setHaciendo(false)
    await cargar()
    alCambiar()
  }
  const enviar = async () => {
    setHaciendo(true)
    const x = await mandar<{ ok: boolean; correo: string; estado: string | null }>(`/api/admin/reportes/${r.id}/responder`, { texto, hecho })
    setHaciendo(false)
    setResultado(x?.ok ? (RESULTADO[x.correo] ?? 'Enviado.') : 'No se ha podido responder.')
    if (x?.ok) {
      setTexto('')
      setHecho(false)
      await cargar()
      alCambiar()
    }
  }
  const titulo = r.texto && (r.tipo === 'dato_mal' || r.tipo === 'consejo') ? `${r.titulo}: «${r.texto}»` : r.titulo
  const puede = d.se_puede_responder
  return (
    <div data-reporte-abierto={r.id} data-estado={r.estado} style={{ flex: 1.25, minWidth: 0, borderRadius: 24, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.1)', boxShadow: '0 18px 34px -22px rgba(28,34,48,.5)', padding: movil ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
      {movil && <button type="button" data-volver-lista onClick={alVolver} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', font: "700 13px 'Geist'", color: '#8A6A2C', padding: 0, minHeight: 36 }}>‹ Volver a la lista</button>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icono tipo={r.tipo} tam={40} />
        <span style={{ flex: 1, font: `400 24px/1.05 ${SERIE}` }}>{m.boton}</span>
        <PastillaDeEstado estado={r.estado} grande />
      </div>
      <span style={{ font: "600 15px/1.3 'Geist'" }}>{titulo}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 14, background: '#F7F1E4', font: "500 13px 'Geist'" }}>
        <span style={{ flex: 1, minWidth: 0 }}>{d.quien ? `Enviado por ${d.quien.nombre}${d.quien.email ? ` · ${d.quien.email}` : ''}` : 'Sin cuenta (no se le puede contestar)'}</span>
        {d.quien && <button type="button" data-ver-ficha={d.quien.id} onClick={() => irAFicha(d.quien!.id)} style={{ background: 'none', border: 'none', font: "700 12.5px 'Geist'", color: '#8A6A2C', whiteSpace: 'nowrap', cursor: 'pointer' }}>Ver su ficha ›</button>}
      </div>
      <div data-contexto style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', font: "400 13px/1.35 'Geist'" }}>
        {d.contexto.map((c) => (
          <span key={c.l} style={{ display: 'contents' }}>
            <span style={{ color: 'rgba(28,34,48,.5)' }}>{c.l}</span>
            <span style={{ fontWeight: 600 }}>{c.v}</span>
          </span>
        ))}
      </div>
      <button type="button" data-detalles-tecnicos onClick={() => setTecnico(!tecnico)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, font: "400 11px 'Geist'", color: 'rgba(28,34,48,.4)', cursor: 'pointer' }}>Detalles técnicos {tecnico ? '⌄' : '›'}</button>
      {tecnico && <p data-tecnico style={{ margin: 0, font: "400 11.5px/1.5 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)' }}>{Object.entries(d.tecnico).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'Sin detalles'}</p>}
      {d.sitio && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" data-ver-sitio onClick={() => { window.location.assign(`/admin/logros?pestana=destinos&destino=${encodeURIComponent(d.sitio!.destino)}&sitio=${encodeURIComponent(d.sitio!.id)}`) }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, font: "700 13px 'Geist'", color: '#8A6A2C', cursor: 'pointer', textAlign: 'left' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M10 6H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" /></svg>
            Ver «{d.sitio.nombre}» en «Qué tiene cada destino»
          </button>
          {d.en_la_app && d.dice_el_viajero && (
            <div data-comparacion style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ padding: '10px 12px', borderRadius: 14, background: '#F1EADC', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.1em', color: 'rgba(28,34,48,.5)' }}>EN LA APP</span>
                <span style={{ font: "600 14px 'Geist'" }}>{d.en_la_app.etiqueta}: {d.en_la_app.valor}</span>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 14, background: '#FBEFC8', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.1em', color: '#8A6210' }}>DICE EL VIAJERO</span>
                <span style={{ font: "600 14px 'Geist'" }}>{d.dice_el_viajero}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {(r.captura_url || r.fotos_urls.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: movil || r.fotos_urls.length + (r.captura_url ? 1 : 0) < 2 ? '1fr' : '1fr 1fr', gap: 8 }}>
          {r.captura_url && <a href={r.captura_url} target="_blank" rel="noreferrer"><img src={r.captura_url} alt="Captura de lo que veía" loading="lazy" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 16 }} /></a>}
          {r.fotos_urls.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="Foto del viajero" loading="lazy" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 16 }} /></a>)}
        </div>
      )}
      <div data-historial style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }}>HISTORIAL</span>
        {d.historial.map((h, i) => (
          <div key={i} data-mensaje={h.quien} style={{ alignSelf: h.quien === 'tu' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: '9px 12px', borderRadius: 14, background: h.quien === 'tu' ? '#FBF3E2' : '#F7F1E4', font: "400 13px/1.35 'Geist'" }}>
            <span style={{ display: 'block', font: "600 11px 'Geist'", color: 'rgba(28,34,48,.5)', marginBottom: 2 }}>{h.quien === 'tu' ? 'Tú' : (d.quien?.nombre ?? 'El viajero')} · {hace(h.cuando)}</span>
            {h.texto}
          </div>
        ))}
      </div>
      <div data-caja-responder style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 18, background: puede ? '#FFFBF0' : '#F1EADC', border: `1.5px solid ${puede ? '#D8BE84' : 'rgba(28,34,48,.1)'}`, opacity: puede ? 1 : 0.55 }}>
        <textarea data-texto-responder disabled={!puede || haciendo} value={texto} maxLength={300} onChange={(e) => setTexto(e.target.value)} rows={2} placeholder={puede ? 'Un texto corto para el viajero (le llega a la campana)' : 'Sin cuenta: no se le puede contestar'} aria-label="Respuesta al viajero" style={{ minHeight: 56, borderRadius: 12, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.14)', padding: '10px 12px', font: "400 13.5px/1.4 'Geist'", resize: 'vertical' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, font: "500 13px 'Geist'", cursor: puede ? 'pointer' : 'default' }}>
            <input type="checkbox" data-marcar-hecho disabled={!puede} checked={hecho} onChange={(e) => setHecho(e.target.checked)} style={{ width: 20, height: 20, accentColor: '#1C2230' }} />
            y marcar como hecho
          </label>
          <button type="button" data-responder disabled={!puede || haciendo || texto.trim().length < 2} onClick={() => void enviar()} style={{ height: 38, padding: '0 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', color: '#4A3510', font: "700 13.5px 'Geist'", opacity: !puede || texto.trim().length < 2 ? 0.55 : 1, cursor: 'pointer' }}>Enviar</button>
        </div>
        {!puede && <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>No hay cuenta ni respuesta que enviar.</span>}
        {resultado && <span data-resultado-responder role="status" style={{ font: "400 13px/1.35 'Geist'", color: 'rgba(28,34,48,.7)' }}>{resultado}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([['visto', 'Visto'], ['hecho', 'Hecho'], ['descartado', 'Descartar']] as const).map(([e, nombre]) => {
          const activo = r.estado === e || (e === 'descartado' && r.estado === 'descartado')
          return (
            <button key={e} type="button" data-estado-boton={e} disabled={haciendo} onClick={() => void cambiar(e)} style={{ minHeight: 38, padding: '0 16px', borderRadius: 999, border: `1.5px solid ${activo ? '#1C2230' : 'rgba(28,34,48,.16)'}`, background: activo ? '#1C2230' : '#FFFFFF', color: activo ? '#F3D88F' : '#1C2230', font: "700 13px 'Geist'", cursor: 'pointer' }}>{nombre}</button>
          )
        })}
      </div>
    </div>
  )
}

export function Reportes({ movil, abrirId }: { movil: boolean; abrirId?: string | null }): ReactNode {
  const [tipo, setTipo] = useState('')
  const [estado, setEstado] = useState('')
  const [destino, setDestino] = useState('')
  const [lista, setLista] = useState<{ items: ItemDeLista[]; nuevos: number } | null>(null)
  const [abierto, setAbierto] = useState<string | null>(abrirId ?? null)
  const cargar = useCallback(async () => {
    const q = new URLSearchParams()
    if (tipo) q.set('tipo', tipo)
    if (estado) q.set('estado', estado)
    if (destino.trim()) q.set('destino', destino.trim())
    const r = await pedir<{ ok: boolean; items: ItemDeLista[]; nuevos: number }>(`/api/admin/reportes?${q.toString()}`)
    setLista(r ? { items: r.items, nuevos: r.nuevos } : { items: [], nuevos: 0 })
  }, [tipo, estado, destino])
  useEffect(() => {
    void cargar()
  }, [cargar])
  const mostrarLista = !(movil && abierto)
  return (
    <div data-seccion="reportes" style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14 }}>
      {mostrarLista && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Desplegable etiqueta="Tipo" dato="tipo" valor={tipo} alCambiar={setTipo} opciones={[['', 'Todos'], ...TIPOS.map((t) => [t.id, t.boton] as [string, string])]} />
          <Desplegable etiqueta="Estado" dato="estado" valor={estado} alCambiar={setEstado} opciones={[['', 'Todos'], ['nuevo', 'Nuevo'], ['visto', 'Visto'], ['hecho', 'Hecho'], ['descartado', 'Descartado']]} />
          {!movil && <input data-destino value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Destino" aria-label="Destino" style={{ flex: 1, maxWidth: 240, height: 42, borderRadius: 14, background: '#FFFFFF', border: '1.5px solid rgba(28,34,48,.14)', padding: '0 14px', font: "400 13px 'Geist'" }} />}
          {lista && <span data-contador-nuevos style={{ font: "700 12.5px 'Geist Mono',monospace", color: 'oklch(0.5 0.19 5)', paddingLeft: 4 }}>{lista.nuevos} nuevos</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {mostrarLista && (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!lista && <p>Cargando…</p>}
            {lista?.items.length === 0 && <p style={{ margin: 0, font: "400 14px 'Geist'", color: 'rgba(28,34,48,.55)' }}>No hay reportes con esos filtros.</p>}
            {lista?.items.map((r) => {
              const m = metaDe(r.tipo)
              const on = abierto === r.id
              return (
                <button key={r.id} type="button" data-reporte={r.id} data-estado={r.estado} onClick={() => setAbierto(on && !movil ? null : r.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 18, background: on ? '#FBF3E2' : '#FFFFFF', border: `1.5px solid ${on ? '#C99A44' : 'rgba(28,34,48,.08)'}`, textAlign: 'left', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}>
                  <Icono tipo={r.tipo} tam={38} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ font: "600 14px/1.25 'Geist'", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.titulo}</span>
                    <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[m.boton, r.destino, hace(r.creado)].filter(Boolean).join(' · ')}</span>
                    <span data-quien style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.7)' }}>{r.quien ? r.quien.nombre : 'Sin cuenta'}</span>
                  </span>
                  <PastillaDeEstado estado={r.estado} />
                </button>
              )
            })}
          </div>
        )}
        {abierto && <FichaDeReporte id={abierto} movil={movil} alCambiar={() => void cargar()} alVolver={() => setAbierto(null)} />}
      </div>
    </div>
  )
}
