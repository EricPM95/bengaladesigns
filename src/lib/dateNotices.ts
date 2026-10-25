import type { DateNotice, DateNoticeIcon } from './types'

/** Los iconos ilustrados que existen (DateNoticeIcons.tsx); uno desconocido del JSON cae a 'fiesta'. */
export const DATE_NOTICE_ICONS: DateNoticeIcon[] = ['fiesta', 'religioso', 'fuegos', 'luz', 'navidad', 'bandera', 'musica', 'calma', 'cierre', 'entrada']

/** Como mucho tantas tarjetas en la ventana: con más, la última dice "y N más" y los lista. */
export const MAX_DATE_NOTICE_CARDS = 3

/**
 * La firma de unos avisos: si la ruta se regenera y los avisos cambian, la firma cambia y la ventana vuelve a salir
 * (Route.dateNoticesSeenKey). Mismos avisos, misma firma: no se repite.
 */
/** «Coliseo, Panteón y 2 lugares más» (dos nombres y «N lugares más» si hay más). */
function listaDeNombres(nombres: string[]): string {
  if (nombres.length <= 2) return nombres.join(' y ')
  const resto = nombres.length - 2
  return `${nombres[0]}, ${nombres[1]} y ${resto} ${resto === 1 ? 'lugar más' : 'lugares más'}`
}

/**
 * La frase corta de un aviso en la campana (Tanda 10M). La da el motor (`campana`); mientras no la dé, se arma aquí: con lo que cierra,
 * «Coliseo, Panteón y 2 lugares más cierran (25 de diciembre)»; sin nada que cierre, el título del aviso.
 */
export function fraseCampana(notice: DateNotice): string {
  if (notice.campana && notice.campana.trim()) return notice.campana.trim()
  const cierran = (notice.cierran ?? []).filter(Boolean)
  if (cierran.length > 0) return `${listaDeNombres(cierran)} ${cierran.length === 1 ? 'cierra' : 'cierran'}${notice.tag ? ` · ${notice.tag}` : ''}.`
  return notice.title
}

/**
 * Los avisos de fechas que el viajero ya leyó. `dateNoticesRead` (los ids); una ruta de antes de la Tanda 10M no lo tiene pero sí la firma de lo que
 * se vio en la ventana (`dateNoticesSeenKey`): si coincide con los avisos de ahora, todos cuentan como leídos.
 */
export function avisosDeFechaLeidos(route: { dateNotices?: DateNotice[]; dateNoticesRead?: string[]; dateNoticesSeenKey?: string | null }): Set<string> {
  const notices = route.dateNotices ?? []
  if (route.dateNoticesRead) return new Set(route.dateNoticesRead)
  if (route.dateNoticesSeenKey && route.dateNoticesSeenKey === dateNoticesKey(notices)) return new Set(notices.map((notice) => notice.id))
  return new Set()
}

export function dateNoticesKey(notices: DateNotice[]): string {
  const text = notices.map((notice) => `${notice.id}|${notice.texts.join('|')}`).join('||')
  let hash = 0
  for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) | 0
  return `${notices.length}:${(hash >>> 0).toString(36)}`
}
