import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Place } from '../../lib/types'
import { searchPlaces } from '../../lib/mapboxGeocoding'
import {
  emailDeMiCuenta,
  lugarDeDestino,
  pedirAvisoDeDestino,
  sinTildes,
  TEXTO_NO_GUARDADO,
  useDestinosCurados,
  type DestinoCurado,
} from '../../lib/destinosCurados'
import { LogoPequeno } from '../ui/LogoJutrip'
import { botonChampan } from '../../lib/marcaBoton'
import { cityCode, countryOf } from './cityCode'
import { aPantalla, cargarTierraDelMapa, curvaEntre, encuadrar, proyectar, type Camara } from './mapaMundo'

/**
 * LA PRIMERA PANTALLA (Tanda 10, `Piezas/Primera Pantalla` de Design, estados A a G): el mapa del mundo con los pines de NUESTROS destinos (solo los curados de verdad, de los datos),
 * ORIGEN (cualquier ciudad, con el buscador de siempre) y DESTINO (solo los nuestros: los pines o escribiendo). Si se escribe uno que no tenemos, «Aún no tenemos Tokio. ¿Te avisamos
 * cuando llegue?» con el email y [Avísame]. Con origen y destino, la curva con el avión y [Trazar ruta]. El mapa se arrastra y se acerca con los dedos o la rueda.
 * La silueta de la tierra va dentro de la app (`tierra110.json`): para dibujar el mapa no se pide nada a internet.
 */

const CREMA = '#F6EFE0'
const TARJETA = '#FFFDF8'
const TINTA = '#1C2230'
const ORO_CLARO = '#D8B98E'
/** Tanda 10E: el oro oscuro #A67C52 solo en títulos grandes, bordes y rellenos sin letra pequeña; la letra pequeña va en el oro profundo. */
const ORO_OSCURO = '#A67C52'
const ORO_TEXTO = '#6F4E37'
const MAR = '#BCD8EC'
const PIN = '#E8953A'
const MONO = "'Geist Mono',monospace"
const SERIF = "'Instrument Serif',serif"
/** La Europa del principio: el centro del mapa antes de elegir nada (más cerca de Europa, a petición de Eric). */
const EUROPA = proyectar(-8, 33)

export interface InicialPrimeraPantalla {
  focus?: 'o' | 'd' | null
  dq?: string
  oq?: string
}

interface Props {
  origin: Place | null
  destination: Place | null
  onOrigin: (place: Place | null) => void
  onDestination: (place: Place | null) => void
  onNext: () => void
  /** El ancho y el alto de la pantalla (el móvil entero, o el marco de 390 x 844 en el ordenador). */
  ancho: number
  alto: number
  /** Cuántos pasos tiene el formulario (para la barra de arriba). */
  totalPasos: number
  /** «Volver a mi viaje» (solo si se tenía un viaje abierto). */
  onVolverAMiViaje?: (() => void) | null
  /** Solo las pruebas y las capturas: el estado con el que arranca (el campo enfocado y lo escrito). */
  inicial?: InicialPrimeraPantalla
}

const reducirMovimiento = (): boolean => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

