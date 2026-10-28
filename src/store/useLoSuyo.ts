import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import type { Reservation } from '../lib/bookings'
import { leerLoSuyo, type LoSuyoDeCadaUno, type MiAlojamiento, type MiVuelo, type QuienTieneLoSuyo, VACIO } from '../lib/loSuyo'
import { useSyncStore } from './useSyncStore'
import { fusionarPrivadasDelAdmin } from '../lib/reservasPrivadasAdmin'

/**
 * EL VUELO Y EL ALOJAMIENTO DE CADA UNO, del viaje abierto (Tanda 10N5 §6c). Lo MÍO (`mio`) vive en el propio móvil (`localStorage`) y, si la migración 0049 está aplicada, también en `lo_suyo_del_viaje`
 * (la nube manda: si el administrador pone el suyo «para ti», la base de datos borra lo mío y aquí se ve al recargar). `grupo` dice quién tiene lo suyo (sin los datos) y `entradas` las entradas que han
 * reservado los invitados para varias personas (para las cuentas). Sin la migración todo funciona en este móvil: el error de la nube se ignora.
 */
const CLAVE = 'trazo:lo-suyo:v1'
const claveDe = (tripId: string | null): string => `${CLAVE}:${tripId ?? 'local'}`
const claveDePendiente = (tripId: string | null): string => `${CLAVE}:pendiente:${tripId ?? 'local'}`

function leerLocal(tripId: string | null): LoSuyoDeCadaUno {
  try {
    const crudo = window.localStorage.getItem(claveDe(tripId))
    return crudo ? leerLoSuyo(JSON.parse(crudo)) : VACIO
  } catch {
    return VACIO
  }
}
function escribirLocal(tripId: string | null, datos: LoSuyoDeCadaUno) {
  try {
    window.localStorage.setItem(claveDe(tripId), JSON.stringify(datos))
  } catch {
    // Sin almacenamiento: vale solo durante esta visita.
  }
}
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

async function guardarEnLaNube(tripId: string | null, datos: LoSuyoDeCadaUno) {
  if (!supabase || !tripId) return
  marcarPendiente(tripId, true)
  try {
    const { data } = await supabase.auth.getUser()
    const uid = data.user?.id
    if (!uid) return
    const { error } = await supabase.from('lo_suyo_del_viaje').upsert({ trip_id: tripId, user_id: uid, vuelo: datos.vuelo, alojamiento: datos.alojamiento, actualizado_en: new Date().toISOString() })
    if (error) console.warn('[loSuyo] no se pudo guardar en la nube (¿falta la migración 0049?):', error.message)
    else marcarPendiente(tripId, false)
  } catch {
    // La nube es un extra: queda pendiente y se sube al abrir con cuenta.
  }
}

export interface EntradasDeUnInvitado {
  userId: string
  reservas: Reservation[]
}

interface LoSuyoState {
  tripId: string | null
  mio: LoSuyoDeCadaUno
  grupo: QuienTieneLoSuyo
  entradas: EntradasDeUnInvitado[]
  cargar: (tripId: string | null) => Promise<void>
  poner: (datos: Partial<LoSuyoDeCadaUno>) => void
  ponerVuelo: (vuelo: MiVuelo | null) => void
  ponerAlojamiento: (alojamiento: MiAlojamiento | null) => void
  /** (Tanda 10N8 §7c) Pone un vuelo o un alojamiento PARA VARIAS PERSONAS (quien lo pone va siempre en la lista). Un solo guardado y un solo aviso a cada una; sin la migración 0061 queda solo en lo mío. */
  ponerPara: (datos: { vuelo?: MiVuelo | null; alojamiento?: MiAlojamiento | null }, para: string[], yoId: string, detalle: string) => Promise<void>
  /** Solo pruebas y desarrollo: pone lo del grupo sin pasar por el servidor. */
  ponerGrupo: (datos: { grupo?: QuienTieneLoSuyo; entradas?: EntradasDeUnInvitado[] }) => void
}

