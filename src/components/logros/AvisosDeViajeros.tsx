import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { llamar } from '../../lib/logros'
import { TIPOS, metaDe, type TipoAviso } from '../../lib/cuentanos/tipos'

/**
 * (V20) PANEL DE ADMINISTRADOR · «AVISOS DE VIAJEROS»: lo que mandan desde «Cuéntanos». Lo más nuevo arriba, con filtro por tipo, destino y estado; cada aviso con todo lo que mandó, su captura, sus fotos
 * y el punto en un mapa pequeño; [Visto], [Hecho] (manda el aviso de la campana, con el texto editable) y [Descartar]. Más abajo, «Destinos más pedidos» con [Ya está] y «Fotos de viajeros» con [Usar en la app].
 * Todo va por /api/admin/avisos-viajeros (server/avisosViajeros.js), solo para administradores.
 */
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface Aviso {
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
  hora_cliente: string | null
  punto: { lat: number; lng: number; direccion?: string } | null
  errores: string[] | null
  avisame: boolean
  con_cuenta?: boolean
  user_id?: string | null
  avisado_en: string | null
  fotos_urls?: string[]
  captura_url?: string | null
  foto_aprobada?: unknown
}
interface Lista {
  ok: boolean
  items: Aviso[]
  nuevos: number
}
interface DestinoPedido {
  destino: string
  cuantos: number
  primero: string
  ultimo: string
  avisables: number
}

const ESTADOS = ['nuevo', 'visto', 'hecho', 'descartado', 'usada'] as const
const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')

/** Pura: el texto que se manda a la campana por defecto al darlo por hecho (se puede editar antes). */
export function textoDeHecho(a: Pick<Aviso, 'tipo' | 'datos'>): string {
  const d = a.datos
  const s = (k: string) => String(d[k] ?? '').trim()
  switch (a.tipo) {
    case 'dato_mal':
    case 'consejo':
    case 'no_funciona':
      return `Gracias a ti, ya está arreglado: ${s('sitio') || s('que').slice(0, 60)}.`
    case 'restaurante':
    case 'lugar':
      return `Hemos añadido ${s('nombre')}. ¡Gracias!`
    case 'foto':
      return 'Tu foto ya está en la app. ¡Gracias!'
    case 'destino':
      return `¡${s('destino')} ya está en JUTRIP! Tú lo pediste.`
    default:
      return 'Gracias por tu idea: ya la hemos mirado.'
  }
}

export function resumenDe(a: Aviso): string {
  const d = a.datos
  const s = (k: string) => String(d[k] ?? '').trim()
  switch (a.tipo) {
    case 'restaurante': return [s('nombre'), s('precio'), s('bueno')].filter(Boolean).join(' · ')
    case 'lugar': return [s('nombre'), s('porque')].filter(Boolean).join(' · ')
    case 'dato_mal': return [s('sitio'), s('falla'), s('mas')].filter(Boolean).join(' · ')
    case 'consejo': return [s('sitio'), s('consejo')].filter(Boolean).join(' · ')
    case 'no_funciona': return s('que')
    case 'idea': return s('texto')
    case 'destino': return [s('destino'), s('cuando'), s('mas')].filter(Boolean).join(' · ')
    case 'foto': return [s('sitio'), `Foto: ${s('nombre_en_foto')}`].filter(Boolean).join(' · ')
  }
}

