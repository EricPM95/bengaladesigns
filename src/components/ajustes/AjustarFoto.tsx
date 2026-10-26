import { useEffect, useRef, useState, type PointerEvent as EventoPuntero, type ReactNode, type WheelEvent as EventoRueda } from 'react'
import { ENCUADRE_CENTRADO, ZOOM_MAXIMO, limitarEncuadre, parteVisible, type Encuadre } from '../../lib/encuadreFoto'
import { FotoEncuadrada } from '../ui/FotoEncuadrada'

/**
 * AJUSTAR LA FOTO AL CÍRCULO (Tanda 10N3, §3b.4): el círculo con la foto entera dentro; se mueve con un dedo y se acerca o aleja con dos (pinch). La rueda del ratón y la barra de abajo hacen lo mismo
 * (para quien no pueda hacer el gesto). No guarda nada: avisa con `onCambio` y quien lo usa decide cuándo [Guardar].
 */
export function AjustarFoto({ src, encuadre, onCambio, tam = 208 }: { src: string; encuadre: Encuadre | null; onCambio: (e: Encuadre) => void; tam?: number }): ReactNode {
  const [aspecto, setAspecto] = useState(1)
  const actual = limitarEncuadre(encuadre ?? ENCUADRE_CENTRADO, aspecto)
  const punteros = useRef(new Map<number, { x: number; y: number }>())
  const previo = useRef<{ dist: number } | null>(null)
  const vivo = useRef(actual)
  vivo.current = actual

  useEffect(() => {
    let cancelado = false
    const i = new Image()
    i.onload = () => {
      if (!cancelado && i.naturalWidth > 0 && i.naturalHeight > 0) setAspecto(i.naturalWidth / i.naturalHeight)
    }
    i.src = src
    return () => {
      cancelado = true
    }
  }, [src])

  const poner = (e: Encuadre) => onCambio(limitarEncuadre(e, aspecto))
  const acercar = (factor: number) => {
    const a = vivo.current
    poner({ ...a, zoom: Math.min(ZOOM_MAXIMO, Math.max(1, a.zoom * factor)) })
  }

  const alBajar = (ev: EventoPuntero<HTMLDivElement>) => {
    try {
      ev.currentTarget.setPointerCapture(ev.pointerId)
    } catch {
      /* un puntero que no es de verdad (pruebas): sin captura */
    }
    punteros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    previo.current = punteros.current.size === 2 ? { dist: distancia() } : null
  }
  const distancia = () => {
    const [a, b] = [...punteros.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  const alMover = (ev: EventoPuntero<HTMLDivElement>) => {
    const antes = punteros.current.get(ev.pointerId)
    if (!antes) return
    const a = vivo.current
    if (punteros.current.size === 1) {
      // Un dedo: mover. Lo que se ve es `vw`/`vh` de la foto repartido en `tam` píxeles.
      const { vw, vh } = parteVisible(aspecto, a.zoom)
      poner({ ...a, x: a.x - ((ev.clientX - antes.x) / tam) * vw, y: a.y - ((ev.clientY - antes.y) / tam) * vh })
      punteros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    } else if (punteros.current.size === 2) {
      // Dos dedos: acercar o alejar (la distancia entre ellos manda).
      punteros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      const d = distancia()
      if (previo.current && previo.current.dist > 0 && d > 0) poner({ ...a, zoom: Math.min(ZOOM_MAXIMO, Math.max(1, a.zoom * (d / previo.current.dist))) })
      previo.current = { dist: d }
    }
  }
  const alSoltar = (ev: EventoPuntero<HTMLDivElement>) => {
    punteros.current.delete(ev.pointerId)
    previo.current = punteros.current.size === 2 ? { dist: distancia() } : null
  }
  const alRodar = (ev: EventoRueda<HTMLDivElement>) => acercar(ev.deltaY < 0 ? 1.1 : 1 / 1.1)

  return (
    <div className="flex flex-col items-center gap-3" data-ajustar-foto>
      <div
        data-visor-foto
        role="img"
        aria-label="Tu foto dentro del círculo. Arrástrala para moverla y junta o separa dos dedos para acercarla."
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onWheel={alRodar}
        style={{ position: 'relative', width: tam, height: tam, borderRadius: '50%', overflow: 'hidden', background: '#EDE4D3', touchAction: 'none', cursor: 'grab', boxShadow: '0 0 0 3px #FFFDF8,0 0 0 4.5px rgba(28,34,48,.25)' }}
      >
        <FotoEncuadrada src={src} encuadre={actual} datos="ajustar" />
      </div>
      <label className="flex w-full max-w-[260px] items-center gap-3 text-[12px] text-text/60">
        <span aria-hidden="true">−</span>
        <input type="range" min={1} max={ZOOM_MAXIMO} step={0.01} value={actual.zoom} onChange={(e) => poner({ ...actual, zoom: Number(e.target.value) })} aria-label="Acercar o alejar la foto" data-zoom-foto className="h-11 flex-1 accent-[#1C2230]" />
        <span aria-hidden="true">+</span>
      </label>
    </div>
  )
}
