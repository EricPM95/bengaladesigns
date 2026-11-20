import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { contextoDeAudioDeLaApp } from '../../lib/sonidos'
import { arranqueDelPropio, claveDeSilencio, elegirVersion, esperaDeLaAnimacion, manifiesto, ponerVolumenDe, ponerVolumenGeneral, versionDe, volumenDe, volumenGeneral, LETRAS, type Empieza, type Letra, type Manifiesto, type SonidoPropio } from '../../lib/sonidos/motor'
import { ANIMACIONES, archivosDeLaAnimacion, AVISO_DE_LOS_SONIDOS_PROPIOS, duracionDe, golpeDe, lineaElegida, sintesDeLaAnimacion, type Animacion } from '../../lib/sonidos/estudio'
import { partituraDe } from '../../lib/sonidos/partituras'
import type { VisorApi } from './sonidos/VisorDeAnimacion'
import { useEsAdministrador } from './sonidos/useEsAdministrador'

/**
 * (V29, rehecha en la V34C con el diseño «Panel Jutrip › Logros y sonidos › Sonidos», y otra vez en la V35A2) EL ESTUDIO DE SONIDOS: /admin/sonidos (o /?admin=sonidos), solo para administradores (la cuenta sale de LOGROS_ADMIN_EMAILS; el servidor lo comprueba).
 *   1. Cada animación se ve DENTRO DE UN MARCO DE IPHONE (393 x 852) tal cual sale en la app, con su partitura de verdad: el marco es la propia app con una sola animación (`VisorDeAnimacion`).
 *   2. Cada sonido de Code (golpe, redoble, chispas…) en su fila: candidatos A a E, [Silenciar] y su propio volumen de 0 a 200 %. Arriba, [Silenciar todos los de Code].
 *   3. Los sonidos de Eric son CAPAS que se SUMAN (no sustituyen a ninguno): cada uno con su nombre, su volumen, su barra de ms (de −duración a +duración), «Empieza…» (al empezar la animación o en el golpe) y [Quitar].
 *      Si un sonido cae antes del primer fotograma NO se recorta: la animación espera para que se oiga entero. El archivo NO se sube a ningún sitio: se queda en este navegador.
 *   4. Una línea de tiempo de la animación entera, con una fila por sonido que suena, la raya verde (empieza) y la roja (golpe / final).
 *   5. «Lo elegido»: una línea por animación con todo lo que suena, para copiar y pasar a Claude. Esta página no cambia ningún sonido de la app por sí sola.
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

/** Un sonido de Eric (una capa): vive solo en esta página, en la memoria del navegador. */
type Capa = SonidoPropio
/** Un sonido de Code de una animación: su clave de silencio y el sitio donde guarda su volumen. */
interface DeCode {
  tipo: 'archivo' | 'sint'
  id: string
  clave: string
  /** Dónde se guarda su volumen (los grabados, por su nombre; los hechos por código, con `s:`). */
  claveVolumen: string
}
const deCodeDe = (a: Animacion): DeCode[] => [
  ...archivosDeLaAnimacion(a).map((id) => ({ tipo: 'archivo' as const, id, clave: claveDeSilencio('archivo', id), claveVolumen: id })),
  ...sintesDeLaAnimacion(a).map((id) => ({ tipo: 'sint' as const, id, clave: claveDeSilencio('sint', id), claveVolumen: `s:${id}` })),
]

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

/** La onda de un sonido de Eric (solo la forma: las rayas van en la línea de tiempo). */
function Onda({ buffer }: { buffer: AudioBuffer }): ReactNode {
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
  }, [buffer])
  return <canvas ref={ref} data-onda width={300} height={28} style={{ width: '100%', height: '100%', display: 'block' }} aria-label="Onda de tu sonido" />
}

