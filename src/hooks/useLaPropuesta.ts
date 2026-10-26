import { useMemo } from 'react'
import { cambiosDeLaPropuesta, cambiosDeUnaPropuesta, esUnaPropuesta, type CambioPropuesto } from '../lib/propuesta'
import type { Recomendacion } from '../lib/aplicarRecomendacion'
import { usePropuestaStore } from '../store/usePropuestaStore'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido } from '../store/useViajeCompartido'

/** Una propuesta ya mandada (mía), con sus cambios y lo decidido de cada uno. */
export interface PropuestaMandada {
  rec: Recomendacion
  cambios: CambioPropuesto[]
  /** Cuántos cambios sigue esperando. */
  pendientes: number
}

/**
 * LO QUE SABE QUIEN SOLO RECOMIENDA DE SU PROPUESTA (Tanda 10N): los cambios que aún no ha enviado (los de ahora respecto de la ruta del administrador, menos los que ya mandó y esperan), los que
 * ya no tienen sentido, y las propuestas que ya mandó. Todo se calcula: nada se guarda paso a paso.
 */
export function useLaPropuesta() {
  const activa = usePropuestaStore((s) => s.activa)
  const base = usePropuestaStore((s) => s.base)
  const sinSentido = usePropuestaStore((s) => s.sinSentido)
  const route = useRouteStore((s) => s.route)
  const recs = useViajeCompartido((s) => s.recomendaciones)
  const yo = useSyncStore((s) => s.travelerId)

  const mandadas = useMemo<PropuestaMandada[]>(
    () =>
      recs
        .filter((r) => esUnaPropuesta(r.payload) && (yo == null || r.authorId === yo))
        .map((rec) => {
          const cambios = cambiosDeUnaPropuesta(rec.payload)
          return { rec, cambios, pendientes: rec.estado === 'pendiente' ? cambios.filter((c) => !rec.decisiones?.[c.id]).length : 0 }
        }),
    [recs, yo],
  )
  const enEspera = useMemo(() => mandadas.filter((m) => m.pendientes > 0), [mandadas])
  const cambios = useMemo(() => {
    if (!activa || !base || !route) return []
    const enviados = new Set(enEspera.flatMap((m) => m.cambios.filter((c) => !m.rec.decisiones?.[c.id]).map((c) => `${c.id}|${c.texto}`)))
    return cambiosDeLaPropuesta(base, route).filter((c) => !enviados.has(`${c.id}|${c.texto}`))
  }, [activa, base, route, enEspera])
  const enEsperaN = enEspera.reduce((a, m) => a + m.pendientes, 0)
  return { activa, base, route, cambios, sinSentido, mandadas, enEspera, enEsperaN, n: cambios.length }
}
