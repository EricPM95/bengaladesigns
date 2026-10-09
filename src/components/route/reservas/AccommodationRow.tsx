import { useRouteStore } from '../../../store/useRouteStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { lineaAlojamiento } from '../../../lib/tuAlojamiento'
import { ReservasItemRow } from './ReservasItemRow'

interface AccommodationRowProps {
  segmentDayId: string
  city: string
  totalNights: number
}

/** Misma clave de store (`accommodationSelections`) y la misma hoja «Tu alojamiento» que la fila del primer día en DIAS — añadir aquí o allí actualiza ambos sitios. El botón de buscar abre el mapa de alojamientos (Tanda 6z). */
export function AccommodationRow({ segmentDayId, city, totalNights }: AccommodationRowProps) {
  const hotel = useRouteStore((state) => state.accommodationSelections[segmentDayId])
  const abrirMapa = useAlojamientoUi((state) => state.abrirMapa)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)

  return (
    <>
      <ReservasItemRow
        kind="accommodation"
        label={`Alojamiento en ${city}`}
        resolved={Boolean(hotel)}
        subtitle={hotel ? `${hotel.name} · ${lineaAlojamiento(hotel, totalNights)}` : undefined}
        priority="yellow"
        onClick={() => abrirTuAlojamiento(segmentDayId)}
        bookAction={{ label: 'Buscar', href: null, onGet: () => abrirMapa(segmentDayId) }}
      />
    </>
  )
}
