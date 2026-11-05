import { create } from 'zustand'
import { useRouteStore } from '../store/useRouteStore'
import { aplicarOps, type Op, type Propuesta } from './hoyCambiarPlan'

/**
 * HOY2 (agente B): lo que aplica y deshace las propuestas de [Cambiar plan] en el viaje. Cada propuesta aplicada es una entrada del HISTORIAL DE HOY (con sus operaciones reversibles):
 *  · [Deshacer] («Plan actualizado · Deshacer») quita la última entrada;
 *  · «Volver a mi ruta original» deshace TODAS las de hoy, de la última a la primera.
 * Solo se tocan las paradas de cada operación: lo que el viajero haya marcado como visto después no se pierde. El historial vale para el día de hoy y se guarda en el móvil con el viaje.
 */

export interface Entrada {
  id: string
  tipo: Propuesta['tipo']
  ops: Op[]
}

interface Estado {
  rutaId: string | null
  fecha: string | null
  historial: Entrada[]
  /** La última entrada aplicada, para el aviso «Plan actualizado · Deshacer» (null cuando se cierra o se deshace). */
  aviso: Entrada | null
}

export const useCambiarPlanStore = create<Estado>(() => ({ rutaId: null, fecha: null, historial: [], aviso: null }))

const clave = (rutaId: string) => `trazo:hoy:cambiar-plan:${rutaId}`

function guardar(): void {
  const { rutaId, fecha, historial } = useCambiarPlanStore.getState()
  if (!rutaId) return
  try {
    window.localStorage.setItem(clave(rutaId), JSON.stringify({ fecha, historial }))
  } catch {
    /* sin almacenamiento: vale hasta cerrar */
  }
}

/** Prepara el historial para este viaje y este día (lo recupera del móvil si es de hoy; otro día, empieza vacío). */
export function abrirHistorial(rutaId: string, fecha: string): void {
  const s = useCambiarPlanStore.getState()
  if (s.rutaId === rutaId && s.fecha === fecha) return
  let historial: Entrada[] = []
  try {
    const x = JSON.parse(window.localStorage.getItem(clave(rutaId)) ?? 'null') as { fecha?: string; historial?: Entrada[] } | null
    if (x && x.fecha === fecha && Array.isArray(x.historial)) historial = x.historial
  } catch {
    /* sin historial */
  }
  useCambiarPlanStore.setState({ rutaId, fecha, historial, aviso: null })
}

const escribir = (ops: Op[], dir: 'adelante' | 'atras') => useRouteStore.setState((s) => (s.route ? { route: aplicarOps(s.route, ops, dir) } : s))

/** Aplica la propuesta (solo cuando el viajero toca [Aplicar]). */
export function aplicarPropuesta(rutaId: string, fecha: string, p: Propuesta): void {
  abrirHistorial(rutaId, fecha)
  escribir(p.ops, 'adelante')
  const entrada: Entrada = { id: p.id, tipo: p.tipo, ops: p.ops }
  useCambiarPlanStore.setState((s) => ({ historial: [...s.historial, entrada], aviso: entrada }))
  guardar()
}

/** [Deshacer] del aviso: quita lo último que se aplicó. */
export function deshacerUltimo(): boolean {
  const { historial } = useCambiarPlanStore.getState()
  const ultima = historial[historial.length - 1]
  if (!ultima) return false
  escribir(ultima.ops, 'atras')
  useCambiarPlanStore.setState({ historial: historial.slice(0, -1), aviso: null })
  guardar()
  return true
}

/** «Volver a mi ruta original»: deshace todo lo que se ha cambiado hoy, de lo último a lo primero. */
export function volverALaRutaOriginal(): number {
  const { historial } = useCambiarPlanStore.getState()
  for (let i = historial.length - 1; i >= 0; i--) escribir(historial[i].ops, 'atras')
  useCambiarPlanStore.setState({ historial: [], aviso: null })
  guardar()
  return historial.length
}

export const cerrarAviso = (): void => useCambiarPlanStore.setState({ aviso: null })
