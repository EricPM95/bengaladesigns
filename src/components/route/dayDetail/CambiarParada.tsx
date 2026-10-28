import { useEffect, useRef } from 'react'
import type { Stop } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { fechaDelDia } from '../../../lib/nombreDeDia'
import { cambiarParadaPorOtra } from '../../../lib/cambiarParada'
import { displayStopName } from '../../../lib/format'
import { PlaceExplorerScreen } from '../placeExplorer/PlaceExplorerScreen'
import { AddStopScreen } from '../addStop/AddStopScreen'

/** (10N8, 8b-c) El título de «Cambiar parada»: «Cambiar Via dei Fori Imperiali», «Cambiar Coliseo» (sin artículo y sin el día; si no cabe, en dos líneas). */
export const tituloDeCambiarParada = (nombre: string) => `Cambiar ${displayStopName(nombre)}`

/**
 * «Cambiar parada» del menú «···» de una parada de DÍAS (Tanda 7, punto 16): abre EXPLORAR (el explorador de lugares compartido, `PlaceExplorerScreen`) SIN filtros puestos (10N8: como se abre EXPLORAR siempre) y con el título «Cambiar {parada}». El botón de cada tarjeta es ⇄; al tocarlo, ese sitio ocupa el lugar de la parada, en su día y a su hora, con [Deshacer] (`cambiarConDeshacer`), y se vuelve a DÍAS.
 * Un destino sin catálogo propio (sin explorador de lugares) usa el buscador de siempre de «Añadir parada», con el mismo resultado.
 */
export function CambiarParada({ open, dayId, stop, city, sembrar, onClose }: { open: boolean; dayId: string; stop: Stop; city: string; sembrar: () => void; onClose: () => void }) {
  const route = useRouteStore((state) => state.route)
  const pool = useDestinationPool(city, open)
  // Un solo cambio por apertura: el ⇄ espera a la foto del sitio (hasta 1,5 s), y un segundo toque no debe dejar un «Deshacer» que devuelva un viaje ya cambiado.
  const yaCambiada = useRef(false)
  useEffect(() => {
    if (open) yaCambiada.current = false
  }, [open])
  const day = route?.days.find((candidate) => candidate.id === dayId)
  if (!open || !route || !day) return null

  const cambiar = (nueva: Stop) => {
    if (yaCambiada.current) return
    yaCambiada.current = true
    cambiarParadaPorOtra(dayId, stop, nueva, sembrar)
    onClose()
  }

  if (pool.resolved && pool.places.length === 0) {
    return (
      <AddStopScreen
        route={route}
        city={city}
        dayNumber={day.dayNumber}
        open
        beforeStopName={null}
        afterStopName={null}
        anchorCoordinates={stop.coordinates}
        dayMarkers={[]}
        initialQuery={undefined}
        onPick={cambiar}
        onClose={onClose}
      />
    )
  }
  if (!pool.resolved) return null
  return (
    <PlaceExplorerScreen
      open
      destination={city}
      places={pool.places}
      title={tituloDeCambiarParada(stop.name)}
      route={route}
      dayNumber={day.dayNumber}
      dateIso={fechaDelDia(route, day.dayNumber)}
      cambiarParada={{ nombre: stop.name, onElegir: cambiar }}
      onClose={onClose}
    />
  )
}
