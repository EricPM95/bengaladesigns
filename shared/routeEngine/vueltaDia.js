/**
 * El día de vuelta con horas (Tanda 7, puntos 9, 10-vuelta, 12-vuelta y 19 de PARA_CODE_TANDA7_v3.md). Módulo puro, sin nada de un destino concreto: lee del destino
 *   · la tabla de la vuelta por filas y las últimas mañanas (`written.llegadas`, de `data/dias/<destino>/listas.json`),
 *   · los puntos, los márgenes, la maleta y «Para tu zona» (`_llegada.json`),
 *   · los sitios grandes y el bloque de cada uno (`destData.sitios_grandes`),
 * y deja las decisiones en datos (la fila, la última mañana, el bloque, la tarjeta «Hoy vuelves a casa», los avisos). El motor (listasTrip.js) solo hace los enganches:
 *   1. `prepararVuelta`  (antes de preparar los días)   → la fila, lo que cambia en el último día de ruta y en el día de un sitio grande reservado el día de vuelta.
 *   2. `disponerVuelta`  (con todos los días hechos)     → qué lleva el día de vuelta (la última mañana que no repite lo ya visto, el bloque, un día más…).
 *   3. `publicoDeVuelta` (con el día de vuelta hecho)    → lo que viaja en la salida del motor (`plan.vuelta`): la tarjeta, los avisos, el resumen.
 *
 * Reglas de Eric que mandan: la app avisa y nunca prohíbe; nada se quita sin decidirlo el viajero; ninguna hora calculada a la vista (aquí solo salen la hora del viajero y los datos);
 * sin cuentas al minuto (la hora solo elige la fila de una tabla; la lista de cada fila está escrita); sin nombres de empresas ni taxi.
 */

import { arrivalModeOf } from '../arrival/arrivalRules.js'
import { paraTuZona } from '../arrival/paraTuZona.js'
import { easterIso, matchesDateToken } from './openingHours.js'
import { copiarParte, aplicarVariantes } from './listasDia.js'

const aMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const dosDigitos = (n) => String(n).padStart(2, '0')
/** «9:05» y «09:05» son la misma hora: el motor siempre usa «HH:MM». */
export const normalizaHora = (hhmm) => {
  const min = aMin(hhmm)
  return min == null ? null : `${dosDigitos(Math.floor(min / 60))}:${dosDigitos(min % 60)}`
}
/** La hora para los textos, como la escribe el viajero («9:05», «17:00»). */
const horaCorta = (hhmm) => {
  const min = aMin(hhmm)
  return min == null ? '' : `${Math.floor(min / 60)}:${dosDigitos(min % 60)}`
}
const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)))
const sinTilde = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const ALIAS_MODO = { avion: 'avion', flight: 'avion', plane: 'avion', vuelo: 'avion', tren: 'tren', train: 'tren', bus: 'bus', autobus: 'bus', 'autobús': 'bus', ferry: 'ferry', barco: 'ferry', coche: 'coche', car: 'coche', own_vehicle: 'coche' }
/** Cómo se llama el medio en los textos: «Tienes el vuelo…», «tu tren sale…». */
const PALABRA = { avion: 'vuelo', tren: 'tren', bus: 'autobús', ferry: 'barco' }
/** A dónde se va, para el resumen: «antes de irte al aeropuerto / a la estación / al puerto». */
const LUGAR_DE_SALIDA = { avion: 'al aeropuerto', tren: 'a la estación', bus: 'a la estación', ferry: 'al puerto' }

// ── Los datos de la vuelta: el medio, el punto y la hora de salir ──────────────────────────────────────────────────────────────────

/** 'flight' → 'avion', 'train' → 'tren'…; null si no es un medio con hora (en coche no se pide hora). */
export function medioDeVuelta(modo) {
  const clave = ALIAS_MODO[sinTilde(modo)] ?? ALIAS_MODO[modo] ?? null
  if (!clave) return arrivalModeOf(modo) === 'coche' ? null : arrivalModeOf(modo)
  return clave === 'coche' ? null : clave
}

/**
 * El punto de Roma de la vuelta. Sin punto (un viaje viejo), el del traslado más largo de ese medio: avión, Fiumicino; tren, Tiburtina; autobús, la estación de autobuses de Tiburtina; barco, Civitavecchia
 * (siempre sale de `al_centro_min` de `_llegada.json`, no de un nombre).
 */