export const useLoSuyo = create<LoSuyoState>((set, get) => ({
  tripId: null,
  mio: VACIO,
  grupo: {},
  entradas: [],
  cargar: async (tripId) => {
    set({ tripId, mio: leerLocal(tripId) })
    if (!supabase || !tripId) return
    try {
      const { data: usuario } = await supabase.auth.getUser()
      if (!usuario.user) return
      const uid = usuario.user.id
      // (Tanda 10N8 §0b-2) El administrador recupera sus reservas «Solo para mí», guardadas aparte.
      void fusionarPrivadasDelAdmin(tripId)
      const [{ data: fila, error }, quien, entradas] = await Promise.all([
        supabase.from('lo_suyo_del_viaje').select('vuelo, alojamiento').eq('trip_id', tripId).eq('user_id', uid).maybeSingle(),
        supabase.rpc('lo_suyo_del_grupo', { p_trip: tripId }),
        supabase.rpc('entradas_del_grupo', { p_trip: tripId }),
      ])
      if (get().tripId !== tripId) return
      if (!quien.error && Array.isArray(quien.data)) {
        const grupo: QuienTieneLoSuyo = {}
        for (const x of quien.data as { user_id: string; vuelo: boolean; alojamiento: boolean }[]) grupo[x.user_id] = { vuelo: Boolean(x.vuelo), alojamiento: Boolean(x.alojamiento) }
        set({ grupo })
      }
      if (!entradas.error && Array.isArray(entradas.data)) {
        set({ entradas: (entradas.data as { user_id: string; reservas: Reservation[] }[]).map((x) => ({ userId: x.user_id, reservas: Array.isArray(x.reservas) ? x.reservas : [] })) })
      }
      if (error) return
      if (hayPendiente(tripId)) {
        void guardarEnLaNube(tripId, get().mio)
        return
      }
      // La nube manda (si el administrador puso el suyo «para ti», la base de datos borró lo mío). Sin fila, lo de este móvil se sube.
      if (!fila) {
        const m = get().mio
        if (m.vuelo || m.alojamiento) void guardarEnLaNube(tripId, m)
        return
      }
      const mio = leerLoSuyo(fila)
      set({ mio })
      escribirLocal(tripId, mio)
    } catch {
      // Sin nube: lo de este móvil.
    }
  },
  poner: (datos) => {
    const tripId = get().tripId ?? useSyncStore.getState().activeTripId
    const mio = { ...get().mio, ...datos }
    set({ mio, tripId })
    escribirLocal(tripId, mio)
    void guardarEnLaNube(tripId, mio)
    // Yo me incluyo en «quién tiene lo suyo» al momento (el administrador y las cuentas lo ven con la siguiente carga).
  },
  ponerPara: async (datos, para, yoId, detalle) => {
    const tripId = get().tripId ?? useSyncStore.getState().activeTripId
    const ids = [...new Set([yoId, ...para])]
    const marca = { puestoPor: yoId, para: ids }
    const conMarca = {
      ...(datos.vuelo !== undefined ? { vuelo: datos.vuelo ? { ...datos.vuelo, ...marca } : null } : {}),
      ...(datos.alojamiento !== undefined ? { alojamiento: datos.alojamiento ? { ...datos.alojamiento, ...marca } : null } : {}),
    }
    const mio = { ...get().mio, ...conMarca }
    set({ mio, tripId })
    escribirLocal(tripId, mio)
    if (!supabase || !tripId) return
    marcarPendiente(tripId, true)
    try {
      const { error } = await supabase.rpc('poner_lo_suyo_para', { p_trip: tripId, p_vuelo: conMarca.vuelo ?? null, p_alojamiento: conMarca.alojamiento ?? null, p_para: ids, p_detalle: detalle.slice(0, 200) })
      if (error) {
        console.warn('[loSuyo] no se pudo guardar para varios (¿falta la migración 0061?):', error.message)
        void guardarEnLaNube(tripId, mio)
      } else marcarPendiente(tripId, false)
    } catch {
      // Queda pendiente: se sube al abrir con cuenta.
    }
  },
  ponerVuelo: (vuelo) => get().poner({ vuelo }),
  ponerAlojamiento: (alojamiento) => get().poner({ alojamiento }),
  ponerGrupo: (datos) => set((s) => ({ ...s, ...datos })),
}))

// Solo desarrollo: window.__loSuyo.getState().ponerGrupo({...}) para probar sin servidor.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __loSuyo: typeof useLoSuyo }).__loSuyo = useLoSuyo
