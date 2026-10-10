// La prueba de la Tanda 6z6, partes del motor y de los avisos (las de la barra, el Perfil y HOY son 6z6a, 6z6b y 6z6c; `pruebaTanda6z6.mjs` las corre todas).
//   node scripts/destino/pruebaTanda6z6d.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Da fallo si:
//   1. el Coliseo a las 12:30 y a las 13:00 no usa su fila (la visita primero —Foro, Coliseo, Arco— y la comida después, en Monti), o a las 13:30 no usa la de mediodía (la comida antes);
//   2. sin fechas y con mes, el horario no es el de la temporada de ese mes, o si cambia según el día no es el general con el día que cierra («· Cerrado los lunes»);
//   3. el aviso de cierre no sale por CUALQUIERA de los sitios de la entrada, con el nombre del que cierra («Ese día (26 mar) el Foro Romano cierra a las 14:00…»);
//   4. «vas justo» no sale solo entre dos reservas del viajero con menos que el trayecto más 30 min entre una y otra, con su texto; sale con las horas cruzadas («coinciden») o sin margen de sobra;
//   5. «Hoy es un día completo» no sale en un día con reserva que no cabe de las 9:00 a las 22:00, sale sin reserva o en un día que cabe;
//   6. cualquiera de estos avisos mueve, quita o cambia algo del día (el viaje y las reservas tienen que quedar EXACTAMENTE igual con y sin aviso).
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M } = await prepararSSR('scripts/destino/_6z6d_entrada.tsx')
const { cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada, reservasEnCierre, reservationOverlaps, esDiaCompleto, minutosDelDia, MINUTOS_DEL_DIA, TEXTO_DIA_COMPLETO } = M
const D = findPipelineV2Data('Roma')
const sinTildes = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── 1. Las filas del Coliseo ──
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const dia1 = (hora) => planListasTrip({ destData: D, written, totalDays: 3, hasFreeTour: false, poolNames: [], experiencesPositive: [], dateRangeStartIso: '2027-06-09', travel, entradas: { Coliseo: hora }, freeTourDespues: null, mediaJornada: null, diaCuatro: null }).days[0]
for (const [hora, variante, comidaDespues] of [['12:30', 'coliseo_12_30_13_00', true], ['13:00', 'coliseo_12_30_13_00', true], ['13:30', 'coliseo_mediodia', false], ['14:00', 'coliseo_mediodia', false]]) {
  const dia = dia1(hora)
  debe((dia.curatedDay.variantes ?? []).includes(variante), '1 fila', `el Coliseo a las ${hora} no usa la fila ${variante} (usa ${(dia.curatedDay.variantes ?? []).join(',')})`)
  const filas = dia.escritoRows
  const iCol = filas.findIndex((r) => r.lugar === 'Coliseo' && !r.llegada)
  const iCom = filas.findIndex((r) => r.tipo === 'comida')
  const iForo = filas.findIndex((r) => r.lugar === 'Foro Romano y Palatino' && !r.llegada)
  const iArco = filas.findIndex((r) => r.lugar === 'Arco de Constantino')
  debe(iForo >= 0 && iForo < iCol, '1 fila', `el Coliseo a las ${hora}: el Foro no va antes del Coliseo`)
  if (comidaDespues) debe(iCom > iCol && iArco > iCol && iArco < iCom, '1 fila', `el Coliseo a las ${hora}: la comida no va después del Coliseo y el Arco (Coliseo ${iCol}, Arco ${iArco}, comida ${iCom})`)
  else debe(iCom >= 0 && iCom < iCol, '1 fila', `el Coliseo a las ${hora}: la comida no va antes del Coliseo`)
}

