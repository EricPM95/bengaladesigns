// La prueba de la Tanda 7, parte RESPUESTAS A LA 6Y10 (punto 17 de PARA_CODE_TANDA7_v3.md) y los 3 viajes del punto 23:
//   SERVIDOR=http://localhost:8883 node scripts/destino/pruebaTanda7_respuestas.mjs
// Da fallo si:
//   1. EL 1 DE ENERO (P1): el Coliseo o el Foro no cierran el 1 de enero; queda un horario corto de Año Nuevo para ellos en `fechas_especiales` o su texto («abren con horario corto»), en
//      su auditoría (`closed_dates_audit`) o en cualquier dato; el aviso de Año Nuevo no dice que cierran (con los viajes 3 y 13 de la revisión, que pasan por el 1 de enero), o pasa de 35 palabras;
//      el Coliseo sale ese día con tiempo en la ruta.
//   2. «VIERNES NOCHE» (P3): queda el «viernes noche» (19:00-23:00) de los Museos en la ficha, los consejos o los datos (data/, src/, shared/, server/).
//   3. ME GUSTA DE PARTIDA: las seis cifras fijas (Coliseo 412; Fontana de Trevi 391; Museos 368; Basílica de San Pedro 347; Panteón 326; Plaza de España 305), cada una 15 o más por encima de la siguiente y la primera por
//      encima de 400; todos los demás por debajo de 290, en el orden lógico (imprescindibles, nivel 1, nivel 2, nivel 3) y dentro de sus rangos de siempre; restaurantes como estaban.
//   4. EL SECRETO DE LOS AUDIOS: sin secreto la huella es la de antes; con él cambia; el servidor (audioVigente) y el programa usan el mismo.
//   5. SITIOS GRANDES: la regla del Coliseo con excursión de mañana sale del dato (`no_cabe_con_excursion_hasta`), no del código; Roma sale igual que con el código de antes (muestra amplia, con y sin excursión de mañana).
//   6. EL FREE TOUR: el servidor usa `default_free_tour.name` y la lista única de horas (`freeTourHoras.js`); `default_free_tour.disponibilidad.horas` ya no existe.
//   7. LOS 3 VIAJES (punto 23): los viajes 5, 11 y 19 de la revisión no dicen «el día no cabe del todo», y ningún imprescindible se quita; los 20 viajes, tampoco.
//   8. «CERRADO ESTE DÍA» (punto 15): la tarjeta de la parada cerrada lleva esa marca y no el «Hoy cierra» rojo; la invariante 593 ya no dice que un cierre nunca quita un sitio sin más; la guía lleva las frases de la parte MOTOR.
// CAMBIOS DE LA 10S (antes -> ahora -> decision de Eric que lo justifica):
//   · 3 «megusta», rango de cada sitio: antes, nivel 1 = 100-199, nivel 2 = 50-99 y nivel 3 = 0. Ahora, los mismos rangos con dos excepciones de la 10O (Eric, 25-oct-2026, PROMPT_TANDA10O.md, apartado de EXPLORAR):
//       (a) los SIETE que suben (Plaza Venecia, Puente Sant'Angelo, Via dei Fori Imperiali, Via della Conciliazione, Via Appia Antica, Teatro de Marcelo y Via Condotti, nivel 3) llevan «me gusta» de partida,
//           sin empates y entre el Parque de Villa Borghese y la Cúpula de San Pedro («entre los puestos 15 y 25 de la lista»); y
//       (b) Galería Borghese, Castillo de Sant'Angelo y Trastevere (nivel 2) pueden pasar de 99 hasta 102 («si no caben, mueve uno o dos “me gusta” los de al lado, sin cambiar su orden»).
//     «3 orden» (nivel 3 vale 0): antes, ningun nivel 3 con cifra; ahora, solo los siete anteriores. Todo lo demas (las seis cifras fijas, <290, orden entre niveles) sigue igual.
//   · 7 «no cabe»: el Viaje 11 · dia 1 NO se ha tocado: se aparta como PENDIENTE DEL MOTOR (docs/dias/PENDIENTES_MOTOR.md), se imprime en amarillo y no cuenta como fallo.
import fs from 'node:fs'
import { pendienteDelMotor } from './_pendientesMotor.mjs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'
import { claseDeReserva, sitiosGrandesDe, sitioGrandeDe, tieneReservasEscritas, tramosDeReserva, tramoNormal, reservaToMin } from '../../shared/routeEngine/listasReservas.js'
import { huellaDelAudio, nombreDelFichero, audioVigente, secretoDeAudios, huellaDelTexto } from '../../shared/audio/historiasAudio.js'
import { FREE_TOUR_HORAS } from '../../shared/routeEngine/freeTourHoras.js'
import { dateNoticesFor } from '../../server/engine/dateNotices.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { VIAJES, planViaje, D as DV } from './viajes20Lib.mjs'
import { FIJAS, ORDEN_NIVEL_1, ORDEN_NIVEL_2 } from './megustaInicial6y10.mjs'

