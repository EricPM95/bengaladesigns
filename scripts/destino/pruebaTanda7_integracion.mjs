// Prueba de la Tanda 7, INTEGRACIÓN: la llegada con horas (agente F) y la vuelta con horas (agente G) funcionando JUNTAS.
//   node scripts/destino/pruebaTanda7_integracion.mjs [ver=25] [solo=cruce,cruce2,rejilla,reservas,apagado,ganchos,servidor] [muestras=500] [repetidas=1]
//
// Comprobaciones sencillas que no comparten código con el motor: miran lo que sale.
//   1. «cruce»: los 20 viajes de la revisión con SU llegada × una vuelta de cada fila de la tabla (7 filas, desde Fiumicino).
//   2. «cruce2»: los 10 viajes con vuelta de la revisión × una llegada de cada fila (las 20 de la revisión).
//   3. «rejilla»: de 1 a 7 noches, verano e invierno, con y sin fechas, con Free Tour (con hora y sin hora), con excursión, con puntos y medios distintos, llegadas y vueltas al azar (siempre las mismas).
//   4. «reservas»: reservas grandes (Coliseo, Museos, Galería) y pequeñas en el día de llegada y en el de vuelta a la vez, ruta de pago.
//   5. «apagado»: la versión gratis (pago: false), la ruta a mano y sin horas: los días salen IGUAL que sin vuelos; con una sola de las dos (solo llegada, solo vuelta) el otro lado no cambia nada.
//   6. «ganchos»: el día que se cae al llegar (hooks.vuelta de la llegada) lo recupera la vuelta de las 23:00 o más como «un día más»; si la vuelta no lo permite, no se repite; con solo vuelta o solo llegada sigue igual.
//   7. «servidor»: lo que manda el cliente (`llegada` y `vuelta` en la petición) llega a buildDayBlockV3 y a las dos a la vez (sin servidor propio; la petición HTTP real se hace aparte con curl).
//
// Por cada viaje: sin errores, ningún día de ruta repetido, ninguna parada repetida entre días (salvo lo permitido), el día que cae no se pierde, los imprescindibles que se quedan en el viaje no se quitan,
// las reservas a su hora, la comida entre las 12:00 y las 15:00, 0 nocturnas repetidas, y los textos sin horas calculadas, sin empresas ni «taxi».
import { comprobarViaje } from './comprobacionesListas.mjs'
import { D, written, FT, COLISEO, MUSEOS, GALERIA, planEscenario, huellaDePlan, resumenDePlan, sumarDias, toMin, toHHMM, argsDeEscenario } from './llegadaLib.mjs'
import { VIAJES, LLEGADAS_20, VIAJES_VUELTA, argsDeViaje } from './viajes20Lib.mjs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { buildDayBlockV3 } from '../../server/engine/index.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const VER = Number(args.ver ?? 25)
const SOLO = args.solo ? new Set(args.solo.split(',')) : null
const quiere = (nombre) => !SOLO || SOLO.has(nombre)
const fallos = []
const porRegla = {}
let comprobaciones = 0
let planes = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) { porRegla[regla] = (porRegla[regla] ?? 0) + 1; fallos.push({ regla, texto }) }
}
const informe = { repetidas: new Map(), noCabe: [], casosLlegada: {}, contenidoVuelta: {}, origenDiaMas: {}, recuperados: 0, noRecuperados: [] }

// ── Lo que mira la prueba, escrito aparte del motor ──────────────────────────────────────────────────────────
const NIVEL = (lugar) => D.places.find((p) => p.name === lugar)?.level ?? null
const NUNCA_SE_QUITA = new Set((D.sitios_grandes?.lugares ?? []).filter((s) => s.nunca_se_quita).map((s) => s.nombre))
/**
 * Con una salida de madrugada el último día de ruta lleva su cena y NO la nocturna, y las nocturnas del viaje se reparten otra vez entre los días que quedan (el motor de la vuelta lo hace así solo):
 * para comparar «lo demás» tal cual se quitan de TODOS los días las nocturnas (filas y registro) y la marca de la variante; las filas, sobras, comidas y franjas de siempre sí se comparan.
 */
const sinLaNocturnaDelUltimo = (dias, madrugada) => dias.map((d) => {
  const base = { ...d, noches: null, variantes: (d.variantes ?? []).filter((x) => !/sin_nocturna/.test(x)) }
  if (!madrugada) return base
  return { ...base, filas: d.filas.filter((f) => f[1] !== 'noche' && !/\(noche\)|de noche/.test(String(f[2] ?? ''))), log: d.log.filter((l) => l[0] !== 'noche' && !/nocturna/.test(String(l[1] ?? '')) && !/\(noche\)|de noche/.test(String(l[2] ?? ''))), sobra: d.sobra.filter((s) => !/\(noche\)|de noche/.test(String(s[1] ?? ''))) }
})
const PROHIBIDO = /\bDía \d|\btaxi\b|Terravision|Trenitalia|Civitatis|Kibag|Kipoint|Atral|Portlink|Cotral|\bsal a las\b/i
// Las 7 filas de la tabla de la vuelta (desde Fiumicino): una hora de cada una.
const VUELTAS_FILAS = [
  { hora: '03:00', fila: 'de 0:00 a 4:59' }, { hora: '06:30', fila: 'de 5:00 a 8:59' }, { hora: '11:00', fila: 'de 9:00 a 13:29' }, { hora: '14:00', fila: 'de 13:30 a 14:59' },
  { hora: '16:00', fila: 'de 15:00 a 16:59' }, { hora: '19:30', fila: 'de 17:00 a 22:59' }, { hora: '23:30', fila: 'a las 23:00 o más tarde' },
]
const vuelta = (hora, extra = {}) => ({ hora, modo: 'flight', puntoId: 'fco', zona: 'centro', ...extra })
const idsDeRuta = (plan) => plan.days.filter((d) => d.curatedDay?.id).map((d) => d.curatedDay.id)
const filasDe = (dia) => dia?.escritoRows ?? []
const paradasDe = (dia) => filasDe(dia).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour' || r.tipo === 'desayuno') && !r.llegada)
const diaVuelta = (plan) => plan.vuelta?.diaPlan ?? null
const todosLosDias = (plan) => [...plan.days.filter((d) => d.curatedDay?.id), ...(diaVuelta(plan)?.curatedDay?.id ? [diaVuelta(plan)] : [])]
const normHora = (h) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(h)); return m ? `${Number(m[1])}:${m[2]}` : null }

