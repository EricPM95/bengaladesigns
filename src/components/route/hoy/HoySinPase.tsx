import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { usePaseEstado } from '../../../lib/paseEstado'
import { abrirPase } from '../../../lib/pago'
import { CABECERA_DE_HOY, CAJA_PRUEBA_SIN_USAR, CAJA_PRUEBA_USADA, TARJETAS_DE_HOY } from '../../pase/lista/disenoLista'
import { CabeceraHoy, HoyAntesV2, ojoDeViaje } from './v2/HoyAntesV2'
import type { EstadoPase } from '../../../lib/paseEstado'

/** El estado de quien no ha comprado el pase: cobro puesto, sin pase (HOY antes del viaje enseña el candado «Pase de Roma» y [Ver el Pase de Roma]). */
const SIN_PASE: EstadoPase = { cobro: true, conPase: false, puede: false, pruebaGastada: false }
/** El de quien tiene el pase: lo mismo sin el candado ni el botón. */
export const CON_PASE: EstadoPase = { cobro: false, conPase: true, puede: true, pruebaGastada: false }

/** HOY antes del viaje, como el diseño (App · HOY 1a con fechas y 1b sin fechas): el encabezado y `HoyAntesV2`. (Con el pase; sin él, `HoySinPase`.) */
export function HoyAntesDelDiseno({ route, startIso, simulada, pase, onPonFechas }: { route: Route; startIso: string | null; simulada: string | null; pase: EstadoPase; onPonFechas: () => void }) {
  return (
    <>
      <CabeceraHoy ojo={ojoDeViaje(route, startIso)} titulo={`Tu viaje a ${route.destination}`} />
      <HoyAntesV2 startIso={startIso} simulada={simulada} pase={pase} destino={route.destination} onPonFechas={onPonFechas} />
    </>
  )
}
void SIN_PASE

/**
 * HOY SIN EL PASE (Tanda 10N11, apartado 5; `Piezas/Pase Lista` de Design, pantallas 2 y 2b). Lo que ve en la pestaña HOY quien no tiene el pase: «HOY, tu guía del día», las ocho tarjetas con sus dibujos y, abajo, la caja
 * según el día de prueba (`pase.prueba`: una por cuenta, para siempre; la lógica del día de prueba es la de siempre, src/lib/diaDePrueba.ts, y el día de la prueba `HoyView` enseña HOY entero: no pasa por aquí):
 *   · sin usar: «Tienes un día de prueba con HOY completo, gratis.» · «Lo usamos el día que llegas, si es antes de las 10:00; si no, el día siguiente.»
 *   · ya usado: «Ya has usado tu día de prueba.» · «Con el Pase Roma, tienes HOY todos los días de tu viaje.»
 * y [Ver el Pase Roma], que abre la lista del pase. Los dibujos y los textos salen de `pase/lista/disenoLista.ts` (generado desde la pieza de Design).
 */
export function HoySinPase({ route }: { route: Route; startIso?: string | null; fase?: 'before' | 'during' | 'after' | null; simulada?: string | null; onPonFechas?: () => void }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  const setMode = useRouteStore((s) => s.setMode)
  const destino = route.destination
  const usada = (pase.prueba?.estado ?? (pase.pruebaGastada ? 'gastada' : 'pendiente')) === 'gastada'
  const caja = usada ? CAJA_PRUEBA_USADA : CAJA_PRUEBA_SIN_USAR
  const d = (t: string) => t.replace(/Roma/g, destino)
  return (
    <div
      data-hoy-sin-pase
      data-hoy-prueba={usada ? 'usada' : 'sin_usar'}
      className="relative flex flex-none flex-col overflow-hidden rounded-[28px]"
      style={{ background: 'linear-gradient(180deg,#1B2240 0%,#12172D 38%,#0C1020 100%)', color: '#FBF3E2' }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', left: -60, top: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,199,122,.22),transparent 68%)' }} />
      <div className="relative flex flex-col items-center text-center" style={{ gap: 10, padding: '34px 22px 14px' }}>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => setMode('days')}
          data-hoy-sin-pase-cerrar
          style={{ position: 'absolute', right: 14, top: 12, width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(233,199,122,.6)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBF3E2" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span style={{ font: "400 35px/1.04 'Instrument Serif',serif", color: '#FBF3E2', textShadow: '0 0 24px rgba(233,199,122,.28)' }}>
          <span style={{ color: '#E9C77A' }}>HOY</span>, tu guía del día
        </span>
        <span style={{ font: "400 13.5px/1.4 'Geist'", color: 'rgba(251,243,226,.7)' }}>{d(CABECERA_DE_HOY)}</span>
        <span style={{ width: 70, height: 1, marginTop: 4, background: 'linear-gradient(90deg,transparent,#E9C77A,transparent)' }} />
      </div>
      <div className="relative flex flex-col" style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
          {TARJETAS_DE_HOY.map((t) => (
            <div key={t.titulo} data-hoy-sin-pase-punto={t.titulo} style={{ display: 'flex', flexDirection: 'column', gap: 11, padding: '14px 13px 15px', borderRadius: 22, background: 'linear-gradient(160deg,rgba(255,253,248,.08),rgba(255,253,248,.03))', border: '1px solid rgba(233,199,122,.28)' }}>
              <span style={{ width: 62, height: 62, borderRadius: 18, background: 'radial-gradient(circle at 35% 28%,#FFFDF8,#F3E3B2 70%,#E3C77E)', boxShadow: '0 0 0 1.5px #E9C77A,0 0 0 5px rgba(233,199,122,.15),0 8px 14px -8px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span aria-hidden="true" style={{ display: 'flex' }} dangerouslySetInnerHTML={{ __html: t.icono }} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: "400 19px/1.1 'Instrument Serif',serif", color: '#FBF3E2' }}>{d(t.titulo)}</span>
                <span style={{ font: "400 12.5px/1.38 'Geist'", color: 'rgba(251,243,226,.66)' }}>{d(t.linea)}</span>
              </span>
            </div>
          ))}
        </div>
        <div data-hoy-caja-prueba={usada ? 'usada' : 'sin_usar'} style={{ marginTop: 22, borderRadius: 20, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 5, background: 'linear-gradient(135deg,rgba(233,199,122,.16),rgba(233,199,122,.05))', border: '1px solid rgba(233,199,122,.5)' }}>
          <span style={{ font: "400 21px/1.12 'Instrument Serif',serif", color: '#F7E8BC' }}>{d(caja.titulo)}</span>
          <span style={{ font: "400 13.5px/1.4 'Geist'", color: 'rgba(251,243,226,.78)' }}>{d(caja.linea)}</span>
        </div>
        <button
          type="button"
          onClick={abrirPase}
          data-hoy-ver-pase
          style={{ marginTop: 20, height: 58, borderRadius: 18, background: 'linear-gradient(135deg,#F7E8BC,#D9BC74 52%,#B58A2E)', color: '#3A2A0A', font: "700 16.5px 'Geist'", boxShadow: '0 14px 26px -12px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.6)' }}
        >
          {`Ver el Pase ${destino}`}
        </button>
      </div>
    </div>
  )
}
