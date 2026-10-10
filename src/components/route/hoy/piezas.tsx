import type { ReactNode } from 'react'
import { Icono } from '../../ui/Icono'
import type { NombreIcono } from '../../../lib/iconos'

/** Los colores de HOY (diseño «Hoy, según el momento»): tinta, frambuesa (falta), verde (hecho) y azul (el tiempo). */
export const TINTA = '#1C2230'
export const FRAMBUESA = 'oklch(0.55 0.17 5)'
export const VERDE = 'oklch(0.55 0.11 150)'
export const AZUL = 'oklch(0.56 0.1 230)'

export const ojoMono = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase' as const }

/** La caja blanca de HOY (esquinas de 22, borde fino y sombra suave). */
export function CajaBlanca({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5 ${className}`} style={{ border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 1px 2px rgba(28,34,48,.05),0 12px 30px -22px rgba(28,34,48,.35)' }}>
      {children}
    </div>
  )
}

/** La tarjeta oscura grande de HOY, con su resplandor de color en una esquina. */
export function TarjetaOscura({ children, brillo = 'oklch(0.55 0.17 5 / .4)', abajo = false }: { children: ReactNode; brillo?: string; abajo?: boolean }) {
  return (
    <div className="relative flex flex-none flex-col gap-1 overflow-hidden rounded-[28px] bg-[#1C2230] px-5 pb-[18px] pt-5 text-[#FFFDF8]" style={{ boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
      <span
        aria-hidden="true"
        className="absolute h-[180px] w-[180px] rounded-full"
        style={abajo ? { left: -60, bottom: -70, background: brillo, filter: 'blur(34px)' } : { right: -50, top: -50, background: brillo, filter: 'blur(30px)' }}
      />
      {children}
    </div>
  )
}

/** El cuadradito con icono y el título de una caja («Te falta por reservar»). */
export function CabeceraCaja({ icono, titulo, derecha, color = FRAMBUESA, fondo = 'oklch(0.55 0.17 5 / .12)' }: { icono: NombreIcono; titulo: string; derecha?: ReactNode; color?: string; fondo?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl" style={{ background: fondo, color }}>
        <Icono nombre={icono} size={19} />
      </span>
      <span className="flex-1" style={{ font: "400 22px/1 'Instrument Serif',serif" }}>
        {titulo}
      </span>
      {derecha}
    </div>
  )
}

/** Algo que falta por reservar: la banda frambuesa con su icono, el nombre y [Reservar]. */
export function FilaPorReservar({ icono, nombre, onReservar }: { icono: NombreIcono; nombre: string; onReservar: () => void }) {
  return (
    <div className="flex min-h-16 overflow-hidden rounded-2xl bg-white" style={{ border: '1px solid rgba(28,34,48,.08)' }}>
      <span className="flex w-[50px] flex-none items-center pl-[11px] text-white" style={{ background: FRAMBUESA, clipPath: 'polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)' }}>
        <Icono nombre={icono} size={18} />
      </span>
      <span className="min-w-0 flex-1 self-center py-2 pl-1.5 pr-1" style={{ font: "400 17px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        {nombre}
      </span>
      <button type="button" onClick={onReservar} className="h-11 flex-none self-center pl-1 pr-2.5" aria-label={`Reservar ${nombre}`}>
        <span className="flex h-[34px] items-center rounded-full px-3.5 text-[12.5px] font-semibold text-white" style={{ background: FRAMBUESA, boxShadow: '0 8px 16px -8px oklch(0.55 0.17 5)' }}>
          Reservar
        </span>
      </button>
    </div>
  )
}

/** Algo ya hecho: en verde con su ✓. */
export function FilaHecha({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-[46px] items-center gap-[9px] rounded-[14px] px-3 py-1.5" style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .3)' }}>
      <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-white" style={{ background: VERDE }}>
        <Icono nombre="hecho" size={12} grosor={2.6} />
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-medium leading-[1.35]">{texto}</span>
    </div>
  )
}
