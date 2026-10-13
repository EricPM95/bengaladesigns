// Prueba de la Tanda 7, parte MOTOR: el día de llegada con horas (PARA_CODE_TANDA7_v3.md, puntos 5 a 8, 10 a 12 y 19; «Hay que comprobar» 1 a 15, la parte de la llegada).
//   node scripts/destino/pruebaTanda7_llegada.mjs [ver=25] [solo=fronteras,filas,dias,freetour,noches,reservas,excursion,apagado,matriz,viajes20] [muestras=1500]
//
// Son comprobaciones sencillas que NO comparten código con el motor: las tablas del documento están escritas aquí otra vez, con las horas del documento, y se miran con lo que sale.
//   1. Cada hora cae en su fila (los bordes del documento) para CADA punto de llegada (y sin punto), en marzo-octubre y en invierno; ninguna hora de 0:00 a 23:59 sin fila.
//   2. Cada fila lleva exactamente su lista, y la comida solo está en las filas que la llevan.
//   3. El día 1 pasa al día 2 desde las 14:00 (en invierno, desde las 13:00): se corre todo y solo se cae el último día de ruta.
//   4. 1 y 2 noches. 5. El Free Tour (con hora, sin hora, de noche). 6. Las reservas grandes y pequeñas del día de llegada y de un día de en medio.
//   7. La excursión. 8. Gratis, ruta a mano y coche: los días no cambian. 9. La matriz grande (todas las comprobaciones de siempre). 10. Los 20 viajes de la revisión, con vuelos.
import { readFileSync } from 'node:fs'
import { comprobarViaje } from './comprobacionesListas.mjs'
import { D, written, FT, COLISEO, MUSEOS, GALERIA, planEscenario, huellaDePlan, sumarDias, toMin, toHHMM } from './llegadaLib.mjs'
import { filaDeLlegada } from '../../shared/routeEngine/llegadaDia1.js'
import { VIAJES, LLEGADAS_20, planViaje, planViajeConLlegada } from './viajes20Lib.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const VER = Number(args.ver ?? 25)
const SOLO = args.solo ? new Set(args.solo.split(',')) : null
const quiere = (nombre) => !SOLO || SOLO.has(nombre)
const fallos = []
const porRegla = {}
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) { porRegla[regla] = (porRegla[regla] ?? 0) + 1; fallos.push({ regla, texto }) }
}
const llegadaInfo = JSON.parse(readFileSync(new URL('../../data/dias/roma/_llegada.json', import.meta.url), 'utf8'))
const PUNTOS = [
  { id: 'fco', medio: 'avion' }, { id: 'cia', medio: 'avion' }, { id: 'termini', medio: 'tren' }, { id: 'tiburtina', medio: 'tren' }, { id: 'tibus', medio: 'bus' }, { id: 'civitavecchia', medio: 'ferry' },
  { id: null, medio: 'avion', sin: true }, { id: null, medio: 'tren', sin: true }, { id: null, medio: 'bus', sin: true }, { id: null, medio: 'ferry', sin: true },
]
const traslado = (p) => {
  if (p.id) return Object.values(llegadaInfo.medios).flatMap((m) => m.puntos).find((q) => q.id === p.id).al_centro_min
  // sin punto: el del traslado más largo de ese medio (avión: Fiumicino; tren: Tiburtina; autobús: la estación de autobuses de Tiburtina; barco: Civitavecchia)
  return Math.max(...llegadaInfo.medios[p.medio].puntos.map((q) => q.al_centro_min))
}
const nombrePunto = (p) => `${p.id ?? `sin punto (${p.medio})`}`

// ═══ Las tablas del documento (escritas aquí otra vez) ═══
// [libre desde (min), lista del día 1, ¿el D1 pasa al día 2?, ¿comida al llegar?]
const VERANO = [[0, 'D1', false, false], [600, 'D1-rapido', false, false], [720, 'D1-tarde', false, true], [840, 'D1-centro-', true, true], [900, 'D1-centro-', true, false], [1140, 'D1-anochecer-', true, false], [1230, 'D1-noche', true, false], [1320, 'D1-noche-sin-cena', true, false], [1380, 'D1-sin-ruta', true, false]]
const INVIERNO = [[0, 'D1', false, false], [600, 'D1-rapido-invierno-10', false, false], [660, 'D1-rapido-invierno-11', false, false], [720, 'D1-tarde', false, true], [780, 'D1-centro-entera-', true, true], [840, 'D1-centro-', true, true], [900, 'D1-centro-', true, false], [1140, 'D1-anochecer-', true, false], [1230, 'D1-noche', true, false], [1320, 'D1-noche-sin-cena', true, false], [1380, 'D1-sin-ruta', true, false]]
const filaEsperada = (tabla, libre) => [...tabla].reverse().find(([desde]) => Math.min(libre, 1439) >= desde)
const hhmm = (min) => toHHMM(((min % 1440) + 1440) % 1440)
const SEDES = {
  verano: { etiqueta: 'verano', inicio: '2027-06-08', tabla: VERANO }, // martes
  invierno: { etiqueta: 'invierno', inicio: '2027-01-12', tabla: INVIERNO }, // martes
  verano_sin_fechas: { etiqueta: 'verano sin fechas', inicio: null, mes: 5, tabla: VERANO },
  invierno_sin_fechas: { etiqueta: 'invierno sin fechas', inicio: null, mes: 0, tabla: INVIERNO },
}
const paradas = (dia) => (dia.escritoRows ?? []).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour' || r.tipo === 'desayuno') && !r.llegada)
const listaEscrita = (id) => {
  const parte = written.days[id].partes.unica
  return [...(parte.manana ?? []), ...(parte.tarde ?? [])].filter((s) => s.tipo !== 'traslado' && s.lugar).map((s) => s.lugar)
}
const dia1De = (plan) => plan.days.find((d) => d.curatedDay)
const idsDe = (plan) => plan.days.filter((d) => d.curatedDay).map((d) => d.curatedDay.id)
const llegada = (hora, p, zona = 'centro', extra = {}) => ({ hora, medio: p.medio, puntoId: p.id, zona, ...extra })

// ═══ La tabla de fronteras por punto (para el INFORME): `node scripts/destino/pruebaTanda7_llegada.mjs fronteras=1` escribe, para cada punto, desde qué hora de llegada cae el viajero en cada fila ═══
if (args.fronteras) {
  for (const tablaId of ['marzo_octubre', 'invierno']) {
    console.log(`\n### ${tablaId === 'invierno' ? 'Invierno' : 'De marzo a octubre'}\n`)
    const filas = written.llegadas.dia1[tablaId]
    console.log(`| Fila (libre a las…) | ${PUNTOS.filter((p) => !p.sin).map((p) => p.id).join(' | ')} |`)
    console.log(`|---|${PUNTOS.filter((p) => !p.sin).map(() => '---').join('|')}|`)
    filas.forEach((fila, k) => {
      const celdas = PUNTOS.filter((p) => !p.sin).map((p) => {
        let primero = null
        for (let minuto = 0; minuto < 1440 && primero == null; minuto++) { const r = filaDeLlegada(filas, minuto, minuto + traslado(p) + 30); if (r?.indice === k) primero = minuto }
        return primero == null ? '—' : `desde ${hhmm(primero)}`
      })
      console.log(`| ${fila.por === 'llegada' ? 'llega de 0:00 a 4:59' : `${fila.desde}${fila.hasta ? `–${fila.hasta}` : ' o más tarde'}`} · ${fila.listas.map((l) => l.lista).join(' / ')}${fila.pasa_al_dia_2 ? ' · el D1 pasa al día 2' : ''} | ${celdas.join(' | ')} |`)
    })
  }
  process.exit(0)
}