/** Un trozo de la línea de tiempo: un sonido (de Code o de Eric) colocado donde suena. */
interface Trozo {
  de: number
  a: number
}
interface FilaDeTiempo {
  clave: string
  nombre: string
  propio: boolean
  trozos: Trozo[]
  buffer?: AudioBuffer
}

/** La franja de 0 a la duración con una fila por sonido que suena y las rayas verde (empieza) y roja (golpe / final). */
function LineaDeTiempo({ filas, dura, golpe }: { filas: FilaDeTiempo[]; dura: number; golpe: number }): ReactNode {
  const todos = filas.flatMap((f) => f.trozos)
  const lo = Math.min(0, ...todos.map((t) => t.de))
  const hi = Math.max(dura, golpe, ...todos.map((t) => t.a))
  const largo = Math.max(0.001, hi - lo)
  const pos = (t: number) => `${(((t - lo) / largo) * 100).toFixed(3)}%`
  const ancho = (t: Trozo) => `${(((t.a - t.de) / largo) * 100).toFixed(3)}%`
  return (
    <div data-linea-de-tiempo data-lo={lo.toFixed(3)} data-hi={hi.toFixed(3)} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={etiqueta}>LÍNEA DE TIEMPO · {coma(dura, 1)} s</span>
      <div style={{ position: 'relative', paddingTop: 20 }}>
        <span style={{ position: 'absolute', top: 0, left: pos(0), transform: 'translateX(-2px)', font: "600 10.5px 'Geist'", color: '#2F6B43', whiteSpace: 'nowrap' }}>empieza la animación</span>
        <span style={{ position: 'absolute', top: 0, left: pos(golpe), transform: 'translateX(calc(-100% + 2px))', font: "600 10.5px 'Geist'", color: '#B0183A', whiteSpace: 'nowrap' }}>golpe / final</span>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0', background: '#F7F1E4', borderRadius: 10, minHeight: 40 }}>
          {filas.map((f) => (
            <div key={f.clave} data-fila-de-tiempo={f.clave} style={{ position: 'relative', height: 28 }}>
              {f.trozos.map((t, i) => (
                <div key={i} data-trozo style={{ position: 'absolute', left: pos(t.de), width: ancho(t), minWidth: 3, top: 0, bottom: 0, borderRadius: 6, background: f.propio ? 'rgba(201,154,68,.28)' : 'rgba(28,34,48,.16)', border: f.propio ? `1px solid ${ORO}` : '1px solid rgba(28,34,48,.3)', overflow: 'hidden' }}>
                  {f.buffer && <Onda buffer={f.buffer} />}
                </div>
              ))}
              <span style={{ position: 'absolute', left: 6, top: 6, font: "600 10px 'Geist'", color: OSCURO, pointerEvents: 'none', textShadow: '0 0 3px #F7F1E4,0 0 3px #F7F1E4' }}>{f.nombre}</span>
            </div>
          ))}
          <div data-raya-verde style={{ position: 'absolute', top: 0, bottom: 0, left: pos(0), width: 2, background: '#2F9E5B', pointerEvents: 'none' }} />
          <div data-raya-roja style={{ position: 'absolute', top: 0, bottom: 0, left: pos(golpe), width: 2, background: '#D21E45', pointerEvents: 'none' }} />
        </div>
      </div>
    </div>
  )
}

