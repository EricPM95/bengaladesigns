import { create } from 'zustand'
import { supabase } from './supabaseClient'
import { useSyncStore } from '../store/useSyncStore'
import { loadAllTrips } from './tripPersistence'
import { viajeQueSePisa } from './juntarViajePuro'

export { viajeQueSePisa, textosDeJuntar } from './juntarViajePuro'

/**
 * JUNTAR UN VIAJE PROPIO CON EL COMPARTIDO (V17, 19-nov). Quien se une al viaje de otra persona y ya tenía un viaje suyo al MISMO destino con días que se
 * pisan ve la pregunta «Ya tienes un viaje a Lanzarote en esas fechas. ¿Lo juntamos con el de Eric?»: [Juntarlos] pasa lo suyo (fotos, hechos, logros) al
 * compartido y quita SU copia (función `juntar_mi_viaje`, migración 0083); [Dejarlos separados] la deja y no se vuelve a preguntar por ese par.
 */

export interface PropuestaDeJuntar {
  copiaId: string
  compId: string
  destino: string
  invitador: string | null
}

interface JuntarUi {
  propuesta: PropuestaDeJuntar | null
  ocupado: boolean
  error: string | null
  proponer: (p: PropuestaDeJuntar) => void
  cerrar: () => void
  setOcupado: (b: boolean) => void
  setError: (e: string | null) => void
}
export const useJuntarUi = create<JuntarUi>((set) => ({
  propuesta: null,
  ocupado: false,
  error: null,
  proponer: (propuesta) => set({ propuesta, ocupado: false, error: null }),
  cerrar: () => set({ propuesta: null, ocupado: false, error: null }),
  setOcupado: (ocupado) => set({ ocupado }),
  setError: (error) => set({ error }),
}))

const CLAVE_NO = 'jutrip.juntar_no'
const leerNo = (): string[] => {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLAVE_NO) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}
const parDe = (copiaId: string, compId: string) => `${copiaId}|${compId}`

/** Tras unirse: si hay un viaje propio que se pisa (y no se dijo ya «Dejarlos separados»), saca la pregunta. */
export function proponerJuntarSiHaceFalta(compartidoId: string, invitador: string | null): boolean {
  const propio = viajeQueSePisa(useSyncStore.getState().savedTrips ?? [], compartidoId)
  if (!propio || leerNo().includes(parDe(propio.id, compartidoId))) return false
  useJuntarUi.getState().proponer({ copiaId: propio.id, compId: compartidoId, destino: String(propio.route.destination), invitador })
  return true
}

export function dejarlosSeparados(): void {
  const p = useJuntarUi.getState().propuesta
  if (p) {
    try {
      window.localStorage.setItem(CLAVE_NO, JSON.stringify([...leerNo(), parDe(p.copiaId, p.compId)]))
    } catch {
      /* sin almacenamiento: se volverá a preguntar */
    }
  }
  useJuntarUi.getState().cerrar()
}

/** [Juntarlos]: lo pasa en el servidor y quita la copia propia de la lista del móvil. */
export async function juntarlos(): Promise<void> {
  const ui = useJuntarUi.getState()
  const p = ui.propuesta
  if (!p || !supabase) return
  ui.setOcupado(true)
  ui.setError(null)
  const { error } = await supabase.rpc('juntar_mi_viaje', { p_copia: p.copiaId, p_comp: p.compId })
  if (error) {
    ui.setOcupado(false)
    ui.setError('No se han podido juntar. No se ha cambiado nada: inténtalo de nuevo.')
    return
  }
  const sync = useSyncStore.getState()
  try {
    const uid = (await supabase.auth.getSession()).data.session?.user.id
    if (uid) sync.setSavedTrips(await loadAllTrips(uid))
  } catch {
    sync.setSavedTrips((sync.savedTrips ?? []).filter((v) => v.id !== p.copiaId))
  }
  if (sync.activeTripId === p.copiaId) sync.setActiveTripId(p.compId)
  useJuntarUi.getState().cerrar()
}