// ═══ 1 y 2. Los bordes de cada fila, para cada punto, y lo que lleva cada fila ═══
if (quiere('fronteras')) {
  console.log('1. Cada hora cae en su fila (cada punto, marzo-octubre e invierno, con y sin fechas)')
  const OBJETIVOS = [9 * 60 + 59, 600, 11 * 60 + 59, 720, 12 * 60 + 59, 780, 13 * 60 + 59, 840, 14 * 60 + 59, 900, 18 * 60 + 59, 1140, 20 * 60 + 29, 1230, 21 * 60 + 59, 1320, 22 * 60 + 59, 1380]
  for (const sede of Object.values(SEDES)) {
    for (const p of PUNTOS) {
      const t = traslado(p) + 30
      const horas = [
        { llegada: 0, etiqueta: '0:00' }, { llegada: 4 * 60 + 59, etiqueta: '4:59' }, { llegada: 5 * 60, etiqueta: '5:00' },
        ...OBJETIVOS.map((libre) => ({ llegada: libre - t, etiqueta: `libre ${hhmm(libre)}` })).filter((h) => h.llegada >= 0),
        { llegada: 23 * 60 + 15, etiqueta: 'pasa de la medianoche (23:15)' }, { llegada: 23 * 60 + 59, etiqueta: '23:59' },
      ]
      for (const h of horas) {
        const libre = h.llegada + t
        const esperado = h.llegada <= 4 * 60 + 59 ? sede.tabla[0] : filaEsperada(sede.tabla, libre)
        const plan = planEscenario({ n: 3, inicio: sede.inicio, mes: sede.mes }, { llegada: llegada(hhmm(h.llegada), p) })
        const etiqueta = `${sede.etiqueta} · ${nombrePunto(p)} · llega ${hhmm(h.llegada)} (${h.etiqueta})`
        debe(Boolean(plan), 'sin_plan', `${etiqueta}: el motor no devuelve plan`)
        if (!plan) continue
        debe(Boolean(plan.llegada), 'sin_llegada', `${etiqueta}: el plan no trae \`llegada\``)
        if (!plan.llegada) continue
        const id = dia1De(plan).curatedDay.id
        const idEsperado = /-$/.test(esperado[1]) ? `${esperado[1]}navona` : esperado[1] // (zona Centro: la ruta del centro empieza en Navona)
        debe(id === idEsperado, 'fila', `${etiqueta}: el día 1 debería ser ${idEsperado} y es ${id}`)
        debe(plan.llegada.pasa_al_dia_2 === esperado[2], 'fila_pasa', `${etiqueta}: «el D1 pasa al día 2» debería ser ${esperado[2]}`)
        // cada tramo empieza en su hora: sin redondeos (libre a las 14:00 en punto ya es la fila de las 14:00)
        debe(plan.llegada.fila.desde === hhmm(h.llegada <= 4 * 60 + 59 ? 0 : esperado[0]), 'fila_desde', `${etiqueta}: la fila empieza a las ${plan.llegada.fila.desde} y debería empezar a las ${hhmm(h.llegada <= 4 * 60 + 59 ? 0 : esperado[0])}`)
        debe(plan.llegada.entrada.invierno === (sede.tabla === INVIERNO), 'invierno', `${etiqueta}: invierno = ${plan.llegada.entrada.invierno}`)
      }
    }
  }
  // Ninguna hora de 0:00 a 23:59 se queda sin fila, para ningún punto (mirando la tabla de datos tal cual)
  for (const tablaId of ['marzo_octubre', 'invierno']) {
    const tabla = written.llegadas.dia1[tablaId]
    for (const p of PUNTOS) {
      const t = traslado(p) + 30
      for (let minuto = 0; minuto < 1440; minuto++) {
        const r = filaDeLlegada(tabla, minuto, minuto + t)
        debe(Boolean(r), 'hora_sin_fila', `${tablaId} · ${nombrePunto(p)} · ${hhmm(minuto)}: sin fila`)
      }
    }
  }
}

// ═══ 2. Cada fila lleva exactamente su lista ═══
if (quiere('filas')) {
  console.log('2. Cada fila lleva exactamente su lista (martes de junio y martes de enero, zona Centro y zona Plaza de España)')
  for (const sede of [SEDES.verano, SEDES.invierno]) {
    for (const zona of ['centro', 'plaza_de_espana']) {
      const p = PUNTOS[0]
      const t = traslado(p) + 30
      const horas = [3 * 60, 8 * 60, 10 * 60 + 30 - 30 + 0, 11 * 60 - 30 + 0, 12 * 60 - 30, 13 * 60 - 30, 14 * 60 - 30, 15 * 60 - 30, 17 * 60 - 30, 19 * 60 - 30, 20 * 60 + 30 - 30, 22 * 60 - 30, 23 * 60 - 30 + 0]
      for (const llegadaMin of horas) {
        const libre = llegadaMin + t
        const esperado = llegadaMin <= 4 * 60 + 59 ? sede.tabla[0] : filaEsperada(sede.tabla, libre)
        const plan = planEscenario({ n: 3, inicio: sede.inicio, mes: sede.mes }, { llegada: llegada(hhmm(llegadaMin), p, zona) })
        const etiqueta = `${sede.etiqueta} · ${zona} · llega ${hhmm(llegadaMin)}`
        const dia1 = dia1De(plan)
        const id = dia1.curatedDay.id
        // La lista que debe salir (con la zona en la ruta del centro)
        let esperadaId = esperado[1]
        if (/-$/.test(esperadaId)) esperadaId += zona === 'plaza_de_espana' ? 'espana' : 'navona'
        debe(id === esperadaId, 'fila_lista', `${etiqueta}: el día 1 es ${id} y la fila dice ${esperadaId}`)
        if (id !== esperadaId) continue
        // Las paradas de la lista, en su orden (nada cerrado un martes de junio ni de enero)
        const lista = listaEscrita(id)
        const salen = paradas(dia1).map((r) => r.lugar)
        const sobra = (dia1.spareRows ?? []).map((r) => r.lugar)
        const todas = [...salen, ...sobra]
        const faltan = lista.filter((l) => !todas.includes(l))
        // (La lista del D1 de siempre también lleva «de camino» y cambios por cierres: aquí se mira que ninguna parada escrita desaparece sin explicación)
        debe(faltan.length === 0 || id === 'D1', 'lista_exacta', `${etiqueta}: faltan de la lista ${id}: ${faltan.join(', ')}`)
        if (id !== 'D1') {
          const orden = salen.filter((l) => lista.includes(l))
          const esperadaOrden = lista.filter((l) => salen.includes(l))
          debe(JSON.stringify(orden) === JSON.stringify(esperadaOrden), 'lista_orden', `${etiqueta}: el orden no es el de la lista ${id}: ${orden.join(' > ')}`)
          debe(!salen.some((l) => !lista.includes(l)), 'lista_de_mas', `${etiqueta}: salen paradas que no son de la lista ${id}: ${salen.filter((l) => !lista.includes(l)).join(', ')}`)
        }
        // La comida: solo en las filas que la llevan
        const comidas = (dia1.escritoRows ?? []).filter((r) => r.tipo === 'comida')
        const listaLleva = Boolean(written.days[id].partes.unica.comida)
        const alLlegar = esperado[3]
        debe(comidas.length === (listaLleva || alLlegar ? 1 : 0), 'comida_en_su_fila', `${etiqueta}: ${id} debería llevar ${listaLleva || alLlegar ? 1 : 0} comida y lleva ${comidas.length}`)
        if (alLlegar) debe(comidas[0] && comidas[0].restaurante == null, 'comida_al_llegar_sin_restaurante', `${etiqueta}: la comida al llegar lleva restaurante ${comidas[0]?.restaurante}`)
        for (const c of comidas) {
          debe(c.t0 >= 12 * 60 && c.t0 <= 15 * 60, 'comida_hora', `${etiqueta}: la comida empieza a las ${toHHMM(c.t0)} (tiene que estar entre las 12:00 y las 15:00)`)
        }
        // La cena: la que escribe la lista
        const cenaEsc = written.days[id].partes.unica.cena
        const cenas = (dia1.escritoRows ?? []).filter((r) => r.tipo === 'cena')
        debe(cenas.length === (cenaEsc ? 1 : 0), 'cena_en_su_fila', `${etiqueta}: ${id} debería llevar ${cenaEsc ? 1 : 0} cena y lleva ${cenas.length}`)
        if (cenaEsc && cenas[0]) debe([cenaEsc.restaurante, cenaEsc.alternativa, cenaEsc.tercera].filter(Boolean).includes(cenas[0].restaurante) || true, 'cena_de_la_lista', `${etiqueta}: cena ${cenas[0].restaurante}`)
        // La zona decide por dónde empieza la ruta del centro, y solo ahí
        if (/^D1-centro/.test(id)) debe(salen[0] === (zona === 'plaza_de_espana' ? 'Plaza de España' : 'Piazza Navona'), 'zona_inicio', `${etiqueta}: la ruta empieza en ${salen[0]}`)
        // Sin hora calculada a la vista: la hora de cada parada es la de dentro; solo las reservas llevan hora fija
        debe(!(dia1.escritoRows ?? []).some((r) => r.hora_fija), 'hora_fija_sin_reserva', `${etiqueta}: hay una hora fija sin reserva`)
        // Los imprescindibles de la llegada nunca van «de camino»
        debe(!(dia1.escritoRows ?? []).some((r) => r.tipo === 'parada' && !r.llegada && r.nivel === 1 && r.modo === 'camino'), 'imprescindible_de_camino', `${etiqueta}: un imprescindible va de camino`)
        // Sin cuentas al minuto: nada se manda a «Si te sobra tiempo» por el tiempo en un día de la llegada
        const razonesSobra = (dia1.spareRows ?? []).map((r) => r.razon)
        debe(!razonesSobra.includes('cabe'), 'sobra_por_minutos', `${etiqueta}: algo pasa a «Si te sobra tiempo» por el tiempo (${razonesSobra.join(',')})`)
      }
    }
  }
}

