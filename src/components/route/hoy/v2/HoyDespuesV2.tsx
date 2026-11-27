import { BOTON_ORO } from '../../../ui/botonesOro'
import { useEffect, useState } from 'react'
import type { Route } from '../../../../lib/types'
import { addDaysToIso, formatHeaderDateRangeShortEs } from '../../../../lib/dateRange'
import { diasDelViaje, textoDeDuracion } from '../../../../lib/duracionViaje'
import { logrosActivos } from '../../../../lib/logros'
import { empezarViajeNuevo } from '../../../../lib/nuevoViaje'
import { Icono } from '../../../ui/Icono'
import { NewTripSheet } from '../../../layout/NewTripSheet'
import { useMomentosUI } from '../../../logros/momentos/useMomentosUI'
import { abrirElResumenUnaVez } from '../../../../lib/cierreDelViaje'
import { TarjetaRecuerdos } from '../../fotos/TarjetaRecuerdos'
import { HoyDespues } from '../HoyDespues'
import { TarjetaOscura } from '../piezas'

/**
 * HOY después del viaje, versión 2 (8B2). Con los logros encendidos, la pieza del resumen del viaje de «Logros · Momentos» (la abre `useMomentosUI.abrirResumenViaje()`; la monta MomentosHost):
 * se abre sola UNA vez por viaje (V79: `cierreDelViaje.ts`; también al pulsar [Cerrar mi viaje]) y aquí queda [Ver el resumen de mi viaje]. Con los logros apagados, el HOY de después de siempre.
 */
export function HoyDespuesV2({ route, startIso }: { route: Route; startIso: string }) {
  if (!logrosActivos()) return <HoyDespues route={route} startIso={startIso} />
  return <ConResumen route={route} startIso={startIso} />
}

function ConResumen({ route, startIso }: { route: Route; startIso: string }) {
  const [nuevoViaje, setNuevoViaje] = useState(false)
  const totalDias = diasDelViaje(route)
  const finIso = route.answers.dateRange?.end ?? addDaysToIso(startIso, Math.max(0, totalDias - 1))
  // (V79, V74) El resumen sale solo UNA vez por viaje (ya no «una vez por sesión»): si ya salió (solo, o al pulsar [Cerrar mi viaje]), aquí queda [Ver el resumen de mi viaje].
  useEffect(() => {
    abrirElResumenUnaVez(route.id)
  }, [route.id])
  return (
    <>
      <TarjetaOscura brillo="oklch(0.55 0.11 150 / .35)" abajo>
        <span className="relative" style={{ font: "400 38px/1 'Instrument Serif',serif" }}>
          Tu viaje a <em style={{ color: '#E9C77A' }}>{route.destination}</em>
        </span>
        <span className="relative text-[#FFFDF8]/75" style={{ font: "500 12px 'Geist Mono',monospace" }}>
          {textoDeDuracion(totalDias)} · {formatHeaderDateRangeShortEs(startIso, finIso)}
        </span>
        <button type="button" onClick={() => useMomentosUI.getState().abrirResumenViaje()} className="relative mt-3 flex h-[52px] items-center justify-center gap-2 rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
          Ver el resumen de mi viaje
          <Icono nombre="flecha" size={15} grosor={2.2} />
        </button>
      </TarjetaOscura>

      <TarjetaRecuerdos route={route} />

      <div className="flex flex-none items-center gap-3 rounded-[22px] bg-[#FFFDF8] py-3.5 pl-[18px] pr-3.5" style={{ border: '1px dashed rgba(28,34,48,.22)' }}>
        <span className="min-w-0 flex-1" style={{ font: "400 22px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>
          ¿A dónde vamos <em style={{ color: '#E9C77A' }}>ahora</em>?
        </span>
        <button type="button" onClick={() => setNuevoViaje(true)} className="flex h-11 flex-none items-center gap-1.5 rounded-2xl pl-3 pr-4 text-[13.5px] font-bold" style={BOTON_ORO}>
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