export function puntoDeVuelta(info, modeKey, puntoId = null) {
  const medio = info?.medios?.[modeKey] ?? null
  const puntos = medio?.puntos ?? []
  const elegido = puntoId ? puntos.find((p) => p.id === puntoId) ?? null : null
  const punto = elegido ?? [...puntos].sort((a, b) => (b.al_centro_min ?? 0) - (a.al_centro_min ?? 0))[0] ?? null
  return { medio, punto, porDefecto: !elegido }
}

/** Cuánto antes de la hora del billete hay que salir de Roma (el mismo margen que `leaveMinutesOf`, sin redondear: la hora solo elige una fila). */
export function margenDeSalida(modeKey, medio, punto) {
  if (modeKey === 'ferry') return (medio?.salir_antes_min ?? 120) + (medio?.trayecto_min ?? 110)
  return punto?.salir_antes_min ?? medio?.salir_antes_min ?? (modeKey === 'avion' ? 180 : 45)
}

/** @returns {{ modeKey, medio, punto, porDefecto, horaMin, hora, margen, salirMin }|null}  `salirMin` puede ser negativo: la noche de antes. Nada de esto se enseña. */
export function datosDeVuelta(vuelta, info) {
  if (!vuelta || vuelta.pago === false) return null
  const modeKey = medioDeVuelta(vuelta.modo ?? 'avion')
  const hora = normalizaHora(vuelta.hora)
  if (!modeKey || !hora || !info) return null
  const { medio, punto, porDefecto } = puntoDeVuelta(info, modeKey, vuelta.puntoId ?? vuelta.punto ?? null)
  if (!punto) return null
  const margen = margenDeSalida(modeKey, medio, punto)
  return { modeKey, medio, punto, porDefecto, horaMin: aMin(hora), hora, margen, salirMin: aMin(hora) - margen }
}

// ── La tabla de la vuelta ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * La fila de la tabla para una hora de salir. Las filas están escritas con las horas del vuelo desde el punto de la tabla (Fiumicino, margen 3:00): para otro punto se
 * compara «hora de salir» con la de la fila menos el margen de la tabla. Cada fila empieza en su hora (nada se redondea). Lo de antes de la primera fila (salir en la noche de antes) es la primera.
 */
export function filaDeVuelta(tabla, salirMin) {
  const filas = tabla?.filas ?? []
  if (filas.length === 0) return null
  const equivalente = salirMin + (aMin(tabla.margen_de_la_tabla) ?? 180)
  let indice = filas.findIndex((fila) => equivalente >= (aMin(fila.desde) ?? 0) && (fila.hasta == null || equivalente <= (aMin(fila.hasta) ?? 24 * 60)))
  if (indice < 0) indice = equivalente < 0 ? 0 : filas.length - 1
  return { fila: filas[indice], indice, equivalente }
}

// ── Las últimas mañanas ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** ¿Cae esta fecha en uno de los días que la fila se salta? «MM-DD» o «pascua» (el domingo de Pascua). */
function seSaltaEseDia(tokens, dateIso) {
  if (!dateIso) return false
  return (tokens ?? []).some((token) => (token === 'pascua' ? easterIso(Number(dateIso.slice(0, 4))) === dateIso : matchesDateToken(token, dateIso)))
}

/**
 * La última mañana: la primera de la tabla que no repite lo principal ya visto de día (`vistos`: lo que ya ha salido en los días de ruta, también de camino; las nocturnas no cuentan),
 * que existe en el destino y que no se salta ese día (el 25 de diciembre y el domingo de Pascua el Vaticano; el miércoles, la que su mañana corta marca como `miercoles: "siguiente"`).
 * @returns {{ fila: object|null, hoja: string|null, saltadas: {lista:string, motivo:string}[] }}
 */
