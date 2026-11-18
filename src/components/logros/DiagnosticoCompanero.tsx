import { useEffect, useState, type ReactNode } from 'react'
import { llamarCrudo } from '../../lib/logros'
import { CLAVE_ULTIMO_COMPANERO } from '../../lib/companero'
import { supabase } from '../../lib/supabaseClient'

/**
 * (V15b) «Yo también estaba» · DIAGNÓSTICO, para el panel `?admin=logros` (y también para quien no es administrador: solo enseña SU cuenta). Una línea con lo que manda la app y lo que contesta el servidor,
 * tal cual, para poder mandar una captura desde cualquier móvil:
 *   · qué versión del servidor contesta (el commit que Vercel ha desplegado en `/api`);
 *   · lo ÚLTIMO que mandó la app en este navegador a `/api/logros/companero` (qué viaje, qué estado y qué cuerpo volvieron);
 *   · [Preguntar ahora] por un viaje de esta cuenta: la respuesta de siempre, tal cual, y los pasos que da el servidor (y dónde se queda vacío).
 * Ojo: si la app está instalada en la pantalla de inicio del iPhone, su memoria no es la de Safari: abre esta página desde la app instalada o mira la sección «Preguntar ahora», que no depende de eso.
 */
interface Ultimo {
  en: string
  enviado: string
  viaje_de_la_nube: string | null
  id_de_la_ruta: string | null
  estado: number | null
  error: string | null
  cuerpo: string
}
interface Viaje {
  id: string
  traveler_id: string
  route: { destination?: string; answers?: { dateRange?: { start?: string; end?: string } } } | null
}
interface Respuesta {
  id: string
  estado: number | null
  error?: string
  cuerpo: string
  pasos: string[]
}

const caja = { whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const, fontFamily: 'ui-monospace,monospace', fontSize: 11.5, background: 'rgba(28,34,48,.06)', borderRadius: 8, padding: 8, margin: '4px 0' }

export function DiagnosticoCompanero(): ReactNode {
  const [version, setVersion] = useState<string>('…')
  const [ultimo, setUltimo] = useState<Ultimo | null>(null)
  const [viajes, setViajes] = useState<Viaje[] | null>(null)
  const [yo, setYo] = useState<string | null>(null)
  const [resp, setResp] = useState<Respuesta | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    void fetch('/api/logros/version').then(async (r) => setVersion(`${r.status} ${(await r.text()).slice(0, 300)}`)).catch((e) => setVersion(`error: ${String(e)}`))
    try {
      setUltimo(JSON.parse(localStorage.getItem(CLAVE_ULTIMO_COMPANERO) ?? 'null'))
    } catch {
      setUltimo(null)
    }
    void (async () => {
      const sesion = (await supabase?.auth.getSession())?.data.session
      setYo(sesion?.user?.id ?? null)
      const r = await supabase?.from('trips').select('id, traveler_id, route')
      setViajes((r?.data as Viaje[] | null) ?? [])
    })()
  }, [])

  const preguntar = async (id: string) => {
    setOcupado(true)
    const normal = await llamarCrudo(`/api/logros/companero?trip_id=${encodeURIComponent(id)}`)
    const conPasos = await llamarCrudo(`/api/logros/companero?trip_id=${encodeURIComponent(id)}&pasos=1`)
    let pasos: string[] = []
    try {
      pasos = (JSON.parse(conPasos.cuerpo) as { pasos?: string[] }).pasos ?? []
    } catch {
      pasos = [`(la llamada con pasos no devolvió JSON: ${conPasos.estado ?? conPasos.error})`]
    }
    setResp({ id, estado: normal.estado, error: normal.error, cuerpo: normal.cuerpo, pasos })
    setOcupado(false)
  }

  return (
    <section data-diagnostico-companero className="mb-6 rounded-xl border border-text/20 p-3 text-[13px]">
      <h2 className="font-semibold">Yo también estaba · diagnóstico</h2>
      <p className="text-text/60">Cuenta: {yo ? `${yo.slice(0, 8)}…` : 'sin sesión'} · {new Date().toLocaleString('es')}</p>
      <p className="mt-2 font-medium">1. Versión del servidor (/api/logros/version)</p>
      <div style={caja}>{version}</div>
      <p className="mt-2 font-medium">2. Lo último que mandó la app en este navegador</p>
      {ultimo ? (
        <div style={caja}>
          {`a las ${ultimo.en}\nmandó trip_id = ${ultimo.enviado}\n  (viaje de la nube: ${ultimo.viaje_de_la_nube ?? 'ninguno'} · id de la ruta: ${ultimo.id_de_la_ruta ?? 'ninguno'})\nel servidor contestó: ${ultimo.estado ?? 'SIN RESPUESTA'}${ultimo.error ? ` · ${ultimo.error}` : ''}\n${ultimo.cuerpo}`}
        </div>
      ) : (
        <div style={caja}>Aún no ha mandado nada (abre un viaje en la app y vuelve aquí; en este navegador).</div>
      )}
      {ultimo && (
        <button type="button" disabled={ocupado} onClick={() => void preguntar(ultimo.enviado)} className="rounded-full border border-text/30 px-3 py-1.5">
          Preguntar ahora por ese viaje
        </button>
      )}
      <p className="mt-3 font-medium">3. Viajes de esta cuenta (los que ve la base de datos)</p>
      {viajes === null ? (
        <div style={caja}>Cargando…</div>
      ) : viajes.length === 0 ? (
        <div style={caja}>Ninguno (¿sin sesión?)</div>
      ) : (
        <ul className="space-y-1">
          {viajes.map((v) => (
            <li key={v.id} className="flex items-center gap-2">
              <button type="button" disabled={ocupado} onClick={() => void preguntar(v.id)} className="rounded-full border border-text/30 px-3 py-1.5">
                Preguntar
              </button>
              <span style={{ fontSize: 12 }}>{`${v.id.slice(0, 8)} · ${v.route?.destination ?? '?'} · ${v.route?.answers?.dateRange?.start ?? '?'} → ${v.route?.answers?.dateRange?.end ?? '?'} · ${v.traveler_id === yo ? 'mío' : `de ${v.traveler_id.slice(0, 8)}`}`}</span>
            </li>
          ))}
        </ul>
      )}
      {resp && (
        <div className="mt-3">
          <p className="font-medium">{`Respuesta de /api/logros/companero?trip_id=${resp.id}`}</p>
          <div style={caja}>{`estado: ${resp.estado ?? 'SIN RESPUESTA'}${resp.error ? ` · ${resp.error}` : ''}\n${resp.cuerpo}`}</div>
          <p className="font-medium">Pasos del servidor</p>
          <div style={caja}>{resp.pasos.join('\n') || '(sin pasos)'}</div>
        </div>
      )}
    </section>
  )
}
