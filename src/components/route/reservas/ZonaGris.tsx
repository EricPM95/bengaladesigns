import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * LO QUE COMPARTE EL GRUPO, EN GRIS (Tanda 10N §8). Un bloque de RESERVAS que es del dueño del viaje (Llegada y vuelta, Alojamiento) lo ve el invitado exactamente igual que el dueño, con sus datos,
 * pero «los campos para rellenar y los botones de editar, en gris y sin poder tocarlos»: al tocarlos no pasa nada, salvo una línea corta, «Esto lo cambia Eric». Lo único que sigue vivo es lo que abre y
 * cierra el bloque (la cabecera) y lo que lleve `data-activo-invitado` (p. ej. [Buscar alojamiento] cuando el dueño aún no ha puesto alojamiento).
 *
 * Se hace con una capa por encima, no tocando cada botón: en la fase de captura se cortan los clics y el foco en cualquier botón, casilla, lista o enlace que no sea activo. Sin `activo`, no hace nada
 * (el dueño ve su pantalla de siempre, sin una sola línea de más).
 */
export function ZonaGris({ activo, quien, children, className = '' }: { activo: boolean; quien: string; children: ReactNode; className?: string }) {
  const raiz = useRef<HTMLDivElement>(null)
  const [linea, setLinea] = useState(false)
  const temporizador = useRef<number | null>(null)

  const avisar = () => {
    setLinea(true)
    if (temporizador.current) window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setLinea(false), 2600)
  }

  // Lo que se pinta después (al abrir el bloque) también queda apagado para los lectores de pantalla.
  useEffect(() => {
    const el = raiz.current
    if (!activo || !el) return
    const marcar = () => {
      el.querySelectorAll<HTMLElement>('button:not([data-activo-invitado]), input, select, textarea').forEach((c) => {
        c.setAttribute('aria-disabled', 'true')
        if (c instanceof HTMLInputElement || c instanceof HTMLTextAreaElement) c.readOnly = true
      })
    }
    marcar()
    const observador = new MutationObserver(marcar)
    observador.observe(el, { childList: true, subtree: true })
    return () => {
      observador.disconnect()
      if (temporizador.current) window.clearTimeout(temporizador.current)
    }
  }, [activo])

  if (!activo) return <>{children}</>

  const esControl = (objetivo: EventTarget | null): boolean => {
    const el = objetivo as HTMLElement | null
    if (!el?.closest) return false
    if (el.closest('[data-activo-invitado]')) return false
    return Boolean(el.closest('button, input, select, textarea, label, a'))
  }

  return (
    <div
      ref={raiz}
      data-solo-lectura="1"
      className={`${className} [&_[data-activo-invitado]]:cursor-pointer [&_button:not([data-activo-invitado])]:cursor-not-allowed [&_button:not([data-activo-invitado])]:opacity-50 [&_button:not([data-activo-invitado])]:grayscale [&_input]:cursor-not-allowed [&_input]:opacity-50 [&_input]:grayscale [&_select]:opacity-50 [&_select]:grayscale`}
      onClickCapture={(event) => {
        if (!esControl(event.target)) return
        event.preventDefault()
        event.stopPropagation()
        avisar()
      }}
      onFocusCapture={(event) => {
        if (!esControl(event.target)) return
        ;(event.target as HTMLElement).blur?.()
        avisar()
      }}
    >
      {children}
      {linea && (
        <p role="status" data-esto-lo-cambia className="mt-2 px-1 text-center text-[12.5px] leading-snug text-text/65">
          Esto lo cambia {quien || 'el dueño del viaje'}
        </p>
      )}
    </div>
  )
}
