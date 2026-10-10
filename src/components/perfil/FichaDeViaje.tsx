import type { ResumenViaje } from '../../lib/viajesPerfil'
import { Icono } from '../ui/Icono'
import { AlbumDeViaje } from './AlbumDeViaje'

/**
 * La ficha de un viaje (Tanda 6z6), en el Perfil: el destino, las fechas, el resumen («4 días · 23 paradas»), [Abrir este viaje] y debajo su álbum de fotos.
 * `abierto`: es el viaje que ahora mismo está en la app (no hace falta abrirlo).
 */
export function FichaDeViaje({ viaje, abierto, onVolver, onAbrir }: { viaje: ResumenViaje; abierto: boolean; onVolver: () => void; onAbrir: () => void }) {
  return (
    <div>
      <button type="button" onClick={onVolver} className="flex h-11 items-center gap-1.5 text-[13.5px] font-medium text-text-soft">
        <Icono nombre="atras" size={16} />
        Mis viajes
      </button>
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
  )
}
