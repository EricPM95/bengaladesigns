// La prueba de la tanda HOY3 (5-nov-2026): LOS AVISOS DEL VIAJE CON EL MÓVIL BLOQUEADO, con RELOJ DE MENTIRA.
//   node scripts/destino/pruebaTandaHOY3.mjs                      (las partes 1 a 6 no abren navegador)
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY3.mjs   (con la parte 7: un Chrome por vez, que se cierra al acabar; SIN_NAVEGADOR=1 la salta)
// Hace falta docs/dias/_hoy3_ruta_eric.json (el viaje de Eric en Lanzarote; lo vuelca scripts/destino/_hoy3_volcarRutaEric.mjs). NO arranca ningún servidor.
//   1. El viaje de Eric, día a día, con la hora y el texto de cada aviso (hora de Canarias).
//   2. La hora de Canarias: un aviso «a las 9:26» llega a las 9:26 de Lanzarote (no de la Península), invierno y verano; el reloj de mentira.
//   3. Los límites: como mucho 4 al día, nada de noche (salvo la llegada).
//   4. El turno solo si lo hay; el tiempo solo si toca (lluvia, nubes, viento); la mañana lleva el tiempo de hoy; Roma no lleva avisos del tiempo.
//   5. Si la ruta cambia, los avisos del día se recalculan.
//   6. El servicio (base de datos y web-push de mentira): sin pase ninguno, interruptor apagado ninguno, nada repetido, fallo → se reintenta, día de prueba, la ruta del cron y la de prueba del administrador, sin textos de Roma.
//   7. Las piezas del móvil (service worker, abrir HOY, Ajustes) y, con navegador, la tarjeta de iPhone y que `calcularAvisos` (TypeScript) y el puerto del servidor dicen lo mismo.
import fs from 'node:fs'
import vm from 'node:vm'
import { crearServicioAvisosViaje, registrarRutasAvisosViaje } from '../../server/avisosViaje.js'
import { addDias, avisosDebidos, avisosDelTiempoDeUnDia, fraseDelTiempo, horaCorta, instanteDe, localDe, MAX_AL_DIA, planDelViaje, tituloDelDia } from '../../shared/avisos/avisosDelViaje.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const clonar = (x) => JSON.parse(JSON.stringify(x))
const FIXTURE = 'docs/dias/_hoy3_ruta_eric.json'
if (!fs.existsSync(FIXTURE)) {
  console.error(`Falta ${FIXTURE}: córrelo con node scripts/destino/_conCola.mjs node scripts/destino/_hoy3_volcarRutaEric.mjs`)
  process.exit(2)
}
const { route: ERIC, reservations: RESERVAS_ERIC } = JSON.parse(leer(FIXTURE))
const DATOS = { tiempo: JSON.parse(leer('data/hoy/avisos_tiempo.json')), atardecer: JSON.parse(leer('src/data/sitiosDeAtardecer.json')) }
const CANARIAS = 'Atlantic/Canary'
const ROMA = /Roma|Fiumicino|Ciampino|Termini|Pante[óo]n|Trastevere|Vaticano|Coliseo|Trevi|Pincio|Jan[ií]culo|Cap[ií]tolio|Tiburtina|Civitavecchia/i

/** Una previsión de mentira: 24 horas, con lo que se pida en cada hora. */
const meteoCon = ({ nubes = [], lluvia = [], viento = [] } = {}) => ({
  probability: Array.from({ length: 24 }, (_, h) => (lluvia.includes(h) ? 90 : 0)),
  precipitation: Array.from({ length: 24 }, (_, h) => (lluvia.includes(h) ? 2 : 0)),
  cloud: Array.from({ length: 24 }, (_, h) => (nubes.includes(h) ? 95 : 0)),
  gust: Array.from({ length: 24 }, (_, h) => (viento.includes(h) ? 70 : 10)),
})
const plan = (route = ERIC, extra = {}) => planDelViaje({ route, reservations: [], zona: CANARIAS, datos: DATOS, ...extra })
const de = (lista, tipo, dia) => lista.filter((a) => a.tipo === tipo && (!dia || a.diaFecha === dia))
const hhmm = (a) => `${String(Math.floor(a.min / 60)).padStart(2, '0')}:${String(a.min % 60).padStart(2, '0')}`

/* ─────────────────────────── 1. El viaje de Eric ─────────────────────────── */
console.log('1. El viaje de Eric en Lanzarote (domingo 8 → viernes 13), hora de Canarias')
const LISTA = plan()
{
  debe(ERIC.destination === 'Lanzarote' && ERIC.answers.dateRange.start === '2026-11-08' && ERIC.arrivalFlightTime === '08:25' && ERIC.departureFlightTime === '19:40', 'viaje', 'la ruta de la prueba es la de Eric: Lanzarote, 8 → 13 de noviembre, aterriza a las 8:25 y vuela de vuelta a las 19:40')
  const esperado = [
    ['2026-11-08', 'llegada', '08:35', 'Bienvenido a Lanzarote. Cuando tengas el coche, empiezas hacia las 11:25.'],
    ['2026-11-08', 'atardecer', '17:04', 'Hoy el sol se pone a las 18:04.'],
    ['2026-11-09', 'manana', '07:30', 'Buenos días. Hoy toca Fuego y mar: sal de casa a las 7:51.'],
    ['2026-11-09', 'atardecer', '17:04', 'Hoy el sol se pone a las 18:04. Desde El Golfo se ve precioso.'],
    ['2026-11-10', 'manana', '08:56', 'Buenos días. Hoy toca El norte de Manrique: sal de casa a las 9:26.'],
    ['2026-11-11', 'manana', '08:14', 'Buenos días. Hoy toca La Graciosa: sal de casa a las 8:44.'],
    ['2026-11-12', 'manana', '08:17', 'Buenos días. Hoy toca Papagayo y Playa Blanca: sal de casa a las 8:47.'],
    ['2026-11-12', 'atardecer', '17:02', 'Hoy el sol se pone a las 18:02. Desde el Faro de Pechiguera se ve precioso.'],
    ['2026-11-13', 'vuelta_manana', '09:08', 'Hoy vuelves a casa. Devuelve el coche en la T1 antes de las 17:10.'],
    ['2026-11-13', 'vuelta_salir', '15:17', 'En media hora tienes que salir hacia el aeropuerto.'],
  ]
  for (const [fecha, tipo, hora, texto] of esperado) {
    const a = LISTA.find((x) => x.tipo === tipo && x.fecha === fecha)
    debe(a && hhmm(a) === hora && (a.texto === texto || a.texto.startsWith(texto)), 'lista', `${fecha} ${hora} ${tipo}: «${texto}» (sale: ${a ? `${hhmm(a)} «${a.texto}»` : 'nada'})`)
  }
  debe(de(LISTA, 'turno').length === 0, 'turno', 'sin reservas apuntadas no hay ningún «Sal ahora para tu turno»')
  debe(de(LISTA, 'tiempo_noche').length === 0 && !LISTA.some((a) => /llover|nubes|viento/.test(a.texto)), 'tiempo', 'sin previsión no hay ningún aviso del tiempo (ni la noche antes ni en la mañana)')
  debe(de(LISTA, 'manana', '2026-11-08').length === 0, 'llegada', 'el día de llegada no lleva el aviso de la mañana (ya vas de camino): lleva el de la llegada')
  debe(de(LISTA, 'atardecer', '2026-11-13').length === 0, 'vuelta', 'el día que vuelves a casa no hay aviso del atardecer')
  debe(LISTA.every((a) => !ROMA.test(a.texto)), 'roma', 'ningún texto de Roma en el viaje de Lanzarote')
  debe(LISTA.every((a) => a.texto.length <= 160 && /[.]$/.test(a.texto)), 'texto', 'todos son frases completas, con punto y que caben en un aviso del móvil (160 letras o menos)')
  debe(tituloDelDia({ title: 'La Graciosa (excursión)', curatedTitle: 'La Graciosa (excursión)' }) === 'La Graciosa' && tituloDelDia({ title: 'Fuego y mar: el sur volcánico' }) === 'Fuego y mar', 'texto', 'el título del día va sin paréntesis ni lo de detrás de los dos puntos')
  const claves = LISTA.map((a) => a.clave)
  debe(new Set(claves).size === claves.length, 'claves', 'cada aviso tiene su clave única (así no se manda dos veces)')
}