export function elegirUltimaManana({ ultimas, vistos, written, weekday, dateIso }) {
  const saltadas = []
  for (const fila of ultimas ?? []) {
    if (fila.hoja) return { fila: null, hoja: fila.hoja, saltadas }
    const dia = written.days?.[fila.lista]
    if (!dia) { saltadas.push({ lista: fila.lista, motivo: 'el destino no la tiene escrita' }); continue }
    const visto = (fila.lo_principal ?? []).find((lugar) => vistos.has(lugar))
    if (visto) { saltadas.push({ lista: fila.lista, motivo: `ya has visto ${visto}` }); continue }
    if (seSaltaEseDia(fila.se_salta, dateIso)) { saltadas.push({ lista: fila.lista, motivo: 'se salta ese día' }); continue }
    if (weekday && sinTilde(weekday) === 'miercoles' && [fila.corta, fila.sin_comida, fila.con_comida].some((id) => id && written.days?.[id]?.miercoles === 'siguiente') || (weekday && sinTilde(weekday) === 'miercoles' && dia.miercoles === 'siguiente')) { saltadas.push({ lista: fila.lista, motivo: 'el miércoles (la audiencia)' }); continue }
    return { fila, hoja: null, saltadas }
  }
  return { fila: null, hoja: null, saltadas }
}

/** El siguiente día escrito que el viaje no lleva, en el orden de la tabla de días del destino (la fila más larga). Null si no queda ninguno. */
export function siguienteDiaQueNoLleva(destData, written, orden, { sinFreeTour = false } = {}) {
  const tabla = destData?.curated_routes?.por_dias_ciudad ?? {}
  const claves = Object.keys(tabla).filter((k) => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b)
  const fila = claves.length ? tabla[String(claves.at(-1))]?.[sinFreeTour ? 'sin_free_tour' : 'con_free_tour'] ?? tabla[String(claves.at(-1))]?.sin_free_tour ?? [] : []
  const ids = fila.map((item) => (typeof item === 'string' ? item : item.con_galeria ?? item.sin_galeria))
  return ids.find((id) => id && written.days?.[id] && !orden.includes(id)) ?? null
}

// ── Los bloques de los sitios grandes ──────────────────────────────────────────────────────────────────────────────────────────────

const esTraslado = (stop) => stop?.tipo === 'traslado'

/** Quita de una lista las paradas con esos nombres (y el traslado que iba delante de cada una, que era para llegar a ella). */
export function sacarParadas(lista, nombres) {
  const fuera = new Set(nombres)
  const quitar = new Set()
  lista.forEach((stop, i) => {
    if (esTraslado(stop) || !fuera.has(stop.lugar)) return
    quitar.add(i)
    if (esTraslado(lista[i - 1])) quitar.add(i - 1)
  })
  const resto = lista.filter((_, i) => !quitar.has(i))
  // (Un traslado que se queda sin nada detrás no lleva a ninguna parte.)
  return resto.filter((stop, i) => !(esTraslado(stop) && (!resto[i + 1] || esTraslado(resto[i + 1]))))
}

/**
 * Las paradas del bloque de un sitio grande reservado, tal como las lleva su día escrito para esa hora.
 * `omitir`: lo que el día del sitio (que sigue en el viaje, en su versión sin esa visita) se ha quedado porque sin ello su mañana quedaba vacía: no se repite en el bloque.
 */
export function armarBloque({ sitio, hora, written, ctxDe, fechaDelDia, omitir = new Set() }) {
  const bloque = sitio.bloque
  const diaId = (sitio.dias ?? []).find((id) => written.days?.[id])
  if (!bloque?.paradas?.length || !diaId) return null
  const dia = written.days[diaId]
  const parte = dia.partes.unica ?? Object.values(dia.partes)[0]
  const trabajo = aplicarVariantes(copiarParte(parte), dia, ctxDe(diaId, { [sitio.nombre]: hora }), [])
  const nombres = new Set(bloque.paradas)
  const delBloque = (lista) => (lista ?? []).filter((stop) => !esTraslado(stop) && nombres.has(stop.lugar) && (stop.lugar === sitio.nombre || !omitir.has(stop.lugar)))
  const out = { diaId, manana: delBloque(trabajo.manana), tarde: delBloque(trabajo.tarde), sobra: delBloque(trabajo.sobra), comida: clone(trabajo.comida ?? null), empieza: trabajo.empieza ?? null, despuesDeComer: [] }
  // Ese día de la semana, esas paradas nunca van antes de comer (los Museos de un miércoles: la Plaza y la Basílica): después de la comida si la fila la lleva y, si no, a «Si te sobra tiempo».
  const regla = bloque.despues_de_comer
  if (regla && fechaDelDia.weekday && (regla.dias_semana ?? []).map(sinTilde).includes(sinTilde(fechaDelDia.weekday))) {
    const nombresRegla = new Set(regla.paradas ?? [])
    out.despuesDeComer = [...out.manana.filter((s) => nombresRegla.has(s.lugar)), ...out.tarde.filter((s) => nombresRegla.has(s.lugar))]
    out.manana = out.manana.filter((s) => !nombresRegla.has(s.lugar))
    out.tarde = out.tarde.filter((s) => !nombresRegla.has(s.lugar))
  }
  return out
}

