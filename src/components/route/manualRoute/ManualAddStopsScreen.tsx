import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { addDaysToIso } from '../../../lib/dateRange'
import { alDia, diaCorto } from '../../../lib/nombreDeDia'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { isNameAlreadyInRoute, buildRouteStopEntries } from '../../../lib/routeStopsIndex'
import { useRouteStore } from '../../../store/useRouteStore'
import { useAddFlowStore, withUndo } from '../../../store/useAddFlowStore'
import { PlaceExplorerScreen, placeholderPhoto, stopFromPlace } from '../placeExplorer/PlaceExplorerScreen'

/**
 * [Añadir parada] de un día de una ruta a mano (Tanda 6y, parte C): EXPLORAR con la lista completa del destino y el modo de elegir varios sitios (el de la 6g). Los marcados van a
 * ESTE día, uno detrás de otro y en el orden en que se marcaron, sin hora (la hora es del viajero) y sin que la app ordene, complete ni quite nada. La lista va ordenada para
 * una ruta a mano (más «me gusta» de verdad, imprescindibles, nivel 1 y el resto: ver `compareManualExplorer`) y lo que ya está en otro día lleva «En tu día 2»
 * (con fechas, «En tu lun 13»): lo pone el propio EXPLORAR al ver `route.planMode === 'manual'`.
 */
export function ManualAddStopsScreen({ route, dayId, onClose }: { route: Route; dayId: string; onClose: () => void }) {
  const day = route.days.find((candidate) => candidate.id === dayId) ?? null
  const city = day?.city ?? route.destination
  const { places, excursions, resolved } = useDestinationPool(city, true)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const range = route.answers.dateRange

  const toggle = (name: string) => setSelected((previous) => (previous.includes(name) ? previous.filter((item) => item !== name) : [...previous, name]))

  const confirm = async () => {
    if (busy || !day || selected.length === 0) return
    setBusy(true)
    // Lo que ya está en ESTE día no se repite; el resto va en el orden en que se marcó.
    const inThisDay = buildRouteStopEntries({ ...route, days: [day] })
    const chosen = selected.map((name) => places.find((place) => place.name === name)).filter((place): place is NonNullable<typeof place> => Boolean(place) && !isNameAlreadyInRoute(place!.name, inThisDay))
    const stops = await Promise.all(
      chosen.map(async (place) => {
        const photo = await Promise.race([fetchPlacePhoto(place.photo_name ?? place.name, city, place.wikipedia_title), new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))]).catch(() => null)
        return stopFromPlace(place, photo ?? placeholderPhoto(place.name))
      }),
    )
    setBusy(false)
    if (stops.length > 0) {
      withUndo(`Añadido ${alDia(route, day.dayNumber)}`, () => {
        for (const stop of stops) useRouteStore.getState().addPlaceToDay(dayId, stop, null)
      })
      useAddFlowStore.setState({ focusStopId: stops[0].id })
    }
    useRouteStore.getState().setActiveDayId(dayId)
    onClose()
  }

  if (!resolved) return null
  return (
    <PlaceExplorerScreen
      open
      destination={city}
      places={places}
      excursions={excursions}
      title={`Añadir parada — ${day ? diaCorto(route, day.dayNumber) : city}`}
      subtitle={city}
      initialFilters={[]}
      route={route}
      dayNumber={day?.dayNumber ?? null}
      dateIso={day && range ? addDaysToIso(range.start, day.dayNumber - 1) : null}
      pickMode={{
        confirmLabel: (n) => (n > 0 ? `Añadir a mi día (${n})` : 'Añadir a mi día'),
        selected,
        onToggle: toggle,
        onConfirm: confirm,
        busy,
        hint: 'Marca los sitios que quieres ver ese día',
      }}
      onClose={onClose}
    />
  )
}
