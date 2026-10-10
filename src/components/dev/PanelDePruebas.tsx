import { useEffect } from 'react'
import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { usePruebasUi } from '../../store/usePruebasUi'
import { fijarVersion, pagoActivo } from '../../lib/pago'
import { esEntornoDePrueba, fijarPrueba, pruebaActiva } from '../../lib/recomendaciones'
import { getTodayTripStatus } from '../../lib/todayMode'
import { addDaysToIso } from '../../lib/dateRange'
import { diaCorto } from '../../lib/nombreDeDia'
import { HojaAbajo, ojoStyle } from '../route/reservas/HojaAbajo'
import { DevDateSimulator } from '../route/today/DevDateSimulator'

const CLAVE_FECHA = 'trazo:fecha-simulada'

function leerFechaGuardada(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE_FECHA)
  } catch {
    return null
  }
}

function guardarFecha(iso: string | null) {
  try {
    if (iso) window.sessionStorage.setItem(CLAVE_FECHA, iso)
    else window.sessionStorage.removeItem(CLAVE_FECHA)
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
}

/** Un grupo de botones de los que se elige uno. */
function Opciones({ opciones }: { opciones: { clave: string; texto: string; activa: boolean; onElegir: () => void }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((opcion) => (
        <button
          key={opcion.clave}
          type="button"
          aria-pressed={opcion.activa}
          onClick={opcion.onElegir}
          className={`h-9 rounded-full px-3.5 text-[13px] font-medium transition-colors ${opcion.activa ? 'bg-[#1C2230] text-[#FFFDF8]' : 'border border-text/15 bg-white text-text'}`}
        >
          {opcion.texto}
        </button>
      ))}
    </div>
  )
}

function Panel({ route }: { route: Route }) {
  const abierto = usePruebasUi((state) => state.abierto)
  const abrir = usePruebasUi((state) => state.abrir)
  const cerrar = usePruebasUi((state) => state.cerrar)
  const repintar = usePruebasUi((state) => state.repintar)
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  const setSimulada = useRouteStore((state) => state.setDevSimulatedTodayIso)

  // La fecha elegida se recuerda mientras dure la sesión: al abrir un viaje (que la borra) se vuelve a poner.
  useEffect(() => {
    const guardada = leerFechaGuardada()
    if (guardada && useRouteStore.getState().dev_simulated_today_iso === null) useRouteStore.getState().setDevSimulatedTodayIso(guardada)
  }, [route.id])

  const ponerFecha = (iso: string | null) => {
    guardarFecha(iso)
    setSimulada(iso)
  }

  const pago = pagoActivo()
  const prueba = pruebaActiva()
  const inicio = route.answers.dateRange?.start ?? null
  const estado = getTodayTripStatus(route, simulada ?? undefined)
  const ultimo = route.days[route.days.length - 1]
  const momento = !simulada ? 'real' : estado?.phase === 'before' ? 'antes' : estado?.phase === 'after' ? 'despues' : estado?.phase === 'during' ? `dia-${estado.context.day.dayNumber}` : 'otra'

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        data-panel-pruebas="1"
        className="fixed bottom-[92px] left-3 z-40 h-8 rounded-full border border-dashed border-text/35 bg-bg-card/95 px-3 text-[12px] font-medium text-text/70 shadow-sm backdrop-blur-sm"
      >
        Pruebas
      </button>
      {abierto && (
        <HojaAbajo titleId="hoja-pruebas" onClose={cerrar} capa={95}>
          <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
            Solo en pruebas
          </p>
          <h2 id="hoja-pruebas" className="mt-1 font-display text-[26px] leading-none text-text">
            Pruebas
          </h2>

          <div className="mt-5 flex flex-col gap-2">
            <span className="text-text/50" style={ojoStyle}>
              Versión
            </span>
            <Opciones
              opciones={[
                { clave: 'gratis', texto: 'Gratis', activa: !pago, onElegir: () => { fijarVersion('gratis'); repintar() } },
                { clave: 'completa', texto: 'De pago', activa: pago, onElegir: () => { fijarVersion('completa'); repintar() } },
              ]}
            />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <span className="text-text/50" style={ojoStyle}>
              Momento del viaje
            </span>
            {inicio ? (
              <Opciones
                opciones={[
                  { clave: 'real', texto: 'Fecha real', activa: momento === 'real', onElegir: () => ponerFecha(null) },
                  { clave: 'antes', texto: 'Antes del viaje', activa: momento === 'antes', onElegir: () => ponerFecha(addDaysToIso(inicio, -10)) },
                  ...route.days.map((day) => ({
                    clave: `dia-${day.dayNumber}`,
                    texto: `Durante · ${diaCorto(route, day.dayNumber)}`,
                    activa: momento === `dia-${day.dayNumber}`,
                    onElegir: () => ponerFecha(addDaysToIso(inicio, day.dayNumber - 1)),
                  })),
                  { clave: 'despues', texto: 'Después del viaje', activa: momento === 'despues', onElegir: () => ponerFecha(addDaysToIso(inicio, (ultimo?.dayNumber ?? 1))) },
                ]}
              />
            ) : (
              <p className="text-[13px] text-text/60">Este viaje no tiene fechas: pon las fechas para probar los momentos.</p>
            )}
            <div className="-mx-4 mt-1">
              <DevDateSimulator value={simulada} onChange={ponerFecha} />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <span className="text-text/50" style={ojoStyle}>
              Números de «me gusta»
            </span>
            <Opciones
              opciones={[
                { clave: 'prueba-si', texto: 'De prueba', activa: prueba, onElegir: () => { fijarPrueba(true); repintar() } },
                { clave: 'prueba-no', texto: 'Los de verdad', activa: !prueba, onElegir: () => { fijarPrueba(false); repintar() } },
              ]}
            />
          </div>
        </HojaAbajo>
      )}
    </>
  )
}

/**
 * EL PANEL DE PRUEBAS (Tanda 6z6): un botón «Pruebas» abajo a la izquierda, por encima de la barra, que abre una hoja con la versión (gratis o de pago), el momento del viaje (con el simulador de fecha) y los
 * números de prueba de «me gusta». SOLO en local y en las vistas previas: usa el mismo criterio que `?prueba=1` (`esEntornoDePrueba`, src/lib/recomendaciones.ts); en producción no se pinta nada.
 */
export function PanelDePruebas({ route }: { route: Route }) {
  if (!esEntornoDePrueba()) return null
  return <Panel route={route} />
}
