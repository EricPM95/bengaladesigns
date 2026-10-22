import { precioTienda } from '../../../lib/dinero'
import type { ActividadCerca } from '../../../lib/civitatis'
import { openTicketShop } from './EntradaCard'

/**
 * LAS ACTIVIDADES DE UN SITIO (API de consulta, parte 1; solo con el interruptor encendido), en la pestaña «Entradas» de la ficha de un sitio que no tiene entradas escritas a mano: las que
 * hay cerca de sus coordenadas (radio pequeño). Nuestros sitios no traen el número de lugar de Google, así que se busca por coordenadas. Provisional hasta que Design dibuje la suya.
 * Sin nombrar a la empresa; el botón abre el enlace con nuestro código de afiliado y la campaña del viaje (openTicketShop).
 */
export function ActividadesDelSitio({ lista }: { lista: ActividadCerca[] }) {
  if (lista.length === 0) return null
  return (
    <div className="space-y-3" data-actividades-del-sitio>
      {lista.map((actividad) => (
        <div key={actividad.id} className="rounded-[20px] border border-text/[.07] bg-bg-card p-3.5">
          <div className="flex items-baseline justify-between gap-2.5">
            <p className="font-display text-[19px] leading-[1.1] text-text">{actividad.nombre}</p>
            {actividad.gratis ? <span className="font-display text-[22px] leading-none text-text">Gratis</span> : actividad.desde != null && <span className="font-display text-[22px] leading-none text-text">{`Desde ${precioTienda(actividad.desde)}`}</span>}
          </div>
          {(actividad.valoracion != null || actividad.opiniones != null) && (
            <p className="mt-1.5 text-[13px] text-text/72">
              {actividad.valoracion != null && <span className="font-semibold text-text">{actividad.valoracion.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/10</span>}
              {actividad.opiniones != null && <span>{actividad.valoracion != null ? ' · ' : ''}{actividad.opiniones.toLocaleString('es-ES')} opiniones</span>}
            </p>
          )}
          {actividad.puntoDeEncuentro?.texto && <p className="mt-1 text-[13px] leading-[1.45] text-text/72">Punto de encuentro: {actividad.puntoDeEncuentro.texto}</p>}
          {actividad.url && (
            <button type="button" onClick={() => openTicketShop(actividad.url)} className="mt-3 h-11 w-full whitespace-nowrap rounded-full btn-champan text-small font-semibold active:scale-[.97]">
              Reservar
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
