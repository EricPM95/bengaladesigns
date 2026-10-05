// Las comprobaciones de la Tanda 4: cada fallo que se arregla en su regla lleva aquí la comprobación que lo habría detectado.
// `comprobarDia` mira un día ya construido por el motor; `comprobarViaje` mira todos los días de un viaje juntos. Las dos devuelven una lista de { regla, texto }.
import { nocheValida } from '../../shared/routeEngine/nightLimit.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { andar } from './distancias.mjs'
import { hueco, antesDeLlegar } from '../../shared/routeEngine/escritos.js'

const toMin = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))
const plain = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const nombreFila = (row) => row.titulo ?? row.lugar ?? row.restaurante ?? row.noche ?? row.id

/** Los días escritos de un viaje ya construidos: { iso, id, day } en el orden del viaje (sin los días de excursión ni en blanco). */
export function comprobarDia({ D, iso, id, day }) {
  const fallos = []
  const donde = `${iso} ${id}`
  // (escrito_rows lleva el nombre en `lugar`; la tabla de distancias lo busca por restaurante / noche según el tipo.)
  const rows = (day.escrito_rows ?? []).map((row) => ({ ...row, restaurante: row.tipo === 'comida' || row.tipo === 'cena' ? row.lugar : undefined, noche: row.tipo === 'noche' ? row.lugar : undefined }))
  const log = day.engine_log ?? []
  const sunset = sunsetFor(D, { dateIso: iso })
  const claveStop = (stop) => plain(stop.display_title ?? stop.night_view_title ?? stop.name)

  // 1. Las horas se calculan una sola vez: la hora en pantalla es la de la fila final y la última del registro.
  // (Las paradas y las filas se emparejan por nombre y por orden: un colchón y una parada pueden llevar el mismo título.)
  const filasDeParada = rows.filter((row) => row.tipo !== 'comida' && row.tipo !== 'cena' && row.tipo !== 'traslado')
  const usadas = new Set()
  const stopsOrdenados = [...(day.stops ?? [])].sort((x, y) => String(x.suggested_time).localeCompare(String(y.suggested_time)))
  for (const stop of stopsOrdenados) {
    const clave = claveStop(stop)
    const igual = (row) => !usadas.has(row) && plain(row.titulo ?? row.lugar ?? row.noche) === clave
    const fila = filasDeParada.find(igual) ?? filasDeParada.find((row) => !usadas.has(row) && (plain(nombreFila(row)).includes(clave) || clave.includes(plain(nombreFila(row)))))
    if (!fila) continue
    usadas.add(fila)
    if (stop.suggested_time !== fila.hora) fallos.push({ regla: 'hora_pantalla', texto: `${donde}: «${nombreFila(fila)}» sale a las ${stop.suggested_time} en pantalla y a las ${fila.hora} en el cálculo final` })
    const ultima = [...log].filter((x) => x.id === fila.id && x.a?.hora).at(-1)
    if (ultima && ultima.a.hora !== fila.hora) fallos.push({ regla: 'hora_registro', texto: `${donde}: «${nombreFila(fila)}»: el registro termina en las ${ultima.a.hora} y la hora final es ${fila.hora} (${ultima.causa})` })
  }
  // 2. La noche: ninguna parada empieza después del límite de la noche; ninguna cena pasa de las 22:00.
  for (const row of rows) {
    if (row.tipo === 'noche' && !nocheValida(D, iso, sunset, toMin(row.hora), row.min)) fallos.push({ regla: 'limite_noche', texto: `${donde}: «${nombreFila(row)}» empieza a las ${row.hora} (${row.min} min), pasado el límite de la noche` })
    if (row.tipo === 'cena' && toMin(row.hora) > 22 * 60) fallos.push({ regla: 'cena_22', texto: `${donde}: la cena empieza a las ${row.hora}` })
  }
  // 3. Nunca un hueco sin nombre: tiempo libre (después de andar y del margen de 10 min) de más de 15 min entre dos filas, sin ninguna parada.
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]
    const row = rows[i]
    // (Un hueco es lo que sobra después de lo que piden los márgenes —lo andado más 10 min, a 5 hacia arriba—; antes de la noche no cuenta: la nocturna va a su hora.)
    if (row.tipo === 'noche') continue
    // (El margen de 15 min antes de un Free Tour o un turno sin su «Llegada» propia se espera en el punto de encuentro: cuenta como margen.)
    const margen = prev.llegada === true && prev.lugar === row.lugar ? 0 : antesDeLlegar(row)
    const libre = toMin(row.hora) - margen - (toMin(prev.hora) + prev.min) - hueco(prev, row, andar)
    if (libre > 15) fallos.push({ regla: 'hueco', texto: `${donde}: ${libre} min libres entre «${nombreFila(prev)}» (acaba a las ${String(Math.floor((toMin(prev.hora) + prev.min) / 60)).padStart(2, '0')}:${String((toMin(prev.hora) + prev.min) % 60).padStart(2, '0')}) y «${nombreFila(row)}» (${row.hora})` })
  }
  return fallos
}
