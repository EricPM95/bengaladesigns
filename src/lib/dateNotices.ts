import type { DateNotice, DateNoticeIcon } from './types'

/** Los iconos ilustrados que existen (DateNoticeIcons.tsx); uno desconocido del JSON cae a 'fiesta'. */
export const DATE_NOTICE_ICONS: DateNoticeIcon[] = ['fiesta', 'religioso', 'fuegos', 'luz', 'navidad', 'bandera', 'musica', 'calma', 'cierre']

/** Como mucho tantas tarjetas en la ventana: con más, la última dice "y N más" y los lista. */
export const MAX_DATE_NOTICE_CARDS = 3

/**
 * La firma de unos avisos: si la ruta se regenera y los avisos cambian, la firma cambia y la ventana vuelve a salir
 * (Route.dateNoticesSeenKey). Mismos avisos, misma firma: no se repite.
 */
export function dateNoticesKey(notices: DateNotice[]): string {
  const text = notices.map((notice) => `${notice.id}|${notice.texts.join('|')}`).join('||')
  let hash = 0
  for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) | 0
  return `${notices.length}:${(hash >>> 0).toString(36)}`
}
