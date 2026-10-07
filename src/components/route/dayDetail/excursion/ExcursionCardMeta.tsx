import type { Excursion } from '../../../../lib/types'
import { hoursLabel } from './hoursLabel'

/** Lo que va bajo el título «Excursión desde Roma» en la tarjeta del día 4: la etiqueta, la duración con la vuelta y, si hay, la reserva. */
interface ExcursionCardMetaProps {
  excursion: Excursion | null
  reservedName?: string | null
}


export function ExcursionCardMeta({ excursion, reservedName }: ExcursionCardMetaProps) {
  const duration = hoursLabel(excursion?.page?.durationHours ?? excursion?.durationHours)
  const back = excursion?.page?.returnTime ?? null
  const line = [duration, back ? `vuelta a Roma ${back}` : null].filter(Boolean).join(' · ')
  return (
    <>
      <span className="text-[12.5px] font-medium text-accent">Día de excursión</span>
      {line && <span className="text-[12px] text-text/60">{line}</span>}
      {reservedName && <span className="text-[12px] font-medium text-accent-green">✓ Reservada · {reservedName}</span>}
    </>
  )
}
