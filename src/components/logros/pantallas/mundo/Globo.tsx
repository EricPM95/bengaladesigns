import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as PE, type ReactNode } from 'react'
import { giroPara, puntoDe, rejilla, trazadoDe, type Tierra, type Vista } from './proyeccion'
import { reducirMovimiento } from './paises'

/** Cómo se pinta un país. */
export interface Relleno {
  f: string
  s?: string
  w?: number
}
export interface Marca {
  clave: string
  lat: number
  lng: number
  /** oro = tiene sellos; gris = por conseguir; tinta = un punto de recuerdo. */
  tipo: 'oro' | 'gris' | 'tinta'
  brillo?: boolean
}
/** Hacia dónde gira el globo (cambia `n` para volver a girar al mismo sitio). */
export interface Objetivo {
  lat: number
  lng: number
  z: number
  n: number
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/**
 * EL GLOBO (8C2): el de «Tu mundo», dibujado en SVG con las costas que ya van dentro de la app (nada de internet). Se gira con un dedo, se acerca con dos (si `zoomMax` > 1), y tocar
 * un país o una moneda lo elige. `estilo` 'oceano' es el de «¿Dónde has estado ya?» (mar azul, tierra clara) y 'papel' el del pasaporte (papel, sombra de bola).
 */
export function Globo({
  tierra,
  rellenos,
  marcas = [],
  objetivo,
  inicial = { lat: 36, lng: 8, z: 1 },
  estilo,
  lado,
  zoomMax = 1,
  interactivo = true,
  onPais,
  onMarca,
  etiqueta,
}: {
  tierra: Tierra | null
  rellenos: Record<string, Relleno>
  marcas?: Marca[]
  objetivo?: Objetivo
  inicial?: { lat: number; lng: number; z: number }
  estilo: 'oceano' | 'papel'
  /** El tamaño del dibujo en píxeles. */
  lado: number
  zoomMax?: number
  interactivo?: boolean
  onPais?: (iso: string) => void
  onMarca?: (clave: string) => void
  etiqueta: string
}): ReactNode {
  const id = useId().replace(/:/g, '')
  const V = estilo === 'oceano' ? 200 : 288
  const R0 = estilo === 'oceano' ? 94 : 143
  const [rot, setRot] = useState<[number, number]>(giroPara(inicial.lat, inicial.lng))
  const [z, setZ] = useState(inicial.z)
  const estado = useRef({ rot, z })
  estado.current = { rot, z }
  const punteros = useRef(new Map<number, [number, number]>())
  const movido = useRef(0)
  const distPellizco = useRef<number | null>(null)
  const raf = useRef(0)
  const animacion = useRef(0)

  // Girar hacia un objetivo (900 ms, suave); con «reducir movimiento», de golpe.
  const nObjetivo = objetivo?.n
  useEffect(() => {
    if (!objetivo) return
    const meta = giroPara(objetivo.lat, objetivo.lng)
    if (reducirMovimiento()) {
      setRot(meta)
      setZ(objetivo.z)
      return
    }
    const desde = estado.current.rot
    const z0 = estado.current.z
    const t0 = performance.now()
    const dl = ((meta[0] - desde[0] + 540) % 360) - 180
    cancelAnimationFrame(animacion.current)
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / 900)
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      setRot([desde[0] + dl * e, desde[1] + (meta[1] - desde[1]) * e])
      setZ(z0 + (objetivo.z - z0) * e)
      if (k < 1) animacion.current = requestAnimationFrame(paso)
    }
    animacion.current = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(animacion.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nObjetivo])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const vista: Vista = useMemo(() => ({ rot, R: R0 * z, cx: V / 2, cy: V / 2 }), [rot, z, R0, V])
  const trazados = useMemo(() => {
    if (!tierra) return []
    return Object.entries(tierra)
      .map(([iso, anillos]) => ({ iso, d: trazadoDe(anillos, vista) }))
      .filter((p) => p.d)
  }, [tierra, vista])
  const lineas = useMemo(() => rejilla(vista), [vista])
  const monedas = marcas.map((m) => ({ ...m, ...puntoDe(m.lat, m.lng, vista) })).filter((m) => m.visible)

  const abajo = (e: PE<HTMLDivElement>) => {
    if (!interactivo) return
    punteros.current.set(e.pointerId, [e.clientX, e.clientY])
    movido.current = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const mover = (e: PE<HTMLDivElement>) => {
    const previo = punteros.current.get(e.pointerId)
    if (!previo) return
    punteros.current.set(e.pointerId, [e.clientX, e.clientY])
    if (punteros.current.size === 2 && zoomMax > 1) {
      const [a, b] = [...punteros.current.values()]
      const d = Math.hypot(a[0] - b[0], a[1] - b[1])
      const antes = distPellizco.current
      if (antes) setZ((zz) => clamp((zz * d) / antes, 1, zoomMax))
      distPellizco.current = d
      movido.current += 10
      return
    }
    const dx = e.clientX - previo[0]
    const dy = e.clientY - previo[1]
    movido.current += Math.abs(dx) + Math.abs(dy)
    const k = 0.45 / estado.current.z
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => setRot((r) => [r[0] + dx * k, clamp(r[1] - dy * k, -85, 85)]))
  }
  const arriba = (e: PE<HTMLDivElement>) => {
    punteros.current.delete(e.pointerId)
    if (punteros.current.size < 2) distPellizco.current = null
  }
  const tocar = (alTocar: () => void) => () => {
    if (movido.current > 6) return
    alTocar()
  }

