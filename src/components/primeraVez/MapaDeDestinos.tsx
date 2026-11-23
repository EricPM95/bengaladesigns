import { lazy, Suspense, useEffect, useMemo, useRef, useState, type PointerEvent as PE, type ReactNode } from 'react'
import { useDestinosCurados } from '../../lib/destinosCurados'
import { destinosDelMapa, porContinente, usePrimeraVezUi, type DestinoDelMapa } from '../../lib/primeraVez'
import { FlagIcon } from '../ui/FlagIcon'
import { precargarDestinos } from './LoQueTePuedesLlevar'
import { usePaisesYTierra } from '../logros/pantallas/mundo/paises'
import { giroPara, puntoDe, rejilla, trazadoDe, type Vista } from '../logros/pantallas/mundo/proyeccion'
import { estadosDeLaBola, useBola, type DestinoDelPerfil, type EstadoDeDestino } from '../../lib/bolaDelMundo'
import type { ResumenViaje } from '../../lib/viajesPerfil'
import { etiquetasVisibles, prioridadDeDestino } from '../../lib/etiquetasDelGlobo'

/**
 * (V31, Design «Primera Vez» P1 a P3) «¿A DÓNDE TE APETECE IR?»: el mapa del mundo DIBUJADO (SVG con las costas que ya van dentro de la app: nada de Mapbox ni de internet; en el Perfil es solo la vista pequeña: tocarla abre el globo a pantalla completa, `GloboDeDestinos`, V41) que se gira con un dedo y se acerca con dos, y debajo la
 * lista por continentes con su bandera. Los destinos son los de verdad de la app (los de salida que ya tienen sus datos, y los «Próximamente» en gris). Cada destino se toca bien con el dedo (zona de 44 px),
 * también en Europa: en el mapa o en la lista. Tocar uno abre su tarjeta (`TarjetaDeDestino`). Solo se monta en el Perfil del viajero nuevo.
 */
// (V41) El globo a pantalla completa es otro archivo que se baja SOLO al abrirlo (con su mapa de Mapbox): esta vista pequeña es SVG y no carga ningún mapa.
const GloboDeDestinos = lazy(() => import('./GloboDeDestinos'))
const LADO = 330
const R0 = 150
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

type Estados = Record<string, EstadoDeDestino>

