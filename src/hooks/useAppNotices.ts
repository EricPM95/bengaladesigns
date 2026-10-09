import { useMemo } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useNoticesStore, type NoticeKind } from '../store/useNoticesStore'
import { reservationOverlaps } from '../lib/reservationOverlaps'

export interface AppNotice {
  id: string
  kind: NoticeKind
  title: string
  text: string
  /** Un botón dentro del aviso (el nombre de la acción que lo resuelve); la pantalla decide qué hace. */
  action?: 'open-dates' | 'open-reservas'
  actionLabel?: string
  /** Leído = ya no cuenta. Los errores y los avisos de estado nunca están leídos: cuentan hasta que se arreglan. */
  read: boolean
  /** Se puede marcar como leído (info y amigos). */
  canMarkRead: boolean
  /** Lo que hace «marcar como leído» además de guardarlo (p. ej. el aviso de contexto se cierra en el viaje). */
  onRead?: () => void
}

/**
 * Todos los avisos de la app en un solo sitio (la campana de la cabecera): errores, avisos del viaje y, más adelante, los de amigos.
 * Hoy se reúnen aquí:
 *  1. «Cambios sin guardar» (error de guardado en la nube): cuenta mientras no se guarde.
 *  2. «Tu viaje es de N días y ahora tienes M» (antes, una línea bajo «+ Añadir día»): cuenta mientras haya más días que fechas.
 *  2b. «Dos reservas coinciden» (Tanda 6v): cuenta mientras se pisen; se va solo cuando se arregla.
 *  3. El aviso de contexto de la ruta (por qué es como es: invierno, pocos días…): se marca como leído (antes se cerraba con la ×).
 *  4. Los que empujen otras partes (`useNoticesStore.push`), p. ej. los de amigos.
 */
export function useAppNotices(): { items: AppNotice[]; unreadCount: number } {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const dismissContextBanner = useRouteStore((state) => state.dismissContextBanner)
  const syncStatus = useSyncStore((state) => state.status)
  const readIds = useNoticesStore((state) => state.readIds)
  const pushed = useNoticesStore((state) => state.pushed)

  return useMemo(() => {
    const items: AppNotice[] = []

    if (syncStatus === 'error') {
      items.push({ id: 'sync-error', kind: 'error', title: 'Cambios sin guardar', text: 'No se ha podido guardar tu viaje. Revisa tu conexión: lo volvemos a intentar solos.', read: false, canMarkRead: false })
    }

    if (route) {
      const tripDays = route.answers.days ?? route.days.length
      if (route.days.length > tripDays) {
        items.push({
          id: 'days-over-dates',
          kind: 'warning',
          title: 'Tienes más días que fechas',
          text: `Tu viaje es de ${tripDays} ${tripDays === 1 ? 'día' : 'días'} y ahora tienes ${route.days.length}. Añade un día más a tu viaje o elimina el que menos te convenga.`,
          action: 'open-dates',
          actionLabel: 'Añadir un día a mis fechas',
          read: false,
          canMarkRead: false,
        })
      }
      for (const solape of reservationOverlaps(route, reservations)) {
        items.push({ id: solape.id, kind: 'warning', title: 'Dos reservas coinciden', text: solape.text, action: 'open-reservas', actionLabel: 'Ver mis reservas', read: false, canMarkRead: false })
      }
      if (route.contextBanner) {
        items.push({
          id: `context:${route.createdAt}`,
          kind: 'info',
          title: 'Sobre tu ruta',
          text: route.contextBanner,
          read: Boolean(route.contextBannerDismissed),
          canMarkRead: true,
          onRead: dismissContextBanner,
        })
      }
    }

    for (const notice of pushed) {
      const persistent = notice.kind === 'error' || notice.kind === 'warning'
      items.push({ id: notice.id, kind: notice.kind, title: notice.title, text: notice.text, read: !persistent && readIds.includes(notice.id), canMarkRead: !persistent })
    }

    // Primero los errores, luego los avisos del viaje, luego lo demás; dentro de cada grupo, los sin leer antes.
    const order: Record<NoticeKind, number> = { error: 0, warning: 1, friend: 2, info: 3 }
    items.sort((a, b) => Number(a.read) - Number(b.read) || order[a.kind] - order[b.kind])
    return { items, unreadCount: items.filter((item) => !item.read).length }
  }, [route, reservations, syncStatus, readIds, pushed, dismissContextBanner])
}
