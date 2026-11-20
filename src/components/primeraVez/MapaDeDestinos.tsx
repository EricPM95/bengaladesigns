import { useEffect, useMemo, useRef, useState, type PointerEvent as PE, type ReactNode } from 'react'
import { useDestinosCurados } from '../../lib/destinosCurados'
import { destinosDelMapa, porContinente, usePrimeraVezUi, type DestinoDelMapa } from '../../lib/primeraVez'
import { FlagIcon } from '../ui/FlagIcon'
import { precargarDestinos } from './LoQueTePuedesLlevar'
import { usePaisesYTierra } from '../logros/pantallas/mundo/paises'
import { giroPara, puntoDe, rejilla, trazadoDe, type Vista } from '../logros/pantallas/mundo/proyeccion'

/**
 * (V31, Design «Primera Vez» P1 a P3) «¿A DÓNDE TE APETECE IR?»: el mapa del mundo DIBUJADO (SVG con las costas que ya van dentro de la app: nada de Mapbox ni de internet) que se gira con un dedo y se acerca con dos, y debajo la
 * lista por continentes con su bandera. Los destinos son los de verdad de la app (los de salida que ya tienen sus datos, y los «Próximamente» en gris). Cada destino se toca bien con el dedo (zona de 44 px),
 * también en Europa: en el mapa o en la lista. Tocar uno abre su tarjeta (`TarjetaDeDestino`). Solo se monta en el Perfil del viajero nuevo.
 */
const LADO = 330
const R0 = 150
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

function Globo({ destinos, elegido, onElegir }: { destinos: DestinoDelMapa[]; elegido: string | null; onElegir: (clave: string) => void }): ReactNode {
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0', borderRadius: 22, background: 'radial-gradient(circle at 50% 40%,#FBF7EC,#EFE5CE)' }}>
      <svg data-mapa-destinos viewBox={`0 0 ${LADO} ${LADO}`} style={{ width: '100%', maxWidth: LADO, height: 'auto', touchAction: 'none', cursor: 'grab', userSelect: 'none' }} onPointerDown={abajo} onPointerMove={mover} onPointerUp={arriba} onPointerCancel={arriba} onWheel={(e) => setZ((zz) => clamp(zz * (e.deltaY < 0 ? 1.12 : 0.9), 1, 4))} role="img" aria-label="Mapa del mundo con los destinos">
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
          return (
            <g key={d.clave} data-pin={d.clave} data-listo={d.listo ? '1' : '0'} onClick={tocar(d.clave)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r={22} fill="transparent" />
              {sel && <circle cx={x} cy={y} r={14} fill="none" stroke="#C99A44" strokeWidth="2" />}
              <circle cx={x} cy={y} r={8.5} fill={d.listo ? '#1C2230' : '#B8B09C'} stroke={d.listo ? '#F3D88F' : '#FFFFFF'} strokeWidth="2.2" />
              <text x={x + 12} y={y + 4} fontFamily="Geist" fontWeight="600" fontSize="11" fill={d.listo ? '#1C2230' : '#7A7466'} stroke="#F6EFE0" strokeWidth="3" paintOrder="stroke" style={{ pointerEvents: 'none' }}>
                {d.nombre}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** La lista de abajo, por continentes, con su bandera (Cancún con la de México); los «Próximamente» en gris. */
function Lista({ destinos, elegido, onElegir }: { destinos: DestinoDelMapa[]; elegido: string | null; onElegir: (clave: string) => void }): ReactNode {
  return (
    <>
      {porContinente(destinos).map((g) => (
        <div key={g.continente} data-continente={g.continente} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
          <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }}>{g.continente}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
            {g.destinos.map((d) => (
              <button
                key={d.clave}
                type="button"
                data-destino-lista={d.clave}
                data-listo={d.listo ? '1' : '0'}
                onClick={() => onElegir(d.clave)}
                style={{ cursor: 'pointer', minHeight: 44, height: 44, padding: '0 8px', borderRadius: 14, background: elegido === d.clave ? '#FBF3E2' : '#FFFFFF', border: `1.5px solid ${elegido === d.clave ? '#C99A44' : 'rgba(28,34,48,.12)'}`, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}
              >
                <span style={{ flex: 'none', display: 'flex', filter: d.listo ? 'none' : 'grayscale(1)', opacity: d.listo ? 1 : 0.6 }}>
                  <FlagIcon countryCode={d.iso} />
                </span>
                <span style={{ font: "600 12.5px 'Geist'", color: d.listo ? '#1C2230' : 'rgba(28,34,48,.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{d.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export function MapaDeDestinos(): ReactNode {
  const curados = useDestinosCurados()
  const destinos = useMemo(() => destinosDelMapa(curados), [curados])
  const tarjeta = usePrimeraVezUi((s) => s.tarjeta)
  const abrirTarjeta = usePrimeraVezUi((s) => s.abrirTarjeta)
  // (V34) Los números de «Lo que te puedes llevar» de cada destino listo se piden ya, antes de que se toque ninguno: la tarjeta los trae al momento.
  useEffect(() => {
    precargarDestinos(destinos.filter((d) => d.listo).map((d) => d.clave))
  }, [destinos])
  // Al salir del Perfil (o al cambiar a un viaje) no se queda nada abierto.
  useEffect(() => () => usePrimeraVezUi.getState().abrirTarjeta(null), [])
  return (
    <section data-mapa-primera-vez style={{ padding: '34px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ margin: 0, font: "400 34px/1.02 'Instrument Serif',serif", textWrap: 'balance' }}>
        ¿A dónde te <em style={{ color: '#8A6A2C' }}>apetece ir?</em>
      </h2>
      <div style={{ borderRadius: 28, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', boxShadow: '0 14px 26px -20px rgba(28,34,48,.45)', padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Globo destinos={destinos} elegido={tarjeta} onElegir={abrirTarjeta} />
        <Lista destinos={destinos} elegido={tarjeta} onElegir={abrirTarjeta} />
      </div>
    </section>
  )
}
