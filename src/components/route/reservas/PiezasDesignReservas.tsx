import { type CSSProperties, type ReactNode } from 'react'
import { LapizDeReserva } from './BotonesDeReserva'
import type { Persona } from '../../../store/useViajeCompartido'
import { inicialDe, nombreDe } from '../../../store/useViajeCompartido'

/**
 * (10S8, agente D) Las piezas de `Piezas/Entradas Billete` (E1-E5, A1-A3) que comparten «Entradas y Free Tour» y «Alojamiento»:
 * la cabecera clara (icono, título y estado a la derecha, SIN línea de texto debajo), la tarjeta crema, los dos lápices (44 × 44 de toque, círculo azul noche de 30 px),
 * la papelera roja (44 × 44, círculo de 38 px), las cajas de día y hora, las filas con icono redondo y el botón del documento (con el candado dorado si no hay pase).
 */

export const CREMA = '#FBF3E2'
export const MARRON = '#6E5018'

const NOMBRE_TRAZOS = {
  lapiz: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  papelera: 'M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v5M14 11v5',
  euro: 'M17 7a6 6 0 1 0 0 10M5 10h8M5 14h8',
  entrada: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12',
  cama: 'M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-8v5',
  direccion: 'M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  horas: 'M14 10a4 4 0 1 0-3.5 4L14 17.5h2.5V20H19v-2.5M10 10h.01',
  telefono: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2',
  reloj: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  ampliar: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  candado: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  llegar: 'M13 4a1 1 0 1 0 0 .01M10 21l2-7-3-3 1-5 4 2 3 1M7 12l3-1',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  coche: 'M3 15.5V13l2-1.5 2.2-4.2A1.5 1.5 0 0 1 8.5 6.5h5.8a1.5 1.5 0 0 1 1.3.8L17.8 11.5 20.5 13v2.5H3zM8.5 6.5L7.4 11.5H17.8M12 6.5v5M7.5 15.5a2.2 2.2 0 1 0 .01 0M16.5 15.5a2.2 2.2 0 1 0 .01 0',
} as const
export type TrazoDesign = keyof typeof NOMBRE_TRAZOS

export function Trazo({ d, size = 16, color = MARRON, grosor = 1.8 }: { d: TrazoDesign; size?: number; color?: string; grosor?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d={NOMBRE_TRAZOS[d]} />
    </svg>
  )
}

/** El bloque claro: la tarjeta blanca de Design (24 px de esquina, 14 px de relleno) con su cabecera y sus tarjetas crema dentro. */
export function BloqueClaro({ bloque, children }: { bloque: string; children: ReactNode }) {
  return (
    <div data-blk={bloque} data-bloque-claro className="flex flex-col gap-3 rounded-[24px] bg-[#FFFDF8] p-3.5" style={{ border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 12px 30px -22px rgba(28,34,48,.35)' }}>
      {children}
    </div>
  )
}

/** La cabecera de Design: el icono, el título en una línea y el estado a la derecha en su píldora. NADA de texto debajo del título. */
export function CabeceraClara({ icono, titulo, estado, onClick, datos }: { icono: 'entrada' | 'cama'; titulo: string; estado: ReactNode; onClick?: () => void; datos?: string }) {
  return (
    <div onClick={onClick} data-cabecera-clara={datos} className={`flex items-center gap-2.5 ${onClick ? 'cursor-pointer' : ''}`}>
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px]" style={{ background: '#F3E3B2' }}>
        <Trazo d={icono} size={22} />
      </span>
      <span className="min-w-0 flex-1 whitespace-nowrap" data-titulo-bloque style={{ font: "400 19px/1 'Instrument Serif',serif" }}>
        {titulo}
      </span>
      {estado}
    </div>
  )
}

/** La píldora del estado: «1 de 8 reservadas» (dorada), «Listo» (verde, con ✓) o «Falta» (rosa). */
export function PildoraEstado({ tipo, children, datos }: { tipo: 'cuenta' | 'listo' | 'falta'; children: ReactNode; datos?: string }) {
  const est: CSSProperties =
    tipo === 'listo'
      ? { background: 'rgba(43,127,69,.12)', color: '#2B7F45' }
      : tipo === 'falta'
        ? { background: 'rgba(179,38,46,.1)', color: '#B3262E' }
        : { background: '#F3E3B2', color: MARRON }
  return (
    <span data-estado={tipo === 'listo' ? 'hecho' : 'falta'} data-estado-pildora={datos} className="inline-flex h-6 flex-none items-center gap-1 whitespace-nowrap rounded-full px-2" style={{ font: "600 11.5px 'Geist'", ...est }}>
      {tipo === 'listo' && <Trazo d="check" size={12} color="#2B7F45" grosor={2.4} />}
      {children}
    </span>
  )
}

/** La tarjeta crema de una entrada o de un alojamiento (E1, A1). */
export function TarjetaCrema({ children, datos, className = '' }: { children: ReactNode; datos?: string; className?: string }) {
  return (
    <div data-tarjeta-crema={datos} className={`relative flex flex-col gap-3 rounded-[20px] px-4 py-3.5 ${className}`} style={{ background: CREMA, border: '1px solid rgba(181,138,46,.35)' }}>
      {children}
    </div>
  )
}

/** Una fila con su icono redondo dorado claro («50 €», «Localizador ABC123»). */
export function FilaIcono({ icono, children, datos }: { icono: TrazoDesign; children: ReactNode; datos?: string }) {
  return (
    <span className="flex items-center gap-2.5" style={{ font: "600 14px 'Geist'" }} data-fila-design={datos}>
      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: '#F3E3B2' }}>
        <Trazo d={icono} size={15} />
      </span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </span>
  )
}