// ── La preparación (antes de preparar los días) ────────────────────────────────────────────────────────────────────────────────────

/**
 * Lo que se sabe de la vuelta antes de preparar los días: la fila, las reservas de ese día y lo que cambia en los días de ruta.
 * @param {object} env  { vuelta, info, destData, written, totalDays, contentDays, calendar, dateRangeStartIso, reservasGrandes, reservasViaje, sitiosGrandes, tour, weekdayDe }
 * @returns {object|null}  null si no hay vuelta con hora (o es la gratis, o la ruta a mano, o un viaje de una sola fecha): el motor no cambia nada.
 */
export function prepararVuelta(env) {
  const { vuelta, info, destData, written, totalDays, contentDays, calendar, reservasGrandes = [], reservasViaje = [], sitiosGrandes, tour } = env
  const tabla = written?.llegadas?.vuelta ?? null
  const datos = datosDeVuelta(vuelta, info)
  if (!datos || !tabla || totalDays < 2) return null
  const encontrada = filaDeVuelta(tabla, datos.salirMin)
  if (!encontrada) return null
  const dayNumber = contentDays + 1
  const dateIso = calendar.hasDates ? calendar.dateOfDay(dayNumber) : null
  const ultimoDeRuta = { dayNumber: contentDays, dateIso: calendar.hasDates ? calendar.dateOfDay(contentDays) : null }
  const lleva = encontrada.fila.lleva
  const madrugada = encontrada.fila.dia_antes === 'con_cena_sin_nocturna'
  const aMano = vuelta.aMano === true

  const normaliza = (r) => ({ name: r.name, hora: normalizaHora(r.time ?? r.hora), dateIso: r.dateIso ?? null, dayNumber: r.dayNumber != null ? Number(r.dayNumber) : null })
  const esDe = (r, dia) => (calendar.hasDates && r.dateIso ? r.dateIso === dia.dateIso : r.dayNumber != null && r.dayNumber === dia.dayNumber)
  const esTour = (name) => Boolean(tour) && name === tour.name
  const grandesLista = (destData?.sitios_grandes?.lugares ?? [])
  const sitioDe = (name) => grandesLista.find((s) => s.nombre === name) ?? null
  const reservas = [
    ...reservasGrandes.filter((r) => r?.name && r.time).map(normaliza),
    ...reservasViaje.filter((r) => r?.name && r.time).map(normaliza),
  ].filter((r) => r.hora)
  // Las de un mismo sitio y fecha cuentan una vez (la petición puede traer la misma reserva en las dos listas).
  const unicas = reservas.filter((r, i) => reservas.findIndex((o) => o.name === r.name && o.hora === r.hora && o.dateIso === r.dateIso && o.dayNumber === r.dayNumber) === i)
  const enVuelta = unicas.filter((r) => esDe(r, { dayNumber, dateIso }))
  const enUltimoDia = unicas.filter((r) => esDe(r, ultimoDeRuta))
  // Una reserva grande con bloque (no el Free Tour, que no tiene bloque) → su bloque. Todo lo demás de ese día es una reserva pequeña: su parada a su hora.
  const grandes = enVuelta.filter((r) => sitiosGrandes?.has(r.name) && !esTour(r.name) && sitioDe(r.name)?.bloque?.paradas?.length).sort((a, b) => aMin(a.hora) - aMin(b.hora)).map((r) => ({ ...r, sitio: sitioDe(r.name) }))
  const pequenas = enVuelta.filter((r) => !grandes.some((g) => g.name === r.name && g.hora === r.hora)).sort((a, b) => aMin(a.hora) - aMin(b.hora))
  // La excursión reservada (la del viajero: no se toca nunca): si cae el día de vuelta o el último día de ruta, los avisos la comparan con la hora de salir.
  const exc = vuelta.excursion
  const mismoDia = (dia) => (calendar.hasDates && exc?.dateIso ? exc.dateIso === dia.dateIso : exc?.dayNumber != null && Number(exc.dayNumber) === dia.dayNumber)
  const excursion = exc?.nombre ? { nombre: exc.nombre, vuelve: normalizaHora(exc.vuelve), medioDia: exc.medioDia === true, enVuelta: mismoDia({ dayNumber, dateIso }), enUltimoDia: mismoDia(ultimoDeRuta) } : null
  // Los días escritos en los que está la visita de un sitio grande: los suyos (`dias`), las versiones que la llegada hace de ellos (las claves de `sin_la_visita`) y cualquier otro día cuya lista lleve esa visita
  // (el D1 «de tarde», «la rápida»…: las versiones del día 1 que llevan el Coliseo). Todos se quedan sin ella cuando su reserva es del día de vuelta. Sale de las listas y de los datos del destino, sin nombres escritos aquí.
  const llevaLaVisita = (dia, nombre) => Object.values(dia?.partes ?? {}).some((parte) => Object.values(parte ?? {}).some((lista) => Array.isArray(lista) && lista.some((s) => s?.lugar === nombre && s.modo !== 'camino' && s.modo !== 'fuera')))
  const diasDelSitio = (sitio) => [...new Set([...(sitio.dias ?? []), ...Object.keys(sitio.sin_la_visita ?? {}), ...Object.entries(written.days ?? {}).filter(([, dia]) => llevaLaVisita(dia, sitio.nombre)).map(([id]) => id)])]
  const dueños = new Set(grandes.flatMap((g) => diasDelSitio(g.sitio)))
  const nombresDeBloques = [...new Set(grandes.flatMap((g) => g.sitio.bloque.paradas))]
  const reservados = new Set(grandes.map((g) => g.name))
  // Lo que cada día del sitio se queda aunque sea del bloque (porque sin ello su mañana o su tarde quedaba vacía): el bloque del día de vuelta no lo repite.
  const conservadas = new Map()

  return {
    datos, tabla, fila: encontrada.fila, indiceFila: encontrada.indice, equivalente: encontrada.equivalente, lleva, madrugada, aMano, mes: calendar.hasDates ? null : calendar.month,
    dia: { dayNumber, dateIso, weekday: env.weekdayDe ? env.weekdayDe(dayNumber) : null },
    ultimoDeRuta, excursion, reservas: { vuelta: enVuelta, ultimoDia: enUltimoDia, grandes, pequenas },
    // El día de un sitio grande reservado el día de vuelta se queda en su día en la versión sin esa visita: el sitio «cierra» para él y su bloque sale de la lista.
    cerradoEn: (diaId, nombre) => grandes.some((g) => g.name === nombre && diasDelSitio(g.sitio).includes(diaId)),
    conservadas,
    limpiar: (diaId, trabajo) => {
      if (!dueños.has(diaId) || !trabajo) return trabajo
      const sobrevive = new Set()
      // Se quita todo el bloque; pero si con eso una franja del día se quedaba vacía (la versión sin Museos del Vaticano es solo la Plaza y la Basílica), lo del bloque que no es la visita reservada se queda en su día.
      const franja = (lista) => {
        const quitada = sacarParadas(lista ?? [], nombresDeBloques)
        const habia = (lista ?? []).some((s) => !esTraslado(s))
        if (habia && !quitada.some((s) => !esTraslado(s))) {
          const dejan = (lista ?? []).filter((s) => !esTraslado(s) && nombresDeBloques.includes(s.lugar) && !reservados.has(s.lugar)).map((s) => s.lugar)
          dejan.forEach((n) => sobrevive.add(n))
          return sacarParadas(lista ?? [], [...reservados])
        }
        return quitada
      }
      const salida = { ...trabajo, manana: franja(trabajo.manana), tarde: franja(trabajo.tarde), ...(trabajo.sobra ? { sobra: sacarParadas(trabajo.sobra, nombresDeBloques) } : {}) }
      conservadas.set(diaId, new Set([...(conservadas.get(diaId) ?? []), ...sobrevive]))
      return salida
    },
  }
}

