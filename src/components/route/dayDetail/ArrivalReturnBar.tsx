import type { KeyboardEvent } from 'react'
import { KIND_ICON } from '../../../lib/stopKind'
import type { ArrivalBarText, ArrivalMode } from '../../../lib/arrivalReturn'

/** Azul petróleo de la llegada y la vuelta (PROMPT_UI, Parte 3). */
export const ARRIVAL_PETROL = '#1F5F78'

/** El icono de cada medio, en línea fina (blanco sobre el petróleo). */
export const ARRIVAL_MODE_ICON: Record<ArrivalMode, string> = {
  avion: KIND_ICON.plane,
  tren: 'M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 11h16M8.5 14.5h.01M15.5 14.5h.01M8 21l2-3M16 21l-2-3',
  bus: 'M6 3h12a2 2 0 0 1 2 2v12H4V5a2 2 0 0 1 2-2zM4 11h16M7 17v3M17 17v3M7.5 14h.01M16.5 14h.01',
  ferry: 'M3 16l2 5h14l2-5zM5 16v-5l7-3 7 3v5M12 3v5M9 5h6',
  crucero: 'M3 16l2 5h14l2-5zM5 16v-5l7-3 7 3v5M12 3v5M9 5h6',
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
  /** "+ AÑADIR VUELO": a Reservas, a la casilla de la hora. */
  onAdd: () => void
}

/**
 * La llegada y la vuelta cerradas: una barra fina tipo billete (PROMPT_UI, Parte 3). A la izquierda el bloque petróleo
 * con el icono del medio y una diagonal clara; en el centro los datos en mono mayúsculas (se cortan con "…" si no caben);
 * a la derecha la hora clave en terracota, que nunca se corta; al final la línea de puntos del billete con sus dos
 * muescas y "›". Sin número y sin hora en la columna de las paradas: no es una parada.
 */
export function ArrivalReturnBar({ mode, text, onOpen, onAdd }: ArrivalReturnBarProps) {
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
      aria-label={[text.data, text.key].filter(Boolean).join(' · ')}
      className="relative flex h-[52px] w-full cursor-pointer items-stretch overflow-hidden rounded-full border border-text/[.10] bg-bg-card shadow-[0_1px_2px_rgba(40,30,20,.06)] transition-colors hover:bg-bg-hover max-[479px]:h-12"
    >
      <span className="relative flex w-[54px] shrink-0 items-center justify-center text-white max-[479px]:w-11" style={{ background: ARRIVAL_PETROL }}>
        {/* La diagonal clara del billete. */}
        <span className="absolute inset-0" style={{ background: 'linear-gradient(115deg, transparent 58%, rgba(255,255,255,.16) 58%, rgba(255,255,255,.16) 70%, transparent 70%)' }} aria-hidden="true" />
        <span className="relative">
          <ModeIcon mode={mode} size={20} />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2 pl-3 pr-2 max-[479px]:gap-1.5 max-[479px]:pl-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-medium uppercase tracking-[.06em] text-text/75 max-[479px]:text-[10.5px] max-[479px]:tracking-[.02em]">{text.data}</span>
        {text.key && <span className="shrink-0 whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[.06em] text-accent max-[479px]:text-[10.5px] max-[479px]:tracking-[.02em]">{text.key}</span>}
        {text.add && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onAdd()
            }}
            className="shrink-0 whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[.06em] text-[#2563A8] max-[479px]:text-[10.5px] max-[479px]:tracking-[.02em] hover:underline"
          >
            {text.add}
          </button>
        )}
      </span>
      {/* La línea de puntos del billete, con sus dos muescas (el color del papel). */}
      <span className="relative flex w-9 shrink-0 max-[479px]:w-8 items-center justify-center border-l-[1.5px] border-dashed border-text/20 text-[18px] leading-none text-text/45">
        <span className="absolute -left-[6px] -top-[6px] h-[11px] w-[11px] rounded-full border border-text/[.10] bg-bg" aria-hidden="true" />
        <span className="absolute -bottom-[6px] -left-[6px] h-[11px] w-[11px] rounded-full border border-text/[.10] bg-bg" aria-hidden="true" />›
      </span>
    </div>
  )
}