/** Una parada «repetida»: el mismo sitio, visitado de verdad (ni de camino ni por fuera ni cerrado) en dos días distintos del viaje. */
function repetidasEntreDias(plan) {
  const vistas = new Map()
  const out = []
  for (const dia of todosLosDias(plan)) {
    for (const r of paradasDe(dia)) {
      if (!r.lugar || r.cerrado_este_dia || r.modo === 'camino' || r.modo === 'fuera') continue
      const antes = vistas.get(r.lugar)
      if (antes && antes.dia !== dia.curatedDay.id + '|' + dia.dayNumber) out.push({ lugar: r.lugar, antes, ahora: { dia: dia.curatedDay.id, min: r.min, modo: r.modo }, nivel: NIVEL(r.lugar) })
      else if (!antes) vistas.set(r.lugar, { dia: dia.curatedDay.id + '|' + dia.dayNumber, min: r.min, modo: r.modo })
    }
  }
  return out
}

/**
 * Las comprobaciones del viaje entero con llegada y vuelta. `c` = { etiqueta, esc?, llegada, vuelta, ft, entradas, reservas: [{ name, time }], hasFreeTour, base }.
 * `base`: { soloLlegada } el mismo viaje con solo la llegada (para ver que la vuelta no cambia los días de ruta).
 */
