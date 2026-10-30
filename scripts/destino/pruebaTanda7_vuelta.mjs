// Prueba de la Tanda 7, parte del MOTOR DEL DÍA DE VUELTA (PARA_CODE_TANDA7_v3.md, puntos 9, 10-vuelta, 12-vuelta, 19 y «Hay que comprobar», la parte de vuelta):
//   node scripts/destino/pruebaTanda7_vuelta.mjs [rapida=1] [ver=25]
//
//   1. LA TABLA, MINUTO A MINUTO: para cada medio y punto (y sin punto), las 1.440 horas del día caen cada una en su fila (ninguna hora sin fila), con la fila de la tabla del documento
//      (escrita aquí, aparte, desde el documento: no del motor) y su margen. Las filas no retroceden con la hora.
//   2. LOS VIAJES CON VUELTA: con Fiumicino las 13 horas de las fronteras (y las de los demás puntos con sus márgenes), de 1 a 7 noches, verano e invierno, con y sin fechas:
//      cada fila lleva exactamente su lista; la última mañana nunca repite lo principal ya visto de día (se recalcula aparte); la comida del día de vuelta solo con vuelos a las 17:00 o más (Fiumicino);
//      0 nocturnas repetidas y, con una salida de madrugada, el último día de ruta con su cena y sin nocturna; los días de ruta no cambian por el día de vuelta; la tarjeta «Hoy vuelves a casa»;
//      las comprobaciones de siempre (nada cerrado, sin zigzag, por dentro una sola vez, 0 restaurantes repetidos…). Las listas que con la hora más temprana de su fila no caben salen en el informe (no son un fallo).
//   3. LAS FECHAS QUE CAMBIAN LA MAÑANA: el 25 de diciembre y el domingo de Pascua no hay Vaticano; el miércoles, ni el Vaticano ni la Cúpula (con una copia de las listas en la que esa mañana es la que toca).
//   4. LAS RESERVAS EL DÍA DE VUELTA: el Coliseo, los Museos y la Galería (el bloque entero, el resto de su día en su versión sin esa visita, nada se pierde ni se repite, también «solo el traslado» y un miércoles);
//      dos reservas grandes en el mismo medio día («coinciden» si se cruzan); una reserva pequeña (su parada a su hora, no se quita nada).
//   5. LOS AVISOS: la reserva que acaba después de salir y la excursión que vuelve después de salir (los textos del documento, con los botones); la excursión nunca se mueve; los de madrugada, con la hora de salir de esa noche.
//   6. LA RUTA A MANO Y SIN VUELOS: las horas no cambian ningún día; sin vuelos y en la gratis, los días salen IGUAL que antes de esta tanda (se compara con el motor de antes, sacado de git).
//   7. EL SERVIDOR: el día de vuelta sale por buildDayBlockV3 con su tarjeta, sin paradas es «Día de viaje».
// CAMBIOS DE LA 10S (antes -> ahora -> decision de Eric que lo justifica):
//   · «igual_que_antes» (9 viajes sin vuelos): antes se comparaba la salida sin vuelos con la del motor del 14-oct (`git show cf67f11:shared/routeEngine/listasTrip.js`, «el de antes de esta tanda»). Ahora se compara con la huella
//     guardada de la salida actual (scripts/destino/_t7v_sinvuelos_dorado.json, hecha el 30-oct-2026 con `node scripts/destino/pruebaTanda7_vuelta.mjs dorado=1`). Motivo: los dias «sin vuelos» cambiaron A PROPOSITO despues del 14-oct
//     (Tanda 11 y 11b, Eric 22 y 23-oct-2026: imprescindibles intocables, Cupula+Basilica una visita, orden de dias, Janiculo de noche, Roma 5 dias curados). Desde ahora cualquier cambio de esos 9 viajes sin vuelos vuelve a ser un fallo.
//     NO se toca nada mas de la seccion 6: «sin_vuelos» (la gratis sale como sin vuelos, sin plan.vuelta) y «ruta_a_mano» (las horas no cambian ningun dia) siguen exactamente como estaban.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { comprobarViaje } from './comprobacionesListas.mjs'
import { D, written, VIAJES_VUELTA, argsDeViajeVuelta, argsDeViaje, planViajeVuelta, planViaje } from './viajes20Lib.mjs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { datosDeVuelta, filaDeVuelta } from '../../shared/routeEngine/vueltaDia.js'
import { diaPropio as montarDiaPropio } from '../../shared/routeEngine/diaPropio.js'
import { closedOnDay, easterIso } from '../../shared/routeEngine/openingHours.js'
import { arrivalInfoFor } from '../../server/engine/writtenDays.js'
import { buildDayBlockV3 } from '../../server/engine/index.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const RAPIDA = args.rapida === '1'
const VER = Number(args.ver ?? 25)
const INFO = arrivalInfoFor('roma')
const toMin = (h) => Number(String(h).slice(0, 2)) * 60 + Number(String(h).slice(3, 5))
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const corta = (h) => `${Math.floor(toMin(h) / 60)}:${String(toMin(h) % 60).padStart(2, '0')}`
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const placeOf = (name) => D.places.find((p) => p.name === name)
const fallos = []
const porRegla = {}
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) { porRegla[regla] = (porRegla[regla] ?? 0) + 1; fallos.push({ regla, texto }) }
}
const noCabe = []
const COBERTURA = { contenido: {}, listas: {}, avisos: 0, madrugada: 0, tarjetas: 0 }
const cobertura = (plan) => { const V = plan.vuelta; COBERTURA.contenido[V.contenido] = (COBERTURA.contenido[V.contenido] ?? 0) + 1; if (V.manana) COBERTURA.listas[V.manana.lista] = (COBERTURA.listas[V.manana.lista] ?? 0) + 1; if (V.diaMas) COBERTURA.listas[`dia_mas:${V.diaMas.lista}`] = (COBERTURA.listas[`dia_mas:${V.diaMas.lista}`] ?? 0) + 1; COBERTURA.avisos += V.avisos.length; if (V.madrugada) COBERTURA.madrugada++; if (V.tarjeta) COBERTURA.tarjetas++ }
const sobreSalen = []

// ═══ La tabla del documento, escrita aparte (DIAS_ROMA_PARADAS.md, «Qué lleva el día de vuelta según la hora»): vuelo desde Fiumicino (margen 3:00) ═══
const FILAS_DOC = [
  { desde: 0, lleva: 'solo_traslado' }, // de 0:00 a 4:59: cuenta como la noche de antes
  { desde: 5 * 60, lleva: 'solo_traslado' }, // de 5:00 a 8:59
  { desde: 9 * 60, lleva: 'solo_traslado' }, // de 9:00 a 13:29
  { desde: 13 * 60 + 30, lleva: 'manana_corta' }, // de 13:30 a 14:59
  { desde: 15 * 60, lleva: 'manana_sin_comida' }, // de 15:00 a 16:59
  { desde: 17 * 60, lleva: 'manana_con_comida' }, // de 17:00 a 22:59
  { desde: 23 * 60, lleva: 'dia_mas' }, // a las 23:00 o más tarde
]
/** Los márgenes de los puntos (punto 5 del documento): salir = la hora del billete − el margen. */
const MARGEN = { fco: 180, cia: 170, termini: 45, tiburtina: 55, tibus: 55, civitavecchia: 230 }
const MEDIO_DE = { fco: 'flight', cia: 'flight', termini: 'train', tiburtina: 'train', tibus: 'bus', civitavecchia: 'ferry' }
const filaEsperada = (puntoId, horaMin) => {
  const equivalente = horaMin - MARGEN[puntoId] + 180
  let k = 0
  FILAS_DOC.forEach((f, i) => { if (equivalente >= f.desde) k = i })
  return k
}
/** La hora del billete de otro punto que cae en el mismo sitio de la tabla que una hora de Fiumicino (a las 0:00 del día como muy pronto). */
const horaEquivalente = (puntoId, horaFco) => Math.max(0, Math.min(23 * 60 + 59, horaFco - 180 + MARGEN[puntoId]))

// ═══ 1. La tabla, minuto a minuto ═══
{
  const combinaciones = [['flight', 'fco'], ['flight', 'cia'], ['flight', null], ['train', 'termini'], ['train', 'tiburtina'], ['train', null], ['bus', 'tibus'], ['bus', null], ['ferry', 'civitavecchia'], ['ferry', null]]
  const PORDEFECTO = { flight: 'fco', train: 'tiburtina', bus: 'tibus', ferry: 'civitavecchia' }
  const tabla = written.llegadas?.vuelta
  debe(Boolean(tabla), 'tabla', 'writtenDaysFor no trae `llegadas.vuelta`')
  debe((tabla?.filas ?? []).length === FILAS_DOC.length, 'tabla', `la tabla del destino tiene ${(tabla?.filas ?? []).length} filas y el documento 7`)
  for (const [modo, puntoId] of combinaciones) {
    const real = puntoId ?? PORDEFECTO[modo]
    let anterior = -1
    for (let m = 0; m < 24 * 60; m++) {
      const datos = datosDeVuelta({ hora: toHHMM(m), modo, puntoId }, INFO)
      const r = datos ? filaDeVuelta(tabla, datos.salirMin) : null
      if (!datos || !r) { debe(false, 'tabla_sin_fila', `${modo}/${puntoId ?? 'sin punto'} ${toHHMM(m)} no tiene fila`); continue }
      const esperada = filaEsperada(real, m)
      if (r.indice !== esperada || r.fila.lleva !== FILAS_DOC[esperada].lleva || datos.punto.id !== real || datos.margen !== MARGEN[real]) debe(false, 'tabla_fila', `${modo}/${puntoId ?? 'sin punto'} ${toHHMM(m)}: fila ${r.indice} (${r.fila.lleva}), punto ${datos.punto.id}, margen ${datos.margen}; debería ser la ${esperada}, ${real}, ${MARGEN[real]}`)
      else comprobaciones++
      debe(r.indice >= anterior, 'tabla_monotona', `${modo}/${puntoId ?? 'sin punto'} ${toHHMM(m)}: la fila retrocede`)
      anterior = r.indice
    }
  }
  // Las fronteras del documento con Fiumicino, una a una (las 13 horas del prompt).
  const FRONTERAS = [['00:00', 0], ['04:59', 0], ['05:00', 1], ['08:59', 1], ['09:00', 2], ['13:29', 2], ['13:30', 3], ['14:59', 3], ['15:00', 4], ['16:59', 4], ['17:00', 5], ['22:59', 5], ['23:00', 6]]
  for (const [h, k] of FRONTERAS) {
    const datos = datosDeVuelta({ hora: h, modo: 'flight', puntoId: 'fco' }, INFO)
    debe(filaDeVuelta(tabla, datos.salirMin)?.indice === k, 'frontera_fco', `Fiumicino ${h} debería caer en la fila ${k}`)
  }
}