/* ─────────────────────────── 2. La hora de Canarias y el reloj de mentira ─────────────────────────── */
console.log('2. La hora de Canarias y el reloj de mentira')
{
  const manana10 = LISTA.find((a) => a.tipo === 'manana' && a.fecha === '2026-11-10')
  // En noviembre Canarias va a la hora de Greenwich (UTC+0) y la Península una hora por delante (UTC+1): las 8:56 de Lanzarote son las 8:56 UTC = las 9:56 de Madrid.
  debe(manana10.instante.toISOString() === '2026-11-10T08:56:00.000Z', 'canarias', `el aviso de las 8:56 de Lanzarote es el instante 08:56 UTC (sale ${manana10.instante.toISOString()})`)
  debe(instanteDe('2026-11-10', 8 * 60 + 56, 'Europe/Madrid').toISOString() === '2026-11-10T07:56:00.000Z', 'canarias', 'y las 8:56 de la Península serían una hora ANTES (07:56 UTC): no se mezclan')
  // En verano Canarias va a UTC+1 y la Península a UTC+2.
  const verano = clonar(ERIC)
  verano.answers.dateRange = { start: '2026-07-12', end: '2026-07-17' }
  const m = plan(verano).find((a) => a.tipo === 'manana' && a.fecha === '2026-07-14')
  debe(m && m.instante.toISOString() === '2026-07-14T07:56:00.000Z' && hhmm(m) === '08:56', 'canarias', `en verano las 8:56 de Lanzarote son las 07:56 UTC (sale ${m?.instante.toISOString()})`)
  debe(localDe(manana10.instante, CANARIAS).min === 8 * 60 + 56 && localDe(manana10.instante, 'Europe/Madrid').min === 9 * 60 + 56, 'canarias', 'el mismo instante son las 8:56 en Lanzarote y las 9:56 en la Península')
  // El reloj de mentira: el aviso sale en su minuto y no antes; vale hasta 30 min tarde.
  const en = (iso) => new Date(iso)
  debe(avisosDebidos(LISTA, en('2026-11-10T08:55:00Z')).length === 0, 'reloj', '08:55 en Lanzarote: todavía ninguno')
  debe(de(avisosDebidos(LISTA, en('2026-11-10T08:56:00Z')), 'manana').length === 1, 'reloj', '08:56: sale el de la mañana')
  debe(de(avisosDebidos(LISTA, en('2026-11-10T09:26:00Z')), 'manana').length === 1, 'reloj', '09:26 (30 min tarde): todavía vale')
  debe(de(avisosDebidos(LISTA, en('2026-11-10T09:27:00Z')), 'manana').length === 0, 'reloj', '09:27 (31 min tarde): ya no vale (no se manda un «sal de casa» pasada la hora)')
  const llegada = LISTA.find((a) => a.tipo === 'llegada')
  debe(llegada.instante.toISOString() === '2026-11-08T08:35:00.000Z', 'reloj', 'la llegada: aterriza a las 8:25 de Lanzarote y el aviso sale a las 8:35 (08:35 UTC)')
  // La Península en el mismo viaje no cambia nada: la zona la manda el viaje, no el móvil.
  const sinZona = planDelViaje({ route: ERIC, reservations: [], datos: DATOS })
  debe(sinZona.find((a) => a.tipo === 'manana' && a.fecha === '2026-11-10')?.instante.toISOString() === manana10.instante.toISOString(), 'canarias', 'sin darle la zona, usa la del propio viaje (zonaHorariaDia = Atlantic/Canary)')
  debe(addDias('2026-11-30', 1) === '2026-12-01' && addDias('2026-03-01', -1) === '2026-02-28', 'fechas', 'sumar días a una fecha cruza bien el fin de mes')
}

/* ─────────────────────────── 3. Los límites ─────────────────────────── */
console.log('3. Como mucho 4 al día y nada de noche')
{
  // Un día cargadísimo: la mañana, 6 reservas con hora, el atardecer y el tiempo de mañana.
  const cargado = clonar(ERIC)
  const dia = cargado.days.find((d) => d.dayNumber === 3)
  const res = ['10:30', '11:30', '12:30', '14:00', '15:00', '16:00'].map((time, i) => ({ id: `r${i}`, kind: 'entrada', name: `Entrada ${i}`, placeNames: [], dateIso: '2026-11-10', dayNumber: 3, time }))
  const lista = planDelViaje({ route: cargado, reservations: res, zona: CANARIAS, datos: DATOS, meteo: () => meteoCon({ nubes: [12, 13] }) })
  const porDia = new Map()
  for (const a of lista) porDia.set(a.fecha, (porDia.get(a.fecha) ?? 0) + 1)
  debe([...porDia.values()].every((n) => n <= MAX_AL_DIA), 'limite', `ningún día pasa de ${MAX_AL_DIA} avisos (el máximo es ${Math.max(...porDia.values())})`)
  const del10 = lista.filter((a) => a.fecha === '2026-11-10')
  debe(del10.length === 4, 'limite', `el día cargado se queda justo en 4 (tiene ${del10.length})`)
  debe(del10.filter((a) => a.tipo === 'turno').length === 4 && !del10.some((a) => a.tipo === 'manana' || a.tipo === 'atardecer'), 'limite', 'se caen los de menos prioridad: quedan los 4 turnos y se caen la mañana y el atardecer (los turnos pesan más)')
  // Nada de noche: ningún aviso entre las 22:00 y las 7:30 salvo la llegada.
  const todos = [...lista, ...LISTA]
  debe(todos.filter((a) => a.tipo !== 'llegada').every((a) => a.min >= 7 * 60 + 30 && a.min < 22 * 60), 'noche', 'ningún aviso (salvo la llegada) sale entre las 22:00 y las 7:30')
  // Un turno a las 7:40 («sal ahora» a las 7:10) no sale antes de las 7:30; uno a las 23:00 no sale.
  const temprano = clonar(ERIC)
  const t = planDelViaje({ route: temprano, reservations: [{ id: 'a', kind: 'entrada', name: 'Cueva', placeNames: [], dateIso: '2026-11-12', time: '07:40' }, { id: 'b', kind: 'entrada', name: 'Cena', placeNames: [], dateIso: '2026-11-12', time: '23:30' }], zona: CANARIAS, datos: DATOS })
  const turnos = de(t, 'turno', '2026-11-12')
  debe(turnos.length === 1 && turnos[0].min === 7 * 60 + 30, 'noche', `un turno de las 7:40 avisa a las 7:30 (no antes) y uno de las 23:30 no avisa nunca de noche (turnos: ${turnos.map(hhmm).join(', ')})`)
  // La llegada sí puede salir de noche: aterriza a las 02:00.
  const noche = clonar(ERIC)
  noche.arrivalFlightTime = '02:00'
  const l = de(plan(noche), 'llegada')[0]
  debe(l && hhmm(l) === '02:10', 'noche', 'el aviso de llegada es el único que puede salir de noche (aterrizaje 2:00 → aviso 2:10)')
  // Aterriza a las 23:55: el aviso cae pasada la medianoche, ya en el día siguiente (hora local).
  noche.arrivalFlightTime = '23:55'
  const l2 = de(plan(noche), 'llegada')[0]
  debe(l2 && l2.fecha === '2026-11-09' && hhmm(l2) === '00:05', 'noche', 'aterriza a las 23:55 → el aviso sale a las 0:05 del día siguiente (hora de Lanzarote)')
  // La mañana nunca antes de las 7:30 aunque se salga a las 7:00 (y entonces no dice «sal a las 7:00»).
  const madruga = clonar(ERIC)
  madruga.days.find((d) => d.dayNumber === 4).coche.ida.salir = '07:00'
  const mm = de(plan(madruga), 'manana', '2026-11-11')[0]
  debe(mm && mm.min === 7 * 60 + 30 && /es hora de salir de casa/.test(mm.texto) && !/7:00/.test(mm.texto), 'noche', 'salir a las 7:00 → el aviso sale a las 7:30 y dice «es hora de salir de casa» (no manda «sal a las 7:00» media hora tarde)')
}

