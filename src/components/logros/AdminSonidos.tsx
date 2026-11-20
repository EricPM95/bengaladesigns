import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { aperturaInteriorHtml } from '../../../shared/marca/aperturaJutrip.js'
import { llamar, logrosActivos, type Momento } from '../../lib/logros'
import { contextoDeAudioDeLaApp, sonar } from '../../lib/sonidos'
import { cortar, elegirVersion, iniciarPartitura, manifiesto, ponerVolumenDe, ponerVolumenGeneral, precargar, volumenDe, volumenGeneral, versionDe, LETRAS, type Letra, type Manifiesto } from '../../lib/sonidos/motor'
import { ARCHIVOS_DE_PREMIO, EN_PALABRAS, IDS_DE_PARTITURA, partituraDe, SIN_PARTITURA } from '../../lib/sonidos/partituras'
import { tocarSintetico, type SonidoSintetico } from '../../lib/sonidos/sintesis'

/**
 * (V29) /admin/sonidos (o /?admin=sonidos): la página para que Eric elija los sonidos EN SU IPHONE. Solo para administradores (la cuenta sale de LOGROS_ADMIN_EMAILS, igual que /admin/logros; el servidor lo comprueba).
 *   1. Un control de volumen general.
 *   2. Cada animación con su partitura y un ▶ que la reproduce con su sonido (y una línea de tiempo con cada sonido en su instante, para verlo).
 *   3. Cada sonido con sus versiones A, B y C (▶ para oírla, ● para elegirla) y «más alto / más bajo».
 *   4. Un resumen con lo elegido, para copiarlo y pasárselo a Code.
 * Lo elegido se guarda en el móvil y es lo que suena en la app; cuando Eric pasa el resumen queda fijo en el código y esta página sigue para cambiarlo más adelante.
 */
// (Va en su propio archivo: solo se baja al pulsar «Con su animación».)
const Reproductor = lazy(() => import('./momentos/Reproductor'))
const SERIE = "'Instrument Serif',serif"
/** Los que se quedan como están (Eric, V30): hechos por código, sin candidatos. */
const FIJOS: { id: SonidoSintetico; nombre: string }[] = [
  { id: 'toque', nombre: 'El toque de [Visto]' },
  { id: 'brillo', nombre: 'El brillo pequeño de [Visto]' },
  { id: 'campanita', nombre: 'La campanita del aviso' },
  { id: 'tic', nombre: 'El tic de los números que suben' },
]
const SONIDOS_CON_ANIMACION: Record<string, string> = { medalla_bronce: 'medalla', medalla_plata: 'medalla', medalla_oro: 'medalla', medalla_diamante: 'medalla', coleccion: 'coleccion', emblema: 'emblema', apertura: 'apertura', pais: 'pais' }
const EN = new Date().toISOString()
/** Los momentos de ejemplo para ver la animación DE VERDAD (los mismos datos que usa la demo de logros). */
const MOMENTO_DE: Record<string, (id: string) => Momento> = {
  medalla: (id) => ({ tipo: 'sello', cat: 'sello', clave: 'demo|sello', sello: 'roma', destino: 'roma', grado: id.replace('medalla_', ''), nombre: 'Roma te atrapa', linea: 'Cuatro imprescindibles vistos: ya eres de aquí.', primera_vez: true, en: EN }) as Momento,
  coleccion: () => ({ tipo: 'coleccion', cat: 'coleccion', clave: 'demo|coleccion', id: 'roma_antigua', destino: 'roma', nombre: 'La Roma antigua', linea: 'Seis piedras que lo empezaron todo', primera_vez: true, en: EN }) as Momento,
  emblema: () => ({ tipo: 'emblema', cat: 'emblema', clave: 'demo|emblema', id: 'panteon', destino: 'roma', nombre: 'El Panteón', linea: 'Casi dos mil años con la puerta abierta.', momento: false, maravilla: false, primera_vez: true, frase: '¡Eh! Aquí hay algo…', en: EN }) as Momento,
  pais: () => ({ tipo: 'pais', cat: 'pais', clave: 'demo|pais', pais: 'Italia', n: 1, nombre: 'Tu país número 1: Italia', primera_vez: true, en: EN }) as Momento,
}
const caja = { padding: 14, borderRadius: 16, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.1)' } as const
const boton = { minHeight: 44, minWidth: 44, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(28,34,48,.18)', background: '#fff', font: "600 14px 'Geist'", cursor: 'pointer' } as const
const botonOro = { ...boton, background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9640)', border: '1px solid #C9A45A', color: '#3A2A08' } as const

/** Pasa por la comprobación de administrador del servidor (la misma que /admin/logros). */
function useEsAdministrador(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    if (!logrosActivos()) {
      setOk(false)
      return
    }
    void llamar<{ ok: boolean }>('/api/admin/avisos-viajeros?limite=1').then((r) => setOk(Boolean(r?.ok)))
  }, [])
  return ok
}

