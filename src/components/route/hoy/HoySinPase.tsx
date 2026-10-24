import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { usePaseEstado } from '../../../lib/paseEstado'
import { pedirPago } from '../../../lib/pago'
import { TextoConPase } from '../../cuenta/TextoConPase'
import { ListaLoQueTendras } from './HoyAntes'
import { CabeceraHoy, HoyAntesV2, ojoDeViaje } from './v2/HoyAntesV2'
import type { EstadoPase } from '../../../lib/paseEstado'
import { CajaBlanca, TarjetaOscura, botonOro, ojoMono } from './piezas'
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
      <HoyAntesV2 startIso={startIso} simulada={simulada} pase={pase} onPonFechas={onPonFechas} />
    </>
  )
}

/**
 * HOY SIN EL PASE (Tanda 10C; decidido por Eric tras la 10B). La pestaña HOY está siempre en la barra: el viajero gratis ve que existe. Sin el pase enseña lo de antes del viaje («Tu modo Hoy se activa…»,
 * lo que tendrá) y, debajo, la invitación: el día de prueba (uno por cuenta, para siempre; ver docs/dias/GRATIS_Y_PASE.md) y [Ver el Pase de Roma]. Una vez empezado el viaje, no vuelve a decir
 * «se activa el…»: dice que HOY es del pase.
 */
export function HoySinPase({ route, startIso, fase, simulada = null, onPonFechas }: { route: Route; startIso: string | null; fase: 'before' | 'during' | 'after' | null; simulada?: string | null; onPonFechas: () => void }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  const setMode = useRouteStore((s) => s.setMode)
  const nombrePase = `Pase de ${route.destination}`
  const antes = fase === null || fase === 'before'
  return (
    <>
      {antes ? (
        // (Tanda 10D: como el diseño, App · HOY 1a y 1b: la cuenta atrás, el panel «Hoy te dará» con sus seis cuadros, «Logros y sellos» y [Ver el Pase de Roma]; y debajo, el día de prueba.)
        <HoyAntesDelDiseno route={route} startIso={startIso} simulada={simulada} pase={SIN_PASE} onPonFechas={onPonFechas} />
      ) : (
        <>
          <TarjetaOscura>
            <span className="relative" style={{ font: "400 30px/1.1 'Instrument Serif',serif" }}>
              {fase === 'during' ? 'Tu modo Hoy es parte del ' : 'Tu viaje ha terminado: HOY es parte del '}
              <em style={{ color: '#F3D59A' }}>{nombrePase}</em>
            </span>
          </TarjetaOscura>
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
      <div data-hoy-sin-pase className="flex flex-none flex-col gap-3 rounded-[22px] bg-[#FFFDF8] p-[18px]" style={{ border: '1px solid rgba(166,124,82,.22)' }}>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgb(var(--accent-hover))' }}>Tu día de prueba</span>
        <span style={{ font: "400 24px/1.15 'Instrument Serif',serif", textWrap: 'balance' as never }}>
          <TextoConPase texto={pase.pruebaGastada ? `Ya has usado tu día de prueba. Con el ${nombrePase}, HOY te acompaña todo el viaje.` : `Tienes un día de prueba con HOY, gratis. Con el ${nombrePase}, te acompaña todo el viaje.`} />
        </span>
        {/* (Tanda 10G: antes del viaje el [Ver el Pase de Roma] ya está en el panel de arriba: aquí no se repite; durante y después del viaje, este es el único.) */}
        {!antes && (
          <button type="button" onClick={pedirPago} data-hoy-ver-pase className="flex h-[54px] items-center justify-center rounded-full text-[15px] font-bold" style={botonOro()}>
            {`Ver el ${nombrePase}`}
          </button>
        )}
      </div>
    </>
  )
}
