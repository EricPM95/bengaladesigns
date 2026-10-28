import { useState } from 'react'
import type { Excursion, Route } from '../../../lib/types'
import type { Reservation } from '../../../lib/bookings'
import { dayOfReservation } from '../../../lib/bookings'
import { cambiarConDeshacer } from '../../../store/useAddFlowStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { alDia, elDia } from '../../../lib/nombreDeDia'
import { ponerExcursionEnElDia } from '../../../lib/dayInterruptor'
import { hasFullDayExcursion } from '../../../lib/freeDays'
import { isDayPinned } from '../../../lib/bookings'
import { ConfirmDialog } from '../ConfirmDialog'
import { HojaDia, filasDeDias } from '../../ui/HojaDia'

/**
 * (Tanda 10N8, 0a-1) «Volver a ponerla en la ruta»: la excursión que se quitó de la ruta pero se quedó en RESERVAS («Ya no está en tu ruta»). Abre la hoja de elegir día (`HojaDia`) con el día de la reserva ya elegido
 * y, como el día entero pasa a ser la excursión, antes de hacerlo pregunta: «¿Pasamos el jueves 12 a la excursión?» · «Las paradas de ese día salen de tu ruta.» · [Sí, pasar]. Con [Deshacer].
 */
export function VolverExcursionARuta({ route, reserva, excursion }: { route: Route; reserva: Reservation; excursion: Excursion | null }) {
  const reservations = useRouteStore((state) => state.reservations)
  const [abierta, setAbierta] = useState(false)
  const [preguntando, setPreguntando] = useState(false)
  const dias = route.days.filter((d) => !d.isReturnLeg)
  const suDia = dayOfReservation(route, reserva)
  const [elegido, setElegido] = useState<string | null>(suDia?.id ?? null)
  const dia = dias.find((d) => d.id === elegido) ?? null
  if (!excursion) return null

  const cerrar = () => {
    setAbierta(false)
    setPreguntando(false)
  }
  const pasar = async () => {
    if (!dia) return
    setPreguntando(false)
    setAbierta(false)
    await cambiarConDeshacer('Excursión de vuelta en tu ruta', async () => {
      useRouteStore.setState((state) => ({ reservations: state.reservations.map((r) => (r.id === reserva.id ? { ...r, noMueve: false } : r)) }))
      const hecho = dia.interruptor ? await ponerExcursionEnElDia(dia.id, excursion) : false
      if (!hecho) useRouteStore.getState().placeExcursion(excursion, { dayId: dia.id })
    })
  }

  return (
    <>
      <button type="button" data-volver-excursion="1" onClick={() => setAbierta(true)} className="mt-1.5 h-8 self-start whitespace-nowrap rounded-full border border-accent px-3.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft">
        Volver a ponerla en la ruta
      </button>
      {abierta && !preguntando && (
        <HojaDia
          etiqueta={excursion.title}
          titulo="¿A qué día la ponemos?"
          filas={filasDeDias(route, dias, (d) => (isDayPinned(route, reservations, d) && d.id !== suDia?.id ? 'Tiene una excursión reservada.' : null), (d) => (hasFullDayExcursion(d) ? 'Ya tiene una excursión.' : null))}
          elegido={elegido}
          onElegir={setElegido}
          boton={dia ? `Poner ${alDia(route, dia.dayNumber)}` : 'Elige un día'}
          onConfirmar={() => setPreguntando(true)}
          onCerrar={cerrar}
          z={100}
          datos="volver-excursion"
        />
      )}
      {preguntando && dia && (
        <ConfirmDialog alto eyebrow={excursion.title} text={`¿Pasamos ${elDia(route, dia.dayNumber)} a la excursión?`} detail="Las paradas de ese día salen de tu ruta." peligro confirmLabel="Sí, pasar" onCancel={() => setPreguntando(false)} onConfirm={() => void pasar()} />
      )}
    </>
  )
}