// ── Qué lleva el día de vuelta (con todos los días de ruta hechos) ───────────────────────────────────────────────────────────────

/**
 * Decide el contenido del día de vuelta. No construye el día (eso lo hace el motor con sus listas): devuelve qué hay que construir.
 * @returns {{ tipo: 'sin_paradas'|'manana'|'dia_mas'|'bloques'|'solo_reservas'|'hoja', ... }}
 */
export function disponerVuelta(V, { written, destData, vistos, orden, hasFreeTour, diaCaidoAlLlegar = null }) {
  const { lleva, dia } = V
  const hayGrandes = V.reservas.grandes.length > 0
  const hayPequenas = V.reservas.pequenas.length > 0
  const ultimas = written.llegadas?.ultimas_mananas ?? []
  const elegida = () => elegirUltimaManana({ ultimas, vistos, written, weekday: dia.weekday, dateIso: dia.dateIso })
  const base = { saltadas: [] }

  // Una reserva grande: solo su bloque, entero, sin mirar si cabe; el día tiene mañana aunque su fila diga «solo el traslado».
  if (hayGrandes) return { ...base, tipo: 'bloques', conComida: lleva === 'manana_con_comida' || lleva === 'dia_mas', sinCenaNiNoche: true }
  // La excursión reservada el día de vuelta: el día es de la excursión (no se toca nunca ni se le pone una mañana encima); el aviso, si vuelve tarde.
  if (V.excursion?.enVuelta) return { ...base, tipo: 'excursion' }
  if (lleva === 'solo_traslado') return hayPequenas ? { ...base, tipo: 'solo_reservas' } : { ...base, tipo: 'sin_paradas' }
  if (lleva === 'dia_mas') {
    const caido = [].concat(diaCaidoAlLlegar ?? []).find((id) => id && written.days?.[id] && !orden.includes(id)) ?? null
    const siguiente = caido ?? siguienteDiaQueNoLleva(destData, written, orden, { sinFreeTour: !hasFreeTour })
    if (siguiente) return { ...base, tipo: 'dia_mas', lista: siguiente, origen: caido ? 'cayo_al_llegar' : 'siguiente_que_no_lleva', sinCenaNiNoche: true }
    // (Si no queda ninguno, la última mañana con comida y la tarde libre.)
    const e = elegida()
    return e.fila ? { tipo: 'manana', ...e, corta: false, conComida: true, tardeLibre: true, origen: 'sin_dia_que_ponerle' } : { tipo: 'hoja', ...e, conComida: true, tardeLibre: true }
  }
  const e = elegida()
  if (lleva === 'manana_corta') return e.fila ? { tipo: 'manana', ...e, corta: true, conComida: false, tardeLibre: false } : { tipo: 'hoja', ...e, tardeLibre: false }
  // (Tanda 7b) Con su lista propia —sin comida o con comida— la mañana es esa lista, escrita para el rato que hay; sin ella, la mañana de siempre.
  if (lleva === 'manana_sin_comida') return e.fila ? { tipo: 'manana', ...e, corta: false, conComida: false, tardeLibre: false, ...(e.fila.sin_comida ? { listaPropia: e.fila.sin_comida } : {}) } : { tipo: 'hoja', ...e, tardeLibre: false }
  // manana_con_comida
  return e.fila ? { tipo: 'manana', ...e, corta: false, conComida: true, tardeLibre: V.fila.tarde_libre === true, ...(e.fila.con_comida ? { listaPropia: e.fila.con_comida } : {}) } : { tipo: 'hoja', ...e, conComida: true, tardeLibre: V.fila.tarde_libre === true }
}

