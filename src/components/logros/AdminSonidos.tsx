import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { contextoDeAudioDeLaApp } from '../../lib/sonidos'
import { elegirVersion, manifiesto, ponerVolumenDe, ponerVolumenGeneral, versionDe, volumenDe, volumenGeneral, LETRAS, type Letra, type Manifiesto, type SonidoPropio } from '../../lib/sonidos/motor'
import { ANIMACIONES, archivosDeLaAnimacion, AVISO_DE_LOS_SONIDOS_PROPIOS, lineaElegida, sintesDeLaAnimacion, type Animacion } from '../../lib/sonidos/estudio'
import { partituraDe } from '../../lib/sonidos/partituras'
import type { VisorApi } from './sonidos/VisorDeAnimacion'
import { useEsAdministrador } from './sonidos/useEsAdministrador'

/**
 * (V29, rehecha en la V34C con el diseño «Panel Jutrip › Logros y sonidos › Sonidos») EL ESTUDIO DE SONIDOS: /admin/sonidos (o /?admin=sonidos), solo para administradores (la cuenta sale de LOGROS_ADMIN_EMAILS; el servidor lo comprueba).
 *   1. Cada animación se ve DENTRO DE UN MARCO DE IPHONE (393 x 852) tal cual sale en la app, con su partitura de verdad (cada sonido en su instante y el golpe cuando acaba la animación): el marco es la propia app con una sola
 *      animación (`VisorDeAnimacion`), así que si mañana cambia una animación aquí se ve el cambio.
 *   2. Candidatos A a E de cada sonido: al tocar uno, la animación se repite con ese sonido.
 *   3. «Probar con mi sonido»: un archivo propio (mp3, m4a, wav, ogg) que sustituye a un sonido de la animación, con la barra de adelantar/atrasar (±1000 ms, de 10 en 10), su volumen y la onda con una raya donde acaba la
 *      animación. El archivo NO se sube a ningún sitio: se queda en este navegador.
 *   4. «Lo elegido»: una línea por animación para copiar y pasar a Claude. Esta página no cambia ningún sonido de la app por sí sola.
 */
const SERIE = "'Instrument Serif',serif"
const ANCHO = 393
const ALTO = 852
const OSCURO = '#1C2230'
const ORO = '#C99A44'
const FONDO_BARRA = '#F1EADC'

const NOMBRE_DE_SONIDO: Record<string, string> = {
  clic: 'clic', vuelo: 'vuelo (vuuush)', brillo: 'brillo', redoble: 'redoble', emblema: 'golpe del emblema', maravilla: 'golpe de las 7 maravillas', coleccion: 'golpe de la colección', pais: 'golpe de país', apertura: 'firma de la apertura',
  medalla_bronce: 'golpe de la medalla de bronce', medalla_plata: 'golpe de la medalla de plata', medalla_oro: 'golpe de la medalla de oro', medalla_diamante: 'golpe de la medalla de diamante',
  toque: 'toque', campanita: 'campanita', tic: 'tic',
}
const nombreDe = (id: string) => NOMBRE_DE_SONIDO[id] ?? id
const coma = (x: number, d = 2) => x.toFixed(d).replace('.', ',')
const conSigno = (ms: number) => `${ms >= 0 ? '+' : '−'}${Math.abs(ms)} ms`

/** El sonido propio de una animación (vive solo en esta página, en la memoria del navegador). */
interface Propio {
  nombre: string
  buffer: AudioBuffer
  ms: number
  vol: number
  objetivo: { tipo: 'archivo' | 'sint'; id: string }
}

const boton = { minHeight: 44, minWidth: 44, padding: '0 16px', borderRadius: 12, border: '1.5px solid rgba(28,34,48,.2)', background: '#FFFFFF', font: "700 13.5px 'Geist'", cursor: 'pointer', color: OSCURO } as const
const botonOscuro = { ...boton, background: OSCURO, color: '#F3D88F', border: `1.5px solid ${OSCURO}` } as const
const etiqueta = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' } as const

