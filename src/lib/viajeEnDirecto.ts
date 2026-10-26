import { create } from 'zustand'
import type { Route } from './types'
import { usePropuestaStore } from '../store/usePropuestaStore'
import { loadOneTrip, rutaGuardadaAqui, rutaVista } from './tripPersistence'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'

/**
 * LOS CAMBIOS DEL VIAJE, EN DIRECTO (Tanda 10N §10). Cuando otra persona del viaje (el dueño o quien puede editar) cambia la ruta, esta pantalla la vuelve a pedir y la pone, sin recargar:
 *   · `refrescarViajeActivo()` pide el viaje de ahora a la nube y, si es distinto de lo que esta pantalla guardó o ya puso, lo aplica (conserva la pestaña y el día abierto);
 *   · el eco del PROPIO guardado se reconoce (`rutaGuardadaAqui`) y no se trata como un cambio de otra persona;
 *   · lo aplicado se apunta en `useViajeEnDirecto` (qué paradas y días ya no están) para que la propuesta a medias del invitado marque lo que ya no tiene sentido (ver `lib/propuestaSobreQuitado.ts`).
 * Sin Realtime (o sin la migración 0036) el mismo `refrescarViajeActivo()` se llama al volver a la app y cada poco, y el resultado es el mismo con unos segundos de retraso.
 */
export interface ResumenDeCambios {
  /** Ids de los días que había y ya no están. */
  diasQuitados: string[]
  diasAnadidos: string[]
  paradasQuitadas: string[]
  paradasAnadidas: { id: string; nombre: string; dayId: string }[]
}

/** Pura: qué cambió entre dos rutas (días y paradas que salen o entran, por id). */
export function cambiosEntreRutas(antes: Pick<Route, 'days'> | null | undefined, despues: Pick<Route, 'days'> | null | undefined): ResumenDeCambios {
  const diasA = antes?.days ?? []
  const diasD = despues?.days ?? []
  const idsDiasA = new Set(diasA.map((d) => d.id))
  const idsDiasD = new Set(diasD.map((d) => d.id))
  const paradas = (dias: typeof diasA) => dias.flatMap((d) => d.stops.filter((s) => !s.isZoneWalk).map((s) => ({ id: s.id, nombre: s.name, dayId: d.id })))
  const paradasA = paradas(diasA)
  const paradasD = paradas(diasD)
  const idsA = new Set(paradasA.map((p) => p.id))
  const idsD = new Set(paradasD.map((p) => p.id))
  return {
    diasQuitados: diasA.filter((d) => !idsDiasD.has(d.id)).map((d) => d.id),
    diasAnadidos: diasD.filter((d) => !idsDiasA.has(d.id)).map((d) => d.id),
    paradasQuitadas: paradasA.filter((p) => !idsD.has(p.id)).map((p) => p.id),
    paradasAnadidas: paradasD.filter((p) => !idsA.has(p.id)),
  }
}

interface EnDirectoState {
  tripId: string | null
  /** Cuántas veces ha cambiado el viaje por otra persona en esta sesión (para reaccionar con un efecto). */
  version: number
  /** Los días y paradas que otra persona ha quitado (acumulados mientras el viaje está abierto): una propuesta que los toca sale marcada «ya no está en la ruta». */
  diasQuitados: string[]
  paradasQuitadas: string[]
  registrar: (tripId: string, cambios: ResumenDeCambios) => void
}

export const useViajeEnDirecto = create<EnDirectoState>((set) => ({
  tripId: null,
  version: 0,
  diasQuitados: [],
  paradasQuitadas: [],
  registrar: (tripId, cambios) =>
    set((s) => {
      const mismo = s.tripId === tripId
      return {
        tripId,
        version: s.version + 1,
        diasQuitados: [...new Set([...(mismo ? s.diasQuitados : []), ...cambios.diasQuitados])],
        paradasQuitadas: [...new Set([...(mismo ? s.paradasQuitadas : []), ...cambios.paradasQuitadas])],
      }
    }),
}))

/** El `route` de la pantalla justo después de aplicar lo de la nube: si el siguiente guardado es idéntico, es un eco y no se manda. */
let ecoRemoto: string | null = null
export const esEcoRemoto = (route: Route | null | undefined): boolean => ecoRemoto !== null && route != null && JSON.stringify(route) === ecoRemoto

export type ResultadoRefresco = 'cambiado' | 'igual' | 'fuera' | 'sin_datos'

export const EVENTO_VIAJE_CAMBIADO = 'trazo:viaje-cambiado-en-directo'

let enCurso: Promise<ResultadoRefresco> | null = null

/** Vuelve a pedir el viaje abierto a la nube y, si lo cambió otra persona, lo pone. 'fuera': ya no se puede ver (te han quitado). */
export function refrescarViajeActivo(): Promise<ResultadoRefresco> {
  if (enCurso) return enCurso
  enCurso = (async (): Promise<ResultadoRefresco> => {
    const sync = useSyncStore.getState()
    const tripId = sync.activeTripId
    if (!tripId || !sync.travelerId) return 'sin_datos'
    const r = await loadOneTrip(sync.travelerId, tripId)
    if (r === undefined) return 'sin_datos'
    if (r === null) return 'fuera'
    if (useSyncStore.getState().activeTripId !== tripId) return 'sin_datos'
    if (r.canonica === rutaGuardadaAqui(tripId) || r.canonica === rutaVista.get(tripId)) return 'igual'
    const ruta = useRouteStore.getState()
    // (Tanda 10N, apartado 6: quien solo recomienda lleva SUS cambios puestos en su ruta; lo que cambió el administrador se compara con la ruta del administrador que tenía, `base`, no con la suya.)
    const propuesta = usePropuestaStore.getState()
    const antes = propuesta.activa && propuesta.base ? propuesta.base : ruta.route
    // La pestaña y el día abierto se quedan donde estaban (si ese día ya no existe, sin día abierto).
    const diaAbierto = ruta.activeDayId && r.viaje.route.days.some((d) => d.id === ruta.activeDayId) ? ruta.activeDayId : null
    ruta.hydrateTrip({ ...r.viaje, uiState: { ...r.viaje.uiState, mode: ruta.mode, activeDayId: diaAbierto } })
    rutaVista.set(tripId, r.canonica)
    ecoRemoto = JSON.stringify(useRouteStore.getState().route)
    const lista = useSyncStore.getState().savedTrips
    if (lista) useSyncStore.getState().setSavedTrips(lista.map((v) => (v.id === tripId ? r.viaje : v)))
    const cambios = cambiosEntreRutas(antes, r.viaje.route)
    useViajeEnDirecto.getState().registrar(tripId, cambios)
    try {
      window.dispatchEvent(new CustomEvent(EVENTO_VIAJE_CAMBIADO, { detail: { tripId, cambios } }))
    } catch {
      /* sin ventana (pruebas) */
    }
    return 'cambiado'
  })().finally(() => {
    enCurso = null
  })
  return enCurso
}
