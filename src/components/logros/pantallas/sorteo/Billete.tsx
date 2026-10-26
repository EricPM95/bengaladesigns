import type { ReactNode } from 'react'
import { miles } from '../perfil/util'
import type { EstadoDelSorteo } from './api'
import './sorteo.css'

const Brillo = ({ x, y, tam, retraso }: { x: number; y: number; tam: number; retraso: number }): ReactNode => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true" style={{ position: 'absolute', left: x, top: y, animation: `soTw 2.6s ${retraso}s ease-in-out infinite` }}>
    <path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5Z" fill="#FFF8E0" />
  </svg>
)

/** El texto del billete en cada estado (lo mismo que dice el botón de abajo de la página). */
export function textoDelBillete(s: EstadoDelSorteo): string {
  if (s.estado === 'sin_nivel') return `Te faltan ${miles(s.falta_exp)} EXP para el nivel ${s.nivel_minimo}`
  if (s.estado === 'falta_viaje') return 'Ya tienes el nivel. Haz un viaje con HOY activado y entras.'
  return 'Estás dentro'
}

/**
 * EL BILLETE DEL SORTEO EN EL PERFIL (`Piezas/Sorteo Perfil` del diseño): un billete dorado debajo de la tarjeta de EXP, con sus tres estados —«Te faltan 340 EXP para el nivel 3» con su barrita,
 * «Ya tienes el nivel. Haz un viaje con HOY activado y entras.» y [✓ Estás dentro] (con su latido)—. Al tocarlo se abre la página del sorteo. Todo sale de `sorteo` (lo que manda el servidor).
 */
export function BilleteDelSorteo({ sorteo, onAbrir }: { sorteo: EstadoDelSorteo; onAbrir: () => void }): ReactNode {
  const dentro = sorteo.estado === 'dentro'
  const destino = sorteo.edicion.destino
  return (
    <button
      type="button"
      onClick={onAbrir}
      data-billete-sorteo={sorteo.estado}
      data-sorteo-anio={sorteo.edicion.anio}
      aria-label={`Sorteo ${sorteo.edicion.anio}: ${textoDelBillete(sorteo)}. Abrir`}
      className="relative block h-[150px] w-full flex-none overflow-hidden rounded-[26px] border-0 p-0 text-left"
      style={{
        background: 'linear-gradient(115deg,#F8E7B0 0%,#EBCB7E 38%,#D2A845 70%,#B58A2E 100%)',
        boxShadow: `0 18px 30px -14px rgba(139,101,24,.75),inset 0 0 0 1.5px ${dentro ? '#E9C77A' : 'rgba(233,199,122,.35)'},inset 0 -6px 12px rgba(139,101,24,.25)`,
        animation: dentro ? 'soPulse 3s ease-in-out infinite' : undefined,
      }}
    >
      <span aria-hidden="true" className="absolute -top-[9px] h-[18px] w-[18px] rounded-full bg-bg" style={{ left: 91 }} />
      <span aria-hidden="true" className="absolute -bottom-[9px] h-[18px] w-[18px] rounded-full bg-bg" style={{ left: 91 }} />
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{ left: -70, top: -70, width: 270, height: 270, background: 'repeating-conic-gradient(from 0deg,rgba(255,255,255,.34) 0 7deg,transparent 7deg 18deg)', WebkitMask: 'radial-gradient(circle,#000 18%,transparent 68%)', mask: 'radial-gradient(circle,#000 18%,transparent 68%)', animation: 'soSpin 36s linear infinite' }}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute" style={{ top: '-20%', bottom: '-20%', left: 0, width: '22%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)', animation: 'soShine 4.5s ease-in-out infinite' }} />
      </span>
      <Brillo x={120} y={10} tam={12} retraso={0} />
      <Brillo x={300} y={22} tam={10} retraso={0.9} />
      <Brillo x={250} y={6} tam={8} retraso={1.7} />
      <span aria-hidden="true" className="absolute" style={{ left: 100, top: 10, bottom: 10, borderLeft: '2px dashed rgba(58,42,10,.45)' }} />
      <span className="absolute bottom-0 left-0 top-0 flex w-[100px] flex-col items-center justify-center gap-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C2230]" style={{ boxShadow: '0 6px 12px -4px rgba(58,42,10,.7)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
          </svg>
        </span>
        <span data-billete-anio style={{ font: "400 34px/1 'Instrument Serif',serif", color: '#3A2A0A' }}>
          {sorteo.edicion.anio}
        </span>
        <span style={{ font: "700 8.5px 'Geist Mono',monospace", letterSpacing: '.2em', color: '#6F4E37' }}>SORTEO</span>
      </span>
      <span className="absolute flex flex-col justify-between" style={{ left: 118, right: 16, top: 14, bottom: 12 }}>
        <span className="flex flex-col gap-[3px]">
          <span style={{ font: "700 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37' }}>GRAN PREMIO ANUAL</span>
          <span data-billete-premio style={{ font: "400 25px/1.05 'Instrument Serif',serif", color: '#2A1D06' }}>
            {destino ? (
              <>
                Un viaje a <em>{destino}</em>
              </>
            ) : (
              <>
                Un viaje al <em>destino del año</em>
              </>
            )}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {sorteo.estado === 'sin_nivel' && (
            <>
              <span data-billete-texto style={{ flex: 1, font: "600 12.5px/1.3 'Geist'", color: '#2A1D06' }}>
                {textoDelBillete(sorteo)}
              </span>
              <span aria-hidden="true" className="block h-[6px] w-[58px] flex-none overflow-hidden rounded-[3px]" style={{ background: 'rgba(58,42,10,.2)' }}>
                <span data-billete-barra className="block h-full" style={{ width: `${Math.round(sorteo.barra * 100)}%`, background: '#2A1D06' }} />
              </span>
            </>
          )}
          {sorteo.estado === 'falta_viaje' && (
            <span data-billete-texto style={{ flex: 1, font: "600 12.5px/1.3 'Geist'", color: '#2A1D06' }}>
              {textoDelBillete(sorteo)}
            </span>
          )}
          {dentro && (
            <span data-billete-dentro className="flex h-9 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#1C2230]" style={{ font: "700 14.5px 'Geist'", color: '#F3D88F' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
              Estás dentro
            </span>
          )}
          {!dentro && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A1D06" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
              <path d="M9 5l7 7-7 7" />
            </svg>
          )}
        </span>
      </span>
    </button>
  )
}