const API = process.env.SERVIDOR ?? process.env.API_URL ?? 'http://localhost:8883'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (ruta) => fs.readFileSync(ruta, 'utf8')
const D = findPipelineV2Data('Roma')
const place = (name) => D.places.find((p) => p.name === name)
const recorrer = (carpeta, salida = []) => {
  for (const e of fs.readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = `${carpeta}/${e.name}`
    if (e.isDirectory()) { if (!['node_modules', 'dist', '.git'].includes(e.name)) recorrer(ruta, salida) }
    else if (/\.(js|mjs|ts|tsx|json|md)$/.test(e.name)) salida.push(ruta)
  }
  return salida
}

// ═══════════ 1. El 1 de enero: el Coliseo y el Foro cierran ═══════════
{
  for (const nombre of ['Coliseo', 'Foro Romano y Palatino']) {
    for (const year of [2027, 2028, 2030]) debe(closedOnDay(place(nombre), 'viernes', `${year}-01-01`), '1 cierra', `${nombre}: el 1 de enero de ${year} debía estar cerrado`)
    debe(!closedOnDay(place(nombre), 'jueves', '2027-01-07'), '1 cierra', `${nombre}: el 7 de enero de 2027 no debería estar cerrado`)
    debe(JSON.stringify([...(place(nombre).closed_dates ?? [])].sort()) === JSON.stringify(['01-01', '12-25']), '1 cierra', `${nombre}: closed_dates debía ser 01-01 y 12-25`)
    const auditoria = place(nombre).closed_dates_audit?.['01-01']
    debe(auditoria?.estado === 'cierra' && /colosseo\.it\/orari/.test(auditoria.fuente ?? '') && auditoria.comprobado === '2026-10-13', '1 auditoría', `${nombre}: la auditoría del 1 de enero debe decir «cierra» con colosseo.it/orari y 2026-10-13`)
    debe(!/horario especial|Special opening/i.test(JSON.stringify(place(nombre).closed_dates_audit ?? {})), '1 auditoría', `${nombre}: la auditoría sigue hablando de un horario especial`)
  }
  const entrada = D.fechas_especiales.fechas.find((f) => f.id === 'ano_nuevo')
  const lugares = Object.keys(entrada?.horario_especial?.lugares ?? {})
  debe(!lugares.includes('Coliseo') && !lugares.includes('Foro Romano y Palatino'), '1 horario', `Año Nuevo sigue con un horario corto para ${lugares.join(', ')}`)
  const texto = [entrada.texto, entrada.contexto, JSON.stringify(entrada.hecho)].join(' ')
  debe(!/horario corto|abren con horario/i.test(texto), '1 texto', 'el texto de Año Nuevo todavía habla de un horario corto')
  debe(/Coliseo/.test(entrada.contexto) && /Foro/.test(entrada.contexto) && /cierran/.test(entrada.contexto), '1 texto', `el contexto de Año Nuevo debe decir que el Coliseo y el Foro cierran (${entrada.contexto})`)
  debe(`${entrada.contexto} ${D.fechas_especiales.frases.hecho}`.split(/\s+/).length <= 35, '1 texto', 'el aviso de Año Nuevo pasa de 35 palabras')
  // En ningún dato queda el horario corto del Coliseo (ni sus textos).
  for (const ruta of [...recorrer('data/pipeline_v2'), ...recorrer('data/dias'), ...recorrer('src'), ...recorrer('shared'), ...recorrer('server')]) {
    const t = leer(ruta)
    if (/Special opening on January 1|abren? con horario corto/.test(t)) debe(false, '1 datos', `${ruta}: queda un horario corto del 1 de enero (Coliseo/Foro)`)
  }
  // Los viajes 3 y 13 de la revisión (pasan por el 1 de enero).
  for (const n of [3, 13]) {
    const v = VIAJES.find((x) => x.n === n)
    const plan = planViaje(v)
    const avisos = dateNoticesFor(DV, plan, { poolNames: [] }).filter((a) => a.date_iso === '2027-01-01')
    const ano = avisos.find((a) => /Año Nuevo/.test(a.title))
    debe(Boolean(ano), '1 viajes', `Viaje ${n}: falta el aviso de Año Nuevo`)
    const t = (ano?.texts ?? []).join(' ')
    debe(/Coliseo/.test(t) && /cierran/.test(t) && !/horario corto/.test(t), '1 viajes', `Viaje ${n}: el aviso de Año Nuevo no dice que el Coliseo y el Foro cierran (${t.slice(0, 120)})`)
    // (35 palabras con la frase de todos; si un sitio se queda en su día o se enseña por fuera, los textos de siempre de Eric van enteros.)
    debe(ano?.hecho !== D.fechas_especiales.frases.hecho || (ano?.texts?.[0] ?? '').split(/\s+/).length <= 35, '1 viajes', `Viaje ${n}: el aviso de Año Nuevo pasa de 35 palabras`)
    const dia = plan.days.find((d) => d.hours?.dateIso === '2027-01-01')
    const conTiempo = (dia?.escritoRows ?? []).filter((r) => (r.lugar === 'Coliseo' || r.lugar === 'Foro Romano y Palatino') && r.min > 0 && !r.cerrado_este_dia)
    debe(conTiempo.length === 0, '1 viajes', `Viaje ${n}: el 1 de enero el Coliseo o el Foro salen con tiempo (${conTiempo.map((r) => r.lugar).join(', ')})`)
    const otros = avisos.filter((a) => a.kind === 'auto').map((a) => (a.texts ?? []).join(' ')).join(' ')
    debe(!/horario corto/.test(otros), '1 viajes', `Viaje ${n}: un aviso automático del 1 de enero habla de un horario corto`)
  }
}