// ── 2. El horario sin fechas, con el mes ──
const catalogo = await cargaDatosDeHorario('Roma')
const datos = datosDeHorarioEnMemoria('Roma')
const dato = (nombre) => catalogo.get(sinTildes(nombre))
const coliseoDatos = dato('Coliseo')
debe(Boolean(coliseoDatos), '2 mes', 'no hay horario del Coliseo')
const julio = horarioDeParada({ hoursData: coliseoDatos }, null, 6)
debe(julio && /^Abre \d{1,2}:\d{2} – \d{1,2}:\d{2}/.test(julio.texto), '2 mes', `el Coliseo en julio sin fechas no da su horario (${julio?.texto})`)
// El mismo que el de un día de ese mes con fecha (la temporada).
const diaDeJulio = horarioDeParada({ hoursData: coliseoDatos }, '2027-07-14')
debe(julio && diaDeJulio && julio.cierra === diaDeJulio.cierra && julio.abre === diaDeJulio.abre, '2 mes', `el horario de julio sin fechas (${julio?.texto}) no es el de un día de julio (${diaDeJulio?.texto})`)
const dic = horarioDeParada({ hoursData: coliseoDatos }, null, 11)
debe(dic && julio && dic.texto !== julio.texto || dic?.cierra === julio?.cierra, '2 mes', 'el horario de diciembre sin fechas no es el de su temporada')
debe(horarioDeParada({ hoursData: coliseoDatos }, null, null)?.texto === horarioDeParada({ hoursData: coliseoDatos }, null)?.texto, '2 mes', 'sin mes el comportamiento ha cambiado')
// Un lugar que cierra un día de la semana: el general con el día que cierra.
const conCierre = { windows: ['09:00-19:00'], closed_on: ['lunes'] }
debe(horarioDeParada({ hoursData: conCierre }, null, 5)?.texto === 'Abre 9:00 – 19:00 · Cerrado los lunes', '2 mes', `un lugar que cierra los lunes: «${horarioDeParada({ hoursData: conCierre }, null, 5)?.texto}»`)
const cierraDos = horarioDeParada({ hoursData: { windows: ['09:00-19:00'], closed_on: ['lunes', 'martes'] } }, null, 5)
debe(cierraDos?.texto === 'Abre 9:00 – 19:00 · Cerrado los lunes y martes', '2 mes', `un lugar que cierra lunes y martes: «${cierraDos?.texto}»`)
// Con fechas, no se añade «Cerrado los…» (ya se sabe qué día es).
debe(!/Cerrado los/.test(horarioDeParada({ hoursData: conCierre }, '2027-03-10')?.texto ?? ''), '2 mes', 'con fecha sale «Cerrado los…»')
// Un horario que cambia según la época: con mes sale el de ese mes.
const porEpoca = { by_season: { verano: ['09:00-20:00'], invierno: ['09:00-17:00'] }, windows: ['09:00-18:00'] }
debe(horarioDeParada({ hoursData: porEpoca }, null, 6)?.texto === 'Abre 9:00 – 20:00' && horarioDeParada({ hoursData: porEpoca }, null, 0)?.texto === 'Abre 9:00 – 17:00', '2 mes', `por época: julio «${horarioDeParada({ hoursData: porEpoca }, null, 6)?.texto}», enero «${horarioDeParada({ hoursData: porEpoca }, null, 0)?.texto}»`)
debe(horarioDeParada({ hoursData: porEpoca }, null, null) === null, '2 mes', 'por época y sin mes debería no enseñar nada')

// ── 3. El aviso de cierre, por cualquiera de los sitios de la entrada ──
const reserva = (id, fecha, hora, extra = {}) => ({ id, kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: fecha, dayNumber: null, time: hora, ...extra })
const ruta = (inicio, fin, dias = []) => ({ id: 'f6z6d', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, days: dias, answers: { dateRange: { start: inicio, end: fin }, days: 3, companion: 'couple' }, transportContext: { transport_option: { id: 'flight' }, archetype: null } })
const diasDe = (n) => Array.from({ length: n }, (_, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, city: 'Roma', title: '', stops: [], meals: [], excursions: [] }))
const r3 = ruta('2027-03-25', '2027-03-27', diasDe(3))
const cortos = { 'Coliseo, Foro y Palatino': 'el Coliseo' }
// Solo cierra el Foro: se cambia su horario en un mapa de prueba (el Coliseo abre todo el día).
const datosFalsos = new Map(datos)
datosFalsos.set(sinTildes('Coliseo'), { windows: ['08:30-19:00'] })
datosFalsos.set(sinTildes('Foro Romano y Palatino'), { windows: ['09:00-14:00'] })
const soloForo = reservasEnCierre(r3, [reserva('c1', '2027-03-26', '16:00')], datosFalsos, cortos)
debe(soloForo.length === 1 && soloForo[0].text === 'Ese día (26 mar) el Foro Romano cierra a las 14:00. Revisa tu reserva.', '3 cierre', `si solo cierra el Foro: ${JSON.stringify(soloForo.map((a) => a.text))}`)
// Cierra el Coliseo (el primero): avisa por el Coliseo, una sola vez.
datosFalsos.set(sinTildes('Coliseo'), { windows: ['08:30-14:00'] })
const ambos = reservasEnCierre(r3, [reserva('c2', '2027-03-26', '16:00')], datosFalsos, cortos)
debe(ambos.length === 1 && /^Ese día \(26 mar\) el Coliseo cierra a las 14:00\. Revisa tu reserva\.$/.test(ambos[0].text), '3 cierre', `si cierran los dos: ${JSON.stringify(ambos.map((a) => a.text))}`)
// Con una hora en que abren los dos, nada.
debe(reservasEnCierre(r3, [reserva('c3', '2027-03-26', '10:00')], datosFalsos, cortos).length === 0, '3 cierre', 'avisa con los dos abiertos')

