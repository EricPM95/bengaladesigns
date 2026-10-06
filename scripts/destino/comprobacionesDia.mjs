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
export function comprobarDia({ D, iso, id, day, pool = [] }) {
  const fallos = []
  const donde = `${iso} ${id}`
  // Una tarde libre (la excursión de medio día sin paradas de nivel 1 o 2) sale sin paradas en pantalla a propósito: no hay nada que comparar con el cálculo.
  if (day.afternoon_free) return fallos
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
    if (row.tipo === 'cena' && toMin(row.hora) > 22 * 60) fallos.push({ regla: log.some((x) => x.que === 'aviso' && /la cena pasa de las 22:00/.test(x.causa ?? '')) ? 'cena_22_con_aviso' : 'cena_22', texto: `${donde}: la cena empieza a las ${row.hora}` })
  }
  // 7. La comida no empieza después de la hora límite del destino (los restaurantes cierran sobre las 15:00).
  const limiteComida = D.destination_config?.comida_limite ? toMin(D.destination_config.comida_limite) : null
  for (const row of rows) if (limiteComida != null && row.tipo === 'comida' && toMin(row.hora) > limiteComida) fallos.push({ regla: (day.engine_log ?? []).some((x) => /la comida iba a caer/.test(x.causa ?? '')) ? 'comida_tarde_sin_mas_que_acortar' : 'comida_tarde', texto: `${donde}: la comida empieza a las ${row.hora} (límite ${D.destination_config.comida_limite})` })
  // 3. Lo que se calcula es lo que se ve (Tanda 5): cada fila de parada del cálculo sale como parada en pantalla. Si no, los huecos y los solapes se miran sobre filas que el viajero no ve (el 25 de
  // diciembre San Clemente seguía en el cálculo aunque otro paso lo quitaba de la pantalla y el hueco de 50 min no se veía).
  const visibles = rows.filter((row) => {
    if (row.tipo !== 'parada' && row.tipo !== 'paseo' && row.tipo !== 'desayuno' && row.tipo !== 'tour') return true
    if (usadas.has(row)) return true
    fallos.push({ regla: 'fila_sin_parada', texto: `${donde}: «${nombreFila(row)}» (${row.hora}) está en el cálculo y no sale en pantalla` })
    return false
  })
  // 4. Huecos: un margen de hasta 30 min antes de una hora fija es normal; más de eso sin colchón ni comida es un fallo. (Después de andar y del margen de 10 min; antes de la noche no cuenta.)
  const finDe = (row) => toMin(row.hora) + row.min
  const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
  for (let i = 1; i < visibles.length; i++) {
    const prev = visibles[i - 1]
    const row = visibles[i]
    if (row.tipo === 'noche') continue
    // (El margen de 15 min antes de un Free Tour o un turno sin su «Llegada» propia se espera en el punto de encuentro: cuenta como margen.)
    const margen = prev.llegada === true && prev.lugar === row.lugar ? 0 : antesDeLlegar(row)
    const libre = toMin(row.hora) - margen - finDe(prev) - hueco(prev, row, andar)
    if (libre > 30) fallos.push({ regla: log.some((x) => x.que === 'aviso' && /queda un hueco/.test(x.causa ?? '')) ? 'hueco_con_aviso' : 'hueco', texto: `${donde}: ${libre} min libres entre «${nombreFila(prev)}» (acaba a las ${hhmm(finDe(prev))}) y «${nombreFila(row)}» (${row.hora})` })
    // 5. Dos filas que se pisan.
    if (row.tipo !== 'traslado' && prev.tipo !== 'traslado' && toMin(row.hora) < finDe(prev) && !(prev.llegada && prev.lugar === row.lugar)) fallos.push({ regla: 'solape', texto: `${donde}: «${nombreFila(row)}» (${row.hora}) empieza antes de que acabe «${nombreFila(prev)}» (${hhmm(finDe(prev))})` })
  }
  // 6. Solo se alargan los colchones con contenido (hasta 2 horas) y las comidas (hasta 75 min): ninguna otra parada pasa de lo escrito más 10 min.
  for (const row of visibles) {
    if (row.colchon || row.tipo === 'comida' || row.tipo === 'cena' || row.tipo === 'traslado' || row.tipo === 'noche' || row.llegada || row.min_escrito == null || pool.includes(row.lugar)) continue
    if (row.min > row.min_escrito + 10) fallos.push({ regla: 'parada_alargada', texto: `${donde}: «${nombreFila(row)}» dura ${row.min} min y el documento dice ${row.min_escrito}` })
  }
  // 7. Ninguna parada sale dos veces en el mismo día (las nocturnas de un sitio visto de día no cuentan).
  const vistas = new Map()
  for (const stop of day.stops ?? []) {
    if (stop.is_night_experience) continue
    const clave = plain(stop.display_title ?? stop.name)
    if (vistas.has(clave)) fallos.push({ regla: 'parada_repetida', texto: `${donde}: «${stop.display_title ?? stop.name}» sale dos veces (${vistas.get(clave)} y ${stop.suggested_time})` })
    else vistas.set(clave, stop.suggested_time)
  }
  // 9. «Llegada a {sitio}» es su propio tipo de parada (Tanda 5): lleva su texto de llegada, no el del sitio por fuera («Hoy lo ves por fuera»), ni modo, ni foto propia. Con Free Tour, también la llegada al punto de encuentro.
  for (const stop of day.stops ?? []) {
    if (!/^Llegada a/.test(stop.display_title ?? stop.name ?? '')) continue
    const mal = []
    if (stop.is_arrival !== true) mal.push('no es de tipo llegada')
    if (!stop.arrival_text) mal.push('sin texto de llegada')
    if (stop.outside_reason || stop.outside || stop.visit_mode) mal.push(`lleva «${stop.outside_reason ?? stop.visit_mode}»`)
    if (stop.no_photo !== true) mal.push('lleva foto propia')
    if (mal.length) fallos.push({ regla: 'llegada_tipo', texto: `${donde}: «${stop.display_title ?? stop.name}»: ${mal.join(', ')}` })
  }
  if ((day.stops ?? []).some((stop) => /Free Tour/.test(stop.display_title ?? stop.name ?? '') && !/^Llegada/.test(stop.display_title ?? stop.name ?? '')) && !(day.stops ?? []).some((stop) => /^Llegada al punto de encuentro/.test(stop.display_title ?? ''))) fallos.push({ regla: 'llegada_free_tour', texto: `${donde}: el Free Tour no lleva su «Llegada al punto de encuentro»` })
  // 8. El orden del día es el de su tabla (sin lo quitado): se mira en la prueba parada a parada (comparar), que conoce la tabla.
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

