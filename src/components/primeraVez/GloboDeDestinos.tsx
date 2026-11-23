import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as PE, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { porContinente, usePrimeraVezUi, type DestinoDelMapa } from '../../lib/primeraVez'
import type { EstadoDeDestino } from '../../lib/bolaDelMundo'
import { enLaCara, etiquetasVisibles, pinMasCercano, prioridadDeDestino, type PuntoDeEtiqueta } from '../../lib/etiquetasDelGlobo'
import { FlagIcon } from '../ui/FlagIcon'

/**
 * (V41, Design «Globo Destinos») «¿A DÓNDE TE APETECE IR?» A PANTALLA COMPLETA: un globo de verdad (Mapbox GL en proyección `globe`) con los colores de nuestro mapa, que se gira con un dedo y se acerca con dos, y debajo
 * una hoja que baja (se ve casi todo el globo) y sube (la lista por continentes con su bandera). Los destinos, sus estados y sus banderas son los de la app (los mismos de la bola pequeña del Perfil): nada del ejemplo de Design.
 *
 * MAPBOX COBRA POR CADA CARGA DE MAPA: este componente solo se carga (import perezoso) cuando se abre, el mapa se crea UNA vez al abrirlo y se destruye (`map.remove()`) al cerrar. La vista pequeña del Perfil es SVG:
 * no carga ningún mapa. En desarrollo, `window.__cargasDeMapa` cuenta los mapas creados y `window.__mapasDelGlobo` los que siguen vivos.
 *
 * Consultas a Supabase: NINGUNA (los estados salen de lo que el Perfil ya tiene cargado, `useBola`). El único tráfico es el de los azulejos del mapa de Mapbox, y solo mientras está abierto (una vez por apertura, a un
 * zoom bajo: del orden de 100–300 KB, sin ningún bucle ni petición mientras está quieto).
 */
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

/** Los colores del mapa de Design (mar azul, tierra verde pálido, fronteras malva) y el crema de la app detrás. */
// Un poco más vivos que en Design: el filtro «tono papel» que llevan TODOS los mapas de la app (src/index.css) los apaga un poco (sepia .28, saturación .7), y así quedan como en el diseño.
const MAR = '#5FA3DE'
const TIERRA = '#CFE6A0'
const FRONTERA = '#A89BC0'
const CREMA = '#EFE5CE'

const SERIE = "'Instrument Serif',serif"
const ORO = 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)'
/** Cuánto de la pantalla ocupa la hoja de abajo (la baja deja ver casi todo el globo; la subida, la lista). */
const TOP_BAJA = 0.66
const TOP_SUBE = 0.18

type Estados = Record<string, EstadoDeDestino>
type Hoja = 'baja' | 'sube'

const reducirMovimiento = (): boolean => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

let lienzo: CanvasRenderingContext2D | null = null
const medidos = new Map<string, number>()
/** El ancho REAL del nombre (con su letra) para que la función pura no se equivoque ni por poco. */
function medirNombre(nombre: string): number {
  const ya = medidos.get(nombre)
  if (ya !== undefined) return ya
  lienzo ??= document.createElement('canvas').getContext('2d')
  if (!lienzo) return nombre.length * 6.5 + 8
  lienzo.font = "600 11.5px Geist, 'Geist', sans-serif"
  const w = Math.ceil(lienzo.measureText(nombre).width) + 8
  medidos.set(nombre, w)
  return w
}

/** Los colores de NUESTRO mapa sobre el estilo de Mapbox: mar, tierra y fronteras; nada de carreteras, ciudades ni lugares. Solo se quedan los nombres de los países, discretos. */
function pintarComoNuestroMapa(map: mapboxgl.Map): void {
  const capas = map.getStyle()?.layers ?? []
  for (const l of capas) {
    try {
      if (l.type === 'background') map.setPaintProperty(l.id, 'background-color', TIERRA)
      else if (l.id === 'water') map.setPaintProperty(l.id, 'fill-color', MAR)
      else if (l.id === 'admin-0-boundary') {
        map.setPaintProperty(l.id, 'line-color', FRONTERA)
        map.setPaintProperty(l.id, 'line-opacity', 0.75)
      } else if (l.id === 'country-label') {
        map.setPaintProperty(l.id, 'text-color', '#3C4A3A')
        map.setPaintProperty(l.id, 'text-opacity', 0.5)
        map.setPaintProperty(l.id, 'text-halo-color', TIERRA)
        map.setLayoutProperty(l.id, 'text-field', ['get', 'name_es'])
      } else map.setLayoutProperty(l.id, 'visibility', 'none')
    } catch {
      /* una capa que este estilo no tiene */
    }
  }
  try {
    map.setFog({ color: '#FFFDF8', 'high-color': '#CFE3F2', 'horizon-blend': 0.04, 'space-color': CREMA, 'star-intensity': 0 })
  } catch {
    /* sin niebla */
  }
}

