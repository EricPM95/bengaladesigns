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
  // 7. La comida no empieza después de la hora límite del destino (los restaurantes cierran sobre las 15:00).
  const limiteComida = D.destination_config?.comida_limite ? toMin(D.destination_config.comida_limite) : null
  for (const row of rows) if (limiteComida != null && row.tipo === 'comida' && toMin(row.hora) > limiteComida) fallos.push({ regla: (day.engine_log ?? []).some((x) => /la comida iba a caer/.test(x.causa ?? '')) ? 'comida_tarde_sin_mas_que_acortar' : 'comida_tarde', texto: `${donde}: la comida empieza a las ${row.hora} (límite ${D.destination_config.comida_limite})` })
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

/** Lo que se mira en el viaje entero (los días ya construidos, en orden): [{ iso, day }]. */
export function comprobarViaje({ D, dias }) {
  const fallos = []
  // 3. Las nocturnas imprescindibles salen por orden en las primeras noches del viaje (la primera noche del viaje es Trevi, luego la Plaza de España, luego el Coliseo), salvo
  // las noches de fecha propia (Nochebuena: solo Trevi, y esa noche puede repetir; Nochevieja: una sola).
  const lista = D.destination_config?.noches_imprescindibles?.lista ?? []
  const especiales = D.destination_config?.noche_especial ?? {}
  const noches = []
  for (const { iso, day } of dias) {
    if (!day) continue
    const stops = (day.stops ?? []).filter((stop) => stop.is_night_experience).sort((a, b) => String(a.suggested_time).localeCompare(String(b.suggested_time)))
    for (const stop of stops) noches.push({ iso, name: stop.name, fija: Boolean(especiales[iso.slice(5)]?.noche) })
  }
  // (Una noche de fecha propia —Nochebuena— cuenta como salida si es la primera vez; las demás van por orden: cada una es la primera de la lista que aún no ha salido.)
  const faltan = [...lista]
  let n = 0
  for (const noche of noches) {
    const i = faltan.indexOf(noche.name)
    if (noche.fija) { if (i >= 0) faltan.splice(i, 1); continue }
    n++
    if (faltan.length === 0) break
    if (noche.name !== faltan[0]) {
      fallos.push({ regla: 'noche_orden', texto: `la nocturna ${n} del viaje (${noche.iso}) es «${noche.name}» y toca «${faltan[0]}»` })
      break
    }
    faltan.shift()
  }
  return fallos
}

/** 4. Restaurantes: ninguno se repite en el viaje; no se cena dos días seguidos en el mismo barrio ni se come y se cena en el mismo barrio el mismo día (salvo con motivo apuntado). */
export function comprobarMesas({ D, dias }) {
  const fallos = []
  const info = []
  const zonaDe = (name) => String(D.restaurants?.find((restaurant) => restaurant.name === name)?.zone ?? '').split('/')[0].trim()
  const vistos = new Map()
  let cenaAnterior = null
  for (const { iso, day } of dias) {
    if (!day) { cenaAnterior = null; continue }
    const id = day.curated_day?.id ?? '?'
    const comida = (day.meals ?? []).find((meal) => meal.time === 'lunch')?.restaurant ?? null
    const cena = (day.meals ?? []).find((meal) => meal.time === 'dinner')?.restaurant ?? null
    for (const [tipo, name] of [['comida', comida], ['cena', cena]]) {
      if (!name) continue
      if (vistos.has(name)) fallos.push({ regla: 'restaurante_repetido', texto: `${name}: ${vistos.get(name)} y ${iso} ${id} (${tipo})` })
      else vistos.set(name, `${iso} ${id} (${tipo})`)
    }
    const avisos = (day.engine_log ?? []).filter((x) => x.que === 'aviso' && /barrio repetido/.test(x.causa)).map((x) => x.causa)
    const repite = []
    if (comida && cena && zonaDe(comida) && zonaDe(comida) === zonaDe(cena)) repite.push(`se come y se cena en ${zonaDe(cena)} (${comida} / ${cena})`)
    if (cena && cenaAnterior && zonaDe(cena) && zonaDe(cena) === cenaAnterior.barrio) repite.push(`dos cenas seguidas en ${cenaAnterior.barrio} (${cenaAnterior.name} / ${cena})`)
    if (repite.length) (avisos.length ? info : fallos).push({ regla: avisos.length ? 'barrio_repetido_con_motivo' : 'barrio_repetido_sin_motivo', texto: `${iso} ${id}: ${repite.join('; ')}${avisos.length ? ` — ${avisos[0]}` : ''}` })
    cenaAnterior = cena ? { barrio: zonaDe(cena), name: cena } : null
  }
  return { fallos, info }
}

