import { create } from 'zustand'
import type { Reservation } from '../lib/bookings'
import { supabase } from '../lib/supabaseClient'
import { useSyncStore } from './useSyncStore'

/**
 * LAS ENTRADAS PROPIAS DE QUIEN MIRA EL VIAJE DE OTRA PERSONA (Tanda 10N §8). «Lo que compre el invitado es suyo: sale en su RESERVAS, no en la del dueño.» Un invitado no escribe en el viaje del dueño,
 * así que sus entradas viven aparte, por viaje: en el propio móvil (`localStorage`) y, si la migración 0038 está aplicada, también en `reservas_invitado` (para verlas desde otro dispositivo).
 * Sin la migración todo funciona igual en ese móvil: el error de la nube se ignora. Con las cuentas apagadas o sin viaje, la clave es 'local'.
 */
const CLAVE = 'trazo:mis-reservas:v1'

const claveDe = (tripId: string | null): string => `${CLAVE}:${tripId ?? 'local'}`

function leer(tripId: string | null): Reservation[] {
  try {
    const crudo = window.localStorage.getItem(claveDe(tripId))
    const datos = crudo ? JSON.parse(crudo) : []
    return Array.isArray(datos) ? (datos as Reservation[]) : []
  } catch {
    return []
  }
}

function escribir(tripId: string | null, lista: Reservation[]) {
  try {
    window.localStorage.setItem(claveDe(tripId), JSON.stringify(lista))
  } catch {
    // Sin almacenamiento: valen solo durante esta visita.
  }
}

/** Lo que se guardó en este móvil y aún no está en la nube (sin conexión o sin sesión): al abrir con cuenta se sube, en vez de bajar lo de la nube encima. */
const claveDePendiente = (tripId: string | null): string => `${CLAVE}:pendiente:${tripId ?? 'local'}`
const marcarPendiente = (tripId: string | null, si: boolean) => {
  try {
    if (si) window.localStorage.setItem(claveDePendiente(tripId), '1')
    else window.localStorage.removeItem(claveDePendiente(tripId))
  } catch {
    // sin almacenamiento
  }
}
const hayPendiente = (tripId: string | null): boolean => {
  try {
    return window.localStorage.getItem(claveDePendiente(tripId)) === '1'
  } catch {
    return false
  }
}

async function guardarEnLaNube(tripId: string | null, lista: Reservation[]) {
  if (!supabase || !tripId) return
  marcarPendiente(tripId, true)
  try {
    const { data } = await supabase.auth.getUser()
    const uid = data.user?.id
    if (!uid) return
    const { error } = await supabase.from('reservas_invitado').upsert({ trip_id: tripId, user_id: uid, reservas: lista, actualizado_en: new Date().toISOString() })
    if (error) console.warn('[misReservas] no se pudo guardar en la nube (¿falta la migración 0038?):', error.message)
    else marcarPendiente(tripId, false)
  } catch {
    // La nube es un extra: queda pendiente y se sube al abrir con cuenta.
  }
}

interface MisReservasState {
  tripId: string | null
  lista: Reservation[]
  /** Carga las de ese viaje (del móvil y, si se puede, de la nube). */
  cargar: (tripId: string | null) => Promise<void>
  anadir: (reserva: Reservation) => void
  quitar: (id: string) => void
}

export const useMisReservas = create<MisReservasState>((set, get) => ({
  tripId: null,
  lista: leer(null),
  cargar: async (tripId) => {
    set({ tripId, lista: leer(tripId) })
    if (!supabase || !tripId) return
    try {
      const { data: usuario } = await supabase.auth.getUser()
      if (!usuario.user) return
      const { data, error } = await supabase.from('reservas_invitado').select('reservas').eq('trip_id', tripId).eq('user_id', usuario.user.id).maybeSingle()
      if (error) return
      if (get().tripId !== tripId) return
      if (hayPendiente(tripId)) {
        void guardarEnLaNube(tripId, get().lista)
        return
      }
      // La nube manda (lo que se quitó en otro móvil no vuelve). Sin fila en la nube, lo que hay en este móvil se sube.
      if (!data || !Array.isArray(data.reservas)) {
        if (get().lista.length > 0) void guardarEnLaNube(tripId, get().lista)
        return
      }
      const lista = data.reservas as Reservation[]
      set({ lista })
      escribir(tripId, lista)
    } catch {
      // Sin nube: las del móvil.
    }
  },
  anadir: (reserva) => {
    const tripId = get().tripId ?? useSyncStore.getState().activeTripId
    // Una por entrada: la nueva sustituye a la anterior del mismo sitio.
    const lista = [...get().lista.filter((r) => !(r.kind === reserva.kind && r.refId === reserva.refId)), reserva]
    set({ lista, tripId })
    escribir(tripId, lista)
    void guardarEnLaNube(tripId, lista)
  },
  quitar: (id) => {
    const tripId = get().tripId ?? useSyncStore.getState().activeTripId
    const lista = get().lista.filter((r) => r.id !== id)
    set({ lista })
    escribir(tripId, lista)
    void guardarEnLaNube(tripId, lista)
  },
}))

// Solo desarrollo: window.__misReservas.getState().anadir({...}) para probar sin servidor.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __misReservas: typeof useMisReservas }).__misReservas = useMisReservas
