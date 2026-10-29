import type { KeyboardEvent } from 'react'
import type { DatosBillete } from '../../../lib/billete'
import { puntoCorto, type ArrivalPoint } from '../../../lib/arrivalReturn'
import { ModeIcon } from './ArrivalReturnBar'

const AZUL = '#1F2E66'

/** «Aterrizas a las 15:40» / «Desembarcas a las 15:40» / «Llegas a las 15:40». */
const verboDeLlegada = (mode: DatosBillete['mode']): string => (mode === 'avion' ? 'Aterrizas' : mode === 'ferry' ? 'Desembarcas' : 'Llegas')

/** «Cómo llegar desde el aeropuerto», «…la estación», «…el puerto». */
const desdeDonde = (mode: DatosBillete['mode']): string => (mode === 'avion' ? 'el aeropuerto' : mode === 'ferry' ? 'el puerto' : 'la estación')

/**
 * LA TARJETA DE LA LLEGADA EN DÍAS, con la hora del viajero (Tanda 10N11 §4; `Piezas/Alojamiento Dias` 03): «LLEGADA · BARCELONA → ROMA», «Aterrizas a las 15:40» y debajo
 * «Fiumicino · Cómo llegar desde el aeropuerto», con [Ver] (abre la ficha de llegada). SOLO la hora que puso el viajero: la app no enseña horas calculadas (nada de «libre hacia las 17:40»).
 * Conserva `data-billete="llegada"` (es el mismo billete, con otra cara).
 */
export function TarjetaLlegadaDias({ billete, point, origen, destino, onOpen }: { billete: DatosBillete; point: ArrivalPoint | null; origen: string; destino: string; onOpen: () => void }) {
  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }
  const lugar = point ? puntoCorto(point) : null
  const eyebrow = `LLEGADA · ${origen ? `${origen.toUpperCase()} → ` : ''}${destino.toUpperCase()}`
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKey}
      data-billete={billete.kind}
      data-llegada-dias
      aria-label={`${eyebrow} · ${verboDeLlegada(billete.mode)} a las ${billete.horaRoma}`}
      style={{ minHeight: 76, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 22, background: '#FFFDF8', border: '1px solid rgba(31,46,102,.28)', boxShadow: '0 10px 22px -16px rgba(60,40,10,.5)', boxSizing: 'border-box', cursor: 'pointer' }}
    >
      <span aria-hidden="true" style={{ width: 46, height: 46, flex: 'none', borderRadius: 14, background: 'linear-gradient(150deg,#2B3F8C,#1F2E66)', boxShadow: '0 0 0 1.5px #1F2E66', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F3D88F' }}>
        <ModeIcon mode={billete.mode} size={22} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: AZUL, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eyebrow}</span>
        <span style={{ font: "400 21px/1.05 'Instrument Serif',serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {verboDeLlegada(billete.mode)} a las {billete.horaRoma}
        </span>
        {lugar && (
          <span style={{ fontSize: 12, lineHeight: 1.25, color: 'rgba(28,34,48,.6)' }}>
            {lugar} · Cómo llegar desde {desdeDonde(billete.mode)}
          </span>
        )}
      </span>
      <span style={{ height: 42, padding: '0 15px', borderRadius: 999, background: AZUL, color: '#FFFDF8', boxShadow: '0 8px 14px -8px rgba(31,46,102,.7)', display: 'flex', alignItems: 'center', font: "700 13.5px 'Geist',sans-serif", flex: 'none' }}>Ver</span>
    </div>
  )
}
