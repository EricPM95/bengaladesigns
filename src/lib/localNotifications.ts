/**
 * Notificación local del dispositivo al hacer check-in — programada con la Notification API del
 * navegador mientras la pestaña sigue abierta, sin tracking en segundo plano ni push real (eso
 * necesita un Service Worker + backend, que no existe en esta app web — ver FLUJO_TRANSPORTE.md
 * para el mismo principio aplicado a otras integraciones). La versión con ubicación en tiempo real
 * y push reales queda pendiente para cuando el producto pase a app nativa vía Capacitor.
 */

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

interface ScheduleOptions {
  id: string
  title: string
  body: string
  delayMs: number
  onClick?: () => void
}

/** Sustituye cualquier notificación pendiente con el mismo `id` (ej. al recalcular el fin de la siguiente parada tras un check-in). */
export function scheduleLocalNotification({ id, title, body, delayMs, onClick }: ScheduleOptions): void {
  cancelLocalNotification(id)
  if (!isNotificationSupported() || Notification.permission !== 'granted' || delayMs <= 0) return

  const timer = setTimeout(() => {
    timers.delete(id)
    const notification = new Notification(title, { body })
    if (onClick) {
      notification.onclick = () => {
        window.focus()
        onClick()
      }
    }
  }, delayMs)

  timers.set(id, timer)
}

export function cancelLocalNotification(id: string): void {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}