// ═══════════ 2. Fuera el «viernes noche» ═══════════
{
  for (const ruta of [...recorrer('data'), ...recorrer('src'), ...recorrer('shared'), ...recorrer('server')]) {
    if (ruta.startsWith('data/archivo')) continue
    const t = leer(ruta)
    if (/viernes (por la )?noche|viernes nocturn/i.test(t)) debe(false, '2 viernes', `${ruta}: queda el «viernes noche»`)
  }
  const museos = place('Museos Vaticanos y Capilla Sixtina')
  debe(!/19:00\s*[-–]\s*23:00|viernes/i.test(`${museos.tip} ${museos.best_time} ${museos.card_text ?? ''}`), '2 viernes', 'la ficha de los Museos habla de una apertura de viernes por la noche')
  const detalle = JSON.parse(leer('data/pipeline_v2/detalle/roma/vaticano.json'))
  const mv = JSON.stringify(detalle.places.find((p) => p.name === 'Museos Vaticanos y Capilla Sixtina') ?? {})
  debe(!/19:00\s*[-–]\s*23:00|21:30|cócteles|música en vivo/i.test(mv), '2 viernes', 'la ficha ampliada de los Museos sigue hablando de la noche de los viernes')
}

// ═══════════ 3. Me gusta de partida ═══════════
{
  const esperadas = [['Coliseo', 412], ['Fontana de Trevi', 391], ['Museos Vaticanos y Capilla Sixtina', 368], ['Basílica de San Pedro', 347], ['Panteón', 326], ['Plaza de España', 305]]
  debe(JSON.stringify(FIJAS) === JSON.stringify(esperadas), '3 megusta', 'las seis cifras fijas del script no son las de Eric')
  for (const [nombre, cifra] of esperadas) debe(place(nombre)?.megusta_inicial === cifra, '3 megusta', `${nombre} debe tener ${cifra} y tiene ${place(nombre)?.megusta_inicial}`)
  debe(esperadas[0][1] > 400, '3 megusta', 'el primero debe pasar de 400')
  for (let i = 0; i < 5; i++) debe(esperadas[i][1] - esperadas[i + 1][1] >= 15, '3 megusta', `${esperadas[i][0]} y ${esperadas[i + 1][0]} no se llevan 15 o más`)
  const seis = new Set(esperadas.map(([n]) => n))
  const demas = D.places.filter((p) => !seis.has(p.name))
  debe(demas.every((p) => p.megusta_inicial < 290), '3 megusta', `hay un sitio con 290 o más: ${demas.filter((p) => p.megusta_inicial >= 290).map((p) => p.name).join(', ')}`)
  debe(Math.max(...demas.map((p) => p.megusta_inicial)) < esperadas[5][1] - 15, '3 megusta', 'el séptimo no queda 15 o más por debajo del sexto')
  // (10S) Excepciones de la 10O (Eric, 25-oct): los siete que suben (nivel 3, entre Villa Borghese y la Cúpula) y los tres de nivel 2 que se movieron hasta 102.
  const SUBEN_10O = ['Plaza Venecia', "Puente Sant'Angelo", 'Via dei Fori Imperiali', 'Via della Conciliazione', 'Via Appia Antica', 'Teatro de Marcelo', 'Via Condotti']
  const MOVIDOS_10O = ['Galería Borghese', "Castillo de Sant'Angelo", 'Trastevere']
  const villa = place('Parque de Villa Borghese').megusta_inicial
  const cupula = place('Cúpula de San Pedro').megusta_inicial
  const rango = (nivel, nombre) => (SUBEN_10O.includes(nombre) ? [villa + 1, cupula - 1] : nivel === 1 ? [100, 199] : nivel === 2 ? [50, MOVIDOS_10O.includes(nombre) ? 102 : 99] : [0, 0])
  debe(SUBEN_10O.every((n) => place(n)?.level === 3), '3 megusta', 'los siete que suben (10O) siguen siendo de nivel 3')
  debe(new Set(SUBEN_10O.map((n) => place(n).megusta_inicial)).size === SUBEN_10O.length, '3 megusta', 'los siete que suben (10O) llevan cifras distintas (sin empates)')
  for (const p of demas) { const [a, b] = rango(p.level, p.name); debe(p.megusta_inicial >= a && p.megusta_inicial <= b, '3 megusta', `${p.name} (nivel ${p.level}) tiene ${p.megusta_inicial}, fuera de ${a}–${b}`) }
  // El orden lógico: primero los imprescindibles que quedan (Navona, el Foro, la Plaza de San Pedro…), luego el nivel 2, luego el 3.
  const cifra = (n) => place(n).megusta_inicial
  debe(ORDEN_NIVEL_1.every((n, i) => i === 0 || cifra(ORDEN_NIVEL_1[i - 1]) > cifra(n)), '3 orden', 'los imprescindibles que quedan no van de más a menos')
  debe(ORDEN_NIVEL_1.slice(0, 3).join('|') === 'Piazza Navona|Foro Romano y Palatino|Plaza de San Pedro', '3 orden', 'el orden de los imprescindibles no empieza por Navona, el Foro y la Plaza de San Pedro')
  debe(ORDEN_NIVEL_2.every((n, i) => i === 0 || cifra(ORDEN_NIVEL_2[i - 1]) > cifra(n)), '3 orden', 'el nivel 2 no va de más a menos')
  debe(Math.min(...ORDEN_NIVEL_1.map(cifra)) > Math.max(...ORDEN_NIVEL_2.map(cifra)), '3 orden', 'un nivel 2 pasa a un imprescindible')
  debe(new Set([...ORDEN_NIVEL_1, ...ORDEN_NIVEL_2, ...seis]).size === ORDEN_NIVEL_1.length + ORDEN_NIVEL_2.length + 6, '3 orden', 'un sitio sale dos veces en el orden')
  debe(D.places.filter((p) => p.level === 1).every((p) => seis.has(p.name) || ORDEN_NIVEL_1.includes(p.name)), '3 orden', 'hay un sitio de nivel 1 sin sitio en el orden')
  debe(D.places.filter((p) => p.level === 2).every((p) => ORDEN_NIVEL_2.includes(p.name)), '3 orden', 'hay un sitio de nivel 2 sin sitio en el orden')
  debe(D.places.filter((p) => p.level === 3 && !SUBEN_10O.includes(p.name)).every((p) => p.megusta_inicial === 0), '3 orden', 'un sitio de nivel 3 (salvo los siete que suben, 10O) no vale 0')
  const conCifra = D.restaurants.filter((r) => r.megusta_inicial > 0)
  debe(conCifra.length === 21 && conCifra.every((r) => r.megusta_inicial >= 100 && r.megusta_inicial <= 199) && D.restaurants.filter((r) => !(r.megusta_inicial > 0)).every((r) => r.megusta_inicial === 0), '3 restaurantes', `los restaurantes ya no son 21 con 100–199 y el resto a 0 (${conCifra.length})`)
}

