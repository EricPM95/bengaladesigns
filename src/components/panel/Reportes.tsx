import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { TIPOS, metaDe, type TipoAviso } from '../../lib/cuentanos/tipos'
import { resumenDe, textoDeHecho } from '../logros/AvisosDeViajeros'
import { hace, mandar, pedir } from './api'
import { Filtro, Pastilla, SERIE, boton, tarjeta, Vacio } from './estilo'

/**
 * (V33, Design P2/P2b/M2) REPORTES: lo de «Avisos de viajeros» (Cuéntanos) con filtros por tipo, destino y estado; cada reporte con lo que mandó, su captura y sus fotos; [Visto] [Hecho] [Descartar] y [Responder]:
 * un texto corto que le llega al viajero a la campana, y por correo solo si mandó el reporte con cuenta y con «avísame» encendido (desde soporte@jutrip.app). Sin la clave de correo, la campana sí y el correo no (y se dice).
 */
interface Reporte {
  id: string
  creado: string
  tipo: TipoAviso
  estado: 'nuevo' | 'visto' | 'hecho' | 'descartado' | 'usada'
  datos: Record<string, unknown>
  destino: string | null
  pantalla: string | null
  pestana: string | null
  parada: string | null
  dia: string | null
  version_app: string | null
  dispositivo: string | null
  navegador: string | null
  avisame: boolean
  con_cuenta?: boolean
  user_id?: string | null
  fotos_urls?: string[]
  captura_url?: string | null
}
const ESTADOS = ['nuevo', 'visto', 'hecho', 'descartado'] as const
const COLOR_ESTADO: Record<string, [string, string]> = { nuevo: ['oklch(0.97 0.03 5)', 'oklch(0.5 0.19 5)'], visto: ['#F1EADC', 'rgba(28,34,48,.6)'], hecho: ['#DCEBDD', '#2F6B43'], descartado: ['#EEE', 'rgba(28,34,48,.5)'], usada: ['#DCEBDD', '#2F6B43'] }
const RESULTADO: Record<string, string> = {
  enviado: 'Le ha llegado a la campana y por correo.',
  sin_cuenta: 'Le ha llegado a la campana. Por correo no: mandó el reporte sin cuenta.',
  no_avisame: 'Le ha llegado a la campana. Por correo no: no pidió que le avisáramos.',
  sin_clave: 'Le ha llegado a la campana. El correo está apagado (falta RESEND_API_KEY en Vercel).',
  fallo: 'Le ha llegado a la campana, pero el correo ha fallado.',
}

