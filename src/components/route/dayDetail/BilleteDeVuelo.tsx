import { useState, type KeyboardEvent, type ReactNode } from 'react'
import type { DatosBillete } from '../../../lib/billete'
import { ciudadDeSalida, diaEntero } from '../../../lib/billete'
import { useBillete } from '../../../hooks/useBillete'
import { useRouteStore } from '../../../store/useRouteStore'
import { ModeIcon } from './ArrivalReturnBar'
import { Icono } from '../../ui/Icono'
import { CodigoPantallaCompleta } from '../reservas/TarjetaBillete'
import { IconoDeDocumento } from '../reservas/BotonesDeReserva'

const AZUL = '#1F2A5C'

function Lado({ hora, codigo, alinear, lado }: { hora: string | null; codigo: string | null; alinear: 'left' | 'right'; lado: 'roma' | 'fuera' }) {
  return (
    <span data-billete-lado={lado} className="flex min-w-0 max-w-[112px] flex-col gap-px" style={{ alignItems: alinear === 'left' ? 'flex-start' : 'flex-end' }}>
      <span className="font-display text-[36px] leading-none text-text">{hora ?? ' '}</span>
      <span className="max-w-full truncate font-mono text-[10px] font-semibold tracking-[.1em]" style={{ color: AZUL }} title={codigo ?? undefined}>
        {codigo ?? ' '}
      </span>
    </span>
  )
}

/** La línea punteada con el medio en el centro y un punto lleno al empezar y uno vacío al llegar. */
function Linea({ mode }: { mode: DatosBillete['mode'] }) {
  return (
    <span className="relative block h-4 min-w-[24px]" aria-hidden="true">
      <span className="absolute inset-x-0 top-2 border-t-[1.5px] border-dashed" style={{ borderColor: 'rgba(31,42,92,.4)' }} />
      <span className="absolute left-1/2 top-[1px] -ml-[7px] rounded-full bg-white" style={{ color: '#B58A2E' }}>
        <span className="block" style={{ transform: mode === 'avion' ? 'rotate(45deg)' : undefined }}>
          <ModeIcon mode={mode} size={14} />
        </span>
      </span>
      <span className="absolute left-0 top-[5px] h-2 w-2 rounded-full" style={{ background: AZUL }} />
      <span className="absolute right-0 top-[5px] h-2 w-2 rounded-full bg-white" style={{ border: `1.5px solid ${AZUL}` }} />
    </span>
  )
}

/** «mar 20 oct»: el día corto, como en el dibujo (Design › Billete QR). */
function diaCorto(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[.,]/g, '')
}

/**
 * EL BILLETE (Tanda 7, de pago; V45 «ULTIMO › Billete QR», Q1 a Q4): en HOY y en DÍAS (llegada y vuelta), la tarjeta blanca con la barra azul noche a la izquierda, el círculo con el medio, «LLEGADA · VUELO IB3214»,
 * las horas grandes con su línea punteada y, arriba a la derecha, el QR: DORADO si la tarjeta de embarque (o el billete) ya está guardada (al tocarlo se abre en grande, como «Toca para ampliar»), GRIS con «+» si falta (al
 * tocarlo, lleva a la hoja de añadirla en RESERVAS). Abajo, la franja: «✓ Tarjeta de embarque guardada» o «+ Añade tu tarjeta de embarque», y el día. Tocar el resto de la tarjeta abre la ficha de llegada o de vuelta (`onOpen`).
 * El código guardado se lee del móvil (`useBillete`): 0 KB de red.
 */
