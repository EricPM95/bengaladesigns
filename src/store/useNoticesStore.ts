import { create } from 'zustand'

/**
 * Los avisos de la app (el icono de la campana de la cabecera). Aquí vive lo que se recuerda entre visitas: qué avisos ha leído el viajero
 * y los avisos «de fuera» (más adelante: los de amigos) que llegan por `push`. Los avisos que salen del estado del viaje (menos fechas que días,
 * error de guardado…) no se guardan aquí: se calculan cada vez en useAppNotices.ts.
 *
 * Tipos:
 *  - `error` y `warning`: cuentan mientras el problema siga (no se pueden marcar como leídos; desaparecen solos al arreglarse).
 *  - `info` y `friend`: se pueden marcar como leídos; leído = deja de contar.
 */
export type NoticeKind = 'error' | 'warning' | 'info' | 'friend'

export interface PushedNotice {
  id: string
  kind: NoticeKind
  title: string
  text: string
  createdAt: string
}

const READ_KEY = 'trazo:notices-read:v1'
// (Tanda 10N4 §2) «Eliminar» y «Marcar como no leído» en la campana: lo eliminado y lo que el viajero ha dejado como nuevo a propósito.
const HIDDEN_KEY = 'trazo:notices-hidden:v1'
const UNREAD_KEY = 'trazo:notices-unread:v1'

function loadRead(key: string = READ_KEY): string[] {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveRead(ids: string[], key: string = READ_KEY) {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(-300)))
  } catch {
    // Sin almacenamiento: los leídos solo valen durante esta visita.
  }
}

interface NoticesState {
  readIds: string[]
  /** Eliminados de la campana (solo los que se pueden: los errores y los avisos del viaje no se eliminan, se arreglan). */
  hiddenIds: string[]
  /** Dejados como «no leído» a propósito (mandan sobre lo que diga el aviso). */
  unreadIds: string[]
  markUnread: (ids: string[]) => void
  hide: (ids: string[]) => void
  unhide: (ids: string[]) => void
  pushed: PushedNotice[]
  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  /** Un aviso nuevo de fuera (un amigo, el sistema…). Mismo id = no se repite. */
  push: (notice: Omit<PushedNotice, 'createdAt'>) => void
  /** Quita un aviso empujado cuando deja de valer (un error que ya se arregló). */
  remove: (id: string) => void
}

export const useNoticesStore = create<NoticesState>((set) => ({
  readIds: loadRead(),
  hiddenIds: loadRead(HIDDEN_KEY),
  unreadIds: loadRead(UNREAD_KEY),
  pushed: [],
  markRead: (id) =>
    set((state) => {
      const unreadIds = state.unreadIds.filter((x) => x !== id)
      const cambiaNoLeidos = unreadIds.length !== state.unreadIds.length
      if (cambiaNoLeidos) saveRead(unreadIds, UNREAD_KEY)
      if (state.readIds.includes(id)) return cambiaNoLeidos ? { unreadIds } : state
      const readIds = [...state.readIds, id]
      saveRead(readIds)
      return { readIds, unreadIds }
    }),
  markAllRead: (ids) =>
    set((state) => {
      const readIds = [...new Set([...state.readIds, ...ids])]
      const unreadIds = state.unreadIds.filter((x) => !ids.includes(x))
      saveRead(readIds)
      saveRead(unreadIds, UNREAD_KEY)
      return { readIds, unreadIds }
    }),
  markUnread: (ids) =>
    set((state) => {
      const unreadIds = [...new Set([...state.unreadIds, ...ids])]
      saveRead(unreadIds, UNREAD_KEY)
      return { unreadIds }
    }),
  hide: (ids) =>
    set((state) => {
      const hiddenIds = [...new Set([...state.hiddenIds, ...ids])]
      saveRead(hiddenIds, HIDDEN_KEY)
      return { hiddenIds }
    }),
  unhide: (ids) =>
    set((state) => {
      const hiddenIds = state.hiddenIds.filter((x) => !ids.includes(x))
      saveRead(hiddenIds, HIDDEN_KEY)
      return { hiddenIds }
    }),
  push: (notice) =>
    set((state) => (state.pushed.some((item) => item.id === notice.id) ? state : { pushed: [...state.pushed, { ...notice, createdAt: new Date().toISOString() }] })),
  remove: (id) => set((state) => ({ pushed: state.pushed.filter((item) => item.id !== id) })),
}))

// Solo en desarrollo: para probar la campana a mano desde la consola del navegador (window.__notices.getState().push({...})).
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __notices: typeof useNoticesStore }).__notices = useNoticesStore
