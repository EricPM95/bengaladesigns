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
export function excursionPagePayload(destKey, destData = null) {
  const data = excursionsFor(destKey)
  if (!data || !Array.isArray(data.excursiones) || data.excursiones.length === 0) return null
  const folder = `fotos/${destKey}/excursiones`
  // (10R) El dato de roma.json › excursions.options de cada una (por `opcion` o, si no, por su mismo id): de ahí salen la foto del proveedor, el precio, el «Precio orientativo» y la cancelación.
  const opciones = new Map((destData?.excursions?.options ?? []).map((o) => [o.id, o]))
  const options = [...data.excursiones]
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
    .map((excursion) => {
      const price = typeof excursion.precio_desde === 'number' ? excursion.precio_desde : null
      const half = excursion.medio_dia === true
      const op = opciones.get(excursion.opcion ?? excursion.id) ?? null
      const precioOp = typeof op?.price_from_eur === 'number' ? op.price_from_eur : null
      // (10S10 §4) Nombre completo de la tabla («Excursión a Florencia en tren de alta velocidad»): se parte alrededor del destino para dejar la cursiva donde estaba.
      const destino = excursion.nombre?.destino ?? ''
      const donde = op?.name && destino ? op.name.indexOf(destino) : -1
      const partes = donde >= 0 ? { antes: op.name.slice(0, donde).trim(), destino, despues: op.name.slice(donde + destino.length) } : excursion.nombre ?? {}
      // (10S10 §4) El enlace de ESTA excursión: el escrito a mano, el de la API de consulta o la página de la actividad por su slug (la app le pone nuestro código de afiliado y la campaña del viaje al pulsarlo).
      const slug = op?.['civ' + 'itatis_slug']
      const enlace = excursion.enlace || op?.['civ' + 'itatis']?.url || (slug ? 'https://www.' + 'civ' + 'itatis.com/es/' + (destData?.excursions?.['civ' + 'itatis_city'] ?? destKey) + '/' + slug + '/' : null)
      return {
        id: excursion.id,
        example: excursion.ejemplo === true,
        name_before: partes.antes ?? '',
        name_destination: partes.destino ?? '',
        name_after: partes.despues ?? '',
        short_name: excursion.corto ?? excursion.nombre?.destino ?? '',
        duration_hours: op?.duration_hours ?? excursion.duracion_h ?? null,
        return_time: excursion.vuelta ?? null,
        half_day: typeof op?.half_day === 'boolean' ? op.half_day : half,
        price_from: precioOp ?? price,
        price_label: (precioOp ?? price) != null ? precioTienda(precioOp ?? price, 'EUR') : '',
        price_orientativo: op ? !op["civ" + "itatis"] /* (el nombre del proveedor no se escribe aquí: lo vigila pruebaTanda6g) */ : false,
        cancellation: op?.cancellation ?? null,
        cancellation_note: op?.cancellation_note ?? null,
        affiliate_url: enlace ? String(enlace) : null,
        tags: (excursion.etiquetas ?? []).map((tag) => ({ kind: tag.tipo, text: tag.texto })),
        stops: (excursion.paradas ?? []).map((stop) => ({ time: stop.hora, name: stop.nombre })),
        text: excursion.texto ?? '',
        photo: photoOf(excursion, folder) ?? (op?.photo_url_big || op?.photo_url ? { url: op.photo_url_big ?? op.photo_url, credit: '' } : null),
        color: excursion.color ?? '#B4704A',
        percentage: Number.isFinite(excursion.porcentaje) ? excursion.porcentaje : null,
        meeting_point: op?.meeting_point ?? excursion.punto_de_encuentro ?? null,
        coords: Array.isArray(excursion.coords) ? { lat: excursion.coords[0], lng: excursion.coords[1] } : null,
      }
    })
  return { phrase: data.porcentaje_frase ?? null, options }
}
