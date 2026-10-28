import { useMemo, useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { alDia, ElDia } from '../../../lib/nombreDeDia'
import { esDiaDeExcursion } from '../../../lib/tituloDelDia'
import { HojaDia, filasDeDias } from '../../ui/HojaDia'
import type { Stop } from '../../../lib/types'

/**
 * «MOVER A OTRO DÍA» (Tanda 10N8, 3i): la hoja de elegir día de toda la app (`HojaDia`, `Piezas/Hoja Dia`). Antes era una ruedita dentro del menú de la parada. Salen todos los días del viaje: el de ahora y el de
 * una excursión entera, apagados con su porqué; los demás se pueden elegir (al mover una parada nunca se bloquea un día porque tenga entradas o cosas tuyas: solo se mueve esa parada).
 * El botón dice qué pasa: «Pasar al miércoles 11».
 */
export function MoverADia({ stop, dayId, onMover, onCerrar }: { stop: Stop; dayId: string; onMover: (dayId: string) => void; onCerrar: () => void }) {
  const route = useRouteStore((state) => state.route)
  const dias = useMemo(() => (route ? route.days.filter((day) => !day.isReturnLeg) : []), [route])
  const [elegido, setElegido] = useState<string | null>(null)
  if (!route) return null
  const filas = filasDeDias(route, dias, (day) => (day.id === dayId ? (stop.isFreeTour ? 'El Free Tour ya está en ese día.' : 'Ya está en ese día.') : esDiaDeExcursion(day) ? `${ElDia(route, day.dayNumber)} es el día de tu excursión.` : null))
  const primero = filas.find((fila) => !fila.bloqueo)?.id ?? null
  const idElegido = elegido ?? primero
  const dia = dias.find((day) => day.id === idElegido) ?? null
  return (
    <HojaDia
      etiqueta={stop.isFreeTour ? 'Free Tour' : stop.name}
      titulo={stop.isFreeTour ? '¿A qué día lo pasamos?' : '¿A qué día la pasamos?'}
      filas={filas}
      elegido={idElegido}
      onElegir={setElegido}
      boton={dia ? `Pasar ${alDia(route, dia.dayNumber)}` : 'Elige un día'}
      onConfirmar={() => dia && onMover(dia.id)}
      onCerrar={onCerrar}
      z={100}
      datos="mover-a-dia"
    />
  )
}
