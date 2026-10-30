import type { Route } from '../../../lib/types'
import { direccionDelAlojamiento, enlaceComoLlegarAlojamiento } from '../../../lib/direccionAlojamiento'
import { pagoActivo } from '../../../lib/pago'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { useAlojamientoDelViaje } from '../alojamiento/useAlojamientoDelViaje'

/**
 * EL BOTÓN DE LA CAMA EN HOY (Tanda 10N12 §4; solo con el pase). Pequeño, redondo, con una cama de trazo fino gris sin relleno, fijo arriba a la derecha de HOY (junto al título del día)
 * durante TODOS los días del viaje (llegada, medio y vuelta), a cualquier hora. No tapa nada: HoyView deja sitio a la derecha del título.
 *  - Con dirección guardada: abre el camino desde donde esté el viajero hasta su alojamiento (el mismo enlace de [Cómo llegar a tu alojamiento]).
 *  - Con pase y sin dirección: abre la hoja «Tu alojamiento» para ponerla.
 *  - Sin pase: no sale.
 */
export function BotonCamaHoy({ route }: { route: Route }) {
  const viaje = useAlojamientoDelViaje()
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  if (!pagoActivo()) return null
  const direccion = direccionDelAlojamiento(route)
  const enlace = enlaceComoLlegarAlojamiento(direccion)
  const estilo = 'zona-toque absolute right-4 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-text/20 bg-white shadow-sm transition-transform active:scale-95'
  const cama = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.6)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 19V6M3 15h18v4M21 15v-2.5A2.5 2.5 0 0 0 18.5 10H11v5" />
      <circle cx="7" cy="11.5" r="1.6" />
    </svg>
  )
  if (enlace) {
    return (
      <a href={enlace} target="_blank" rel="noopener noreferrer" data-boton-cama-hoy="camino" aria-label="Cómo llegar a tu alojamiento" className={estilo}>
        {cama}
      </a>
    )
  }
  return (
    <button type="button" data-boton-cama-hoy="hoja" aria-label="Pon tu alojamiento" className={estilo} onClick={() => viaje.primeraEstanciaId && abrirTuAlojamiento(viaje.primeraEstanciaId)}>
      {cama}
    </button>
  )
}