// ── Los textos y los avisos (solo con datos del viajero y del destino) ──────────────────────────────────────────────────────────────

const rellena = (texto, valores) => String(texto ?? '').replace(/\{([^}]+)\}/g, (todo, clave) => (valores[clave] != null ? valores[clave] : todo))
const sinZonaNombre = (nombre) => String(nombre ?? '').replace(/\s*\(.*\)\s*$/, '').trim()

/** Quita de un trozo de `_llegada.json` lo que no es para la pantalla (las fuentes, las fechas de comprobación y los horarios completos): se quedan en los datos. */
const sinLoInterno = (valor) => {
  if (Array.isArray(valor)) return valor.map(sinLoInterno)
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).filter(([clave]) => !['fuente', 'nota_fuente', 'comprobado', 'horario'].includes(clave)).map(([clave, v]) => [clave, sinLoInterno(v)]))
  return valor
}

/** La mejor opción de «Para tu zona» como una frase (cada tramo con el tiempo de `_llegada.json`; nunca un tiempo total sumado). */
export function fraseDeOpcion(mejor, info) {
  if (!mejor) return null
  if (mejor.tipo === 'traslado_privado') return info?.para_tu_zona?.traslado_privado?.tarjeta_vuelta ?? null
  return (mejor.tramos ?? []).filter((t) => t.medio !== 'andando').map((t) => `${t.nombre}${t.a ? ` a ${t.a}` : ''}${t.tiempo ? ` (${t.tiempo})` : ''}`).join(' y ')
}

