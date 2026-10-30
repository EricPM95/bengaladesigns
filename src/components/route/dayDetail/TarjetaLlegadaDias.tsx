import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { DatosBillete } from '../../../lib/billete'
import { puntoCorto, type ArrivalPoint } from '../../../lib/arrivalReturn'
import { ModeIcon } from './ArrivalReturnBar'

const AZUL = '#1F2E66'
const useEfectoDeMedida = typeof window !== 'undefined' ? useLayoutEffect : useEffect
const FUENTE_HORA = "400 21px/1.05 'Instrument Serif',serif"

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
  // (10S3, `Alojamiento Dias` 03 y 03b) «BCN 08:30 → FCO 11:15» con los dos lados; sin el de fuera, solo el de Roma («FCO 11:15»). Con el de fuera, la cabecera nombra la ciudad de salida; sin él, «LLEGADA · ROMA».
  const fuera = [billete.codigoOtro, billete.horaOtra].filter(Boolean).join(' ')
  const roma = `${billete.codigoRoma} ${billete.horaRoma}`
  const eyebrow = `LLEGADA · ${fuera && origen ? `${origen.toUpperCase()} → ` : ''}${destino.toUpperCase()}`
  // La hora de llegada a Roma NUNCA se corta: si «BCN 08:30 → FCO 11:15» no cabe en una línea, el lado de fuera va arriba, pequeño, y «FCO 11:15» grande debajo.
  const columna = useRef<HTMLSpanElement>(null)
  const medida = useRef<HTMLSpanElement>(null)
  const [apilado, setApilado] = useState(false)
  useEfectoDeMedida(() => {
    const caja = columna.current
    const una = medida.current
    if (!caja || !una || !fuera) return
    const medir = () => setApilado(una.offsetWidth > caja.clientWidth + 0.5)
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const observador = new ResizeObserver(medir)
    observador.observe(caja)
    return () => observador.disconnect()
  }, [fuera, roma])
  const unaLinea = fuera ? `${fuera} → ${roma}` : roma
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKey}
      data-billete={billete.kind}
      data-llegada-dias
      aria-label={`${eyebrow} · ${unaLinea}`}
      style={{ minHeight: 76, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 22, background: '#FFFDF8', border: '1px solid rgba(31,46,102,.28)', boxShadow: '0 10px 22px -16px rgba(60,40,10,.5)', boxSizing: 'border-box', cursor: 'pointer' }}
    >
      <span aria-hidden="true" style={{ width: 46, height: 46, flex: 'none', borderRadius: 14, background: 'linear-gradient(150deg,#2B3F8C,#1F2E66)', boxShadow: '0 0 0 1.5px #1F2E66', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F3D88F' }}>
        <ModeIcon mode={billete.mode} size={22} />
      </span>
      <span ref={columna} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', lineHeight: 1.25, color: AZUL, overflowWrap: 'anywhere' }}>{eyebrow}</span>
        {fuera && (
          <span ref={medida} aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'nowrap', font: FUENTE_HORA, left: 0, top: 0 }}>
            {unaLinea}
          </span>
        )}
        {fuera && apilado ? (
          <>
            <span data-llegada-fuera style={{ font: "600 11.5px 'Geist Mono',monospace", letterSpacing: '.06em', color: 'rgba(28,34,48,.6)', whiteSpace: 'nowrap' }}>{fuera} →</span>
            <span data-llegada-roma style={{ font: FUENTE_HORA, whiteSpace: 'nowrap' }}>{roma}</span>
          </>
        ) : (
          <span data-llegada-roma data-llegada-linea style={{ font: FUENTE_HORA, whiteSpace: 'nowrap' }}>
            {unaLinea}
          </span>
        )}
        {lugar && (
          <span style={{ font: "500 12px 'Geist'", lineHeight: 1.3, color: 'rgba(28,34,48,.6)' }}>
            {lugar} · Cómo llegar desde {desdeDonde(billete.mode)}
          </span>
        )}
      </span>
      <span style={{ height: 42, padding: '0 15px', borderRadius: 999, background: AZUL, color: '#FFFDF8', boxShadow: '0 8px 14px -8px rgba(31,46,102,.7)', display: 'flex', alignItems: 'center', font: "700 13.5px 'Geist',sans-serif", flex: 'none' }}>Ver</span>
    </div>
  )
}
