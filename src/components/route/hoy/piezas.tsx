import { BOTON_ORO } from '../../ui/botonesOro'
import type { ReactNode } from 'react'
import { Icono } from '../../ui/Icono'
import type { NombreIcono } from '../../../lib/iconos'
import { botonChampan } from '../../../lib/marcaBoton'

/** Los colores de HOY (diseño «Hoy, según el momento»): tinta, frambuesa (falta), verde (hecho) y azul (el tiempo). */
export const TINTA = '#1C2230'
export const FRAMBUESA = 'rgb(var(--frambuesa))'
export const VERDE = 'oklch(0.55 0.11 150)'
export const AZUL = 'oklch(0.56 0.1 230)'

/**
 * LA TARJETA DE LA SIGUIENTE PARADA (Tanda 10, Marca JUTRIP 02 · 09 «HOY en modo claro»): clara (tarjeta #FFFDF8, filo de oro, letra de tinta, [Visto] en verde y [Cómo llegar] en oro).
 * La app ya no tiene modo noche: solo estos estilos.
 */
export const SOMBRA_TARJETA_CLARA = '0 14px 28px -16px rgba(28,34,48,.45),inset 0 0 0 1px rgba(166,124,82,.22)'
/** [Cómo llegar]: el degradado de marfil con letra de oro profundo. */
export const botonOro = () => botonChampan()
/** Los botones de borde (No me da tiempo, Más visitas, Sobre este lugar…): filo de tinta. */
export const clasesBotonBorde = () => 'border-[1.5px] border-[#1C2230]/30 text-[#1C2230] hover:bg-[#1C2230]/5'
/** Las pastillas pequeñas de la tarjeta (Ubicación, duración): un velo de oro. */
export const fondoPastilla = () => 'rgba(166,124,82,.1)'

export const ojoMono = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase' as const }

/**
 * LA ETIQUETA PEQUEÑA de HOY (Noche 24-25 nov): una pastilla de 10,5-11 px en negrita con su tono. UNA sola pieza para «Contiene recompensa» (oro), «Lo tienes el …» (azul), la hora de una reserva (verde),
 * «Cierra en 25 min» (rojo)… El tono cambia el color, nunca la forma.
 */
const TONOS_ETIQUETA = {
  oro: { background: 'rgba(181,138,46,.2)', color: '#6E5018', border: '1px solid transparent' },
  azul: { background: 'rgba(46,95,138,.14)', color: '#2E5F8A', border: '1px solid transparent' },
  verde: { background: 'oklch(0.96 0.035 150)', color: 'oklch(0.3 0.08 150)', border: '1px solid oklch(0.55 0.11 150 / .3)' },
  rojo: { background: '#FBE6E2', color: '#8A2A1F', border: '1px solid #E5766B' },
} as const
export function Etiqueta({ tono = 'oro', children, datos, grande = false, className = '' }: { tono?: keyof typeof TONOS_ETIQUETA; children: ReactNode; datos?: Record<string, string>; /** La de un aviso suelto («Cierra en 25 min»): más alta y de 12 px. */ grande?: boolean; className?: string }) {
  return (
    <span {...datos} className={`inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full font-bold ${grande ? 'h-8 px-2.5 text-[12px]' : 'h-5 px-2 text-[10.5px]'} ${className}`} style={TONOS_ETIQUETA[tono]}>
      {children}
    </span>
  )
}

/**
 * EL BOTÓN AZUL OSCURO de HOY (Noche 24-25 nov; Design «Lugares Pendientes» L2, [Pasar todos a otros días]): azul tinta con letra y filo dorados. UNO solo para [Pasar todos…], [Ver solución], [Añadir] foto,
 * [Añadir] alojamiento y el punto de encuentro: nunca se vuelve a escribir. Va con `rounded-2xl` (16) y altura 44-48.
 */
