import type { CSSProperties, ReactNode } from 'react'
import type { NombreIcono } from '../../../lib/iconos'
import { Icono } from '../../ui/Icono'

/** Los colores de RESERVAS (el diseño v4): verde de lo hecho, rosa de lo que falta y la tinta de siempre. */
export const GR = 'oklch(0.55 0.11 150)'
export const RS = 'rgb(var(--accent))'
export const INK = '#1C2230'
export const VERDE_SUAVE = 'oklch(0.96 0.035 150)'
export const VERDE_LINEA = 'oklch(0.55 0.11 150 / .3)'

/**
 * Los iconos de RESERVAS: los de la familia única (`src/lib/iconos.ts`, Tanda 6z3), con los nombres cortos que ya usa esta pantalla. NO hay trazos propios aquí:
 * ferry = barco, hotel = cama (alojamiento), ticket = reservas, flag = Free Tour, excursion = mochila, shield = seguro, sim = eSIM, card = tarjeta.
 */
export const ICONOS = {
  avion: 'avion',
  tren: 'tren',
  bus: 'bus',
  ferry: 'barco',
  coche: 'coche',
  hotel: 'cama',
  ticket: 'reservas',
  flag: 'free',
  excursion: 'excursion',
  shield: 'seguro',
  sim: 'esim',
  card: 'tarjeta',
  reloj: 'reloj',
  lupa: 'lupa',
} as const satisfies Record<string, NombreIcono>

export const iconoDeMedio = (mode: 'avion' | 'tren' | 'bus' | 'ferry' | 'coche'): NombreIcono => ICONOS[mode]

export const SOMBRA_BLOQUE = '0 1px 2px rgba(28,34,48,.05),0 12px 30px -22px rgba(28,34,48,.35)'

/** Un bloque de RESERVAS: la tarjeta blanca de esquinas redondas del diseño v4. */
export function BloqueShell({ bloque, children, className = '' }: { bloque: string; children: ReactNode; className?: string }) {
  return (
    <div data-blk={bloque} className={`rounded-[22px] bg-[#FFFDF8] ${className}`} style={{ border: '1px solid rgba(28,34,48,.07)', boxShadow: SOMBRA_BLOQUE }}>
      {children}
    </div>
  )
}

/** El cuadradito con el icono de la cabecera de un bloque: rosa si falta, verde si está hecho. */
export function IconoBloque({ nombre, hecho = false }: { nombre: NombreIcono; hecho?: boolean }) {
  return (
    <span
      className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
      style={{ background: hecho ? 'oklch(0.55 0.11 150 / .14)' : 'rgb(var(--accent) / .12)', color: hecho ? GR : 'rgb(var(--accent-hover))' }}
    >
      <Icono nombre={nombre} size={18} />
    </span>
  )
}

/**
 * El estado de un bloque de RESERVAS (Tanda 6z6b): UN solo estilo para «Falta», «Falta la ida», «0 de 6 reservadas» o «✓ Hotel Artemide». Va DEBAJO del nombre del bloque, en monoespaciado pequeño:
 * frambuesa si falta algo, verde si está hecho. Ningún bloque lo pone en una píldora ni a la derecha.
 */
export function EstadoBloque({ texto, hecho }: { texto: string; hecho: boolean }) {
  return (
    <span className="truncate" data-estado={hecho ? 'hecho' : 'falta'} style={{ font: "600 11px 'Geist Mono',monospace", color: hecho ? GR : 'oklch(0.5 0.17 5)' }}>
      {texto}
    </span>
  )
}

/** La flechita redonda de un bloque que se abre y se cierra. */
export function FlechaBloque({ abierto }: { abierto: boolean }) {
  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#F5EFE4]" aria-hidden="true">
      <Icono nombre="abajo" size={16} style={{ color: INK, transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .35s cubic-bezier(.2,.8,.2,1)' }} />

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
