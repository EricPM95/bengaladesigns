import { useRef, useState } from 'react'
import { subirFoto, type FotoViaje } from '../../../lib/fotosViaje'
import { useRouteStore } from '../../../store/useRouteStore'

/**
 * El trazo de la cámara, en una constante para cambiarlo cuando llegue la familia nueva de iconos
 * (clave `camara` de docs/diseno/hoy/Iconos y HOY.dc.html). Trazo fino, gris, sin relleno.
 */
export const CAMARA_PATH = 'M4 8.5h3l1.6-2.5h6.8L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z M12 16.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z'

export function IconoCamara({ className = 'h-[22px] w-[22px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={CAMARA_PATH} />
    </svg>
  )
}

/**
 * El botón de la cámara: abre el selector del móvil (hacer una foto o elegirla de la galería) y la
 * sube al día —y a la parada, si se pasa `stopName`— del viaje actual. Muestra «Subiendo…» y, si algo
 * falla, el motivo en palabras sencillas. La ubicación de la foto sale de la parada, nunca de la foto.
 *
 * - `capture`: abre directamente la cámara en vez de dar a elegir (por defecto, el selector normal).
 * - `multiple`: permite elegir varias a la vez.
 * - `children`: si se pasa, sustituye al icono (p. ej. el texto «Subir mis fotos»).
 * - `onSubida`: recibe las fotos que sí se subieron.
 */
export function BotonFoto({
  dayId,
  dayNumber,
  stopName,
  etiqueta,
  capture = false,
  multiple = false,
  className,
  children,
  onSubida,
}: {
  dayId: string
  dayNumber: number
  stopName?: string | null
  etiqueta: string
  capture?: boolean
  multiple?: boolean
  className?: string
  children?: React.ReactNode
  onSubida?: (fotos: FotoViaje[]) => void
}) {
  const tripId = useRouteStore((state) => state.route?.id ?? null)
  const entrada = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function alElegir(event: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!tripId || archivos.length === 0) return
    setSubiendo(true)
    setError(null)
    const hechas: FotoViaje[] = []
    let fallo: string | null = null
    for (const file of archivos) {
      const { foto, error: motivo } = await subirFoto({ tripId, dayId, dayNumber, stopName, file })
      if (foto) hechas.push(foto)
      else fallo = motivo
    }
    setSubiendo(false)
    setError(fallo)
    if (hechas.length > 0) onSubida?.(hechas)
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={subiendo}
        aria-label={etiqueta}
        className={className ?? 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-text/15 text-text-soft transition-colors hover:bg-bg-hover disabled:opacity-60'}
      >
        {subiendo ? <span className="px-2 text-[12px]">Subiendo…</span> : (children ?? <IconoCamara />)}
      </button>
      <input ref={entrada} type="file" accept="image/*" multiple={multiple} {...(capture ? { capture: 'environment' as const } : {})} onChange={alElegir} className="hidden" />
      {error && (
        <span role="alert" className="mt-1 max-w-[220px] text-[12px] leading-snug text-text-soft">
          {error}
        </span>
      )}
    </span>
  )
}