/**
 * La tarjeta «Hoy vuelves a casa» (los textos son los de `DV-traslado` del destino). `madrugada`: la del final del último día de ruta («Tu vuelo sale esta noche…»).
 */
export function tarjetaHoyVuelves({ V, written, info, destData, zona, madrugada = false }) {
  const textos = written.days?.['DV-traslado']?.textos
  if (!textos) return null
  const { datos } = V
  const punto = datos.modeKey === 'avion' ? datos.punto.corto : datos.punto.nombre
  const hora = horaCorta(datos.hora)
  let texto
  if (madrugada) texto = textos.madrugada
  else if (datos.modeKey === 'ferry') texto = textos.barco
  else if (datos.modeKey === 'avion') texto = textos.avion
  else texto = datos.modeKey === 'bus' ? String(textos.tren_o_autobus).replace(/\btren\b/, 'autobús') : textos.tren_o_autobus
  const zonaId = zona ?? 'nose'
  // La hora para mirar si el servicio funciona es la de SALIR de su zona (vuelo − margen), siempre dentro del mismo día: se usa por dentro y nunca se enseña.
  const salirDia = ((V.datos.salirMin % 1440) + 1440) % 1440
  const ptz = paraTuZona(info, { zona: zonaId, puntoId: datos.punto.id, hora: `${dosDigitos(Math.floor(salirDia / 60))}:${dosDigitos(salirDia % 60)}`, fecha: V.dia.dateIso, mes: V.mes ?? null, sentido: 'vuelta' })
  const zonaNombre = sinZonaNombre((destData?.destination_config?.zonas_alojamiento ?? []).find((z) => z.id === (ptz?.zona ?? zonaId))?.nombre ?? '') || null
  const mejorTexto = ptz ? fraseDeOpcion(ptz.mejor, info) : null
  return {
    titulo: textos.titulo,
    texto: rellena(texto, { punto, hora }),
    desde_tu_zona: ptz && mejorTexto ? { texto: rellena(textos.desde_tu_zona, { zona: zonaNombre ?? '', 'su mejor opción': mejorTexto }), zona: ptz.zona, zona_nombre: zonaNombre, sin_zona: ptz.sinZona, aviso: ptz.aviso ?? null, mejor: sinLoInterno(ptz.mejor), otras: sinLoInterno(ptz.otras), traslado_privado: ptz.mejor?.tipo === 'traslado_privado' || ptz.modo === 'noche' ? info?.para_tu_zona?.traslado_privado?.tarjeta_vuelta ?? null : null } : null,
    ver_como_ir: { texto: 'Ver cómo ir', abre: 'ficha_de_vuelta' },
    explorar: { texto: textos.explorar, boton: 'Explorar monumentos', abre: 'explorar_monumentos', cerca_de_mi: true },
    despedida: textos.despedida,
    madrugada,
  }
}

const aviso = (tipo, texto, extra = {}) => ({ tipo, texto, donde: 'campana', botones: [{ id: 'ver_reserva', texto: 'Ver mi reserva' }], ...extra })

/**
 * Los avisos de la vuelta (punto 14): una reserva que acaba después de la hora de salir, la excursión que vuelve después de salir y las reservas del mismo día que se cruzan.
 * `salirDeRuta`: minutos desde las 0:00 del día en que ocurren (el día de vuelta, o el último día de ruta si la salida es de madrugada: la hora de salir de esa noche).
 */