function Pin({ x, y, d, est, elegido }: { x: number; y: number; d: DestinoDelMapa; est: EstadoDeDestino | undefined; elegido: boolean }): ReactNode {
  return (
    <div data-globo-pin={d.clave} data-listo={d.listo ? '1' : '0'} data-estuvo={est?.estuvo ? '1' : undefined} data-con-viaje={est?.viaje ? '1' : undefined} style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, pointerEvents: 'none' }}>
      {est?.viaje && <span data-pin-destacado style={{ position: 'absolute', left: -15, top: -15, width: 30, height: 30, borderRadius: '50%', boxSizing: 'border-box', border: '2.4px solid #C99A44', background: 'rgba(201,154,68,.22)', animation: 'gdPulso 2.2s ease-in-out infinite' }} />}
      {elegido && <span style={{ position: 'absolute', left: -17, top: -17, width: 34, height: 34, borderRadius: '50%', boxSizing: 'border-box', border: '1.6px dashed #1C2230' }} />}
      <span style={{ position: 'absolute', left: -8, top: -8, width: 16, height: 16, borderRadius: '50%', boxSizing: 'border-box', background: d.listo ? '#1C2230' : '#B8B09C', border: `2.2px solid ${d.listo ? '#F3D88F' : '#FFFFFF'}` }} />
      {est?.estuvo && (
        <span data-pin-visto style={{ position: 'absolute', left: 3, top: -15, width: 12, height: 12, borderRadius: '50%', background: '#C99A44', border: '1.5px solid #FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1.5 5.2l2.4 2.4l4.6 -5" />
          </svg>
        </span>
      )}
    </div>
  )
}

function textoDeEstado(d: DestinoDelMapa, est: EstadoDeDestino | undefined): { t: string; color: string } {
  if (!d.listo) return { t: 'Próximamente', color: 'rgba(28,34,48,.5)' }
  if (est?.viaje) return { t: `Tu viaje · ${est.viaje.cuando}`, color: '#8A6A2C' }
  if (est?.estuvo) return { t: '✓ Ya has estado', color: '#2F6B43' }
  return { t: 'Listo para crear', color: 'rgba(28,34,48,.5)' }
}

