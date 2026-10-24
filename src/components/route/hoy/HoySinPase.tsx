import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { usePaseEstado } from '../../../lib/paseEstado'
import { todayIso } from '../../../lib/dateRange'
import { filaDeHoySinPase } from '../../../lib/diaDePrueba'
import { FranjaDiaDePrueba, TarjetaDeLaPrueba } from './TarjetaDeLaPrueba'
import { ListaLoQueTendras } from './HoyAntes'
import { CabeceraHoy, HoyAntesV2, ojoDeViaje } from './v2/HoyAntesV2'
import type { EstadoPase } from '../../../lib/paseEstado'
import { CajaBlanca, ojoMono } from './piezas'
import { Icono } from '../../ui/Icono'

/** El estado de quien no ha comprado el pase: cobro puesto, sin pase (HOY antes del viaje enseña el candado «Pase de Roma» y [Ver el Pase de Roma]). */
const SIN_PASE: EstadoPase = { cobro: true, conPase: false, puede: false, pruebaGastada: false }
/** El de quien tiene el pase: lo mismo sin el candado ni el botón. */
export const CON_PASE: EstadoPase = { cobro: false, conPase: true, puede: true, pruebaGastada: false }

/** HOY antes del viaje, como el diseño (App · HOY 1a con fechas y 1b sin fechas): el encabezado y `HoyAntesV2`. */
export function HoyAntesDelDiseno({ route, startIso, simulada, pase, onPonFechas }: { route: Route; startIso: string | null; simulada: string | null; pase: EstadoPase; onPonFechas: () => void }) {
  return (
    <>
      <CabeceraHoy ojo={ojoDeViaje(route, startIso)} titulo={`Tu viaje a ${route.destination}`} />
      <HoyAntesV2 startIso={startIso} simulada={simulada} pase={pase} destino={route.destination} onPonFechas={onPonFechas} />
    </>
  )
}

/**
 * HOY SIN EL PASE (Tanda 10C; las filas del día de prueba, Tanda 10H). La pestaña HOY está siempre en la barra: el viajero gratis ve que existe. Sin el pase enseña lo de antes del viaje («Tu modo Hoy se activa el…»,
 * lo que tendrá) y, según el momento y la prueba (una por cuenta, para siempre; docs/dias/GRATIS_Y_PASE.md y APUNTES_TRAS_TANDA7 §33), el texto que toca: `filaDeHoySinPase` (src/lib/diaDePrueba.ts) dice cuál, y
 * `TarjetaDeLaPrueba` lo pinta. El día de la prueba, `HoyView` enseña HOY entero con su franja (no pasa por aquí). Después del viaje, nada de la prueba.
 */
export function HoySinPase({ route, startIso, fase, simulada = null, onPonFechas }: { route: Route; startIso: string | null; fase: 'before' | 'during' | 'after' | null; simulada?: string | null; onPonFechas: () => void }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  const setMode = useRouteStore((s) => s.setMode)
  const antes = fase === null || fase === 'before'
  const fila = filaDeHoySinPase({
    fase: startIso ? fase : null,
    hoyIso: simulada ?? todayIso(),
    inicioIso: startIso,
    prueba: pase.prueba ?? { estado: pase.pruebaGastada ? 'gastada' : 'pendiente' },
    tripId,
    destino: route.destination,
  })
  return (
    <>
      {antes ? (
        // (Tanda 10D: como el diseño, App · HOY 1a y 1b: la cuenta atrás, el panel «Hoy te dará» con sus seis cuadros, «Logros y sellos» y [Ver el Pase de Roma]; y debajo, solo si toca, la prueba.)
        <>
          <HoyAntesDelDiseno route={route} startIso={startIso} simulada={simulada} pase={SIN_PASE} onPonFechas={onPonFechas} />
          <TarjetaDeLaPrueba fila={fila} destino={route.destination} />
        </>
      ) : (
        <>
          {fila.tipo === 'hoy_es_prueba' ? <FranjaDiaDePrueba fila={fila} /> : <TarjetaDeLaPrueba fila={fila} destino={route.destination} enOscuro />}
          <CajaBlanca>
            <span className="pl-1 text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
              Con el pase tendrás
            </span>
            <ListaLoQueTendras />
            <button type="button" onClick={() => setMode('days')} className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[#1C2230]/30 text-[14.5px] font-semibold text-[#1C2230]">
              <Icono nombre="dias" size={17} />
              Ver mi ruta
            </button>
          </CajaBlanca>
        </>
      )}
    </>
  )
}
