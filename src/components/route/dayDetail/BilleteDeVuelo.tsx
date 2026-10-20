import type { KeyboardEvent, ReactNode } from 'react'
import type { DatosBillete } from '../../../lib/billete'
import { ModeIcon } from './ArrivalReturnBar'
import { Icono } from '../../ui/Icono'

const AZUL = 'oklch(0.5 0.13 245)'
const AZUL_TINTA = 'oklch(0.45 0.1 240)'

function Lado({ hora, codigo, alinear }: { hora: string | null; codigo: string | null; alinear: 'left' | 'right' }) {
  return (
    <span className="flex min-w-0 max-w-[112px] flex-col gap-px" style={{ alignItems: alinear === 'left' ? 'flex-start' : 'flex-end' }}>
      <span className="font-display text-[24px] leading-none text-text">{hora ?? ' '}</span>
      <span className="max-w-full truncate font-mono text-[10px] font-semibold tracking-[.1em] text-text/55" title={codigo ?? undefined}>
        {codigo ?? ' '}
      </span>
    </span>
  )
}

/** La línea punteada con el medio en el centro y un punto lleno al empezar y uno vacío al llegar. */
function Linea({ mode }: { mode: DatosBillete['mode'] }) {
  return (
    <span className="relative block h-4 min-w-[24px]" aria-hidden="true">
      <span className="absolute inset-x-0 top-2 border-t-[1.5px] border-dashed" style={{ borderColor: 'oklch(0.55 0.12 240 / .45)' }} />
      <span className="absolute left-1/2 top-[1px] -ml-[7px] rounded-full bg-white" style={{ color: AZUL}}>
        <span className="block" style={{ transform: mode === 'avion' ? 'rotate(45deg)' : undefined }}>
          <ModeIcon mode={mode} size={14} />
        </span>
      </span>
      <span className="absolute left-0 top-[5px] h-1.5 w-1.5 rounded-full" style={{ background: AZUL }} />
      <span className="absolute right-0 top-[5px] h-1.5 w-1.5 rounded-full bg-white" style={{ border: `1.5px solid ${AZUL}` }} />
    </span>
  )
}

/**
 * EL BILLETE (Tanda 7, de pago; diseño `docs/diseno/dia1_vuelo/Dia 1 Reservas.dc.html`, solo la tarjeta del vuelo): en el acordeón del día de llegada y en el de vuelta de DÍAS, en lugar de la barra cuando el viajero
 * ya puso su hora. «LLEGADA · VUELO IB3214» (o «VUELTA · TREN»...), la pastilla verde [Reservado], la hora y el código de cada lado y la línea con el medio. Enseña lo que haya: con solo la hora de Roma, solo el lado de Roma;
 * con las casillas opcionales, los dos lados (BCN → FCO en la llegada, FCO → BCN en la vuelta). Solo las horas que pone el viajero. Al tocarlo, se abre la ficha de llegada o de vuelta (`onOpen`).
 */
export function BilleteDeVuelo({ billete, onOpen }: { billete: DatosBillete; onOpen: () => void }) {
  const llegada = billete.kind === 'llegada'
  const hayOtro = Boolean(billete.horaOtra || billete.codigoOtro)
  const roma: ReactNode = <Lado hora={billete.horaRoma} codigo={billete.codigoRoma} alinear={llegada ? 'right' : 'left'} />
  const otro: ReactNode = hayOtro ? <Lado hora={billete.horaOtra} codigo={billete.codigoOtro} alinear={llegada ? 'left' : 'right'} /> : null
  const columnas = hayOtro ? 'auto minmax(24px,1fr) auto' : llegada ? 'minmax(24px,1fr) auto' : 'auto minmax(24px,1fr)'
  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKey}
      data-billete={billete.kind}
      aria-label={`${billete.encabezado} · Reservado · ${billete.horaRoma} ${billete.codigoRoma}`}
      className="relative flex min-h-[96px] w-full cursor-pointer overflow-hidden rounded-[18px]"
      style={{
        border: '1px solid oklch(0.55 0.12 240 / .28)',
        background: 'var(--fondo-llegada)',
        boxShadow: '0 12px 24px -16px oklch(0.45 0.1 240 / .6)',
      }}
    >
      <span
        className="relative flex w-[58px] flex-none flex-col justify-center pl-[13px] text-white max-[479px]:w-[52px] max-[479px]:pl-3"
        style={{ clipPath: 'polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)', background: 'linear-gradient(160deg,oklch(0.55 0.12 240),oklch(0.4 0.1 250))' }}
      >
        <ModeIcon mode={billete.mode} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[7px] py-[11px] pl-1 pr-3">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] font-semibold uppercase tracking-[.1em]" style={{ color: AZUL_TINTA }}>
            {billete.encabezado}
          </span>
          <span
            className="flex h-[22px] flex-none items-center gap-1 rounded-full pl-1.5 pr-2 text-[10.5px] font-semibold"
            style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .35)', color: 'oklch(0.38 0.1 150)' }}
          >
            <Icono nombre="hecho" size={10} grosor={3} />
            Reservado
          </span>
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
    </div>
  )
}