function revisar(plan, c) {
  planes++
  const { etiqueta } = c
  if (!plan) { debe(false, 'sin_plan', `${etiqueta}: sin plan`); return }
  const llegadaPide = Boolean(c.llegada && c.llegada.pago !== false && c.llegada.aMano !== true && c.llegada.hora)
  const vueltaPide = Boolean(c.vuelta && c.vuelta.pago !== false && c.vuelta.hora)
  debe(Boolean(plan.llegada) === llegadaPide, 'llegada_publica', `${etiqueta}: \`plan.llegada\` ${plan.llegada ? 'sale' : 'no sale'} y la llegada ${llegadaPide ? 'está' : 'no está'} puesta`)
  debe(Boolean(plan.vuelta) === vueltaPide, 'vuelta_publica', `${etiqueta}: \`plan.vuelta\` ${plan.vuelta ? 'sale' : 'no sale'} y la vuelta ${vueltaPide ? 'está' : 'no está'} puesta`)
  if (plan.llegada) informe.casosLlegada[plan.llegada.caso] = (informe.casosLlegada[plan.llegada.caso] ?? 0) + 1
  if (plan.vuelta) informe.contenidoVuelta[plan.vuelta.contenido ?? '-'] = (informe.contenidoVuelta[plan.vuelta.contenido ?? '-'] ?? 0) + 1
  const dV = diaVuelta(plan)

  // 1. Las comprobaciones de siempre sobre el viaje (días de ruta + el día de vuelta, que se mira aparte para no mezclar sus fallos).
  const sinTour = plan.llegada?.caso?.startsWith('free_tour_no_se_pone')
  const r = comprobarViaje({ D, plan, etiqueta, entradas: c.entradas ?? {}, poolNames: [], hasFreeTour: Boolean(c.hasFreeTour) && !sinTour, listas: written, franjas: written.destino?.franjas })
  for (const f of r.fallos) debe(false, f.regla, f.texto)
  comprobaciones++
  if (dV?.curatedDay?.id) {
    const rv = comprobarViaje({ D, plan: { ...plan, days: [...plan.days, dV] }, etiqueta, entradas: c.entradas ?? {}, poolNames: [], hasFreeTour: Boolean(c.hasFreeTour) && !sinTour, listas: written, franjas: written.destino?.franjas })
    const marca = `· ${dV.hours?.dateIso ?? `día ${dV.dayNumber}`} ${dV.curatedDay.id}:`
    for (const f of rv.fallos) {
      if (!f.texto.includes(marca)) continue
      if (!c.fechas && /^cerrado$/.test(f.regla)) continue // (sin fechas no se sabe el día de la semana: ya se ignora en la prueba de la vuelta)
      if (/dentro_dos_veces/.test(f.regla) && c.reservas?.length) continue // (una reserva grande el día de vuelta puede repetir lo de dentro: lo cubre la prueba de la vuelta)
      debe(false, f.regla, f.texto)
    }
  }

  // 2. Ningún día escrito de ruta repetido (ni el día de vuelta, si es «un día más»).
  const ids = idsDeRuta(plan)
  debe(new Set(ids).size === ids.length, 'dias_repetidos', `${etiqueta}: un día de ruta sale dos veces: ${ids.join(',')}`)
  if (dV?.curatedDay?.id && plan.vuelta.contenido === 'dia_mas') debe(!ids.includes(dV.curatedDay.id), 'dia_mas_repetido', `${etiqueta}: «un día más» (${dV.curatedDay.id}) ya está en la ruta (${ids.join(',')})`)

  // 3. Paradas repetidas entre días. Permitido: un imprescindible (nivel 1) que vuelve a salir como parada corta, lo de camino/por fuera y las nocturnas (no son paradas de día).
  // Los días escritos del documento se solapan a veces entre sí (la Plaza de San Pedro en la Cúpula del D6, las calles de la ruta del centro y las del D4): eso viene de las listas y ya pasa con solo la llegada
  // o con solo la vuelta. Lo que esta prueba vigila es lo NUEVO que trae juntarlas: un par (sitio, día, día) que no sale con ninguna de las dos por separado, que no sea un imprescindible que vuelve corto.
  const clavePar = (x) => `${x.lugar}|${x.antes.dia.split('|')[0]}|${x.ahora.dia}`
  const rep = repetidasEntreDias(plan)
  const deLlegada = c.soloLlegada ? new Set(repetidasEntreDias(c.soloLlegada).map(clavePar)) : new Set()
  let deVuelta = null
  for (const x of rep) {
    const permitido = x.nivel === 1 && (x.ahora.min ?? 99) <= 60
    const clave = `${x.lugar} · nivel ${x.nivel} · ${x.antes.dia.split('|')[0]} → ${x.ahora.dia}`
    informe.repetidas.set(clave, (informe.repetidas.get(clave) ?? 0) + 1)
    if (permitido || deLlegada.has(clavePar(x))) continue
    if (c.soloVuelta && !deVuelta) deVuelta = new Set(repetidasEntreDias(c.soloVuelta()).map(clavePar))
    debe(Boolean(deVuelta?.has(clavePar(x))), 'parada_repetida', `${etiqueta}: «${x.lugar}» (nivel ${x.nivel}) sale en ${x.antes.dia.split('|')[0]} (${x.antes.min} min) y otra vez en ${x.ahora.dia} (${x.ahora.min} min), y con solo la llegada o solo la vuelta no pasa`)
  }

  // 4. Las reservas, a su hora (en la ruta o en el día de vuelta), y la reserva no desaparece.
  for (const rv of c.reservas ?? []) {
    const filas = todosLosDias(plan).flatMap((d) => filasDe(d)).filter((f) => f.lugar === rv.name && f.tipo === 'parada' && !f.llegada && !f.cerrado_este_dia)
    const hay = filas.some((f) => normHora(f.hora_fija ?? f.hora) === normHora(rv.time))
    const aviso = [...(plan.llegada?.avisos ?? []), ...(plan.vuelta?.avisos ?? [])].some((a) => a.sitio === rv.name || String(a.texto ?? '').includes(rv.name))
    const cerrado = todosLosDias(plan).flatMap((d) => filasDe(d)).some((f) => f.lugar === rv.name && f.cerrado_este_dia)
    debe(hay || aviso || cerrado || rv.opcional, 'reserva_intacta', `${etiqueta}: la reserva de ${rv.name} a las ${rv.time} no sale a su hora (${filas.map((f) => `${f.hora_fija ?? f.hora ?? '-'}`).join(', ') || 'no sale'})`)
  }

  // 5. La comida, entre las 12:00 y las 15:00 (las mismas excepciones que la prueba de la llegada).
  const comidaYaApuntada = (d) => r.info.some((i) => i.regla === 'comida_tarde' && i.texto.includes(` ${d.curatedDay.id}:`))
  for (const d of todosLosDias(plan)) {
    if (comidaYaApuntada(d)) continue
    if (filasDe(d).filter((f) => f.hora_fija && !f.llegada).length >= 2) continue
    for (const co of filasDe(d).filter((f) => f.tipo === 'comida')) {
      const conMuseos = filasDe(d).some((f) => f.lugar === MUSEOS && f.hora_tipo === 'reserva' && f.hora_fija >= '12:00' && f.hora_fija <= '13:00')
      debe((co.t0 >= 12 * 60 || (conMuseos && co.t0 >= 11 * 60 + 15)) && co.t0 <= 15 * 60, 'comida_hora', `${etiqueta}: ${d.curatedDay.id} comida a las ${toHHMM(co.t0)}`)
    }
  }

  // 6. 0 nocturnas repetidas (las de los días de ruta y las del día de vuelta).
  const nocturnas = [...(plan.nightsByDay?.values?.() ?? [])].flat().map((e) => e.name)
  const delVuelta = (dV?.escritoNights ?? []).map((e) => e.name)
  debe(new Set([...nocturnas, ...delVuelta]).size === nocturnas.length + delVuelta.length, 'nocturnas_repetidas', `${etiqueta}: nocturnas repetidas ${[...nocturnas, ...delVuelta].join(', ')}`)

  // 7. Los imprescindibles que se quedan en el viaje no se quitan: cada «nunca se quita» que sale en el viaje solo con llegada sale también con las dos (aquí o en el día de vuelta).
  if (c.soloLlegada) {
    const conLlegada = new Set(todosLosDias(c.soloLlegada).flatMap((d) => filasDe(d)).filter((f) => f.tipo === 'parada' && !f.llegada && NUNCA_SE_QUITA.has(f.lugar)).map((f) => f.lugar))
    const conAmbas = new Set([...todosLosDias(plan).flatMap((d) => filasDe(d)), ...plan.days.flatMap((d) => d.spareRows ?? [])].filter((f) => NUNCA_SE_QUITA.has(f.lugar)).map((f) => f.lugar))
    for (const lugar of conLlegada) debe(conAmbas.has(lugar), 'imprescindible_quitado', `${etiqueta}: «${lugar}» salía con solo la llegada y con las dos ya no sale`)
    // Los días de ruta no cambian por el día de vuelta (salvo las noches del último día con una salida de madrugada y lo que mueve una reserva grande del día de vuelta).
    if (!(c.reservas ?? []).length && plan.vuelta && !plan.vuelta.aMano) {
      const madrugada = plan.vuelta.madrugada === true
      const solo = sinLaNocturnaDelUltimo(resumenDePlan(c.soloLlegada).dias, madrugada)
      const ambas = sinLaNocturnaDelUltimo(resumenDePlan(plan).dias, madrugada)
      const cual = solo.map((d, i) => Object.keys(d).filter((k) => JSON.stringify(d[k]) !== JSON.stringify(ambas[i]?.[k])).map((k) => `día ${i + 1}: ${k}`)).flat().join(', ')
      debe(JSON.stringify(solo) === JSON.stringify(ambas), 'ruta_cambia_por_la_vuelta', `${etiqueta}: la vuelta (${plan.vuelta.contenido}) cambia los días de ruta que salían con solo la llegada (${cual})`)
    }
  }

  // 8. El día que se cae al llegar no se pierde (la vuelta de las 23:00 o más lo recupera) y, si la vuelta no lo permite, no se repite.
  const caido = plan.llegada?.hooks?.vuelta?.vuelve_como_dia_mas ?? null
  if (caido && plan.vuelta && !plan.vuelta.aMano && !ids.includes(caido)) {
    const lleva = plan.vuelta.lleva
    const sinReservaGrandeEnVuelta = !(c.reservas ?? []).some((rv) => rv.enVuelta && rv.grande)
    if (lleva === 'dia_mas' && sinReservaGrandeEnVuelta && plan.vuelta.contenido !== 'excursion') {
      const bien = plan.vuelta.contenido === 'dia_mas' && plan.vuelta.diaMas?.lista === caido && plan.vuelta.diaMas?.origen === 'cayo_al_llegar'
      if (bien) informe.recuperados++
      else informe.noRecuperados.push(etiqueta)
      debe(bien, 'dia_caido_no_vuelve', `${etiqueta}: el día ${caido} se cayó al llegar y la vuelta de las 23:00 o más lo debería traer como «un día más» (sale ${plan.vuelta.contenido} ${JSON.stringify(plan.vuelta.diaMas)})`)
    } else {
      debe(!ids.includes(caido) && !(plan.vuelta.contenido === 'dia_mas' && dV?.curatedDay?.id === caido), 'dia_caido_repetido', `${etiqueta}: el día ${caido} (caído al llegar) sale en el día de vuelta sin que la vuelta lo permita (${lleva})`)
    }
  }
  if (plan.vuelta?.diaMas) informe.origenDiaMas[plan.vuelta.diaMas.origen] = (informe.origenDiaMas[plan.vuelta.diaMas.origen] ?? 0) + 1

  // 9. Los textos: sin empresas, sin «taxi», sin «Día n», sin huecos y con horas que sean del viajero.
  const delViajero = new Set([c.llegada?.hora, c.vuelta?.hora, c.ft, '10:00', '12:00', '15:00', '17:00', ...(c.reservas ?? []).map((rv) => rv.time), ...(c.horasExtra ?? [])].filter(Boolean).map(normHora))
  const textosLlegada = [...(plan.llegada?.avisos ?? []), ...(plan.llegada?.resumen ?? [])].map((x) => x.texto).filter(Boolean)
  const V = plan.vuelta
  const textosVuelta = V ? [V.tarjeta?.texto, V.tarjeta?.desde_tu_zona?.texto, V.maleta?.texto, V.ultimaTarde?.texto, V.tardeLibre?.texto, V.resumen?.plantilla, ...(V.avisos ?? []).map((a) => a.texto)].filter(Boolean) : []
  for (const t of [...textosLlegada, ...textosVuelta]) {
    debe(!PROHIBIDO.test(t), 'texto_prohibido', `${etiqueta}: «${t}»`)
    // ({dia} y {dia:N} son huecos que rellena la pantalla con la fecha del día: los dos formatos valen.)
    debe(!/\{(?!dia(:\d)?\})/.test(t), 'texto_huecos', `${etiqueta}: hueco sin rellenar en «${t}»`)
    for (const m of t.matchAll(/(\d{1,2}):(\d{2})/g)) {
      const h = `${Number(m[1])}:${m[2]}`
      debe(delViajero.has(h), 'hora_calculada_en_texto', `${etiqueta}: la hora ${h} de «${t}» no es del viajero`)
    }
  }
}