// ═══ Utilidades de los viajes ═══
const idsDeRuta = (plan) => plan.days.filter((d) => d.curatedDay?.id).map((d) => d.curatedDay.id)
const filasParada = (dia) => (dia?.escritoRows ?? []).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour' || r.tipo === 'desayuno') && !r.llegada)
/** Lo que el viaje ya ha visto de día (también de camino), recalculado de las filas; las nocturnas no cuentan, lo cerrado tampoco. */
function vistoDeDia(plan, { conTour = false } = {}) {
  const vistos = new Set(conTour ? D.default_free_tour?.covers ?? [] : [])
  for (const dia of plan.days) for (const r of filasParada(dia)) if (r.lugar && !r.cerrado_este_dia) vistos.add(r.lugar)
  return vistos
}
const serial = (v) => JSON.stringify(v, (k, x) => (x instanceof Map ? [...x.entries()] : x instanceof Set ? [...x] : x))
const sinNoche = (plan) => serial({ ...plan, nightsByDay: undefined, vuelta: undefined, days: plan.days.map((d) => ({ ...d, escritoNights: undefined, curatedDay: { ...d.curatedDay, variantes: (d.curatedDay?.variantes ?? []).filter((v) => !String(v).startsWith('vuelta:')) } })) })
const ULTIMAS = written.llegadas.ultimas_mananas
/** La lista que esa fila pone según lo que lleva el día (Tanda 7b): la corta, la propia sin comida, la propia con comida (si la tiene) o la de siempre. */
const listaDe = (fila, lleva) => (lleva === 'manana_corta' ? fila.corta : lleva === 'manana_sin_comida' ? fila.sin_comida ?? fila.lista : fila.con_comida ?? fila.lista)
/** La última mañana que debería salir (recalculada aparte): la primera de la tabla sin lo principal visto, sin su día saltado y que no sea la del miércoles. */
function ultimaEsperada(plan, iso, conTour, copiaWritten = written) {
  const vistos = vistoDeDia(plan, { conTour })
  const wd = iso ? weekdayOf(iso) : null
  const tabla = copiaWritten.llegadas.ultimas_mananas
  for (const fila of tabla) {
    if (fila.hoja) return 'HOJA'
    if (!copiaWritten.days[fila.lista]) continue
    if ((fila.lo_principal ?? []).some((l) => vistos.has(l))) continue
    if (iso && (fila.se_salta ?? []).some((t) => (t === 'pascua' ? easterIso(Number(iso.slice(0, 4))) === iso : iso.slice(5) === t))) continue
    if (wd === 'miércoles' && copiaWritten.days[fila.corta]?.miercoles === 'siguiente') continue
    return fila.lista
  }
  return null
}
const NOMBRES_PROHIBIDOS = /taxi|terravision|trenitalia|kibag|kipoint|atral|portlink|rome airport bus|cotral|tibus/i
const horasEnTexto = (t) => [...String(t).matchAll(/\b(\d{1,2}):(\d{2})\b/g)].map((m) => `${Number(m[1])}:${m[2]}`)

/** Las comprobaciones de siempre (comprobacionesListas.mjs) puestas al día de vuelta. Solo se cuentan los fallos de ESE día: los de los días de ruta son los de sin vuelo y los miran las otras pruebas. */
function comprobarDiaDeVuelta({ plan, dia, etiqueta, entradas = {}, hasFreeTour = false, ignorar = null }) {
  const r = comprobarViaje({ D, plan: { ...plan, days: [...plan.days, dia] }, etiqueta, entradas, poolNames: [], hasFreeTour, listas: written, franjas: written.destino?.franjas, apartarPendientes: false })
  const marca = `· ${dia.hours?.dateIso ?? `día ${dia.dayNumber}`} ${dia.curatedDay.id}:`
  comprobaciones++
  for (const f of r.fallos) {
    if (!f.texto.includes(marca) || (ignorar && ignorar.test(f.regla))) continue
    debe(false, f.regla, f.texto)
  }
}

