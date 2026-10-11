import { useState } from 'react'
import { Icono } from '../../ui/Icono'
import { useRouteStore } from '../../../store/useRouteStore'
import { useAddFlowStore, withUndo } from '../../../store/useAddFlowStore'
import { pedirOrdenDelDia, puedeReorganizar } from '../../../lib/reorganizarDia'
import type { DayPlan } from '../../../lib/types'

/**
 * «Reorganizar este día» (Tanda 6y, punto 3): junto a «Añadir parada», en cada día con dos paradas o más (la ruta a mano y los días de la nuestra que el viajero ha cambiado a mano).
 * Pone las mismas paradas en el orden de nuestros días escritos (solo ordena: no añade, no quita, no mueve de día). Sale «Día reorganizado» con «Deshacer»; si ya estaba bien,
 * «Tu día ya está en buen orden» y no cambia nada. La regla vive en el servidor, en un solo sitio (shared/routeEngine/reorganizarDia.js).
 */
export function ReorganizarDia({ day }: { day: DayPlan }) {
  const [trabajando, setTrabajando] = useState(false)
  if (!puedeReorganizar(day)) return null

  const reorganizar = async () => {
    if (trabajando) return
    const { route, reservations, reorganizeDay } = useRouteStore.getState()
    const actual = route?.days.find((other) => other.id === day.id)
    if (!route || !actual) return
    setTrabajando(true)
    const orden = await pedirOrdenDelDia(route, actual, reservations)
    setTrabajando(false)
    if (!orden) {
      useAddFlowStore.setState({ toast: { message: 'Ahora no se ha podido reorganizar. Prueba de nuevo.', previous: null, id: Date.now() } })
      return
    }
    if (!orden.changed) {
      useAddFlowStore.setState({ toast: { message: 'Tu día ya está en buen orden', previous: null, id: Date.now() } })
      return
    }
    withUndo('Día reorganizado', () => reorganizeDay(day.id, orden.order, orden.mealAfter))
  }

  return (
    <button
      type="button"
      onClick={reorganizar}
      disabled={trabajando}
      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-medium text-text/70 transition-colors hover:bg-bg-hover disabled:opacity-60"
    >
      <Icono nombre="reorg" size={16} />
      Reorganizar este día
    </button>
  )
}