// ═══ 1. Los 20 viajes de la revisión × una vuelta de cada fila ═══
if (quiere('cruce')) {
  console.log('1. Los 20 viajes con su llegada × una vuelta de cada fila de la tabla')
  for (const v of VIAJES) {
    const ll = LLEGADAS_20[v.n]
    const soloLlegada = planListasTrip(argsDeViaje(v, { llegada: ll }))
    for (const vv of VUELTAS_FILAS) {
      const etiqueta = `viaje ${v.n} (${v.dias}d ${v.inicio}${v.ft ? ` FT ${v.ft}` : ''}) llega ${ll.hora} ${ll.puntoId} · vuelve ${vv.hora} (${vv.fila})`
      let plan
      try { plan = planListasTrip(argsDeViaje(v, { llegada: ll, vuelta: vuelta(vv.hora) })) } catch (error) { debe(false, 'excepcion', `${etiqueta}: ${error.message}`); continue }
      const noche = v.ft === '19:00' || v.ft === '21:00'
      revisar(plan, { etiqueta, llegada: ll, vuelta: vuelta(vv.hora), ft: v.ft, entradas: ['12:00', '15:00', '17:00'].includes(v.ft) ? { [FT]: v.ft } : {}, hasFreeTour: Boolean(v.ft) && !noche, soloLlegada, soloVuelta: () => planListasTrip(argsDeViaje(v, { vuelta: vuelta(vv.hora) })), fechas: true })
    }
  }
}