export default function GloboDeDestinos({ destinos, estados, onCerrar, onMas }: { destinos: DestinoDelMapa[]; estados: Estados; onCerrar: () => void; onMas: () => void }): ReactNode {
  const raiz = useRef<HTMLDivElement>(null)
  const lugarDelMapa = useRef<HTMLDivElement>(null)
  const mapa = useRef<mapboxgl.Map | null>(null)
  const [, setTic] = useState(0)
  const [hoja, setHoja] = useState<Hoja>('baja')
  const hojaRef = useRef<Hoja>('baja')
  hojaRef.current = hoja
  const tarjeta = usePrimeraVezUi((s) => s.tarjeta)
  const abrirTarjeta = usePrimeraVezUi((s) => s.abrirTarjeta)
  const destinosRef = useRef(destinos)
  destinosRef.current = destinos
  const puntosRef = useRef<PuntoDeEtiqueta[]>([])

  const alto = () => raiz.current?.clientHeight ?? 844
  /** Cuánto tapa abajo lo que hay encima del globo: la hoja (bajada o subida) o, con la tarjeta de un destino abierta, la tarjeta. */
  const tapadoAbajo = useCallback((h: Hoja, conTarjeta: boolean) => (conTarjeta ? alto() * 0.56 : alto() * (1 - (h === 'baja' ? TOP_BAJA : TOP_SUBE))), [])

  // El mapa: se crea UNA vez al abrir y se destruye al cerrar. (Con StrictMode, en desarrollo, el primer montaje se cancela antes de crear nada: una sola carga.)
  useEffect(() => {
    let creado: mapboxgl.Map | null = null
    const pedir = () => setTic((n) => (n + 1) % 1e9)
    const espera = window.setTimeout(() => {
      if (!lugarDelMapa.current) return
      const m = new mapboxgl.Map({
        container: lugarDelMapa.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        projection: 'globe',
        center: [8, 36],
        zoom: 1.25,
        minZoom: 0.9,
        maxZoom: 7.5,
        attributionControl: false,
        logoPosition: 'top-right',
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        renderWorldCopies: false,
        fadeDuration: 0,
      })
      m.setPadding({ top: 0, left: 0, right: 0, bottom: tapadoAbajo('baja', false) })
      creado = m
      mapa.current = m
      m.addControl(new mapboxgl.AttributionControl({ compact: true }), 'top-right')
      m.touchZoomRotate.disableRotation()
      m.keyboard.disableRotation()
      m.on('style.load', () => {
        pintarComoNuestroMapa(m)
        pedir()
      })
      for (const ev of ['move', 'moveend', 'resize', 'load', 'idle'] as const) m.on(ev, pedir)
      // Tocar un pin: el más cercano al toque. Los pines no capturan el dedo (así el globo se arrastra también desde encima de uno).
      m.on('click', (e) => {
        const clave = pinMasCercano(puntosRef.current, e.point.x, e.point.y, 24)
        if (clave) abrirTarjeta(clave)
      })
      if (import.meta.env.DEV) {
        const w = window as unknown as { __cargasDeMapa?: number; __mapasDelGlobo?: number; __globoMapa?: mapboxgl.Map | null }
        w.__cargasDeMapa = (w.__cargasDeMapa ?? 0) + 1
        w.__mapasDelGlobo = (w.__mapasDelGlobo ?? 0) + 1
        w.__globoMapa = m
      }
    }, 0)
    return () => {
      window.clearTimeout(espera)
      if (creado) {
        creado.remove()
        if (import.meta.env.DEV) {
          const w = window as unknown as { __mapasDelGlobo?: number; __globoMapa?: mapboxgl.Map | null }
          w.__mapasDelGlobo = Math.max(0, (w.__mapasDelGlobo ?? 1) - 1)
          if (w.__globoMapa === creado) w.__globoMapa = null
        }
      }
      mapa.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // La hoja sube o baja: el globo se recoloca en la parte que queda libre (con «Reducir movimiento», de golpe).
  useEffect(() => {
    // Con la tarjeta de un destino abierta el globo ya va a su sitio (flyTo): no se le cambia el relleno a medio vuelo.
    if (usePrimeraVezUi.getState().tarjeta) return
    mapa.current?.easeTo({ padding: { top: 0, left: 0, right: 0, bottom: tapadoAbajo(hoja, Boolean(tarjeta)) }, duration: reducirMovimiento() ? 0 : 350 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoja])

  // Tocar un pin o una tarjeta (los dos ponen `tarjeta`): el globo gira hasta ese destino, que queda en la parte de arriba, y sale su hoja de siempre. Al cerrarla, el globo se recoloca.
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    const d = tarjeta ? destinosRef.current.find((x) => x.clave === tarjeta) : null
    const duracion = reducirMovimiento() ? 0 : 1500
    if (d) setHoja('baja')
    if (d) m.flyTo({ center: [d.lng, d.lat], zoom: Math.max(m.getZoom(), 3.4), padding: { top: 0, left: 0, right: 0, bottom: tapadoAbajo(hojaRef.current, true) }, duration: duracion, essential: false })
    else m.easeTo({ padding: { top: 0, left: 0, right: 0, bottom: tapadoAbajo(hojaRef.current, false) }, duration: reducirMovimiento() ? 0 : 350 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarjeta])

  // Al cerrar el globo no se queda ninguna tarjeta abierta por él.
  useEffect(() => () => usePrimeraVezUi.getState().abrirTarjeta(null), [])

  // ---- Lo que se pinta encima del globo (se recalcula en cada movimiento) ----
  const m = mapa.current
  const ancho = raiz.current?.clientWidth ?? 390
  const altoPantalla = alto()
  const abajo = tapadoAbajo(hoja, false)
  const centro = m?.getCenter()
  const proyectados: PuntoDeEtiqueta[] = m && centro
    ? destinos.map((d) => {
        const p = m.project([d.lng, d.lat])
        const est = estados[d.clave]
        return { clave: d.clave, nombre: d.nombre, x: p.x, y: p.y, visible: enLaCara({ lng: centro.lng, lat: centro.lat }, d.lng, d.lat), prioridad: prioridadDeDestino({ listo: d.listo, estuvo: est?.estuvo, conViaje: Boolean(est?.viaje) }) }
      })
    : []
  puntosRef.current = proyectados
  const cy = m ? (altoPantalla - abajo) / 2 : altoPantalla / 2
  const etiquetas = etiquetasVisibles(proyectados, { ancho, alto: altoPantalla, abajo, arriba: 56, cx: ancho / 2, cy }, { medir: medirNombre })

  const grupos = useMemo(() => porContinente(destinos), [destinos])
  const alternar = () => setHoja((h) => (h === 'baja' ? 'sube' : 'baja'))
  // El asa de la hoja: tocar la alterna; arrastrar hacia arriba la sube y hacia abajo la baja. Se sigue el dedo en toda la ventana (sin depender de la captura del puntero, que no todos los navegadores dan al ratón).
  const empezarArrastre = (e: PE<HTMLDivElement>) => {
    const inicio = { y: e.clientY, hecho: false }
    const mover = (ev: PointerEvent) => {
      if (inicio.hecho) return
      const dy = ev.clientY - inicio.y
      if (dy < -24) {
        inicio.hecho = true
        setHoja('sube')
      } else if (dy > 24) {
        inicio.hecho = true
        setHoja('baja')
      }
    }
    const soltar = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
      if (!inicio.hecho && ev.type === 'pointerup') alternar()
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
  }
  const asa = { onPointerDown: empezarArrastre }

  return createPortal(
    <div ref={raiz} data-globo-destinos data-hoja={hoja} className="fixed inset-0 z-[90] overflow-hidden" role="dialog" aria-modal="true" aria-label="¿A dónde te apetece ir?" style={{ background: 'radial-gradient(120% 70% at 50% 28%,#FBF7EC 0%,#EFE5CE 100%)', touchAction: 'none' }}>
      <style>{`@keyframes gdPulso{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.3);opacity:.35}}@media (prefers-reduced-motion: reduce){[data-globo-destinos] *{animation:none!important}}`}</style>
      <div ref={lugarDelMapa} data-globo-mapa style={{ position: 'absolute', inset: 0 }} />
      {/* Pines y nombres: encima del globo, sin coger el dedo (el globo se arrastra desde cualquier sitio). */}
      <div aria-hidden="true" data-globo-capa style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {proyectados
          .filter((p) => p.visible && p.x > -20 && p.x < ancho + 20 && p.y > -20 && p.y < altoPantalla - abajo + 20)
          .map((p) => {
            const d = destinos.find((x) => x.clave === p.clave)!
            return <Pin key={p.clave} x={p.x} y={p.y} d={d} est={estados[p.clave]} elegido={tarjeta === p.clave} />
          })}
        {etiquetas.map((e) => {
          const d = destinos.find((x) => x.clave === e.clave)!
          return (
            <span key={e.clave} data-globo-etiqueta={e.clave} data-lado={e.lado} style={{ position: 'absolute', left: e.lado === 'der' ? e.caja[0] : e.caja[2], top: (e.caja[1] + e.caja[3]) / 2, transform: `translate(${e.lado === 'der' ? '0' : '-100%'},-50%)`, font: "600 11.5px 'Geist'", color: d.listo ? '#1C2230' : '#6A6E60', whiteSpace: 'nowrap', padding: '0 4px', textShadow: '0 0 3px #F6EFE0,0 0 3px #F6EFE0,0 0 2px #F6EFE0,1px 1px 0 #F6EFE0,-1px -1px 0 #F6EFE0,1px -1px 0 #F6EFE0,-1px 1px 0 #F6EFE0' }}>
              {d.nombre}
            </span>
          )
        })}
      </div>
      <button type="button" data-globo-cerrar onClick={onCerrar} aria-label="Cerrar el mapa" className="zona-toque" style={{ position: 'absolute', left: 22, top: 'calc(env(safe-area-inset-top,0px) + 16px)', width: 44, height: 44, borderRadius: '50%', background: '#FFFDF8', border: '1.5px solid #B58A2E', boxShadow: '0 8px 16px -8px rgba(28,34,48,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {/* La hoja: bajada se ve casi todo el globo; subida, la lista por continentes. */}
      <div data-globo-hoja style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: `${(hoja === 'baja' ? TOP_BAJA : TOP_SUBE) * 100}%`, borderRadius: '30px 30px 0 0', background: '#FFFDF8', boxShadow: '0 -18px 40px -18px rgba(28,34,48,.5)', display: 'flex', flexDirection: 'column', transition: reducirMovimiento() ? 'none' : 'top .35s ease' }}>
        <div data-globo-asa {...asa} role="button" tabIndex={0} aria-label={hoja === 'baja' ? 'Subir la lista' : 'Bajar la lista'} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && alternar()} style={{ flex: 'none', padding: '10px 0 6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', touchAction: 'none' }}>
          <span style={{ width: 42, height: 5, borderRadius: 5, background: 'rgba(28,34,48,.2)' }} />
        </div>
        <div style={{ flex: 'none', padding: '2px 20px 10px' }}>
          <span style={{ font: `400 30px/1.02 ${SERIE}` }}>
            ¿A dónde te <em style={{ color: '#8A6A2C' }}>apetece ir?</em>
          </span>
        </div>
        {/* Las tarjetas acaban por encima del «+» y de la zona segura de abajo: ninguna queda tapada. */}
        <div data-globo-lista style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '0 20px calc(140px + env(safe-area-inset-bottom,0px))', display: 'flex', flexDirection: 'column', gap: 18, touchAction: 'pan-y' }}>
          {grupos.map((g) => (
            <div key={g.continente} data-globo-continente={g.continente} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }}>{g.continente}</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
                {g.destinos.map((d) => {
                  const est = estados[d.clave]
                  const st = textoDeEstado(d, est)
                  const resaltado = Boolean(est?.viaje) || tarjeta === d.clave
                  return (
                    <button key={d.clave} type="button" data-globo-tarjeta={d.clave} data-listo={d.listo ? '1' : '0'} onClick={() => abrirTarjeta(d.clave)} style={{ cursor: 'pointer', minHeight: 112, padding: '10px 8px', borderRadius: 20, background: resaltado ? '#FBF3E2' : '#FFFFFF', border: `1.5px solid ${resaltado ? '#C99A44' : 'rgba(28,34,48,.12)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', minWidth: 0 }}>
                      <span style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(28,34,48,.18)', fontSize: 34, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: d.listo ? 'none' : 'grayscale(1)', opacity: d.listo ? 1 : 0.6, flex: 'none' }}>
                        <FlagIcon countryCode={d.iso} className="fis !rounded-none" />
                      </span>
                      <span style={{ font: "600 13.5px/1.15 'Geist'", color: d.listo ? '#1C2230' : 'rgba(28,34,48,.5)', textWrap: 'balance', overflowWrap: 'anywhere' }}>{d.nombre}</span>
                      <span data-globo-estado style={{ font: "500 11px/1.25 'Geist'", color: st.color, overflowWrap: 'anywhere' }}>{st.t}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button type="button" data-globo-mas onClick={onMas} aria-label="Añadir un viaje" style={{ position: 'absolute', right: 20, bottom: 'calc(34px + env(safe-area-inset-bottom,0px))', width: 62, height: 62, borderRadius: '50%', border: 'none', padding: 0, background: ORO, boxShadow: '0 0 0 6px rgba(246,239,224,.9),0 16px 28px -8px rgba(110,80,24,.85),inset 0 1px 0 rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>,
    document.body,
  )
}