/* ─────────────────────────── 4. El turno y el tiempo, solo si tocan ─────────────────────────── */
console.log('4. El turno solo si lo hay; el tiempo solo si toca')
{
  // El turno: la Cueva de los Verdes a las 11:30 del martes 10 (se viene del Jameos, a 3 min).
  const res = [{ id: 'cueva', kind: 'entrada', name: 'Cueva de los Verdes', placeNames: ['Cueva de los Verdes'], dateIso: '2026-11-10', dayNumber: 3, time: '11:30' }]
  const con = planDelViaje({ route: ERIC, reservations: res, zona: CANARIAS, datos: DATOS })
  const turno = de(con, 'turno', '2026-11-10')
  const cueva = ERIC.days[2].stops.find((s) => /Cueva de los Verdes/.test(s.name))
  const trayecto = cueva.trayectoCoche.minutos + (cueva.trayectoCoche.aparcar_min ?? 0)
  debe(turno.length === 1 && turno[0].texto === 'Sal ahora para llegar a tu turno de las 11:30.' && turno[0].min === 11 * 60 + 30 - trayecto, 'turno', `con la reserva de las 11:30: «Sal ahora para llegar a tu turno de las 11:30.» a la hora de salir (11:30 − ${trayecto} min = ${turno[0] ? hhmm(turno[0]) : '—'})`)
  debe(de(con, 'turno').length === 1 && de(plan(), 'turno').length === 0, 'turno', 'solo ese día y solo con la reserva: sin ella, ninguno')
  const otraFecha = planDelViaje({ route: ERIC, reservations: [{ ...res[0], dateIso: '2026-11-12', dayNumber: 5 }], zona: CANARIAS, datos: DATOS })
  debe(de(otraFecha, 'turno', '2026-11-10').length === 0 && de(otraFecha, 'turno', '2026-11-12').length === 1, 'turno', 'la reserva avisa el día de su fecha (no el de la parada que se llame igual)')
  const fuera = planDelViaje({ route: ERIC, reservations: [{ ...res[0], fueraDeRuta: true }], zona: CANARIAS, datos: DATOS })
  debe(de(fuera, 'turno').length === 0, 'turno', 'una reserva que ya no está en la ruta («Ya no está en tu ruta») no avisa')
  const conParada = clonar(ERIC)
  conParada.days[2].stops.find((s) => /Cueva de los Verdes/.test(s.name)).reservationTime = '11:30'
  debe(de(plan(conParada), 'turno', '2026-11-10').length === 1, 'turno', 'una parada con hora de reserva puesta por el motor (reservationTime) también avisa')

  // El tiempo, la noche antes (21:00). El martes 10 hay Mirador del Río a las 12:44 (horas 12 y 13); el miércoles, El Golfo y Los Hervideros.
  const sinNada = planDelViaje({ route: ERIC, reservations: [], zona: CANARIAS, datos: DATOS, meteo: () => meteoCon() })
  debe(de(sinNada, 'tiempo_noche').length === 0, 'tiempo', 'con un día tranquilo (sin lluvia, nubes ni viento) no hay aviso del tiempo')
  const nubes = planDelViaje({ route: ERIC, reservations: [], zona: CANARIAS, datos: DATOS, meteo: (f) => (f === '2026-11-10' ? meteoCon({ nubes: [12, 13] }) : meteoCon()) })
  const n = de(nubes, 'tiempo_noche')
  debe(n.length === 1 && n[0].fecha === '2026-11-09' && hhmm(n[0]) === '21:00' && n[0].diaFecha === '2026-11-10', 'tiempo', 'nubes en el Mirador del Río el martes → un solo aviso, el lunes a las 21:00')
  debe(n[0].texto === 'Mañana habrá nubes en el Mirador del Río. Te hemos preparado una alternativa en HOY.', 'tiempo', `el texto: «${n[0]?.texto}»`)
  const bajas = planDelViaje({ route: ERIC, reservations: [], zona: CANARIAS, datos: DATOS, meteo: (f) => (f === '2026-11-10' ? { ...meteoCon({ nubes: [12, 13] }), cloud: Array(24).fill(79) } : meteoCon()) })
  debe(de(bajas, 'tiempo_noche').length === 0, 'tiempo', 'con el 79 % de nubes bajas (umbral 80) no avisa: el umbral sale de avisos_tiempo.json')
  const lluvia = planDelViaje({ route: ERIC, reservations: [], zona: CANARIAS, datos: DATOS, meteo: (f) => (f === '2026-11-12' ? meteoCon({ lluvia: [10, 11, 12, 13] }) : meteoCon()) })
  const ll = de(lluvia, 'tiempo_noche')
  debe(ll.length === 1 && ll[0].fecha === '2026-11-11' && /^Mañana va a llover por la mañana\. Te hemos preparado una alternativa en HOY\.$/.test(ll[0].texto), 'tiempo', `lluvia por la mañana → «${ll[0]?.texto}»`)
  const viento = planDelViaje({ route: ERIC, reservations: [], zona: CANARIAS, datos: DATOS, meteo: (f) => (f === '2026-11-09' ? meteoCon({ viento: [15, 16] }) : meteoCon()) })
  const v = de(viento, 'tiempo_noche')
  debe(v.length === 1 && v[0].fecha === '2026-11-08' && /^Mañana habrá viento fuerte en Los Hervideros\./.test(v[0].texto), 'tiempo', `viento fuerte en Los Hervideros → «${v[0]?.texto}» (el domingo 8 a las 21:00, antes de empezar el viaje)`)
  // La mañana lleva el tiempo de HOY en el mismo mensaje.
  const hoyNubes = planDelViaje({ route: ERIC, reservations: [], zona: CANARIAS, datos: DATOS, meteo: (f) => (f === '2026-11-10' ? meteoCon({ nubes: [12, 13] }) : meteoCon()) })
  const m = de(hoyNubes, 'manana', '2026-11-10')[0]
  debe(m.texto === 'Buenos días. Hoy toca El norte de Manrique: sal de casa a las 9:26. Hoy hay nubes en el Mirador del Río. Te hemos preparado una alternativa en HOY.', 'tiempo', `la mañana lleva el tiempo de hoy en el mismo mensaje: «${m.texto}»`)
  debe(!de(hoyNubes, 'manana', '2026-11-09')[0].texto.includes('nubes'), 'tiempo', 'y los otros días, sin tiempo, no lo llevan')
  // Roma no lleva avisos del tiempo (el aviso de lluvia de Roma es el de la app).
  const roma = { destination: 'Roma', answers: { dateRange: { start: '2026-11-08', end: '2026-11-09' } }, defaultTransport: 'public', days: [{ id: 'd1', dayNumber: 1, title: 'Roma Antigua', stops: [{ id: 's1', time: '09:00', name: 'Coliseo', coordinates: { lat: 41.89, lng: 12.49 }, durationMinutes: 90 }] }] }
  const r = planDelViaje({ route: roma, reservations: [], zona: 'Europe/Rome', datos: DATOS, meteo: () => meteoCon({ lluvia: [9, 10], nubes: [9], viento: [9] }) })
  debe(de(r, 'tiempo_noche').length === 0 && r.every((a) => !/llover|nubes|viento/.test(a.texto)), 'roma', 'Roma no lleva avisos del tiempo en el móvil')
  debe(de(r, 'manana')[0]?.texto === 'Buenos días. Hoy toca Roma Antigua: empiezas a las 9:00.', 'roma', `y su mañana, sin coche: «${de(r, 'manana')[0]?.texto}»`)
  debe(r.every((a) => !/Lanzarote|coche|T1|Papagayo|Timanfaya/i.test(a.texto)), 'roma', 'ni textos de Lanzarote en Roma')
  // El puerto de calcularAvisos: sitio y alternativa.
  const dia3 = ERIC.days[2]
  const av = avisosDelTiempoDeUnDia(dia3, meteoCon({ nubes: [12], lluvia: [15] }), DATOS.tiempo)
  debe(av.map((a) => a.tipo).join() === 'lluvia,nubes' || av.map((a) => a.tipo).join() === 'nubes', 'tiempo', `el puerto de calcularAvisos da lluvia y nubes con esa previsión (da ${av.map((a) => a.tipo).join()})`)
  debe(fraseDelTiempo([], 'hoy') === '' && fraseDelTiempo(null, 'manana') === '', 'tiempo', 'sin avisos del tiempo, la frase está vacía')
}