export function PrimeraPantalla({ origin, destination, onOrigin, onDestination, onNext, ancho, alto, totalPasos, onVolverAMiViaje, inicial }: Props) {
  const destinos = useDestinosCurados()
  const lista = useMemo<DestinoCurado[]>(() => destinos ?? [], [destinos])
  const [tierra, setTierra] = useState('')
  const [foco, setFoco] = useState<'o' | 'd' | null>(inicial?.focus ?? null)
  const [oq, setOq] = useState(inicial?.oq ?? '')
  const [dq, setDq] = useState(inicial?.dq ?? '')
  const [resultados, setResultados] = useState<Place[]>([])
  const [buscando, setBuscando] = useState(false)
  const [email, setEmail] = useState('')
  const [aviso, setAviso] = useState<{ destino: string; estado: 'enviando' | 'hecho' | 'error'; texto?: string } | null>(null)
  const [tocado, setTocado] = useState(false)
  const [, setCuadro] = useState(0)
  const reducir = useMemo(reducirMovimiento, [])

  // --- el mapa: la cámara y los gestos ---
  const cam = useRef<Camara>({ cx: EUROPA[0], cy: EUROPA[1], span: 900 })
  const usuario = useRef<Camara | null>(null)
  const cerca = useRef(false)
  const t0 = useRef(typeof performance !== 'undefined' ? performance.now() : 0)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const punteros = useRef(new Map<number, [number, number]>())
  const movido = useRef(0)
  const pinza0 = useRef(0)
  const lienzo = useRef<HTMLDivElement>(null)
  const origenRef = useRef<HTMLInputElement>(null)
  const destinoRef = useRef<HTMLInputElement>(null)
  const alto600 = Math.round(alto * 0.71)
  const anclaY = Math.round(alto * 0.355)

  useEffect(() => {
    let vivo = true
    void cargarTierraDelMapa().then((d) => vivo && setTierra(d))
    void emailDeMiCuenta().then((e) => vivo && e && setEmail((actual) => actual || e))
    return () => {
      vivo = false
    }
  }, [])

  const xyO = origin ? proyectar(origin.coordinates.lng, origin.coordinates.lat) : null
  const xyD = destination ? proyectar(destination.coordinates.lng, destination.coordinates.lat) : null

  const objetivo = useCallback((): Camara => {
    if (usuario.current) return usuario.current
    if (xyO && xyD) {
      const f = encuadrar(xyO, xyD, ancho, alto)
      if (cerca.current && f.span > 500) return { cx: xyD[0] - 60, cy: xyD[1] + 10, span: 420 }
      return f
    }
    if (xyD) return { cx: xyD[0], cy: xyD[1] - 10, span: 210 }
    return { cx: EUROPA[0], cy: EUROPA[1], span: 760 }
  }, [xyO, xyD, ancho, alto])

  // Al cambiar origen o destino, se suelta lo que el viajero había arrastrado y la cámara va hacia el encuadre nuevo; con los dos puestos y lejos, a los 3,6 s se acerca al destino.
  const claveDeLugares = `${origin?.coordinates.lat},${origin?.coordinates.lng}|${destination?.coordinates.lat},${destination?.coordinates.lng}`
  useEffect(() => {
    usuario.current = null
    cerca.current = false
    t0.current = performance.now()
    if (temporizador.current) clearTimeout(temporizador.current)
    if (xyO && xyD && encuadrar(xyO, xyD, ancho, alto).span > 500) {
      temporizador.current = setTimeout(() => {
        cerca.current = true
        setCuadro((n) => n + 1)
      }, 3600)
    }
    if (reducir) {
      cam.current = { ...objetivo() }
      setCuadro((n) => n + 1)
    }
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveDeLugares])

  const hayCurva = Boolean(xyO && xyD)
  useEffect(() => {
    let raf = 0
    const bucle = () => {
      const c = cam.current
      const t = objetivo()
      const dx = t.cx - c.cx
      const dy = t.cy - c.cy
      const ds = t.span - c.span
      const moviendo = Math.abs(dx) + Math.abs(dy) + Math.abs(ds) > 0.3
      if (moviendo) {
        const k = reducir ? 1 : 0.07
        c.cx += dx * k
        c.cy += dy * k
        c.span += ds * k
      }
      if (moviendo || (hayCurva && !reducir)) setCuadro((n) => (n + 1) % 1_000_000)
      raf = requestAnimationFrame(bucle)
    }
    raf = requestAnimationFrame(bucle)
    return () => cancelAnimationFrame(raf)
  }, [objetivo, hayCurva, reducir])

  const zoom = useCallback((f: number) => {
    const c = cam.current
    c.span = Math.max(70, Math.min(2600, c.span * f))
    usuario.current = { ...c }
    setTocado(true)
    setCuadro((n) => n + 1)
  }, [])

  // La rueda (sin la página moviéndose) y los dedos.
  useEffect(() => {
    const el = lienzo.current
    if (!el) return undefined
    const rueda = (e: WheelEvent) => {
      e.preventDefault()
      zoom(e.deltaY > 0 ? 1.12 : 0.89)
    }
    el.addEventListener('wheel', rueda, { passive: false })
    return () => el.removeEventListener('wheel', rueda)
  }, [zoom])

  const pinza = () => {
    const v = [...punteros.current.values()]
    return v.length === 2 ? Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) : 0
  }
  const alBajar = (e: React.PointerEvent) => {
    punteros.current.set(e.pointerId, [e.clientX, e.clientY])
    movido.current = 0
    pinza0.current = pinza()
  }
  useEffect(() => {
    const mover = (e: PointerEvent) => {
      const o = punteros.current.get(e.pointerId)
      if (!o) return
      const c = cam.current
      const dx = e.clientX - o[0]
      const dy = e.clientY - o[1]
      punteros.current.set(e.pointerId, [e.clientX, e.clientY])
      movido.current += Math.abs(dx) + Math.abs(dy)
      if (movido.current < 5) return
      // (En el ordenador el marco va con `zoom` de CSS: lo que se arrastra en pantalla se corrige con la escala real del marco.)
      const escala = lienzo.current ? lienzo.current.getBoundingClientRect().width / ancho || 1 : 1
      const k = ancho / c.span
      if (punteros.current.size === 1) {
        c.cx -= dx / escala / k
        c.cy -= dy / escala / k
      } else {
        const d = pinza()
        if (pinza0.current && d) c.span = Math.max(70, Math.min(2600, (c.span * pinza0.current) / d))
        pinza0.current = d
      }
      usuario.current = { ...c }
      setTocado(true)
      setCuadro((n) => n + 1)
    }
    const soltar = (e: PointerEvent) => {
      punteros.current.delete(e.pointerId)
      pinza0.current = pinza()
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [ancho])

  // --- el buscador del origen (cualquier ciudad, como siempre) ---
  useEffect(() => {
    const texto = oq.trim()
    if (foco !== 'o' || texto.length < 2) {
      setResultados([])
      setBuscando(false)
      return undefined
    }
    const control = new AbortController()
    setBuscando(true)
    const espera = setTimeout(() => {
      searchPlaces(texto, control.signal)
        .then((lugares) => {
          setResultados(lugares.slice(0, 5))
          setBuscando(false)
        })
        .catch(() => setBuscando(false))
    }, 250)
    return () => {
      clearTimeout(espera)
      control.abort()
    }
  }, [oq, foco])

  // --- el destino: solo los nuestros ---
  const q = sinTildes(dq)
  const coinciden = useMemo(() => lista.filter((d) => !q || sinTildes(d.nombre).includes(q)), [lista, q])
  const noHay = foco === 'd' && q.length > 0 && destinos !== null && coinciden.length === 0
  const elegirDestino = (d: DestinoCurado) => {
    onDestination(lugarDeDestino(d))
    setDq('')
    setFoco(null)
    destinoRef.current?.blur()
  }
  const elegirOrigen = (lugar: Place) => {
    onOrigin(lugar)
    setOq('')
    if (!destination) setFoco('d')
    else setFoco(null)
    if (!destination) setTimeout(() => destinoRef.current?.focus(), 30)
  }

  const escribioDestino = dq.trim()
  const avisoDeEste = aviso && sinTildes(aviso.destino) === q ? aviso : null
  const mandarAviso = async () => {
    const destino = dq.trim()
    if (!destino || avisoDeEste?.estado === 'enviando') return
    setAviso({ destino, estado: 'enviando' })
    const error = await pedirAvisoDeDestino(destino, email.trim())
    setAviso(error ? { destino, estado: 'error', texto: error } : { destino, estado: 'hecho' })
  }

  // --- el dibujo ---
  const c = cam.current
  const k = ancho / c.span
  const listo = Boolean(origin && destination)
  const curva = xyO && xyD ? curvaEntre(xyO, xyD) : null
  const pO = xyO ? aPantalla(xyO, c, ancho, anclaY) : null
  const pD = xyD ? aPantalla(xyD, c, ancho, anclaY) : null
  const pC = curva ? aPantalla(curva.c, c, ancho, anclaY) : null
  let avion: { x: number; y: number; ang: number } | null = null
  if (pO && pD && pC) {
    const tt = reducir ? 1 : Math.min(1, ((performance.now() - t0.current) % 5600) / 3000)
    const e = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2
    const bx = (1 - e) * (1 - e) * pO[0] + 2 * (1 - e) * e * pC[0] + e * e * pD[0]
    const by = (1 - e) * (1 - e) * pO[1] + 2 * (1 - e) * e * pC[1] + e * e * pD[1]
    const tx = 2 * (1 - e) * (pC[0] - pO[0]) + 2 * e * (pD[0] - pC[0])
    const ty = 2 * (1 - e) * (pC[1] - pO[1]) + 2 * e * (pD[1] - pC[1])
    avion = { x: bx, y: by, ang: (Math.atan2(ty, tx) * 180) / Math.PI + 90 }
  }

  const bordeO = foco === 'o' ? ORO_OSCURO : 'rgba(166,124,82,.24)'
  const bordeD = foco === 'd' ? ORO_OSCURO : 'rgba(166,124,82,.24)'
  const sugerenciasO = foco === 'o' && oq.trim().length >= 2

  return (
    <div data-primera-pantalla style={{ position: 'absolute', inset: 0, background: CREMA, color: TINTA, overflow: 'hidden', fontFamily: "'Geist',system-ui,sans-serif" }}>
      <div
        ref={lienzo}
        data-mapa-primera
        onPointerDown={alBajar}
        style={{ position: 'absolute', left: 0, top: 0, width: ancho, height: alto600, touchAction: 'none', cursor: 'grab', background: MAR }}
      >
        <svg width={ancho} height={alto600} viewBox={`0 0 ${ancho} ${alto600}`} style={{ display: 'block' }} role="img" aria-label="Mapa del mundo con nuestros destinos">
          {tierra && <path d={tierra} fill="#FBF3E2" stroke="rgba(166,124,82,.4)" strokeWidth={0.8} vectorEffect="non-scaling-stroke" transform={`translate(${ancho / 2} ${anclaY}) scale(${k}) translate(${-c.cx} ${-c.cy})`} />}
          {pO && pD && pC && (
            <>
              <path d={`M${pO[0]} ${pO[1]}Q${pC[0]} ${pC[1]} ${pD[0]} ${pD[1]}`} fill="none" stroke={ORO_CLARO} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" opacity={0.9} data-curva />
              <circle cx={pO[0]} cy={pO[1]} r={7} fill={CREMA} stroke={TINTA} strokeWidth={2.5} />
              {avion && <path d="M0 -10L3 -3L11 2L11 4L3 2L2 7L5 9L5 10L0 9L-5 10L-5 9L-2 7L-3 2L-11 4L-11 2L-3 -3Z" fill={TINTA} transform={`translate(${avion.x} ${avion.y}) rotate(${avion.ang}) scale(1.05)`} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }} data-avion />}
            </>
          )}
          {pO && !pD && <circle cx={pO[0]} cy={pO[1]} r={6} fill={CREMA} stroke={TINTA} strokeWidth={2.5} />}
          {lista.map((d) => {
            const p = aPantalla(proyectar(d.lng, d.lat), c, ancho, anclaY)
            if (p[0] < -30 || p[0] > ancho + 30 || p[1] < -30 || p[1] > alto600 + 30) return null
            const sel = destination?.name === d.nombre
            const atenuado = Boolean(destination) && !sel
            return (
              <g
                key={d.clave}
                data-pin={d.nombre}
                transform={`translate(${p[0]} ${p[1]})`}
                style={{ cursor: 'pointer', opacity: atenuado ? 0.42 : 1, transition: 'opacity .5s' }}
                onClick={() => {
                  if (movido.current > 6) return
                  elegirDestino(d)
                }}
              >
                <circle r={24} fill="transparent" />
                <circle r={sel ? 9 : 6} fill={PIN} opacity={sel ? 0.4 : 0.3}>
                  {!reducir && <animate attributeName="r" values={sel ? '9;17;9' : '6;12;6'} dur={sel ? '2.2s' : '3.4s'} repeatCount="indefinite" />}
                  {!reducir && <animate attributeName="opacity" values={sel ? '.5;0;.5' : '.35;0;.35'} dur={sel ? '2.2s' : '3.4s'} repeatCount="indefinite" />}
                </circle>
                <circle r={sel ? 6 : 4.4} fill={sel ? '#F28A1E' : PIN} stroke={TARJETA} strokeWidth={sel ? 2 : 1.6} style={{ filter: 'drop-shadow(0 1px 2px rgba(110,60,10,.45))' }} />
                <text x={sel ? 12 : 9} y={4} fill={sel ? '#7A3F0E' : 'rgba(28,34,48,.78)'} fontSize={sel ? 12.5 : 10} fontWeight={sel ? 600 : 500} style={{ fontFamily: 'Geist,sans-serif', paintOrder: 'stroke', stroke: 'rgba(255,255,255,.75)', strokeWidth: 3 }}>
                  {d.nombre}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {!tocado && !foco && <div style={{ position: 'absolute', left: '50%', top: Math.round(alto * 0.5), transform: 'translateX(-50%)', font: "500 11px 'Geist'", letterSpacing: '.04em', color: 'rgba(28,34,48,.6)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>Arrastra y haz zoom</div>}

      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: 'linear-gradient(180deg,#FFFFFF 0%,#FFFFFF 16%,#BCD8EC 72%,rgba(188,216,236,0) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: Math.round(alto * 0.5), height: Math.round(alto * 0.24), background: `linear-gradient(180deg,rgba(246,239,224,0),${CREMA} 85%)`, pointerEvents: 'none' }} />

      <span style={{ position: 'absolute', left: 22, top: 'max(30px, calc(env(safe-area-inset-top) + 14px))', zIndex: 3, display: 'flex', alignItems: 'center' }}>
        <LogoPequeno />
      </span>
      {onVolverAMiViaje && (
        <button
          type="button"
          onClick={onVolverAMiViaje}
          style={{ position: 'absolute', right: 20, top: 'max(26px, calc(env(safe-area-inset-top) + 10px))', zIndex: 4, height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(28,34,48,.14)', background: 'rgba(255,253,248,.9)', color: TINTA, font: '600 13px Geist, sans-serif', cursor: 'pointer' }}
        >
          Volver a mi viaje
        </button>
      )}
      <div style={{ position: 'absolute', left: 22, right: 22, top: 'max(84px, calc(env(safe-area-inset-top) + 68px))', display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 10px ${MONO}`, letterSpacing: '.14em', color: 'rgba(28,34,48,.68)' }}>
          <span>01 — RUTA</span>
          <span>1/{totalPasos}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: totalPasos }, (_, i) => (
            <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === 0 ? ORO_CLARO : 'rgba(28,34,48,.16)' }} />
          ))}
        </div>
        <h1 style={{ margin: '6px 0 0', font: `400 38px/1.02 ${SERIF}`, textWrap: 'balance', letterSpacing: 0 }}>
          ¿De dónde sales y <em style={{ color: ORO_TEXTO }}>a dónde vas?</em>
        </h1>
      </div>

      {noHay && (
        <div data-aviso-destino style={{ position: 'absolute', left: 18, right: 18, bottom: 296, padding: 16, borderRadius: 20, background: 'rgba(255,253,248,.96)', border: '1px solid #E4D2A4', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {avisoDeEste?.estado === 'hecho' ? (
            <span data-aviso-hecho style={{ font: `400 22px/1.1 ${SERIF}` }}>
              ¡Hecho! Te escribimos en cuanto llegue <em style={{ color: ORO_OSCURO }}>{escribioDestino}</em>.
            </span>
          ) : (
            <>
              <span style={{ font: `400 22px/1.1 ${SERIF}` }}>
                Aún no tenemos <em style={{ color: ORO_OSCURO }}>{escribioDestino}</em>.
              </span>
              <span style={{ font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.72)' }}>¿Te avisamos cuando llegue?</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void mandarAviso()}
                  placeholder="tu@email.com"
                  aria-label="Tu email"
                  data-aviso-email
                  style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 12, border: '1px solid rgba(166,124,82,.35)', background: TARJETA, padding: '0 12px', color: TINTA, font: "400 14px 'Geist'", outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => void mandarAviso()}
                  disabled={avisoDeEste?.estado === 'enviando'}
                  data-avisame
                  style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 0, ...botonChampan(), font: "600 14px 'Geist'", cursor: 'pointer', opacity: avisoDeEste?.estado === 'enviando' ? 0.6 : 1 }}
                >
                  Avísame
                </button>
              </div>
              {avisoDeEste?.estado === 'error' && (
                <span role="alert" data-aviso-error style={{ font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
                  {avisoDeEste.texto ?? TEXTO_NO_GUARDADO}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {sugerenciasO && (
        <div data-sugerencias-origen style={{ position: 'absolute', left: 18, right: 18, bottom: 296, borderRadius: 18, background: 'rgba(255,253,248,.95)', border: '1px solid #E4D2A4', overflow: 'hidden', maxHeight: '38%', overflowY: 'auto' }}>
          {resultados.map((lugar) => (
            <div
              key={`${lugar.fullName}-${lugar.coordinates.lat}`}
              data-origen-opcion={lugar.name}
              onPointerDown={(e) => {
                e.preventDefault()
                elegirOrigen(lugar)
              }}
              style={{ minHeight: 46, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(28,34,48,.07)', font: "500 15px 'Geist'", cursor: 'pointer' }}
            >
              <span style={{ font: `500 12px ${MONO}`, letterSpacing: '.06em', color: ORO_TEXTO, width: 34 }}>{cityCode(lugar)}</span>
              <span style={{ flex: 1 }}>{lugar.name}</span>
              {lugar.countryCode ? (
                <span role="img" aria-label={countryOf(lugar)} title={countryOf(lugar)} className={`fi fi-${lugar.countryCode.toLowerCase()}`} style={{ width: 28, height: 20, flex: 'none', borderRadius: 4, backgroundSize: 'cover', boxShadow: '0 0 0 1px rgba(28,34,48,.1)' }} />
              ) : (
                <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.62)' }}>{countryOf(lugar)}</span>
              )}
            </div>
          ))}
          {!buscando && resultados.length === 0 && <div style={{ padding: '14px 16px', font: "400 14px 'Geist'", color: 'rgba(28,34,48,.7)' }}>No encontramos esa ciudad todavía.</div>}
          {buscando && resultados.length === 0 && <div style={{ padding: '14px 16px', font: "400 14px 'Geist'", color: 'rgba(28,34,48,.7)' }}>Buscando…</div>}
        </div>
      )}

      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 'max(26px, env(safe-area-inset-bottom))', padding: 14, borderRadius: 28, background: 'linear-gradient(180deg,rgba(255,253,248,.96),rgba(251,243,226,.94))', border: '1px solid #E4D2A4', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 20px 40px -16px rgba(111,78,55,.4),inset 0 1px 0 rgba(255,255,255,.8)' }}>
        {/* (Tanda 10C: las fotos de los destinos curados van pegadas a la tarjeta de ORIGEN, 8 px por encima, no a una altura fija.) */}
        {foco === 'd' && coinciden.length > 0 && (
          <div className="trazo-noscroll" data-destinos-fila style={{ position: 'absolute', left: -14, right: -14, bottom: '100%', marginBottom: 8, padding: '0 18px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {coinciden.map((d, i) => (
              <div
                key={d.clave}
                data-destino-card={d.nombre}
                role="button"
                tabIndex={0}
                onClick={() => elegirDestino(d)}
                onKeyDown={(e) => e.key === 'Enter' && elegirDestino(d)}
                style={{ flex: 'none', width: 76, borderRadius: 14, background: 'rgba(255,253,248,.82)', border: `1px solid ${destination?.name === d.nombre ? ORO_CLARO : 'rgba(28,34,48,.14)'}`, overflow: 'hidden', cursor: 'pointer' }}
              >
                <div style={{ height: 54, background: `linear-gradient(150deg,oklch(0.55 0.08 ${(i * 37 + 70) % 360}),oklch(0.28 0.05 ${(i * 37 + 100) % 360}))`, position: 'relative' }}>
                  <span style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 2px,transparent 2px 12px)' }} />
                </div>
                <div style={{ padding: '7px 8px 8px', font: `400 15px/1 ${SERIF}` }}>{d.nombre}</div>
              </div>
            ))}
          </div>
        )}
        <label style={{ height: 62, borderRadius: 18, background: TARJETA, border: `1px solid ${bordeO}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', cursor: 'text' }}>
          <span style={{ width: 14, height: 14, flex: 'none', borderRadius: '50%', border: `2px solid ${ORO_OSCURO}` }} />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ font: `500 9.5px ${MONO}`, letterSpacing: '.14em', color: 'rgba(28,34,48,.66)' }}>ORIGEN</span>
            <input
              ref={origenRef}
              data-campo-origen
              value={foco === 'o' ? oq : (origin?.name ?? oq)}
              onFocus={() => {
                setFoco('o')
                setOq('')
              }}
              onChange={(e) => {
                setOq(e.target.value)
                if (origin) onOrigin(null)
              }}
              placeholder="¿Desde qué ciudad sales?"
              style={{ width: '100%', border: 0, background: 'transparent', color: TINTA, font: "500 17px 'Geist'", padding: 0, outline: 'none' }}
            />
          </span>
        </label>
        <label style={{ height: 62, borderRadius: 18, background: TARJETA, border: `1px solid ${bordeD}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', cursor: 'text' }}>
          <span style={{ width: 14, height: 14, flex: 'none', borderRadius: '50%', background: PIN, boxShadow: `0 0 12px ${PIN}` }} />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ font: `500 9.5px ${MONO}`, letterSpacing: '.14em', color: 'rgba(28,34,48,.66)' }}>DESTINO</span>
            <input
              ref={destinoRef}
              data-campo-destino
              value={foco === 'd' ? dq : (destination?.name ?? dq)}
              onFocus={() => {
                setFoco('d')
                setDq('')
              }}
              onChange={(e) => {
                setDq(e.target.value)
                if (destination) onDestination(null)
                setAviso(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && coinciden.length > 0 && q) elegirDestino(coinciden[0])
              }}
              placeholder="Elige uno de nuestros destinos"
              style={{ width: '100%', border: 0, background: 'transparent', color: TINTA, font: "500 17px 'Geist'", padding: 0, outline: 'none' }}
            />
          </span>
        </label>
        <button
          type="button"
          data-trazar-ruta
          onClick={listo ? onNext : undefined}
          aria-disabled={!listo}
          style={{ height: 54, borderRadius: 18, border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 16px 'Geist'", ...(listo ? botonChampan() : { background: '#F1E8D4', color: 'rgba(28,34,48,.5)' }), cursor: listo ? 'pointer' : 'default' }}
        >
          Trazar ruta
        </button>
      </div>

    </div>
  )
}