/**
 * 4. Restaurantes (Tanda 5): lo único que no se repite es el mismo restaurante (con aviso en el registro si no hay otro de verdad a menos de 10 min). La zona se puede repetir: no hay regla de barrio.
 */
export function comprobarMesas({ D, dias }) {
  const fallos = []
  const info = []
  const vistos = new Map()
  for (const { iso, day } of dias) {
    if (!day) continue
    const id = day.curated_day?.id ?? '?'
    const avisos = (day.engine_log ?? []).filter((x) => x.que === 'aviso' && /restaurante repetido/.test(x.causa)).map((x) => x.causa)
    for (const meal of day.meals ?? []) {
      const name = meal.restaurant
      if (!name) continue
      const tipo = meal.time === 'dinner' ? 'cena' : 'comida'
      if (vistos.has(name)) (avisos.some((texto) => texto.includes(name)) ? info : fallos).push({ regla: avisos.some((texto) => texto.includes(name)) ? 'restaurante_repetido_con_motivo' : 'restaurante_repetido', texto: `${name}: ${vistos.get(name)} y ${iso} ${id} (${tipo})` })
      else vistos.set(name, `${iso} ${id} (${tipo})`)
    }
  }
  return { fallos, info }
}

/**
 * Un recambio (el restaurante que sale no es el escrito ni su alternativa ni su tercera) tiene que ser un restaurante de verdad (`tipo_local` de `recambio_restaurante.tipos`) y estar a menos de
 * `max_andar_min` min andando del escrito. `fila`: la fila de la tabla; `name`: el que sale.
 */