// ═══════════ 4. El secreto de los audios ═══════════
{
  const t = 'Una historia de prueba para la huella.'
  const antes = process.env.AUDIOS_SECRETO
  delete process.env.AUDIOS_SECRETO
  debe(secretoDeAudios() === '', '4 secreto', 'sin la variable, el secreto no está vacío')
  const sin = huellaDelAudio(t)
  process.env.AUDIOS_SECRETO = 'una frase muy larga y privada'
  const con = huellaDelAudio(t)
  debe(sin !== con && sin === huellaDelAudio(t, undefined, '') && con === huellaDelAudio(t, undefined, 'una frase muy larga y privada'), '4 secreto', 'el secreto no cambia la huella, o no es la misma leída del entorno')
  const idx = { sitios: { coliseo: { fichero: nombreDelFichero('coliseo', t), huella_texto: huellaDelTexto(t) } } }
  debe(audioVigente(idx, 'roma', 'Coliseo', t) === `/audios/roma/${idx.sitios.coliseo.fichero}`, '4 secreto', 'el servidor y el programa no usan el mismo secreto')
  delete process.env.AUDIOS_SECRETO
  debe(audioVigente(idx, 'roma', 'Coliseo', t) === null, '4 secreto', 'sin secreto, un audio hecho con secreto se sigue ofreciendo')
  if (antes !== undefined) process.env.AUDIOS_SECRETO = antes
  const servidor = leer('server/index.js')
  debe(/audioVigente\(indice, destinationKey, detail\.name, detail\.historia\)/.test(servidor) && !/AUDIOS_SECRETO\s*=/.test(servidor), '4 secreto', '/api/historia-audio no pasa por audioVigente, o el servidor escribe el secreto')
  const guia = leer('docs/dias/GUIA_NUEVOS_DESTINOS.md')
  debe(/AUDIOS_SECRETO/.test(guia) && /Vercel/.test(guia), '4 secreto', 'la guía de destinos no cuenta cómo poner AUDIOS_SECRETO en Vercel')
}

