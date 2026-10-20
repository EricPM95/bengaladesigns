import { useEffect, useState } from 'react'
import type { DayPlan, Route } from '../../../lib/types'
import { catalogoEnMemoria, fetchDestinationPlaces } from '../../../lib/destinationPlacesApi'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { displayStopName, formatDuration } from '../../../lib/format'
import { masVisitasDe, posicionDeMenosRodeo, primerHuecoLibre, type DatosDeImportancia, type MasVisita } from '../../../lib/masVisitas'
import { alDia } from '../../../lib/nombreDeDia'
import { pagoActivo } from '../../../lib/pago'
import { useRouteStore } from '../../../store/useRouteStore'
import { withUndo } from '../../../store/useAddFlowStore'
import { HojaAbajo } from '../reservas/HojaAbajo'
import { Icono } from '../../ui/Icono'
import { clasesBotonBorde } from './piezas'

/**
 * «MÁS PARA TU DÍA» EN HOY (Tanda 7, punto 11; de pago). En los días que salieron en una versión recortada, junto a [Visto] y [No me da tiempo], el botón [+ Más visitas]. No depende de «Vas bien de tiempo»: lo pulsa el viajero.
 * Abre una hoja con las paradas de la ruta completa de hoy que la versión recortada dejó fuera, de la más importante a la menos y, a igual importancia, la más cercana primero. [Añadir] la mete en la ruta de hoy donde
 * menos rodeo hace, sin quitar nada, con [Deshacer] (el aviso de abajo de siempre). Solo en esos días y si queda alguna. Qué días y en qué orden: src/lib/masVisitas.ts.
 */

const nivelesDelCatalogo = (destino: string): Record<string, number | null> => {
  const niveles: Record<string, number | null> = {}
  for (const lugar of catalogoEnMemoria(destino)?.places ?? []) if (lugar.kind === 'place') niveles[lugar.name] = lugar.level
  return niveles
}

/** Lo que pesa cada sitio del destino (imprescindible, nivel 1, 2, 3), de los datos: la importancia del servidor y el nivel del catálogo. Lo que ya está en memoria sale en el primer pintado. */
export function useDatosDeImportancia(destino: string): DatosDeImportancia {
  const info = useDestinationExcursions(destino)
  const [niveles, setNiveles] = useState<Record<string, number | null>>(() => nivelesDelCatalogo(destino))
  useEffect(() => {
    let vivo = true
    fetchDestinationPlaces(destino).then(() => vivo && setNiveles(nivelesDelCatalogo(destino)))
    return () => {
      vivo = false
    }
  }, [destino])
  return { importanciaPorSitio: info.importanciaPorSitio, nivelPorSitio: niveles }
}

/** Lo que ofrece el botón y la hoja de un día: vacío si no es un día recortado o no queda nada. */
export function useMasVisitas(route: Route, day: DayPlan): MasVisita[] {
  const datos = useDatosDeImportancia(route.destination)
  if (!pagoActivo()) return []
  return masVisitasDe(route, day, datos)
}

/** [+ Más visitas]: del aspecto de [No me da tiempo] (borde claro sobre la tarjeta oscura). */
export function BotonMasVisitas({ onClick, claro = false }: { onClick: () => void; claro?: boolean }) {
  return (
    <button type="button" onClick={onClick} data-mas-visitas className={`flex h-11 w-full items-center justify-center gap-[7px] rounded-full text-[14px] font-semibold ${clasesBotonBorde(claro)}`}>
      <Icono nombre="anadir" size={15} grosor={1.8} />
      Más visitas
    </button>
  )
}

/** Añade la visita a la ruta de hoy donde menos rodeo hace (nunca antes de lo ya visto o saltado), sin quitar nada, con [Deshacer]. */
export function anadirMasVisita(route: Route, day: DayPlan, visita: MasVisita): void {
  const actual = useRouteStore.getState().route?.days.find((candidato) => candidato.id === day.id)
  if (!actual) return
  const hueco = posicionDeMenosRodeo(actual.stops, visita.stop.coordinates, primerHuecoLibre(actual.stops))
  withUndo(`Añadido ${alDia(route, day.dayNumber)}`, () => useRouteStore.getState().addSpareStop(day.id, visita.stop.id, hueco))
}

/** La hoja «Más para tu día». */
export function HojaMasVisitas({ visitas, onAnadir, onCerrar }: { visitas: MasVisita[]; onAnadir: (visita: MasVisita) => void; onCerrar: () => void }) {
  return (
    <HojaAbajo titleId="mas-para-tu-dia" onClose={onCerrar} capa={90}>
      <div data-hoja-mas-visitas className="flex flex-col gap-3 pb-1">
        <div className="flex flex-col gap-1.5 pr-10">
          <h2 id="mas-para-tu-dia" className="font-display text-[26px] leading-[1.1] text-text">
            Más para tu día
          </h2>
          <p className="text-[13.5px] leading-[1.4] text-text/65">Estas visitas son de la ruta completa de hoy. Si vas bien, añade las que quieras.</p>
        </div>
        <ul className="flex flex-col divide-y divide-text/[.08]">
          {visitas.map((visita) => (
            <li key={visita.stop.id} data-mas-visita={visita.stop.name} className="flex items-center gap-3 py-3">
              {visita.stop.photoUrl ? <img src={visita.stop.photoUrl} alt="" loading="lazy" className="h-14 w-14 flex-none rounded-xl bg-text/10 object-cover" /> : <span className="h-14 w-14 flex-none rounded-xl bg-text/10" aria-hidden="true" />}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-display text-[17px] leading-[1.15] text-text [overflow-wrap:anywhere]">{displayStopName(visita.stop.name)}</span>
                <span className="text-[12px] leading-[1.35] text-text/60">
                  {formatDuration(visita.stop.durationMinutes)}
                  {visita.peso === 0 ? ' · Imprescindible' : ''}
                </span>
              </span>
              <button type="button" onClick={() => onAnadir(visita)} className="h-10 flex-none rounded-full border-[1.5px] border-accent px-4 text-[13px] font-semibold text-accent transition-colors hover:bg-accent-soft">
                Añadir
              </button>
            </li>
          ))}
        </ul>
      </div>
    </HojaAbajo>
  )
}
