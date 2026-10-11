import { createPortal } from 'react-dom'
import type { ResumenViaje } from '../../lib/viajesPerfil'
import { AlbumDeViaje } from './AlbumDeViaje'

/**
 * El álbum de un viaje del Perfil (Tanda 6z6, 6z6b y 6y4), a PANTALLA COMPLETA: arriba el botón [‹ Volver] (a la lista de «Mis viajes»); debajo SOLO el título («Roma»), su fecha («2 – 10 sep 2026») y el álbum
 * con todas las fotos del viaje juntas. Nada más: ni resumen, ni filtros, ni títulos por día o por lugar. Con relleno de abajo para que nada quede bajo la barra.
 */
export function FichaDeViaje({ viaje, onVolver }: { viaje: ResumenViaje; onVolver: () => void }) {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Viaje a ${viaje.destino}`} className="fixed inset-0 z-[70] flex flex-col bg-bg text-text">
      <header className="flex h-14 shrink-0 items-center px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={onVolver} aria-label="Volver a mis viajes" className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-text transition-colors hover:bg-text/[.06]">
          <span aria-hidden="true" className="text-[20px] leading-none">‹</span>
          Volver
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <h2 className="font-display text-[34px] leading-none text-text">{viaje.destino}</h2>
        {viaje.cuando && (
          <p className="mt-1.5 text-text/55" style={{ font: "500 12px 'Geist Mono',monospace", letterSpacing: '.04em' }}>
            {viaje.cuando}
          </p>
        )}
        <div className="mt-5">
          <AlbumDeViaje viaje={viaje} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