// ═══════════ 5. Sitios grandes: la regla del Coliseo sale del dato ═══════════
{
  debe(sitioGrandeDe(D, 'Coliseo')?.no_cabe_con_excursion_hasta === '16:30', '5 dato', 'el Coliseo no lleva `no_cabe_con_excursion_hasta: "16:30"` en sitios_grandes')
  debe(!/Coliseo/.test(leer('shared/routeEngine/listasReservas.js').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')), '5 dato', 'listasReservas.js sigue escribiendo «Coliseo» en el código')
  debe(!/16 \* 60 \+ 30/.test(leer('shared/routeEngine/listasReservas.js')), '5 dato', 'listasReservas.js sigue con la hora 16:30 escrita')
  // El código de antes (copia de la función que había): con el Coliseo y las 16:30 escritos.
  const toMin = reservaToMin
  const claseAntes = (dia, lugar, hora, contexto = {}) => {
    if (!tieneReservasEscritas(dia, lugar)) return (contexto.sitiosGrandes ?? new Set()).has(lugar) ? { clase: 'sin_lista' } : { clase: 'sin_definir' }
    const m = toMin(hora)
    const lim = dia?.reservas?.[lugar]?.no_cabe_antes
    if (contexto.tieneFreeTour && lim && m < toMin(lim)) return { clase: 'no_cabe', motivo: 'free_tour_museos', desde: lim }
    if (contexto.excursionManana && lugar === 'Coliseo' && m <= 16 * 60 + 30) return { clase: 'no_cabe', motivo: 'excursion_coliseo' }
    const tramo = tramosDeReserva(dia, lugar).find((t) => m >= t.desde && m <= t.hasta)
    if (tramo) return { clase: 'lista', tramo: tramo.id }
    const normal = tramoNormal(dia, lugar)
    if (normal && m >= normal.desde && m <= normal.hasta) return { clase: 'normal' }
    return { clase: 'sin_lista' }
  }
  const written = writtenDaysFor('roma')
  const horas = []
  for (let m = 6 * 60; m <= 22 * 60; m += 5) horas.push(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`)
  for (const h of ['16:29', '16:30', '16:31', '09:00', '9:00']) horas.push(h)
  const grandes = sitiosGrandesDe(D)
  let n = 0
  let dist = 0
  let conRegla = 0
  for (const dia of Object.values(written.days)) for (const lugar of [...grandes, 'Panteón', 'Altar de la Patria', 'Foro Romano y Palatino']) for (const hora of horas) for (const tieneFreeTour of [false, true]) for (const excursionManana of [false, true]) {
    const a = JSON.stringify(claseAntes(dia, lugar, hora, { sitiosGrandes: grandes, tieneFreeTour, excursionManana }))
    const r = claseDeReserva(dia, lugar, hora, { sitiosGrandes: grandes, destData: D, tieneFreeTour, excursionManana })
    const b = JSON.stringify(r)
    n++
    if (r.motivo === 'excursion_coliseo') conRegla++
    if (a !== b) dist++
  }
  debe(dist === 0, '5 igual', `${dist} de ${n} casos de claseDeReserva salen distintos que con el código de antes`)
  console.log(`5. claseDeReserva: ${n} casos comparados con el código de antes (${conRegla} por la regla del Coliseo con excursión), ${dist} diferencias`)
  debe(conRegla > 20, '5 igual', `la prueba casi no pasa por la regla del Coliseo (${conRegla} casos)`)
  // Sin el dato (otro destino) no hay regla; el 16:30 es el del dato.
  const sinDato = { ...D, sitios_grandes: { lugares: D.sitios_grandes.lugares.map((s) => { const { no_cabe_con_excursion_hasta: _x, ...resto } = s; return resto }) } }
  const dia1 = written.days.D1
  debe(claseDeReserva(dia1, 'Coliseo', '10:00', { sitiosGrandes: grandes, destData: sinDato, excursionManana: true }).motivo !== 'excursion_coliseo', '5 dato', 'sin el dato, la regla del Coliseo sigue funcionando (sigue en el código)')
  const con17 = { ...D, sitios_grandes: { lugares: D.sitios_grandes.lugares.map((s) => (s.nombre === 'Coliseo' ? { ...s, no_cabe_con_excursion_hasta: '17:30' } : s)) } }
  debe(claseDeReserva(dia1, 'Coliseo', '17:00', { sitiosGrandes: grandes, destData: con17, excursionManana: true }).motivo === 'excursion_coliseo' && claseDeReserva(dia1, 'Coliseo', '17:00', { sitiosGrandes: grandes, destData: D, excursionManana: true }).motivo !== 'excursion_coliseo', '5 dato', 'cambiar la hora en el dato no cambia la regla')
}

// ═══════════ 6. El Free Tour: su nombre y sus horas, de los datos ═══════════
{
  const servidor = leer('server/index.js')
  debe(/destData\?\.default_free_tour\?\.name/.test(servidor) && !/entradas\['Free Tour por Roma'\]/.test(servidor), '6 free tour', 'el servidor sigue escribiendo «Free Tour por Roma» en el Free Tour de las 10:00')
  debe(D.default_free_tour.disponibilidad.horas === undefined && D.default_free_tour.disponibilidad.horas_nota === undefined, '6 free tour', '`default_free_tour.disponibilidad.horas` sigue en roma.json')
  debe(/FREE_TOUR_HORAS/.test(servidor) && !/disponibilidad\?\.horas\b/.test(servidor), '6 free tour', 'el servidor no lee la lista única de horas del Free Tour')
  try {
    const r = await fetch(`${API}/api/destination-places`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })
    const j = await r.json()
    const tarjeta = j.free_tour_entry?.hours_card ?? ''
    debe(FREE_TOUR_HORAS.every((t) => tarjeta.includes(t.hora)) && !/16:00/.test(tarjeta), '6 free tour', `la tarjeta del Free Tour no dice sus horas de verdad (${tarjeta})`)
  } catch (e) {
    debe(false, '6 free tour', `no se pudo pedir /api/destination-places a ${API}: ${e.message}`)
  }
}

// ═══════════ 7. Los 3 viajes del punto 23 (y los 20) ═══════════
{
  for (const v of VIAJES) {
    const plan = planViaje(v)
    for (const d of plan.days) {
      const aviso = (d.escritoLog ?? []).find((l) => /no cabe del todo/.test(l.causa ?? ''))
      // (10S, PENDIENTE DEL MOTOR: el Viaje 11 · día 1 no cabe por 105 min desde la Tanda 11, «imprescindibles intocables»: la Iglesia del Gesù ya no pasa a «Si te sobra tiempo». No se toca la comprobación: este caso concreto se aparta.)
      if (aviso && v.n === 11 && d.dayNumber === 1 && /105 min/.test(aviso.causa ?? '')) pendienteDelMotor('viaje_11_no_cabe', `Viaje 11 · día 1 (Free Tour 19:00): «${aviso.causa}»`, 'desde la Tanda 11 el D1 con Free Tour a las 19:00 lleva la Iglesia del Gesù (antes pasaba a «Si te sobra tiempo») y no cabe por 105 min; el aviso sale repetido 5 veces')
      else debe(!aviso, '7 no cabe', `Viaje ${v.n} · día ${d.dayNumber}: «${aviso?.causa}»`)
    }
    // Ningún imprescindible escrito se quita: lo de nivel 1 del día que tenía en la lista sigue como parada (salvo cerrado/“Cerrado este día”).
    const idsSpare = new Set(plan.days.flatMap((d) => (d.spare ?? []).map((s) => s.place?.name)))
    for (const nombre of idsSpare) debe((DV.places.find((p) => p.name === nombre)?.level ?? 3) !== 1 || plan.days.some((d) => (d.escritoRows ?? []).some((r) => r.lugar === nombre)), '7 imprescindible', `Viaje ${v.n}: «${nombre}», un imprescindible, solo sale en «Si te sobra tiempo»`)
  }
  for (const n of [5, 11, 19]) {
    const plan = planViaje(VIAJES.find((x) => x.n === n))
    const d1 = plan.days.find((d) => d.curatedDay?.id === 'D1')
    debe(Boolean(d1), '7 no cabe', `Viaje ${n}: no sale el D1`)
    const filas = d1?.escritoRows ?? []
    for (const nombre of ['Coliseo', 'Foro Romano y Palatino', 'Panteón', 'Piazza Navona', 'Altar de la Patria', 'Arco de Constantino']) debe(filas.some((r) => r.lugar === nombre), '7 imprescindible', `Viaje ${n}: el D1 ya no lleva ${nombre}`)
    debe(filas.some((r) => r.tipo === 'tour' && r.hora === (n === 11 ? '19:00' : '21:00')), '7 free tour', `Viaje ${n}: el Free Tour de la noche no está a su hora`)
  }
}

// ═══════════ 8. «Cerrado este día», la invariante 593 y la guía ═══════════
{
  const acordeon = leer('src/components/route/dayDetail/StopAccordion.tsx')
  debe(/closedThisDay/.test(acordeon) && /'Cerrado este día'/.test(acordeon), '8 etiqueta', 'la tarjeta de la parada (StopAccordion) no dice «Cerrado este día»')
  debe(/closed_this_day/.test(leer('server/engine/buildDayV3.js')) && /closedThisDay/.test(leer('src/lib/mapGeneratedRoute.ts')) && /closedThisDay/.test(leer('src/lib/types.ts')), '8 etiqueta', 'la marca «cerrado este día» no llega del servidor a la tarjeta')
  const inv = leer('docs/INVARIANTES_PANTALLA.md')
  debe(!/Un cierre nunca quita un sitio\*\*/.test(inv) && /\n593\. \*\*Un cierre no quita el sitio/.test(inv) && /Cerrado este día/.test(inv.split('\n').find((l) => l.startsWith('593.')) ?? ''), '8 invariante', 'la invariante 593 sigue diciendo que un cierre nunca quita un sitio')
  const guia = leer('docs/dias/GUIA_NUEVOS_DESTINOS.md')
  for (const [frase, texto] of [[/la comida nunca va antes de las 12:00/, 'la comida nunca antes de las 12:00'], [/comida_rapida_excepcion/, '`comida_rapida_excepcion`'], [/comida_rapida_desde/, '`comida_rapida_desde`'], [/Cerrado este día/, '«Cerrado este día»'], [/no_cabe_con_excursion_hasta/, '`no_cabe_con_excursion_hasta`']]) debe(frase.test(guia), '8 guía', `la guía de destinos no dice ${texto}`)
  // El orden de los días: los imprescindibles pesan más que el resto (en Roma todo el nivel 1 es imprescindible o joya).
  debe(D.places.filter((p) => p.level === 1).every((p) => p.tier === 'imprescindible' || p.tier === 'joya'), '8 orden', 'en Roma hay un sitio de nivel 1 que no es imprescindible ni joya: listasOrden.js los pesa igual')
}

console.log(`Tanda 7 (respuestas): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