// ═══ 2. Los 10 viajes con vuelta de la revisión × una llegada de cada fila (las 20 de la revisión) ═══
if (quiere('cruce2')) {
  console.log('2. Los 10 viajes con vuelta × las 20 llegadas de la revisión')
  for (const v of VIAJES_VUELTA) {
    const base = { n: v.dias, inicio: v.inicio, ft: v.ft ?? null, diaCuatro: v.diaCuatro ?? null }
    for (const [k, ll] of Object.entries(LLEGADAS_20)) {
      const etiqueta = `vuelta ${v.n} (${v.dias}d ${v.inicio}${v.ft ? ` FT ${v.ft}` : ''}, vuelve ${v.vuelo}) × llegada ${k} (${ll.hora} ${ll.puntoId})`
      let plan, soloLlegada
      try {
        soloLlegada = planEscenario(base, { llegada: ll })
        plan = planEscenario(base, { llegada: ll, vuelta: vuelta(v.vuelo) })
      } catch (error) { debe(false, 'excepcion', `${etiqueta}: ${error.message}`); continue }
      const noche = v.ft === '19:00' || v.ft === '21:00'
      revisar(plan, { etiqueta, llegada: ll, vuelta: vuelta(v.vuelo), ft: v.ft, entradas: ['12:00', '15:00', '17:00'].includes(v.ft) ? { [FT]: v.ft } : {}, hasFreeTour: Boolean(v.ft) && !noche, soloLlegada, soloVuelta: () => planEscenario(base, { vuelta: vuelta(v.vuelo) }), fechas: true })
    }
  }
}