export function comprobarRecambio({ D, fila, name, iso, id }) {
  const fallos = []
  const candidatas = [fila.restaurante, fila.alternativa, fila.tercera].filter(Boolean)
  if (!name || candidatas.includes(name)) return fallos
  const cfg = D.destination_config?.recambio_restaurante ?? { tipos: ['restaurante', 'pizzeria'], max_andar_min: 10 }
  const restaurante = D.restaurants.find((item) => item.name === name)
  if (!cfg.tipos.includes(restaurante?.tipo_local)) fallos.push({ regla: 'recambio_no_es_restaurante', texto: `${iso} ${id}: en lugar de ${fila.restaurante} sale «${name}» (${restaurante?.tipo_local ?? 'sin tipo'})` })
  const minutos = andar({ tipo: 'comida', restaurante: fila.restaurante }, { tipo: 'comida', restaurante: name })
  if (minutos > cfg.max_andar_min) fallos.push({ regla: 'recambio_lejos', texto: `${iso} ${id}: en lugar de ${fila.restaurante} sale «${name}», a ${minutos} min andando (máximo ${cfg.max_andar_min})` })
  return fallos
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

/** 8. Excursión de medio día: de 8:00 a 14:00 el viajero está fuera (ninguna parada ni comida antes de las 16:00), la tarde es la del día que sustituye a la excursión y, sin ninguna parada de nivel 1 o 2, queda libre. */
export function comprobarMediaJornada({ D, iso, id, day, esperadoId }) {
  const fallos = []
  const donde = `${iso} ${id}`
  if (!day?.half_day_excursion) return [{ regla: 'media_jornada', texto: `${donde}: el día no lleva la excursión de medio día` }]
  if (esperadoId && id !== esperadoId) fallos.push({ regla: 'media_jornada', texto: `${donde}: la tarde es la de ${id} y toca la de ${esperadoId}` })
  const inicio = toMin(day.half_day_excursion.route_starts_at)
  for (const stop of day.stops ?? []) if (!stop.is_night_experience && toMin(stop.suggested_time) < inicio) fallos.push({ regla: 'media_jornada', texto: `${donde}: «${stop.display_title ?? stop.name}» a las ${stop.suggested_time}, antes de las ${day.half_day_excursion.route_starts_at}` })
  for (const meal of day.meals ?? []) if (meal.time === 'lunch') fallos.push({ regla: 'media_jornada', texto: `${donde}: lleva comida: la comida de esa excursión es el bloque «¿Tu excursión incluye comida?»` })
  const buenas = (day.stops ?? []).filter((stop) => !stop.is_night_experience && !stop.pass_through && (D.places.find((place) => place.name === (stop.site_id ? D.places.find((p) => p.id === stop.site_id)?.name : stop.name))?.level ?? 3) <= 2)
  if (buenas.length === 0 && !day.afternoon_free) fallos.push({ regla: 'media_jornada', texto: `${donde}: sin paradas de nivel 1 o 2 y la tarde no sale libre` })
  if (buenas.length > 0 && day.afternoon_free) fallos.push({ regla: 'media_jornada', texto: `${donde}: sale «tarde libre» y tiene paradas de nivel 1 o 2` })
  return fallos
}

/** 9. Ningún medio día repite el tema de un día entero del mismo viaje (sus paradas principales). FALLO CONOCIDO: el arreglo de verdad es «Llegada según la hora» (próxima tanda); aquí solo se mide. */
export function comprobarMedioDiaRepetido({ D, dias }) {
  const fallos = []
  const principales = (day) => new Set((day?.stops ?? []).filter((stop) => !stop.is_night_experience && !stop.pass_through && (D.places.find((place) => place.name === stop.name)?.level ?? 3) <= 2).map((stop) => stop.name))
  const lista = dias.filter((x) => x.day).map((x) => ({ ...x, id: x.day.curated_day?.id ?? '', set: principales(x.day) }))
  for (const medio of lista.filter((x) => /medio/.test(x.id))) {
    for (const entero of lista.filter((x) => !/medio/.test(x.id) && x.id)) {
      const comunes = [...medio.set].filter((name) => entero.set.has(name))
      if (medio.set.size >= 3 && comunes.length / medio.set.size >= 0.6) fallos.push({ regla: 'medio_dia_repite_dia_FALLO_CONOCIDO', texto: `${medio.iso} ${medio.id} repite ${comunes.length} de sus ${medio.set.size} paradas principales del día ${entero.iso} ${entero.id} (${comunes.slice(0, 4).join(', ')})` })
    }
  }
  return fallos
}

/** 7. Fotos (Tanda 5): todas las fotos de public/fotos/<destino>/ están registradas (en `fotos` o en un hueco) y salen en su sitio; los huecos que siguen vacíos, en el informe. */
export function comprobarFotos(fs, destino = 'roma') {
  const tabla = JSON.parse(fs.readFileSync(`data/dias/${destino}/_fotos.json`, 'utf8'))
  const archivos = fs.readdirSync(`public/fotos/${destino}`).filter((file) => /\.jpg$/i.test(file) && !/_p\.jpg$/i.test(file))
  const registradas = new Set([...tabla.fotos.map((foto) => foto.archivo), ...tabla.huecos.map((hueco) => hueco.archivo)])
  const sinRegistrar = archivos.filter((file) => !registradas.has(file))
  const sinPequena = archivos.filter((file) => !archivos.includes(file.replace(/\.jpg$/i, '_p.jpg')) && !fs.existsSync(`public/fotos/${destino}/${file.replace(/\.jpg$/i, '_p.jpg')}`))
  const vacios = tabla.huecos.filter((hueco) => !archivos.includes(hueco.archivo)).map((hueco) => `${hueco.archivo} → ${hueco.sitio}`)
  return { sinRegistrar, sinPequena, vacios, total: archivos.length }
}
