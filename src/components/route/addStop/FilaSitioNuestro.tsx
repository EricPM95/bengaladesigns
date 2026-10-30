import type { ReactNode } from 'react'
import type { DestinationPlace } from '../../../lib/destinationPlacesApi'
import { historiaCorta, lineaDeSitio, TITULO_OTROS_SITIOS } from '../../../lib/useSitiosNuestros'
import { Icono } from '../../ui/Icono'

/**
 * (Tanda 10S5, apartado 1) La fila de un sitio NUESTRO en «Añadir parada» y en AttractionsFinder: su foto (o el recuadro neutro mientras llega), su nombre, su horario y si lleva entrada, y su historia en una línea.
 * Lleva `data-sitio-nuestro` para la prueba. `accion` es el botón de la derecha (cada pantalla pone el suyo).
 */
export function FilaSitioNuestro({ place, foto, activa = false, yaEnRuta = false, onClick, accion }: { place: DestinationPlace; foto: string | null; activa?: boolean; yaEnRuta?: boolean; onClick: () => void; accion?: ReactNode }) {
  const historia = historiaCorta(place)
  return (
    <div data-sitio-nuestro={place.name} className={`flex w-full items-center gap-3 rounded-xl border p-2.5 transition-colors ${activa ? 'border-accent bg-accent-soft' : 'border-border hover:bg-bg-hover'}`}>
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {foto ? <img src={foto} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" /> : <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-bg-hover text-text-muted"><Icono nombre="mapa" className="h-5 w-5" /></span>}
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-small font-semibold text-text">{place.name}</span>
            {yaEnRuta && <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-caption font-semibold text-accent-hover">En tu ruta</span>}
          </span>
          <span data-sitio-nuestro-linea className="block truncate text-caption text-text-soft">{lineaDeSitio(place)}</span>
          {historia && <span data-sitio-nuestro-historia className="line-clamp-2 block text-caption text-text-muted">{historia}</span>}
        </span>
      </button>
      {accion}
    </div>
  )
}

/** El título gris de lo que viene del mapa («Otros sitios»), solo cuando hay sitios nuestros encima o resultados del mapa debajo. */
export function TituloOtrosSitios() {
  return (
    <p data-otros-sitios className="px-1 pb-0.5 pt-3 text-caption font-semibold uppercase tracking-wide text-text-muted">
      {TITULO_OTROS_SITIOS}
    </p>
  )
}
