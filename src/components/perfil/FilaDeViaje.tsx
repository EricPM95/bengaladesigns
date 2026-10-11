import { BanderaDestino } from '../ui/BanderaDestino'
import { Icono } from '../ui/Icono'
import { plural, textoDeFotos, type ResumenViaje } from '../../lib/viajesPerfil'

/**
 * Un viaje de «Mis viajes» (diseño del Perfil, Tanda 6y4): la bandera del destino (la misma de la tarjeta del destino de RUTA: el cuadrado redondeado con las franjas inclinadas), el destino en grande,
 * debajo su fecha («13 – 16 oct 2026 · 4 días») y sus fotos («155 fotos»), la pastilla «Abierto» si es el viaje que está en la app y la flecha. Tocarlo abre su álbum.
 * Tanda 6y5: debajo, pequeño, [Abrir este viaje] en cada viaje guardado que no es el que ya está abierto (abre el viaje en la app, no el álbum).
 * `fotos`: null mientras se cuentan (no se enseña un «Sin fotos» falso).
 */
export function FilaDeViaje({ viaje, fotos, abierto, onAbrir, onAbrirViaje }: { viaje: ResumenViaje; fotos: number | null; abierto: boolean; onAbrir: () => void; onAbrirViaje: () => void }) {
  const cuando = [viaje.cuando, plural(viaje.dias, 'día', 'días')].filter(Boolean).join(' · ')
  const sePuedeAbrir = !abierto && Boolean(viaje.guardado)
  return (
    <div className={`overflow-hidden rounded-[18px] border bg-white text-[#1C2230] shadow-[0_1px_2px_rgba(28,34,48,.04)] transition-colors hover:border-text/20 ${abierto ? 'border-accent/30' : 'border-text/[.08]'}`}>
      <button type="button" onClick={onAbrir} data-viaje-del-perfil={viaje.id} className="flex min-h-[64px] w-full items-center gap-3 py-2.5 pl-3 text-left">
        <BanderaDestino countryCode={viaje.pais} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-display text-[20px] leading-[1.05]">{viaje.destino}</span>
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-text/60" style={{ font: "500 11.5px 'Geist Mono',monospace" }}>
              {cuando}
            </span>
            {fotos !== null && (
              <span className="flex items-center gap-1 text-[11.5px] font-medium text-text/60" data-fotos-del-viaje>
                <Icono nombre="camara" size={12} />
                {textoDeFotos(fotos)}
              </span>
            )}
          </span>
        </span>
        {abierto && <span className="flex-none rounded-full bg-accent/10 px-[9px] text-[11px] font-semibold leading-6 text-accent-hover">Abierto</span>}
        <Icono nombre="adelante" size={16} className="mr-3 flex-none text-text/40" />
      </button>
      {sePuedeAbrir && (
        <div className="px-3 pb-2.5 pl-[72px]">
          <button type="button" onClick={onAbrirViaje} data-abrir-este-viaje className="h-8 rounded-full border border-text/15 px-3 text-[12px] font-semibold text-text transition-colors hover:bg-bg-hover">
            Abrir este viaje
          </button>
        </div>
      )}
    </div>
  )
}