// ═══ 3. La rejilla: de 1 a 7 noches, verano e invierno, con y sin fechas, con Free Tour y excursión ═══
if (quiere('rejilla')) {
  const MUESTRAS = Number(args.muestras ?? 500)
  console.log(`3. La rejilla: ${MUESTRAS} viajes con llegada y vuelta a la vez (siempre los mismos)`)
  let semilla = 20261014
  const azar = () => { semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const elige = (lista) => lista[Math.floor(azar() * lista.length)]
  const INICIOS = ['2027-06-08', '2027-08-14', '2026-11-04', '2026-10-25', '2027-03-26', '2026-12-24', '2026-12-30', '2027-04-05', '2027-01-10', '2027-05-22', '2026-12-25', '2027-01-06', '2027-10-30', null, null, null]
  const LLEGADAS = ['00:30', '04:59', '07:00', '08:40', '09:50', '10:00', '11:30', '12:40', '13:30', '14:20', '15:30', '18:00', '19:40', '20:50', '22:30', '23:40']
  const VUELTAS = ['00:30', '03:00', '05:00', '06:30', '08:59', '09:00', '11:00', '13:29', '13:30', '14:59', '15:00', '16:59', '17:00', '19:30', '22:59', '23:00', '23:30']
  const PUNTOS = [{ medio: 'avion', puntoId: 'fco' }, { medio: 'avion', puntoId: 'fco' }, { medio: 'avion', puntoId: 'cia' }, { medio: 'tren', puntoId: 'termini' }, { medio: 'tren', puntoId: 'tiburtina' }, { medio: 'bus', puntoId: 'tibus' }, { medio: 'ferry', puntoId: 'civitavecchia' }, { medio: 'avion', puntoId: null }]
  const MODOS = { avion: 'flight', tren: 'train', bus: 'bus', ferry: 'ferry' }
  const FTS = [null, null, null, '10:00', '12:00', '15:00', '17:00', '19:00', '21:00', 'sin']
  const ZONAS = ['centro', 'plaza_de_espana', 'prati', 'trastevere', 'monti', 'termini', 'nose', null]
  for (let k = 0; k < MUESTRAS; k++) {
    const n = 1 + Math.floor(azar() * 7)
    const inicio = elige(INICIOS)
    const mes = inicio ? null : elige([0, 2, 5, 9, 10])
    const horaLl = elige(LLEGADAS)
    const horaV = elige(VUELTAS)
    const pLl = elige(PUNTOS)
    const pV = elige(PUNTOS)
    let ft = n >= 2 ? elige(FTS) : null
    const sinHora = ft === 'sin'
    if (sinHora) ft = '10:00'
    const explicito = ft && ['10:00', '12:00', '15:00', '17:00'].includes(ft) && !sinHora && azar() < 0.5
    const diaCuatro = n === 4 ? elige(['roma', 'excursion']) : n >= 5 ? 'excursion' : null
    const esc = { n, inicio, mes, ft, diaCuatro, entradas: explicito || (ft && ['12:00', '15:00', '17:00'].includes(ft)) ? { [FT]: ft } : {} }
    const ll = { hora: horaLl, medio: pLl.medio, puntoId: pLl.puntoId, zona: elige(ZONAS) }
    const vv = { hora: horaV, modo: MODOS[pV.medio], puntoId: pV.puntoId, zona: elige(ZONAS) }
    const etiqueta = `#${k} ${n}n ${inicio ?? `mes${mes}`} FT=${sinHora ? 'sin hora' : ft ?? '-'} d4=${diaCuatro ?? '-'} llega ${horaLl} ${pLl.puntoId ?? pLl.medio} · vuelve ${horaV} ${pV.puntoId ?? pV.medio}`
    let plan, soloLlegada
    try {
      soloLlegada = planEscenario(esc, { llegada: ll })
      plan = planEscenario(esc, { llegada: ll, vuelta: vv })
    } catch (error) { debe(false, 'excepcion', `${etiqueta}: ${error.message}`); continue }
    const noche = ft === '19:00' || ft === '21:00'
    revisar(plan, { etiqueta, llegada: ll, vuelta: vv, ft, entradas: esc.entradas, hasFreeTour: Boolean(ft) && !noche, soloLlegada, soloVuelta: () => planEscenario(esc, { vuelta: vv }), fechas: Boolean(inicio) })
  }
}

// ═══ 4. Reservas grandes y pequeñas en el día de llegada y en el de vuelta, a la vez ═══
if (quiere('reservas')) {
  console.log('4. Reservas grandes y pequeñas en la llegada y en la vuelta a la vez')
  // (La fecha de cada caso: el primer día desde el 8 de junio en que los sitios reservados abren el día 1 y el día de vuelta —los Museos no abren el domingo ni la Galería el lunes—, y sin miércoles
  // para los Museos, que tiene sus propias listas. Una reserva en un día en que el sitio cierra la avisa el motor y no cuenta como «a su hora».)
  const abierto = (name, iso) => {
    const d = new Date(`${iso}T12:00:00Z`).getUTCDay()
    return !(name === MUSEOS && (d === 0 || d === 3)) && !(name === GALERIA && d === 1)
  }
  const inicioAbierto = (n, r1, r2) => {
    for (let k = 0; k < 14; k++) {
      const iso = sumarDias('2027-06-08', k)
      if (abierto(r1, iso) && abierto(r2, sumarDias(iso, n))) return iso
    }
    return '2027-06-08'
  }
  const casos = [
    // [n, llegada, reserva de la llegada (día 1), reserva de la vuelta (día n+1)]
    [3, '09:00', [COLISEO, '14:30'], [MUSEOS, '09:30']],
    [3, '08:00', [MUSEOS, '10:30'], [COLISEO, '10:00']],
    [4, '10:30', [GALERIA, '16:00'], [COLISEO, '09:30']],
    [4, '07:30', [COLISEO, '11:00'], [GALERIA, '10:00']],
    [5, '16:00', [COLISEO, '17:30'], [MUSEOS, '09:30']],
    [2, '09:30', [MUSEOS, '12:00'], [COLISEO, '09:00']],
    [3, '12:00', ['Panteón', '16:30'], [COLISEO, '10:30']],
    [3, '09:00', [COLISEO, '10:30'], ['Panteón', '09:30']],
    [4, '13:00', ['Altar de la Patria', '17:00'], [MUSEOS, '09:00']],
    [6, '09:00', [COLISEO, '12:00'], [GALERIA, '10:00']],
  ]
  const GRANDES = new Set([COLISEO, MUSEOS, GALERIA])
  for (const vv of ['14:00', '17:30', '23:30']) {
    for (const [n, horaLl, r1, r2] of casos) {
      const inicio = inicioAbierto(n, r1[0], r2[0])
      const esc = { n, inicio, diaCuatro: n === 4 ? 'roma' : n >= 5 ? 'excursion' : null }
      const dVuelta = n + 1
      const mk = ([name, time], dia) => ({ name, dayNumber: dia, dateIso: sumarDias(inicio, dia - 1), time })
      const rv1 = mk(r1, 1)
      const rv2 = mk(r2, dVuelta)
      const grandes = [rv1, rv2].filter((x) => GRANDES.has(x.name))
      const pequenas = [rv1, rv2].filter((x) => !GRANDES.has(x.name))
      const escR = { ...esc, reservasGrandes: grandes, reservasViaje: pequenas, entradas: Object.fromEntries([rv1, rv2].map((x) => [x.name, x.time])) }
      const etiqueta = `${n}n llega ${horaLl} (${r1[0]} ${r1[1]} el día 1) · vuelve ${vv} (${r2[0]} ${r2[1]} el día ${dVuelta})`
      const ll = { hora: horaLl, medio: 'avion', puntoId: 'fco', zona: 'centro' }
      let plan, soloLlegada
      try {
        soloLlegada = planEscenario(escR, { llegada: ll })
        plan = planEscenario(escR, { llegada: ll, vuelta: vuelta(vv) })
      } catch (error) { debe(false, 'excepcion', `${etiqueta}: ${error.message}`); continue }
      // (Una reserva del día 1 antes de estar libre, o la de la vuelta después de la hora de salir, la avisa el motor y se queda donde está: no es un fallo.)
      revisar(plan, { etiqueta, llegada: ll, vuelta: vuelta(vv), entradas: escR.entradas, hasFreeTour: false, soloLlegada, soloVuelta: () => planEscenario(escR, { vuelta: vuelta(vv) }), fechas: true, reservas: [{ ...rv1, opcional: true, grande: GRANDES.has(rv1.name) }, { ...rv2, enVuelta: true, grande: GRANDES.has(rv2.name), opcional: true }], horasExtra: [] })
      // La reserva de la vuelta, si cabe antes de salir (hora de salir = vuelo − 3:00), sale a su hora en el día de vuelta.
      const salir = toMin(vv) - 180
      const cabe = toMin(r2[1]) + 30 <= salir
      if (plan.vuelta && !plan.vuelta.aMano && cabe) {
        const hay = todosLosDias(plan).some((d) => d.dayNumber === dVuelta && filasDe(d).some((f) => f.lugar === r2[0] && normHora(f.hora_fija ?? f.hora) === normHora(r2[1])))
        const avisada = (plan.vuelta?.avisos ?? []).some((a) => String(a.texto ?? '').includes(r2[0]) || a.sitio === r2[0])
        debe(hay || avisada, 'reserva_vuelta_a_su_hora', `${etiqueta}: la reserva de ${r2[0]} del día de vuelta no sale a las ${r2[1]} ni se avisa`)
      }
      // La reserva de la llegada, si cabe (el viajero ya está libre unas 2 h después de llegar), sale a su hora el día 1.
      const libre = toMin(horaLl) + 120
      if (toMin(r1[1]) >= libre + 30) {
        const d1 = plan.days.find((d) => d.dayNumber === 1)
        const hay = filasDe(d1).some((f) => f.lugar === r1[0] && normHora(f.hora_fija ?? f.hora) === normHora(r1[1])) || todosLosDias(plan).some((d) => filasDe(d).some((f) => f.lugar === r1[0] && normHora(f.hora_fija ?? f.hora) === normHora(r1[1])))
        const avisada = (plan.llegada?.avisos ?? []).some((a) => String(a.texto ?? '').includes(r1[0]) || a.sitio === r1[0])
        debe(hay || avisada, 'reserva_llegada_a_su_hora', `${etiqueta}: la reserva de ${r1[0]} del día 1 no sale a las ${r1[1]} ni se avisa`)
      }
    }
  }
}

// ═══ 5. Gratis, ruta a mano y una sola de las dos: lo que no se usa no cambia nada ═══
if (quiere('apagado')) {
  console.log('5. Gratis (pago: false), ruta a mano y solo una de las dos')
  for (const n of [1, 2, 3, 4, 5]) {
    for (const ft of [null, '10:00', '21:00']) {
      if (n === 1 && ft) continue
      for (const [horaLl, horaV] of [['09:00', '23:30'], ['16:00', '14:00'], ['21:30', '17:30']]) {
        const esc = { n, inicio: '2027-06-08', ft, diaCuatro: n === 4 ? 'roma' : n >= 5 ? 'excursion' : null }
        const base = huellaDePlan(planEscenario(esc))
        const ll = { hora: horaLl, medio: 'avion', puntoId: 'fco', zona: 'centro' }
        const vv = vuelta(horaV)
        const etiqueta = `${n}n FT ${ft ?? '-'} llega ${horaLl} vuelve ${horaV}`
        // Gratis: ni la llegada ni la vuelta se usan.
        const gratis = planEscenario(esc, { llegada: { ...ll, pago: false }, vuelta: { ...vv, pago: false } })
        debe(huellaDePlan(gratis) === base && !gratis.llegada && !gratis.vuelta, 'gratis_igual', `${etiqueta}: en la versión gratis los días no son los de sin vuelos`)
        // Ruta a mano: los días de ruta no cambian (la vuelta solo da avisos).
        const aMano = planEscenario(esc, { llegada: { ...ll, aMano: true }, vuelta: { ...vv, aMano: true } })
        debe(huellaDePlan(aMano) === base && !aMano.llegada, 'a_mano_igual', `${etiqueta}: en la ruta a mano los días de ruta no son los de sin vuelos`)
        // Solo la vuelta: los días de ruta, iguales que sin vuelos (menos las noches del último día si es de madrugada).
        const soloV = planEscenario(esc, { vuelta: vv })
        const madr = soloV.vuelta?.madrugada === true
        debe(JSON.stringify(sinLaNocturnaDelUltimo(resumenDePlan(soloV).dias, madr)) === JSON.stringify(sinLaNocturnaDelUltimo(resumenDePlan(planEscenario(esc)).dias, madr)), 'solo_vuelta_cambia_ruta', `${etiqueta}: con solo la vuelta cambian los días de ruta`)
        debe(Boolean(soloV.vuelta) && !soloV.llegada, 'solo_vuelta_publica', `${etiqueta}: con solo la vuelta debe salir \`vuelta\` y no \`llegada\``)
        // Solo la llegada: no hay `vuelta`.
        const soloL = planEscenario(esc, { llegada: ll })
        debe(Boolean(soloL.llegada) && !soloL.vuelta, 'solo_llegada_publica', `${etiqueta}: con solo la llegada debe salir \`llegada\` y no \`vuelta\``)
      }
    }
  }
}

// ═══ 6. Los ganchos entre las dos: el día que se cae al llegar ═══
if (quiere('ganchos')) {
  console.log('6. El día que se cae al llegar y la vuelta')
  let recuperados = 0
  for (const n of [3, 4, 5, 6, 7]) {
    for (const inicio of ['2027-06-08', '2027-01-12', null]) {
      for (const horaLl of ['14:30', '16:00', '19:00']) {
        const esc = { n, inicio, mes: inicio ? null : 5, diaCuatro: n === 4 ? 'roma' : n >= 5 ? 'excursion' : null }
        const ll = { hora: horaLl, medio: 'avion', puntoId: 'fco', zona: 'centro' }
        const soloL = planEscenario(esc, { llegada: ll })
        const caido = soloL.llegada?.hooks?.vuelta?.vuelve_como_dia_mas
        const etiqueta = `${n}n ${inicio ?? 'sin fechas'} llega ${horaLl}`
        if (!caido) continue
        debe(!idsDeRuta(soloL).includes(caido), 'gancho_incoherente', `${etiqueta}: el día caído ${caido} sale en la ruta (${idsDeRuta(soloL).join(',')})`)
        for (const vv of VUELTAS_FILAS) {
          const plan = planEscenario(esc, { llegada: ll, vuelta: vuelta(vv.hora) })
          const ids = idsDeRuta(plan)
          const dV = diaVuelta(plan)
          if (vv.hora === '23:30') {
            const bien = plan.vuelta.contenido === 'dia_mas' && plan.vuelta.diaMas?.lista === caido && plan.vuelta.diaMas?.origen === 'cayo_al_llegar'
            debe(bien, 'dia_caido_vuelve', `${etiqueta} · vuelve ${vv.hora}: el día ${caido} no vuelve como «un día más» (${plan.vuelta.contenido} ${JSON.stringify(plan.vuelta.diaMas)})`)
            if (bien) recuperados++
            // Y es el mismo día que sin vuelta: el gancho de la llegada no cambia por tener vuelta.
            debe(plan.llegada.hooks.vuelta.vuelve_como_dia_mas === caido, 'gancho_cambia', `${etiqueta}: el gancho de la llegada cambia al poner la vuelta`)
          } else {
            debe(!ids.includes(caido) && !(plan.vuelta.contenido === 'dia_mas' && dV?.curatedDay?.id === caido), 'dia_caido_repetido', `${etiqueta} · vuelve ${vv.hora}: el día ${caido} no debería volver (la vuelta no es de «un día más»)`)
          }
        }
        // Con solo la vuelta (sin llegada) el D1 no cae: «un día más» es otro día que el viaje no lleva (nunca uno que ya está).
        const soloV = planEscenario(esc, { vuelta: vuelta('23:30') })
        if (soloV.vuelta?.diaMas) debe(!idsDeRuta(soloV).includes(soloV.vuelta.diaMas.lista), 'dia_mas_repetido', `${etiqueta}: solo vuelta: «un día más» (${soloV.vuelta.diaMas.lista}) ya está en la ruta`)
        // El gancho de la petición (cliente que ya sabe qué día cayó) sigue valiendo SIN llegada puesta.
        const porPeticion = planEscenario(esc, { vuelta: vuelta('23:30', { diaCaidoAlLlegar: caido }) })
        debe(porPeticion.vuelta?.diaMas?.lista === caido && porPeticion.vuelta.diaMas.origen === 'cayo_al_llegar' || idsDeRuta(porPeticion).includes(caido), 'gancho_peticion', `${etiqueta}: \`vuelta.diaCaidoAlLlegar\` de la petición no se usa (${JSON.stringify(porPeticion.vuelta?.diaMas)})`)
      }
    }
  }
  debe(recuperados > 0, 'gancho_sin_casos', 'ningún día caído recuperado: la prueba no comprueba nada')
  console.log(`   días caídos recuperados como «un día más»: ${recuperados}`)
}

// ═══ 7. El servidor: la petición con `llegada` y `vuelta` ═══
if (quiere('servidor')) {
  console.log('7. El servidor: buildDayBlockV3 con llegada y vuelta')
  const base = { city: 'Roma', scheduler: 'v3', engine: 'v4' }
  const pide = (n, dayNumber, inicio, extra = {}) => buildDayBlockV3(D, n + 1, false, dayNumber, null, inicio, [], [], { ...base, ...extra })
  const ll = { hora: '15:30', medio: 'avion', puntoId: 'fco', zona: 'centro' }
  for (const [n, inicio, horaV] of [[3, '2027-05-05', '23:30'], [4, '2027-06-08', '23:30'], [3, '2027-05-05', '10:00'], [3, '2027-05-05', '17:00'], [2, '2027-06-08', '23:30']]) {
    const vv = { hora: horaV, modo: 'flight', puntoId: 'fco', zona: 'centro' }
    const solo = [] // los días con solo la llegada, para ver que la vuelta no cambia los de ruta
    for (let d = 1; d <= n; d++) solo.push(await pide(n, d, inicio, { llegada: ll }))
    for (let d = 1; d <= n + 1; d++) {
      const etiqueta = `servidor ${n}n ${inicio} llega ${ll.hora} vuelve ${horaV} · día ${d}`
      try {
        const day = await pide(n, d, inicio, { llegada: ll, vuelta: vv })
        debe(Boolean(day) && typeof day === 'object', 'servidor_dia', `${etiqueta}: no devuelve un día`)
        if (!day) continue
        if (d <= n) {
          if (d === 1) debe(Boolean(day.arrival_plan) && day.arrival_plan.es_dia_1 !== undefined || Boolean(day.arrival_plan), 'servidor_llegada', `${etiqueta}: el día 1 no lleva \`arrival_plan\``)
          // (Las horas del día de vuelta no cambian los días de ruta —lo que sí puede cambiar es la noche del último día con una salida de madrugada—.)
          if (d < n) debe(JSON.stringify(day.stops) === JSON.stringify(solo[d - 1].stops), 'servidor_ruta_igual', `${etiqueta}: el día cambia por la vuelta`)
        } else {
          debe(day.is_return_leg === true && Boolean(day.return_day), 'servidor_vuelta', `${etiqueta}: el día de vuelta no sale (\`is_return_leg\`)`)
          debe(day.return_day?.interno === undefined, 'servidor_vuelta', `${etiqueta}: el día de vuelta enseña lo interno`)
          if (horaV === '23:30') debe((day.stops ?? []).length > 0, 'servidor_vuelta', `${etiqueta}: «un día más» sin paradas`)
        }
      } catch (error) { debe(false, 'servidor_excepcion', `${etiqueta}: ${error.message}`) }
    }
  }
  // Solo la vuelta (sin llegada) y solo la llegada: cada una sigue funcionando sola por el servidor.
  const soloV = await pide(3, 4, '2027-05-05', { vuelta: { hora: '10:00', modo: 'flight', puntoId: 'fco', zona: 'centro' } })
  debe(soloV?.is_return_leg === true && soloV.title === 'Día de viaje', 'servidor_solo_vuelta', 'solo la vuelta: el día de vuelta no es «Día de viaje»')
  const soloL = await pide(3, 1, '2027-05-05', { llegada: ll })
  debe(Boolean(soloL?.arrival_plan), 'servidor_solo_llegada', 'solo la llegada: el día 1 no lleva `arrival_plan`')
  const ninguna = await pide(3, 4, '2027-05-05', {})
  debe(ninguna == null, 'servidor_ninguna', 'sin llegada ni vuelta, el día de vuelta sigue sin pedirse al motor (null)')
}

// ═══ El informe ═══
console.log(`\n${planes} viajes revisados · ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
console.log('Casos de la llegada vistos:', Object.entries(informe.casosLlegada).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' '))
console.log('Contenido del día de vuelta:', Object.entries(informe.contenidoVuelta).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' '))
console.log('«Un día más» por origen:', JSON.stringify(informe.origenDiaMas), `· recuperados al revisar viajes: ${informe.recuperados}`)
if (informe.repetidas.size) {
  console.log(`Paradas repetidas entre días (${informe.repetidas.size} pares distintos):`)
  for (const [k, v] of [...informe.repetidas.entries()].sort((a, b) => b[1] - a[1]).slice(0, VER)) console.log(`   ${v}× ${k}`)
}
if (fallos.length) {
  console.log('\nFALLOS POR REGLA:', JSON.stringify(porRegla))
  const vistos = new Set()
  for (const f of fallos) {
    if (vistos.size >= VER) break
    const clave = `${f.regla}`
    console.log(` - [${f.regla}] ${f.texto}`)
    vistos.add(clave + vistos.size)
  }
  process.exitCode = 1
} else console.log('0 fallos')