  const oceano = estilo === 'oceano'
  const radio = V / 2 - (oceano ? 6 : 0)
  return (
    <div
      onPointerDown={abajo}
      onPointerMove={mover}
      onPointerUp={arriba}
      onPointerCancel={arriba}
      onWheel={(e) => zoomMax > 1 && setZ((zz) => clamp(zz * (e.deltaY < 0 ? 1.12 : 0.9), 1, zoomMax))}
      role="img"
      aria-label={etiqueta}
      data-globo=""
      style={{ width: lado, height: lado, touchAction: interactivo ? 'none' : 'auto', cursor: interactivo ? 'grab' : 'default', borderRadius: '50%', overflow: oceano ? 'visible' : 'hidden' }}
    >
      <svg width={lado} height={lado} viewBox={`0 0 ${V} ${V}`} style={{ display: 'block', overflow: 'visible', filter: oceano ? 'drop-shadow(0 18px 24px rgba(40,60,80,.3))' : undefined }}>
        <defs>
          <radialGradient id={`${id}mar`} cx=".38" cy=".3" r=".8">
            <stop offset="0" stopColor="#CFE7F1" />
            <stop offset=".7" stopColor="#8FBFD6" />
            <stop offset="1" stopColor="#6A9DB8" />
          </radialGradient>
          <radialGradient id={`${id}som`} cx="38%" cy="28%" r="78%">
            <stop offset=".55" stopColor="#1C2230" stopOpacity="0" />
            <stop offset="1" stopColor="#1C2230" stopOpacity=".26" />
          </radialGradient>
          <radialGradient id={`${id}oro`} cx="35%" cy="30%">
            <stop offset="0" stopColor="#FFF1C2" />
            <stop offset=".6" stopColor="#D6AE58" />
            <stop offset="1" stopColor="#8C6824" />
          </radialGradient>
          <radialGradient id={`${id}gris`} cx="35%" cy="30%">
            <stop offset="0" stopColor="#F2F2F0" />
            <stop offset=".6" stopColor="#B4B4B0" />
            <stop offset="1" stopColor="#7A7A76" />
          </radialGradient>
          <filter id={`${id}ms`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" floodColor="#1C2230" floodOpacity=".45" />
          </filter>
          <clipPath id={`${id}cl`}>
            <circle cx={V / 2} cy={V / 2} r={radio} />
          </clipPath>
        </defs>
        <circle cx={V / 2} cy={V / 2} r={radio} fill={oceano ? `url(#${id}mar)` : '#F7F1E4'} />
        <g clipPath={`url(#${id}cl)`}>
          <path d={lineas} fill="none" stroke={oceano ? 'rgba(255,255,255,.35)' : 'rgba(28,34,48,.08)'} strokeWidth={oceano ? 0.8 : 1} />
          {trazados.map((p) => {
            const r = rellenos[p.iso]
            const f = r ?? { f: oceano ? '#F3EBDA' : '#E6DCC6' }
            return (
              <path
                key={p.iso}
                d={p.d}
                fill={f.f}
                stroke={f.s ?? (oceano ? '#FFFDF8' : 'rgba(28,34,48,.16)')}
                strokeWidth={f.w ?? (oceano ? 1.2 : 0.8)}
                strokeLinejoin="round"
                onClick={onPais ? tocar(() => onPais(p.iso)) : undefined}
                style={{ cursor: onPais && (oceano || r) ? 'pointer' : 'inherit', transition: 'fill .35s' }}
              />
            )
          })}
          {monedas.map((m) => (
            <g key={m.clave} transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)})`} onClick={onMarca ? tocar(() => onMarca(m.clave)) : undefined} style={{ cursor: onMarca ? 'pointer' : 'inherit' }}>
              {m.brillo && <circle r="15" fill="#FFF3D0" opacity=".85" />}
              {m.tipo === 'tinta' ? <circle r="3.4" fill="#1C2230" stroke="#FFFDF8" strokeWidth="1.4" /> : <circle r="6" fill={`url(#${id}${m.tipo})`} stroke="#FFFDF8" strokeWidth="1.4" filter={`url(#${id}ms)`} />}
              {onMarca && <circle r="12" fill="transparent" />}
            </g>
          ))}
        </g>
        {oceano ? <ellipse cx="70" cy="52" rx="44" ry="22" transform="rotate(-30 70 52)" fill="rgba(255,255,255,.22)" style={{ pointerEvents: 'none' }} /> : <circle cx={V / 2} cy={V / 2} r={V / 2} fill={`url(#${id}som)`} style={{ pointerEvents: 'none' }} />}
      </svg>
    </div>
  )
}