export function AdminSonidos({ embebido = false }: { embebido?: boolean }): ReactNode {
  const admin = useEsAdministrador()
  const [vol, setVol] = useState(() => volumenGeneral())
  const [cambios, repintar] = useState(0)
  const [mf, setMf] = useState<Manifiesto | null>(null)
  const [abierta, setAbierta] = useState<string>(ANIMACIONES[0].id)
  const [capas, setCapas] = useState<Record<string, Capa[]>>({})
  const [silenciados, setSilenciados] = useState<Record<string, string[]>>({})
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const [visorListo, setVisorListo] = useState(false)
  const [haSonado, setHaSonado] = useState(false)
  const [ancho, setAncho] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  const [copiado, setCopiado] = useState(false)
  const iframe = useRef<HTMLIFrameElement>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const contador = useRef(0)
  // Lo último que hay en pantalla, para que `ver` (que se crea una vez) no vea datos viejos.
  const vivo = useRef({ capas, silenciados })
  vivo.current = { capas, silenciados }

  useEffect(() => {
    void manifiesto().then(setMf)
    const f = () => setAncho(window.innerWidth)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const movil = ancho < 820
  const escala = movil ? Math.min(0.62, (Math.min(ancho, 520) - 64) / ANCHO) : 0.62
  const anim = ANIMACIONES.find((a) => a.id === abierta) ?? ANIMACIONES[0]
  const susCapas = capas[anim.id] ?? []
  const susSilencios = silenciados[anim.id] ?? []
  const dura = duracionDe(anim)
  const golpe = golpeDe(anim)

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
    let activo = true
    const t = window.setInterval(() => {
      const w = iframe.current?.contentWindow as (Window & { __estudioVisor?: VisorApi }) | null | undefined
      if (activo && w?.__estudioVisor?.listo) {
        setVisorListo(true)
        window.clearInterval(t)
      }
    }, 120)
    return () => {
      activo = false
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
  /** Reproduce la animación con lo que haya (o con lo que se pase, cuando el estado de React aún no se ha puesto al día). */
  const ver = useCallback(async (id: string, sobre?: { capas?: Capa[]; silenciados?: string[] }) => {
    const v = visor()
    if (!v || !audio()) return
    setHaSonado(true)
    await v.ver({ animacion: id, propios: sobre?.capas ?? vivo.current.capas[id] ?? [], silenciados: sobre?.silenciados ?? vivo.current.silenciados[id] ?? [] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const abrirY = (id: string) => {
    setAbierta(id)
    window.setTimeout(() => void ver(id), 0)
  }

  const elegirCandidato = (archivo: string, letra: Letra) => {
    elegirVersion(archivo, letra)
    repintar((n) => n + 1)
    void ver(anim.id)
  }
  const ponerVolumen = (clave: string, v: number) => {
    ponerVolumenDe(clave, v)
    repintar((n) => n + 1)
  }
  const alternarSilencio = (clave: string) => {
    const ya = susSilencios.includes(clave)
    const nuevo = ya ? susSilencios.filter((c) => c !== clave) : [...susSilencios, clave]
    setSilenciados((m) => ({ ...m, [anim.id]: nuevo }))
    void ver(anim.id, { silenciados: nuevo })
  }
  const deCode = deCodeDe(anim)
  const todosSilenciados = deCode.length > 0 && deCode.every((c) => susSilencios.includes(c.clave))
  const silenciarTodos = () => {
    const nuevo = todosSilenciados ? [] : deCode.map((c) => c.clave)
    setSilenciados((m) => ({ ...m, [anim.id]: nuevo }))
    void ver(anim.id, { silenciados: nuevo })
  }

  const ponerCapa = (id: string, cambio: Partial<Capa>) => setCapas((m) => ({ ...m, [anim.id]: (m[anim.id] ?? []).map((c) => (c.id === id ? { ...c, ...cambio } : c)) }))
  const quitarCapa = (id: string) => {
    const nuevas = susCapas.filter((c) => c.id !== id)
    setCapas((m) => ({ ...m, [anim.id]: nuevas }))
    void ver(anim.id, { capas: nuevas })
  }

  const alElegirArchivo = async (f: File | undefined) => {
    if (!f) return
    setErrorArchivo(null)
    const c = audio()
    if (!c) return setErrorArchivo('Este navegador no deja reproducir audio.')
    try {
      // Se lee y se descodifica AQUÍ, en el navegador: el archivo no se envía a ningún sitio.
      const buffer = await c.decodeAudioData(await f.arrayBuffer())
      const nueva: Capa = { id: `m${++contador.current}`, nombre: f.name, buffer, ms: 0, vol: 0.7, empieza: 'principio' }
      const nuevas = [...(vivo.current.capas[anim.id] ?? []), nueva]
      setCapas((m) => ({ ...m, [anim.id]: nuevas }))
      void ver(anim.id, { capas: nuevas })
    } catch {
      setErrorArchivo('No he podido abrir ese archivo. Prueba con un mp3, m4a, wav u ogg.')
    }
    if (entrada.current) entrada.current.value = ''
  }

  const limite = Math.max(500, Math.ceil((dura * 1000) / 10) * 10)
  const espera = esperaDeLaAnimacion(susCapas, golpe)

  // La línea de tiempo: los sonidos de Code que suenan (los silenciados no salen) y los de Eric, cada uno donde suena.
  const filas: FilaDeTiempo[] = useMemo(() => {
    void cambios
    const salida: FilaDeTiempo[] = []
    const porClave = new Map<string, FilaDeTiempo>()
    for (const s of anim.suena) {
      for (const n of partituraDe(s)?.notas ?? []) {
        const id = n.tipo === 'sint' ? n.sonido : n.archivo
        const clave = claveDeSilencio(n.tipo, id)
        if (susSilencios.includes(clave)) continue
        let de: number
        let largo: number
        if (n.tipo === 'sint') {
          de = n.en
          largo = n.dura ?? 0.25
        } else {
          const datos = mf?.[n.archivo]?.[versionDe(n.archivo)]
          de = n.golpe - (datos?.golpe ?? 0.3)
          largo = datos?.dura ?? 0.6
        }
        let fila = porClave.get(clave)
        if (!fila) {
          fila = { clave, nombre: nombreDe(id), propio: false, trozos: [] }
          porClave.set(clave, fila)
          salida.push(fila)
        }
        fila.trozos.push({ de, a: de + largo })
      }
    }
    for (const c of susCapas) {
      const de = arranqueDelPropio(c, golpe)
      salida.push({ clave: `propio:${c.id}`, nombre: `MÍO: ${c.nombre}`, propio: true, trozos: [{ de, a: de + c.buffer.duration }], buffer: c.buffer })
    }
    return salida
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim.id, susCapas, susSilencios, mf, cambios, golpe])

  const elegido = useMemo(() => {
    void cambios
    return ANIMACIONES.map((a) => {
      const sil = silenciados[a.id] ?? []
      const codigo = deCodeDe(a).map((c) => ({
        nombre: nombreDe(c.id),
        silenciado: sil.includes(c.clave),
        letra: c.tipo === 'archivo' ? versionDe(c.id) : undefined,
        volumen: volumenDe(c.claveVolumen),
      }))
      const propios = (capas[a.id] ?? []).map((c) => ({ nombre: c.nombre, empieza: c.empieza, ms: c.ms, volumen: c.vol }))
      return lineaElegida(a, { codigo, propios })
    }).join('\n') + `\nvolumen general: ${coma(vol)}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capas, silenciados, cambios, vol, mf])

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

  const botonPeq = { ...boton, minHeight: 36, padding: '0 12px' } as const

  return (
    <div data-admin-sonidos data-estudio-sonidos style={{ color: OSCURO, padding: embebido ? 0 : '16px 16px 80px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: "'Geist',system-ui,sans-serif" }}>
      {!embebido && <h1 style={{ margin: 0, font: `400 34px/1.05 ${SERIE}` }}>Sonidos</h1>}
      <p style={{ margin: 0, font: "400 13.5px/1.5 'Geist'", color: 'rgba(28,34,48,.65)' }}>
        Cada animación se ve dentro de un iPhone, tal cual sale en la app y con su sonido cuadrado. Toca [▶ Ver con sonido]; elige un candidato, silencia los de Code que no quieras o suma sonidos tuyos. Esta página no cambia ningún sonido de la app.
      </p>

      {/* La tarjeta abierta (marco de iPhone, sonidos de Code, mis sonidos, línea de tiempo). */}
      <div data-tarjeta-abierta={anim.id} style={{ borderRadius: 24, background: '#FFFFFF', border: `1.5px solid ${ORO}`, boxShadow: '0 18px 34px -22px rgba(28,34,48,.5)', padding: movil ? 16 : 22, display: 'flex', flexDirection: movil ? 'column' : 'row', alignItems: movil ? 'center' : 'flex-start', gap: movil ? 18 : 26 }}>
        {marco}
        <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={etiqueta}>{anim.grupo.toUpperCase()}</span>
            <span data-nombre-abierta style={{ font: `400 30px/1.05 ${SERIE}` }}>{anim.nombre}</span>
            <span data-dura style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)' }}>dura {coma(dura, 1)} s con su sonido</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" data-ver-con-sonido onClick={() => void ver(anim.id)} disabled={!visorListo} style={{ ...botonOscuro, display: 'flex', alignItems: 'center', gap: 9, height: 48, padding: '0 20px', opacity: visorListo ? 1 : 0.5 }}>
              <Triangulo /> Ver con sonido
            </button>
            <button type="button" data-repetir onClick={() => void ver(anim.id)} disabled={!visorListo || !haSonado} style={{ ...boton, height: 48, opacity: visorListo && haSonado ? 1 : 0.5 }}>
              Repetir
            </button>
          </div>
          {anim.nota && <span data-nota-de-la-animacion style={{ font: "400 12.5px/1.45 'Geist'", color: '#8E6820' }}>{anim.nota}</span>}

          {/* Los sonidos de Code, cada uno en su fila. */}
          <div data-sonidos-de-code style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <span style={etiqueta}>SONIDOS DE CODE</span>
              <button type="button" data-silenciar-todos aria-pressed={todosSilenciados} onClick={silenciarTodos} disabled={!visorListo} style={{ ...botonPeq, background: todosSilenciados ? '#A33A2A' : '#FFFFFF', color: todosSilenciados ? '#FFFFFF' : OSCURO, border: `1.5px solid ${todosSilenciados ? '#A33A2A' : 'rgba(28,34,48,.2)'}` }}>
                {todosSilenciados ? 'Activar todos los de Code' : 'Silenciar todos los de Code'}
              </button>
            </div>
            {deCode.length === 0 && <span style={{ font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>Esta animación no tiene sonidos de Code.</span>}
            {deCode.map((c, k) => {
              const letras = c.tipo === 'archivo' ? LETRAS.filter((l) => mf?.[c.id]?.[l]) : []
              const apagado = susSilencios.includes(c.clave)
              const v = volumenDe(c.claveVolumen)
              return (
                <div key={c.clave} data-sonido={c.id} data-sonido-clave={c.clave} data-silenciado={apagado ? '1' : '0'} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 14, border: `1px solid ${apagado ? 'rgba(163,58,42,.4)' : 'rgba(28,34,48,.1)'}`, background: apagado ? 'rgba(163,58,42,.05)' : '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ font: `${k === 0 ? 700 : 600} 13px 'Geist'`, textDecoration: apagado ? 'line-through' : 'none', opacity: apagado ? 0.6 : 1 }}>
                      {nombreDe(c.id)}
                      {c.tipo === 'sint' ? ' · hecho por código' : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {apagado && <b data-estado-silenciado style={{ font: "700 11px 'Geist Mono',monospace", color: '#A33A2A', letterSpacing: '.08em' }}>SILENCIADO</b>}
                      <button type="button" data-silenciar={c.clave} aria-pressed={apagado} onClick={() => alternarSilencio(c.clave)} disabled={!visorListo} style={{ ...botonPeq, background: apagado ? '#A33A2A' : '#FFFFFF', color: apagado ? '#FFFFFF' : OSCURO, border: `1.5px solid ${apagado ? '#A33A2A' : 'rgba(28,34,48,.2)'}` }}>
                        {apagado ? 'Activar' : 'Silenciar'}
                      </button>
                    </span>
                  </div>
                  {letras.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', opacity: apagado ? 0.45 : 1 }}>
                      {letras.map((l) => {
                        const on = !apagado && versionDe(c.id) === l
                        return (
                          <button key={l} type="button" data-candidato={`${c.id}:${l}`} aria-pressed={on} onClick={() => elegirCandidato(c.id, l)} disabled={!visorListo} style={{ flex: '1 1 100px', minWidth: 100, height: 54, borderRadius: 14, background: on ? OSCURO : '#FFFFFF', color: on ? '#FFFDF8' : OSCURO, border: `1.5px solid ${on ? OSCURO : 'rgba(28,34,48,.18)'}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', font: "700 13.5px 'Geist'", whiteSpace: 'nowrap', cursor: 'pointer' }}>
                            <span style={{ width: 28, height: 28, borderRadius: '50%', background: on ? '#F3D88F' : OSCURO, color: on ? OSCURO : '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Triangulo t={11} />
                            </span>
                            Sonido {l}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ font: "600 12.5px 'Geist'", width: 62 }}>Volumen</span>
                    <input type="range" data-volumen-candidato={c.claveVolumen} min={0} max={2} step={0.05} value={v} aria-label={`Volumen de ${nombreDe(c.id)}`} style={{ flex: 1, minHeight: 44, accentColor: ORO }} onChange={(e) => ponerVolumen(c.claveVolumen, Number(e.target.value))} onPointerUp={() => void ver(anim.id)} onKeyUp={() => void ver(anim.id)} />
                    <b data-volumen-candidato-valor={c.claveVolumen} style={{ font: "700 12.5px 'Geist'", width: 52, textAlign: 'right' }}>{Math.round(v * 100)} %</b>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Los sonidos de Eric: capas que se suman. */}
          <div data-probar-propio style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4, borderTop: '1px solid rgba(28,34,48,.08)' }}>
            <input ref={entrada} type="file" data-archivo-propio accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden onChange={(e) => void alElegirArchivo(e.target.files?.[0])} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 12 }}>
              <span style={etiqueta}>MIS SONIDOS (se suman a los de Code)</span>
            </div>
            {susCapas.map((c, k) => {
              const arranque = arranqueDelPropio(c, golpe)
              return (
                <div key={c.id} data-propio-activo data-capa={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${ORO}`, background: '#FFFBF0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span data-nombre-propio style={{ font: "600 13px 'Geist'", overflowWrap: 'anywhere' }}>Tu sonido {k + 1}: {c.nombre}</span>
                    <button type="button" data-quitar-propio onClick={() => quitarCapa(c.id)} style={botonPeq}>Quitar</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ font: "600 12.5px 'Geist'" }}>Empieza…</span>
                    {(['principio', 'golpe'] as Empieza[]).map((e) => (
                      <button key={e} type="button" data-empieza={e} aria-pressed={c.empieza === e} onClick={() => { ponerCapa(c.id, { empieza: e }); void ver(anim.id, { capas: susCapas.map((x) => (x.id === c.id ? { ...x, empieza: e } : x)) }) }} style={{ ...botonPeq, background: c.empieza === e ? OSCURO : '#FFFFFF', color: c.empieza === e ? '#F3D88F' : OSCURO }}>
                        {e === 'principio' ? 'Al empezar la animación' : 'En el golpe'}
                      </button>
                    ))}
                  </div>
                  <span data-significado style={{ font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
                    {c.empieza === 'principio' ? '0 ms es el primer fotograma de la animación.' : `0 ms es el golpe (a los ${coma(golpe, 1)} s).`} Tu sonido arranca a los {coma(arranque, 2)} s y dura {coma(c.buffer.duration)} s.
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', font: "600 12.5px 'Geist'" }}>
                      <span>Adelantar ‹</span>
                      <span data-ms-valor style={{ color: '#8A6A2C' }}>{conSigno(c.ms)}</span>
                      <span>› Atrasar</span>
                    </span>
                    <input type="range" data-ms min={-limite} max={limite} step={10} value={c.ms} aria-label="Adelantar o atrasar tu sonido, en milisegundos" style={{ width: '100%', minHeight: 44, accentColor: ORO }} onChange={(e) => ponerCapa(c.id, { ms: Number(e.target.value) })} onPointerUp={() => void ver(anim.id)} onKeyUp={() => void ver(anim.id)} />
                    <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" data-ms-menos100 style={botonPeq} onClick={() => ponerCapa(c.id, { ms: Math.max(-limite, c.ms - 100) })}>−100</button>
                      <button type="button" data-ms-menos style={botonPeq} onClick={() => ponerCapa(c.id, { ms: Math.max(-limite, c.ms - 10) })}>−10</button>
                      <button type="button" data-ms-cero style={botonPeq} onClick={() => ponerCapa(c.id, { ms: 0 })}>0</button>
                      <button type="button" data-ms-mas style={botonPeq} onClick={() => ponerCapa(c.id, { ms: Math.min(limite, c.ms + 10) })}>+10</button>
                      <button type="button" data-ms-mas100 style={botonPeq} onClick={() => ponerCapa(c.id, { ms: Math.min(limite, c.ms + 100) })}>+100</button>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ font: "600 12.5px 'Geist'", width: 62 }}>Volumen</span>
                    <input type="range" data-vol-propio min={0} max={2} step={0.05} value={c.vol} aria-label="Volumen de tu sonido" style={{ flex: 1, minHeight: 44, accentColor: ORO }} onChange={(e) => ponerCapa(c.id, { vol: Number(e.target.value) })} onPointerUp={() => void ver(anim.id)} onKeyUp={() => void ver(anim.id)} />
                    <b data-vol-propio-valor style={{ font: "700 12.5px 'Geist'", width: 52, textAlign: 'right' }}>{Math.round(c.vol * 100)} %</b>
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {susCapas.length === 0 ? (
                <button type="button" data-boton-probar-propio onClick={() => entrada.current?.click()} disabled={!visorListo} style={{ ...boton, alignSelf: 'flex-start', height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 20h14" /></svg>
                  Probar con mi sonido
                </button>
              ) : (
                <button type="button" data-anadir-otro onClick={() => entrada.current?.click()} disabled={!visorListo} style={{ ...boton, alignSelf: 'flex-start', height: 44, padding: '0 20px' }}>
                  + Añadir otro sonido mío
                </button>
              )}
            </div>
            <span style={{ font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>El archivo no se sube a ningún sitio: se queda en este navegador, solo para probar.</span>
            {errorArchivo && <span role="alert" data-error-archivo style={{ font: "500 13px 'Geist'", color: '#A33A2A' }}>{errorArchivo}</span>}
            {espera > 0 && (
              <span data-aviso-espera style={{ font: "500 12px/1.4 'Geist'", color: '#8E6820' }}>
                Tu sonido empieza antes que la animación: la animación espera {Math.round(espera * 1000)} ms para que se oiga entero (no se recorta nada).
              </span>
            )}
          </div>

          <LineaDeTiempo filas={filas} dura={dura} golpe={golpe} />
        </div>
      </div>

      {/* Las tarjetas cerradas, por grupos. */}
      {(['Medallas', 'Logros', 'Escenas', 'Resúmenes', 'Apertura', 'Sonidos cortos'] as const).map((g) => (
        <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={etiqueta}>{g.toUpperCase()}</span>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${movil ? 2 : 4},minmax(0,1fr))`, gap: 14 }}>
            {ANIMACIONES.filter((a) => a.grupo === g).map((a) => {
              const d = duracionDe(a)
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
