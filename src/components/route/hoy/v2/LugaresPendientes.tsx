import { useState } from 'react'
import type { DayPlan, Route } from '../../../../lib/types'
import { displayStopName, formatDuration } from '../../../../lib/format'
import type { Pendiente } from '../../../../lib/hoyPendientes'
import { useRouteStore } from '../../../../store/useRouteStore'
import { Icono } from '../../../ui/Icono'
import { HojaPasarAOtroDia } from '../saltar'
import { ParadaFotoDeParada } from './ParadaFoto'

/**
 * «LUGARES PENDIENTES» (V2, A8, H2, H6): lo SALTADO y lo que no dio tiempo o ya ha cerrado, aparte de «Si te sobra tiempo». Va al final de HOY, cerrado con su número (H6) o abierto (H2).
 * Al acabar el día, lo que quedó sin ver pasa solo y sigue saliendo los días siguientes hasta que el viajero decide (`lugaresPendientes` en `src/lib/hoyPendientes.ts`):
 *   [Pasar a otro día] · [Recuperar hoy] (no si ya ha cerrado) · [Ya lo visité] · [Quitar].
 */
const ORO_TEXTO = '#8E6820'

export function LugaresPendientes({ route, day, dateIso, pendientes }: { route: Route; day: DayPlan; dateIso: string; pendientes: Pendiente[] }) {
  const [abierta, setAbierta] = useState(false)
  const [pasando, setPasando] = useState<Pendiente | null>(null)
  const setStopSaltada = useRouteStore((s) => s.setStopSaltada)
  const setStopVisto = useRouteStore((s) => s.setStopVisto)
  const moveStopToDay = useRouteStore((s) => s.moveStopToDay)
  const removeStop = useRouteStore((s) => s.removeStop)
  if (pendientes.length === 0) return null
  const diasPara = (p: Pendiente) => route.days.filter((d) => !d.isReturnLeg && d.id !== p.dayId).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
  const recuperar = (p: Pendiente) => {
    if (p.dayId !== day.id) moveStopToDay(p.stop.id, p.dayId, day.id)
    setStopSaltada(day.id, p.stop.id, false)
  }
  const pasar = (p: Pendiente, aDayId: string) => {
    moveStopToDay(p.stop.id, p.dayId, aDayId)
    setStopSaltada(aDayId, p.stop.id, false)
    setPasando(null)
  }
  const boton = 'flex h-11 items-center justify-center rounded-full px-3.5 text-[12.5px] font-semibold'
  return (
    <div data-hoy-pendientes={pendientes.length} data-hoy-pendientes-estado={abierta ? 'abierta' : 'cerrada'} className="flex flex-none flex-col rounded-2xl" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} data-hoy-pendientes-cabecera className="flex min-h-12 items-center gap-2.5 px-4 text-left">
        <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', textTransform: 'uppercase' }}>Lugares pendientes</span>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-bold" style={{ background: ORO_TEXTO, color: '#fff' }}>{pendientes.length}</span>
        <span className="flex-1" />
        <Icono nombre={abierta ? 'arriba' : 'abajo'} size={15} grosor={2} style={{ color: ORO_TEXTO }} />
      </button>
      {abierta && (
        <ul data-hoy-pendientes-lista className="m-0 flex list-none flex-col divide-y p-0" style={{ borderTop: '1px solid rgba(28,34,48,.08)', borderColor: 'rgba(28,34,48,.08)' }}>
          {pendientes.map((p) => (
            <li key={`${p.dayId}-${p.stop.id}`} data-hoy-pendiente={p.motivo} className="flex flex-col gap-2.5 px-4 py-3">
              <div className="flex items-center gap-3">
                <ParadaFotoDeParada parada={p.stop} ciudad={day.city} dateIso={dateIso} vista={false} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[15px] font-semibold leading-[1.2] text-[#1C2230]">{displayStopName(p.stop.name)}</p>
                  <p className="m-0 mt-0.5 text-[12px] leading-[1.35] text-[#1C2230]/60">
                    {p.stop.durationMinutes > 0 ? `${formatDuration(p.stop.durationMinutes)} · ` : ''}
                    {p.texto}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {diasPara(p).length > 0 && !p.stop.reservedId && (
                  <button type="button" onClick={() => setPasando(p)} data-hoy-pendiente-pasar className={boton} style={{ border: '1px solid rgba(28,34,48,.18)', background: '#fff', color: '#1C2230' }}>
                    Pasar a otro día
                  </button>
                )}
                {p.motivo !== 'cerrada' && (
                  <button type="button" onClick={() => recuperar(p)} data-hoy-pendiente-recuperar className={boton} style={{ border: `1.5px solid ${ORO_TEXTO}`, color: ORO_TEXTO }}>
                    Recuperar hoy
                  </button>
                )}
                <button type="button" onClick={() => setStopVisto(p.dayId, p.stop.id, true)} data-hoy-pendiente-visitado className={boton} style={{ border: '1px solid rgba(28,34,48,.18)', background: '#fff', color: '#1C2230' }}>
                  Ya lo visité
                </button>
                <button type="button" onClick={() => removeStop(p.dayId, p.stop.id)} data-hoy-pendiente-quitar className={boton} style={{ color: '#8A2A1F' }}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {pasando && <HojaPasarAOtroDia dias={diasPara(pasando)} ahora={day.dayNumber} onElegir={(id) => pasar(pasando, id)} onCerrar={() => setPasando(null)} />}
    </div>
  )
}
