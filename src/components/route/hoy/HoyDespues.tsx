import { useState } from 'react'
import type { Route } from '../../../lib/types'
import { addDaysToIso, formatHeaderDateRangeShortEs, formatWeekdayAbbrEs } from '../../../lib/dateRange'
import { empezarViajeNuevo } from '../../../lib/nuevoViaje'
import { Icono } from '../../ui/Icono'
import { NewTripSheet } from '../../layout/NewTripSheet'
import { GaleriaRecuerdos } from '../fotos/GaleriaRecuerdos'
import { CabeceraCaja, CajaBlanca, FRAMBUESA, ojoMono, TarjetaOscura } from './piezas'

/**
 * HOY después del viaje (Tanda 6z3, diseño «Después del viaje»; gratis y de pago): la tarjeta «Tu viaje a Roma» con sus días en fichas de fecha, «Guarda tus recuerdos» con las fotos del viaje
 * (por días) y [Subir mis fotos], y «¿A dónde vamos ahora?» con [+ Nuevo viaje]. (El mapa de viajes del Perfil, con la chincheta de cada viaje, no va todavía.)
 */
export function HoyDespues({ route, startIso }: { route: Route; startIso: string }) {
  const [nuevoViaje, setNuevoViaje] = useState(false)
  const dias = route.days.filter((day) => !day.isReturnLeg)
  const finIso = addDaysToIso(startIso, Math.max(0, dias.length - 1))
  return (
    <>
      <TarjetaOscura brillo="oklch(0.55 0.11 150 / .35)" abajo>
        <span className="relative text-[#FFFDF8]/60" style={ojoMono}>
          Después del viaje
        </span>
        <span className="relative" style={{ font: "400 38px/1 'Instrument Serif',serif" }}>
          Tu viaje a <em style={{ color: 'oklch(0.78 0.11 15)' }}>{route.destination}</em>
        </span>
        <span className="relative text-[#FFFDF8]/75" style={{ font: "500 12px 'Geist Mono',monospace" }}>
          {dias.length} {dias.length === 1 ? 'día' : 'días'} · {formatHeaderDateRangeShortEs(startIso, finIso)}
        </span>
        <div className="relative mt-2.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(dias.length, 1), 5)},1fr)` }}>
          {dias.map((day) => {
            const iso = addDaysToIso(startIso, day.dayNumber - 1)
            return (
              <span key={day.id} className="flex h-[46px] flex-col items-center justify-center gap-0.5 rounded-xl" style={{ background: 'rgba(255,253,248,.08)' }}>
                <span className="text-[#FFFDF8]/55" style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.1em' }}>
                  {formatWeekdayAbbrEs(iso)}
                </span>
                <span style={{ font: "400 19px/1 'Instrument Serif',serif" }}>{Number(iso.slice(8, 10))}</span>
              </span>
            )
          })}
        </div>
      </TarjetaOscura>

      <CajaBlanca>
        <CabeceraCaja icono="camara" titulo="Guarda tus recuerdos" />
        <GaleriaRecuerdos />
      </CajaBlanca>

      <div className="flex flex-none items-center gap-3 rounded-[22px] bg-[#FFFDF8] py-3.5 pl-[18px] pr-3.5" style={{ border: '1px dashed rgba(28,34,48,.22)' }}>
        <span className="min-w-0 flex-1" style={{ font: "400 22px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>
          ¿A dónde vamos <em style={{ color: FRAMBUESA }}>ahora</em>?
        </span>
        <button type="button" onClick={() => setNuevoViaje(true)} className="flex h-11 flex-none items-center gap-1.5 rounded-full bg-[#1C2230] pl-3 pr-4 text-[13.5px] font-semibold text-[#FFFDF8]">
          <Icono nombre="anadir" size={15} grosor={2.2} />
          Nuevo viaje
        </button>
      </div>
      {nuevoViaje && (
        <NewTripSheet
          onConfirm={() => {
            setNuevoViaje(false)
            empezarViajeNuevo()
          }}
          onCancel={() => setNuevoViaje(false)}
        />
      )}
    </>
  )
}