/* ─────────────────────────── 5. Si la ruta cambia, se recalcula ─────────────────────────── */
console.log('5. Si la ruta cambia, los avisos del día se recalculan')
{
  const antes = LISTA.find((a) => a.tipo === 'manana' && a.fecha === '2026-11-10')
  const cambiada = clonar(ERIC)
  cambiada.days.find((d) => d.dayNumber === 3).coche.ida.salir = '10:15'
  const despues = plan(cambiada).find((a) => a.tipo === 'manana' && a.fecha === '2026-11-10')
  debe(antes.min === 8 * 60 + 56 && despues.min === 9 * 60 + 45 && /sal de casa a las 10:15/.test(despues.texto), 'recalculo', `salir a las 10:15 en vez de a las 9:26 → el aviso pasa de las 8:56 a las 9:45 y lo dice («${despues.texto}»)`)
  debe(antes.clave === despues.clave, 'recalculo', 'es el MISMO aviso (misma clave): si ya se mandó con la hora vieja no se repite, y si no, sale con la nueva')
  const otroDia = clonar(ERIC)
  otroDia.answers.dateRange = { start: '2026-11-09', end: '2026-11-14' }
  const movido = plan(otroDia).find((a) => a.tipo === 'manana' && a.fecha === '2026-11-11' && /norte de Manrique/.test(a.texto))
  debe(Boolean(movido) && !plan(otroDia).some((a) => a.tipo === 'manana' && a.fecha === '2026-11-10' && /norte de Manrique/.test(a.texto)), 'recalculo', 'si el viaje se mueve un día (otras fechas), «El norte de Manrique» pasa al día nuevo y el aviso del día viejo desaparece')
  const sinParada = clonar(ERIC)
  sinParada.days.find((d) => d.dayNumber === 3).stops.forEach((s) => {
    s.saltada = true
  })
  const s = plan(sinParada).filter((a) => a.diaFecha === '2026-11-10')
  debe(s.every((a) => a.tipo !== 'turno'), 'recalculo', 'una parada saltada no cuenta')
  const reservaNueva = planDelViaje({ route: ERIC, reservations: [{ id: 'nueva', kind: 'entrada', name: 'Cueva', placeNames: ['Cueva de los Verdes'], dateIso: '2026-11-10', time: '11:30' }], zona: CANARIAS, datos: DATOS })
  debe(de(plan(), 'turno').length === 0 && de(reservaNueva, 'turno').length === 1, 'recalculo', 'una reserva nueva añade su «Sal ahora» en el siguiente cálculo')
  const horaCambiada = planDelViaje({ route: ERIC, reservations: [{ id: 'nueva', kind: 'entrada', name: 'Cueva', placeNames: ['Cueva de los Verdes'], dateIso: '2026-11-10', time: '12:00' }], zona: CANARIAS, datos: DATOS })
  debe(de(horaCambiada, 'turno')[0].clave !== de(reservaNueva, 'turno')[0].clave, 'recalculo', 'si la reserva cambia de hora es otro turno (otra clave): avisa de la nueva')
}