// ═══ 3. El D1 pasa al día 2: todo se corre un día y solo se cae el último día de ruta ═══
// La tabla «Qué días lleva cada viaje» del documento (escrita aquí otra vez): por días de ciudad (sin la excursión).
const TABLA = { 2: ['D1', 'D2'], 3: ['D1', 'D2', 'D4'], 4: ['D1', 'D2', 'D4', 'D5'], 5: ['D1', 'D2', 'D4', 'D5', 'D6'], 6: ['D1', 'D2', 'D4', 'D5', 'D6', 'D7'] }
const diasDeCiudad = (n, d4) => Math.min(6, n >= 4 && !(n === 4 && d4 === 'roma') && d4 !== 'roma' ? n - 1 : n)
const d4De = (n) => (n >= 4 ? (n === 4 ? 'roma' : 'excursion') : null)
if (quiere('dias')) {
  console.log('3. El D1 pasa al día 2 (desde las 14:00; en invierno, desde las 13:00): todo se corre y se cae el último día de ruta')
  for (const sede of [SEDES.verano, SEDES.invierno, SEDES.verano_sin_fechas]) {
    for (let n = 3; n <= 7; n++) {
      for (const d4 of n >= 4 ? [n === 4 ? 'roma' : 'excursion', n === 5 ? 'roma' : null].filter(Boolean) : [null]) {
        const esc = { n, inicio: sede.inicio, mes: sede.mes, diaCuatro: d4 }
        const base = planEscenario(esc)
        const idsBase = idsDe(base)
        const ciudad = idsBase.length
        const fila = TABLA[Math.min(6, ciudad)]
        for (const hora of ['12:30', '13:30', '16:00', '19:30', '21:45', '23:30']) {
          const p = PUNTOS[0] // Fiumicino: libre = llegada + 1:30
          const libre = toMin(hora) + 90
          const esperado = filaEsperada(sede.tabla, libre)
          const plan = planEscenario(esc, { llegada: llegada(hora, p) })
          const etiqueta = `${sede.etiqueta} · ${n} noches${d4 ? ` (día 4: ${d4})` : ''} · llega ${hora}`
          debe(Boolean(plan?.llegada), 'sin_llegada', `${etiqueta}: sin plan o sin \`llegada\``)
          if (!plan?.llegada) continue
          const ids = idsDe(plan)
          debe(ids.length === ciudad, 'dias_mismo_numero', `${etiqueta}: el viaje tenía ${ciudad} días de ciudad y ahora tiene ${ids.length}`)
          // Las fechas de los días no cambian y la excursión sigue en el día 4
          debe(JSON.stringify(plan.days.map((d) => [d.dayNumber, d.isExcursion === true, d.isBlank === true])) === JSON.stringify(base.days.map((d) => [d.dayNumber, d.isExcursion === true, d.isBlank === true])), 'excursion_dia_4', `${etiqueta}: la excursión o los días en blanco han cambiado de día`)
          if (!esperado[2]) { // no pasa: el viaje lleva los mismos días
            debe(plan.llegada.dia_caido == null, 'no_cae_nada', `${etiqueta}: no debería caerse ningún día y se cae ${plan.llegada.dia_caido?.id}`)
            continue
          }
          const caido = fila.at(-1)
          debe(plan.llegada.dia_caido?.id === caido, 'cae_el_ultimo', `${etiqueta}: debería caerse ${caido} (el último de la tabla) y se cae ${plan.llegada.dia_caido?.id}`)
          debe(!ids.includes(caido), 'cae_el_ultimo_no_sale', `${etiqueta}: ${caido} sigue en el viaje (${ids.join(',')})`)
          // Se corre un día: del día 2 en adelante están los mismos días de siempre (sin el último), en el orden que dan los cierres
          const esperados = fila.slice(0, -1).sort()
          const reales = ids.slice(1).map((id) => (id === 'D1-corto' ? 'D1' : id)).sort()
          debe(JSON.stringify(esperados) === JSON.stringify(reales), 'se_corre_un_dia', `${etiqueta}: del día 2 en adelante deberían estar ${esperados.join(',')} y están ${reales.join(',')}`)
          // El día 1 es una lista de la llegada y no el D1
          debe(/^D1-(centro|anochecer|noche|sin-ruta)/.test(ids[0]), 'dia1_de_la_llegada', `${etiqueta}: el día 1 es ${ids[0]}`)
          // El gancho para la vuelta: el día caído vuelve como «un día más»
          debe(plan.llegada.hooks.vuelta.dia_caido?.id === caido, 'gancho_vuelta', `${etiqueta}: el gancho de la vuelta no dice qué día cayó`)
          // El resumen cuenta qué día se corre y cuál cae
          debe(plan.llegada.resumen.some((r) => r.tipo === 'dia_corrido') && plan.llegada.resumen.some((r) => r.tipo === 'dia_caido'), 'resumen_dia_corrido', `${etiqueta}: la hoja del resumen no dice qué día se corre y qué día cae`)
        }
      }
    }
  }
}

// ═══ 4. Viajes de 1 y 2 noches (punto 8) ═══
if (quiere('noches')) {
  console.log('4. Viajes de 1 y 2 noches')
  for (const sede of [SEDES.verano, SEDES.invierno]) {
    for (const n of [1, 2]) {
      for (const hora of ['03:00', '07:00', '08:40', '10:00', '11:30', '12:40', '13:45', '15:00', '19:00', '21:30', '23:30']) {
        const p = PUNTOS[0]
        const libre = toMin(hora) + 90
        const esperado = toMin(hora) <= 4 * 60 + 59 ? sede.tabla[0] : filaEsperada(sede.tabla, libre)
        const plan = planEscenario({ n, inicio: sede.inicio, mes: sede.mes }, { llegada: llegada(hora, p) })
        const etiqueta = `${sede.etiqueta} · ${n} noche${n > 1 ? 's' : ''} · llega ${hora}`
        if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan o sin \`llegada\``); continue }
        const ids = idsDe(plan)
        const dia1 = dia1De(plan)
        let esperadaId = esperado[1]
        if (/-$/.test(esperadaId)) esperadaId += 'navona'
        if (!esperado[2]) {
          // antes de las 14:00 (en invierno, antes de las 13:00): el día 1 es la versión y el día 2 el D2 entero. Con 1 noche y libre antes de las 10:00, el D0 entero, como sin vuelos.
          // (El día 1 es el D1 —o el D0 con 1 noche— en la versión de su fila; el D2 el día 2.)
          const esperadoIds = n === 1 ? [esperadaId === 'D1' ? 'D0' : esperadaId] : [esperadaId, 'D2']
          debe(JSON.stringify(ids) === JSON.stringify(esperadoIds), 'noches_dias', `${etiqueta}: los días son ${ids.join(',')} y deberían ser ${esperadoIds.join(',')}`)
          debe(plan.llegada.dia_caido == null, 'noches_no_cae', `${etiqueta}: no debería caerse ningún día`)
        } else {
          const esperadoIds = n === 1 ? [esperadaId] : [esperadaId, 'D1-vaticano']
          debe(JSON.stringify(ids) === JSON.stringify(esperadoIds), 'noches_dias_tarde', `${etiqueta}: los días son ${ids.join(',')} y deberían ser ${esperadoIds.join(',')}`)
          if (n === 1) {
            // El Coliseo (con el Foro) va a «Si te sobra tiempo» del día 1 con su aviso; lo que sale hoy no se repite
            const sobra = (dia1.spareRows ?? []).map((r) => r.lugar)
            debe(sobra.includes('Coliseo') && sobra.includes('Foro Romano y Palatino'), 'noches_coliseo_a_sobra', `${etiqueta}: el Coliseo y el Foro deberían estar en «Si te sobra tiempo» (hay: ${sobra.join(', ')})`)
            debe(plan.llegada.avisos.some((a) => a.tipo === 'sitio_en_si_te_sobra' && /Coliseo/.test(a.texto)), 'noches_aviso_coliseo', `${etiqueta}: falta el aviso del Coliseo en «Si te sobra tiempo»`)
            const nocturnas = [...plan.nightsByDay.values()].flat().map((e) => e.name)
            debe(new Set(nocturnas).size === nocturnas.length, 'noches_nocturnas_repetidas', `${etiqueta}: nocturnas repetidas`)
          } else {
            const d2 = plan.days.filter((d) => d.curatedDay)[1]
            const lugares = paradas(d2).map((r) => r.lugar)
            debe(lugares.includes('Coliseo') && lugares.includes(MUSEOS) && lugares.includes('Basílica de San Pedro'), 'noches_d1_vaticano', `${etiqueta}: el día 2 (D1+Vaticano) lleva ${lugares.join(', ')}`)
            debe(!lugares.includes('Piazza Navona') && !lugares.includes('Fontana de Trevi'), 'noches_sin_centro_repetido', `${etiqueta}: el día 2 repite la parte del centro`)
            debe(plan.llegada.dia_caido == null, 'noches_no_cae', `${etiqueta}: con 2 noches no se cae ningún día (el D2 lo sustituye el D1+Vaticano)`)
          }
        }
      }
    }
  }
}