function Triangulo({ t = 11 }: { t?: number }): ReactNode {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4l13 8-13 8z" />
    </svg>
  )
}

/** La onda del sonido propio, con una raya donde acaba la animación (donde tiene que caer el golpe). */
function Onda({ buffer, marcaS }: { buffer: AudioBuffer; marcaS: number }): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')
    if (!g) return
    const W = c.width
    const H = c.height
    g.clearRect(0, 0, W, H)
    const datos = buffer.getChannelData(0)
    const paso = Math.max(1, Math.floor(datos.length / W))
    g.fillStyle = '#8A6A2C'
    for (let x = 0; x < W; x++) {
      let mn = 1
      let mx = -1
      for (let i = 0; i < paso; i++) {
        const v = datos[x * paso + i] ?? 0
        if (v < mn) mn = v
        if (v > mx) mx = v
      }
      g.fillRect(x, ((1 - mx) / 2) * H, 1, Math.max(1, ((mx - mn) / 2) * H))
    }
    const mx = Math.min(W - 1, Math.max(0, (marcaS / buffer.duration) * W))
    g.fillStyle = '#D21E45'
    g.fillRect(mx, 0, 2, H)
  }, [buffer, marcaS])
  const fuera = marcaS < 0 || marcaS > buffer.duration
  return (
    <div data-onda-caja style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <canvas ref={ref} data-onda width={600} height={64} style={{ width: '100%', height: 64, borderRadius: 10, background: '#F7F1E4' }} aria-label="Onda de tu sonido, con una raya roja donde acaba la animación" />
      <span data-onda-leyenda style={{ font: "500 11.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
        Raya roja: donde acaba la animación{fuera ? ' (cae fuera de tu sonido: mueve la barra)' : ''} · tu sonido dura {coma(buffer.duration)} s
      </span>
    </div>
  )
}

export function AdminSonidos({ embebido = false }: { embebido?: boolean }): ReactNode {
  const admin = useEsAdministrador()
  const [vol, setVol] = useState(() => volumenGeneral())
  const [cambios, repintar] = useState(0)
  const [mf, setMf] = useState<Manifiesto | null>(null)
  const [abierta, setAbierta] = useState<string>(ANIMACIONES[0].id)
  const [propios, setPropios] = useState<Record<string, Propio | null>>({})
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const [visorListo, setVisorListo] = useState(false)
  const [haSonado, setHaSonado] = useState(false)
  const [ancho, setAncho] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  const [copiado, setCopiado] = useState(false)
  const iframe = useRef<HTMLIFrameElement>(null)
  const entrada = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void manifiesto().then(setMf)
    const f = () => setAncho(window.innerWidth)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const movil = ancho < 820
  const escala = movil ? Math.min(0.62, (Math.min(ancho, 520) - 64) / ANCHO) : 0.62
  const anim = ANIMACIONES.find((a) => a.id === abierta) ?? ANIMACIONES[0]
  const propio = propios[anim.id] ?? null

  // El visor (la app dentro del marco): la marca de «sin pantalla de apertura» se deja antes de cargarlo y se espera a que tenga su API.
  const srcDelVisor = useMemo(() => {
    try {
      window.sessionStorage.setItem('jutrip:sin-apertura', '1')
    } catch {
      /* sin almacenamiento */
    }
    return '/?visor-sonidos=1'
  }, [])
  useEffect(() => {
    if (!admin) return undefined
    let vivo = true
    const t = window.setInterval(() => {
      const w = iframe.current?.contentWindow as (Window & { __estudioVisor?: VisorApi }) | null | undefined
      if (vivo && w?.__estudioVisor?.listo) {
        setVisorListo(true)
        window.clearInterval(t)
      }
    }, 120)
    return () => {
      vivo = false
      window.clearInterval(t)
    }
  }, [admin])

  const visor = (): VisorApi | null => ((iframe.current?.contentWindow as (Window & { __estudioVisor?: VisorApi }) | null | undefined)?.__estudioVisor ?? null)
  /** El audio es de ESTA página (se desbloquea con el toque de quien lo pulsa) y el marco lo usa. */
  const audio = (): AudioContext | null => {
    const c = contextoDeAudioDeLaApp()
    if (!c) return null
    ;(window as unknown as { __estudioContexto?: AudioContext }).__estudioContexto = c
    if (c.state !== 'running') void c.resume().catch(() => undefined)
    return c
  }
  const ver = useCallback(
    async (id: string, p: Propio | null) => {
      const v = visor()
      if (!v || !audio()) return
      setHaSonado(true)
      const sonido: SonidoPropio | null = p ? { objetivo: p.objetivo, buffer: p.buffer, ms: p.ms, vol: p.vol } : null
      await v.ver({ animacion: id, propio: sonido })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const abrirY = (id: string) => {
    setAbierta(id)
    window.setTimeout(() => void ver(id, propios[id] ?? null), 0)
  }

  const elegirCandidato = (archivo: string, letra: Letra) => {
    elegirVersion(archivo, letra)
    repintar((n) => n + 1)
    void ver(anim.id, propio)
  }

  const poner = (cambio: Partial<Propio>) => setPropios((m) => ({ ...m, [anim.id]: m[anim.id] ? { ...(m[anim.id] as Propio), ...cambio } : null }))

  const alElegirArchivo = async (f: File | undefined) => {
    if (!f) return
    setErrorArchivo(null)
    const c = audio()
    if (!c) return setErrorArchivo('Este navegador no deja reproducir audio.')
    try {
      // Se lee y se descodifica AQUÍ, en el navegador: el archivo no se envía a ningún sitio.
      const buffer = await c.decodeAudioData(await f.arrayBuffer())
      const nuevo: Propio = { nombre: f.name, buffer, ms: 0, vol: 0.7, objetivo: anim.principal }
      setPropios((m) => ({ ...m, [anim.id]: nuevo }))
      void ver(anim.id, nuevo)
    } catch {
      setErrorArchivo('No he podido abrir ese archivo. Prueba con un mp3, m4a, wav u ogg.')
    }
    if (entrada.current) entrada.current.value = ''
  }

  // Para el candidato elegido del sonido que sustituye: dónde cae su golpe dentro de su archivo (para la raya de la onda).
  const golpeDelQueSustituye = propio && propio.objetivo.tipo === 'archivo' ? (mf?.[propio.objetivo.id]?.[versionDe(propio.objetivo.id)]?.golpe ?? 0) : 0
  const marcaS = propio ? golpeDelQueSustituye - propio.ms / 1000 : 0

  const archivos = archivosDeLaAnimacion(anim)
  const sintes = sintesDeLaAnimacion(anim)
  const objetivos = [...archivos.map((id) => ({ tipo: 'archivo' as const, id })), ...sintes.map((id) => ({ tipo: 'sint' as const, id }))]

  const elegido = useMemo(() => {
    void cambios
    return ANIMACIONES.map((a) => {
      const p = propios[a.id]
      if (p) return lineaElegida(a, { letra: '', volumen: 0, propio: { nombre: p.nombre, ms: p.ms, volumen: p.vol } })
      if (a.principal.tipo === 'sint') return lineaElegida(a, { letra: '', volumen: 1, fijo: true })
      return lineaElegida(a, { letra: versionDe(a.principal.id), volumen: volumenDe(a.principal.id) })
    }).join('\n') + `\nvolumen general: ${coma(vol)}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propios, cambios, vol, mf])

  if (admin === null) return <div style={{ padding: 24, font: "400 15px 'Geist'" }}>Comprobando…</div>
  if (!admin) return <div data-solo-administradores style={{ padding: 24, font: "400 17px/1.4 'Geist'" }}>Esta página es solo para administradores.</div>

  const solo = (a: Animacion): string | null => {
    const arch = archivosDeLaAnimacion(a)
    if (arch.length === 0) return 'Solo un sonido (hecho por código, fijo)'
    const conVarios = arch.filter((id) => LETRAS.filter((l) => mf?.[id]?.[l]).length > 1)
    return conVarios.length === 0 ? 'Solo un sonido grabado' : null
  }

  const marco = (
    <div data-marco-iphone style={{ flex: 'none', width: ANCHO * escala + 14, height: ALTO * escala + 14, borderRadius: 34, background: OSCURO, padding: 7, boxShadow: '0 18px 30px -14px rgba(28,34,48,.7)', boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', width: ANCHO * escala, height: ALTO * escala, borderRadius: 28, overflow: 'hidden', background: '#0B0E1C' }}>
        <iframe ref={iframe} data-visor-iframe src={srcDelVisor} title="La animación, en un iPhone" style={{ width: ANCHO, height: ALTO, border: 0, transform: `scale(${escala})`, transformOrigin: '0 0', background: '#12172A' }} allow="autoplay" />
        {!visorListo && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,253,248,.6)', font: "500 12px 'Geist'" }}>Preparando…</span>}
      </div>
    </div>
  )

  return (
    <div data-admin-sonidos data-estudio-sonidos style={{ color: OSCURO, padding: embebido ? 0 : '16px 16px 80px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: "'Geist',system-ui,sans-serif" }}>
      {!embebido && <h1 style={{ margin: 0, font: `400 34px/1.05 ${SERIE}` }}>Sonidos</h1>}
      <p style={{ margin: 0, font: "400 13.5px/1.5 'Geist'", color: 'rgba(28,34,48,.65)' }}>
        Cada animación se ve dentro de un iPhone, tal cual sale en la app y con su sonido cuadrado. Toca [▶ Ver con sonido]; elige un candidato o prueba con un sonido tuyo. Esta página no cambia ningún sonido de la app.
      </p>

      {/* La tarjeta abierta (Design: marco de iPhone, candidatos, «Probar con mi sonido», barra de ms y volumen). */}
      <div data-tarjeta-abierta={anim.id} style={{ borderRadius: 24, background: '#FFFFFF', border: `1.5px solid ${ORO}`, boxShadow: '0 18px 34px -22px rgba(28,34,48,.5)', padding: movil ? 16 : 22, display: 'flex', flexDirection: movil ? 'column' : 'row', alignItems: movil ? 'center' : 'flex-start', gap: movil ? 18 : 26 }}>
        {marco}
        <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={etiqueta}>{anim.grupo.toUpperCase()}</span>
            <span data-nombre-abierta style={{ font: `400 30px/1.05 ${SERIE}` }}>{anim.nombre}</span>
            {(() => {
              const d = anim.suena.map((s) => partituraDe(s)?.dura ?? 0)
              return <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)' }}>dura {coma(Math.max(...d, 0), 1)} s con su sonido</span>
            })()}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" data-ver-con-sonido onClick={() => void ver(anim.id, propio)} disabled={!visorListo} style={{ ...botonOscuro, display: 'flex', alignItems: 'center', gap: 9, height: 48, padding: '0 20px', opacity: visorListo ? 1 : 0.5 }}>
              <Triangulo /> Ver con sonido
            </button>
            <button type="button" data-repetir onClick={() => void ver(anim.id, propio)} disabled={!visorListo || !haSonado} style={{ ...boton, height: 48, opacity: visorListo && haSonado ? 1 : 0.5 }}>
              Repetir
            </button>
          </div>
          {anim.nota && <span data-nota-de-la-animacion style={{ font: "400 12.5px/1.45 'Geist'", color: '#8E6820' }}>{anim.nota}</span>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={etiqueta}>CANDIDATOS</span>
            {archivos.length === 0 && <span style={{ font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>Este sonido está hecho por código y se queda como está (no hay candidatos).</span>}
            {archivos.map((id, k) => {
              const letras = LETRAS.filter((l) => mf?.[id]?.[l])
              return (
                <div key={id} data-sonido={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: `${k === 0 ? 700 : 500} 12.5px 'Geist'` }}>{nombreDe(id)}{k === 0 ? ' (el principal)' : ''}</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {letras.map((l) => {
                      const on = !propio && versionDe(id) === l
                      return (
                        <button key={l} type="button" data-candidato={`${id}:${l}`} aria-pressed={on} onClick={() => elegirCandidato(id, l)} disabled={!visorListo} style={{ flex: '1 1 100px', minWidth: 100, height: 54, borderRadius: 14, background: on ? OSCURO : '#FFFFFF', color: on ? '#FFFDF8' : OSCURO, border: `1.5px solid ${on ? OSCURO : 'rgba(28,34,48,.18)'}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', font: "700 13.5px 'Geist'", whiteSpace: 'nowrap', cursor: 'pointer' }}>
                          <span style={{ width: 28, height: 28, borderRadius: '50%', background: on ? '#F3D88F' : OSCURO, color: on ? OSCURO : '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Triangulo t={11} />
                          </span>
                          Sonido {l}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {archivos.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ font: "600 12.5px 'Geist'", width: 62 }}>Volumen</span>
                <input type="range" data-volumen-candidato min={0.2} max={2} step={0.05} value={volumenDe(archivos[0])} aria-label={`Volumen de ${nombreDe(archivos[0])}`} style={{ flex: 1, minHeight: 44, accentColor: ORO }} onChange={(e) => { ponerVolumenDe(archivos[0], Number(e.target.value)); repintar((n) => n + 1) }} />
                <b data-volumen-candidato-valor style={{ font: "700 12.5px 'Geist'", width: 52, textAlign: 'right' }}>{Math.round(volumenDe(archivos[0]) * 100)} %</b>
              </div>
            )}
          </div>

          {/* Probar con mi sonido. */}
          <div data-probar-propio style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4, borderTop: '1px solid rgba(28,34,48,.08)' }}>
            <input ref={entrada} type="file" data-archivo-propio accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden onChange={(e) => void alElegirArchivo(e.target.files?.[0])} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 12 }}>
              <button type="button" data-boton-probar-propio onClick={() => entrada.current?.click()} disabled={!visorListo} style={{ ...boton, alignSelf: 'flex-start', height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 20h14" /></svg>
                Probar con mi sonido
              </button>
              {propio && (
                <button type="button" data-quitar-propio onClick={() => { setPropios((m) => ({ ...m, [anim.id]: null })); void ver(anim.id, null) }} style={{ ...boton, height: 44 }}>
                  Quitar mi sonido
                </button>
              )}
            </div>
            <span style={{ font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>El archivo no se sube a ningún sitio: se queda en este navegador, solo para probar.</span>
            {errorArchivo && <span role="alert" data-error-archivo style={{ font: "500 13px 'Geist'", color: '#A33A2A' }}>{errorArchivo}</span>}
            {propio && (
              <div data-propio-activo style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span data-nombre-propio style={{ font: "600 13px 'Geist'" }}>Tu sonido: {propio.nombre}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, font: "500 12.5px 'Geist'" }}>
                  Sustituye a
                  <select data-objetivo-propio value={`${propio.objetivo.tipo}:${propio.objetivo.id}`} onChange={(e) => { const [tipo, id] = e.target.value.split(':'); poner({ objetivo: { tipo: tipo as 'archivo' | 'sint', id } }) }} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1.5px solid rgba(28,34,48,.2)', padding: '0 10px', font: "600 13px 'Geist'", background: '#fff' }}>
                    {objetivos.map((o) => (
                      <option key={`${o.tipo}:${o.id}`} value={`${o.tipo}:${o.id}`}>{nombreDe(o.id)}</option>
                    ))}
                  </select>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', font: "600 12.5px 'Geist'" }}>
                    <span>Adelantar ‹</span>
                    <span data-ms-valor style={{ color: '#8A6A2C' }}>{conSigno(propio.ms)}</span>
                    <span>› Atrasar</span>
                  </span>
                  <input type="range" data-ms min={-1000} max={1000} step={10} value={propio.ms} aria-label="Adelantar o atrasar tu sonido, en milisegundos" style={{ width: '100%', minHeight: 44, accentColor: ORO }} onChange={(e) => poner({ ms: Number(e.target.value) })} onPointerUp={() => void ver(anim.id, propio)} onKeyUp={() => void ver(anim.id, propio)} />
                  <span style={{ display: 'flex', gap: 8 }}>
                    <button type="button" data-ms-menos style={{ ...boton, minHeight: 36, padding: '0 12px' }} onClick={() => poner({ ms: Math.max(-1000, propio.ms - 10) })}>−10</button>
                    <button type="button" data-ms-cero style={{ ...boton, minHeight: 36, padding: '0 12px' }} onClick={() => poner({ ms: 0 })}>0</button>
                    <button type="button" data-ms-mas style={{ ...boton, minHeight: 36, padding: '0 12px' }} onClick={() => poner({ ms: Math.min(1000, propio.ms + 10) })}>+10</button>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ font: "600 12.5px 'Geist'", width: 62 }}>Volumen</span>
                  <input type="range" data-vol-propio min={0} max={1} step={0.05} value={propio.vol} aria-label="Volumen de tu sonido" style={{ flex: 1, minHeight: 44, accentColor: ORO }} onChange={(e) => poner({ vol: Number(e.target.value) })} />
                  <b data-vol-propio-valor style={{ font: "700 12.5px 'Geist'", width: 52, textAlign: 'right' }}>{Math.round(propio.vol * 100)} %</b>
                </div>
                <Onda buffer={propio.buffer} marcaS={marcaS} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Las tarjetas cerradas, por grupos. */}
      {(['Medallas', 'Logros', 'Escenas', 'Resúmenes', 'Apertura', 'Sonidos cortos'] as const).map((g) => (
        <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={etiqueta}>{g.toUpperCase()}</span>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${movil ? 2 : 4},minmax(0,1fr))`, gap: 14 }}>
            {ANIMACIONES.filter((a) => a.grupo === g).map((a) => {
              const d = Math.max(...a.suena.map((s) => partituraDe(s)?.dura ?? 0), 0)
              const aviso = solo(a)
              return (
                <button key={a.id} type="button" data-animacion-tarjeta={a.id} aria-pressed={a.id === anim.id} onClick={() => abrirY(a.id)} style={{ textAlign: 'left', padding: 14, borderRadius: 18, background: '#FFFFFF', border: a.id === anim.id ? `1.5px solid ${ORO}` : '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
                  <span style={{ font: "600 13.5px/1.25 'Geist'" }}>{a.nombre}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', background: OSCURO, color: '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Triangulo t={13} /></span>
                    <span style={{ flex: 1, height: 6, borderRadius: 6, background: FONDO_BARRA }} />
                    <span style={{ font: "500 11.5px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{coma(d, 1)} s</span>
                  </span>
                  {aviso && <span data-solo-uno style={{ font: "500 11px/1.3 'Geist'", color: '#8E6820' }}>{aviso}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <section style={{ padding: 16, borderRadius: 18, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ font: "600 14px 'Geist'" }}>Volumen general</span>
        <input type="range" data-volumen-general min={0} max={1} step={0.05} value={vol} aria-label="Volumen general" style={{ width: '100%', minHeight: 44, accentColor: ORO }} onChange={(e) => { setVol(Number(e.target.value)); ponerVolumenGeneral(Number(e.target.value)) }} />
      </section>

      <section style={{ padding: 16, borderRadius: 18, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0, font: `400 24px ${SERIE}` }}>Lo elegido</h2>
        <pre data-lo-elegido data-resumen-elegido style={{ margin: 0, whiteSpace: 'pre-wrap', font: "500 13px/1.6 'Geist Mono',monospace" }}>{elegido}</pre>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" data-copiar-elegido style={{ ...botonOscuro, alignSelf: 'flex-start' }} onClick={() => { void navigator.clipboard?.writeText(elegido).then(() => setCopiado(true)).catch(() => undefined) }}>{copiado ? 'Copiado' : 'Copiar'}</button>
        </div>
        <p data-aviso-propios style={{ margin: 0, padding: '12px 14px', borderRadius: 14, background: '#FFFBF0', border: '1.5px solid #D8BE84', font: "500 13px/1.5 'Geist'" }}>{AVISO_DE_LOS_SONIDOS_PROPIOS}.</p>
      </section>
    </div>
  )
}

