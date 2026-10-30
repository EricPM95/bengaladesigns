import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { ciudadDeSalida, diaEntero } from '../../../lib/billete'
import { useBillete } from '../../../hooks/useBillete'
import { CodigoPantallaCompleta, ImagenDelCodigo } from '../reservas/TarjetaBillete'
import type { MitadDeHoy } from './llegadaVuelta'

/**
 * EL BILLETE EN HOY (10S5 §4; solo con pase y solo el día del viaje: las tarjetas de llegada y de vuelta de HOY ya solo salen ese día): dentro de la tarjeta del billete de siempre, el código en pequeño con
 * «Toca para ampliar» (a pantalla completa en blanco). Sin buscarlo. Es el del propio viajero, guardado en su móvil: se ve sin internet. Sin código guardado, no sale nada.
 */
export function BilleteEnHoy({ route, kind, mitad, fechaIso }: { route: Route; kind: 'llegada' | 'vuelta'; mitad: MitadDeHoy; fechaIso?: string | null }) {
  const { billete } = useBillete(kind === 'llegada' ? 'arrival' : 'departure', mitad.hora)
  const [ampliado, setAmpliado] = useState(false)
  if (!billete?.codigo || !(billete.codigo.dibujo || billete.codigo.imagen)) return null
  const fuera = ciudadDeSalida(route)
  const dia = fechaIso ?? (kind === 'llegada' ? route.answers.dateRange?.start : route.answers.dateRange?.end) ?? null
  const roma = mitad.destino
  const numero = (kind === 'llegada' ? route.arrivalCodigo : route.departureCodigo)?.trim()
  const palabra = mitad.mode === 'avion' ? 'Vuelo' : mitad.mode === 'tren' ? 'Tren' : mitad.mode === 'bus' ? 'Autobús' : 'Barco'
  const salida = kind === 'llegada' ? route.arrivalOtraHora : mitad.hora
  const pie = [billete.asiento ? (/^asiento/i.test(billete.asiento) ? billete.asiento : `Asiento ${billete.asiento}`) : null, numero ? `${palabra} ${numero.toUpperCase()}` : null].filter(Boolean).join(' · ')
  return (
    <>
      <button type="button" onClick={() => setAmpliado(true)} data-hoy-billete-codigo={kind} className="flex w-full items-center gap-3.5 rounded-[18px] p-2.5 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
        <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
          <ImagenDelCodigo codigo={billete.codigo} tam={64} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>{mitad.mode === 'avion' ? 'Tu tarjeta de embarque' : 'Tu billete'}</span>
          <span style={{ font: "600 12.5px 'Geist'", color: '#6E5018' }}>Toca para ampliar</span>
        </span>
      </button>
      {ampliado && (
        <CodigoPantallaCompleta
          codigo={billete.codigo}
          titulo={kind === 'llegada' ? `${fuera} → ${roma}` : `${roma} → ${fuera}`}
          cuando={[diaEntero(dia), salida].filter(Boolean).join(' · ')}
          pie={pie}
          onClose={() => setAmpliado(false)}
        />
      )}
    </>
  )
}
