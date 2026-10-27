import type { ReactNode } from 'react'
import { TicketDesign } from './EntradaEdgeTab'

/**
 * LO TUYO ARRIBA DEL TODO EN LA PESTAÑA «ENTRADAS» (Tanda 10N4, `Piezas/Ficha Cabecera` 03 y 04). Dos recuadros, tal cual Design:
 *   - `EntradaDelGrupo` (03): otro del grupo ya la tiene y tú no. Azul oscuro con dorado: «Eric la tiene para el jueves 12 · 11:45», [Reservar la mía a la misma hora] y «¿Ya la tienes? Ya la tengo».
 *   - `TuEntrada` (04): ya tienes la tuya. VERDE con ✓: «Tu entrada», la hora en grande, «Museos Capitolinos · jueves 12», [Cambiar hora] y [Ver entrada] (este, en azul oscuro).
 * Los colores y las medidas son los de Design; solo cambian los datos.
 */

const ORO = '#E9C77A'
const CREMA = '#FBF3E2'

export function EntradaDelGrupo({ quien, cuando, onReservar, onYaLaTengo }: { quien: string; cuando: string; onReservar: () => void; onYaLaTengo: () => void }) {
  return (
    <div data-ficha-seccion="entrada-del-grupo" data-quien-va className="flex flex-col gap-3 rounded-[20px] px-4 py-3.5" style={{ background: '#1C2230', color: CREMA }}>
      <div className="flex items-center justify-center gap-[9px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ORO} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
          <path d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
        </svg>
        <span className="font-display text-[21px] leading-[1.1]">
          {quien} la tiene para el <b data-cuando style={{ fontWeight: 400, color: ORO }}>{cuando}</b>
        </span>
      </div>
      <button type="button" data-reservar-la-mia onClick={onReservar} className="flex h-12 items-center justify-center rounded-[14px] text-[15px] font-bold active:scale-[.98]" style={{ background: ORO, color: '#1C2230' }}>
        Reservar la mía a la misma hora
      </button>
      <p className="text-center text-[13.5px]" style={{ color: 'rgba(251,243,226,.7)' }}>
        ¿Ya la tienes?{' '}
        <button type="button" data-ya-la-tengo onClick={onYaLaTengo} className="font-semibold underline underline-offset-[3px]" style={{ color: ORO }}>
          Ya la tengo
        </button>
      </p>
    </div>
  )
}

export function TuEntrada({
  hora,
  sitio,
  onCambiarHora,
  onVerEntrada,
  children,
}: {
  hora: string
  /** «Museos Capitolinos · jueves 12». */
  sitio: string
  /** Sin esto (te cubre la entrada del dueño y no es tuya para cambiarla), [Cambiar hora] no sale. */
  onCambiarHora: (() => void) | null
  onVerEntrada: () => void
  children?: ReactNode
}) {
  return (
    <div
      data-ficha-seccion="tu-entrada"
      className="relative flex flex-col gap-3 overflow-hidden rounded-[24px] p-4"
      style={{ background: 'linear-gradient(150deg,#EAF6EC,#D9EEDD)', border: '1px solid rgba(43,127,69,.5)', boxShadow: '0 14px 24px -18px rgba(43,127,69,.7)' }}
    >
      <span className="absolute -right-[26px] -top-[30px] h-[120px] w-[120px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(43,127,69,.2),transparent 70%)' }} aria-hidden="true" />
      <div className="relative flex items-center gap-[13px]">
        <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full" style={{ background: 'linear-gradient(145deg,#3FA066,#2B7F45)', boxShadow: '0 8px 14px -8px rgba(43,127,69,.8), inset 0 1px 0 rgba(255,255,255,.35)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: '#2B7F45' }}>TU ENTRADA</span>
          <span data-tu-hora className="font-display text-[30px] leading-none text-text">
            {hora}
          </span>
          <span className="text-[13px] font-medium leading-[1.3]" style={{ color: 'rgba(28,34,48,.7)' }}>
            {sitio}
          </span>
        </span>
      </div>
      <div className="relative flex gap-2">
        {onCambiarHora && (
          <button
            type="button"
            data-cambiar-hora
            onClick={onCambiarHora}
            className="flex h-[42px] flex-1 items-center justify-center gap-[7px] rounded-[13px] text-[14px] font-semibold text-text active:scale-[.98]"
            style={{ background: '#FFFDF8', border: '1px solid rgba(43,127,69,.4)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B7F45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h13l-3-3M20 17H7l3 3" />
            </svg>
            Cambiar hora
          </button>
        )}
        <button type="button" data-ver-entrada onClick={onVerEntrada} className="flex h-[42px] flex-1 items-center justify-center gap-[7px] rounded-[13px] text-[14px] font-semibold active:scale-[.98]" style={{ background: '#1C2230', color: '#F3D88F' }}>
          <TicketDesign size={16} color="#F3D88F" grosor={2} />
          Ver entrada
        </button>
      </div>
      {children}
    </div>
  )
}
