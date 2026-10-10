import { createPortal } from 'react-dom'
import { CREDITOS } from '../../lib/creditos'

/**
 * La página «Créditos» (Tanda 6z6d): pantalla completa con [‹ Volver], en pequeño, con lo que hay que citar (`src/lib/creditos.ts`). Se abre desde el final del Perfil; no sale en ninguna otra pantalla.
 */
export function Creditos({ onVolver }: { onVolver: () => void }) {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Créditos" className="fixed inset-0 z-[75] flex flex-col bg-bg text-text">
      <header className="flex h-14 shrink-0 items-center gap-1 pl-2 pr-5 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={onVolver} className="flex h-11 items-center gap-1 rounded-full pl-2 pr-3 text-[14px] font-medium text-text transition-colors hover:bg-text/[.06]">
          <span aria-hidden="true">‹</span> Volver
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <h1 className="font-display text-[28px] leading-tight text-text">Créditos</h1>
        <p className="mt-1 text-[12.5px] text-text/60">Lo que nos prestan otros, y de quién es.</p>
        <div className="mt-5 flex flex-col gap-5">
          {CREDITOS.map((credito) => (
            <section key={credito.clave} data-credito={credito.clave}>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-text/55">{credito.titulo}</h2>
              <p className="mt-1.5 text-[12.5px] leading-[1.5] text-text/70">{credito.texto}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
                {credito.enlaces.map((enlace) => (
                  <a key={enlace.url} href={enlace.url} target="_blank" rel="noreferrer" className="text-text/70 underline underline-offset-2 hover:text-text">
                    {enlace.texto}
                  </a>
                ))}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