/* ─────────────────────────── 6. El servicio ─────────────────────────── */
console.log('6. El servicio: pase, interruptor, nada repetido, reintentos, día de prueba, rutas')
const ENV = { PUSH_ACTIVO: 'true', VAPID_PUBLIC_KEY: 'clave-publica-de-mentira', VAPID_PRIVATE_KEY: 'clave-privada-de-mentira', VAPID_CONTACTO: 'mailto:prueba@example.test', CRON_SECRET: 'secreto-de-mentira' }
function mundo({ pases = [{ estado: 'activo', destino: 'Lanzarote' }], subs = [{ endpoint: 'https://push.example.test/1', claves: { p256dh: 'a', auth: 'b' } }], prueba = null, admins = [], route = ERIC, reservations = RESERVAS_ERIC, env = ENV, falloDeEnvio = null, meteos = {}, viajes = null } = {}) {
  const reservados = new Set()
  const enviados = []
  const borradas = []
  const llamadasTiempo = []
  const viaje = { trip_id: 't1', user_id: 'u1', route, bookings: { reservations } }
  const builder = (tabla) => {
    const b = {
      select: () => b,
      eq: () => b,
      maybeSingle: async () => ({ data: tabla === 'hoy_prueba' ? prueba : null, error: null }),
      then: (ok) => ok({ data: tabla === 'push_suscripciones' ? subs : [], error: null }),
    }
    return b
  }
  const rpcs = {
    pases_de: () => pases,
    viajes_en_curso_para_avisos: () => viajes ?? [viaje],
    avisos_viaje_reservar: (a) => {
      const k = `${a.p_uid}|${a.p_clave}`
      if (reservados.has(k)) return false
      reservados.add(k)
      return true
    },
    avisos_viaje_liberar: (a) => {
      reservados.delete(`${a.p_uid}|${a.p_clave}`)
      return null
    },
    borrar_suscripcion: (a) => {
      borradas.push(a.p_endpoint)
      return null
    },
  }
  const admin = { rpc: async (n, a) => ({ data: rpcs[n](a), error: null }), from: builder, auth: { getUser: async (t) => (t === 'token-admin' ? { data: { user: { id: 'u1', email: 'admin@example.test', is_anonymous: false } } } : t === 'token-otro' ? { data: { user: { id: 'u2', email: 'otro@example.test', is_anonymous: false } } } : { data: { user: null }, error: { message: 'no' } }) } }
  const webpush = { setVapidDetails() {}, sendNotification: async (sub, payload) => {
    if (falloDeEnvio) throw Object.assign(new Error('fallo'), falloDeEnvio)
    enviados.push({ sub, payload: JSON.parse(payload) })
  } }
  const servicio = crearServicioAvisosViaje({
    admin,
    destinos: { lanzarote: { destino: 'Lanzarote', timezone: CANARIAS } },
    env,
    cargarWebPush: async () => ({ default: webpush }),
    tiempo: async (coords, fecha) => {
      llamadasTiempo.push(fecha)
      return { value: meteos[fecha] ?? null }
    },
    datos: DATOS,
    esAdminDeCuenta: async (uid) => admins.includes(uid),
    marca: () => ({ nombre: 'JUTRIP' }),
    log: { warn() {} },
  })
  return { servicio, enviados, borradas, reservados, llamadasTiempo, admin }
}
const en = (iso) => new Date(iso)
{
  // Con pase y el móvil suscrito: el aviso sale a su hora, una sola vez.
  const m = mundo()
  const antes = await m.servicio.tick(en('2026-11-10T08:55:00Z'))
  debe(antes.enviados === 0 && m.enviados.length === 0, 'servicio', '08:55: todavía no se manda nada')
  const hora = await m.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(hora.enviados === 1 && m.enviados.length === 1 && m.enviados[0].payload.cuerpo === 'Buenos días. Hoy toca El norte de Manrique: sal de casa a las 9:26.', 'servicio', `08:56 (hora de Canarias): se manda el de la mañana (${m.enviados[0]?.payload.cuerpo})`)
  debe(m.enviados[0].payload.titulo === 'JUTRIP' && m.enviados[0].payload.url === '/?hoy=1', 'abre-hoy', 'el aviso lleva el nombre de la app y abre HOY (/?hoy=1)')
  debe(typeof m.enviados[0].payload.tag === 'string' && m.enviados[0].payload.tag.includes('manana:2026-11-10'), 'servicio', 'lleva su etiqueta (si llegara dos veces, el móvil lo sustituye)')
  await m.servicio.tick(en('2026-11-10T08:56:30Z'))
  await m.servicio.tick(en('2026-11-10T08:57:00Z'))
  await m.servicio.tick(en('2026-11-10T09:10:00Z'))
  debe(m.enviados.length === 1, 'repetido', 'el minuto siguiente, y hasta 30 min después, NO se vuelve a mandar (el aviso ya está reservado)')
  const llegada = mundo()
  await llegada.servicio.tick(en('2026-11-08T08:35:00Z'))
  debe(llegada.enviados.length === 1 && llegada.enviados[0].payload.cuerpo === 'Bienvenido a Lanzarote. Cuando tengas el coche, empiezas hacia las 11:25.', 'servicio', 'la llegada sale a las 8:35 de Lanzarote')
  const dia = mundo()
  const cuerpos = []
  for (let t = Date.parse('2026-11-12T07:00:00Z'); t < Date.parse('2026-11-12T23:00:00Z'); t += 60000) await dia.servicio.tick(new Date(t))
  for (const e of dia.enviados) cuerpos.push(e.payload.cuerpo)
  debe(cuerpos.length === 2 && /Papagayo/.test(cuerpos[0]) && /18:02/.test(cuerpos[1]), 'servicio', `un día entero minuto a minuto (jueves 12): solo 2 avisos, mañana y atardecer (${cuerpos.length})`)
  const viernes = mundo()
  for (let t = Date.parse('2026-11-13T06:00:00Z'); t < Date.parse('2026-11-13T22:00:00Z'); t += 60000) await viernes.servicio.tick(new Date(t))
  debe(viernes.enviados.map((e) => e.payload.cuerpo).join('|') === 'Hoy vuelves a casa. Devuelve el coche en la T1 antes de las 17:10.|En media hora tienes que salir hacia el aeropuerto.', 'servicio', 'el último día, minuto a minuto: «Hoy vuelves a casa…» y «En media hora tienes que salir…», en ese orden y nada más')
  debe(m.reservados.size >= 1 && [...m.reservados][0].startsWith('u1|t1|'), 'servicio', 'la clave reservada lleva la persona y el viaje (un aviso por viaje)')

  // Sin pase: ninguno.
  const sinPase = mundo({ pases: [] })
  await sinPase.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(sinPase.enviados.length === 0, 'sin-pase', 'sin pase no se manda ninguno')
  const otroPase = mundo({ pases: [{ estado: 'activo', destino: 'Roma' }] })
  await otroPase.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(otroPase.enviados.length === 0, 'sin-pase', 'el pase de otro destino (Roma) no vale para Lanzarote')
  const anulado = mundo({ pases: [{ estado: 'anulado', destino: 'Lanzarote' }] })
  await anulado.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(anulado.enviados.length === 0, 'sin-pase', 'un pase anulado tampoco')
  const admin = mundo({ pases: [], admins: ['u1'] })
  await admin.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(admin.enviados.length === 1, 'admin', 'el administrador recibe los avisos del viaje aunque Lanzarote no tenga pase a la venta (está oculto)')

  // Día de prueba: sin pase, solo ese día.
  const prueba = mundo({ pases: [], prueba: { fecha: '2026-11-10', trip_id: 't1' } })
  await prueba.servicio.tick(en('2026-11-09T07:30:00Z'))
  await prueba.servicio.tick(en('2026-11-10T08:56:00Z'))
  await prueba.servicio.tick(en('2026-11-11T08:14:00Z'))
  debe(prueba.enviados.length === 1 && /norte de Manrique/.test(prueba.enviados[0].payload.cuerpo), 'prueba', 'sin pase pero con su día de prueba (martes 10): solo recibe los de ese día (ni el lunes ni el miércoles)')
  const otraPrueba = mundo({ pases: [], prueba: { fecha: '2026-11-10', trip_id: 'otro-viaje' } })
  await otraPrueba.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(otraPrueba.enviados.length === 0, 'prueba', 'el día de prueba de otro viaje no vale')

  // Interruptor «Avisos en el móvil» apagado = sin suscripciones: ninguno.
  const apagado = mundo({ subs: [] })
  const r = await apagado.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(apagado.enviados.length === 0 && r.revisados === 0, 'interruptor', 'con el interruptor «Avisos en el móvil» apagado (sin suscripción) no se manda ninguno ni se calcula nada')
  const sinPush = mundo({ env: { ...ENV, PUSH_ACTIVO: 'false' } })
  const r2 = await sinPush.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(sinPush.enviados.length === 0 && r2.motivo === 'apagado', 'interruptor', 'con PUSH_ACTIVO apagado en el servidor tampoco (y lo dice)')
  const sinClaves = mundo({ env: { PUSH_ACTIVO: 'true', CRON_SECRET: 'x' } })
  const r3 = await sinClaves.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(sinClaves.enviados.length === 0 && r3.motivo === 'faltan_claves_vapid', 'interruptor', 'sin las claves VAPID tampoco, y dice por qué')

  // Si no llega a ningún móvil se libera y se reintenta; una suscripción caducada se borra.
  const caido = mundo({ falloDeEnvio: { statusCode: 500 } })
  await caido.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(caido.reservados.size === 0, 'reintento', 'si el aviso no llega a ningún móvil se libera (no queda como «mandado»)')
  const caducada = mundo({ falloDeEnvio: { statusCode: 410 } })
  await caducada.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(caducada.borradas.length === 1 && caducada.borradas[0] === 'https://push.example.test/1', 'caducada', 'una suscripción caducada (410) se borra')
  // Dos móviles: llega a los dos y cuenta como un solo aviso.
  const dos = mundo({ subs: [{ endpoint: 'https://push.example.test/1', claves: {} }, { endpoint: 'https://push.example.test/2', claves: {} }] })
  const rd = await dos.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(dos.enviados.length === 2 && rd.enviados === 1, 'servicio', 'con dos móviles llega a los dos (un solo aviso)')

  // La previsión del tiempo solo se pide cuando hace falta (la mañana o las 21:00).
  const sol = mundo()
  await sol.servicio.tick(en('2026-11-10T13:00:00Z'))
  await sol.servicio.tick(en('2026-11-10T17:04:00Z'))
  debe(sol.llamadasTiempo.length === 0, 'tiempo', 'a mediodía y a la hora del atardecer no se pide la previsión del tiempo')
  const lluvia = mundo({ meteos: { '2026-11-09': meteoCon(), '2026-11-10': meteoCon({ nubes: [12, 13] }) } })
  await lluvia.servicio.tick(en('2026-11-09T21:00:00Z'))
  debe(lluvia.enviados.length === 1 && lluvia.enviados[0].payload.cuerpo === 'Mañana habrá nubes en el Mirador del Río. Te hemos preparado una alternativa en HOY.', 'tiempo', `a las 21:00 de Lanzarote del lunes sale el aviso del tiempo de mañana (${lluvia.enviados[0]?.payload.cuerpo})`)
  const tranquilo = mundo({ meteos: { '2026-11-09': meteoCon(), '2026-11-10': meteoCon() } })
  await tranquilo.servicio.tick(en('2026-11-09T21:00:00Z'))
  debe(tranquilo.enviados.length === 0 && tranquilo.llamadasTiempo.length > 0, 'tiempo', 'a las 21:00 se mira la previsión y, si mañana es normal, no se manda nada')
  const manana = mundo({ meteos: { '2026-11-10': meteoCon({ nubes: [12, 13] }) } })
  await manana.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(/Hoy hay nubes en el Mirador del Río/.test(manana.enviados[0]?.payload.cuerpo ?? ''), 'tiempo', 'la mañana pide la previsión de hoy y la mete en el mismo mensaje')
  const sinPrevision = mundo({ meteos: {} })
  await sinPrevision.servicio.tick(en('2026-11-10T08:56:00Z'))
  debe(sinPrevision.enviados.length === 1 && !/llover|nubes|viento/.test(sinPrevision.enviados[0].payload.cuerpo), 'tiempo', 'si el proveedor del tiempo falla, el aviso de la mañana sale igual, sin la frase del tiempo')

  // Todo lo que se manda en el viaje de Eric, minuto a minuto: ningún texto de Roma, ninguno de noche, ninguno repetido, máx 4 al día.
  const viaje = mundo({ meteos: Object.fromEntries(['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'].map((f) => [f, meteoCon({ nubes: [12, 13], viento: [15] })])) })
  const marcas = []
  for (let t = Date.parse('2026-11-07T20:00:00Z'); t < Date.parse('2026-11-13T23:00:00Z'); t += 60000) {
    const antesN = viaje.enviados.length
    await viaje.servicio.tick(new Date(t))
    if (viaje.enviados.length > antesN) marcas.push({ t, cuerpo: viaje.enviados.at(-1).payload.cuerpo })
  }
  const cuerposViaje = marcas.map((x) => x.cuerpo)
  debe(cuerposViaje.length > 10 && new Set(cuerposViaje).size === cuerposViaje.length, 'servicio', `el viaje entero minuto a minuto: ${cuerposViaje.length} avisos y ninguno repetido`)
  debe(cuerposViaje.every((c) => !ROMA.test(c)), 'roma', 'ningún texto de Roma en todo el viaje de Lanzarote')
  const porFecha = new Map()
  for (const x of marcas) {
    const l = localDe(new Date(x.t), CANARIAS)
    porFecha.set(l.fecha, (porFecha.get(l.fecha) ?? 0) + 1)
  }
  debe([...porFecha.values()].every((n) => n <= 4), 'limite', `con tiempo malo cada día, ningún día pasa de 4 (máximo ${Math.max(...porFecha.values())})`)
  debe(marcas.every((x) => {
    const l = localDe(new Date(x.t), CANARIAS)
    return /^Bienvenido/.test(x.cuerpo) || (l.min >= 7 * 60 + 30 && l.min < 22 * 60)
  }), 'noche', 'y ninguno cae entre las 22:00 y las 7:30 de Lanzarote')

  // Las rutas.
  const app = { rutas: {}, get(r, h) { this.rutas[`GET ${r}`] = h }, post(r, h) { this.rutas[`POST ${r}`] = h } }
  const base = mundo({ admins: ['u1'] })
  registrarRutasAvisosViaje(app, { admin: base.admin, servicio: base.servicio, esAdmin: (u, env) => u.email === 'admin@example.test' && Boolean(env), env: ENV })
  const llamar = async (clave, cabecera) => {
    const res = { codigo: 200, cuerpo: null, status(c) { this.codigo = c; return this }, json(x) { this.cuerpo = x; return this } }
    await app.rutas[clave]({ get: (n) => (n.toLowerCase() === 'authorization' ? cabecera : undefined), headers: { authorization: cabecera }, body: {} }, res)
    return res
  }
  const sinClave = await llamar('GET /api/cron/avisos-viaje', undefined)
  const malaClave = await llamar('POST /api/cron/avisos-viaje', 'Bearer otra')
  debe(sinClave.codigo === 404 && malaClave.codigo === 404, 'ruta', 'la ruta del cron sin clave (o con otra) no existe (404)')
  const buena = await llamar('POST /api/cron/avisos-viaje', `Bearer ${ENV.CRON_SECRET}`)
  debe(buena.codigo === 200 && buena.cuerpo.ok === true, 'ruta', 'con la clave del cron responde bien')
  const sinCronSecret = {}
  registrarRutasAvisosViaje({ get(r, h) { sinCronSecret[r] = h }, post(r, h) { sinCronSecret[r] = h } }, { admin: base.admin, servicio: base.servicio, esAdmin: () => true, env: {} })
  const resSin = { codigo: 200, status(c) { this.codigo = c; return this }, json() { return this } }
  await sinCronSecret['/api/cron/avisos-viaje']({ get: () => 'Bearer ', headers: {} }, resSin)
  debe(resSin.codigo === 404, 'ruta', 'sin CRON_SECRET en el servidor la ruta no existe')
  const pruebaAdmin = await llamar('POST /api/admin/avisos-viaje/prueba', 'Bearer token-admin')
  debe(pruebaAdmin.codigo === 200 && pruebaAdmin.cuerpo.ok === true && base.enviados.length === 1 && /aviso de prueba/.test(base.enviados[0].payload.cuerpo), 'prueba-admin', 'el administrador recibe su aviso de prueba')
  const pruebaOtro = await llamar('POST /api/admin/avisos-viaje/prueba', 'Bearer token-otro')
  const pruebaSinSesion = await llamar('POST /api/admin/avisos-viaje/prueba', undefined)
  debe(pruebaOtro.codigo === 403 && pruebaSinSesion.codigo === 401 && base.enviados.length === 1, 'prueba-admin', 'quien no es administrador recibe 403 y sin sesión 401, y no se manda nada')
  const sinMovil = mundo({ subs: [], admins: ['u1'] })
  const appB = { rutas: {}, get(r, h) { this.rutas[`GET ${r}`] = h }, post(r, h) { this.rutas[`POST ${r}`] = h } }
  registrarRutasAvisosViaje(appB, { admin: sinMovil.admin, servicio: sinMovil.servicio, esAdmin: () => true, env: ENV })
  const resB = { codigo: 200, cuerpo: null, status(c) { this.codigo = c; return this }, json(x) { this.cuerpo = x; return this } }
  await appB.rutas['POST /api/admin/avisos-viaje/prueba']({ get: () => 'Bearer token-admin', headers: { authorization: 'Bearer token-admin' }, body: {} }, resB)
  debe(resB.cuerpo?.ok === false && resB.cuerpo?.motivo === 'sin_suscripcion', 'prueba-admin', 'el administrador sin el interruptor encendido recibe «sin_suscripcion» (la pantalla se lo explica)')
}