export const BOTON_AZUL = { background: '#1C2230', color: '#F3D88F', boxShadow: '0 12px 20px -14px rgba(28,34,48,.8),inset 0 0 0 1.5px rgba(243,213,154,.55)' } as const
/** (V80) El botón verde de «lo hecho» ([He terminado], [He embarcado]): el de la tarjeta de la parada. */
export const BOTON_VERDE = { background: 'linear-gradient(180deg,#3E9A5E,#2B7F45)', color: '#FFFFFF', boxShadow: '0 10px 16px -12px rgba(30,100,60,.8),inset 0 1px 0 rgba(255,255,255,.25)' } as const

/**
 * EL ENLACE PEQUEÑO «Dejarlo como está» de HOY (Design «Lugares Pendientes» L4): una línea subrayada en oro profundo, bajo el botón dorado. UNO solo en todas las hojas de HOY.
 */
export function EnlaceDejarlo({ onClick, texto = 'Dejarlo como está', datos }: { onClick: () => void; texto?: string; datos?: Record<string, string> }) {
  return (
    <button type="button" onClick={onClick} {...datos} className="flex min-h-11 items-center justify-center text-center text-[14px] font-semibold underline underline-offset-[3px]" style={{ color: '#8E6820' }}>
      {texto}
    </button>
  )
}

/**
 * EL ENLACE DE UN AVISO de arriba de HOY (Design «Aviso Cierre» A1: «Pasarlo a otro día»): una línea subrayada, 700 14 px, bajo el texto del aviso. UNO solo para [Ver solución], [Ver alternativa], [Ver plan]…
 * `color`: el del texto del aviso (ámbar #8A4E06 por defecto).
 */
export function EnlaceDeAviso({ texto, onClick, color = '#8A4E06', datos, className = '' }: { texto: string; onClick: () => void; color?: string; datos?: Record<string, string>; className?: string }) {
  return (
    <button type="button" onClick={onClick} {...datos} className={`flex min-h-11 flex-none items-center self-start text-[14px] font-bold underline underline-offset-[3px] ${className}`} style={{ color }}>
      {texto}
    </button>
  )
}

/**
 * EL RECUADRO DE PUNTOS de HOY (Noche 24-25 nov; Design «Parada Tarjeta» T1, la ubicación): fondo marfil, borde de puntos dorado y esquinas de 18. UNA sola pieza para «Sin tu ubicación…», «Estás lejos…»,
 * «Tu alojamiento sin dirección» y los huecos de «Empieza otro viaje»; los botones de dentro son `BOTON_ORO` y `BOTON_CLARO`.
 */
export function RecuadroDePuntos({ children, className = '', ...resto }: { children: ReactNode; className?: string; [dato: `data-${string}`]: string | undefined }) {
  return (
    <div {...resto} className={`flex flex-none rounded-[18px] p-3 ${className}`} style={{ background: '#FBF3E2', border: '1px dashed rgba(181,138,46,.6)' }}>
      {children}
    </div>
  )
}

/** La caja blanca de HOY (esquinas de 22, borde fino y sombra suave). */
export function CajaBlanca({ children, className = '', ...resto }: { children: ReactNode; className?: string; [dato: `data-${string}`]: string | undefined }) {
  return (
    <div {...resto} className={`flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5 ${className}`} style={{ border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 1px 2px rgba(28,34,48,.05),0 12px 30px -22px rgba(28,34,48,.35)' }}>
      {children}
    </div>
  )
}

/** La tarjeta oscura grande de HOY, con su resplandor de color en una esquina. */
export function TarjetaOscura({ children, brillo = 'rgba(233,199,122,.32)', abajo = false }: { children: ReactNode; brillo?: string; abajo?: boolean }) {
  return (
    <div className="relative flex flex-none flex-col gap-1 overflow-hidden rounded-[26px] bg-[#1C2230] px-5 pb-[18px] pt-5 text-[#FFFDF8]" style={{ boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
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
export function CabeceraCaja({ icono, titulo, derecha, color = 'rgb(var(--accent))', fondo = '#F1E3BF' }: { icono: NombreIcono; titulo: string; derecha?: ReactNode; color?: string; fondo?: string }) {
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
        <span className="flex h-[34px] items-center rounded-xl px-3.5 text-[12.5px] font-bold" style={BOTON_ORO}>
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