function TarjetaDeAviso({ a, alCambiar }: { a: Aviso; alCambiar: () => void }): ReactNode {
  const [texto, setTexto] = useState(textoDeHecho(a))
  const [haciendo, setHaciendo] = useState(false)
  const [sitio, setSitio] = useState(String(a.datos.sitio ?? ''))
  const meta = metaDe(a.tipo)
  const cambiar = async (estado: Aviso['estado']) => {
    setHaciendo(true)
    await llamar(`/api/admin/avisos-viajeros/${a.id}`, { metodo: 'PATCH', cuerpo: estado === 'hecho' ? { estado, texto } : { estado } })
    setHaciendo(false)
    alCambiar()
  }
  const usarFoto = async () => {
    setHaciendo(true)
    await llamar(`/api/admin/avisos-viajeros/${a.id}/usar-foto`, { metodo: 'POST', cuerpo: { sitio, destino: a.destino ?? '' } })
    setHaciendo(false)
    alCambiar()
  }
  const mapa = a.punto && TOKEN ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+1c2230(${a.punto.lng},${a.punto.lat})/${a.punto.lng},${a.punto.lat},14.5,0/280x150?access_token=${TOKEN}` : null
  return (
    <li data-aviso-de-viajero={a.id} data-estado={a.estado} className="rounded-2xl border border-text/12 bg-bg-card p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.fondo }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={meta.trazo} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={meta.icono} /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">
            {meta.boton} <span className="font-normal text-text/55">· {a.destino || 'sin destino'} · {fecha(a.creado)}</span>
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${a.estado === 'nuevo' ? 'bg-accent text-white' : 'bg-text/8 text-text/65'}`}>{a.estado}</span>
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-[14px]">{resumenDe(a)}</p>
          <p className="mt-1 text-[12px] text-text/55">
            {[a.pantalla, a.pestana, a.parada && `parada ${a.parada}`, a.dia && `día ${a.dia}`, a.version_app && `v ${a.version_app}`, a.dispositivo, a.navegador].filter(Boolean).join(' · ')}
            {a.avisame ? ` · ${(a.con_cuenta ?? Boolean(a.user_id)) ? 'quiere que le avisemos (con cuenta)' : 'quiere aviso (sin cuenta: no podemos)'}` : ''}
          </p>
          {a.punto && (
            <div className="mt-2">
              {mapa && <img src={mapa} alt="Punto del mapa" loading="lazy" className="rounded-xl" width={280} height={150} />}
              <p className="text-[12px] text-text/60">Punto: {a.punto.direccion ?? `${a.punto.lat.toFixed(5)}, ${a.punto.lng.toFixed(5)}`}</p>
            </div>
          )}
          {a.errores && a.errores.length > 0 && <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-text/5 p-2 text-[11px]">{a.errores.join('\n')}</pre>}
          {(a.captura_url || (a.fotos_urls?.length ?? 0) > 0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {a.captura_url && <a href={a.captura_url} target="_blank" rel="noreferrer"><img src={a.captura_url} alt="Captura" loading="lazy" className="h-28 rounded-lg border border-text/15" /></a>}
              {a.fotos_urls?.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="Foto" loading="lazy" className="h-28 rounded-lg border border-text/15" /></a>)}
            </div>
          )}
          {a.tipo === 'foto' && a.estado !== 'usada' && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input value={sitio} onChange={(e) => setSitio(e.target.value)} className="rounded-lg border border-text/20 px-2 py-1 text-[13px]" aria-label="Sitio de la foto" />
              <button type="button" disabled={haciendo || !sitio.trim()} onClick={() => void usarFoto()} className="rounded-full bg-text px-3 py-1.5 text-[13px] text-bg">Usar en la app</button>
            </div>
          )}
          {a.estado !== 'hecho' && a.estado !== 'usada' && a.avisame && (a.con_cuenta ?? Boolean(a.user_id)) && (
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} aria-label="Texto del aviso" className="mt-2 w-full rounded-lg border border-text/20 p-2 text-[13px]" />
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={haciendo || a.estado === 'visto'} onClick={() => void cambiar('visto')} className="rounded-full border border-text/25 px-3 py-1.5 text-[13px]">Visto</button>
            <button type="button" disabled={haciendo || a.estado === 'hecho'} onClick={() => void cambiar('hecho')} className="rounded-full bg-text px-3 py-1.5 text-[13px] text-bg">Hecho{a.avisame && (a.con_cuenta ?? Boolean(a.user_id)) ? ' y avisar' : ''}</button>
            <button type="button" disabled={haciendo || a.estado === 'descartado'} onClick={() => void cambiar('descartado')} className="rounded-full border border-text/25 px-3 py-1.5 text-[13px]">Descartar</button>
          </div>
        </div>
      </div>
    </li>
  )
}

