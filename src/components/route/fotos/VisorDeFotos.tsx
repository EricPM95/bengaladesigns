import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icono } from '../../ui/Icono'

/**
 * La foto de una ficha en GRANDE (6-nov, RETOQUES_TARJETAS §3): al tocar la foto de arriba de la ficha se abre a pantalla completa. Se cierra con la X, con Escape o deslizando hacia abajo; se amplía con los dos dedos
 * (o con doble toque); y si el sitio tiene varias fotos, se pasan deslizando a los lados. Las fotos propias no llevan crédito. Una sola pieza para todos los destinos.
 */
export function VisorDeFotos({ fotos, nombre, onCerrar, inicial = 0 }: { fotos: string[]; nombre: string; onCerrar: () => void; inicial?: number }) {
  const [indice, setIndice] = useState(Math.min(inicial, Math.max(0, fotos.length - 1)))
  const [zoom, setZoom] = useState(1)
  const [mov, setMov] = useState({ x: 0, y: 0 })
  const [arrastrando, setArrastrando] = useState(false)
  const puntos = useRef(new Map<number, { x: number; y: number }>())
  const inicio = useRef<{ x: number; y: number; zoom: number; mov: { x: number; y: number }; distancia: number } | null>(null)
  const ultimoToque = useRef(0)

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
      if (evento.key === 'ArrowRight') setIndice((i) => Math.min(fotos.length - 1, i + 1))
      if (evento.key === 'ArrowLeft') setIndice((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar, fotos.length])

  const distanciaDe = () => {
    const [a, b] = [...puntos.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  const alBajar = (evento: React.PointerEvent) => {
    ;(evento.currentTarget as HTMLElement).setPointerCapture?.(evento.pointerId)
    puntos.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY })
    inicio.current = { x: evento.clientX, y: evento.clientY, zoom, mov, distancia: distanciaDe() }
    setArrastrando(true)
    // Doble toque: amplía o vuelve.
    if (puntos.current.size === 1) {
      const ahora = Date.now()
      if (ahora - ultimoToque.current < 300) {
        setZoom((z) => (z > 1 ? 1 : 2.5))
        setMov({ x: 0, y: 0 })
      }
      ultimoToque.current = ahora
    }
  }
  const alMover = (evento: React.PointerEvent) => {
    if (!puntos.current.has(evento.pointerId) || !inicio.current) return
    puntos.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY })
    if (puntos.current.size >= 2 && inicio.current.distancia > 0) {
      setZoom(Math.min(5, Math.max(1, (inicio.current.zoom * distanciaDe()) / inicio.current.distancia)))
      return
    }
    const dx = evento.clientX - inicio.current.x
    const dy = evento.clientY - inicio.current.y
    if (zoom > 1) setMov({ x: inicio.current.mov.x + dx, y: inicio.current.mov.y + dy })
    else setMov({ x: dx, y: dy })
  }
  const alSoltar = (evento: React.PointerEvent) => {
    puntos.current.delete(evento.pointerId)
    if (puntos.current.size > 0) {
      inicio.current = { x: evento.clientX, y: evento.clientY, zoom, mov, distancia: distanciaDe() }
      return
    }
    setArrastrando(false)
    if (zoom <= 1.02) {
      setZoom(1)
      // Sin ampliar: hacia abajo cierra; a los lados pasa a la otra foto.
      if (mov.y > 110 && Math.abs(mov.y) > Math.abs(mov.x)) {
        onCerrar()
        return
      }
      if (Math.abs(mov.x) > 70 && Math.abs(mov.x) > Math.abs(mov.y)) setIndice((i) => (mov.x < 0 ? Math.min(fotos.length - 1, i + 1) : Math.max(0, i - 1)))
      setMov({ x: 0, y: 0 })
    }
    inicio.current = null
  }

  if (fotos.length === 0) return null
  const cierre = zoom <= 1 ? Math.max(0, 1 - Math.max(0, mov.y) / 600) : 1
  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center"
      style={{ backgroundColor: `rgba(28,34,48,${0.94 * cierre})`, touchAction: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${nombre}`}
      data-visor-foto
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
    >
      <img
        src={fotos[indice]}
        alt={nombre}
        draggable={false}
        data-visor-imagen
        className="max-h-full max-w-full select-none object-contain"
        style={{ transform: `translate(${mov.x}px, ${mov.y}px) scale(${zoom})`, transition: arrastrando ? 'none' : 'transform .2s ease-out' }}
      />
      <button type="button" onClick={onCerrar} onPointerDown={(e) => e.stopPropagation()} aria-label="Cerrar la foto" data-visor-cerrar className="zona-toque absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFDF8] text-[#1C2230]">
        <Icono nombre="cerrar" size={16} />
      </button>
      {fotos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-1.5" data-visor-puntos>
          {fotos.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === indice ? 'bg-[#FFFDF8]' : 'bg-[#FFFDF8]/40'}`} />
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
