import { createPortal } from 'react-dom'
import type { ResumenViaje } from '../../lib/viajesPerfil'
import { AlbumDeViaje } from './AlbumDeViaje'

/**
 * La ficha de un viaje (Tanda 6z6 y 6z6b), en el Perfil, a PANTALLA COMPLETA: arriba el botón [‹ Volver] (a la lista de «Mis viajes»); debajo el destino, las fechas, el resumen («4 días · 23 paradas»),
 * [Abrir este viaje] y su álbum de fotos. `abierto`: es el viaje que ahora mismo está en la app (no hace falta abrirlo). Con relleno de abajo para que nada quede bajo la barra.
 */
export function FichaDeViaje({ viaje, abierto, onVolver, onAbrir }: { viaje: ResumenViaje; abierto: boolean; onVolver: () => void; onAbrir: () => void }) {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Viaje a ${viaje.destino}`} className="fixed inset-0 z-[70] flex flex-col bg-bg text-text">
      <header className="flex h-14 shrink-0 items-center px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={onVolver} aria-label="Volver a mis viajes" className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-text transition-colors hover:bg-text/[.06]">
          <span aria-hidden="true" className="text-[20px] leading-none">‹</span>
          Volver
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <h2 className="font-display text-[28px] leading-tight text-text">{viaje.destino}</h2>
        {viaje.cuando && <p className="mt-0.5 text-[13.5px] text-text/60">{viaje.cuando}</p>}
        <p className="mt-0.5 text-[13.5px] text-text/60">{viaje.resumen}</p>
        {viaje.destinos.length > 1 && <p className="mt-0.5 text-[13px] text-text/55">{viaje.destinos.map((d) => d.ciudad).join(' · ')}</p>}
        {abierto ? (
          <span className="mt-3 inline-flex h-9 items-center rounded-full bg-accent/15 px-3 text-[12.5px] font-semibold text-accent">Abierto</span>
        ) : (
          viaje.guardado && (
            <button type="button" onClick={onAbrir} className="mt-3 flex h-11 items-center rounded-full border border-text/15 px-4 text-[13.5px] font-semibold text-text transition-colors hover:bg-bg-hover">
              Abrir este viaje
            </button>
          )
        )}
        <div className="mt-6">
          <AlbumDeViaje viaje={viaje} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
