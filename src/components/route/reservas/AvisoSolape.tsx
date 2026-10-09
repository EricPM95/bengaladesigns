import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { reservationOverlaps, type ReservationOverlap } from '../../../lib/reservationOverlaps'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { HojaAbajo } from './HojaAbajo'

/**
 * El aviso de dos reservas que se pisan (Tanda 6v): lo único que avisa de las horas de las reservas (la app nunca propone otra hora). Sube desde abajo cuando, al guardar una reserva, aparece un solape nuevo
 * («Tu Free Tour y tu entrada a los Museos coinciden. Revisa una de las dos reservas.» con [Ver mis reservas]); y el mismo texto sale en la campana (useAppNotices.ts) mientras siga habiéndolo.
 * Se va solo cuando se arregla. Al abrir un viaje que ya tenía un solape no sube la hoja (solo la campana).
 */
export function AvisoSolape() {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const setMode = useRouteStore((state) => state.setMode)
  const nombresCortos = useDestinationExcursions(route?.destination).nombresCortos
  const solapes = useMemo(() => (route ? reservationOverlaps(route, reservations, nombresCortos) : []), [route, reservations, nombresCortos])
  const vistos = useRef<{ viaje: string | null; ids: Set<string> }>({ viaje: null, ids: new Set() })
  const [aviso, setAviso] = useState<ReservationOverlap | null>(null)

  useEffect(() => {
    const ids = new Set(solapes.map((solape) => solape.id))
    if (!route || vistos.current.viaje !== route.id) {
      vistos.current = { viaje: route?.id ?? null, ids }
      setAviso(null)
      return
    }
    const nuevo = solapes.find((solape) => !vistos.current.ids.has(solape.id))
    vistos.current.ids = ids
    if (nuevo) setAviso(nuevo)
    else setAviso((actual) => (actual && ids.has(actual.id) ? actual : null))
  }, [route, solapes])

  if (!aviso) return null
  return (
    <HojaAbajo titleId="aviso-solape" onClose={() => setAviso(null)}>
      <h2 id="aviso-solape" className="max-w-[calc(100%-3rem)] font-display text-[24px] leading-[1.15] text-text">
        {aviso.text}
      </h2>
      <button
        type="button"
        onClick={() => {
          setAviso(null)
          setMode('bookings')
        }}
        className="mt-5 h-12 w-full rounded-full bg-[#1C2230] text-[15px] font-semibold text-[#FFFDF8] transition-transform active:scale-[.98]"
      >
        Ver mis reservas
      </button>
    </HojaAbajo>
  )
}