/** 5. Los textos que salen en pantalla: la zona de cada comida y cena es la de su restaurante en los datos, y «Con reserva» en las fechas de `fechas_con_reserva`. */
export function comprobarPantalla({ D, iso, id, day }) {
  const fallos = []
  const donde = `${iso} ${id}`
  const cfg = D.destination_config?.fechas_con_reserva ?? {}
  const reserva = (cfg.fechas ?? []).includes(iso.slice(5))
  for (const meal of day.meals ?? []) {
    const tipo = meal.time === 'dinner' ? 'cena' : 'comida'
    const restaurante = D.restaurants?.find((item) => item.name === meal.restaurant)
    if (!restaurante) continue
    const esperada = `en ${String(restaurante.zone).replace(/\s*\/\s*/g, ' y ')}`
    if (meal.zone_display !== esperada) fallos.push({ regla: 'zona_etiqueta', texto: `${donde}: la ${tipo} en ${meal.restaurant} sale como «${meal.zone_display}» y su zona en los datos es «${restaurante.zone}»` })
    if (reserva && !meal.reservation_note) fallos.push({ regla: 'con_reserva', texto: `${donde}: la ${tipo} en ${meal.restaurant} no lleva «Con reserva» ni el aviso de reservar` })
    if (!reserva && /Con reserva|reserva con antelación/.test(meal.reservation_note ?? '') && !(D.restaurants && false)) fallos.push({ regla: 'con_reserva_fuera_de_fecha', texto: `${donde}: la ${tipo} en ${meal.restaurant} lleva «${meal.reservation_note}» y esa fecha no está en la lista` })
  }
  return fallos
}

/** Los sitios y restaurantes que usa algún día escrito y no tienen horario en los datos: el motor los da por abiertos siempre. */
export function sinHorario({ D, dias }) {
  const nombres = { lugar: new Set(), restaurante: new Set() }
  const texto = JSON.stringify(dias)
  for (const m of texto.matchAll(/"lugar":"((?:[^"\\]|\\.)*)"/g)) nombres.lugar.add(JSON.parse(`"${m[1]}"`))
  for (const m of texto.matchAll(/"(?:restaurante|alternativa|tercera)":"((?:[^"\\]|\\.)*)"/g)) nombres.restaurante.add(JSON.parse(`"${m[1]}"`))
  const lugares = [...nombres.lugar].map((name) => D.places.find((place) => place.name === name)).filter(Boolean).filter((place) => !(place.schedule || place.windows || place.by_day || place.by_season || place.by_period || place.special_hours || place.hours))
  const restaurantes = [...nombres.restaurante].map((name) => D.restaurants.find((item) => item.name === name)).filter(Boolean).filter((item) => !/\d{1,2}[:.]\d{2}/.test(String(item.hours ?? '')))
  return { lugares: lugares.map((place) => ({ name: place.name, tipo: place.type ?? null })), restaurantes: restaurantes.map((item) => item.name) }
}

/** Las páginas HTML generadas (docs/**) empiezan por `<!doctype html>` y llevan `<meta charset="utf-8">` al principio: sin eso, en Windows los acentos salen rotos. La simulación a mano es plantilla, no generada. */
export function comprobarCabecerasHtml(fs, carpetas = ['docs', 'docs/dias']) {
  const malas = []
  for (const carpeta of carpetas) {
    if (!fs.existsSync(carpeta)) continue
    for (const nombre of fs.readdirSync(carpeta).filter((file) => file.endsWith('.html') && !/SIMULACION/.test(file))) {
      const inicio = fs.readFileSync(`${carpeta}/${nombre}`, 'utf8').slice(0, 600)
      if (!/^\s*<!doctype html>/i.test(inicio) || !/<meta\s+charset="?utf-8"?/i.test(inicio)) malas.push(`${carpeta}/${nombre}`)
    }
  }
  return malas
}

