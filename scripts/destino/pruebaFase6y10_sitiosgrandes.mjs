// Tanda 6y10: los sitios grandes salen de los DATOS del destino (`sitios_grandes`), no de una lista fija del código.
//   node scripts/destino/pruebaFase6y10_sitiosgrandes.mjs ref=<carpeta con una copia del código de ANTES (commit bef2731)> [fechas=40] [servidor=http://localhost:8863] [servidor_ref=http://localhost:8864]
// 1. Roma sale IGUAL que antes: el mismo viaje, con el motor viejo (lista fija) y con el nuevo (datos), para 1 a 7 días, con y sin Free Tour, con cada reserva grande en cada día y varias horas, en unas 40 fechas del año.
// 2. Lo mismo con los servidores (reservation-plan y rebuild-day), si se dan los dos.
// 3. Un destino de mentira con otros sitios grandes (sin Coliseo) se comporta con SU lista; un destino sin el campo se comporta como uno sin sitios grandes (sin romper).
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
if (!args.ref) { console.error('Falta ref=<carpeta del código de antes>'); process.exit(2) }
const REF = path.resolve(args.ref)
const NFECHAS = Number(args.fechas ?? 40)
const fallos = []
const debe = (cond, regla, texto) => { if (!cond) { fallos.push(`${regla}: ${texto}`) } }

const cargar = async (raiz) => {
  const u = (p) => pathToFileURL(path.join(raiz, p)).href
  const [trip, alg, written, times, res] = await Promise.all([
    import(u('shared/routeEngine/listasTrip.js')), import(u('server/routeAlgorithm.js')), import(u('server/engine/writtenDays.js')), import(u('server/engine/buildDayV3.js')), import(u('shared/routeEngine/listasReservas.js')),
  ])
  return { planListasTrip: trip.planListasTrip, D: alg.findPipelineV2Data('Roma'), written: written.writtenDaysFor('roma'), travel: times.travelTimesFor('roma'), res }
}
const NUEVO = await cargar(process.cwd())
const VIEJO = await cargar(REF)
const { sitiosGrandesDe, sitioGrandeDe, claseDeReserva } = NUEVO.res