export function BilleteDeVuelo({ billete, onOpen }: { billete: DatosBillete; onOpen: () => void }) {
  const llegada = billete.kind === 'llegada'
  const hayOtro = Boolean(billete.horaOtra || billete.codigoOtro)
  const route = useRouteStore((s) => s.route)
  const { billete: guardado } = useBillete(llegada ? 'arrival' : 'departure', billete.horaRoma)
  const [ampliado, setAmpliado] = useState(false)
  const hay = Boolean(guardado?.codigo && (guardado.codigo.dibujo || guardado.codigo.imagen))
  const dia = route ? (llegada ? route.answers.dateRange?.start : route.answers.dateRange?.end) ?? null : null
  const palabra = billete.mode === 'avion' ? 'tarjeta de embarque' : 'billete'
  const roma: ReactNode = <Lado lado="roma" hora={billete.horaRoma} codigo={billete.codigoRoma} alinear={llegada ? 'right' : 'left'} />
  const otro: ReactNode = hayOtro ? <Lado lado="fuera" hora={billete.horaOtra} codigo={billete.codigoOtro} alinear={llegada ? 'left' : 'right'} /> : null
  const columnas = hayOtro ? 'auto minmax(24px,1fr) auto' : llegada ? 'minmax(24px,1fr) auto' : 'auto minmax(24px,1fr)'
  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }
  const irAReservas = () => useRouteStore.getState().setMode('bookings')
  const fuera = route ? ciudadDeSalida(route) : ''
  const salida = llegada ? route?.arrivalOtraHora : billete.horaRoma
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={handleKey}
        data-billete={billete.kind}
        data-billete-qr={hay ? 'si' : 'falta'}
        aria-label={`${billete.encabezado} · ${billete.horaRoma} ${billete.codigoRoma}`}
        className="relative flex w-full shrink-0 cursor-pointer flex-col overflow-hidden rounded-[22px]"
        style={{ border: '1px solid rgba(181,138,46,.35)', background: '#FFFDF8', boxShadow: '0 14px 26px -18px rgba(28,34,48,.5)' }}
      >
        <span className="absolute inset-y-0 left-0 w-[5px]" style={{ background: AZUL }} aria-hidden="true" />
        <span className="flex flex-col gap-2.5 py-3.5 pl-5 pr-3">
          <span className="flex items-center gap-3">
            <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-[#F3D88F]" style={{ background: AZUL }}>
              <ModeIcon mode={billete.mode} size={17} />
            </span>
            <span className="min-w-0 flex-1 font-mono text-[10px] font-semibold uppercase leading-[1.35] tracking-[.1em]" style={{ color: AZUL }}>
              {billete.encabezado}
            </span>
            <IconoDeDocumento hay={hay} tipo="qr" onAbrir={() => setAmpliado(true)} onAnadir={irAReservas} etiqueta={hay ? 'Ver el código en grande' : `Añade tu ${palabra}`} datos={`billete-${billete.kind}`} />
          </span>
          <span className="grid items-center gap-2.5" style={{ gridTemplateColumns: columnas }}>
            {llegada ? (
              <>
                {otro}
                <Linea mode={billete.mode} />
                {roma}
              </>
            ) : (
              <>
                {roma}
                <Linea mode={billete.mode} />
                {otro}
              </>
            )}
          </span>
        </span>
        {hay ? (
          <span data-billete-pie="guardada" className="flex items-center justify-between gap-2 border-t border-dashed px-5 py-2.5 text-[12.5px]" style={{ background: '#F6EEDC', borderColor: 'rgba(181,138,46,.35)' }}>
            <span className="flex items-center gap-1.5 font-bold" style={{ color: '#6E5018' }}>
              <Icono nombre="hecho" size={12} grosor={2.6} />
              {billete.mode === 'avion' ? 'Tarjeta de embarque guardada' : 'Billete guardado'}
            </span>
            <span className="text-text/55">{diaCorto(dia)}</span>
          </span>
        ) : (
          <button
            type="button"
            data-billete-pie="falta"
            onClick={(e) => {
              e.stopPropagation()
              irAReservas()
            }}
            className="flex w-full items-center justify-between gap-2 border-0 border-t border-dashed px-5 py-2.5 text-left text-[12.5px]"
            style={{ background: '#F3F1EC', borderColor: 'rgba(28,34,48,.18)' }}
          >
            <span className="flex items-center gap-1.5 font-bold text-text/65">
              <span aria-hidden="true">+</span>
              {billete.mode === 'avion' ? 'Añade tu tarjeta de embarque' : 'Añade tu billete'}
            </span>
            <span className="text-text/55">{diaCorto(dia)}</span>
          </button>
        )}
      </div>
      {ampliado && guardado?.codigo && (
        <CodigoPantallaCompleta
          codigo={guardado.codigo}
          titulo={llegada ? `${fuera} → ${billete.codigoRoma}` : `${billete.codigoRoma} → ${fuera}`}
          cuando={[diaEntero(dia), salida].filter(Boolean).join(' · ')}
          pie=""
          onClose={() => setAmpliado(false)}
        />
      )}
    </>
  )
}