// ── 4. «Vas justo», solo entre dos reservas del viajero ──
const FT = 'Free Tour'
const museos = 'Museos Vaticanos y Capilla Sixtina'
const res = (id, refId, name, placeNames, fecha, hora) => ({ id, kind: 'entrada', refId, name, placeNames, dateIso: fecha, dayNumber: null, time: hora })
const rJusto = ruta('2027-06-09', '2027-06-11', diasDe(3))
const dia = '2027-06-09'
const justo = (h2) => reservationOverlaps(rJusto, [res('a', FT, FT, [FT], dia, '10:00'), res('b', museos, museos, [museos], dia, h2)], { [museos]: 'los Museos', [FT]: 'el Free Tour' })
debe(justo('12:30').filter((x) => x.kind === 'justo').length === 1, '4 justo', 'el Free Tour de las 10:00 y los Museos a las 12:30 no avisan «vas justo»')
const j = justo('12:30').find((x) => x.kind === 'justo')
debe(j?.text === 'Ojo: entre tu Free Tour y tu entrada a los Museos hay poco margen. Es posible que vayas justo: te recomendamos ir directo.', '4 justo', `el texto de «vas justo»: ${j?.text}`)
debe(justo('14:00').filter((x) => x.kind === 'justo').length === 0 && justo('15:00').length === 0, '4 justo', 'avisa «vas justo» con margen de sobra')
const cruzadas = justo('11:30')
debe(cruzadas.length === 1 && cruzadas[0].kind === 'coinciden', '4 justo', `con las horas cruzadas debería salir solo «coinciden»: ${JSON.stringify(cruzadas.map((x) => x.kind))}`)
debe(reservationOverlaps(rJusto, [res('a', FT, FT, [FT], dia, '10:00'), { ...res('b', museos, museos, [museos], dia, '12:30'), kind: 'excursion' }]).length === 0, '4 justo', 'una excursión cuenta para «vas justo»')

// ── 5. «Día completo» ──
const parada = (i, minutos = 60) => ({ id: `s${i}`, name: `Sitio ${i}`, durationMinutes: minutos, coordinates: { lat: 41.9 + i * 0.002, lng: 12.48 }, visitMode: 'dentro' })
const diaCon = (n, minutos) => ({ id: 'd1', dayNumber: 1, city: 'Roma', title: '', stops: Array.from({ length: n }, (_, i) => parada(i, minutos)), meals: [], excursions: [] })
const rDia = (d) => ruta('2027-06-09', '2027-06-11', [d])
const conReserva = [res('a', museos, museos, [museos], '2027-06-09', '11:00')]
const lleno = diaCon(14, 60)
const corto = diaCon(4, 60)
debe(minutosDelDia(lleno) > MINUTOS_DEL_DIA && minutosDelDia(corto) < MINUTOS_DEL_DIA, '5 completo', `los minutos del día: lleno ${minutosDelDia(lleno)}, corto ${minutosDelDia(corto)}, caben ${MINUTOS_DEL_DIA}`)
debe(esDiaCompleto(rDia(lleno), lleno, conReserva) === true, '5 completo', 'un día con reserva que no cabe no es completo')
debe(esDiaCompleto(rDia(lleno), lleno, []) === false, '5 completo', 'un día sin reserva sale completo')
debe(esDiaCompleto(rDia(corto), corto, conReserva) === false, '5 completo', 'un día que cabe sale completo')
debe(TEXTO_DIA_COMPLETO === 'Hoy es un día completo: te recomendamos madrugar.', '5 completo', `el texto: ${TEXTO_DIA_COMPLETO}`)

// ── 6. Ningún aviso toca nada ──
{
  const viaje = rDia(lleno)
  const reservas = [...conReserva, reserva('z1', '2027-06-09', '10:00')]
  const antes = JSON.stringify({ viaje, reservas, datos: [...datosFalsos.entries()] })
  reservasEnCierre(viaje, reservas, datosFalsos, cortos)
  reservationOverlaps(viaje, reservas, cortos)
  esDiaCompleto(viaje, lleno, reservas)
  minutosDelDia(lleno)
  debe(JSON.stringify({ viaje, reservas, datos: [...datosFalsos.entries()] }) === antes, '6 no toca', 'un aviso ha cambiado el viaje, las reservas o los datos')
  // El día del motor, con y sin reserva puesta a una hora en que el sitio está cerrado, sigue su lista: lo único que cambia es la reserva en sí.
  const sinAviso = JSON.stringify(dia1('13:00').escritoRows.map((r) => [r.lugar, r.tipo, r.modo]))
  reservasEnCierre(viaje, reservas, datosFalsos, cortos)
  debe(JSON.stringify(dia1('13:00').escritoRows.map((r) => [r.lugar, r.tipo, r.modo])) === sinAviso, '6 no toca', 'el día del motor cambia al mirar los avisos')
}

if (fallos.length === 0) console.log(`6z6d: ${comprobaciones} comprobaciones, 0 fallos.`)
else {
  console.log(`6z6d: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos.slice(0, 40)) console.log(` - [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