// ── 0. El dato está y es el de la lista fija de antes ──
const ANTES = ['Coliseo', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese', 'Free Tour por Roma']
debe(!VIEJO.D.sitios_grandes, '0 dato', 'la copia de antes ya trae el campo (la referencia no es la de antes)')
debe(JSON.stringify([...VIEJO.res.RESERVAS_GRANDES]) === JSON.stringify(ANTES), '0 dato', 'la lista fija de antes no es la que se esperaba')
debe(JSON.stringify([...sitiosGrandesDe(NUEVO.D)]) === JSON.stringify(ANTES), '0 dato', `los sitios grandes de Roma en los datos no son los de la lista fija de antes: ${[...sitiosGrandesDe(NUEVO.D)]}`)
debe(NUEVO.res.RESERVAS_GRANDES === undefined, '0 dato', 'sigue exportándose la lista fija RESERVAS_GRANDES')
const sinCambioEnElResto = JSON.stringify({ ...NUEVO.D, sitios_grandes: undefined }) === JSON.stringify(VIEJO.D)
debe(sinCambioEnElResto, '0 dato', 'los datos de Roma han cambiado en algo más que el campo nuevo')

// ── 1. Roma igual que antes ──
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const fechas = []
for (let i = 0; i < NFECHAS; i++) fechas.push(addDays('2027-01-03', Math.floor((i * 365) / NFECHAS)))
const FORMAS = []
for (let dias = 1; dias <= 7; dias++) {
  FORMAS.push({ clave: `${dias} días`, dias, diaCuatro: dias >= 5 ? 'excursion' : 'roma' })
  FORMAS.push({ clave: `${dias} días con Free Tour`, dias, ft: true, diaCuatro: dias >= 5 ? 'excursion' : 'roma' })
}
FORMAS.push({ clave: '2,5 días tarde', dias: 3, medio: { franja: 'tarde' } }, { clave: '3,5 días mañana', dias: 4, medio: { franja: 'manana', salida: '15:00' } })
const RESERVAS = []
for (const [name, horas] of [['Coliseo', ['09:00', '11:00', '15:00']], [MUSEOS, ['08:30', '10:00', '14:00']], ['Galería Borghese', ['09:00', '12:00', '17:00']], ['Free Tour por Roma', ['10:00', '17:00']], ['Altar de la Patria', ['11:00']], ['Panteón', ['16:00']]]) for (const hora of horas) RESERVAS.push({ name, hora })
const reservaDe = (R, inicio, k) => ({ entradas: { [R.name]: R.hora, ...(R.name === 'Coliseo' ? { 'Foro Romano y Palatino': R.hora } : {}) }, reservasGrandes: sitiosGrandesDe(NUEVO.D).has(R.name) ? [{ name: R.name, dateIso: addDays(inicio, k - 1), dayNumber: k, time: R.hora }] : [], reservasViaje: sitiosGrandesDe(NUEVO.D).has(R.name) ? [] : [{ name: R.name, dateIso: addDays(inicio, k - 1), dayNumber: k, time: R.hora }] })
const correr = (M, forma, inicio, extra, poolNames) => {
  try {
    return JSON.stringify(M.planListasTrip({ destData: M.D, written: M.written, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames, experiencesPositive: forma.ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: inicio, travel: M.travel, mediaJornada: forma.medio ?? null, diaCuatro: forma.diaCuatro ?? null, entradas: {}, ...extra }))
  } catch (e) { return `ERROR ${e.message}` }
}
let comparados = 0
let distintos = 0
let conPlan = 0
const t0 = Date.now()
for (const forma of FORMAS) {
  for (const inicio of fechas) {
    const casos = [{ extra: {}, pool: [], etiqueta: 'sin reservas' }, { extra: {}, pool: ['Galería Borghese', "Castillo de Sant'Angelo"], etiqueta: 'con pool' }]
    for (const R of RESERVAS) for (let k = 1; k <= forma.dias; k++) {
      // (Mismas horas en cada día pero solo en dos o tres días por viaje, para no tardar horas: el primero, el del medio y el último.)
      if (forma.dias > 3 && ![1, Math.ceil(forma.dias / 2), forma.dias].includes(k)) continue
      casos.push({ extra: reservaDe(R, inicio, k), pool: [], etiqueta: `${R.name} ${R.hora} día ${k}` })
    }
    for (const c of casos) {
      const a = correr(VIEJO, forma, inicio, c.extra, c.pool)
      const b = correr(NUEVO, forma, inicio, c.extra, c.pool)
      comparados++
      if (!a.startsWith('ERROR') && a !== 'null') conPlan++
      if (a !== b) { distintos++; if (fallos.length < 30) fallos.push(`1 Roma igual: ${forma.clave} · ${inicio} · ${c.etiqueta}: el resultado cambia`) }
    }
  }
}
debe(conPlan > comparados * 0.9, '1 muestra', `casi ningún viaje sale con plan (${conPlan} de ${comparados}): la prueba no mira nada`)
console.log(`1. Roma igual: ${comparados} viajes comparados (${conPlan} con plan), ${distintos} diferencias, ${((Date.now() - t0) / 1000).toFixed(0)} s`)

// ── 1b. claseDeReserva: la tabla de todas las listas, igual con la lista de antes y con la de los datos ──
{
  let n = 0
  let dist = 0
  const horas = []
  for (let m = 8 * 60; m <= 20 * 60; m += 30) horas.push(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`)
  const sitiosViejos = VIEJO.res.RESERVAS_GRANDES
  for (const dia of Object.values(NUEVO.written.days)) for (const lugar of [...ANTES, 'Panteón', 'Altar de la Patria']) for (const hora of horas) for (const tieneFreeTour of [false, true]) for (const excursionManana of [false, true]) {
    const a = JSON.stringify(VIEJO.res.claseDeReserva(dia, lugar, hora, { tieneFreeTour, excursionManana }))
    const b = JSON.stringify(claseDeReserva(dia, lugar, hora, { sitiosGrandes: sitiosGrandesDe(NUEVO.D), destData: NUEVO.D, tieneFreeTour, excursionManana }))
    n++
    if (a !== b) dist++
  }
  debe(sitiosViejos.size === 4, '1b clase', 'la lista de antes no tiene cuatro')
  debe(dist === 0, '1b clase', `${dist} horas con otra clase`)
  console.log(`1b. claseDeReserva: ${n} casos, ${dist} diferencias`)
}

// ── 2. Los servidores: el plan de la reserva y el día rehecho, iguales ──
const peticion = async (base, ruta, cuerpo) => {
  const r = await fetch(`${base}${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
  return `${r.status} ${await r.text()}`
}
if (args.servidor && args.servidor_ref) {
  let n = 0
  let dist = 0
  const ahora = fechas.filter((_, i) => i % 4 === 0)
  for (const inicio of ahora) for (const dias of [2, 3, 4, 5, 6]) for (const R of RESERVAS.filter((x) => ['Coliseo', MUSEOS, 'Galería Borghese', 'Free Tour por Roma', 'Panteón'].includes(x.name) && ['09:00', '10:00', '12:00', '15:00'].includes(x.hora))) for (const k of [1, 2, dias]) {
    const answers = { dateRange: { start: inicio, end: addDays(inicio, dias) }, month: Number(inicio.slice(5, 7)) - 1, experiencesPositive: [], companion: 'pareja' }
    const all_days = Array.from({ length: dias }, (_, i) => ({ day_number: i + 1, city: 'Roma' }))
    const reserva = { kind: 'entrada', placeNames: [R.name], dateIso: addDays(inicio, k - 1), dayNumber: k, time: R.hora }
    const base = { destination: 'Roma', answers, all_days, must_include_places: [], inside_names: [] }
    for (const [ruta, cuerpo] of [['/api/reservation-plan', { ...base, reserva, reservas: [reserva], reservas_antes: [] }], ['/api/rebuild-day', { ...base, day_number: k, reservas: [reserva] }]]) {
      const [a, b] = await Promise.all([peticion(args.servidor_ref, ruta, cuerpo), peticion(args.servidor, ruta, cuerpo)])
      n++
      if (a !== b) { dist++; if (fallos.length < 30) fallos.push(`2 servidor ${ruta}: ${inicio} ${dias} días ${R.name} ${R.hora} día ${k}: la respuesta cambia`) }
    }
  }
  debe(n > 100, '2 servidor', 'muy pocas peticiones')
  console.log(`2. Servidores: ${n} respuestas comparadas, ${dist} diferencias`)
  // El dato llega a la app por el endpoint de siempre.
  const r = JSON.parse(await (await fetch(`${args.servidor}/api/destination-excursions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })).text())
  debe(Array.isArray(r.sitios_grandes) && r.sitios_grandes.map((s) => s.nombre).join('|') === ANTES.join('|'), '2 endpoint', `destination-excursions no trae los sitios grandes de Roma: ${JSON.stringify(r.sitios_grandes)}`)
  debe(r.sitios_grandes?.every((s) => s.del && s.el), '2 endpoint', 'a algún sitio grande le faltan «del» o «el»')
  const sin = JSON.parse(await (await fetch(`${args.servidor}/api/destination-excursions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Ciudad que no existe' }) })).text())
  debe(Array.isArray(sin.sitios_grandes) && sin.sitios_grandes.length === 0, '2 endpoint', 'un destino sin datos debe traer sitios_grandes vacío')
}

// ── 3. Un destino de mentira ──
{
  const clonar = (extra) => ({ ...NUEVO.D, ...extra })
  const lista = (...nombres) => ({ lugares: nombres.map((nombre) => ({ nombre, del: `del ${nombre}`, el: `el ${nombre}` })) })
  const DESTINOS = {
    roma: NUEVO.D,
    soloPanteon: clonar({ sitios_grandes: lista('Panteón') }),
    sinCampo: clonar({ sitios_grandes: undefined }),
    vacio: clonar({ sitios_grandes: { lugares: [] } }),
    sinColiseo: clonar({ sitios_grandes: lista(MUSEOS, 'Galería Borghese') }),
  }
  debe(JSON.stringify([...sitiosGrandesDe(DESTINOS.soloPanteon)]) === '["Panteón"]', '3 mentira', 'la lista del destino de mentira no es la suya')
  debe(sitiosGrandesDe(DESTINOS.sinCampo).size === 0 && sitiosGrandesDe(DESTINOS.vacio).size === 0 && sitiosGrandesDe(null).size === 0 && sitiosGrandesDe({}).size === 0, '3 mentira', 'un destino sin el campo debe tener 0 sitios grandes')
  debe(sitioGrandeDe(DESTINOS.soloPanteon, 'Coliseo') === null && sitioGrandeDe(DESTINOS.soloPanteon, 'Panteón')?.el === 'el Panteón', '3 mentira', 'sitioGrandeDe no sigue la lista del destino')
  // La clase de una hora sin lista: en un día que no trae escrito el sitio, un sitio grande dice «sin_lista» y uno pequeño «sin_definir».
  const diaSinNada = { id: 'X', variantes: [], reservas: {} }
  const clase = (D, lugar) => claseDeReserva(diaSinNada, lugar, '10:00', { sitiosGrandes: sitiosGrandesDe(D) }).clase
  debe(clase(DESTINOS.roma, 'Coliseo') === 'sin_lista' && clase(DESTINOS.roma, 'Panteón') === 'sin_definir', '3 mentira', 'Roma: Coliseo debe ser grande y Panteón pequeño')
  debe(clase(DESTINOS.soloPanteon, 'Coliseo') === 'sin_definir' && clase(DESTINOS.soloPanteon, 'Panteón') === 'sin_lista', '3 mentira', 'el destino de mentira debe tratar el Panteón como grande y el Coliseo como pequeño')
  debe(clase(DESTINOS.sinCampo, 'Coliseo') === 'sin_definir', '3 mentira', 'sin el campo, el Coliseo no debe ser grande')
  // El motor: la misma reserva grande del Coliseo se trata distinto según de quién sea el dato.
  const forma = { dias: 3, diaCuatro: 'roma' }
  let distintoSinColiseo = 0
  let distintoSinCampo = 0
  let sinRomper = 0
  let total = 0
  for (const inicio of fechas.slice(0, 20)) for (const k of [1, 2, 3]) for (const hora of ['09:00', '15:00']) {
    const R = { name: 'Coliseo', hora }
    const extra = reservaDe(R, inicio, k)
    const salida = (D) => correr({ ...NUEVO, D }, forma, inicio, extra, [])
    const base = salida(DESTINOS.roma)
    const sinCol = salida(DESTINOS.sinColiseo)
    const sinCampo = salida(DESTINOS.sinCampo)
    total++
    if (!sinCol.startsWith('ERROR') && !sinCampo.startsWith('ERROR')) sinRomper++
    if (base !== sinCol) distintoSinColiseo++
    if (base !== sinCampo) distintoSinCampo++
  }
  debe(sinRomper === total, '3 mentira', `un destino de mentira rompe el motor (${total - sinRomper} de ${total})`)
  debe(distintoSinColiseo > 0, '3 mentira', 'quitar el Coliseo de los sitios grandes no cambia nunca el viaje con su reserva: el motor no lee la lista de los datos')
  debe(distintoSinCampo > 0, '3 mentira', 'quitar el campo no cambia nunca el viaje con una reserva del Coliseo: el motor no lee la lista de los datos')
  console.log(`3. Destino de mentira: ${total} viajes; sin el Coliseo cambian ${distintoSinColiseo}, sin el campo cambian ${distintoSinCampo}, ${total - sinRomper} rompen`)
}

console.log(fallos.length === 0 ? 'PRUEBA 6y10 sitios grandes: 0 fallos' : `PRUEBA 6y10 sitios grandes: ${fallos.length} fallos\n${fallos.slice(0, 30).join('\n')}`)
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