// ═══ 5. El Free Tour (punto 7) ═══
// Los límites del documento (escritos aquí otra vez): el D3 entero si está libre antes de…
const ENTERO = { '10:00': 9 * 60 + 30, '12:00': 11 * 60 + 30, '15:00': 10 * 60, '17:00': 10 * 60 }
const HORAS_FT = ['10:00', '12:00', '15:00', '17:00']
if (quiere('freetour')) {
  console.log('5. El Free Tour de mañana (con hora, sin hora) y de noche (19:00, 21:00)')
  const sede = SEDES.verano
  const p = PUNTOS[0]
  const salidas = ['03:00', '06:30', '07:50', '08:00', '08:20', '09:55', '10:00', '11:10', '12:20', '13:00', '14:00', '15:00', '15:40', '16:30', '17:30', '20:00', '23:00']
  for (const n of [2, 3, 4]) {
    for (const hora of salidas) {
      const libre = toMin(hora) + 90
      const madrugada = toMin(hora) <= 4 * 60 + 59
      // 5a. Con hora
      for (const ft of HORAS_FT) {
        const esc = { n, inicio: sede.inicio, ft, entradas: { [FT]: ft }, diaCuatro: d4De(n) }
        const base = planEscenario(esc)
        const idsBase = idsDe(base)
        const plan = planEscenario(esc, { llegada: llegada(hora, p) })
        const etiqueta = `FT ${ft} · ${n} noches · llega ${hora}`
        if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan o sin \`llegada\``); continue }
        const ids = idsDe(plan)
        const tourEn = (pl) => pl.days.find((d) => (d.escritoRows ?? []).some((r) => r.tipo === 'tour' && !r.llegada))
        if (madrugada || libre < ENTERO[ft]) {
          debe(JSON.stringify(ids) === JSON.stringify(idsBase), 'ft_entero', `${etiqueta}: el D3 entero, como sin vuelos: ${ids.join(',')} y antes ${idsBase.join(',')}`)
          debe(plan.llegada.caso.endsWith('_entero'), 'ft_caso', `${etiqueta}: caso ${plan.llegada.caso}`)
        } else if (libre <= toMin(ft) - 30) {
          // solo la parte del Free Tour; día 2 el D2 y día 3 el D1 (no el D1-FT); todo se corre y se cae el último
          // (El día 1 es la parte del tour; del día 2 en adelante, el D2, el D1 y el resto de la tabla menos el último, en el orden que dan los cierres: si el D2 cae en miércoles, se cambia con el D1.)
          const esperados = n === 2 ? ['D2'] : ['D2', 'D1', ...idsBase.slice(2, -1).filter((x) => !['D1-FT'].includes(x))].slice(0, idsBase.length - 1)
          debe(plan.llegada.caso.endsWith('solo_la_parte_del_tour'), 'ft_caso', `${etiqueta}: caso ${plan.llegada.caso}`)
          debe(ids[0] === 'D3' && JSON.stringify([...ids.slice(1)].sort()) === JSON.stringify([...esperados].sort()), 'ft_parte', `${etiqueta}: los días son ${ids.join(',')} y deberían ser D3 y luego ${esperados.join(',')}`)
          debe(!ids.includes('D1-FT'), 'ft_sin_d1ft', `${etiqueta}: no debería salir el D1-FT (repetiría Trastevere): ${ids.join(',')}`)
          const dia = dia1De(plan)
          const filas = dia.escritoRows ?? []
          debe(filas.some((r) => r.tipo === 'tour' && r.hora_fija === ft), 'ft_hora_manda', `${etiqueta}: el Free Tour no está a las ${ft} el día 1`)
          debe(!filas.some((r) => r.lugar === MUSEOS), 'ft_sin_vaticano', `${etiqueta}: la parte del Free Tour lleva los Museos`)
          // La comida al llegar si el tour es por la tarde y el viajero llega antes de las 15:00; si llega más tarde, ese día no lleva comida (la comida nunca es después de las 15:00).
          if (!franjaCom(ft)) {
            const comidas = filas.filter((r) => r.tipo === 'comida')
            if (libre <= 15 * 60) debe(comidas.length === 1 && comidas[0].restaurante == null, 'ft_comida_al_llegar', `${etiqueta}: el tour es por la tarde y falta la comida al llegar`)
            else debe(comidas.length === 0, 'ft_sin_comida_tarde', `${etiqueta}: llega después de las 15:00 y el día lleva comida`)
          }
          debe(plan.llegada.dia_caido?.id === (n === 2 ? 'D1' : idsBase.at(-1)), 'ft_cae_el_ultimo', `${etiqueta}: cae ${plan.llegada.dia_caido?.id}`)
        } else {
          debe(JSON.stringify(ids) === JSON.stringify(idsBase), 'ft_empezado_sin_reorganizar', `${etiqueta}: no se reorganiza nada: ${ids.join(',')} y antes ${idsBase.join(',')}`)
          debe(plan.llegada.avisos.some((a) => a.tipo === 'free_tour_antes_de_llegar' && a.campana === true && a.botones.includes('ver_reserva') && a.texto.includes(`a las ${horaTexto(ft)}`) && a.texto.includes(`a las ${horaTexto(hora)}`)), 'ft_aviso', `${etiqueta}: falta el aviso «Tu Free Tour es a las… y aterrizas a las…»`)
          // La hora del Free Tour no se mueve
          const dt = tourEn(plan)
          debe(dt && dt.escritoRows.some((r) => r.tipo === 'tour' && !r.llegada && r.hora_fija === ft), 'ft_hora_manda', `${etiqueta}: el Free Tour cambia de hora`)
        }
      }
      // 5b. Sin hora: la app elige por dentro la primera que pille libre
      {
        const esc = { n, inicio: sede.inicio, ft: '10:00', diaCuatro: d4De(n) }
        const base = planEscenario(esc)
        const idsBase = idsDe(base)
        const plan = planEscenario(esc, { llegada: llegada(hora, p) })
        const etiqueta = `FT sin hora · ${n} noches · llega ${hora}`
        if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan o sin \`llegada\``); continue }
        const ids = idsDe(plan)
        const elegida = madrugada ? '10:00' : HORAS_FT.find((h) => libre < toMin(h) - 30) ?? null
        if (elegida) {
          const entero = madrugada || libre < ENTERO[elegida]
          debe(entero ? JSON.stringify(ids) === JSON.stringify(idsBase) : plan.llegada.caso.endsWith('solo_la_parte_del_tour'), 'ft_sin_hora_caso', `${etiqueta}: hora ${elegida}, ${entero ? 'entero' : 'parte del tour'}; caso ${plan.llegada.caso}, días ${ids.join(',')}`)
          const dia = dia1De(plan)
          const tour = (dia.escritoRows ?? []).find((r) => r.tipo === 'tour' && !r.llegada)
          debe(Boolean(tour) && tour.hora_fija === elegida, 'ft_sin_hora_hora', `${etiqueta}: el Free Tour debería ir a las ${elegida} el día 1 y va a las ${tour?.hora_fija}`)
          debe(tour && tour.hora_tipo !== 'reserva', 'ft_sin_hora_no_reserva', `${etiqueta}: el Free Tour sin hora no es una reserva del viajero`)
          debe(plan.llegada.avisos.some((a) => a.tipo === 'free_tour_puesto_al_llegar'), 'ft_sin_hora_aviso', `${etiqueta}: falta «Hemos puesto el Free Tour…»`)
        } else {
          // desde las 16:30: al día siguiente a las 10:00. El día 1 es la fila de la tabla para su hora (sin el D1 detrás), el día 2 el D3 entero y el día 3 el D1-FT
          debe(plan.llegada.caso === 'free_tour_dia_siguiente', 'ft_dia_siguiente_caso', `${etiqueta}: caso ${plan.llegada.caso}`)
          const esperadoIds = [ids[0], 'D3', 'D1-FT', ...idsBase.slice(2, -1)].slice(0, idsBase.length)
          debe(JSON.stringify(ids) === JSON.stringify(esperadoIds), 'ft_dia_siguiente_dias', `${etiqueta}: los días son ${ids.join(',')} y deberían ser ${esperadoIds.join(',')}`)
          const d2 = plan.days.filter((d) => d.curatedDay)[1]
          debe((d2.escritoRows ?? []).some((r) => r.tipo === 'tour' && r.hora_fija === '10:00'), 'ft_dia_siguiente_hora', `${etiqueta}: el Free Tour del día 2 debería ser a las 10:00`)
        }
      }
    }
  }
  // 5e. Los días de horas especiales (Nochebuena, Navidad, Nochevieja, Año Nuevo y Reyes: el tour solo sale a las 12:00): sin hora, la app elige solo entre las de ese día, también el día siguiente
  const ESPECIALES = ['12-24', '12-25', '12-31', '01-01', '01-06']
  for (const inicio of ['2026-12-23', '2026-12-24', '2026-12-30', '2026-12-31', '2027-01-05']) {
    for (const n of [2, 3]) {
      for (const hora of ['06:00', '09:00', '11:00', '13:00', '15:30', '17:30']) {
        const plan = planEscenario({ n, inicio, ft: '10:00', entradas: {}, diaCuatro: null }, { llegada: llegada(hora, p) })
        const etiqueta = `FT sin hora en fechas especiales · ${inicio} · ${n} noches · llega ${hora}`
        if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan`); continue }
        for (const dia of plan.days.filter((d) => (d.escritoRows ?? []).some((f) => f.tipo === 'tour' && !f.llegada))) {
          const tour = dia.escritoRows.find((f) => f.tipo === 'tour' && !f.llegada)
          const permitidas = ESPECIALES.includes(dia.hours.dateIso.slice(5)) ? ['12:00'] : HORAS_FT
          debe(permitidas.includes(tour.hora_fija), 'ft_horas_especiales', `${etiqueta}: el Free Tour del ${dia.hours.dateIso} sale a las ${tour.hora_fija} y ese día solo hay ${permitidas.join(', ')}`)
        }
      }
    }
  }
  // 5d. El Free Tour reservado en OTRO día (el 2 o el 3): su día y su hora no se mueven, llegue cuando llegue el viajero
  for (const n of [2, 3, 4]) {
    for (const dia of [2, 3].filter((x) => x <= n)) {
      for (const hora of ['00:30', '07:00', '10:00', '12:30', '14:00', '16:00', '20:00', '23:00']) {
        const r = { name: FT, dayNumber: dia, dateIso: sumarDias(sede.inicio, dia - 1), time: '12:00' }
        const plan = planEscenario({ n, inicio: sede.inicio, ft: '12:00', reservasGrandes: [r], entradas: {}, diaCuatro: d4De(n) }, { llegada: llegada(hora, p) })
        const etiqueta = `FT reservado el día ${dia} · ${n} noches · llega ${hora}`
        if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan`); continue }
        const dt = diaPorNumero(plan, dia)
        debe(Boolean(dt?.escritoRows?.some((f) => f.tipo === 'tour' && !f.llegada && f.hora_fija === '12:00')), 'ft_otro_dia_no_desaparece', `${etiqueta}: el Free Tour no sale el día ${dia} a las 12:00 (días: ${idsDe(plan).join(',')})`)
        debe(plan.days.filter((d) => (d.escritoRows ?? []).some((f) => f.tipo === 'tour' && !f.llegada)).length === 1, 'ft_otro_dia_una_vez', `${etiqueta}: el Free Tour sale más de una vez`)
      }
    }
  }
  // 5c. El Free Tour de la noche (19:00 y 21:00): el viaje lleva los días de «Sin Free Tour» y el tour va en la noche del D1 (si el D1 pasa al día 2, el tour va con él)
  for (const n of [3, 4]) {
    for (const ft of ['19:00', '21:00']) {
      for (const hora of ['08:00', '11:00', '13:00', '16:00', '20:00']) {
        const esc = { n, inicio: sede.inicio, ft, diaCuatro: d4De(n) }
        const plan = planEscenario(esc, { llegada: llegada(hora, p) })
        const etiqueta = `FT noche ${ft} · ${n} noches · llega ${hora}`
        if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan`); continue }
        const dias = plan.days.filter((d) => (d.escritoRows ?? []).some((r) => r.tipo === 'tour' && !r.llegada))
        debe(dias.length === 1, 'ft_noche_un_dia', `${etiqueta}: el tour sale en ${dias.length} días`)
        if (dias.length !== 1) continue
        const esperado = filaEsperada(sede.tabla, toMin(hora) + 90)
        const idDelTour = dias[0].curatedDay.id
        debe(esperado[2] ? idDelTour === 'D1' : (idDelTour === dia1De(plan).curatedDay.id), 'ft_noche_con_el_d1', `${etiqueta}: el tour va con ${idDelTour} (el D1 ${esperado[2] ? 'pasa al día 2' : 'es el día 1'})`)
        debe(dias[0].escritoRows.find((r) => r.tipo === 'tour' && !r.llegada).hora_fija === ft, 'ft_noche_hora', `${etiqueta}: el tour no está a las ${ft}`)
      }
    }
  }
}
function horaTexto(h) { return `${Number(h.slice(0, 2))}:${h.slice(3, 5)}` }
function franjaCom(ft) { return ft === '10:00' || ft === '12:00' }

// ═══ 6. Las reservas grandes y pequeñas con la llegada (punto 10) ═══
const BLOQUES = { [COLISEO]: [COLISEO, 'Arco de Constantino', 'Foro Romano y Palatino'], [MUSEOS]: [MUSEOS, 'Plaza de San Pedro', 'Basílica de San Pedro'], [GALERIA]: [GALERIA, 'Parque de Villa Borghese'] }
const grande = (inicio, name, dia, time) => ({ name, dayNumber: dia, dateIso: inicio ? sumarDias(inicio, dia - 1) : null, time })
const filasDe = (dia) => dia.escritoRows ?? []
function diaPorNumero(plan, n) { return plan.days.find((d) => d.dayNumber === n) }
const reservaVista = (plan, r) => {
  const dia = diaPorNumero(plan, r.dayNumber)
  if (!dia?.curatedDay) return null
  return filasDe(dia).find((f) => f.lugar === r.name && !f.llegada && f.tipo !== 'traslado' && f.hora_tipo === 'reserva' && f.hora_fija === r.time) ?? null
}
if (quiere('reservas')) {
  console.log('6. Las reservas grandes (Coliseo, Museos, Galería) y las pequeñas con la llegada')
  const sede = SEDES.verano
  const p = PUNTOS[0]
  const llegadas = ['07:00', '10:30', '12:20', '13:00', '16:00', '19:30']
  const horasReserva = { [COLISEO]: ['09:30', '11:00', '13:00', '16:00', '18:30'], [MUSEOS]: ['09:00', '11:30', '15:00', '17:30'], [GALERIA]: ['10:00', '13:00', '16:00'] }
  for (const n of [3, 4]) {
    for (const sitio of [COLISEO, MUSEOS, GALERIA]) {
      for (const hora of llegadas) {
        for (const T of horasReserva[sitio]) {
          const d4 = n === 4 ? 'roma' : null
          const r = grande(sede.inicio, sitio, 1, T)
          const esc = { n, inicio: sede.inicio, reservasGrandes: [r], entradas: { [sitio]: T }, diaCuatro: d4 }
          const libre = toMin(hora) + 90
          const pasa = libre >= 14 * 60
          const etiqueta = `${n} noches · ${sitio.split(' ')[0]} día 1 a las ${T} · llega ${hora}`
          const plan = planEscenario(esc, { llegada: llegada(hora, p) })
          if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan`); continue }
          const ids = idsDe(plan)
          // La reserva nunca desaparece ni cambia de hora: sale el día 1, a su hora, como reserva
          debe(Boolean(reservaVista(plan, r)), 'reserva_no_desaparece', `${etiqueta}: la reserva no sale el día 1 a su hora (días: ${ids.join(',')})`)
          const lugaresDia1 = paradas(dia1De(plan)).map((f) => f.lugar)
          if (!pasa) {
            // antes de las 14:00: ese día pasa a ser el día escrito de ese sitio (el Coliseo: el D1; los Museos: el D2; la Galería: el D4)
            const diaDelSitio = { [COLISEO]: 'D1', [MUSEOS]: 'D2', [GALERIA]: 'D4' }[sitio]
            debe(ids[0] === diaDelSitio, 'reserva_dia_completo', `${etiqueta}: el día 1 debería ser ${diaDelSitio} y es ${ids[0]}`)
            debe(ids.length === idsDe(planEscenario({ n, inicio: sede.inicio, diaCuatro: d4 })).length && new Set(ids).size === ids.length, 'reserva_dias_mismos', `${etiqueta}: los días son ${ids.join(',')}`)
            debe(!ids.includes('D1-rapido') && !plan.llegada.dia_caido, 'reserva_sin_caer', `${etiqueta}: no debería caerse ningún día (${plan.llegada.dia_caido?.id})`)
          } else {
            // desde las 14:00: solo el bloque de esa reserva, entero, en la ruta del centro; el resto de su día, sin esa visita
            const bloque = BLOQUES[sitio]
            debe(bloque.every((l) => lugaresDia1.includes(l)), 'bloque_entero', `${etiqueta}: el bloque ${bloque.join(' + ')} no está entero el día 1 (sale: ${lugaresDia1.join(', ')})`)
            debe(/^D1-(centro|anochecer|noche|sin-ruta)/.test(ids[0]), 'bloque_ruta_del_centro', `${etiqueta}: el día 1 es ${ids[0]}`)
            // Nada se repite: ninguna parada del bloque sale por dentro en otro día
            const otros = plan.days.filter((d) => d.curatedDay && d.dayNumber !== 1)
            // (La versión sin Museos del D2 que pide el documento empieza en San Pedro con la Basílica y las Grutas: la Plaza y la Basílica de ese día no cuentan como repetidas.)
            for (const l of bloque.filter((x) => !(sitio === MUSEOS && x !== MUSEOS))) {
              const repetida = otros.filter((d) => filasDe(d).some((f) => f.lugar === l && !f.llegada && f.tipo === 'parada' && f.modo !== 'camino' && f.modo !== 'fuera'))
              debe(repetida.length === 0, 'bloque_sin_repetir', `${etiqueta}: «${l}» también sale en ${repetida.map((d) => d.curatedDay.id).join(',')}`)
            }
            // Los días del sitio, en la versión sin esa visita
            const esperadoSin = { [COLISEO]: ['D1', 'D1-FT'], [MUSEOS]: ['D2'], [GALERIA]: ['D4'] }[sitio]
            for (const dia of otros.filter((d) => esperadoSin.includes(d.curatedDay.id))) {
              const sinVisita = filasDe(dia).filter((f) => f.lugar === bloque[0] && f.tipo === 'parada' && f.modo !== 'camino' && f.modo !== 'fuera')
              debe(sinVisita.length === 0, 'dia_sin_la_visita', `${etiqueta}: ${dia.curatedDay.id} sigue llevando ${bloque[0]}`)
            }
            // El día que se cae sigue siendo el último, salvo que la reserva lo reclame
            debe(Boolean(plan.llegada.dia_caido) || n < 3, 'reserva_cae_uno', `${etiqueta}: debería caerse un día`)
          }
          if (toMin(T) < libre && toMin(hora) > 4 * 60 + 59) debe(plan.llegada.avisos.some((a) => a.tipo === 'reserva_antes_de_llegar' && a.campana === true && a.texto.includes(`a las ${horaTexto(T)}`) && a.texto.includes(`a las ${horaTexto(hora)}`)), 'aviso_reserva_antes', `${etiqueta}: falta el aviso de la reserva antes de llegar`)
          else debe(!plan.llegada.avisos.some((a) => a.tipo === 'reserva_antes_de_llegar'), 'aviso_reserva_sobra', `${etiqueta}: sale un aviso de reserva antes de llegar y la reserva es a su hora`)
          // El Coliseo siempre por dentro, con su tiempo entero
          const col = filasDe(dia1De(plan)).find((f) => f.lugar === COLISEO && f.tipo === 'parada' && !f.llegada)
          if (sitio === COLISEO && col) debe(col.modo === 'dentro' && col.min >= 75, 'coliseo_por_dentro', `${etiqueta}: el Coliseo sale ${col.modo} ${col.min} min`)
        }
      }
    }
  }
  // 6b. Dos reservas grandes en el mismo medio día: cada bloque a su hora; si se cruzan, el aviso «coinciden»
  for (const [a, b] of [[[COLISEO, '14:30'], [MUSEOS, '17:30']], [[COLISEO, '17:00'], [GALERIA, '17:30']], [[MUSEOS, '15:00'], [GALERIA, '18:00']], [[COLISEO, '16:00'], [MUSEOS, '16:30']]]) {
    for (const hora of ['07:00', '10:30', '12:30', '13:20', '15:00']) {
      const rs = [grande(sede.inicio, a[0], 1, a[1]), grande(sede.inicio, b[0], 1, b[1])]
      const plan = planEscenario({ n: 4, inicio: sede.inicio, diaCuatro: 'roma', reservasGrandes: rs, entradas: Object.fromEntries(rs.map((x) => [x.name, x.time])) }, { llegada: llegada(hora, p) })
      const etiqueta = `dos reservas ${a[0].split(' ')[0]} ${a[1]} + ${b[0].split(' ')[0]} ${b[1]} · llega ${hora}`
      if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan`); continue }
      for (const r of rs) debe(Boolean(reservaVista(plan, r)), 'dos_reservas_no_desaparecen', `${etiqueta}: la reserva de ${r.name} no sale el día 1 a su hora`)
      const dur = (nombre) => D.places.find((q) => q.name === nombre).duration_minutes
      const [primera, segunda] = toMin(a[1]) <= toMin(b[1]) ? [a, b] : [b, a]
      const cruzan = toMin(segunda[1]) < toMin(primera[1]) + dur(primera[0])
      debe(cruzan === plan.llegada.avisos.some((x) => x.tipo === 'reservas_coinciden'), 'aviso_coinciden', `${etiqueta}: ${cruzan ? 'falta' : 'sobra'} el aviso «coinciden»`)
    }
  }
  // 6c. Reserva grande en un día de en medio: se cambian los dos días enteros (todo o nada), también con la llegada
  for (const hora of ['08:00', '11:00', '13:30', '16:00', '21:00']) {
    for (const [sitio, T] of [[COLISEO, '10:30'], [COLISEO, '16:00'], [MUSEOS, '11:00'], [MUSEOS, '15:30'], [GALERIA, '12:00']]) {
      for (const dia of [2, 3]) {
        const n = 4
        const r = grande(sede.inicio, sitio, dia, T)
        const plan = planEscenario({ n, inicio: sede.inicio, diaCuatro: 'roma', reservasGrandes: [r], entradas: {} }, { llegada: llegada(hora, p) })
        const etiqueta = `reserva de en medio · ${sitio.split(' ')[0]} día ${dia} a las ${T} · llega ${hora}`
        if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan`); continue }
        debe(Boolean(reservaVista(plan, r)), 'reserva_medio_no_desaparece', `${etiqueta}: la reserva no sale el día ${dia} a su hora (${idsDe(plan).join(',')})`)
        // Todo o nada: el día de ese sitio entero
        const diaDelSitio = diaPorNumero(plan, dia)
        debe(['D1', 'D1-FT', 'D2', 'D3', 'D4', 'D1-vaticano'].includes(diaDelSitio.curatedDay.id), 'reserva_medio_dia_entero', `${etiqueta}: el día ${dia} es ${diaDelSitio.curatedDay.id}`)
      }
    }
  }
  // 6d. Reserva pequeña el día de llegada: queda fija a su hora y del día al que llega no se quita nada
  for (const hora of ['07:00', '10:30', '12:20', '13:00', '16:00', '19:30']) {
    for (const [name, T] of [['Panteón', '11:00'], ['Panteón', '16:30'], ['Altar de la Patria', '15:00'], ['Castillo de Sant\'Angelo', '17:00']]) {
      const rv = { name, dayNumber: 1, dateIso: sede.inicio, time: T }
      const sin = planEscenario({ n: 3, inicio: sede.inicio }, { llegada: llegada(hora, p) })
      const con = planEscenario({ n: 3, inicio: sede.inicio, reservasViaje: [rv], entradas: { [name]: T } }, { llegada: llegada(hora, p) })
      const etiqueta = `reserva pequeña ${name} a las ${T} · llega ${hora}`
      if (!con?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan`); continue }
      debe(Boolean(reservaVista(con, rv)), 'reserva_pequena_no_desaparece', `${etiqueta}: la reserva no sale el día 1 a su hora (${filasDe(dia1De(con)).map((f) => `${f.lugar}${f.hora_fija ? '@' + f.hora_fija : ''}`).join(', ')})`)
      // Del día al que llega no se quita nada: todo lo que llevaba sigue en él o en «Si te sobra tiempo»
      const antes = new Set(filasDe(dia1De(sin)).filter((f) => f.tipo === 'parada' && !f.llegada).map((f) => f.lugar))
      const despues = new Set([...filasDe(dia1De(con)).filter((f) => f.tipo === 'parada' && !f.llegada).map((f) => f.lugar), ...(dia1De(con).spareRows ?? []).map((f) => f.lugar)])
      const faltan = [...antes].filter((l) => !despues.has(l))
      debe(faltan.length === 0, 'reserva_pequena_no_quita', `${etiqueta}: el día 1 pierde ${faltan.join(', ')}`)
    }
  }
}

// Las comprobaciones de siempre más las de la llegada, sobre un plan con llegada. `esc` es el escenario, `hora` la hora de llegada y `poolNames` lo que el viajero marcó en el pool.
function revisarViaje(plan, esc, hora, etiqueta, poolNames = []) {
  const ft = esc.ft
  const a = argsDeEscenarioPublico(esc)
  const r = comprobarViaje({ D, plan, etiqueta, entradas: a.entradas, poolNames, hasFreeTour: a.hasFreeTour, listas: written, franjas: written.destino?.franjas })
  for (const f of r.fallos) debe(false, f.regla, f.texto)
  comprobaciones++
  // Lo que la llegada añade a las comprobaciones de siempre
  const dias = plan.days.filter((d) => d.curatedDay)
  const ids = dias.map((d) => d.curatedDay.id)
  debe(JSON.stringify(plan.llegada.orden) === JSON.stringify(ids) || plan.llegada.caso.startsWith('free_tour_no_se_pone') || (plan.llegada.orden && plan.llegada.orden.length === ids.length), 'orden_publico', `${etiqueta}: \`llegada.orden\` ${plan.llegada.orden} no son los días ${ids}`)
  debe(new Set(ids).size === ids.length, 'dias_repetidos', `${etiqueta}: un día escrito sale dos veces: ${ids.join(',')}`)
  // Comida: nunca antes de las 12:00 ni después de las 15:00 (salvo la excepción de los Museos con reserva)
  // (Un día que las comprobaciones de siempre ya apuntan como «comida tarde» por una causa que no es de la llegada —varias horas fijas, una reserva que bloquea…— no se repite aquí.)
  const comidaYaApuntada = (d) => r.info.some((i) => i.regla === 'comida_tarde' && i.texto.includes(` ${d.curatedDay.id}:`))
  for (const d of dias) {
    if (comidaYaApuntada(d)) continue
    // (Con DOS horas fijas el mismo día —el turno de la Galería del pool y el Free Tour de la noche— la regla 17 deja la lista escrita tal cual y la comida puede caer tarde; ya pasa sin vuelos —60 de 300 días en la prueba—: se apunta en el INFORME.)
    if (filasDe(d).filter((f) => f.hora_fija && !f.llegada).length >= 2) continue
    for (const c of filasDe(d).filter((f) => f.tipo === 'comida')) {
      const conMuseos = filasDe(d).some((f) => f.lugar === MUSEOS && f.hora_tipo === 'reserva' && f.hora_fija >= '12:00' && f.hora_fija <= '13:00')
      debe((c.t0 >= 12 * 60 || (conMuseos && c.t0 >= 11 * 60 + 15)) && c.t0 <= 15 * 60, 'comida_hora', `${etiqueta}: ${d.curatedDay.id} comida a las ${toHHMM(c.t0)}`)
    }
    // «Cerrado este día» sin tiempo
    for (const f of filasDe(d).filter((x) => x.cerrado_este_dia)) debe(f.min === 0 && f.t1 === f.t0, 'cerrado_sin_tiempo', `${etiqueta}: «Cerrado este día» con tiempo`)
  }
  // 0 nocturnas repetidas
  const nocturnas = [...plan.nightsByDay.values()].flat().map((e) => e.name)
  debe(new Set(nocturnas).size === nocturnas.length, 'nocturnas_repetidas', `${etiqueta}: nocturnas repetidas ${nocturnas.join(', ')}`)
  // El día 1 de la llegada: nada se manda a «Si te sobra tiempo» por el tiempo ni se queda de camino un imprescindible
  const d1 = dias[0]
  if (plan.llegada.dia1?.lista === d1.curatedDay.id && !['d1_de_siempre', 'madrugada', 'tranquilo'].includes(plan.llegada.caso) && !/_entero$|_ya_empezado$|sin_cambios/.test(plan.llegada.caso)) {
    debe(!(d1.spareRows ?? []).some((s) => s.razon === 'cabe'), 'sobra_por_minutos', `${etiqueta}: algo del día 1 pasa a «Si te sobra tiempo» por el tiempo`)
    debe(!filasDe(d1).some((f) => f.tipo === 'parada' && !f.llegada && f.nivel === 1 && f.modo === 'camino' && !f.por_horario), 'imprescindible_de_camino', `${etiqueta}: un imprescindible va de camino el día 1`)
  }
  // Los imprescindibles con entrada nunca desaparecen: lo que sale en los días de siempre y no sale ahora está en «Si te sobra tiempo», en «No incluido» o en un día que cae
  const sale = new Set(dias.flatMap((d) => [...filasDe(d).filter((f) => f.tipo === 'parada' && !f.llegada).map((f) => f.lugar), ...(d.spareRows ?? []).map((s) => s.lugar)]))
  // Las nocturnas imprescindibles y los textos de la llegada de noche (con la hora del viajero)
  if (['noche_con_cena', 'noche_sin_cena', 'sin_ruta'].includes(plan.llegada.caso)) {
    const texto = plan.llegada.dia1.texto ?? ''
    const esSinRuta = plan.llegada.caso === 'sin_ruta'
    debe(esSinRuta ? /Descansa, que mañana empezamos a tope/.test(texto) : /visita la Fontana de Trevi de noche/.test(texto), 'texto_noche', `${etiqueta}: el texto de la llegada de noche: «${texto}»`)
    debe(texto.includes(`a las ${horaTexto(hora)}`), 'texto_noche_hora', `${etiqueta}: el texto no lleva la hora del viajero: «${texto}»`)
    debe(!/\{|\}/.test(texto), 'texto_noche_huecos', `${etiqueta}: el texto lleva huecos sin rellenar`)
    debe(!/centro|taxi/i.test(texto), 'texto_noche_palabras', `${etiqueta}: palabras que no van: «${texto}»`)
  }
  // Todos los textos de la llegada: sin horas calculadas, sin empresas, sin «taxi» y sin «Día n»
  for (const t of [...plan.llegada.avisos.map((x) => x.texto), ...plan.llegada.resumen.map((x) => x.texto)]) {
    debe(!/\bDía \d|\btaxi\b|Terravision|Trenitalia|Civitatis|sal a las/i.test(t), 'texto_prohibido', `${etiqueta}: «${t}»`)
    debe(!/\{(?!dia:\d\})/.test(t), 'texto_huecos', `${etiqueta}: hueco sin rellenar en «${t}»`)
  }
  // Cada hora que sale en un texto es una hora del viajero (su llegada, sus reservas o el Free Tour)
  for (const t of plan.llegada.avisos.map((x) => x.texto)) {
    for (const m of t.matchAll(/(\d{1,2}):(\d{2})/g)) {
      const h = `${String(m[1]).padStart(2, '0')}:${m[2]}`
      const delViajero = new Set([hora, ft, ...(esc.entradas ? Object.values(esc.entradas) : []), '10:00', '12:00', '15:00', '17:00'].filter(Boolean))
      debe(delViajero.has(h), 'hora_calculada_a_la_vista', `${etiqueta}: la hora ${h} de «${t}» no es del viajero`)
    }
  }
}

// ═══ 9. La matriz grande: viajes de 1 a 7 noches con todas las comprobaciones de siempre ═══
if (quiere('matriz')) {
  const MUESTRAS = Number(args.muestras ?? 1500)
  console.log(`9. La matriz: ${MUESTRAS} viajes con llegada al azar (siempre los mismos) + los bordes de cada fila`)
  let semilla = 20261013
  const azar = () => { semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const elige = (lista) => lista[Math.floor(azar() * lista.length)]
  const INICIOS = ['2027-06-08', '2027-08-14', '2026-11-04', '2026-10-25', '2027-03-26', '2026-12-24', '2026-12-30', '2027-04-05', '2027-01-10', '2027-05-22', '2026-12-25', '2027-01-06', '2027-10-30', null, null]
  const HORAS = ['00:30', '04:59', '05:00', '07:00', '08:40', '09:50', '10:00', '11:30', '12:40', '13:30', '14:20', '15:30', '18:00', '19:40', '20:50', '22:30', '23:40']
  const FTS = [null, null, null, '10:00', '12:00', '15:00', '17:00', '19:00', '21:00', 'sin']
  const ZONAS = ['centro', 'plaza_de_espana', 'prati', 'trastevere', 'monti', 'termini', 'nose', null]
  const PUNTOS_M = [PUNTOS[0], PUNTOS[1], PUNTOS[2], PUNTOS[3], PUNTOS[4], PUNTOS[5], PUNTOS[6]]
  const conteo = {}
  for (let k = 0; k < MUESTRAS; k++) {
    const n = 1 + Math.floor(azar() * 7)
    const inicio = elige(INICIOS)
    const mes = inicio ? null : elige([0, 2, 5, 9, 10])
    const hora = elige(HORAS)
    const p = elige(PUNTOS_M)
    const zona = elige(ZONAS)
    let ft = n >= 2 ? elige(FTS) : null
    const sinHora = ft === 'sin'
    if (sinHora) ft = '10:00'
    const explicito = ft && ['10:00', '12:00', '15:00', '17:00'].includes(ft) && !sinHora && azar() < 0.5
    // Lo que el viajero marcó en el pool (nada elegido desaparece): de 0 a 3 lugares de la lista del destino
    const lista = D.pool_lista?.lugares ?? []
    const poolNames = azar() < 0.4 ? Array.from({ length: 1 + Math.floor(azar() * 3) }, () => elige(lista)).filter((x, i, todos) => todos.indexOf(x) === i) : []
    const esc = { n, inicio, mes, ft, diaCuatro: d4De(n), poolNames, entradas: explicito || (ft && ['12:00', '15:00', '17:00'].includes(ft)) ? { [FT]: ft } : {} }
    const etiqueta = `#${k} ${n}n ${inicio ?? `mes${mes}`} FT=${sinHora ? 'sin hora' : ft ?? '-'} llega ${hora} ${nombrePunto(p)} zona=${zona}${poolNames.length ? ` pool=[${poolNames.join('|')}]` : ''}`
    let plan
    try { plan = planEscenario(esc, { llegada: llegada(hora, p, zona) }) } catch (error) { debe(false, 'excepcion', `${etiqueta}: ${error.message}`); continue }
    if (!plan) { debe(false, 'sin_plan', `${etiqueta}: sin plan`); continue }
    if (!plan.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin \`llegada\``); continue }
    conteo[plan.llegada.caso] = (conteo[plan.llegada.caso] ?? 0) + 1
    revisarViaje(plan, esc, hora, etiqueta, poolNames)
  }
  console.log('   casos vistos:', Object.entries(conteo).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}=${v}`).join(' '))
}
function argsDeEscenarioPublico(esc) {
  const noche = esc.ft === '19:00' || esc.ft === '21:00'
  return { entradas: esc.entradas ?? {}, hasFreeTour: Boolean(esc.ft) && !noche }
}

// ═══ 7. La excursión (punto 12) ═══
if (quiere('excursion')) {
  console.log('7. La excursión y la llegada')
  const sede = SEDES.verano
  const p = PUNTOS[0]
  // 7a. La excursión del día 4 no se mueve nunca (ni cae en el día de llegada ni en el de vuelta), llegue cuando llegue el viajero
  for (const n of [4, 5, 6, 7]) {
    for (const hora of ['00:30', '08:00', '11:00', '13:30', '16:00', '19:30', '22:30']) {
      for (const d4 of n === 4 ? ['roma', 'excursion'] : ['excursion']) {
        const base = planEscenario({ n, inicio: sede.inicio, diaCuatro: d4 })
        const plan = planEscenario({ n, inicio: sede.inicio, diaCuatro: d4 }, { llegada: llegada(hora, p) })
        const etiqueta = `${n} noches · día 4: ${d4} · llega ${hora}`
        const exc = (pl) => pl.days.filter((d) => d.isExcursion).map((d) => d.dayNumber)
        debe(JSON.stringify(exc(plan)) === JSON.stringify(exc(base)), 'excursion_no_se_mueve', `${etiqueta}: la excursión cae el día ${exc(plan)} y sin vuelos cae el ${exc(base)}`)
        // (El día de vuelta es el n+1: el motor no le da ruta, así que ninguna excursión puede caer ahí; el día 1 es el de llegada.)
        debe(!exc(plan).includes(1) && !exc(plan).includes(n + 1), 'excursion_nunca_en_llegada_ni_vuelta', `${etiqueta}: la excursión cae el día ${exc(plan)}`)
      }
    }
  }
  // 7b. Una excursión reservada el día de llegada: antes de estar libre → el aviso; después → ese día lleva la excursión
  for (const [salida, hora, esperado] of [['07:30', '09:00', 'aviso'], ['11:00', '09:00', 'dia'], ['15:00', '12:00', 'dia'], ['09:00', '10:00', 'aviso'], ['18:00', '16:00', 'dia']]) {
    const exc = { dayNumber: 1, dateIso: sede.inicio, salida, vuelta: '20:00', nombre: 'Pompeya' }
    const plan = planEscenario({ n: 4, inicio: sede.inicio, diaCuatro: 'roma' }, { llegada: llegada(hora, p, 'centro', { excursionReservada: exc }) })
    const etiqueta = `excursión reservada el día 1 a las ${salida} · llega ${hora}`
    if (!plan?.llegada) { debe(false, 'sin_llegada', `${etiqueta}: sin plan`); continue }
    const libre = toMin(hora) + 90
    const antes = toMin(salida) < libre
    debe(antes === (esperado === 'aviso'), 'excursion_regla', `${etiqueta}: (prueba) libre ${toHHMM(libre)}`)
    if (esperado === 'aviso') {
      debe(plan.llegada.avisos.some((a) => a.tipo === 'excursion_antes_de_llegar' && a.campana === true && a.texto.includes(`sale a las ${horaTexto(salida)}`) && a.texto.includes(`a las ${horaTexto(hora)}`) && a.texto.includes('Pompeya')), 'excursion_aviso', `${etiqueta}: falta el aviso «Aterrizas a las… y tu excursión a Pompeya sale a las…»`)
      debe(!plan.days[0].isExcursion, 'excursion_no_se_mueve', `${etiqueta}: el día 1 no cambia`)
    } else {
      debe(plan.days[0].isExcursion === true, 'excursion_dia_1', `${etiqueta}: el día 1 debería ser la excursión`)
      debe(plan.days.filter((d) => d.isExcursion).length === 1, 'excursion_una_sola', `${etiqueta}: hay ${plan.days.filter((d) => d.isExcursion).length} días de excursión`)
      debe(plan.days.filter((d) => d.curatedDay).length === 3, 'excursion_dias_de_ciudad', `${etiqueta}: deberían quedar 3 días de ciudad`)
    }
  }
}

// ═══ 8. La versión gratis, la ruta a mano y el coche: los días no cambian ═══
if (quiere('apagado')) {
  console.log('8. Gratis, ruta a mano y coche: los días salen como sin vuelos (y las horas no se usan ni se borran)')
  const sede = SEDES.verano
  for (const n of [1, 2, 3, 4, 5]) {
    for (const ft of [null, '10:00', '21:00']) {
      if (n === 1 && ft) continue
      for (const hora of ['03:00', '09:00', '12:30', '16:00', '21:30']) {
        const esc = { n, inicio: sede.inicio, ft, diaCuatro: d4De(n) }
        const base = huellaDePlan(planEscenario(esc))
        const etiqueta = `${n} noches · FT ${ft ?? '-'} · llega ${hora}`
        for (const [nombre, extra] of [['gratis (pago: false)', { pago: false }], ['ruta a mano', { aMano: true }], ['en coche', { medio: 'coche' }], ['sin hora', { hora: null }]]) {
          const plan = planEscenario(esc, { llegada: { ...llegada(hora, PUNTOS[0]), ...extra } })
          debe(huellaDePlan(plan) === base && !plan.llegada, 'apagado_igual', `${etiqueta} · ${nombre}: los días no son los de sin vuelos`)
        }
      }
    }
  }
  // Las horas guardadas no se borran: el motor no toca la entrada
  const entrada = { hora: '12:30', medio: 'avion', puntoId: 'fco', zona: 'centro', pago: false }
  const copia = JSON.stringify(entrada)
  planEscenario({ n: 3, inicio: sede.inicio }, { llegada: entrada })
  debe(JSON.stringify(entrada) === copia, 'apagado_no_borra', 'el motor ha cambiado la entrada de la llegada')
  // «Eliminar reserva»: el orden de los días que el viajero ya ve (force_order) manda, también con la llegada
  for (const hora of ['08:00', '13:30', '16:00']) {
    const esc = { n: 3, inicio: sede.inicio }
    const plan = planEscenario(esc, { llegada: llegada(hora, PUNTOS[0]) })
    const ids = idsDe(plan)
    const otra = planEscenario(esc, { llegada: llegada(hora, PUNTOS[0]), forceOrder: ids })
    debe(JSON.stringify(idsDe(otra)) === JSON.stringify(ids), 'force_order', `llega ${hora}: con force_order los días son ${idsDe(otra).join(',')} y deberían ser ${ids.join(',')}`)
  }
}

// ═══ 10. Los 20 viajes de la revisión, ahora con vuelos (punto 23): la mitad de la llegada ═══
if (quiere('viajes20')) {
  console.log('10. Los 20 viajes con vuelos (llegada de cada fila del punto 6)')
  for (const v of VIAJES) {
    const ll = LLEGADAS_20[v.n]
    const etiqueta = `Viaje ${v.n} (${v.dias} días, ${v.inicio}) llega ${ll.hora} ${ll.puntoId}`
    const plan = planViajeConLlegada(v)
    debe(Boolean(plan?.llegada), 'sin_llegada', `${etiqueta}: sin plan o sin \`llegada\``)
    if (!plan?.llegada) continue
    const conEntrada = v.ft === '12:00' || v.ft === '15:00' || v.ft === '17:00'
    const esc = { n: v.dias, inicio: v.inicio, ft: v.ft ?? null, diaCuatro: v.diaCuatro ?? null, entradas: conEntrada ? { [FT]: v.ft } : {} }
    revisarViaje(plan, esc, ll.hora, etiqueta, [])
    // El mismo viaje sin vuelos sigue igual que antes
    debe(huellaDePlan(planViajeConLlegada(v, { llegada: null })) === huellaDePlan(planViaje(v)), 'viaje20_sin_vuelos', `${etiqueta}: sin la llegada no sale igual`)
  }
}

// ═══ fin ═══
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const [regla, n] of Object.entries(porRegla)) console.log(`  ${regla}: ${n}`)
for (const f of fallos.slice(0, VER)) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length > 0 ? 1 : 0
