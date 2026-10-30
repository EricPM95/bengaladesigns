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
import { useUnirseUi } from '../../store/useUnirseUi'
import { botonChampan } from '../../lib/marcaBoton'
import { cityCode, countryOf } from './cityCode'
import { aPantalla, cargarTierraDelMapa, curvaEntre, encuadrar, proyectar, type Camara } from './mapaMundo'
import { buscar } from '../../lib/busqueda'

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
const PIN = '#D8B98E'
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
  /** Tanda 10G: 'elegir' (origen y destino) o 'transporte': el mapa se queda, la línea se dibuja y la tarjeta de abajo pasa a ser la distancia y los transportes (`transporte`), sin cambiar de pantalla. */
  fase?: 'elegir' | 'transporte'
  transporte?: React.ReactNode
  /** Cuánto lleva dibujada la línea (0 a 1) y si la carga de los transportes ya acabó (el título pasa de «Conectando…» a «¿Cómo quieres llegar…?»). */
  progreso?: number
  cargado?: boolean
  /** «Cambiar ruta»: vuelve a elegir origen y destino. */
  onCambiar?: () => void
}

const reducirMovimiento = (): boolean => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

export function PrimeraPantalla({ origin, destination, onOrigin, onDestination, onNext, ancho, alto, totalPasos, onVolverAMiViaje, inicial, fase = 'elegir', transporte, progreso = 0, cargado = false, onCambiar }: Props) {
  const enTransporte = fase === 'transporte'
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
      const f = encuadrar(xyO, xyD, ancho, enTransporte ? alto * 0.3 : alto)
      if (cerca.current && f.span > 500) return { cx: xyD[0] - 60, cy: xyD[1] + 10, span: 420 }
      return f
    }
    if (xyD) return { cx: xyD[0], cy: xyD[1] - 10, span: 210 }
    return { cx: EUROPA[0], cy: EUROPA[1], span: 760 }
  }, [xyO, xyD, ancho, alto, enTransporte])

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
  const coinciden = useMemo(() => (q ? buscar(lista, dq, (d) => [d.nombre], { max: 50, minimoDeLetras: 1 }) : lista), [lista, q, dq])
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
    else {
      setFoco(null)
      origenRef.current?.blur()
    }
    if (!destination) setTimeout(() => destinoRef.current?.focus(), 30)
  }

  // (Tanda 10S3) Mientras se escribe en un campo, la tarjeta sube arriba y los resultados salen justo debajo, entre el campo y el teclado; se esconde lo que estorba (logo, «Volver a mi viaje», título, mapa). Al soltar el campo (teclado cerrado) o elegir, todo vuelve.
  const escribiendo = !enTransporte && foco !== null
  const [visible, setVisible] = useState(alto)
  useEffect(() => {
    const medir = () => setVisible(Math.max(200, Math.min(alto, Math.round(window.visualViewport?.height ?? window.innerHeight))))
    medir()
    window.visualViewport?.addEventListener('resize', medir)
    window.addEventListener('resize', medir)
    return () => {
      window.visualViewport?.removeEventListener('resize', medir)
      window.removeEventListener('resize', medir)
    }
  }, [alto])
  const soltarFoco = (cual: 'o' | 'd') => {
    setTimeout(() => setFoco((f) => (f === cual && document.activeElement !== (cual === 'o' ? origenRef.current : destinoRef.current) ? null : f)), 250)
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
        style={{ position: 'absolute', left: 0, top: 0, width: ancho, height: alto600, touchAction: 'none', cursor: 'grab', background: MAR, ...(escribiendo ? { visibility: 'hidden' as const } : null) }}
      >
        <svg width={ancho} height={alto600} viewBox={`0 0 ${ancho} ${alto600}`} style={{ display: 'block' }} role="img" aria-label="Mapa del mundo con nuestros destinos">
          {tierra && <path d={tierra} fill="#FBF3E2" stroke="rgba(166,124,82,.4)" strokeWidth={0.8} vectorEffect="non-scaling-stroke" transform={`translate(${ancho / 2} ${anclaY}) scale(${k}) translate(${-c.cx} ${-c.cy})`} />}
          {pO && pD && pC && (
            <>
              <path d={`M${pO[0]} ${pO[1]}Q${pC[0]} ${pC[1]} ${pD[0]} ${pD[1]}`} fill="none" stroke={ORO_CLARO} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" opacity={enTransporte ? 0.45 : 0.9} data-curva />
              {/* (Tanda 10G) Al trazar la ruta, la línea de origen a destino se dibuja entera, a la vez que se calculan los transportes. */}
              {enTransporte && <path d={`M${pO[0]} ${pO[1]}Q${pC[0]} ${pC[1]} ${pD[0]} ${pD[1]}`} pathLength={1} fill="none" stroke={ORO_OSCURO} strokeWidth={2.6} strokeLinecap="round" strokeDasharray={`${Math.max(0.001, Math.min(1, progreso))} 1`} data-linea-trazada />}
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
                <circle r={sel ? 6 : 4.4} fill={sel ? '#A67C52' : PIN} stroke={TARJETA} strokeWidth={sel ? 2 : 1.6} style={{ filter: 'drop-shadow(0 1px 2px rgba(111,78,55,.45))' }} />
                <text x={sel ? 12 : 9} y={4} fill={sel ? '#7A3F0E' : 'rgba(28,34,48,.78)'} fontSize={sel ? 12.5 : 10} fontWeight={sel ? 600 : 500} style={{ fontFamily: 'Geist,sans-serif', paintOrder: 'stroke', stroke: 'rgba(255,255,255,.75)', strokeWidth: 3 }}>
                  {d.nombre}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {!tocado && !foco && <div style={{ position: 'absolute', left: '50%', top: Math.round(alto * 0.5), transform: 'translateX(-50%)', font: "500 11px 'Geist'", letterSpacing: '.04em', color: 'rgba(28,34,48,.6)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>Arrastra y haz zoom</div>}

      {!escribiendo && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: 'linear-gradient(180deg,#FFFFFF 0%,#FFFFFF 16%,#BCD8EC 72%,rgba(188,216,236,0) 100%)', pointerEvents: 'none' }} />}
      {!escribiendo && <div style={{ position: 'absolute', left: 0, right: 0, top: Math.round(alto * 0.5), height: Math.round(alto * 0.24), background: `linear-gradient(180deg,rgba(246,239,224,0),${CREMA} 85%)`, pointerEvents: 'none' }} />}
      {/* (10S3) Tocar fuera, con el teclado abierto, lo cierra y todo vuelve. */}
      {escribiendo && <div data-fondo-escribir onPointerDown={() => (document.activeElement as HTMLElement | null)?.blur?.()} style={{ position: 'absolute', inset: 0, zIndex: 2 }} />}

      {!escribiendo && (
        <span style={{ position: 'absolute', left: 22, top: 'max(30px, calc(env(safe-area-inset-top) + 14px))', zIndex: 3, display: 'flex', alignItems: 'center' }}>
          <LogoPequeno />
        </span>
      )}
      {enTransporte && onCambiar && (
        <button className="zona-toque"
          type="button"
          onClick={onCambiar}
          data-cambiar-ruta
          style={{ position: 'absolute', right: 20, top: 'max(26px, calc(env(safe-area-inset-top) + 10px))', zIndex: 4, height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(28,34,48,.14)', background: 'rgba(255,253,248,.9)', color: TINTA, font: "600 13px 'Geist'", cursor: 'pointer' }}
        >
          Cambiar ruta
        </button>
      )}
      {onVolverAMiViaje && !enTransporte && !escribiendo && (
        <button className="zona-toque"
          type="button"
          onClick={onVolverAMiViaje}
          style={{ position: 'absolute', right: 20, top: 'max(26px, calc(env(safe-area-inset-top) + 10px))', zIndex: 4, height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(28,34,48,.14)', background: 'rgba(255,253,248,.9)', color: TINTA, font: '600 13px Geist, sans-serif', cursor: 'pointer' }}
        >
          Volver a mi viaje
        </button>
      )}
      <div style={{ position: 'absolute', left: 22, right: 22, top: 'max(84px, calc(env(safe-area-inset-top) + 68px))', display: escribiendo ? 'none' : 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 10px ${MONO}`, letterSpacing: '.14em', color: 'rgba(28,34,48,.68)' }}>
          <span>01 — RUTA</span>
          <span>1/{totalPasos}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: totalPasos }, (_, i) => (
            <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === 0 ? ORO_CLARO : 'rgba(28,34,48,.16)' }} />
          ))}
        </div>
        <h1 data-titulo-paso style={{ margin: '6px 0 0', font: `400 38px/1.02 ${SERIF}`, textWrap: 'balance', letterSpacing: 0 }}>
          {!enTransporte ? (
            <>
              ¿De dónde sales y <em style={{ color: ORO_TEXTO }}>a dónde vas?</em>
            </>
          ) : cargado ? (
            <>
              ¿Cómo quieres llegar a <em style={{ color: ORO_TEXTO }}>{destination?.name ?? ''}</em>?
            </>
          ) : (
            <>
              Conectando <em style={{ color: ORO_TEXTO }}>{origin?.name ?? ''}</em> con <em style={{ color: ORO_TEXTO }}>{destination?.name ?? ''}</em>
            </>
          )}
        </h1>
      </div>

      {/* (10S3) Con un campo en uso: tarjeta arriba y, debajo, sus resultados (en flujo, entre el campo y el teclado). Sin campo en uso, `contents`: nada cambia. */}
      <div
        data-zona-escribir={escribiendo ? '' : undefined}
        style={escribiendo ? { position: 'absolute', left: 14, right: 14, top: 'max(10px, calc(env(safe-area-inset-top) + 6px))', zIndex: 6, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: Math.max(160, visible - 12) } : { display: 'contents' }}
      >
      {noHay && (
        <div data-aviso-destino style={{ order: 2, padding: 16, borderRadius: 20, background: 'rgba(255,253,248,.96)', border: '1px solid #E4D2A4', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
        <div data-sugerencias-origen onMouseDown={(e) => e.preventDefault()} style={{ order: 1, flex: '0 1 auto', minHeight: 0, borderRadius: 18, background: 'rgba(255,253,248,.97)', border: '1px solid #E4D2A4', overflowY: 'auto', boxShadow: '0 14px 30px -14px rgba(111,78,55,.45)' }}>
          {resultados.map((lugar) => {
            const pais = countryOf(lugar)
            return (
              <div
                key={`${lugar.fullName}-${lugar.coordinates.lat}`}
                data-origen-opcion={lugar.name}
                data-origen-pais={pais}
                onPointerDown={(e) => {
                  e.preventDefault()
                  elegirOrigen(lugar)
                }}
                style={{ minHeight: 41, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(28,34,48,.07)', font: "500 15px 'Geist'", cursor: 'pointer' }}
              >
                {lugar.countryCode ? (
                  <span role="img" aria-label={pais} title={pais} className={`fi fi-${lugar.countryCode.toLowerCase()}`} data-origen-bandera style={{ width: 28, height: 20, flex: 'none', borderRadius: 4, backgroundSize: 'cover', boxShadow: '0 0 0 1px rgba(28,34,48,.1)' }} />
                ) : (
                  <span data-origen-bandera style={{ width: 28, height: 20, flex: 'none', borderRadius: 4, background: 'rgba(28,34,48,.08)' }} />
                )}
                <span data-origen-texto style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lugar.name}
                  {pais ? <span style={{ font: "400 14px 'Geist'", color: 'rgba(28,34,48,.7)' }}>, {pais}</span> : null}
                </span>
                <span style={{ font: `500 11px ${MONO}`, letterSpacing: '.06em', color: ORO_TEXTO, flex: 'none' }}>{cityCode(lugar)}</span>
              </div>
            )
          })}
          {!buscando && resultados.length === 0 && <div style={{ padding: '14px 16px', font: "400 14px 'Geist'", color: 'rgba(28,34,48,.7)' }}>No encontramos esa ciudad todavía.</div>}
          {buscando && resultados.length === 0 && <div style={{ padding: '14px 16px', font: "400 14px 'Geist'", color: 'rgba(28,34,48,.7)' }}>Buscando…</div>}
        </div>
      )}

      <div data-tarjeta-origen-destino style={{ ...(escribiendo ? { order: 0, position: 'relative' as const, flex: 'none' } : { position: 'absolute' as const, left: 14, right: 14, bottom: enTransporte ? 'max(26px, env(safe-area-inset-bottom))' : 'max(66px, calc(env(safe-area-inset-bottom) + 40px))' }), padding: escribiendo ? 8 : 14, borderRadius: escribiendo ? 24 : 28, background: 'linear-gradient(180deg,rgba(255,253,248,.96),rgba(251,243,226,.94))', border: '1px solid #E4D2A4', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', flexDirection: 'column', gap: escribiendo ? 6 : 10, boxShadow: '0 20px 40px -16px rgba(111,78,55,.4),inset 0 1px 0 rgba(255,255,255,.8)' }}>
        {enTransporte ? (
          transporte
        ) : (
          <>
        {/* (Tanda 10C: las fotos de los destinos curados van pegadas a la tarjeta de ORIGEN, 8 px por encima, no a una altura fija.) */}
        {foco === 'd' && coinciden.length > 0 && (
          <div className="trazo-noscroll" data-destinos-fila onMouseDown={(e) => e.preventDefault()} style={{ order: 5, margin: '0 -8px', padding: '0 8px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
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
                {/* (Tanda 10G: la tarjeta lleva la foto de portada del destino, de sus datos —en Roma, el Coliseo—; sin ella, las rayas de siempre.) */}
                <div data-destino-foto={d.portada_pequena ?? undefined} style={{ height: 54, background: d.portada_pequena ? `center / cover no-repeat url(${d.portada_pequena}), #E9DFC8` : `linear-gradient(150deg,oklch(0.55 0.08 ${(i * 37 + 70) % 360}),oklch(0.28 0.05 ${(i * 37 + 100) % 360}))`, position: 'relative' }}>
                  {!d.portada_pequena && <span style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 2px,transparent 2px 12px)' }} />}
                </div>
                <div style={{ padding: '7px 8px 8px', font: `400 15px/1 ${SERIF}` }}>{d.nombre}</div>
              </div>
            ))}
          </div>
        )}
        <label style={{ height: escribiendo ? 54 : 62, borderRadius: 18, background: TARJETA, border: `1px solid ${bordeO}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', cursor: 'text' }}>
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
              onBlur={() => soltarFoco('o')}
              onChange={(e) => {
                setOq(e.target.value)
                if (origin) onOrigin(null)
              }}
              placeholder="¿Desde qué ciudad sales?"
              style={{ width: '100%', border: 0, background: 'transparent', color: TINTA, font: "500 17px 'Geist'", padding: 0, outline: 'none' }}
            />
          </span>
        </label>
        <label style={{ height: escribiendo ? 54 : 62, borderRadius: 18, background: TARJETA, border: `1px solid ${bordeD}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', cursor: 'text' }}>
          <span style={{ width: 14, height: 14, flex: 'none', borderRadius: '50%', background: ORO_OSCURO, boxShadow: '0 0 12px rgba(166,124,82,.55)' }} />
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
              onBlur={() => soltarFoco('d')}
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
          style={{ height: 54, borderRadius: 18, border: 0, display: escribiendo ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', font: "600 16px 'Geist'", ...(listo ? botonChampan() : { background: '#F1E8D4', color: 'rgba(28,34,48,.5)' }), cursor: listo ? 'pointer' : 'default' }}
        >
          Trazar ruta
        </button>
          </>
        )}
      </div>
      </div>

      {/* (Tanda 10N5, `Piezas/Unirse Codigo` 04) Debajo de la caja, en pequeño y siempre visible: donde llega el amigo que abre la app por primera vez con un código. */}
      {!enTransporte && !escribiendo && (
        <button className="zona-toque"
          type="button"
          data-unirme-con-codigo
          onClick={() => useUnirseUi.getState().abrir()}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 'max(26px, env(safe-area-inset-bottom))', margin: '0 auto', width: 'fit-content', minHeight: 36, display: 'flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', padding: 0, font: "500 13.5px 'Geist'", color: TINTA, textShadow: '0 1px 0 rgba(255,255,255,.6)', cursor: 'pointer' }}
        >
          ¿Te han invitado? <u style={{ fontWeight: 700, color: '#6E5018', textUnderlineOffset: 3 }}>Únete con un código</u>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

    </div>
  )
}
