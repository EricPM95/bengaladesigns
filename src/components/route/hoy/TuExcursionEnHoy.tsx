import { useState } from 'react'
import type { Route } from '../../../lib/types'
import type { Reservation } from '../../../lib/bookings'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { enlaceComoLlegarAlojamiento } from '../../../lib/direccionAlojamiento'
import { usePaseEstado } from '../../../lib/paseEstado'
import { useSyncStore } from '../../../store/useSyncStore'
import { excursionConCodigo } from '../../../store/useBilleteStore'
import { useBilletesDeExcursiones } from '../../../hooks/useBilleteExcursion'
import { CodigoPantallaCompleta, ImagenDelCodigo } from '../reservas/TarjetaBillete'

/**
 * (10R §4) HOY, el día de la excursión y SOLO CON EL PASE (el viaje sin cobro cuenta como con pase): lo mismo que «Tu entrada».
 *  - «Tu excursión» con el código en pequeño; al tocarla, el código a pantalla completa (el mismo de RESERVAS). Solo si esa excursión tiene su billete con código. Es el del propio viajero, guardado en su móvil: se ve sin internet.
 *  - [Cómo llegar al punto de encuentro]: abre el camino desde donde esté hasta el punto de encuentro (el mismo enlace de [Cómo llegar a tu alojamiento]). Sale con el pase y si hay punto de encuentro, haya billete o no.
 * Sin pase, nada (ni candado: HOY no enseña candados aquí).
 */
export function TuExcursionEnHoy({ route, reserva, puntoDeEncuentro }: { route: Route; reserva: Reservation | null; puntoDeEncuentro?: string | null }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  const billetes = useBilletesDeExcursiones()
  const [ampliado, setAmpliado] = useState(false)
  const conPase = !pase.cobro || pase.conPase
  if (!conPase || !reserva) return null
  const billete = billetes.de(reserva.refId)
  const conCodigo = excursionConCodigo(billete)
  const punto = (reserva.meetingPoint ?? puntoDeEncuentro ?? '').trim()
  const enlace = punto ? enlaceComoLlegarAlojamiento(punto) : null
  if (!conCodigo && !enlace) return null
  const fecha = reserva.dateIso && route.answers.dateRange ? fechaCorta(reserva.dateIso) : `Día ${reserva.dayNumber ?? ''}`.trim()
  return (
    <div className="space-y-2.5" data-hoy-tu-excursion-bloque>
      {conCodigo && (
        <>
          <button type="button" onClick={() => setAmpliado(true)} data-hoy-tu-excursion data-hoy-billete-codigo="excursion" className="flex w-full items-center gap-3.5 rounded-[18px] p-2.5 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
            <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
              <ImagenDelCodigo codigo={billete.codigo} tam={48} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>Tu excursión</span>
              <span style={{ font: "600 12.5px 'Geist'", color: '#6E5018' }}>Toca para ampliar</span>
            </span>
          </button>
          {ampliado && (
            <CodigoPantallaCompleta codigo={billete.codigo} titulo={reserva.name} cuando={`${fecha} · ${reserva.time}`} pie={billete.localizador ? `Localizador ${billete.localizador.toUpperCase()}` : ''} onClose={() => setAmpliado(false)} />
          )}
        </>
      )}
      {enlace && (
        <a href={enlace} target="_blank" rel="noopener noreferrer" data-hoy-punto-de-encuentro className="flex h-[46px] items-center justify-center gap-2 rounded-[14px]" style={{ background: '#1C2230', color: '#F3D88F', font: "700 14.5px 'Geist'" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 4a1 1 0 1 0 0 .01M10 21l2-7-3-3 1-5 4 2 3 1M7 12l3-1" />
          </svg>
          Cómo llegar al punto de encuentro
        </a>
      )}
    </div>
  )
}
