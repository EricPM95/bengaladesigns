import type { Route } from '../../../lib/types'
import { useSyncStore } from '../../../store/useSyncStore'
import { usePaseEstado } from '../../../lib/paseEstado'
import { abrirPase } from '../../../lib/pago'
import { todayIso } from '../../../lib/dateRange'
import { diasEntre, filaDeHoySinPase } from '../../../lib/diaDePrueba'
import { TextoConPase } from '../../cuenta/TextoConPase'
import { Icono } from '../../ui/Icono'
import { CABECERA_DE_HOY, CAJA_PRUEBA_SIN_USAR, CAJA_PRUEBA_USADA, TARJETAS_DE_HOY } from '../../pase/lista/disenoLista'
import { CabeceraHoy, HoyAntesV2, ojoDeViaje } from './v2/HoyAntesV2'
import type { EstadoPase } from '../../../lib/paseEstado'

/** El estado de quien no ha comprado el pase: cobro puesto, sin pase (HOY antes del viaje enseña el candado «Pase Roma» y [Ver el Pase Roma]). */
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
export function HoySinPase({ route, startIso = null, fase = null, simulada = null, onPonFechas }: { route: Route; startIso?: string | null; fase?: 'before' | 'during' | 'after' | null; simulada?: string | null; onPonFechas?: () => void }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const pase = usePaseEstado(tripId)
  const destino = route.destination
  const usada = (pase.prueba?.estado ?? (pase.pruebaGastada ? 'gastada' : 'pendiente')) === 'gastada'
  const caja = usada ? CAJA_PRUEBA_USADA : CAJA_PRUEBA_SIN_USAR
  // (10N12 §3) Arriba de «HOY, tu guía del día», lo que había antes de la 10N11: sin fechas «Pon tus fechas»; antes, la cuenta atrás; después, «Tu viaje ha terminado»; y los avisos del día de prueba cuando tocan.
  const hoyIso = simulada ?? todayIso()
  const conFechas = Boolean(startIso) && fase !== null
  const fila = filaDeHoySinPase({ fase: startIso ? fase : null, hoyIso, inicioIso: startIso, prueba: pase.prueba ?? { estado: pase.pruebaGastada ? 'gastada' : 'pendiente' }, tripId, destino })
  const faltan = conFechas && startIso ? Math.max(0, diasEntre(hoyIso, startIso)) : 0
  const avisoDePrueba = fila.texto && fila.tipo !== 'viaje_terminado' && fila.tipo !== 'hoy_es_prueba' ? fila.texto : null
  const d = (t: string) => t.replace(/Roma/g, destino)
  return (
    <div
      data-hoy-sin-pase
      data-hoy-prueba={usada ? 'usada' : 'sin_usar'}
      className="relative flex flex-none flex-col overflow-hidden rounded-[28px]"
      style={{ background: 'linear-gradient(180deg,#1B2240 0%,#12172D 38%,#0C1020 100%)', color: '#FBF3E2' }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', left: -60, top: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,199,122,.22),transparent 68%)' }} />
      <div data-hoy-arriba={!conFechas ? 'sin_fechas' : fase === 'after' ? 'terminado' : fase === 'before' ? 'cuenta_atras' : 'durante'} className="relative flex flex-col" style={{ gap: 10, padding: '22px 22px 0' }}>
        {!conFechas ? (
          <div data-hoy-pon-fechas style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 18px', borderRadius: 20, background: 'linear-gradient(135deg,rgba(233,199,122,.16),rgba(233,199,122,.05))', border: '1px solid rgba(233,199,122,.5)' }}>
            <span style={{ font: "400 24px/1.1 'Instrument Serif',serif", color: '#F7E8BC' }}>Tu modo <span style={{ color: '#E9C77A' }}>Hoy</span> se activa el primer día de tu viaje</span>
            <span style={{ font: "400 13.5px/1.4 'Geist'", color: 'rgba(251,243,226,.78)' }}>Pon tus fechas y lo dejamos listo.</span>
            <button type="button" onClick={onPonFechas} style={{ marginTop: 4, height: 44, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px 0 14px', borderRadius: 999, background: '#FBF3E2', color: '#1C2230', font: "600 14px 'Geist'" }}>
              <Icono nombre="dias" size={16} grosor={1.8} />
              Pon tus fechas
            </button>
          </div>
        ) : fase === 'after' ? (
          <div data-hoy-viaje-terminado style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 18px', borderRadius: 20, background: 'linear-gradient(135deg,rgba(233,199,122,.16),rgba(233,199,122,.05))', border: '1px solid rgba(233,199,122,.5)' }}>
            <span style={{ font: "400 24px/1.1 'Instrument Serif',serif", color: '#F7E8BC' }}>Tu viaje ha terminado</span>
            <span style={{ font: "400 13.5px/1.4 'Geist'", color: 'rgba(251,243,226,.78)' }}>{`La próxima vez, con el Pase ${destino}, te acompañamos todo el viaje.`}</span>
          </div>
        ) : fase === 'before' ? (
          <div data-hoy-cuenta-atras style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 18px', borderRadius: 20, background: 'linear-gradient(135deg,rgba(233,199,122,.16),rgba(233,199,122,.05))', border: '1px solid rgba(233,199,122,.5)' }}>
            <span style={{ font: "400 18px/1.15 'Instrument Serif',serif", color: 'rgba(251,243,226,.88)' }}>Tu modo <span style={{ color: '#E9C77A' }}>Hoy</span> se activa dentro de</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span data-hoy-faltan={faltan} style={{ font: "400 64px/.95 'Instrument Serif',serif", color: '#FBF3E2' }}>{faltan}</span>
              <em style={{ font: "italic 400 28px/1 'Instrument Serif',serif", color: '#E9C77A' }}>{faltan === 1 ? 'día' : 'días'}</em>
            </span>
          </div>
        ) : null}
        {avisoDePrueba && (
          <div data-hoy-aviso-prueba={fila.tipo} style={{ padding: '14px 18px', borderRadius: 20, background: 'linear-gradient(110deg,#F7E6BE,#FBF3E2)', border: '1px solid rgba(166,124,82,.35)', color: '#1C2230', font: "500 14px/1.4 'Geist'" }}>
            <TextoConPase texto={avisoDePrueba} />
          </div>
        )}
      </div>
      <div className="relative flex flex-col items-center text-center" style={{ gap: 10, padding: '28px 22px 14px' }}>
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
