import type { KeyboardEvent } from 'react'
import { KIND_ICON } from '../../../lib/stopKind'
import type { ArrivalBarText, ArrivalMode } from '../../../lib/arrivalReturn'

/** Azul petróleo de la llegada y la vuelta (PROMPT_UI, Parte 3): el de los iconos y las cabeceras de la ventana. */
export const ARRIVAL_PETROL = '#1F5F78'

/** El azul y el verde de la barra (diseño «1b · Línea y pase azul», Tanda 6t). */
const AZUL = 'oklch(0.5 0.13 245)'
const AZUL_TINTA = 'oklch(0.45 0.1 240)'
const VERDE = 'oklch(0.55 0.11 150)'

/** El icono de cada medio, en línea fina (blanco sobre el azul). */
export const ARRIVAL_MODE_ICON: Record<ArrivalMode, string> = {
  avion: KIND_ICON.plane,
  tren: 'M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 11h16M8.5 14.5h.01M15.5 14.5h.01M8 21l2-3M16 21l-2-3',
  bus: 'M6 3h12a2 2 0 0 1 2 2v12H4V5a2 2 0 0 1 2-2zM4 11h16M7 17v3M17 17v3M7.5 14h.01M16.5 14h.01',
  ferry: 'M3 16l2 5h14l2-5zM5 16v-5l7-3 7 3v5M12 3v5M9 5h6',
  coche: 'M5 15v-4l2-5h10l2 5v4M3 15h18v3H3zM7 18v2M17 18v2M5 11h14',
}

export function ModeIcon({ mode, size = 20 }: { mode: ArrivalMode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ARRIVAL_MODE_ICON[mode]} />
    </svg>
  )
}

interface ArrivalReturnBarProps {
  mode: ArrivalMode
  text: ArrivalBarText
  onOpen: () => void
  /** «+ Vuelo»: a Reservas, al bloque de llegada y vuelta. Sin él (la versión gratis) no sale el botón. */
  onAdd?: () => void
}

/**
 * La llegada y la vuelta cerradas (Tanda 6t, diseño «1b · Línea y pase azul»): una barra blanca con el borde azul suave; a la izquierda el bloque azul con su diagonal y el icono del medio; dos líneas de
 * texto (la de arriba, pequeña y en mayúsculas; la de debajo, en grande); y a la derecha el botón azul «+ Vuelo» (de pago, sin hora), la pastilla verde «✓ 11:20» (de pago, con la hora del viajero) o solo la flecha
 * «›» (la versión gratis y el coche). Sin número y sin hora en la columna de las paradas: no es una parada. Ninguna hora la calcula la app.
 */
export function ArrivalReturnBar({ mode, text, onOpen, onAdd }: ArrivalReturnBarProps) {
  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }
  const boton = text.add && onAdd ? text.add : null
  const hecho = Boolean(text.pill)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKey}
      aria-label={[text.eyebrow, text.main, text.pill].filter(Boolean).join(' · ')}
      className="relative flex h-[60px] w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl pr-2 transition-colors max-[479px]:gap-2.5"
      style={{
        border: `1px solid ${hecho ? 'oklch(0.55 0.11 150 / .4)' : 'oklch(0.55 0.12 240 / .25)'}`,
        background: 'linear-gradient(100deg,oklch(0.97 0.03 230),#FFFFFF 55%)',
        boxShadow: '0 10px 22px -16px oklch(0.45 0.1 240 / .6)',
      }}
    >
      <span
        className="relative flex h-full w-[58px] shrink-0 items-center pl-3.5 text-white max-[479px]:w-[52px] max-[479px]:pl-3"
        style={{ clipPath: 'polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)', background: 'linear-gradient(160deg,oklch(0.55 0.12 240),oklch(0.4 0.1 250))' }}
      >
        <ModeIcon mode={mode} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate font-mono text-[9.5px] font-semibold uppercase tracking-[.1em]" style={{ color: AZUL_TINTA }}>
          {text.eyebrow}
        </span>
        <span className="truncate font-display text-[17px] leading-[1.05] text-text">{text.main}</span>
      </span>
      {boton && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onAdd?.()
          }}
          className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold text-white transition-transform active:scale-[.97]"
          style={{ background: AZUL }}
        >
          {boton}
        </button>
      )}
      {text.pill && (
        <span className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold text-white" style={{ background: VERDE }}>
          {text.pill}
        </span>
      )}
      {!boton && !text.pill && (
        <span className="shrink-0 pr-1 text-[22px] leading-none text-text/40" aria-hidden="true">
          ›
        </span>
      )}
    </div>
  )
}
