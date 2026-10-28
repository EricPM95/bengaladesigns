import { useState } from 'react'
import type { Excursion, Route } from '../../../lib/types'
import { excursionTargetDays } from '../../../lib/excursionOffer'
import { canAddDay } from '../../../lib/freeDays'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { isDayPinned } from '../../../lib/bookings'
import { HojaDia, filasDeDias } from '../../ui/HojaDia'
import { ponerExcursionEnElDia } from '../../../lib/dayInterruptor'
import { elDia } from '../../../lib/nombreDeDia'

/**
 * «¿Dónde la ponemos?» (PARA_CODE_EXCURSIONES, 3): sube desde abajo con su tirador y su cruz. Sin avisos: el viajero decide. Sustituir un
 * día lo convierte en la excursión (con la varita del día vuelve tal como estaba); un día nuevo se añade al final.
 */
export function WhereSheet({ route, excursion, onClose }: { route: Route; excursion: Excursion; onClose: () => void }) {
  const placeExcursion = useRouteStore((state) => state.placeExcursion)
  const closePage = useExcursionsStore((state) => state.closePage)
  const reservations = useRouteStore((state) => state.reservations)
  // (Un día fijado por una excursión reservada no se ofrece: lo reservado no se sustituye.)
  const days = excursionTargetDays(route).filter((day) => !isDayPinned(route, reservations, day))
  const newDayAllowed = canAddDay(route)
  const [choice, setChoice] = useState<string>(days[0]?.id ?? (newDayAllowed ? 'new' : ''))
  const chosenDay = days.find((day) => day.id === choice) ?? null

  const confirm = async () => {
    if (choice === 'new') placeExcursion(excursion, { newDay: true })
    else if (chosenDay) {
      // El día 4 lleva su interruptor [Roma | Excursión]: la excursión se pone en su página y el interruptor pasa a Excursión (Tanda 6g). Los demás días, como siempre.
      const hecho = chosenDay.interruptor ? await ponerExcursionEnElDia(chosenDay.id, excursion) : false
      if (!hecho) placeExcursion(excursion, { dayId: chosenDay.id })
    } else return
    closePage()
  }

  return (
    <HojaDia
      etiqueta={excursion.title}
      titulo="¿Dónde la ponemos?"
      filas={filasDeDias(route, days)}
      elegido={choice}
      onElegir={setChoice}
      boton={choice === 'new' || !chosenDay ? 'Añadirla en un día nuevo' : `Ponerla en ${elDia(route, chosenDay.dayNumber)}`}
      onConfirmar={() => void confirm()}
      onCerrar={onClose}
      z={95}
      datos="where-excursion"
    >
      <button
        type="button"
        disabled={!newDayAllowed}
        onClick={() => setChoice('new')}
        className={`w-full rounded-[22px] border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${choice === 'new' ? 'border-[#E9C77A] bg-[#1C2230] text-[#FBF3E2]' : 'border-text/[.12] bg-[#FFFDF8]'}`}
      >
        <span className="block text-[14px] font-semibold">{newDayAllowed ? 'O añádela en un día nuevo' : 'Máximo 14 días'}</span>
        <span className="block text-[12px] opacity-70">Se añade a tu viaje como «{excursion.title}»</span>
      </button>
    </HojaDia>
  )
}
