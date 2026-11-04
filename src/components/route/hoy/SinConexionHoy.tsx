import { useEffect, useState } from 'react'
import type { DayPlan, Route } from '../../../lib/types'
import { demoActivo } from '../../../lib/logros'
import { guardarFichasDelDia, guardarLoDeHoy, hayLoDeHoyGuardado } from '../../../lib/sinConexion'
import { useSyncStore } from '../../../store/useSyncStore'
import { buildTripPayload } from '../../sync/TripSync'

/**
 * SIN INTERNET en HOY (HOY1, apartado 9; H15 de Design). Se engancha con UNA línea: `<SinConexionHoy route={route} day={day} dateIso={dateIso} />`.
 *  - Con conexión (y sin pintar nada): guarda en el móvil la ruta del viaje y las fichas de las paradas de hoy con el texto de sus historias (`lib/sinConexion.ts`), cada vez que cambia la ruta.
 *  - Sin conexión: la línea «Sin conexión: lo de hoy está guardado en tu móvil.» (solo si de verdad está guardado; si no, lo dice con otras palabras).
 */
const TEXTO_GUARDADO = 'Sin conexión: lo de hoy está guardado en tu móvil.'
const TEXTO_SIN_GUARDAR = 'Sin conexión: algunas cosas no se verán hasta que vuelva.'

function useConectado(): boolean {
  const [conectado, setConectado] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false))
  useEffect(() => {
    const dentro = () => setConectado(true)
    const fuera = () => setConectado(false)
    window.addEventListener('online', dentro)
    window.addEventListener('offline', fuera)
    return () => {
      window.removeEventListener('online', dentro)
      window.removeEventListener('offline', fuera)
    }
  }, [])
  return conectado
}

export function SinConexionHoy({ route, day, dateIso }: { route: Route; day: DayPlan; dateIso: string }) {
  const conectado = useConectado()
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const [guardado, setGuardado] = useState(false)

  // La ruta del viaje en el móvil: al abrir HOY y cada vez que cambia (también sin red: es solo del móvil, así lo hecho sin conexión no se pierde).
  useEffect(() => {
    if (demoActivo() || !tripId) return undefined
    let vivo = true
    const t = window.setTimeout(() => {
      const payload = buildTripPayload()
      if (!payload) return
      void guardarLoDeHoy({ id: tripId, payload, guardadoEn: new Date().toISOString(), desde: route.answers.dateRange?.start ?? null, hasta: route.answers.dateRange?.end ?? null }).then((ok) => vivo && setGuardado(ok))
    }, 1200)
    return () => {
      vivo = false
      window.clearTimeout(t)
    }
  }, [route, tripId])

  // Las fichas de hoy (con sus historias): con red, por adelantado.
  useEffect(() => {
    if (!conectado || demoActivo()) return
    void guardarFichasDelDia(route, day)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conectado, day.id, route.destination, dateIso])

  // Al empezar sin red, ¿había algo guardado de antes?
  useEffect(() => {
    if (conectado || guardado || !tripId) return
    let vivo = true
    void hayLoDeHoyGuardado(tripId).then((hay) => vivo && setGuardado(hay))
    return () => {
      vivo = false
    }
  }, [conectado, guardado, tripId])

  if (conectado) return null
  return (
    <div data-sin-conexion={guardado ? 'guardado' : 'sin-guardar'} role="status" className="flex flex-none items-center gap-[9px] text-[12.5px] font-medium" style={{ color: 'rgba(28,34,48,.7)' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8E6820" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
        <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01M3 3l18 18" />
      </svg>
      {guardado ? TEXTO_GUARDADO : TEXTO_SIN_GUARDAR}
    </div>
  )
}
