import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { buildHotelSearchUrl } from '../../../lib/affiliateLinks'
import { addDaysToIso } from '../../../lib/dateRange'
import { useRouteStore } from '../../../store/useRouteStore'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { PlaceExplorerScreen } from '../placeExplorer/PlaceExplorerScreen'
import { AddStopScreen } from '../addStop/AddStopScreen'
import { AddToDaySheet, dayName, type AddItem, type AddedResult } from './AddToDaySheet'

/**
 * La pantalla de añadir del viaje (decisión del usuario, 2026-09-28): la misma de Explorar y "Añadir parada", en modo
 * añadir. Cada sitio lleva "+ Añadir", que pregunta a qué día; al añadir se vuelve a la pestaña Días con ese día abierto
 * y el aviso "Añadido al Día 3 · Compras", con "Deshacer".
 */
export function AddToTripScreen({ route }: { route: Route }) {
  const addFlow = useAddFlowStore((state) => state.addFlow)
  const closeAddFlow = useAddFlowStore((state) => state.closeAddFlow)
  const day = addFlow?.dayId ? (route.days.find((candidate) => candidate.id === addFlow.dayId) ?? null) : null
  const city = day?.city ?? route.days[0]?.city ?? route.destination
  const { places, excursions, resolved } = useDestinationPool(city, addFlow !== null)
  const [item, setItem] = useState<AddItem | null>(null)
  const [previous, setPrevious] = useState<Route | null>(null)

  if (!addFlow) return null

  const open = (next: AddItem) => {
    setPrevious(route)
    setItem(next)
  }
  const title = day ? `Añadiendo a Día ${day.dayNumber} · ${dayName(day)}` : `Añadir a tu viaje`
  const range = route.answers.dateRange

  const done = (result: AddedResult) => {
    finishAdd(result, previous ?? route)
    setItem(null)
  }

  return (
    <>
      {resolved && places.length > 0 ? (
        <PlaceExplorerScreen
          open
          destination={city}
          places={places}
          excursions={excursions}
          title={title}
          subtitle={city}
          route={route}
          dayNumber={day?.dayNumber ?? null}
          dateIso={day && range ? addDaysToIso(range.start, day.dayNumber - 1) : null}
          hotelsUrl={buildHotelSearchUrl(city, range?.start, range?.end)}
          onQuickAdd={(place) => open({ kind: 'place', place })}
          onQuickAddExcursion={(excursion) => open({ kind: 'excursion', excursion })}
          onClose={closeAddFlow}
        />
      ) : (
        resolved &&
        day && (
          // Sin catálogo del destino: el buscador de siempre, que añade al día directamente con la hora sugerida.
          <AddStopScreen
            route={route}
            city={city}
            dayNumber={day.dayNumber}
            open
            beforeStopName={day.stops.at(-1)?.name ?? null}
            afterStopName={null}
            anchorCoordinates={day.stops.at(-1)?.coordinates ?? null}
            dayMarkers={[]}
            onPick={(stop) => {
              const before = route
              useRouteStore.getState().addPlaceToDay(day.id, stop, null)
              finishAdd({ dayId: day.id, stopId: stop.id }, before)
            }}
            onClose={closeAddFlow}
          />
        )
      )}
      {item && <AddToDaySheet route={route} item={item} initialDayId={addFlow.dayId} onClose={() => setItem(null)} onAdded={done} />}
    </>
  )
}

/** Vuelta al día: pestaña Días con el día abierto, desplazado hasta lo nuevo, y el aviso con "Deshacer". */
export function finishAdd(result: AddedResult, previous: Route): void {
  const store = useRouteStore.getState()
  const target = store.route?.days.find((candidate) => candidate.id === result.dayId)
  useAddFlowStore.setState({
    addFlow: null,
    focusStopId: result.stopId,
    toast: target ? { message: `Añadido al Día ${target.dayNumber} · ${dayName(target)}`, previous, id: Date.now() } : null,
  })
  store.setMode('days')
  store.setActiveDayId(result.dayId)
}
