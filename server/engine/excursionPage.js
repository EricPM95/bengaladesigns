import { precioTienda } from '../../shared/dinero/formato.js'
/**
 * La página de la excursión del día 4 (Tanda 6g): las excursiones de un destino salen de `data/dias/<destino>/_excursiones.json` (se rellena sin tocar código) y viajan con el
 * día 4, tanto con el interruptor en Excursión como en Roma (el viajero puede pasar de uno a otro sin volver a pedir nada).
 *
 * Aquí no se inventa nada: sin precio no sale precio, sin enlace «Enlace pendiente» y sin porcentaje la frase del porcentaje no sale.
 */

import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { excursionsFor } from './writtenDays.js'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public')

/** La foto propia de la excursión (la ruta pública) o null si el archivo todavía no está. */
function photoOf(excursion, folder) {
  const file = excursion.foto?.archivo
  if (!file) return null
  return existsSync(join(PUBLIC_DIR, folder, file)) ? { url: `/${folder}/${file}`, credit: excursion.foto?.credito ?? '' } : null
}

/**
 * Lo que viaja al cliente (en snake_case, como el resto de las respuestas del servidor), en el orden del archivo. Null si el destino no tiene excursiones escritas.
 * @returns {{ phrase: string, options: object[] } | null}
 */
export function excursionPagePayload(destKey) {
  const data = excursionsFor(destKey)
  if (!data || !Array.isArray(data.excursiones) || data.excursiones.length === 0) return null
  const folder = `fotos/${destKey}/excursiones`
  const options = [...data.excursiones]
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
    .map((excursion) => {
      const price = typeof excursion.precio_desde === 'number' ? excursion.precio_desde : null
      const half = excursion.medio_dia === true
      return {
        id: excursion.id,
        example: excursion.ejemplo === true,
        name_before: excursion.nombre?.antes ?? '',
        name_destination: excursion.nombre?.destino ?? '',
        name_after: excursion.nombre?.despues ?? '',
        short_name: excursion.corto ?? excursion.nombre?.destino ?? '',
        duration_hours: excursion.duracion_h ?? null,
        return_time: excursion.vuelta ?? null,
        half_day: half,
        price_from: price,
        price_label: price != null ? precioTienda(price, 'EUR') : '',
        affiliate_url: excursion.enlace ? String(excursion.enlace) : null,
        tags: (excursion.etiquetas ?? []).map((tag) => ({ kind: tag.tipo, text: tag.texto })),
        stops: (excursion.paradas ?? []).map((stop) => ({ time: stop.hora, name: stop.nombre })),
        text: excursion.texto ?? '',
        photo: photoOf(excursion, folder),
        color: excursion.color ?? '#B4704A',
        percentage: Number.isFinite(excursion.porcentaje) ? excursion.porcentaje : null,
        meeting_point: excursion.punto_de_encuentro ?? null,
        coords: Array.isArray(excursion.coords) ? { lat: excursion.coords[0], lng: excursion.coords[1] } : null,
      }
    })
  return { phrase: data.porcentaje_frase ?? null, options }
}
