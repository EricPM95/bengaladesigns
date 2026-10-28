import { useMemo, useState } from 'react'
import type { Route } from '../../../lib/types'
import { alDia } from '../../../lib/nombreDeDia'
import { anadirFreeTourEnDia, bloqueoParaElFreeTour, diaSugeridoParaFreeTour } from '../../../lib/freeTourEnDia'
import { HojaDia, filasDeDias } from '../../ui/HojaDia'

/**
 * (Tanda 10N8, apartado 3a e i) «¿A qué día lo añadimos?» para el Free Tour: la hoja de elegir día de la app (`HojaDia`, `Piezas/Hoja Dia` 02). El Free Tour va de PRIMERA parada, por la mañana, del día elegido;
 * el resto del día queda como estaba. Ningún día en gris, salvo el día entero de una excursión («El jueves 12 es el día de tu excursión.»). Lo hace igual el administrador, quien edita y quien solo recomienda
 * (a este le sale en su propuesta como un solo cambio, «Añadir el Free Tour al jueves 12»).
 */
export function FreeTourDiaSheet({ route, onClose }: { route: Route; onClose: () => void }) {
  const dias = useMemo(() => route.days.filter((day) => !day.isReturnLeg), [route])
  const [dayId, setDayId] = useState<string | null>(() => diaSugeridoParaFreeTour(route))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const elegido = dias.find((day) => day.id === dayId) ?? null

  const anadir = async () => {
    if (!elegido) return
    setBusy(true)
    setError(null)
    const r = await anadirFreeTourEnDia(elegido.id)
    setBusy(false)
    if (r.ok === false) setError(r.texto)
    else onClose()
  }

  return (
    <HojaDia
      etiqueta="Free Tour"
      titulo="¿A qué día lo añadimos?"
      filas={filasDeDias(route, dias, (day) => bloqueoParaElFreeTour(route, day))}
      elegido={dayId}
      onElegir={setDayId}
      boton={elegido ? `Añadir ${alDia(route, elegido.dayNumber)}` : 'Elige un día'}
      onConfirmar={anadir}
      onCerrar={onClose}
      ocupado={busy}
      error={error}
      datos="free-tour-dia"
    />
  )
}
