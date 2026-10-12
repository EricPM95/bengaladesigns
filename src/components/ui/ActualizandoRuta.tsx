/** Encima de la cabecera, el calendario (130) y las hojas, pero sin tapar nada: es una barrita de 3 px y una pastilla pequeña. */
export const ACTUALIZANDO_Z = 140

/**
 * (Tanda 6y7) EL aviso de «estoy rehaciendo tu ruta», una sola pieza para toda la app: una barrita fina arriba del todo y, debajo, una pastilla pequeña «Actualizando tu ruta…».
 * No tapa nada y no bloquea nada (el viajero sigue en su pantalla). Sustituye a la pantalla de carga antigua en los cambios y rehacer. Si el rehacer falla, la pastilla lo dice y
 * ofrece [Reintentar] o [Dejarla como estaba].
 */
export function ActualizandoRuta({ error, onReintentar, onDejarla }: { error?: string; onReintentar?: () => void; onDejarla?: () => void }) {
  return (
    <div data-actualizando-ruta className="pointer-events-none fixed inset-x-0 top-0 flex flex-col items-center" style={{ zIndex: ACTUALIZANDO_Z }}>
      <div aria-hidden="true" className="h-[3px] w-full overflow-hidden bg-accent/15">
        {!error && <div className="actualizando-barra h-full w-1/3 rounded-full bg-accent" />}
      </div>
      <div
        role="status"
        aria-live="polite"
        className="mt-2 flex items-center gap-2 rounded-full border border-text/10 bg-bg-card px-3 py-1 text-[12.5px] font-medium text-text shadow-[0_8px_18px_-10px_rgba(28,34,48,.5)]"
        style={{ marginTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
      >
        {error ? (
          <>
            <span>No se pudo actualizar tu ruta.</span>
            <button type="button" onClick={onReintentar} className="pointer-events-auto font-semibold text-accent underline underline-offset-2">
              Reintentar
            </button>
            <button type="button" onClick={onDejarla} className="pointer-events-auto font-semibold text-text-soft underline underline-offset-2">
              Dejarla como estaba
            </button>
          </>
        ) : (
          <span>Actualizando tu ruta…</span>
        )}
      </div>
    </div>
  )
}