function Globo({ destinos, elegido, onElegir, estados, onAbrir }: { destinos: DestinoDelMapa[]; elegido: string | null; onElegir: (clave: string) => void; estados: Estados; onAbrir: () => void }): ReactNode {
  const { tierra } = usePaisesYTierra()
  const [rot, setRot] = useState<[number, number]>(giroPara(44, -9))
  const [z, setZ] = useState(1.7)
  const punteros = useRef(new Map<number, [number, number]>())
  const movido = useRef(0)
  const pellizco = useRef<number | null>(null)
  const estado = useRef({ z: 1.7 })
  estado.current = { z }
  const vista: Vista = useMemo(() => ({ rot, R: R0 * z, cx: LADO / 2, cy: LADO / 2 }), [rot, z])
  const trazados = useMemo(() => (tierra ? Object.entries(tierra).map(([iso, a]) => ({ iso, d: trazadoDe(a, vista) })).filter((p) => p.d) : []), [tierra, vista])
  const lineas = useMemo(() => rejilla(vista), [vista])
  const pines = destinos.map((d) => ({ d, ...puntoDe(d.lat, d.lng, vista) })).filter((p) => p.visible)
  // (V41) Los nombres NUNCA se pisan, tampoco aquí: se ve el de más prioridad y el otro al acercar (la misma función pura que el globo grande); y ninguno se corta por el borde.
  const etiquetas = useMemo(
    () => new Map(etiquetasVisibles(pines.map(({ d, x, y }) => ({ clave: d.clave, nombre: d.nombre, x, y, visible: true, prioridad: prioridadDeDestino({ listo: d.listo, estuvo: estados[d.clave]?.estuvo, conViaje: Boolean(estados[d.clave]?.viaje) }) })), { ancho: LADO, alto: LADO, abajo: 0, arriba: 0, cx: LADO / 2, cy: LADO / 2 }, { separacion: 12, altoDeLetra: 14, radioDePin: 11, medir: (n) => n.length * 6 + 6 }).map((e) => [e.clave, e.lado] as const)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vista, destinos, estados],
  )

  const abajo = (e: PE<SVGSVGElement>) => {
    punteros.current.set(e.pointerId, [e.clientX, e.clientY])
    movido.current = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const mover = (e: PE<SVGSVGElement>) => {
    const previo = punteros.current.get(e.pointerId)
    if (!previo) return
    punteros.current.set(e.pointerId, [e.clientX, e.clientY])
    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()]
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1])
      if (pellizco.current) setZ((zz) => clamp((zz * dist) / (pellizco.current as number), 1, 4))
      pellizco.current = dist
      movido.current += 10
      return
    }
    const dx = e.clientX - previo[0]
    const dy = e.clientY - previo[1]
    movido.current += Math.abs(dx) + Math.abs(dy)
    const k = 0.4 / estado.current.z
    setRot((r) => [r[0] + dx * k, clamp(r[1] - dy * k, -70, 70)])
  }
  const arriba = (e: PE<SVGSVGElement>) => {
    punteros.current.delete(e.pointerId)
    if (punteros.current.size < 2) pellizco.current = null
  }
  const tocar = (clave: string) => () => {
    if (movido.current > 6) return
    onElegir(clave)
  }

  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '6px 0', borderRadius: 22, background: 'radial-gradient(circle at 50% 40%,#FBF7EC,#EFE5CE)' }}>
      <button type="button" data-abrir-globo onClick={onAbrir} aria-label="Abrir el mapa a pantalla completa" className="zona-toque" style={{ position: 'absolute', right: 8, top: 8, zIndex: 1, minWidth: 44, minHeight: 44, borderRadius: '50%', background: '#FFFDF8', border: '1.5px solid #B58A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 6px 12px -6px rgba(28,34,48,.45)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      </button>
      <svg data-mapa-destinos viewBox={`0 0 ${LADO} ${LADO}`} style={{ width: '100%', maxWidth: LADO, height: 'auto', touchAction: 'none', cursor: 'grab', userSelect: 'none' }} onPointerDown={abajo} onPointerMove={mover} onPointerUp={arriba} onPointerCancel={arriba} onClick={(e) => { if (movido.current > 6 || (e.target as Element).closest('[data-pin]')) return; onAbrir() }} onWheel={(e) => setZ((zz) => clamp(zz * (e.deltaY < 0 ? 1.12 : 0.9), 1, 4))} role="img" aria-label="Mapa del mundo con los destinos">
        <defs>
          <radialGradient id="mdMar" cx=".38" cy=".3" r=".9">
            <stop offset="0" stopColor="#D8EAF2" />
            <stop offset="1" stopColor="#9DC2D4" />
          </radialGradient>
          <clipPath id="mdCl">
            <circle cx={LADO / 2} cy={LADO / 2} r={152} />
          </clipPath>
        </defs>
        <circle cx={LADO / 2} cy={LADO / 2} r={152} fill="url(#mdMar)" stroke="#FFFFFF" strokeWidth="3" />
        <g clipPath="url(#mdCl)">
          <path d={lineas} fill="none" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth=".6" />
          {trazados.map((p) => (
            <path key={p.iso} d={p.d} fill="#F1E8D3" stroke="#D2C29C" strokeWidth=".6" strokeLinejoin="round" />
          ))}
        </g>
        <circle cx={LADO / 2} cy={LADO / 2} r={152} fill="none" stroke="rgba(28,34,48,.18)" strokeWidth="1" />
        {pines.map(({ d, x, y }) => {
          const sel = elegido === d.clave
          const est = estados[d.clave]
          return (
            <g key={d.clave} data-pin={d.clave} data-listo={d.listo ? '1' : '0'} data-estuvo={est?.estuvo ? '1' : undefined} data-con-viaje={est?.viaje ? '1' : undefined} onClick={tocar(d.clave)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r={22} fill="transparent" />
              {sel && <circle cx={x} cy={y} r={14} fill="none" stroke="#C99A44" strokeWidth="2" />}
              {/* (V39) Con un viaje próximo o en marcha, el pin va destacado: un aro dorado y un poco más grande. */}
              {est?.viaje && <circle data-pin-destacado cx={x} cy={y} r={15.5} fill="rgba(201,154,68,.22)" stroke="#C99A44" strokeWidth="2.4" />}
              <circle cx={x} cy={y} r={est?.viaje ? 9.5 : 8.5} fill={d.listo ? '#1C2230' : '#B8B09C'} stroke={d.listo ? '#F3D88F' : '#FFFFFF'} strokeWidth="2.2" />
              {/* (V39) Donde ya ha estado, un ✓ dorado en la esquina del pin. */}
              {est?.estuvo && (
                <g data-pin-visto>
                  <circle cx={x + 8} cy={y - 8} r={6.2} fill="#C99A44" stroke="#FFFFFF" strokeWidth="1.6" />
                  <path d={`M${x + 5.2} ${y - 8} l2 2 l3.4 -3.8`} fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {etiquetas.has(d.clave) && (
                <text data-etiqueta-pin={d.clave} x={etiquetas.get(d.clave) === 'izq' ? x - 12 : x + 12} y={y + 4} textAnchor={etiquetas.get(d.clave) === 'izq' ? 'end' : 'start'} fontFamily="Geist" fontWeight="600" fontSize="11" fill={d.listo ? '#1C2230' : '#7A7466'} stroke="#F6EFE0" strokeWidth="3" paintOrder="stroke" style={{ pointerEvents: 'none' }}>
                  {d.nombre}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** La lista de abajo, por continentes, con su bandera (Cancún con la de México); los «Próximamente» en gris. */
function Lista({ destinos, elegido, onElegir, estados, columnas = 3 }: { destinos: DestinoDelMapa[]; elegido: string | null; onElegir: (clave: string) => void; estados: Estados; columnas?: number }): ReactNode {
  return (
    <>
      {porContinente(destinos).map((g) => (
        <div key={g.continente} data-continente={g.continente} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
          <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }}>{g.continente}</span>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnas},minmax(0,1fr))`, gap: 8 }}>
            {g.destinos.map((d) => (
              <button
                key={d.clave}
                type="button"
                data-destino-lista={d.clave}
                data-listo={d.listo ? '1' : '0'}
                onClick={() => onElegir(d.clave)}
                style={{ cursor: 'pointer', minHeight: 44, height: 'auto', padding: '7px 10px', borderRadius: 14, background: elegido === d.clave ? '#FBF3E2' : '#FFFFFF', border: `1.5px solid ${elegido === d.clave ? '#C99A44' : 'rgba(28,34,48,.12)'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', gap: 3, minWidth: 0, textAlign: 'left' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <span style={{ flex: 'none', display: 'flex', filter: d.listo ? 'none' : 'grayscale(1)', opacity: d.listo ? 1 : 0.6 }}>
                    <FlagIcon countryCode={d.iso} />
                  </span>
                  <span style={{ font: "600 12.5px/1.15 'Geist'", color: d.listo ? '#1C2230' : 'rgba(28,34,48,.5)', minWidth: 0, overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.nombre}</span>
                </span>
                {/* (V39) Lo que dice cada destino, DENTRO de su recuadro y con margen (debajo del nombre, en toda la anchura y sin cortarse): «Tu viaje · 26–29 nov» o «Ya has estado». Si no cabe en una línea, baja a otra. */}
                {estados[d.clave]?.viaje ? (
                  <span data-etiqueta-destino="viaje" style={{ font: "600 10px/1.2 'Geist'", color: '#8A6A2C', overflowWrap: 'anywhere' }}>Tu viaje · {estados[d.clave]!.viaje!.cuando}</span>
                ) : estados[d.clave]?.estuvo ? (
                  <span data-etiqueta-destino="estuvo" style={{ font: "600 10px/1.2 'Geist'", color: '#8A6A2C', overflowWrap: 'anywhere' }}>✓ Ya has estado</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export function MapaDeDestinos({ viajes, destinosDelPerfil, onAbrirViaje, paraTodos = false }: { viajes?: ResumenViaje[]; destinosDelPerfil?: DestinoDelPerfil[] | null; onAbrirViaje?: (v: ResumenViaje) => void; paraTodos?: boolean } = {}): ReactNode {
  const curados = useDestinosCurados()
  const destinos = useMemo(() => destinosDelMapa(curados), [curados])
  const tarjeta = usePrimeraVezUi((s) => s.tarjeta)
  const abrirTarjeta = usePrimeraVezUi((s) => s.abrirTarjeta)
  const globo = usePrimeraVezUi((s) => s.globo)
  const abrirGlobo = usePrimeraVezUi((s) => s.abrirGlobo)
  // (V39) Lo que dice cada destino (ya has estado / tu viaje): sale de lo que el Perfil ya tiene cargado, sin consultas nuevas.
  const estados = useMemo(() => estadosDeLaBola(destinos, viajes ?? [], destinosDelPerfil), [destinos, viajes, destinosDelPerfil])
  useEffect(() => {
    useBola.getState().poner({ porDestino: estados, viajes: viajes ?? [], abrirViaje: onAbrirViaje ?? null })
    return () => useBola.getState().poner({ porDestino: {}, viajes: [], abrirViaje: null })
  }, [estados, viajes, onAbrirViaje])
  // (V34) Los números de «Lo que te puedes llevar» de cada destino listo se piden ya, antes de que se toque ninguno: la tarjeta los trae al momento.
  // (V39) En el Perfil de quien ya viaja NO se piden por adelantado (una petición por destino cada vez que se abre el Perfil): se piden al tocar uno y se guardan; los de donde ya ha estado vienen en la respuesta del Perfil.
  useEffect(() => {
    if (paraTodos) return
    precargarDestinos(destinos.filter((d) => d.listo).map((d) => d.clave))
  }, [destinos, paraTodos])
  // Al salir del Perfil (o al cambiar a un viaje) no se queda nada abierto.
  useEffect(() => () => {
    usePrimeraVezUi.getState().abrirTarjeta(null)
    usePrimeraVezUi.getState().abrirGlobo(false)
  }, [])
  return (
    <section data-mapa-primera-vez data-para-todos={paraTodos ? '1' : undefined} style={{ padding: paraTodos ? '8px 0 0' : '34px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ margin: 0, font: "400 34px/1.02 'Instrument Serif',serif", textWrap: 'balance' }}>
        ¿A dónde te <em style={{ color: '#8A6A2C' }}>apetece ir?</em>
      </h2>
      <div style={{ borderRadius: 28, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', boxShadow: '0 14px 26px -20px rgba(28,34,48,.45)', padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Globo destinos={destinos} elegido={tarjeta} onElegir={abrirTarjeta} estados={estados} onAbrir={() => abrirGlobo(true)} />
        {/* (V39) En el Perfil de todos la lista va en 2 columnas: cada recuadro es más ancho y su nombre y lo que dice (Tu viaje · fechas, Ya has estado) caben enteros, con margen. */}
        <Lista destinos={destinos} elegido={tarjeta} onElegir={abrirTarjeta} estados={estados} columnas={paraTodos ? 2 : 3} />
      </div>
      {/* (V41) A pantalla completa: el globo de verdad. El «+» de abajo cierra el globo y abre «¿Qué quieres hacer?» como el del Perfil. */}
      {globo && (
        <Suspense fallback={null}>
          <GloboDeDestinos
            destinos={destinos}
            estados={estados}
            onCerrar={() => abrirGlobo(false)}
            onMas={() => {
              abrirGlobo(false)
              window.setTimeout(() => document.querySelector<HTMLButtonElement>('[data-anadir-viaje]')?.click(), 50)
            }}
          />
        </Suspense>
      )}
    </section>
  )
}