/** 6. «De camino»: 5 min como mucho; ningún sitio de nivel 1 o 2 de camino la primera vez que sale en el viaje (salvo que el Free Tour pase por él); un colchón no nombra otra parada del mismo día. */
export function comprobarCamino({ D, dias, tourCubre = new Set() }) {
  const fallos = []
  const info = []
  const visto = new Set()
  const placeOf = (name) => D.places.find((place) => place.name === name)
  let tarjetas = 0
  let dias_n = 0
  for (const { iso, day } of dias) {
    if (!day) continue
    dias_n++
    const id = day.curated_day?.id ?? '?'
    const stops = [...(day.stops ?? [])].filter((stop) => !stop.is_night_experience).sort((a, b) => String(a.suggested_time).localeCompare(String(b.suggested_time)))
    const nombresOtros = stops.map((stop) => plain(stop.display_title ?? stop.name))
    let enGrupo = false
    for (const stop of stops) {
      const place = placeOf(stop.site_id ? D.places.find((p) => p.id === stop.site_id)?.name : stop.name) ?? placeOf(stop.name)
      const camino = stop.pass_through === true
      if (!camino || !enGrupo) tarjetas++
      enGrupo = camino
      if (camino && stop.duration_minutes > 5) fallos.push({ regla: 'camino_mas_de_5', texto: `${iso} ${id}: «${stop.display_title ?? stop.name}» va de camino ${stop.duration_minutes} min` })
      // (Un imprescindible que los márgenes de una hora fija o el pool aprietan hasta «de camino» —lo único que le deja el documento antes de quitarlo— se apunta aparte, con su causa.)
      const apretado = (day.engine_log ?? []).some((x) => x.sitio === place?.name && String(x.que).split('+').includes('modo') && /márgenes|pool|comida iba/.test(x.causa))
      if (camino && place && (place.level ?? 3) <= 2 && !visto.has(place.name) && !tourCubre.has(place.name) && apretado) info.push({ regla: 'camino_apretado_con_causa', texto: `${iso} ${id}: «${place.name}» (nivel ${place.level}) queda de camino por los márgenes` })
      else if (camino && place && (place.level ?? 3) <= 2 && !visto.has(place.name) && !tourCubre.has(place.name)) fallos.push({ regla: 'camino_nivel_1_2_primera_vez', texto: `${iso} ${id}: «${place.name}» (nivel ${place.level}) va de camino la primera vez que sale` })
      if (!camino && place) visto.add(place.name)
      // un colchón (paseo) no nombra paradas del mismo día con tarjeta propia
      if (/^Pasea y piérdete/.test(stop.display_title ?? '') && stop.why) {
        const texto = plain(stop.why)
        const propio = plain(stop.display_title)
        for (const otro of stops) {
          if (otro === stop || /^Pasea y piérdete/.test(otro.display_title ?? '')) continue
          const palabras = plain(otro.display_title ?? otro.name).split(' ').filter((p) => p.length >= 6 && !GENERICAS.has(p) && !propio.includes(p))
          const hit = palabras.find((p) => new RegExp(`\b${p}\b`).test(texto))
          if (hit) { fallos.push({ regla: 'colchon_nombra_parada', texto: `${iso} ${id}: el texto de «${stop.display_title}» nombra «${hit}» (parada de ${otro.suggested_time})` }); break }
        }
      }
    }
  }
  return { fallos, info, tarjetas, dias: dias_n }
}
const GENERICAS = new Set(['terraza', 'plaza', 'iglesia', 'parque', 'fuente', 'fontana', 'basilica', 'museos', 'museo', 'puente', 'castillo', 'piazza', 'mirador', 'jardin', 'jardines', 'paseo', 'pasea', 'pierdete', 'calle', 'desde', 'luces', 'noche', 'viale', 'barrio'])
