import { useRouteStore } from '../../../store/useRouteStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { lineaAlojamiento } from '../../../lib/tuAlojamiento'
import { Icono } from '../../ui/Icono'

interface AccommodationBlockProps {
  city: string
  /** Id del primer día de esta estancia — clave de `accommodationSelections` en el store. */
  segmentDayId: string
  totalNights: number
}

/**
 * La fila «Añade alojamiento en {destino}» — solo se renderiza en el primer día de cada estancia
 * (ver DayDetailPanel.tsx), con la excepción natural de rutas donde cada día es una parada nueva
 * de 1 noche (roadtrip_exclusivo, etc.): ahí CADA día es ya "el primer día" de su propia estancia
 * de 1 noche, así que el bloque aparece cada día sin necesitar ningún caso especial.
 *
 * Tanda 6z: sin alojamiento abre el mapa de alojamientos a pantalla completa; con el alojamiento que cuenta el viajero se ve con su ✓ verde, su nombre y «3 noches · 420 €», y
 * al tocarla abre «Tu alojamiento» para verlo, cambiarlo o quitarlo. El alojamiento solo informa: no cambia la ruta.
 */
export function AccommodationBlock({ city, segmentDayId, totalNights }: AccommodationBlockProps) {
  const selectedHotel = useRouteStore((state) => state.accommodationSelections[segmentDayId])
  const abrirMapa = useAlojamientoUi((state) => state.abrirMapa)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)

  // (Tanda 6t, diseño «1b»: solo el aspecto. Una fila sin caja: el icono de la cama en un círculo, el texto en cursiva con su línea pequeña y el botón redondo; puesto, el ✓ verde.)
  const VERDE = 'oklch(0.55 0.11 150)'
  const fila = (hecho: boolean, titulo: string, sub: string, accion: string, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-label={accion} className="flex h-12 w-full items-center gap-2.5 rounded-[14px] bg-transparent px-1 text-left text-text">
      <span
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
        style={{ border: `1.5px solid ${hecho ? VERDE : 'rgba(28,34,48,.4)'}`, color: hecho ? VERDE : 'rgba(28,34,48,.4)' }}
      >
        <Icono nombre="cama" size={15} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px whitespace-nowrap">
        <span className="truncate font-display text-[17px] italic leading-[1.1]">{titulo}</span>
        {sub && <span className="text-[11px] text-text/50">{sub}</span>}
      </span>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[16px] font-medium leading-none"
        style={{ background: hecho ? VERDE : '#F1EADC', color: hecho ? '#fff' : 'rgb(var(--accent-hover))' }}
      >
        {hecho ? '✓' : '+'}
      </span>
    </button>
  )

  return (
    <>
      {selectedHotel
        ? fila(true, selectedHotel.name, lineaAlojamiento(selectedHotel, totalNights), 'Ver o cambiar tu alojamiento', () => abrirTuAlojamiento(segmentDayId))
        : fila(false, `Añade alojamiento en ${city}`, '', `Añadir alojamiento en ${city}`, () => abrirMapa(segmentDayId))}
      <div aria-hidden="true" className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(28,34,48,.12),transparent)' }} />
    </>
  )
}
