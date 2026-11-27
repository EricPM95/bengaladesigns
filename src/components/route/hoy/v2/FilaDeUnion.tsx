import { useState } from 'react'
import type { Reservation } from '../../../../lib/bookings'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useReservasFocusStore } from '../../../../store/useReservasFocusStore'
import { excursionConCodigo } from '../../../../store/useBilleteStore'
import { useBilletesDeExcursiones } from '../../../../hooks/useBilleteExcursion'
import { diaEntero } from '../../../../lib/billete'
import { filaDeUnion, type MitadDelViaje } from '../../../../lib/escalasYUnion'
import { IconoRuta } from '../../../ui/Icono'
import { IconoDeDocumento } from '../../reservas/BotonesDeReserva'
import { CodigoPantallaCompleta } from '../../reservas/TarjetaBillete'

/**
 * (V76; Design «Añadir una reserva» R11a y R11b) LA FILA DE UN TREN O AUTOBÚS UNIDO A LA LLEGADA O A LA VUELTA, dentro de la tarjeta de llegada (V62) o de la de vuelta (V70): «Leonardo Express · 14:35 · Fiumicino → Termini»
 * con su QR a la derecha (dorado si el billete está guardado; gris con «+» si falta: al tocarlo, RESERVAS a subirlo, como en la regla V62). Se pinta con el mismo formato que la franja del coche de la tarjeta de llegada.
 * REGLA «HOY y RESERVAS, los mismos datos»: nada se guarda aquí; el nombre, las horas y el trayecto salen de la reserva y el código, del billete de RESERVAS (`useBilletesDeExcursiones`, clave = el id de la reserva).
 * Consultas a Supabase: ninguna.
 */
const TREN = 'M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 11h16M8 21l2-3M16 21l-2-3M8.5 14.5h.01M15.5 14.5h.01'
const BUS = 'M5 4h14a1 1 0 0 1 1 1v11H4V5a1 1 0 0 1 1-1zM4 11h16M7 19v2M17 19v2M8 15h.01M16 15h.01'

export function FilaDeUnion({ reserva, mitad }: { reserva: Reservation; mitad: MitadDelViaje }) {
  const billetes = useBilletesDeExcursiones()
  const billete = billetes.de(reserva.id)
  const hay = excursionConCodigo(billete)
  const [ampliado, setAmpliado] = useState(false)
  const irAReservas = () => {
    useRouteStore.getState().setMode('bookings')
    useReservasFocusStore.getState().pedir('llegada', mitad)
  }
  const texto = filaDeUnion(reserva)
  return (
    <>
      <div data-hoy-union={mitad} data-hoy-union-id={reserva.id} className="flex items-center gap-2.5 rounded-2xl px-3 py-[9px]" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.5)' }}>
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full" style={{ background: '#1C2230', color: '#F3D88F' }}>
          <IconoRuta d={reserva.kind === 'bus' ? BUS : TREN} size={18} grosor={1.8} />
        </span>
        <span data-hoy-union-texto className="min-w-0 flex-1 text-[13.5px] font-semibold leading-[1.3] [overflow-wrap:anywhere]" style={{ color: '#3E2A0C' }}>
          {texto}
        </span>
        <IconoDeDocumento hay={hay} tipo="qr" onAbrir={() => setAmpliado(true)} onAnadir={irAReservas} etiqueta={hay ? 'Ver el código en grande' : 'Añade tu billete'} datos={`union-${mitad}`} />
      </div>
      {ampliado && hay && billete?.codigo && (
        <CodigoPantallaCompleta codigo={billete.codigo} titulo={[reserva.origen, reserva.destinoDeViaje].filter(Boolean).join(' → ') || reserva.name} cuando={[diaEntero(reserva.dateIso), reserva.time].filter(Boolean).join(' · ')} pie={[reserva.compania, reserva.asiento ? `Asiento ${reserva.asiento}` : ''].filter(Boolean).join(' · ')} onClose={() => setAmpliado(false)} />
      )}
    </>
  )
}