/** Las dos iniciales juntas de Design («E V · Eric · Viajes»): el administrador en azul noche, los demás en dorado. */
export function ParaQuienDesign({ gente }: { gente: Persona[] }) {
  if (gente.length === 0) return null
  const nombres = gente.map((p) => (p.esYo ? 'Tú' : nombreDe(p) || 'Alguien')).join(' · ')
  return (
    <span className="flex items-center gap-2.5" data-para-quien-design>
      <span className="flex">
        {gente.slice(0, 4).map((p, i) => (
          <span
            key={p.id}
            className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full"
            style={{ marginLeft: i === 0 ? 0 : -8, background: p.esAdmin ? '#1C2230' : '#B58A2E', color: p.esAdmin ? '#F3D88F' : '#fff', font: "700 12.5px 'Geist'", border: `2px solid ${CREMA}`, boxSizing: 'content-box' }}
          >
            {inicialDe(p)}
          </span>
        ))}
      </span>
      <span style={{ font: "600 14px 'Geist'" }}>{nombres}</span>
    </span>
  )
}

/** La sección de los datos de Design: línea de puntos arriba y abajo, con el lápiz del bloque a la derecha, a la altura de «para quién». */
export function SeccionDatos({ children, onLapiz, etiquetaLapiz, datos, sinLineaAbajo = false }: { children: ReactNode; onLapiz?: () => void; etiquetaLapiz: string; datos?: string; sinLineaAbajo?: boolean }) {
  return (
    <div className="relative flex flex-col gap-3 py-3 pr-11" data-seccion-datos={datos} style={{ borderTop: '1px dotted rgba(28,34,48,.28)', borderBottom: sinLineaAbajo ? undefined : '1px dotted rgba(28,34,48,.28)' }}>
      {onLapiz && (
        <span className="absolute -right-[7px] top-[5px]">
          <LapizDeReserva onClick={onLapiz} etiqueta={etiquetaLapiz} datos={`${datos ?? 'bloque'}-datos`} />
        </span>
      )}
      {children}
    </div>
  )
}

/** La caja del día («VIERNES / 27 de noviembre») de Design. */
export function CajaDia({ rotulo, grande, pequeno = false }: { rotulo: string; grande: string; pequeno?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-[16px] px-3.5 py-[9px]" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }} data-caja-dia>
      <span className="whitespace-nowrap uppercase" style={{ font: pequeno ? "600 9px 'Geist Mono',monospace" : "600 9.5px 'Geist Mono',monospace", letterSpacing: pequeno ? '.08em' : '.16em', color: MARRON }}>
        {rotulo}
      </span>
      <span style={{ font: "400 26px/1.05 'Instrument Serif',serif" }}>{grande}</span>
    </div>
  )
}

/** La caja azul noche de la hora («HORA 09:15»). */
export function CajaHora({ hora }: { hora: string }) {
  return (
    <div className="flex flex-none flex-col items-start justify-center gap-0.5 rounded-[16px] px-3.5 py-[9px]" style={{ background: '#1C2230' }} data-caja-hora>
      <span className="flex items-center gap-[5px]" style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#F3D88F' }}>
        <Trazo d="reloj" size={17} color="#F3D88F" grosor={1.9} />
        HORA
      </span>
      <span style={{ font: "400 28px/1 'Instrument Serif',serif", color: '#F3D88F' }}>{hora}</span>
    </div>
  )
}

/** La caja azul noche de las noches («3 NOCHES»). */
export function CajaNoches({ noches }: { noches: number }) {
  return (
    <div className="flex min-w-[84px] flex-none flex-col items-center justify-center gap-[3px] rounded-[16px] px-3.5 py-[9px]" style={{ background: '#1C2230' }} data-caja-noches>
      <span style={{ font: "400 36px/1 'Instrument Serif',serif", color: '#F3D88F' }}>{noches}</span>
      <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#F3D88F' }}>{noches === 1 ? 'NOCHE' : 'NOCHES'}</span>
    </div>
  )
}