export function avisosDeVuelta({ V, destData, tour, duracionDe }) {
  const excursion = V.excursion
  const { datos } = V
  const palabra = PALABRA[datos.modeKey]
  const horaViajero = horaCorta(datos.hora)
  const avisos = []
  const sitiosGrandes = destData?.sitios_grandes?.lugares ?? []
  const nombreDe = (r) => {
    const sitio = sitiosGrandes.find((s) => s.nombre === r.name)
    if (tour && r.name === tour.name) return 'Tu Free Tour'
    return sitio?.entrada_a ? `Tu entrada ${sitio.entrada_a}` : `Tu reserva de ${r.name}`
  }
  const comprobar = (reservas, salirEnEseDia, dia) => {
    const vistas = []
    for (const r of reservas) {
      const dura = duracionDe(r.name) ?? 60
      if (aMin(r.hora) + dura > salirEnEseDia) {
        avisos.push(aviso('reserva_despues_de_salir', `${nombreDe(r)} es a las ${horaCorta(r.hora)} y tu ${palabra} sale a las ${horaViajero}: no te da tiempo. Revisa tu reserva.`, { reserva: { name: r.name, hora: r.hora }, dayNumber: dia.dayNumber, dateIso: dia.dateIso }))
      }
      vistas.push({ r, ini: aMin(r.hora), fin: aMin(r.hora) + dura })
    }
    // Dos reservas del mismo día que se pisan: el aviso «coinciden» de siempre.
    for (let i = 0; i < vistas.length; i++) for (let j = i + 1; j < vistas.length; j++) {
      const a = vistas[i]
      const b = vistas[j]
      if (a.ini < b.fin && b.ini < a.fin) {
        const minuscula = (t) => t.replace(/^Tu /, 'tu ')
        avisos.push(aviso('coinciden', `${nombreDe(a.r)} y ${minuscula(nombreDe(b.r))} coinciden. Revisa una de las dos reservas.`, { botones: [{ id: 'ver_reservas', texto: 'Ver mis reservas' }], reservas: [{ name: a.r.name, hora: a.r.hora }, { name: b.r.name, hora: b.r.hora }], dayNumber: dia.dayNumber, dateIso: dia.dateIso }))
      }
    }
  }
  // El día de vuelta se compara con la hora de salir de ese día; el último día de ruta con una salida de madrugada, con la hora de salir de esa noche (la del día de antes + 24 h).
  const salirVuelta = V.datos.salirMin
  const salirNoche = V.datos.salirMin + 1440
  comprobar(V.reservas.vuelta, salirVuelta, V.dia)
  if (V.madrugada) comprobar(V.reservas.ultimoDia, salirNoche, V.ultimoDeRuta)
  // La excursión reservada ese día que vuelve después de la hora de salir (o, de medio día, sin hora de vuelta: vuelve a media tarde).
  if (excursion) {
    const enVuelta = V.madrugada ? excursion.enUltimoDia : excursion.enVuelta
    if (enVuelta) {
      const salirEnEseDia = V.madrugada ? salirNoche : salirVuelta
      const vuelve = aMin(excursion.vuelve)
      const sinHora = vuelve == null
      const choca = sinHora ? excursion.medioDia !== true : vuelve > salirEnEseDia
      if (choca) {
        const texto = sinHora
          ? `Tienes el ${palabra} a las ${horaViajero} y tu excursión a ${excursion.nombre} vuelve a Roma: no te da tiempo. Revisa tu reserva de la excursión.`
          : `Tienes el ${palabra} a las ${horaViajero} y tu excursión a ${excursion.nombre} vuelve a Roma a las ${horaCorta(excursion.vuelve)}: no te da tiempo. Revisa tu reserva de la excursión.`
        avisos.push(aviso('excursion_vuelve_tarde', texto, { botones: [{ id: 'ver_reserva', texto: 'Ver mi reserva' }, { id: 'pasar_a_roma', texto: 'Pasar este día a Roma' }], dayNumber: V.madrugada ? V.ultimoDeRuta.dayNumber : V.dia.dayNumber, dateIso: V.madrugada ? V.ultimoDeRuta.dateIso : V.dia.dateIso }))
      }
    }
  }
  return avisos
}

/**
 * Lo que dice la hoja del resumen sobre el día de vuelta, sin el nombre del día (las pantallas lo ponen con nombreDeDia: «El sáb 14»).
 * @returns {{ tipo: 'ultima_manana'|'casi_un_dia'|'solo_traslado'|'madrugada', plantilla: string }}
 */
export function resumenDeVuelta({ V, contenido }) {
  const adonde = LUGAR_DE_SALIDA[V.datos.modeKey]
  if (contenido === 'sin_paradas' || contenido === 'hoja') return { tipo: V.madrugada ? 'madrugada' : 'solo_traslado', plantilla: `{dia} te vas pronto: ese día solo lleva el camino ${adonde}.` }
  if (V.lleva === 'dia_mas') return { tipo: 'casi_un_dia', plantilla: `{dia} tienes casi un día entero por Roma antes de irte.` }
  return { tipo: 'ultima_manana', plantilla: `{dia} tienes una última mañana por Roma antes de irte ${adonde}.` }
}