/* ─────────────────────────── 7. Las piezas del móvil ─────────────────────────── */
console.log('7. El service worker, abrir HOY, Ajustes, la tarjeta de iPhone y las migraciones')
{
  // El service worker de verdad, con un `self` de mentira: el aviso con `tag` se enseña con su etiqueta; al tocarlo, abre HOY.
  const eventos = {}
  const mostradas = []
  const mensajes = []
  const abiertas = []
  const ventana = { postMessage: (m) => mensajes.push(m), focus: async () => 'enfocada' }
  const sw = { location: { hostname: 'jutrip.example', origin: 'https://jutrip.example', search: '' }, addEventListener: (n, f) => { eventos[n] = f }, skipWaiting() {}, clients: { claim: async () => {}, matchAll: async () => (sw.hayVentana ? [ventana] : []), openWindow: async (u) => abiertas.push(u) }, registration: { showNotification: async (t, o) => mostradas.push({ t, o }) }, caches: null }
  vm.runInNewContext(leer('public/sw.js'), { self: sw, caches: { keys: async () => [], open: async () => ({}) }, URL, Response: class {}, fetch: async () => ({}) })
  let espera = null
  eventos.push({ data: { json: () => ({ titulo: 'JUTRIP', cuerpo: 'Buenos días.', url: '/?hoy=1', tag: 'u|manana:2026-11-10' }) }, waitUntil: (p) => { espera = p } })
  await espera
  debe(mostradas.length === 1 && mostradas[0].o.tag === 'u|manana:2026-11-10' && mostradas[0].o.body === 'Buenos días.' && mostradas[0].o.data.url === '/?hoy=1', 'sw', 'el service worker enseña el aviso con su texto, su etiqueta y su dirección (/?hoy=1)')
  eventos.push({ data: { json: () => ({ titulo: 'JUTRIP', cuerpo: 'X', url: '/?aviso=abc' }) }, waitUntil: (p) => { espera = p } })
  await espera
  debe(mostradas[1].o.tag === undefined, 'sw', 'un aviso de siempre (sin tag) sigue saliendo igual')
  const tocar = async (url, hayVentana) => {
    sw.hayVentana = hayVentana
    mensajes.length = 0
    abiertas.length = 0
    let p = null
    eventos.notificationclick({ notification: { close() {}, data: { url } }, waitUntil: (x) => { p = x } })
    await p
  }
  await tocar('/?hoy=1', true)
  debe(mensajes.length === 1 && mensajes[0].tipo === 'hoy', 'abre-hoy', 'tocar un aviso del viaje con la app abierta le dice «abre HOY» (sin recargar)')
  await tocar('/?hoy=1', false)
  debe(abiertas.length === 1 && abiertas[0] === '/?hoy=1', 'abre-hoy', 'tocarlo con la app cerrada la abre en /?hoy=1')
  await tocar('/?aviso=0123456789abcdef0123', true)
  debe(mensajes[0]?.tipo === 'aviso' && mensajes[0].id === '0123456789abcdef0123', 'abre-hoy', 'los avisos de siempre (la campanita) siguen abriendo la campanita')
  const host = leer('src/components/avisos/AvisosHost.tsx')
  const abrir = leer('src/lib/abrirHoyDeAviso.ts')
  debe(/hoyDeLaDireccion\(window\.location\.search\)/.test(host) && /tipo === 'hoy'\) abrirHoy\(\)/.test(host), 'abre-hoy', 'la app abre HOY con /?hoy=1 y con el mensaje del service worker')
  debe(/setMode\('today'\)/.test(abrir) && /new URLSearchParams\(busqueda\)\.get\('hoy'\) === '1'/.test(abrir), 'abre-hoy', 'y lo hace poniendo la pestaña HOY en cuanto hay un viaje')

  // Ajustes: la línea puesta al día y el botón solo para el administrador.
  const aj = leer('src/components/ajustes/AjustesScreen.tsx')
  debe(/titulo="Avisos en el móvil" sub="Los avisos del viaje, también con el móvil bloqueado/.test(aj), 'ajustes', 'la línea «Avisos en el móvil» habla de los avisos del viaje con el móvil bloqueado')
  debe(/\{esAdmin && <Fila icono="avisos" titulo="Enviarme un aviso de prueba"/.test(aj) && /puedeEmpezarDeCero\(\)\.then\(\(v\) => vivo && setEsAdmin\(v\)\)/.test(aj), 'ajustes', '[Enviarme un aviso de prueba] solo sale si el servidor dice que eres administrador')
  const ruta = leer('server/avisosViaje.js')
  debe(/app\.post\('\/api\/admin\/avisos-viaje\/prueba'/.test(ruta) && /if \(!esAdmin\(usuario, env\)\) return res\.status\(403\)/.test(ruta), 'ajustes', 'y el servidor lo comprueba otra vez (403 si no es administrador)')
  const lib = await import('../../src/lib/avisosViaje.ts').catch(() => null)
  void lib
  debe(!/(sk_live|sk_test|VAPID_PRIVATE_KEY\s*=\s*['"][^'"]{8,}|-----BEGIN)/.test(ruta + leer('shared/avisos/avisosDelViaje.js') + leer('supabase/migrations/0075_planificador_avisos_viaje.sql') + leer('docs/dias/COMPROBAR_0075.sql')), 'claves', 'ninguna clave escrita en el código, en las migraciones ni en las comprobaciones')
  debe(/vault\.decrypted_secrets/.test(leer('supabase/migrations/0075_planificador_avisos_viaje.sql')) && !/https?:\/\/[a-z0-9.-]+\.(vercel\.app|com|es)\//i.test(leer('supabase/migrations/0075_planificador_avisos_viaje.sql').replace(/^\s*--.*$/gm, '')), 'claves', 'la dirección de la API y la clave del cron salen del Vault de Supabase: no están en la migración')

  // Las migraciones y su SQL para pegar.
  const m74 = leer('supabase/migrations/0074_avisos_del_viaje.sql')
  const m75 = leer('supabase/migrations/0075_planificador_avisos_viaje.sql')
  debe(/enable row level security/.test(m74) && !/create policy/i.test(m74), 'migracion', 'la tabla de avisos mandados lleva RLS encendido y NINGUNA política (solo el servidor)')
  debe(/'\* \* \* \* \*'/.test(m75) && /pg_cron/.test(m75) && /net\.http_post/.test(m75) && /if not exists \(select 1 from pg_available_extensions/.test(m75), 'migracion', 'la 0075 programa cada minuto con pg_cron + pg_net y no hace nada si faltan las extensiones')
  const pegar = fs.existsSync('docs/dias/HOY3_SQL_PARA_PEGAR.sql') ? leer('docs/dias/HOY3_SQL_PARA_PEGAR.sql') : ''
  debe(pegar.includes(m74.trim()) && pegar.includes(m75.trim()), 'migracion', 'docs/dias/HOY3_SQL_PARA_PEGAR.sql lleva la 0074 y la 0075 enteras, con el mismo texto que las migraciones')
  debe(pegar.includes('vault.create_secret') && pegar.includes('migracion_0074') && pegar.includes('migracion_0075') && !/create_secret\([^)]*(https?:\/\/[a-z0-9-]+\.[a-z]{2,}\/|eyJ|sb_secret)/i.test(pegar.replace(/^\s*--.*$/gm, '')), 'migracion', 'lleva el paso de los secretos del Vault (con marcadores, sin valores) y las dos comprobaciones')
  debe(/\['avisos_viaje_enviados', 'user_id'\]/.test(leer('scripts/destino/pruebaTanda10J.mjs')), 'empezar-de-cero', 'la tabla nueva está en el inventario de pruebaTanda10J (que se pasa aparte)')
}

/* ─────────────────────────── 8. El navegador ─────────────────────────── */
if (process.env.SIN_NAVEGADOR === '1') {
  console.log('8. El navegador: saltado (SIN_NAVEGADOR=1)')
} else {
  console.log('8. El navegador: la tarjeta de iPhone en HOY y calcularAvisos (TypeScript) = el puerto del servidor')
  const { abrirApp } = await import('./_enLaApp.mjs')
  const ANTES = (ua, standalone) => `(function(){const RD=Date;const base=RD.now();function fijo(){if(window.__horaFalsa==null)return null;const d=new RD();d.setHours(Math.floor(window.__horaFalsa/60),window.__horaFalsa%60,0,0);return d.getTime()+(RD.now()-base)%60000}class FD extends RD{constructor(...a){if(a.length===0){const f=fijo();super(f==null?RD.now():f)}else super(...a)}static now(){const f=fijo();return f==null?RD.now():f}}window.Date=FD;
Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok,no){no&&no({code:1})},watchPosition(){return 1},clearWatch(){}},configurable:true});
try{navigator.permissions.query=async()=>({state:'denied',addEventListener(){},removeEventListener(){}})}catch(e){}
${ua ? `Object.defineProperty(navigator,'userAgent',{get:()=>${JSON.stringify(ua)},configurable:true});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5,configurable:true});` : ''}
${standalone ? "const mm=window.matchMedia.bind(window);window.matchMedia=(q)=>/display-mode:\\s*standalone/.test(q)?{matches:true,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}:mm(q);" : ''}})();`
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
  const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
  async function escenario({ ua, standalone = false, version = 'completa', dia = 0, cerrarPrimero = false }) {
    const a = await abrirApp('http://localhost:5173', { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=${version}`, antes: ANTES(ua, standalone) })
    try {
      const ev = (expr) => a.evaluar(`(async () => (${expr}))()`)
      for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
      await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)")
      for (let i = 0; i < 4; i++) {
        const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!hecho) break
        await a.esp(500)
      }
      await a.evaluar(`(async () => { try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1'); sessionStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {} return true })()`)
      const poner = async (d) => {
        await a.evaluar(`(async () => { const st = ${R}; const r = structuredClone(st.getState().route); st.setState({ route: r, screen: 'route' }); window.__horaFalsa = 12 * 60; const d = new Date('2026-11-08T12:00:00Z'); d.setUTCDate(d.getUTCDate() + ${d}); st.getState().setDevSimulatedTodayIso(d.toISOString().slice(0, 10)); st.getState().setActiveDayId(null); st.getState().setMode('explore'); return true })()`)
        await a.esp(600)
        await ev(`${R}.getState().setMode('today')`)
        await a.esp(2600)
      }
      await poner(dia)
      const hay = () => a.evaluar("Boolean(document.querySelector('[data-hoy-instalar-avisos]'))")
      const antes = await hay()
      const texto = antes ? await a.evaluar("document.querySelector('[data-hoy-instalar-avisos]')?.innerText.replace(/\\s+/g, ' ').trim()") : null
      let tras = null
      let guardado = null
      if (cerrarPrimero && antes) {
        await a.evaluar("(() => { document.querySelector('[data-hoy-instalar-avisos] [data-hoy-aviso-x]')?.click(); return true })()")
        await a.esp(500)
        tras = await hay()
        guardado = await a.evaluar("localStorage.getItem('trazo:hoy3:instalar-avisos-cerrada')")
        await poner(0)
        tras = [tras, await hay()]
      }
      return { antes, tras, guardado, texto }
    } finally {
      a.cerrar()
    }
  }
  try {
    const iphone = await escenario({ ua: IPHONE, cerrarPrimero: true })
    debe(iphone.antes === true, 'tarjeta', 'iPhone, web sin instalar, primer día del viaje, con pase: sale la tarjeta')
    debe(/Añade JUTRIP a tu pantalla de inicio para recibir los avisos del viaje/.test(iphone.texto ?? '') && /Compartir/.test(iphone.texto ?? '') && /Añadir a pantalla de inicio/.test(iphone.texto ?? ''), 'tarjeta', `con su frase y sus pasos (${iphone.texto?.slice(0, 160)})`)
    debe(Array.isArray(iphone.tras) && iphone.tras[0] === false && iphone.guardado === 'si' && iphone.tras[1] === false, 'tarjeta', 'la X la cierra y no vuelve (ni al volver a abrir HOY)')
    const android = await escenario({ ua: ANDROID })
    debe(android.antes === false, 'tarjeta', 'en Android no sale (ahí los avisos llegan sin instalar)')
    const instalada = await escenario({ ua: IPHONE, standalone: true })
    debe(instalada.antes === false, 'tarjeta', 'en iPhone con la web ya instalada no sale')
    const segundo = await escenario({ ua: IPHONE, dia: 1 })
    debe(segundo.antes === false, 'tarjeta', 'el segundo día del viaje no sale (solo el primero)')
    const sinPase = await escenario({ ua: IPHONE, version: 'gratis' })
    debe(sinPase.antes === false, 'tarjeta', 'sin pase no sale (sin pase no hay avisos del viaje)')
  } catch (e) {
    debe(false, 'navegador', `la parte de la tarjeta se ha parado: ${String(e?.message ?? e).slice(0, 200)}`)
  }
  // calcularAvisos (TypeScript, el de la app) y el puerto del servidor: mismos avisos.
  try {
    const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa&hoy2=on' })
    try {
      const escenarios = { nada: meteoCon(), nubes: meteoCon({ nubes: [12, 13] }), lluviaManana: meteoCon({ lluvia: [9, 10, 11] }), lluviaTarde: meteoCon({ lluvia: [15, 16, 17] }), viento: meteoCon({ viento: [14, 15, 16] }), todo: meteoCon({ lluvia: [10, 11, 15], nubes: [12, 13], viento: [15, 16] }) }
      const resultado = await a.evaluar(`(async () => {
        const ts = await import('/src/lib/avisosDelTiempo.ts'); const mio = await import('/shared/avisos/avisosDelViaje.js')
        const datos = ${JSON.stringify(DATOS.tiempo)}; const ruta = ${JSON.stringify(ERIC)}; const escenarios = ${JSON.stringify(escenarios)}
        const fuera = []
        for (const [nombre, meteo] of Object.entries(escenarios)) for (const dia of ruta.days) {
          const a = ts.calcularAvisos(dia, meteo, true).map((x) => x.tipo + ':' + x.salen.map((s) => s.nombre).join('+') + ':' + (x.entra.length > 0)).join('|')
          const b = mio.avisosDelTiempoDeUnDia(dia, meteo, datos).map((x) => x.tipo + ':' + x.salen.join('+') + ':' + x.hayAlternativa).join('|')
          if (a !== b) fuera.push(nombre + ' día ' + dia.dayNumber + ' TS=' + a + ' servidor=' + b)
        }
        return fuera })()`)
      debe(Array.isArray(resultado) && resultado.length === 0, 'puerto', `calcularAvisos (TypeScript) y el puerto del servidor dan lo mismo en 6 previsiones × 6 días (diferencias: ${(resultado ?? []).slice(0, 3).join(' ; ') || 'ninguna'})`)
    } finally {
      a.cerrar()
    }
  } catch (e) {
    debe(false, 'puerto', `la comparación con calcularAvisos se ha parado: ${String(e?.message ?? e).slice(0, 200)}`)
  }
}

console.log(`\nLa prueba de la tanda HOY3: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