function LineaDeTiempo({ id, progreso }: { id: string; progreso: number }): ReactNode {
  const p = partituraDe(id)
  if (!p) return null
  return (
    <div data-linea-de-tiempo={id} style={{ position: 'relative', height: 30, borderRadius: 8, background: 'rgba(28,34,48,.06)', overflow: 'hidden' }}>
      {p.notas.map((n, i) => {
        const en = n.tipo === 'sint' ? n.en : n.golpe
        return <span key={i} title={n.tipo === 'sint' ? n.sonido : `golpe de ${n.archivo}`} style={{ position: 'absolute', left: `${Math.min(99, (en / p.dura) * 100)}%`, top: n.tipo === 'archivo' ? 2 : 10, width: n.tipo === 'archivo' ? 4 : 3, height: n.tipo === 'archivo' ? 26 : 10, borderRadius: 2, background: n.tipo === 'archivo' ? '#BE9640' : '#2A3050' }} />
      })}
      <span style={{ position: 'absolute', left: `${Math.min(100, progreso * 100)}%`, top: 0, bottom: 0, width: 2, background: '#D21E45' }} />
    </div>
  )
}

export function AdminSonidos(): ReactNode {
  const admin = useEsAdministrador()
  const [vol, setVol] = useState(() => volumenGeneral())
  const [cambios, repintar] = useState(0)
  const [reproduciendo, setReproduciendo] = useState<{ id: string; t0: number; dura: number } | null>(null)
  const [progreso, setProgreso] = useState(0)
  const [mf, setMf] = useState<Manifiesto | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [demo, setDemo] = useState<{ clase: string; id: string; momento?: Momento } | null>(null)
  const reloj = useRef<number>(0)
  useEffect(() => {
    void manifiesto().then(setMf)
  }, [])
  useEffect(() => {
    if (!reproduciendo) return undefined
    const tick = () => {
      const ctx = contextoDeAudioDeLaApp()
      const p = ctx ? (ctx.currentTime - reproduciendo.t0) / reproduciendo.dura : 1
      setProgreso(p)
      if (p >= 1.05) setReproduciendo(null)
      else reloj.current = window.requestAnimationFrame(tick)
    }
    reloj.current = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(reloj.current)
  }, [reproduciendo])

  const ctx = (): AudioContext | null => {
    const c = contextoDeAudioDeLaApp()
    if (c && c.state !== 'running') void c.resume()
    return c
  }
  const ver = async (id: string) => {
    const c = ctx()
    if (!c) return
    cortar(c, 80)
    await precargar(c, id)
    const r = iniciarPartitura(c, id)
    if (r) setReproduciendo({ id, t0: c.currentTime, dura: r.dura })
  }
  const oir = async (id: string, v: Letra) => {
    const c = ctx()
    if (!c) return
    cortar(c, 60)
    const g = c.createGain()
    g.gain.value = volumenGeneral() * volumenDe(id)
    g.connect(c.destination)
    if (FIJOS.some((f) => f.id === id)) tocarSintetico(c, g, id as SonidoSintetico, 'A', c.currentTime + 0.03, 1, 0.9)
    else {
      const { cargarPremio } = await import('../../lib/sonidos/motor')
      const b = await cargarPremio(c, id, v)
      if (!b) return
      const s = c.createBufferSource()
      s.buffer = b
      s.connect(g)
      s.start()
    }
  }
  /** La animación DE VERDAD con el candidato elegido: la pantalla de logros (o la apertura) y su sonido, a la vez. */
  const verDemo = async (id: string, v: Letra) => {
    const c = ctx()
    if (!c) return
    elegirVersion(id, v)
    repintar((n) => n + 1)
    cortar(c, 80)
    const clase = SONIDOS_CON_ANIMACION[id]
    const momento = MOMENTO_DE[clase]?.(id)
    const partitura = clase === 'apertura' ? 'apertura' : clase === 'medalla' ? id : clase === 'pais' ? 'pais' : clase === 'emblema' ? 'emblema' : 'coleccion'
    await precargar(c, partitura)
    if (clase === 'emblema') await precargar(c, 'escena')
    setDemo({ clase, id, momento })
    void sonar(partitura)
  }
  const resumen = useMemo(() => {
    const ids = [...ARCHIVOS_DE_PREMIO] as string[]
    return ids.map((id) => `${id}: ${versionDe(id)}${volumenDe(id) !== 1 ? ` (volumen ${volumenDe(id).toFixed(1)})` : ''}`).join('\n') + `\nfijos (no se cambian): toque A, brillo A, campanita A, tic A
volumen general: ${vol.toFixed(2)}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vol, reproduciendo, copiado, cambios])

  if (admin === null) return <div style={{ padding: 24, font: "400 15px 'Geist'" }}>Comprobando…</div>
  if (!admin) return <div data-solo-administradores style={{ padding: 24, font: "400 17px/1.4 'Geist'" }}>Esta página es solo para administradores.</div>

  return (
    <div data-admin-sonidos style={{ minHeight: '100vh', background: '#FBF6EC', color: '#1C2230', padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: "'Geist',system-ui,sans-serif" }}>
      <h1 style={{ margin: 0, font: `400 34px/1.05 ${SERIE}` }}>Sonidos</h1>
      <p style={{ margin: 0, font: "400 14px/1.5 'Geist'", color: 'rgba(28,34,48,.7)' }}>Toca ▶ para oír cada animación con su sonido, y debajo elige la versión (A, B o C) de cada sonido. Lo que elijas se guarda en este móvil y es lo que suena en la app.</p>

      <section style={caja}>
        <h2 style={{ margin: '0 0 8px', font: `400 22px ${SERIE}` }}>Volumen general</h2>
        <input type="range" min={0} max={1} step={0.05} value={vol} aria-label="Volumen general" style={{ width: '100%', minHeight: 44 }} onChange={(e) => { setVol(Number(e.target.value)); ponerVolumenGeneral(Number(e.target.value)) }} />
      </section>

      <section style={{ ...caja, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ margin: 0, font: `400 22px ${SERIE}` }}>Las animaciones</h2>
        {IDS_DE_PARTITURA.map((id) => {
          const p = partituraDe(id)
          return (
            <div key={id} data-animacion={id} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid rgba(28,34,48,.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" data-ver={id} onClick={() => void ver(id)} aria-label={`Ver ${id} con su sonido`} style={botonOro}>▶</button>
                <span style={{ flex: 1, font: "600 14px 'Geist Mono',monospace" }}>{id}{p ? ` · ${p.dura.toFixed(1)} s` : ''}</span>
              </div>
              <span style={{ font: "400 13px/1.45 'Geist'", color: 'rgba(28,34,48,.7)' }}>{EN_PALABRAS[id]}</span>
              <LineaDeTiempo id={id} progreso={reproduciendo?.id === id ? progreso : -1} />
              {id === 'apertura' && <span style={{ font: "400 12px/1.4 'Geist'", color: '#8E6820' }}>En la web la apertura no suena (el navegador no deja sonar antes del primer toque): queda lista para la app de las tiendas.</span>}
            </div>
          )
        })}
        <span style={{ font: "400 12px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>Sin partitura todavía: {SIN_PARTITURA.join('; ')}.</span>
      </section>

      <section style={{ ...caja, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, font: `400 22px ${SERIE}` }}>Los que se quedan (fijos)</h2>
        {FIJOS.map((f) => (
          <div key={f.id} data-fijo={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" style={boton} onClick={() => void oir(f.id, 'A')} aria-label={`Oír ${f.nombre}`}>▶</button>
            <span style={{ flex: 1, font: "400 14px 'Geist'" }}>{f.nombre}</span>
            <span style={{ font: "600 11px 'Geist Mono',monospace", letterSpacing: '.1em', color: '#8E6820' }}>FIJO</span>
          </div>
        ))}
      </section>

      <section style={{ ...caja, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, font: `400 22px ${SERIE}` }}>Los sonidos grabados (candidatos A a E)</h2>
        <span style={{ font: "400 12px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>▶ A: solo el sonido. «Con su animación»: la animación de verdad, con ese candidato.</span>
        {(ARCHIVOS_DE_PREMIO as readonly string[]).map((id) => (
          <div key={id} data-sonido={id} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(28,34,48,.08)' }}>
            <span style={{ font: "600 13px 'Geist Mono',monospace" }}>{id}</span>
            {LETRAS.filter((v) => mf?.[id]?.[v]).map((v) => {
              const d = mf![id]![v]!
              return (
                <div key={v} data-candidato={`${id}:${v}`} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 0' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" data-oir={`${id}:${v}`} onClick={() => void oir(id, v)} style={boton} aria-label={`Oír ${id} candidato ${v}`}>▶ {v}</button>
                    {SONIDOS_CON_ANIMACION[id] && <button type="button" data-con-animacion={`${id}:${v}`} onClick={() => void verDemo(id, v)} style={botonOro}>Con su animación</button>}
                    <button type="button" data-elegir={`${id}:${v}`} aria-pressed={versionDe(id) === v} onClick={() => { elegirVersion(id, v); repintar((n) => n + 1) }} style={{ ...boton, background: versionDe(id) === v ? '#1C2230' : '#fff', color: versionDe(id) === v ? '#FFFDF8' : '#1C2230' }} aria-label={`Elegir ${id} candidato ${v}`}>{versionDe(id) === v ? '● elegido' : '○ elegir'}</button>
                    <span style={{ font: "500 12px 'Geist Mono',monospace" }}>{d.dura.toFixed(2)} s · {(d.bytes / 1024).toFixed(0)} KB</span>
                  </div>
                  <span style={{ font: "400 11.5px/1.35 'Geist'", color: 'rgba(28,34,48,.6)' }}>{(d.fuentes ?? []).join(' + ')}{d.licencia ? ` — ${d.licencia}` : ''}</span>
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={boton} onClick={() => { ponerVolumenDe(id, volumenDe(id) - 0.2); repintar((n) => n + 1) }}>Más bajo</button>
              <button type="button" style={boton} onClick={() => { ponerVolumenDe(id, volumenDe(id) + 0.2); repintar((n) => n + 1) }}>Más alto</button>
              <span style={{ alignSelf: 'center', font: "500 12px 'Geist Mono',monospace" }}>×{volumenDe(id).toFixed(1)}</span>
            </div>
          </div>
        ))}
      </section>

      {demo && demo.clase === 'apertura' && (
        <div data-demo-apertura onClick={() => setDemo(null)} style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#FBF6EC' }} dangerouslySetInnerHTML={{ __html: aperturaInteriorHtml({ lema: 'Viaja con calma' }) }} />
      )}
      {demo && demo.momento && (
        <Suspense fallback={null}>
          <Reproductor momentos={[demo.momento]} onTerminar={() => setDemo(null)} />
        </Suspense>
      )}

      <section style={caja}>
        <h2 style={{ margin: '0 0 8px', font: `400 22px ${SERIE}` }}>Lo elegido</h2>
        <pre data-resumen-elegido style={{ margin: 0, whiteSpace: 'pre-wrap', font: "500 13px/1.5 'Geist Mono',monospace" }}>{resumen}</pre>
        <button type="button" style={{ ...botonOro, marginTop: 10 }} onClick={() => { void navigator.clipboard?.writeText(resumen).then(() => setCopiado(true)).catch(() => undefined) }}>{copiado ? 'Copiado' : 'Copiar'}</button>
      </section>
    </div>
  )
}
