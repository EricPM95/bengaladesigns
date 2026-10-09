import type { CSSProperties, ReactNode } from 'react'

/** Los colores de RESERVAS (el diseño v4): verde de lo hecho, rosa de lo que falta y la tinta de siempre. */
export const GR = 'oklch(0.55 0.11 150)'
export const RS = 'oklch(0.55 0.17 5)'
export const INK = '#1C2230'
export const VERDE_SUAVE = 'oklch(0.96 0.035 150)'
export const VERDE_LINEA = 'oklch(0.55 0.11 150 / .3)'

/** Los iconos de línea fina de RESERVAS (los trazos del diseño v4). */
export const ICONOS = {
  avion: 'M10.5 20.5L12 16l-4-4-5 1.5-1-1 5-3.5L6 4l1.5-1 4 4.5L18 2a2 2 0 0 1 3 3l-5.5 6.5 4.5 4-1 1.5-5-1-3.5 5z',
  tren: 'M7 3h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 11h14M9 15h.01M15 15h.01M8 18l-2 3M16 18l2 3',
  bus: 'M5 4h14a1 1 0 0 1 1 1v12H4V5a1 1 0 0 1 1-1zM4 11h16M7 20v-3M17 20v-3M8 14h.01M16 14h.01',
  ferry: 'M3 17l2 4h14l2-4-9-3zM6 14V8h12v6M12 3v5',
  coche: 'M5 16v-5l2-5h10l2 5v5M5 16h14v3H5zM7.5 13h.01M16.5 13h.01',
  hotel: 'M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M2 21h20',
  ticket: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12',
  flag: 'M5 21V4M5 4h11l-2.5 3.5L16 11H5',
  cols: 'M4 20h16M5 9h14M12 4l8 5H4zM7 9v11M12 9v11M17 9v11',
  mount: 'M3 20l6-10 4 6 3-4 5 8z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  sim: 'M7 3h7l4 4v14H7zM10 12h5v5h-5z',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  reloj: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  lupa: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  coche2: 'M5 16v-5l2-5h10l2 5v5M5 16h14v3H5z',
} as const

export const iconoDeMedio = (mode: 'avion' | 'tren' | 'bus' | 'ferry' | 'coche') => ICONOS[mode]

export const SOMBRA_BLOQUE = '0 1px 2px rgba(28,34,48,.05),0 12px 30px -22px rgba(28,34,48,.35)'

/** Un bloque de RESERVAS: la tarjeta blanca de esquinas redondas del diseño v4. */
export function BloqueShell({ bloque, children, className = '' }: { bloque: string; children: ReactNode; className?: string }) {
  return (
    <div data-blk={bloque} className={`rounded-[22px] bg-[#FFFDF8] ${className}`} style={{ border: '1px solid rgba(28,34,48,.07)', boxShadow: SOMBRA_BLOQUE }}>
      {children}
    </div>
  )
}

export function Icono({ d, size = 18, stroke = 1.8 }: { d: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/** El cuadradito con el icono de la cabecera de un bloque: rosa si falta, verde si está hecho. */
export function IconoBloque({ d, hecho = false }: { d: string; hecho?: boolean }) {
  return (
    <span
      className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
      style={{ background: hecho ? 'oklch(0.55 0.11 150 / .14)' : 'oklch(0.55 0.17 5 / .12)', color: hecho ? GR : 'oklch(0.5 0.17 5)' }}
    >
      <Icono d={d} />
    </span>
  )
}

/** «Falta», «Falta la ida», «✓ Listo». */
export function PastillaEstado({ texto, hecho }: { texto: string; hecho: boolean }) {
  return (
    <span
      className="h-6 whitespace-nowrap rounded-full px-[9px] text-[11px] font-semibold leading-6"
      style={{ background: hecho ? VERDE_SUAVE : 'oklch(0.55 0.17 5 / .1)', color: hecho ? 'oklch(0.4 0.1 150)' : 'oklch(0.5 0.17 5)' }}
    >
      {texto}
    </span>
  )
}

/** La flechita redonda de un bloque que se abre y se cierra. */
export function FlechaBloque({ abierto }: { abierto: boolean }) {
  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#F5EFE4]" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .35s cubic-bezier(.2,.8,.2,1)' }}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  )
}

export const tituloBloqueStyle: CSSProperties = { font: "400 22px/1 'Instrument Serif',serif" }

/** «Cambiar» en cursiva subrayada, el botón de texto de las líneas hechas. */
export function CambiarBoton({ onClick, texto = 'Cambiar' }: { onClick: () => void; texto?: string }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="flex-none border-none bg-transparent px-1.5 py-2 text-ink underline underline-offset-[3px]"
      style={{ font: "italic 400 15px 'Instrument Serif',serif", color: INK }}
    >
      {texto}
    </button>
  )
}

/** El texto de borrar: en rojo, sin caja. */
export function EliminarTexto({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <button type="button" onClick={onClick} className="self-center border-none bg-transparent px-2 py-1 text-[13.5px] font-medium" style={{ color: 'oklch(0.52 0.19 25)' }}>
      {texto}
    </button>
  )
}

/** Una reservada, en una línea verde: «✓ Coliseo, Foro y Palatino · 11 oct · 10:00 · Cambiar». */
export function LineaReservada({ nombre, meta, onChange }: { nombre: string; meta: string; onChange: () => void }) {
  return (
    <div className="flex min-h-[46px] items-center gap-[9px] rounded-[14px] py-1.5 pl-3 pr-1.5" style={{ background: VERDE_SUAVE, border: `1px solid ${VERDE_LINEA}` }}>
      <span className="h-5 w-5 flex-none rounded-full text-center text-[10px] font-bold leading-5 text-white" style={{ background: GR }}>
        ✓
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-medium leading-[1.35]" style={{ textWrap: 'pretty' as never }}>
        {nombre} ·{' '}
        <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'oklch(0.38 0.08 150)' }}>{meta}</span>
      </span>
      <CambiarBoton onClick={onChange} />
    </div>
  )
}