export function AvisosDeViajeros({ alContar }: { alContar?: (nuevos: number) => void }): ReactNode {
  const [tipo, setTipo] = useState('')
  const [destino, setDestino] = useState('')
  const [estado, setEstado] = useState('')
  const [lista, setLista] = useState<Lista | null>(null)
  const [destinos, setDestinos] = useState<DestinoPedido[]>([])
  const [mensaje, setMensaje] = useState('')
  const cargar = useCallback(async () => {
    const q = new URLSearchParams()
    if (tipo) q.set('tipo', tipo)
    if (destino.trim()) q.set('destino', destino.trim())
    if (estado) q.set('estado', estado)
    const r = await llamar<Lista>(`/api/admin/avisos-viajeros?${q.toString()}`)
    setLista(r)
    if (r) alContar?.(r.nuevos)
    const d = await llamar<{ ok: boolean; destinos: DestinoPedido[] } | DestinoPedido[]>('/api/admin/avisos-viajeros/destinos')
    setDestinos(Array.isArray(d) ? d : (d?.destinos ?? []))
  }, [tipo, destino, estado, alContar])
  useEffect(() => {
    void cargar()
  }, [cargar])
  const yaEsta = async (d: string) => {
    const r = await llamar<{ ok: boolean; avisados: number }>('/api/admin/avisos-viajeros/destinos/ya-esta', { metodo: 'POST', cuerpo: { destino: d } })
    setMensaje(r?.ok ? `${d}: avisadas ${r.avisados} personas.` : 'No se ha podido avisar.')
    void cargar()
  }
  const fotos = (lista?.items ?? []).filter((a) => a.tipo === 'foto' && a.estado !== 'descartado')
  return (
    <section data-avisos-de-viajeros>
      <h2 className="font-semibold">Avisos de viajeros {lista ? <span data-contador-nuevos className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[12px] text-white">{lista.nuevos} nuevos</span> : null}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo" className="rounded-lg border border-text/20 px-2 py-1.5 text-[13px]">
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.boton}</option>)}
        </select>
        <input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Destino" aria-label="Destino" className="rounded-lg border border-text/20 px-2 py-1.5 text-[13px]" />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado" className="rounded-lg border border-text/20 px-2 py-1.5 text-[13px]">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      {mensaje && <p className="mt-2 text-[13px] text-text/70">{mensaje}</p>}
      <ul className="mt-3 space-y-3">
        {!lista && <li className="text-text/60">Cargando…</li>}
        {lista?.items.length === 0 && <li className="text-text/60">No hay avisos con esos filtros.</li>}
        {lista?.items.map((a) => <TarjetaDeAviso key={`${a.id}-${a.estado}`} a={a} alCambiar={() => void cargar()} />)}
      </ul>

      <h2 className="mt-8 font-semibold">Destinos más pedidos</h2>
      {destinos.length === 0 ? <p className="mt-1 text-text/60">Nadie ha pedido un destino todavía.</p> : (
        <table className="mt-2 w-full text-left text-[13px]"><thead><tr><th>Destino</th><th>Lo piden</th><th>Desde</th><th>Último</th><th /></tr></thead><tbody>
          {destinos.map((d) => (
            <tr key={d.destino} data-destino-pedido={d.destino} className="border-t border-text/10">
              <td className="py-1.5">{d.destino}</td><td>{d.cuantos} ({d.avisables} con aviso)</td><td>{fecha(d.primero)}</td><td>{fecha(d.ultimo)}</td>
              <td><button type="button" onClick={() => void yaEsta(d.destino)} className="rounded-full bg-text px-3 py-1 text-[12px] text-bg">Ya está</button></td>
            </tr>
          ))}
        </tbody></table>
      )}

      <h2 className="mt-8 font-semibold">Fotos de viajeros</h2>
      {fotos.length === 0 ? <p className="mt-1 text-text/60">Todavía no hay fotos.</p> : (
        <p className="mt-1 text-text/60">{fotos.length} foto(s): arriba, en cada aviso de tipo «Comparte tu foto», pon el sitio y pulsa [Usar en la app] (sale con «Foto: nombre») o [Descartar].</p>
      )}
    </section>
  )
}