function Detalle({ r, alCambiar }: { r: Reporte; alCambiar: () => void }): ReactNode {
  const [texto, setTexto] = useState(textoDeHecho(r))
  const [respuesta, setRespuesta] = useState('')
  const [resultado, setResultado] = useState('')
  const [haciendo, setHaciendo] = useState(false)
  const meta = metaDe(r.tipo)
  const cambiar = async (estado: string) => {
    setHaciendo(true)
    await mandar(`/api/admin/avisos-viajeros/${r.id}`, estado === 'hecho' ? { estado, texto } : { estado }, 'PATCH')
    setHaciendo(false)
    alCambiar()
  }
  const responder = async () => {
    setHaciendo(true)
    const x = await mandar<{ ok: boolean; campana: boolean; correo: string }>(`/api/admin/reportes/${r.id}/responder`, { texto: respuesta })
    setHaciendo(false)
    setResultado(x?.ok ? (RESULTADO[x.correo] ?? 'Enviado.') : 'No se ha podido responder.')
    if (x?.ok) setRespuesta('')
  }
  return (
    <div data-reporte-abierto={r.id} style={{ ...tarjeta, background: '#FBF3E2', border: '1px solid #C99A44' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 36, height: 36, borderRadius: 12, background: meta.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={meta.trazo} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={meta.icono} /></svg>
        </span>
        <span style={{ flex: 1, font: `400 22px/1.1 ${SERIE}` }}>{meta.boton}</span>
        <Pastilla fondo={COLOR_ESTADO[r.estado]?.[0]} color={COLOR_ESTADO[r.estado]?.[1]}>{r.estado}</Pastilla>
      </div>
      <p style={{ margin: 0, font: "400 15px/1.45 'Geist'", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{resumenDe(r as never)}</p>
      <p style={{ margin: 0, font: "400 12px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>
        {[r.destino, hace(r.creado), r.pantalla, r.pestana, r.parada && `parada ${r.parada}`, r.dia && `día ${r.dia}`, r.version_app && `v ${r.version_app}`, r.dispositivo, r.navegador].filter(Boolean).join(' · ')}
        {r.avisame ? ` · ${r.con_cuenta ?? Boolean(r.user_id) ? 'quiere que le avisemos (con cuenta)' : 'quiere aviso (sin cuenta: no podemos)'}` : ''}
      </p>
      {(r.captura_url || (r.fotos_urls?.length ?? 0) > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {r.captura_url && <a href={r.captura_url} target="_blank" rel="noreferrer"><img src={r.captura_url} alt="Captura" loading="lazy" style={{ height: 110, borderRadius: 10, border: '1px solid rgba(28,34,48,.15)' }} /></a>}
          {r.fotos_urls?.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="Foto" loading="lazy" style={{ height: 110, borderRadius: 10, border: '1px solid rgba(28,34,48,.15)' }} /></a>)}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" data-estado-visto disabled={haciendo || r.estado === 'visto'} onClick={() => void cambiar('visto')} style={boton(false, haciendo || r.estado === 'visto')}>Visto</button>
        <button type="button" data-estado-hecho disabled={haciendo || r.estado === 'hecho'} onClick={() => void cambiar('hecho')} style={boton(true, haciendo || r.estado === 'hecho')}>Hecho</button>
        <button type="button" data-estado-descartado disabled={haciendo || r.estado === 'descartado'} onClick={() => void cambiar('descartado')} style={boton(false, haciendo || r.estado === 'descartado')}>Descartar</button>
      </div>
      {r.estado !== 'hecho' && r.avisame && (r.con_cuenta ?? Boolean(r.user_id)) && <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} aria-label="Texto del aviso al dar por hecho" style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(28,34,48,.2)', padding: 8, font: "400 13px 'Geist'" }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: '1px solid rgba(28,34,48,.1)' }}>
        <span style={{ font: "600 13px 'Geist'" }}>Responder</span>
        <textarea data-texto-responder value={respuesta} maxLength={300} onChange={(e) => setRespuesta(e.target.value)} rows={2} placeholder="Un texto corto para el viajero (le llega a la campana)" aria-label="Respuesta al viajero" style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(28,34,48,.2)', padding: 8, font: "400 14px 'Geist'" }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" data-responder disabled={haciendo || respuesta.trim().length < 2} onClick={() => void responder()} style={boton(true, haciendo || respuesta.trim().length < 2)}>Responder</button>
          {resultado && <span data-resultado-responder role="status" style={{ font: "400 13px/1.35 'Geist'", color: 'rgba(28,34,48,.7)' }}>{resultado}</span>}
        </div>
      </div>
    </div>
  )
}

export function Reportes({ movil, abrirId }: { movil: boolean; abrirId?: string | null }): ReactNode {
  const [tipo, setTipo] = useState<string>('')
  const [estado, setEstado] = useState<string>('')
  const [destino, setDestino] = useState('')
  const [lista, setLista] = useState<{ items: Reporte[]; nuevos: number } | null>(null)
  const [abierto, setAbierto] = useState<string | null>(abrirId ?? null)
  const cargar = useCallback(async () => {
    const q = new URLSearchParams()
    if (tipo) q.set('tipo', tipo)
    if (estado) q.set('estado', estado)
    if (destino.trim()) q.set('destino', destino.trim())
    const r = await pedir<{ ok: boolean; items: Reporte[]; nuevos: number }>(`/api/admin/avisos-viajeros?${q.toString()}`)
    setLista(r ? { items: r.items, nuevos: r.nuevos } : { items: [], nuevos: 0 })
  }, [tipo, estado, destino])
  useEffect(() => {
    void cargar()
  }, [cargar])
  const elegido = lista?.items.find((x) => x.id === abierto) ?? null
  return (
    <div data-seccion="reportes" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Filtro dato="tipo-todos" activo={tipo === ''} onClick={() => setTipo('')}>Todos</Filtro>
        {TIPOS.map((t) => <Filtro key={t.id} dato={`tipo-${t.id}`} activo={tipo === t.id} onClick={() => setTipo(t.id)}>{t.boton}</Filtro>)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {['', ...ESTADOS].map((e) => <Filtro key={e} dato={`estado-${e || 'todos'}`} activo={estado === e} onClick={() => setEstado(e)}>{e ? e[0].toUpperCase() + e.slice(1) : 'Todos los estados'}</Filtro>)}
        <input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Destino" aria-label="Destino" style={{ minHeight: 36, borderRadius: 999, border: '1px solid rgba(28,34,48,.14)', padding: '0 14px', font: "400 13px 'Geist'" }} />
        {lista && <span data-contador-nuevos style={{ font: "600 12px 'Geist Mono',monospace", color: 'oklch(0.5 0.19 5)' }}>{lista.nuevos} nuevos</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: movil || !elegido ? '1fr' : '1fr 1.1fr', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!lista && <p>Cargando…</p>}
          {lista?.items.length === 0 && <Vacio>No hay reportes con esos filtros.</Vacio>}
          {lista?.items.map((r) => {
            const m = metaDe(r.tipo)
            const abiertoAhora = abierto === r.id
            return (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button type="button" data-reporte={r.id} data-estado={r.estado} onClick={() => setAbierto(abiertoAhora ? null : r.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, background: abiertoAhora ? '#FBF3E2' : '#FFFFFF', border: `1px solid ${abiertoAhora ? '#C99A44' : 'rgba(28,34,48,.08)'}`, textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ flex: 'none', width: 36, height: 36, borderRadius: 12, background: m.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={m.trazo} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={m.icono} /></svg>
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ font: "600 14px 'Geist'", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumenDe(r as never) || m.boton}</span>
                    <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{[m.boton, r.destino, hace(r.creado)].filter(Boolean).join(' · ')}</span>
                  </span>
                  <Pastilla fondo={COLOR_ESTADO[r.estado]?.[0]} color={COLOR_ESTADO[r.estado]?.[1]}>{r.estado}</Pastilla>
                </button>
                {movil && abiertoAhora && <Detalle r={r} alCambiar={() => void cargar()} />}
              </div>
            )
          })}
        </div>
        {!movil && elegido && <Detalle key={`${elegido.id}-${elegido.estado}`} r={elegido} alCambiar={() => void cargar()} />}
      </div>
    </div>
  )
}
