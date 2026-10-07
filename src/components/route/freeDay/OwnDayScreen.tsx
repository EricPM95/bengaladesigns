import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { addDaysToIso } from '../../../lib/dateRange'
import { crearDiaPropio } from '../../../lib/dayInterruptor'
import { useRouteStore } from '../../../store/useRouteStore'
import { useAddFlowStore, withUndo } from '../../../store/useAddFlowStore'
import { PlaceExplorerScreen } from '../placeExplorer/PlaceExplorerScreen'

/**
 * «Crear mi propio día» (Tanda 6g, §7): EXPLORAR en modo elegir varios sitios. El viajero marca los sitios que quiere ver ese día y,
 * al aceptar, la app monta la ruta del día con ellos (el servidor los ordena y pone la comida y la cena). Después se cambia como
 * cualquier día, con «+ Añadir parada».
 */
export function OwnDayScreen({ route, dayId, onClose }: { route: Route; dayId: string; onClose: () => void }) {
  const day = route.days.find((candidate) => candidate.id === dayId) ?? null
  const city = day?.city ?? route.days[0]?.city ?? route.destination
  const { places, excursions, resolved } = useDestinationPool(city, true)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const range = route.answers.dateRange

  const toggle = (name: string) => {
    setFailed(false)
    setSelected((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  const confirm = async () => {
    if (busy || selected.length === 0) return
    setBusy(true)
    setFailed(false)
    const before = useRouteStore.getState().route
    let ok = false
    try {
      ok = await crearDiaPropio(dayId, selected)
    } catch {
      ok = false
    }
    setBusy(false)
    if (!ok) {
      setFailed(true)
      return
    }
    // Vuelta a la pestaña Días con ese día abierto y el aviso corto, con «Deshacer» (vuelve la ruta tal cual estaba).
    useAddFlowStore.setState({ ownDayFlow: null })
    const store = useRouteStore.getState()
    store.setMode('days')
    store.setActiveDayId(dayId)
    const after = store.route
    if (before && after) {
      useRouteStore.setState({ route: before })
      withUndo('Hemos montado tu día', () => useRouteStore.setState({ route: after }))
    } else {
      useAddFlowStore.setState({ toast: { message: 'Hemos montado tu día', previous: null, id: Date.now() } })
    }
  }

  if (!resolved) return null
  const subtitle = day ? `${city} · Día ${day.dayNumber}` : city

  return (
    <>
      <PlaceExplorerScreen
        open
        destination={city}
        places={places}
        excursions={excursions}
        title="Crear mi propio día"
        subtitle={subtitle}
        initialFilters={['atracciones']}
        route={route}
        dayNumber={day?.dayNumber ?? null}
        dateIso={day && range ? addDaysToIso(range.start, day.dayNumber - 1) : null}
        pickMode={{
          confirmLabel: (n) => (n > 0 ? `Montar mi día (${n})` : 'Montar mi día'),
          selected,
          onToggle: toggle,
          onConfirm: confirm,
          busy,
          hint: failed ? 'No hemos podido montar tu día. Prueba otra vez.' : 'Marca los sitios que quieres ver ese día',
        }}
        onClose={onClose}
      />
    </>
  )
}
