import { useEffect } from 'react'
import type { GenerationStatus } from '../../lib/useRouteGeneration'

/**
 * (Tanda 6y7) La pantalla de espera cuando hay que generar un viaje y no hay otra pantalla donde dejar al viajero: abrir un enlace compartido y retomar una generación a medias al abrir la app.
 * Sustituye a la pantalla vieja de carga («Creando tu ruta», el avión y sus pasos): el fondo de la app, un texto pequeño «Preparando tu viaje…» y una barrita fina (la misma que la del aviso de rehacer la ruta).
 * Cuando la ruta está lista pasa a ella sin más.
 */
export function PreparandoViaje({
  status,
  errorMessage,
  onFinish,
  onRetry,
}: {
  status: GenerationStatus
  errorMessage?: string | null
  onFinish: () => void
  onRetry: () => void
}) {
  useEffect(() => {
    if (status === 'done') onFinish()
  }, [status, onFinish])

  return (
    <div data-preparando-viaje className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
      {status === 'error' ? (
        <>
          <p role="alert" className="text-[14px] text-text">
            {errorMessage ?? 'No se pudo preparar tu viaje.'}
          </p>
          <button type="button" onClick={onRetry} className="rounded-full btn-champan px-5 py-2 text-[14px] font-semibold ">
            Reintentar
          </button>
        </>
      ) : (
        <>
          <p role="status" aria-live="polite" className="text-[13px] font-medium text-text-soft">
            Preparando tu viaje…
          </p>
          <div aria-hidden="true" className="h-[3px] w-40 overflow-hidden rounded-full bg-accent/15">
            <div className="actualizando-barra h-full w-1/3 rounded-full bg-accent" />
          </div>
        </>
      )}
    </div>
  )
}
