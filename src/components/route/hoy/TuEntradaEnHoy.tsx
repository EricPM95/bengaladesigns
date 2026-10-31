import { useState } from 'react'
import type { Route } from '../../../lib/types'
import type { Reservation } from '../../../lib/bookings'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { usePaseEstado } from '../../../lib/paseEstado'
import { useSyncStore } from '../../../store/useSyncStore'
import { entradaConCodigo, type BilleteDeEntrada } from '../../../store/useBilleteStore'
import { useBilletesDeEntradas } from '../../../hooks/useBilleteEntrada'
import { CodigoDeEntradaPantallaCompleta } from '../reservas/EntradaConBillete'
import { ImagenDelCodigo } from '../reservas/TarjetaBillete'

/**
 * (10S7 §3, E4) HOY, en la parada de un sitio con entrada: la fila «Tu entrada» con el código en pequeño; al tocarla, el código a pantalla completa (el mismo de RESERVAS).
 * SOLO CON EL PASE (sin pase, nada; el viaje sin cobro cuenta como con pase) y solo si esa entrada tiene su billete con código. Es el del propio viajero, guardado en su móvil: se ve sin internet.
 */
export function TuEntradaEnHoy({ route, reserva }: { route: Route; reserva: Reservation | null }) {
  const billetes = useBilletesDeEntradas()
  const billete = reserva ? billetes.de(reserva.refId) : null
  // (Sin billete con código no se pregunta nada por el pase.)
  if (!reserva || !entradaConCodigo(billete)) return null
  return <FilaTuEntrada route={route} reserva={reserva} billete={billete} />
}

function FilaTuEntrada({ route, reserva, billete }: { route: Route; reserva: Reservation; billete: BilleteDeEntrada & { codigo: NonNullable<BilleteDeEntrada['codigo']> } }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  const [ampliado, setAmpliado] = useState(false)
  const conPase = !pase.cobro || pase.conPase
  if (!conPase) return null
  const fecha = reserva.dateIso && route.answers.dateRange ? fechaCorta(reserva.dateIso) : `Día ${reserva.dayNumber ?? ''}`.trim()
  return (
    <>
      <button type="button" onClick={() => setAmpliado(true)} data-hoy-tu-entrada data-hoy-billete-codigo="entrada" className="flex w-full items-center gap-3.5 rounded-[18px] p-2.5 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
        <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
          <ImagenDelCodigo codigo={billete.codigo} tam={48} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>Tu entrada</span>
          <span style={{ font: "600 12.5px 'Geist'", color: '#6E5018' }}>Toca para ampliar</span>
        </span>
      </button>
      {ampliado && <CodigoDeEntradaPantallaCompleta billete={billete} titulo={reserva.name} cuando={`${fecha} · ${reserva.time}`} onClose={() => setAmpliado(false)} />}
    </>
  )
}
