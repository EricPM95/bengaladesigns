import type { ReactNode } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { HojaAbajo } from '../reservas/HojaAbajo'
import { BotonHoja, DosBotonesHoja } from '../../ui/Hoja'
import { alCambiarElVuelo } from '../../../lib/adaptarVuelos'
import { reorganizarDias } from '../../../lib/reorganizarDia'
import { esDestinoDeCoche } from '../../../lib/experienceCategoryBank'
import { dejarLaZonaComoEsta, nombreCortoDeZona, useZonaDelAlojamientoUi } from '../../../lib/zonaDelAlojamiento'

/**
 * (V64 §6; `Añadir un documento` D6) La hoja «Tu alojamiento está en Monti»: la dirección guardada cae en otra zona que la elegida. [Cambiar a Monti] (dorado) pone la zona nueva y reorganiza (la de siempre:
 * `reorganizarDias`, con su aviso «Hemos reorganizado tu día» y [Deshacer]; en un destino de coche, la adaptación de Lanzarote); [Dejarlo como está] (blanco con borde), lado a lado (`DosBotonesHoja`).
 * Se monta una vez con `AlojamientoHost`; quien guarda la dirección la abre con `revisarLaZonaDelAlojamiento`. Es la hoja de siempre (`HojaAbajo`), con sus botones de siempre.
 */
export function HojaZonaDelAlojamiento(): ReactNode {
  const pregunta = useZonaDelAlojamientoUi((s) => s.pregunta)
  const poner = useZonaDelAlojamientoUi((s) => s.poner)
  const setZona = useRouteStore((s) => s.setAccommodationZone)
  if (!pregunta) return null
  const nueva = nombreCortoDeZona(pregunta.zonaNueva.nombre)
  const elegida = nombreCortoDeZona(pregunta.zonaElegida.nombre)
  const cerrar = () => {
    dejarLaZonaComoEsta(pregunta.clave)
    poner(null)
  }
  const cambiar = () => {
    poner(null)
    setZona(pregunta.zonaNueva.id)
    const route = useRouteStore.getState().route
    void alCambiarElVuelo({ que: 'zona', mitad: null })
    // Un destino de coche (Lanzarote) rehace sus días desde `alCambiarElVuelo`; en los demás, Reorganizar de los días que cambian, con su [Deshacer].
    if (route && !esDestinoDeCoche(route.destination)) void reorganizarDias(route.days.map((d) => d.id))
  }
  return (
    <HojaAbajo titleId="hoja-zona-alojamiento" onClose={cerrar} capa={140}>
      <h2 id="hoja-zona-alojamiento" className="max-w-[calc(100%-3rem)] font-display text-[30px] leading-[1.05] text-text [text-wrap:balance]" data-hoja-titulo="zona-alojamiento">
        Tu alojamiento está en {nueva}
      </h2>
      <p className="mb-5 mt-3 text-[14.5px] font-medium leading-[1.5] text-text" data-zona-alojamiento-texto>
        Elegiste {elegida}, pero tu alojamiento está en {nueva}. ¿Cambiamos tu zona? Tus primeros y últimos días se adaptan a donde duermes.
      </p>
      <DosBotonesHoja>
        <BotonHoja onClick={cambiar} datos="zona-cambiar">
          Cambiar a {nueva}
        </BotonHoja>
        <BotonHoja tipo="secundario" onClick={cerrar} datos="zona-dejar">
          Dejarlo como está
        </BotonHoja>
      </DosBotonesHoja>
    </HojaAbajo>
  )
}