function tarjetaOk(tarjeta, V, etiqueta, { madrugada = false } = {}) {
  debe(Boolean(tarjeta), 'tarjeta', `${etiqueta}: falta la tarjeta «Hoy vuelves a casa»`)
  if (!tarjeta) return
  debe(tarjeta.titulo === 'Hoy vuelves a casa', 'tarjeta', `${etiqueta}: título «${tarjeta.titulo}»`)
  debe(tarjeta.texto.includes(corta(V.hora)), 'tarjeta', `${etiqueta}: el texto no lleva la hora del viajero (${V.hora}): ${tarjeta.texto}`)
  debe(!/\{|\}/.test(tarjeta.texto), 'tarjeta', `${etiqueta}: texto sin rellenar: ${tarjeta.texto}`)
  const horas = horasEnTexto(tarjeta.texto)
  debe(horas.every((h) => h === corta(V.hora)), 'tarjeta_hora_calculada', `${etiqueta}: la tarjeta enseña una hora que no es la del viajero (${horas.join(', ')})`)
  debe(madrugada ? /esta noche/.test(tarjeta.texto) : !/esta noche/.test(tarjeta.texto), 'tarjeta', `${etiqueta}: el texto de madrugada ${madrugada ? 'debería' : 'no debería'} decir «esta noche»`)
  debe(tarjeta.explorar?.boton === 'Explorar monumentos' && tarjeta.explorar?.cerca_de_mi === true && Boolean(tarjeta.explorar?.texto), 'tarjeta', `${etiqueta}: falta [Explorar monumentos] con «Cerca de mí»`)
  debe(tarjeta.ver_como_ir?.abre === 'ficha_de_vuelta', 'tarjeta', `${etiqueta}: falta [Ver cómo ir]`)
  debe(tarjeta.despedida === 'Esperamos que hayas disfrutado de Roma. ¡Nos vemos en tu próximo viaje!', 'tarjeta', `${etiqueta}: despedida`)
  debe(Boolean(tarjeta.desde_tu_zona?.texto) && /^Desde tu zona \(/.test(tarjeta.desde_tu_zona.texto) && !/\{|\}/.test(tarjeta.desde_tu_zona.texto), 'tarjeta_zona', `${etiqueta}: «Desde tu zona»: ${tarjeta.desde_tu_zona?.texto}`)
  const todo = JSON.stringify([tarjeta.texto, tarjeta.desde_tu_zona?.texto, tarjeta.explorar, tarjeta.despedida])
  debe(!NOMBRES_PROHIBIDOS.test(todo), 'tarjeta_empresas', `${etiqueta}: nombre de empresa o taxi en la tarjeta: ${todo.slice(0, 200)}`)
  const sumado = /(\d+)\s*(h|horas?)\b.*(\d+)\s*min/i.test(tarjeta.desde_tu_zona?.texto ?? '')
  debe(!sumado, 'tarjeta_tiempo_sumado', `${etiqueta}: parece un tiempo total sumado: ${tarjeta.desde_tu_zona?.texto}`)
}

// ═══ 2. Los viajes con vuelta ═══
const baseCache = new Map()
function baseDe(clave, argumentos) {
  if (!baseCache.has(clave)) baseCache.set(clave, planListasTrip(argumentos))
  return baseCache.get(clave)
}
const HORAS_FRONTERA = [0, 4 * 60 + 59, 5 * 60, 8 * 60 + 59, 9 * 60, 13 * 60 + 29, 13 * 60 + 30, 14 * 60 + 59, 15 * 60, 16 * 60 + 59, 17 * 60, 22 * 60 + 59, 23 * 60]
const CASOS_FECHA = [
  { nombre: 'verano', inicio: '2027-07-13', fechas: true },
  { nombre: 'invierno', inicio: '2027-01-12', fechas: true },
  { nombre: 'sin fechas, verano', inicio: null, fechas: false, mes: 6 },
  { nombre: 'sin fechas, invierno', inicio: null, fechas: false, mes: 0 },
]
const baseArgs = (dias, caso, extra = {}) => ({
  destData: D, written, totalDays: dias + 1, hasFreeTour: false, poolNames: [], experiencesPositive: [], dateRangeStartIso: caso.inicio, month: caso.fechas ? null : caso.mes, travel: argsDeViaje({ dias, inicio: '2027-07-13' }).travel,
  entradas: {}, freeTourDespues: null, mediaJornada: null, diaCuatro: null, ...extra,
})

function comprobarVuelta({ etiqueta, plan, base, dias, caso, horaMin, puntoId, hasFreeTour = false, entradas = {}, comida17 = false }) {
  const V = plan.vuelta
  debe(Boolean(V), 'sin_vuelta', `${etiqueta}: el plan no trae vuelta`)
  if (!V) return
  const k = filaEsperada(puntoId, horaMin)
  debe(V.fila.indice === k && V.lleva === FILAS_DOC[k].lleva, 'fila', `${etiqueta}: cae en la fila ${V.fila.indice} (${V.lleva}) y debería ser la ${k} (${FILAS_DOC[k].lleva})`)
  debe(V.punto.id === puntoId, 'fila', `${etiqueta}: punto ${V.punto.id}`)
  const iso = caso.fechas ? V.fecha.dateIso : null
  debe(V.fecha.dayNumber === dias + 1, 'dia_de_vuelta', `${etiqueta}: el día de vuelta es el ${V.fecha.dayNumber} y debería ser el ${dias + 1}`)
  // Los días de ruta no cambian por el día de vuelta (salvo la nocturna del último día con una salida de madrugada).
  if (V.madrugada) {
    const ultimo = plan.days.at(-1)
    const baseUltimo = base.days.at(-1)
    // (Sin la nocturna del último día, las nocturnas imprescindibles pasan a los primeros días: lo único que cambia son las nocturnas; las paradas y las comidas de todos los días son las de sin vuelo.)
    debe(serial(plan.days.map((d) => d.escritoRows)) === serial(base.days.map((d) => d.escritoRows)), 'dias_de_ruta_cambian', `${etiqueta}: las paradas de los días de ruta no son las de sin vuelo (solo puede cambiar la nocturna)`)
    debe((ultimo.escritoNights ?? []).length === 0, 'madrugada_sin_nocturna', `${etiqueta}: el último día de ruta lleva nocturna con una salida de madrugada`)
    if (!ultimo.isExcursion) {
      debe(filasDe(ultimo).some((r) => r.tipo === 'cena') === filasDe(baseUltimo).some((r) => r.tipo === 'cena'), 'madrugada_con_cena', `${etiqueta}: el último día de ruta no conserva su cena`)
    }
    debe(Boolean(V.tarjetaUltimoDia), 'tarjeta_ultimo_dia', `${etiqueta}: falta la tarjeta al final del último día de ruta`)
    tarjetaOk(V.tarjetaUltimoDia, V, `${etiqueta} (último día)`, { madrugada: true })
  } else {
    debe(serial(plan.days) === serial(base.days) && serial([...plan.nightsByDay]) === serial([...base.nightsByDay]), 'dias_de_ruta_cambian', `${etiqueta}: los días de ruta no son los de sin vuelo`)
    debe(V.tarjetaUltimoDia == null, 'tarjeta_ultimo_dia', `${etiqueta}: la tarjeta del último día solo es de madrugada`)
  }
  // Nocturnas: ninguna repetida entre todos los días de ruta.
  const noches = plan.days.flatMap((d) => (d.escritoNights ?? []).map((n) => n.name))
  debe(new Set(noches).size === noches.length, 'noche_repetida', `${etiqueta}: nocturnas repetidas (${noches.join(', ')})`)

  const lleva = V.lleva
  const dia = V.diaPlan
  const rows = dia?.escritoRows ?? []
  const conComida = rows.some((r) => r.tipo === 'comida')
  debe(rows.every((r) => r.tipo !== 'cena' && r.tipo !== 'noche') && (dia?.escritoNights ?? []).length === 0, 'vuelta_sin_cena_ni_noche', `${etiqueta}: el día de vuelta lleva cena o nocturna`)
  if (lleva === 'solo_traslado') {
    debe(!dia && V.contenido === 'sin_paradas', 'vuelta_solo_traslado', `${etiqueta}: «solo el traslado» lleva paradas (${V.contenido})`)
    if (!V.madrugada) tarjetaOk(V.tarjeta, V, etiqueta)
    else tarjetaOk(V.tarjeta, V, `${etiqueta} (día de vuelta)`)
    debe(V.maleta == null && V.ultimaTarde == null, 'maleta', `${etiqueta}: la maleta sin mañana`)
    debe(V.tardeLibre == null, 'tarde_libre', `${etiqueta}: tarde libre sin mañana`)
  } else if (lleva === 'manana_corta' || lleva === 'manana_sin_comida' || lleva === 'manana_con_comida') {
    const esperada = ultimaEsperada(plan, iso, hasFreeTour)
    if (esperada === 'HOJA') {
      debe(V.contenido === 'hoja' && V.hoja === 'Ya has visto lo mejor de Roma', 'ultima_manana', `${etiqueta}: debería ser la hoja «Ya has visto lo mejor de Roma» y sale ${V.contenido}`)
    } else {
      const elegida = V.manana?.lista
      const filaEsperada = ULTIMAS.find((u) => u.lista === esperada)
      const listaEsperada = filaEsperada ? listaDe(filaEsperada, lleva) : esperada
      debe(elegida === listaEsperada, 'ultima_manana', `${etiqueta}: la última mañana es ${elegida} y debería ser ${listaEsperada}`)
      debe(V.manana?.corta === (lleva === 'manana_corta'), 'ultima_manana', `${etiqueta}: corta=${V.manana?.corta}`)
      // Nunca repite lo principal ya visto.
      const fila = ULTIMAS.find((u) => u.lista === esperada)
      const vistos = vistoDeDia(plan, { conTour: hasFreeTour })
      debe(!(fila?.lo_principal ?? []).some((l) => vistos.has(l)), 'repite_lo_principal', `${etiqueta}: la última mañana repite lo principal ya visto`)
    }
    const hayParadas = filasParada(dia).length > 0
    if (hayParadas) {
      debe(V.maleta?.texto?.startsWith('Déjala en tu alojamiento'), 'maleta', `${etiqueta}: la mañana no lleva la maleta (${V.maleta?.texto})`)
      debe(V.ultimaTarde?.texto?.startsWith('Aprovecha la mañana sin prisas'), 'maleta', `${etiqueta}: falta el texto de la última tarde`)
      debe(!/sal a la hora que te marcamos/.test(JSON.stringify(V)), 'maleta', `${etiqueta}: «sal a la hora que te marcamos»`)
    } else debe(V.maleta == null, 'maleta', `${etiqueta}: maleta sin paradas`)
    // La comida del día de vuelta, solo con 17:00 o más (en esta fila).
    debe(conComida === (lleva === 'manana_con_comida' && hayParadas && Boolean(plan.vuelta.diaPlan)) || (conComida === false && lleva !== 'manana_con_comida'), 'comida_vuelta', `${etiqueta}: la comida del día de vuelta (${conComida}) no cuadra con su fila (${lleva})`)
    if (lleva !== 'manana_con_comida') debe(!conComida, 'comida_vuelta', `${etiqueta}: comida en una fila sin comida`)
    debe((V.tardeLibre != null) === (lleva === 'manana_con_comida'), 'tarde_libre', `${etiqueta}: «La tarde es tuya» ${V.tardeLibre ? 'sale' : 'no sale'} en la fila ${lleva}`)
    if (V.tardeLibre) debe(V.tardeLibre.texto === 'La tarde es tuya hasta que te vayas.' && V.tardeLibre.anadirLugares === true, 'tarde_libre', `${etiqueta}: texto de la tarde libre`)
    if (V.contenido === 'hoja') debe(!hayParadas, 'hoja', `${etiqueta}: la hoja y paradas a la vez`)
    // Las comprobaciones de siempre, también para el día de vuelta.
    if (dia) comprobarDiaDeVuelta({ plan, dia, etiqueta, entradas, hasFreeTour, ignorar: caso.fechas ? null : /^cerrado$/ })
    // ¿Cabe con la hora más temprana de su fila? (Solo en la hora de la frontera de abajo de la fila; no es un fallo: va al informe.)
    const delPrimero = [13 * 60 + 30, 15 * 60, 17 * 60].includes(horaMin) && puntoId === 'fco'
    if (delPrimero && dia && hayParadas) {
      const salir = V.interno.salirMin
      const fin = Math.max(...rows.filter((r) => r.tipo === 'parada' || r.tipo === 'comida' || r.tipo === 'tour' || r.tipo === 'desayuno').map((r) => r.t1))
      if (fin > salir) noCabe.push({ etiqueta, lista: V.listaId, fila: lleva, hora: toHHMM(horaMin), fin: toHHMM(fin), salir: toHHMM(salir), pasa: fin - salir, sobra: (dia.spareRows ?? []).map((s) => s.lugar), ultimos: rows.filter((r) => r.t1 > salir && r.tipo !== 'traslado').map((r) => `${r.titulo ?? r.lugar ?? r.restaurante} (${r.min} min)`) })
    }
    if ((dia?.spareRows ?? []).length > 0) sobreSalen.push({ lista: V.listaId, fila: lleva, sobra: dia.spareRows.map((s) => s.lugar) })
  } else if (lleva === 'dia_mas') {
    debe(V.contenido === 'dia_mas' || V.contenido === 'manana' || V.contenido === 'hoja', 'dia_mas', `${etiqueta}: «un día más» sale como ${V.contenido}`)
    if (V.contenido === 'dia_mas') {
      const orden = idsDeRuta(plan)
      debe(!orden.includes(V.diaMas.lista), 'dia_mas', `${etiqueta}: el día más (${V.diaMas.lista}) ya está en el viaje (${orden.join(', ')})`)
      debe(conComida, 'dia_mas', `${etiqueta}: el día más sin comida`)
      debe(V.diaMas.origen === 'siguiente_que_no_lleva', 'dia_mas', `${etiqueta}: origen ${V.diaMas.origen}`)
    } else if (V.contenido === 'manana') {
      debe(V.tardeLibre != null, 'dia_mas', `${etiqueta}: sin día que ponerle, la mañana con comida y la tarde libre`)
    }
    if (dia) comprobarDiaDeVuelta({ plan, dia, etiqueta, entradas, hasFreeTour, ignorar: caso.fechas ? null : /^cerrado$/ })
  }
  // Ningún texto con empresas, taxi ni horas calculadas.
  const textos = [V.tarjeta?.texto, V.tarjeta?.desde_tu_zona?.texto, V.maleta?.texto, V.ultimaTarde?.texto, V.tardeLibre?.texto, V.resumen?.plantilla, ...V.avisos.map((a) => a.texto)].filter(Boolean).join(' | ')
  debe(!NOMBRES_PROHIBIDOS.test(textos), 'empresas', `${etiqueta}: empresa o taxi en un texto: ${textos.slice(0, 200)}`)
  const ajenas = horasEnTexto(textos).filter((h) => h !== corta(toHHMM(horaMin)) && !V.avisos.some((a) => a.texto.includes(h)))
  debe(ajenas.length === 0, 'hora_calculada', `${etiqueta}: hora que no es del viajero ni de los datos: ${ajenas.join(', ')}`)
  debe(!JSON.stringify({ ...V, interno: undefined, diaPlan: undefined }).match(/"(salirMin|margenMin|equivalenteMin)"/), 'hora_calculada', `${etiqueta}: lo interno sale a la vista`)
  // El resumen.
  const esperadoResumen = V.madrugada || V.contenido === 'sin_paradas' ? ['madrugada', 'solo_traslado'] : lleva === 'dia_mas' && V.contenido === 'dia_mas' ? ['casi_un_dia'] : ['ultima_manana', 'casi_un_dia']
  debe(esperadoResumen.includes(V.resumen?.tipo) || V.contenido === 'hoja', 'resumen', `${etiqueta}: resumen ${V.resumen?.tipo} (${V.contenido})`)
}
const filasDe = (dia) => dia?.escritoRows ?? []

{
  const puntos = ['fco', 'cia', 'termini', 'tiburtina', 'tibus', 'civitavecchia']
  const horasPorPunto = (puntoId) => (puntoId === 'fco' ? HORAS_FRONTERA : [...new Set(HORAS_FRONTERA.map((h) => horaEquivalente(puntoId, h)))])
  let planes = 0
  for (const caso of CASOS_FECHA) {
    for (const dias of [1, 2, 3, 4, 5, 6, 7]) {
      const baseA = baseArgs(dias, caso)
      const base = baseDe(`${dias}|${caso.nombre}`, baseA)
      if (!base) { debe(false, 'sin_plan', `${caso.nombre} ${dias} días: el motor no da plan`); continue }
      for (const puntoId of puntos) {
        // Fiumicino con todas las horas y todas las duraciones; los demás puntos con sus horas equivalentes en 3 y 5 días (suficiente: la hora solo elige la fila).
        if (puntoId !== 'fco' && !(dias === 3 || dias === 5) ) continue
        if (RAPIDA && puntoId !== 'fco') continue
        for (const horaMin of horasPorPunto(puntoId)) {
          const plan = planListasTrip({ ...baseA, vuelta: { hora: toHHMM(horaMin), modo: MEDIO_DE[puntoId], puntoId, zona: 'centro', info: INFO } })
          planes++
          cobertura(plan)
          comprobarVuelta({ etiqueta: `${caso.nombre} · ${dias} días · ${puntoId} ${toHHMM(horaMin)}`, plan, base, dias, caso, horaMin, puntoId })
        }
      }
    }
  }
  console.log(`2. Viajes con vuelta: ${planes} planes · cobertura ${JSON.stringify(COBERTURA)}`)
}

// Con Free Tour de mañana y de noche, y los 10 viajes con vuelta de la revisión.
for (const v of VIAJES_VUELTA) {
  const noche = v.ft === '19:00' || v.ft === '21:00'
  const hasFreeTour = Boolean(v.ft) && !noche
  const plan = planViajeVuelta(v)
  const base = planViaje(v)
  const caso = { fechas: true }
  comprobarVuelta({ etiqueta: `Viaje con vuelta ${v.n} (${v.fila})`, plan, base, dias: v.dias, caso, horaMin: toMin(v.vuelo), puntoId: 'fco', hasFreeTour, entradas: argsDeViaje(v).entradas })
}

// ═══ 3. Las fechas que cambian la mañana (una copia de las listas en la que la primera mañana es la que sale si nadie la salta) ═══
{
  const copia = JSON.parse(JSON.stringify(written))
  copia.llegadas.ultimas_mananas[0].lo_principal = ['Lugar que nadie ha visto']
  copia.llegadas.ultimas_mananas[4].lo_principal = ['Otro lugar que nadie ha visto']
  const casos = [
    { nombre: '25 de diciembre', inicio: '2026-12-22', quitar: ['D0-medio'], pone: [] },
    { nombre: 'domingo de Pascua', inicio: '2027-03-25', quitar: ['D0-medio'], pone: [] },
    { nombre: 'un miércoles', inicio: '2027-05-02', quitar: ['D0-medio', 'D6'], pone: [] },
    { nombre: 'un jueves cualquiera', inicio: '2027-05-06', quitar: [], pone: ['D0-medio'] },
    { nombre: 'un sábado cualquiera', inicio: '2027-05-08', quitar: [], pone: ['D0-medio'] },
  ]
  for (const c of casos) {
    for (const [hora, llevaHora] of [['13:30', 'manana_corta'], ['15:00', 'manana_sin_comida'], ['17:00', 'manana_con_comida']]) {
      const plan = planListasTrip({ ...baseArgs(3, { inicio: c.inicio, fechas: true }), written: copia, vuelta: { hora, modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
      const sale = plan.vuelta.manana?.lista
      const vaticano = listaDe(ULTIMAS.find((u) => u.lista === 'D0-medio'), llevaHora)
      for (const id of c.quitar) debe(sale !== id && ![llevaHora].some((l) => sale === listaDe(ULTIMAS.find((u) => u.lista === id), l)), 'fecha_salta', `${c.nombre} ${hora}: sale ${sale} y esa mañana se salta`)
      for (const id of c.pone) debe(sale === listaDe(ULTIMAS.find((u) => u.lista === id), llevaHora), 'fecha_no_salta', `${c.nombre} ${hora}: debería salir el Vaticano (${vaticano}) y sale ${sale}`)
      debe(Boolean(plan.vuelta.manana?.saltadas) || c.quitar.length === 0, 'fecha_salta', `${c.nombre} ${hora}: la mañana saltada no queda apuntada`)
    }
  }
  // Sin fechas no se puede saber el día de la semana ni la fecha: no se salta nada.
  const plan = planListasTrip({ ...baseArgs(3, { inicio: null, fechas: false, mes: 6 }), written: copia, vuelta: { hora: '15:00', modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
  debe(plan.vuelta.manana?.lista === listaDe(ULTIMAS.find((u) => u.lista === 'D0-medio'), 'manana_sin_comida'), 'fecha_no_salta', `sin fechas sale ${plan.vuelta.manana?.lista}`)
}

// ═══ 4. Las reservas grandes el día de vuelta ═══
const BLOQUES = {
  Coliseo: { nombre: 'Coliseo', paradas: ['Coliseo', 'Arco de Constantino', 'Foro Romano y Palatino'], dueño: ['D1', 'D1-FT'], horas: ['09:30', '13:30'] },
  'Museos Vaticanos y Capilla Sixtina': { nombre: 'Museos Vaticanos y Capilla Sixtina', paradas: ['Museos Vaticanos y Capilla Sixtina', 'Plaza de San Pedro', 'Basílica de San Pedro'], dueño: ['D2', 'D3'], horas: ['09:00', '12:00'] },
  'Galería Borghese': { nombre: 'Galería Borghese', paradas: ['Galería Borghese', 'Parque de Villa Borghese'], dueño: ['D4'], horas: ['09:00', '14:00'] },
}
function reservaVuelta(plan0, dias, inicio, sitio, hora) {
  const dateIso = new Date(Date.parse(`${inicio}T12:00:00Z`) + dias * 86400000).toISOString().slice(0, 10)
  return { name: sitio, dateIso, dayNumber: dias + 1, time: hora }
}
{
  // 2027-05-02 (domingo) + 3 = miércoles 5; 2027-04-30 (viernes) + 3 = lunes 3 (la Galería cierra); 2027-05-07 (viernes) + 3 = lunes 10; 2027-05-05 + 3 = sábado 8.
  const inicios = [['2027-05-05', 'sábado'], ['2027-05-02', 'miércoles'], ['2027-05-04', 'jueves']]
  for (const [inicio, nombreDia] of inicios) {
    for (const sitio of Object.keys(BLOQUES)) {
      const B = BLOQUES[sitio]
      for (const hora of B.horas) {
        for (const vuelo of ['10:00', '13:30', '15:00', '17:00', '23:30']) {
          const dias = 3
          const reserva = reservaVuelta(null, dias, inicio, sitio, hora)
          const caso = { inicio, fechas: true }
          const plan = planListasTrip({ ...baseArgs(dias, caso), reservasGrandes: [reserva], vuelta: { hora: vuelo, modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
          const sinBloque = planListasTrip({ ...baseArgs(dias, caso), vuelta: { hora: vuelo, modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
          const etiqueta = `${sitio.split(' ')[0]} ${hora} el día de vuelta (${nombreDia}), vuelo ${vuelo}`
          const V = plan.vuelta
          debe(V?.contenido === 'bloques' && V.bloques.length === 1 && V.bloques[0].sitio === sitio, 'bloque', `${etiqueta}: contenido ${V?.contenido}`)
          const dia = V?.diaPlan
          const rows = filasDe(dia)
          const paradas = rows.filter((r) => r.tipo === 'parada' && !r.llegada)
          // El bloque entero, cada parada una vez, y la reserva a su hora.
          const lugares = [...new Set(paradas.map((r) => r.lugar))]
          const enSobra = (dia?.spareRows ?? []).map((s) => s.lugar)
          for (const parada of B.paradas) debe(lugares.includes(parada) || enSobra.includes(parada) || plan.days.some((d) => B.dueño.includes(d.curatedDay?.id) && filasParada(d).some((r) => r.lugar === parada)), 'bloque_entero', `${etiqueta}: falta «${parada}» del bloque (ni en el día de vuelta ni en el día del sitio)`)
          const reservada = paradas.find((r) => r.lugar === sitio && r.hora_tipo === 'reserva')
          debe(reservada?.hora_fija === hora, 'reserva_hora', `${etiqueta}: la reserva sale a las ${reservada?.hora_fija}`)
          debe(rows.filter((r) => r.hora_tipo === 'reserva' && !r.llegada && r.lugar === sitio).length === 1, 'reserva_una_vez', `${etiqueta}: la reserva no sale una sola vez`)
          debe(!(V?.fila.lleva === 'solo_traslado' && !dia), 'bloque_con_solo_traslado', `${etiqueta}: la fila «solo el traslado» no tiene mañana con una reserva`)
          // El día que lo llevaba se queda sin esas paradas (nada se repite) y lo demás sigue en su día.
          for (const d of plan.days) {
            if (!B.dueño.includes(d.curatedDay?.id)) continue
            const delDia = filasParada(d).map((r) => r.lugar)
            // (La visita reservada nunca sigue en su día; lo demás del bloque o está en un sitio o en el otro: nada se repite. Si el día del sitio se quedaría con una mañana vacía, se queda con lo suyo.)
            debe(!delDia.includes(sitio), 'bloque_repetido', `${etiqueta}: «${sitio}» sigue en ${d.curatedDay.id} y está reservado el día de vuelta`)
            for (const parada of B.paradas) debe(!(delDia.includes(parada) && lugares.includes(parada) && parada !== sitio), 'bloque_repetido', `${etiqueta}: «${parada}» sale en ${d.curatedDay.id} y también en el bloque`)
            debe(filasParada(d).length > 0 && d.escritoRows.some((r) => r.franja === 'manana' && r.tipo === 'parada'), 'dia_del_sitio_vacio', `${etiqueta}: ${d.curatedDay.id} se queda sin mañana`)
            // Nada se pierde: lo que ese día llevaba sin reserva y no es del bloque, sigue (salvo lo que la versión sin esa visita cambia por la que escribe el documento).
            const antes = sinBloque.days.find((x) => x.curatedDay?.id === d.curatedDay.id)
            debe(Boolean(antes), 'bloque_dia', `${etiqueta}: el día ${d.curatedDay.id} no está en el viaje sin reserva`)
          }
          // Todo el viaje: ninguna parada del bloque repetida entre días (por dentro) y nada de lo reservado desaparece.
          const dentroTodo = []
          for (const d of [...plan.days, dia].filter(Boolean)) for (const r of filasParada(d)) if (r.modo === 'dentro' && B.paradas.includes(r.lugar)) dentroTodo.push(r.lugar)
          debe(new Set(dentroTodo).size === dentroTodo.length, 'bloque_repetido', `${etiqueta}: una parada del bloque va dos veces por dentro (${dentroTodo.join(', ')})`)
          // Comida: solo en las filas con comida; el miércoles, la Plaza y la Basílica nunca antes de comer (los Museos).
          const conComida = rows.some((r) => r.tipo === 'comida')
          const comidaPermitida = V?.fila.lleva === 'manana_con_comida' || V?.fila.lleva === 'dia_mas'
          debe(!conComida || comidaPermitida, 'comida_vuelta', `${etiqueta}: comida en una fila sin comida`)
          if (sitio.startsWith('Museos') && nombreDia === 'miércoles') {
            const iComida = rows.findIndex((r) => r.tipo === 'comida')
            for (const nombre of ['Plaza de San Pedro', 'Basílica de San Pedro']) {
              const i = rows.findIndex((r) => r.lugar === nombre && !r.llegada && r.tipo === 'parada')
              if (i >= 0) debe(iComida >= 0 && i > iComida, 'miercoles_antes_de_comer', `${etiqueta}: «${nombre}» va antes de comer un miércoles`)
              else debe(enSobra.includes(nombre) || plan.days.some((d) => B.dueño.includes(d.curatedDay?.id) && filasParada(d).some((r) => r.lugar === nombre)), 'miercoles_antes_de_comer', `${etiqueta}: «${nombre}» no está ni después de comer ni en «Si te sobra tiempo» ni en el día del Vaticano`)
            }
          }
          // Avisos: la reserva que acaba después de salir.
          const salirMin = toMin(vuelo) - 180
          const termina = toMin(hora) + (placeOf(sitio)?.duration_minutes ?? 60)
          const hayAviso = V?.avisos.some((a) => a.tipo === 'reserva_despues_de_salir')
          debe(hayAviso === (termina > salirMin), 'aviso_despues_de_salir', `${etiqueta}: aviso=${hayAviso} y la reserva acaba ${toHHMM(termina)} (salir ${toHHMM(Math.max(0, salirMin))})`)
          // Las comprobaciones de siempre
          // (Una reserva grande el día de vuelta va con su bloque entero, sin mirar si cabe; los avisos de hora de la comida no valen aquí.)
          if (dia) comprobarDiaDeVuelta({ plan, dia, etiqueta, entradas: {}, hasFreeTour: false, ignorar: /comida|cerrado_a_la_llegada/ })
          // La reserva no cambia los días de ruta que no son del sitio.
          for (const d of plan.days) {
            if (B.dueño.includes(d.curatedDay?.id)) continue
            const antes = sinBloque.days.find((x) => x.dayNumber === d.dayNumber)
            debe(serial(antes?.escritoRows) === serial(d.escritoRows), 'dias_de_ruta_cambian', `${etiqueta}: el día ${d.dayNumber} (${d.curatedDay?.id}) cambia por una reserva del día de vuelta`)
          }
        }
      }
    }
  }
}

// Dos reservas grandes el mismo medio día: cada bloque a su hora; «coinciden» solo si se cruzan.
{
  const inicio = '2027-05-05'
  const dias = 3
  const caso = { inicio, fechas: true }
  const dosSeCruzan = [reservaVuelta(null, dias, inicio, 'Coliseo', '09:00'), reservaVuelta(null, dias, inicio, 'Museos Vaticanos y Capilla Sixtina', '10:00')]
  const dosSeparadas = [reservaVuelta(null, dias, inicio, 'Coliseo', '09:00'), reservaVuelta(null, dias, inicio, 'Galería Borghese', '15:00')]
  for (const [nombre, grandes, cruzan] of [['se cruzan', dosSeCruzan, true], ['no se cruzan', dosSeparadas, false]]) {
    const plan = planListasTrip({ ...baseArgs(dias, caso), reservasGrandes: grandes, vuelta: { hora: '23:30', modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
    const V = plan.vuelta
    const etiqueta = `Dos reservas grandes que ${nombre}`
    debe(V.bloques.length === 2, 'dos_bloques', `${etiqueta}: ${V.bloques.length} bloques`)
    const rows = filasDe(V.diaPlan)
    for (const g of grandes) {
      const r = rows.find((x) => x.lugar === g.name && x.hora_tipo === 'reserva' && !x.llegada)
      debe(r?.hora_fija === g.time, 'reserva_hora', `${etiqueta}: ${g.name} a las ${r?.hora_fija} y debería ser a las ${g.time}`)
    }
    debe(V.avisos.some((a) => a.tipo === 'coinciden') === cruzan, 'coinciden', `${etiqueta}: aviso «coinciden» ${V.avisos.some((a) => a.tipo === 'coinciden') ? 'sale' : 'no sale'}`)
  }
}

// Una reserva pequeña el día de vuelta: su parada a su hora, dentro de la mañana; no se quita nada.
{
  const inicio = '2027-05-05'
  const dias = 3
  const caso = { inicio, fechas: true }
  for (const vuelo of ['10:00', '13:30', '15:00', '17:00']) {
    const reserva = { name: 'Panteón', dateIso: '2027-05-08', dayNumber: 4, time: '09:30' }
    const plan = planListasTrip({ ...baseArgs(dias, caso), reservasViaje: [reserva], vuelta: { hora: vuelo, modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
    const sin = planListasTrip({ ...baseArgs(dias, caso), vuelta: { hora: vuelo, modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
    const etiqueta = `Reserva pequeña (Panteón 9:30) el día de vuelta, vuelo ${vuelo}`
    const V = plan.vuelta
    const rows = filasDe(V.diaPlan)
    const r = rows.filter((x) => x.lugar === 'Panteón' && x.hora_tipo === 'reserva' && !x.llegada)
    debe(r.length === 1 && r[0].hora_fija === '09:30', 'reserva_pequena', `${etiqueta}: sale ${r.length} veces, a las ${r[0]?.hora_fija}`)
    debe(V.fila.lleva !== 'solo_traslado' ? true : V.contenido === 'solo_reservas', 'reserva_pequena', `${etiqueta}: contenido ${V.contenido}`)
    // No se quita nada: lo que la mañana llevaba sin la reserva sigue (en la mañana o en «Si te sobra tiempo»).
    const antes = [...filasParada(sin.vuelta.diaPlan).map((x) => x.lugar), ...(sin.vuelta.diaPlan?.spareRows ?? []).map((x) => x.lugar)]
    const despues = new Set([...filasParada(V.diaPlan).map((x) => x.lugar), ...(V.diaPlan?.spareRows ?? []).map((x) => x.lugar)])
    for (const lugar of antes) debe(despues.has(lugar), 'reserva_pequena_quita', `${etiqueta}: «${lugar}» desaparece`)
    debe(serial(plan.days) === serial(sin.days), 'dias_de_ruta_cambian', `${etiqueta}: los días de ruta cambian`)
    debe(V.reservasPequenas.length === 1, 'reserva_pequena', `${etiqueta}: la salida no la apunta`)
    // Después de salir: aviso.
    const avisoEsperado = toMin('09:30') + (placeOf('Panteón')?.duration_minutes ?? 60) > toMin(vuelo) - 180
    debe(V.avisos.some((a) => a.tipo === 'reserva_despues_de_salir') === avisoEsperado, 'aviso_despues_de_salir', `${etiqueta}: aviso ${V.avisos.some((a) => a.tipo === 'reserva_despues_de_salir')}`)
  }
}

// Casos sueltos: sin el día del sitio en el viaje, el Free Tour reservado ese día, el día que se cayó al llegar, y el coche (sin hora no hay vuelta).
{
  const dias2 = 2
  const inicio = '2027-05-05'
  const caso = { inicio, fechas: true }
  const vuelta = (extra = {}) => ({ hora: '23:30', modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO, ...extra })
  // La Galería con 2 días (el viaje no lleva el D4): va su bloque entero, la Galería y el parque.
  {
    const plan = planListasTrip({ ...baseArgs(dias2, caso), reservasGrandes: [reservaVuelta(null, dias2, inicio, 'Galería Borghese', '09:00')], vuelta: vuelta({ hora: '15:00' }) })
    const lugares = filasParada(plan.vuelta.diaPlan).map((r) => r.lugar)
    debe(lugares.includes('Galería Borghese') && lugares.includes('Parque de Villa Borghese'), 'bloque_sin_dia_del_sitio', `Galería con 2 días: el bloque lleva ${lugares.join(', ')}`)
    debe(plan.vuelta.contenido === 'bloques', 'bloque_sin_dia_del_sitio', `Galería con 2 días: contenido ${plan.vuelta.contenido}`)
  }
  // El Free Tour reservado el día de vuelta es una reserva más: su parada a su hora.
  {
    const plan = planListasTrip({ ...baseArgs(dias2, caso), hasFreeTour: false, reservasGrandes: [{ name: 'Free Tour por Roma', dateIso: '2027-05-07', dayNumber: 3, time: '10:00' }], vuelta: vuelta({ hora: '17:00' }) })
    const tour = filasDe(plan.vuelta.diaPlan).filter((r) => r.hora_fija === '10:00' && !r.llegada)
    debe(tour.length === 1, 'free_tour_vuelta', `Free Tour reservado el día de vuelta: sale ${tour.length} veces a las 10:00`)
  }
  // El día que se cayó al llegar vuelve como «un día más» con un vuelo de las 23:00 o más tarde; si ya está en el viaje no se usa.
  {
    const plan = planListasTrip({ ...baseArgs(dias2, caso), vuelta: vuelta({ diaCaidoAlLlegar: 'D5' }) })
    debe(plan.vuelta.diaMas?.lista === 'D5' && plan.vuelta.diaMas.origen === 'cayo_al_llegar', 'dia_caido', `diaCaidoAlLlegar D5 con 2 días: sale ${JSON.stringify(plan.vuelta.diaMas)}`)
    const ya = planListasTrip({ ...baseArgs(dias2, caso), vuelta: vuelta({ diaCaidoAlLlegar: 'D1' }) })
    debe(ya.vuelta.diaMas?.origen === 'siguiente_que_no_lleva', 'dia_caido', `diaCaidoAlLlegar D1 (que el viaje ya lleva): sale ${JSON.stringify(ya.vuelta.diaMas)}`)
    const noche = (plan.vuelta.diaPlan?.escritoRows ?? []).filter((r) => r.tipo === 'cena' || r.tipo === 'noche')
    debe(noche.length === 0 && (plan.vuelta.diaPlan?.escritoNights ?? []).length === 0, 'dia_caido', 'el día más lleva cena o nocturna')
  }
  // Sin punto (un viaje viejo): el del traslado más largo de ese medio. Y la zona: «Desde tu zona» con lo suyo (Trastevere desde Fiumicino no lleva el Leonardo Express; «Aún no lo sé», la mejor opción desde Termini).
  for (const [modo, esperado] of [['flight', 'fco'], ['train', 'tiburtina'], ['bus', 'tibus'], ['ferry', 'civitavecchia']]) {
    const plan = planListasTrip({ ...baseArgs(dias2, caso), vuelta: vuelta({ modo, puntoId: null, hora: '10:00' }) })
    debe(plan.vuelta.punto.id === esperado && plan.vuelta.punto.porDefecto === true, 'sin_punto', `${modo} sin punto: sale ${plan.vuelta.punto.id}`)
    debe(plan.vuelta.fila.lleva === 'solo_traslado' || plan.vuelta.fila.lleva === 'manana_corta', 'sin_punto', `${modo} sin punto a las 10:00: ${plan.vuelta.fila.lleva}`)
  }
  {
    const trastevere = planListasTrip({ ...baseArgs(dias2, caso), vuelta: vuelta({ hora: '11:00', zona: 'trastevere' }) }).vuelta.tarjeta
    debe(/FL1/.test(trastevere?.desde_tu_zona?.texto ?? '') && !/Leonardo/.test(trastevere?.desde_tu_zona?.texto ?? ''), 'zona', `Trastevere desde Fiumicino: «${trastevere?.desde_tu_zona?.texto}»`)
    const nose = planListasTrip({ ...baseArgs(dias2, caso), vuelta: vuelta({ hora: '11:00', zona: 'nose' }) }).vuelta.tarjeta
    debe(nose?.desde_tu_zona?.sin_zona === true && /Termini/.test(nose.desde_tu_zona.texto) && /^Desde tu zona \(Termini\)/.test(nose.desde_tu_zona.texto), 'zona', `Aún no lo sé: «${nose?.desde_tu_zona?.texto}»`)
    const tarde = planListasTrip({ ...baseArgs(dias2, caso), vuelta: vuelta({ hora: '06:00', zona: 'centro' }) }).vuelta.tarjeta
    debe(Boolean(tarde?.desde_tu_zona?.aviso) || /Leonardo/.test(tarde?.desde_tu_zona?.texto ?? ''), 'zona', `Vuelo de primera hora: ${JSON.stringify(tarde?.desde_tu_zona?.texto)}`)
    const sinZona = planListasTrip({ ...baseArgs(dias2, caso), vuelta: vuelta({ hora: '11:00', zona: null }) }).vuelta.tarjeta
    debe(sinZona?.desde_tu_zona?.sin_zona === true, 'zona', 'sin zona: la tarjeta usa la mejor opción desde Termini')
  }
  // En coche no se pide hora: nada.
  {
    const plan = planListasTrip({ ...baseArgs(dias2, caso), vuelta: vuelta({ modo: 'own_vehicle' }) })
    debe(plan.vuelta === undefined, 'coche', 'en coche sale una vuelta con hora')
  }
}

// ═══ 5. Los avisos ═══
{
  const inicio = '2027-05-05'
  const dias = 3
  const caso = { inicio, fechas: true }
  const vuelta = (extra = {}) => ({ hora: '17:00', modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO, ...extra })
  // El del documento, palabra por palabra.
  {
    const plan = planListasTrip({ ...baseArgs(dias, caso), reservasGrandes: [reservaVuelta(null, dias, inicio, 'Museos Vaticanos y Capilla Sixtina', '15:00')], vuelta: vuelta() })
    const a = plan.vuelta.avisos.find((x) => x.tipo === 'reserva_despues_de_salir')
    debe(a?.texto === 'Tu entrada a los Museos Vaticanos es a las 15:00 y tu vuelo sale a las 17:00: no te da tiempo. Revisa tu reserva.', 'aviso_texto', `Museos: «${a?.texto}»`)
    debe(a?.botones?.[0]?.texto === 'Ver mi reserva' && a?.donde === 'campana', 'aviso_texto', 'Museos: botón o campana')
    const c = planListasTrip({ ...baseArgs(dias, caso), reservasGrandes: [reservaVuelta(null, dias, inicio, 'Coliseo', '15:00')], vuelta: vuelta() }).vuelta.avisos.find((x) => x.tipo === 'reserva_despues_de_salir')
    debe(c?.texto === 'Tu entrada al Coliseo es a las 15:00 y tu vuelo sale a las 17:00: no te da tiempo. Revisa tu reserva.', 'aviso_texto', `Coliseo: «${c?.texto}»`)
    const t = planListasTrip({ ...baseArgs(dias, caso), reservasGrandes: [reservaVuelta(null, dias, inicio, 'Coliseo', '15:00')], vuelta: vuelta({ modo: 'train', puntoId: 'termini', hora: '16:00' }) }).vuelta.avisos.find((x) => x.tipo === 'reserva_despues_de_salir')
    debe(t?.texto === 'Tu entrada al Coliseo es a las 15:00 y tu tren sale a las 16:00: no te da tiempo. Revisa tu reserva.', 'aviso_texto', `tren: «${t?.texto}»`)
    const b = planListasTrip({ ...baseArgs(dias, caso), reservasGrandes: [reservaVuelta(null, dias, inicio, 'Coliseo', '15:00')], vuelta: vuelta({ modo: 'ferry', puntoId: 'civitavecchia', hora: '19:00' }) }).vuelta.avisos.find((x) => x.tipo === 'reserva_despues_de_salir')
    debe(b?.texto === 'Tu entrada al Coliseo es a las 15:00 y tu barco sale a las 19:00: no te da tiempo. Revisa tu reserva.', 'aviso_texto', `barco: «${b?.texto}»`)
  }
  // La excursión reservada el día de vuelta que vuelve después de salir.
  {
    const iso = '2027-05-08'
    const exc = { nombre: 'Pompeya', vuelve: '20:00', medioDia: false, dateIso: iso, dayNumber: 4 }
    const baseSin = planListasTrip({ ...baseArgs(dias, caso), vuelta: vuelta() })
    const plan = planListasTrip({ ...baseArgs(dias, caso), vuelta: vuelta({ excursion: exc }) })
    const a = plan.vuelta.avisos.find((x) => x.tipo === 'excursion_vuelve_tarde')
    debe(a?.texto === 'Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma a las 20:00: no te da tiempo. Revisa tu reserva de la excursión.', 'aviso_excursion', `texto: «${a?.texto}»`)
    debe(JSON.stringify(a?.botones.map((b) => b.texto)) === JSON.stringify(['Ver mi reserva', 'Pasar este día a Roma']), 'aviso_excursion', 'botones de la excursión')
    debe(serial(plan.days) === serial(baseSin.days), 'excursion_se_mueve', 'una excursión reservada cambia algún día de ruta (no se cambia nada solo)')
    // El día de vuelta es el de la excursión: no se le pone una mañana encima ni la tarjeta de «solo el traslado».
    debe(plan.vuelta.contenido === 'excursion' && !plan.vuelta.diaPlan && plan.vuelta.tarjeta == null && plan.vuelta.excursion?.enVuelta === true, 'excursion_se_mueve', `con la excursión reservada el día de vuelta sale ${plan.vuelta.contenido}`)
    const sinHora = planListasTrip({ ...baseArgs(dias, caso), vuelta: vuelta({ excursion: { ...exc, vuelve: null } }) }).vuelta.avisos.find((x) => x.tipo === 'excursion_vuelve_tarde')
    debe(sinHora?.texto === 'Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma: no te da tiempo. Revisa tu reserva de la excursión.', 'aviso_excursion', `sin hora de vuelta: «${sinHora?.texto}»`)
    // Una de medio día (vuelve a las 14:00): sin aviso si la hora de salir es a las 15:00 o más tarde.
    for (const [vuelo, hayAviso] of [['18:00', false], ['17:30', false], ['17:00', false], ['16:59', true], ['15:00', true]]) {
      const medio = planListasTrip({ ...baseArgs(dias, caso), vuelta: vuelta({ hora: vuelo, excursion: { nombre: 'Ostia', vuelve: '14:00', medioDia: true, dateIso: iso, dayNumber: 4 } }) }).vuelta.avisos.some((x) => x.tipo === 'excursion_vuelve_tarde')
      debe(medio === hayAviso, 'aviso_excursion_medio_dia', `Ostia (vuelve a las 14:00) con el vuelo de las ${vuelo}: aviso=${medio}, debería ser ${hayAviso}`)
    }
    // En otro día que no es el de vuelta: ningún aviso.
    const otro = planListasTrip({ ...baseArgs(dias, caso), vuelta: vuelta({ excursion: { ...exc, dateIso: '2027-05-06', dayNumber: 2 } }) }).vuelta.avisos.some((x) => x.tipo === 'excursion_vuelve_tarde')
    debe(!otro, 'aviso_excursion', 'aviso de excursión en un día que no es el de vuelta')
  }
  // Los de madrugada se comparan con la hora de salir de esa noche (el último día de ruta).
  {
    const ultimoIso = '2027-05-07'
    for (const [vuelve, hay] of [['20:00', false], ['22:00', false], ['23:30', true]]) {
      const plan = planListasTrip({ ...baseArgs(dias, caso), vuelta: vuelta({ hora: '02:00', excursion: { nombre: 'Tívoli', vuelve, medioDia: false, dateIso: ultimoIso, dayNumber: 3 } }) })
      debe(plan.vuelta.avisos.some((x) => x.tipo === 'excursion_vuelve_tarde') === hay, 'aviso_madrugada', `Vuelo a las 2:00 (salir a las 23:00 de esa noche) y excursión que vuelve a las ${vuelve}: aviso=${plan.vuelta.avisos.some((x) => x.tipo === 'excursion_vuelve_tarde')}`)
    }
    // Una reserva el último día de ruta que acaba después de salir esa noche.
    const tarde = planListasTrip({ ...baseArgs(dias, caso), reservasViaje: [{ name: 'Panteón', dateIso: ultimoIso, dayNumber: 3, time: '22:45' }], vuelta: vuelta({ hora: '02:00' }) })
    debe(tarde.vuelta.avisos.some((x) => x.tipo === 'reserva_despues_de_salir' && x.dayNumber === 3), 'aviso_madrugada', 'una reserva del último día que acaba después de salir esa noche no avisa')
    const bien = planListasTrip({ ...baseArgs(dias, caso), reservasViaje: [{ name: 'Panteón', dateIso: ultimoIso, dayNumber: 3, time: '17:00' }], vuelta: vuelta({ hora: '02:00' }) })
    debe(!bien.vuelta.avisos.some((x) => x.tipo === 'reserva_despues_de_salir'), 'aviso_madrugada', 'aviso de una reserva que acaba antes de salir')
  }
}

// ═══ 6. La ruta a mano y sin vuelos ═══
{
  const RUTA_DORADO = fileURLToPath(new URL('./_t7v_sinvuelos_dorado.json', import.meta.url))
  const dorado = existsSync(RUTA_DORADO) ? JSON.parse(readFileSync(RUTA_DORADO, 'utf8')) : {}
  const nuevoDorado = {}
  const huella = (v) => createHash('sha1').update(serial(v)).digest('hex')
  const casos = [
    [1, '2027-07-13', null], [2, '2027-01-12', null], [3, '2027-05-05', null], [3, '2027-03-25', null], [4, '2026-12-22', null], [5, '2027-08-14', null], [6, '2027-10-25', null], [7, '2027-06-01', null], [3, '2027-03-09', 'ft'],
  ]
  for (const [dias, inicio, ft] of casos) {
    const v = { n: 'x', dias, inicio, ft: ft === 'ft' ? '10:00' : undefined }
    const a = argsDeViaje(v)
    const sinVuelos = planListasTrip(a)
    const gratis = planListasTrip({ ...a, vuelta: { hora: '17:00', modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO, pago: false } })
    const aMano = planListasTrip({ ...a, vuelta: { hora: '03:00', modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO, aMano: true } })
    const etiqueta = `${dias} días ${inicio}${ft ? ' con Free Tour' : ''}`
    debe(sinVuelos.vuelta === undefined && gratis.vuelta === undefined, 'sin_vuelos', `${etiqueta}: aparece plan.vuelta sin vuelos o en la gratis`)
    debe(serial(sinVuelos) === serial(gratis), 'sin_vuelos', `${etiqueta}: la gratis (pago:false) cambia algún día`)
    for (const h of ['03:00', '17:00']) {
      const mano = planListasTrip({ ...a, vuelta: { hora: h, modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO, aMano: true } })
      debe(serial({ ...mano, vuelta: undefined }) === serial(sinVuelos), 'ruta_a_mano', `${etiqueta}: con la ruta a mano (${h}) algún día cambia`)
      debe(mano.vuelta?.aMano === true && mano.vuelta.activo === false && !mano.vuelta.diaPlan && !mano.vuelta.tarjeta, 'ruta_a_mano', `${etiqueta}: la ruta a mano rehace el día de vuelta`)
    }
    nuevoDorado[etiqueta] = huella(sinVuelos)
    if (args.dorado !== '1') debe(dorado[etiqueta] !== undefined && dorado[etiqueta] === nuevoDorado[etiqueta], 'igual_que_antes', `${etiqueta}: sin vuelos, los días no salen igual que la huella guardada el 30-oct-2026 (scripts/destino/_t7v_sinvuelos_dorado.json)`)
  }
  // La ruta a mano sigue dando los avisos de reservas contra el vuelo.
  {
    const a = argsDeViaje({ n: 'x', dias: 3, inicio: '2027-05-05' })
    const mano = planListasTrip({ ...a, reservasGrandes: [reservaVuelta(null, 3, '2027-05-05', 'Coliseo', '15:00')], vuelta: { hora: '17:00', modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO, aMano: true } })
    debe(mano.vuelta.avisos.some((x) => x.tipo === 'reserva_despues_de_salir'), 'ruta_a_mano', 'la ruta a mano no avisa de una reserva después de salir')
    debe(serial({ ...mano, vuelta: undefined }) === serial(planListasTrip({ ...a, reservasGrandes: [reservaVuelta(null, 3, '2027-05-05', 'Coliseo', '15:00')] })), 'ruta_a_mano', 'la ruta a mano con una reserva el día de vuelta cambia los días de ruta')
  }
  // Un viaje de una sola fecha (sin día de vuelta aparte): las horas no recortan nada.
  {
    const a = { ...argsDeViaje({ n: 'x', dias: 1, inicio: '2027-05-05' }), totalDays: 1 }
    const plan = planListasTrip({ ...a, vuelta: { hora: '10:00', modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
    debe(plan.vuelta === undefined && serial(plan) === serial(planListasTrip(a)), 'una_fecha', 'un viaje de una fecha cambia con la vuelta')
  }
  if (args.dorado === '1') {
    writeFileSync(RUTA_DORADO, JSON.stringify(nuevoDorado, null, 1))
    console.log(`(huella de ${Object.keys(nuevoDorado).length} viajes sin vuelos guardada en ${RUTA_DORADO})`)
  }
}

// ═══ 7. El servidor: el día de vuelta por buildDayBlockV3 ═══
{
  const base = { city: 'Roma', scheduler: 'v3', engine: 'v4' }
  const pide = (dias, inicio, vuelta, extra = {}) => buildDayBlockV3(D, dias + 1, false, dias + 1, null, inicio, [], [], { ...base, vuelta, ...extra })
  const solo = await pide(3, '2027-05-05', { hora: '10:00', modo: 'flight', puntoId: 'fco', zona: 'centro' })
  debe(solo?.is_return_leg === true && solo.title === 'Día de viaje' && (solo.stops ?? []).length === 0, 'servidor', `sin paradas: ${solo?.title}, ${solo?.stops?.length} paradas`)
  debe(solo?.return_day?.tarjeta?.titulo === 'Hoy vuelves a casa' && solo.return_day.interno === undefined, 'servidor', 'sin paradas: falta la tarjeta o enseña lo interno')
  const manana = await pide(3, '2027-05-05', { hora: '17:00', modo: 'flight', puntoId: 'fco', zona: 'centro' })
  debe(manana?.is_return_leg === true && (manana.stops ?? []).length > 0 && manana.return_day?.maleta?.texto?.startsWith('Déjala en tu alojamiento'), 'servidor', `con mañana: ${manana?.stops?.length} paradas`)
  debe(manana?.return_day?.tardeLibre?.texto === 'La tarde es tuya hasta que te vayas.', 'servidor', 'con mañana: falta la tarde libre')
  const sinVuelta = await pide(3, '2027-05-05', null)
  debe(sinVuelta == null, 'servidor', 'sin vuelta, el día de vuelta sigue sin pedirse al motor (null)')
  const dia1 = await buildDayBlockV3(D, 4, false, 1, null, '2027-05-05', [], [], { ...base, vuelta: { hora: '17:00', modo: 'flight', puntoId: 'fco', zona: 'centro' } })
  const dia1Sin = await buildDayBlockV3(D, 4, false, 1, null, '2027-05-05', [], [], { ...base })
  debe(JSON.stringify(dia1) === JSON.stringify(dia1Sin), 'servidor', 'el día 1 cambia por la vuelta')
}

// ═══ 8. Cada lista cabe con la hora más temprana de su fila (cada una de las 5 mañanas y las 5 cortas, forzada a salir la primera) ═══
const TABLA_CABE = []
{
  // (Una copia de las listas en la que la mañana a probar es la primera y nadie la ha visto: sale siempre.)
  for (const [fecha, nombre] of [['2027-07-15', 'jueves de verano'], ['2027-07-18', 'domingo de verano'], ['2027-07-19', 'lunes de verano'], ['2027-01-14', 'jueves de invierno']]) {
    const [y, m, d] = fecha.split('-').map(Number)
    // (Un viaje de un solo día que es «un día propio» con un sitio que no es de nadie: no se ha visto nada, así que la mañana a probar sale tal cual está escrita, con todo por dentro.)
    const inicio = new Date(Date.UTC(y, m - 1, d - 1, 12)).toISOString().slice(0, 10)
    const propio = { dayNumber: 1, ...montarDiaPropio({ destData: D, written, placeNames: ['Via Veneto'], insideMinutes: written.destino?.minutos_por_dentro ?? {}, id: 'DX', name: 'Neutro' }) }
    for (const [i, fila] of ULTIMAS.entries()) {
      if (fila.hoja) continue
      const copia = JSON.parse(JSON.stringify(written))
      copia.llegadas.ultimas_mananas = [{ ...fila, lo_principal: ['Nadie lo ha visto'], se_salta: [] }, ULTIMAS.at(-1)]
      copia.days[fila.corta] = { ...copia.days[fila.corta], miercoles: undefined }
      for (const [hora, lleva] of [['13:30', 'manana_corta'], ['15:00', 'manana_sin_comida'], ['17:00', 'manana_con_comida']]) {
        const plan = planListasTrip({ ...baseArgs(1, { inicio, fechas: true }), diaCuatro: 'roma', diaPropio: propio, written: copia, vuelta: { hora, modo: 'flight', puntoId: 'fco', zona: 'centro', info: INFO } })
        const V = plan.vuelta
        const etiqueta = `${fila.lista} ${lleva} ${nombre}`
        debe(V.lleva === lleva && V.manana?.lista === listaDe(fila, lleva), 'lista_forzada', `${etiqueta}: sale ${V.manana?.lista}`)
        const rows = V.diaPlan?.escritoRows ?? []
        const fin = Math.max(0, ...rows.filter((r) => r.tipo !== 'noche').map((r) => r.t1))
        const salir = V.interno.salirMin
        comprobarDiaDeVuelta({ plan, dia: V.diaPlan, etiqueta, hasFreeTour: false, ignorar: /dentro_dos_veces/ })
        TABLA_CABE.push({ lista: V.manana?.lista, lleva, fecha: nombre, fin, salir, pasa: Math.max(0, fin - salir), ultimos: rows.filter((r) => r.t1 > salir && r.tipo !== 'traslado').map((r) => `${r.titulo ?? r.lugar ?? r.restaurante} ${r.min} min`), sobra: (V.diaPlan?.spareRows ?? []).map((s) => s.lugar), paradas: rows.filter((r) => r.tipo === 'parada').length })
      }
    }
  }
}

// ═══ Informe ═══
const resumen = Object.entries(porRegla).map(([r, n]) => `${r}: ${n}`).join(' · ')
if (noCabe.length > 0) {
  console.log('\nListas que NO caben con la hora más temprana de su fila (no es un fallo: va a PREGUNTAS):')
  const vistas = new Set()
  for (const n of noCabe) {
    const clave = `${n.lista}|${n.fila}`
    if (vistas.has(clave)) continue
    vistas.add(clave)
    console.log(`  - ${n.lista} (${n.fila}, vuelo ${n.hora}): acaba a las ${n.fin} y hay que salir a las ${n.salir} (se pasa ${n.pasa} min). Lo último: ${n.ultimos.join(' · ')}. En «Si te sobra tiempo»: ${n.sobra.join(', ') || 'nada'}  [${n.etiqueta}]`)
  }
}
{
  console.log('\n8. Cada lista con la hora más temprana de su fila (acaba / hay que salir; en el peor día de la prueba):')
  const porLista = new Map()
  for (const t of TABLA_CABE) {
    const clave = `${t.lista}|${t.lleva}`
    if (!porLista.has(clave) || porLista.get(clave).pasa < t.pasa) porLista.set(clave, t)
  }
  for (const t of porLista.values()) console.log(`  ${t.pasa > 0 ? 'NO CABE' : 'cabe   '} ${t.lista} (${t.lleva}): acaba a las ${toHHMM(t.fin)}, salir a las ${toHHMM(t.salir)}${t.pasa > 0 ? ` (se pasa ${t.pasa} min; lo último: ${t.ultimos.join(' · ')})` : ''}${t.sobra.length ? ` · «Si te sobra tiempo»: ${t.sobra.join(', ')}` : ''} [${t.fecha}]`)
}
const listasEnSobra = new Map()
for (const s of sobreSalen) listasEnSobra.set(`${s.lista}|${s.fila}`, s)
if (listasEnSobra.size > 0) {
  console.log('\nLo que cada lista manda a «Si te sobra tiempo» en el día de vuelta:')
  for (const s of listasEnSobra.values()) console.log(`  - ${s.lista} (${s.fila}): ${s.sobra.join(', ')}`)
}
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos${resumen ? ` (${resumen})` : ''}`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto.replace(/\d+/g, '#').slice(0, 90)}`
  if (vistos.has(clave) && vistos.size > VER) continue
  vistos.add(clave)
  if (vistos.size <= VER) console.log(`  [${f.regla}] ${f.texto}`)
}
process.exitCode = fallos.length === 0 ? 0 : 1
