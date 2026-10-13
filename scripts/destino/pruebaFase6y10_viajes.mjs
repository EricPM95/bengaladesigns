// Prueba de la Tanda 6y10, parte del motor (punto 1, «los fallos que han salido al revisar 20 viajes»):
//   node scripts/destino/pruebaFase6y10_viajes.mjs [ver=25]
//
// Los 20 viajes de la revisión (docs/dias/VIAJES_REVISION.html, scripts/destino/viajes20Lib.mjs) con las comprobaciones de siempre (comprobacionesListas.mjs) y estos casos:
//   a) EL ORDEN DE LOS DÍAS: ningún viaje deja un imprescindible (nivel 1) en un día en que cierra si otro orden de los días lo evita, ni un nivel 2 si otro orden lo evita sin perder un imprescindible
//      (la prueba prueba TODOS los órdenes por su cuenta, sin mirar cómo los elige el motor). 24-26 de diciembre: el Vaticano el 24, la Galería (que cierra) el 25 y el Coliseo el 26.
//   b) CUANDO NO HAY OTRO DÍA (14-16 de agosto): el Vaticano sale como parada «Cerrado este día», sin «Llegada a…», sin ocupar tiempo, con su aviso, y el resto del día es la versión sin Museos.
//   c) LA BASÍLICA con su horario real: Viaje 14 (día 1, cierra a las 20:00) y Viaje 16 (día 2, abre a las 12:30): nunca «por dentro» fuera de su horario.
//   d) LOS AVISOS «Abre a las…»: solo si la ruta llega antes de que abra, una sola vez y con la hora de ese día.
//   e) EL VIAJE 5: el día del Vaticano no cambia de día (los Museos cierran los dos días): el orden es el de la tabla.
import { comprobarViaje } from './comprobacionesListas.mjs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { closedOnDay, effectiveSchedule, parseHoursSessions } from '../../shared/routeEngine/openingHours.js'
import { VIAJES, D, written, travel, argsDeViaje, planViaje } from './viajes20Lib.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const VER = Number(args.ver ?? 25)
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const BASILICA = 'Basílica de San Pedro'
const toMin = (h) => Number(String(h).slice(0, 2)) * 60 + Number(String(h).slice(3, 5))
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const placeOf = (name) => D.places.find((p) => p.name === name)
const fallos = []
const porRegla = {}
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) { porRegla[regla] = (porRegla[regla] ?? 0) + 1; fallos.push({ regla, texto }) }
}
const paradas = (dia) => (dia.escritoRows ?? []).filter((r) => r.tipo === 'parada' && !r.llegada && r.lugar)
const orden = (plan) => plan.days.filter((d) => d.curatedDay?.id).map((d) => d.curatedDay.id)
const diaDe = (plan, iso) => plan.days.find((d) => d.hours?.dateIso === iso && d.curatedDay)

// ═══ Una lista independiente de lo que cada día escrito necesita abierto (por dentro o con hora) ═══
const idBase = (id) => (id === 'D1-corto' ? 'D1' : id)
function entradasDelDia(id) {
  const dia = written.days[id]
  const nombres = new Set()
  const recoger = (d) => Object.values(d.partes ?? {}).forEach((parte) => [...(parte.manana ?? []), ...(parte.tarde ?? [])].forEach((s) => { if (s.lugar && (s.modo === 'dentro' || s.hora_tipo) && s.tipo !== 'traslado') nombres.add(s.lugar) }))
  recoger(dia)
  if (dia.hereda_manana_de && written.days[dia.hereda_manana_de]) recoger(written.days[dia.hereda_manana_de])
  return [...nombres]
}
const permutaciones = (lista) => (lista.length <= 1 ? [lista] : lista.flatMap((x, i) => permutaciones([...lista.slice(0, i), ...lista.slice(i + 1)]).map((resto) => [x, ...resto])))
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
/** Lo que se pierde con un orden de los días: [nivel 1 cerrados, nivel 2 cerrados]. */
function perdidaDe(ids, fechas) {
  let n1 = 0
  let n2 = 0
  ids.forEach((id, i) => {
    for (const nombre of entradasDelDia(id)) {
      const place = placeOf(nombre)
      if (!place || !closedOnDay(place, weekdayOf(fechas[i]), fechas[i])) continue
      if ((place.level ?? 3) === 1) n1++
      else if (place.level === 2) n2++
    }
  })
  return [n1, n2]
}
const menor = (a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1])

// ═══ Los 20 viajes ═══
console.log('Los 20 viajes de la revisión')
const planes = new Map()
for (const v of VIAJES) {
  const plan = planViaje(v)
  debe(Boolean(plan), 'sin_plan', `Viaje ${v.n}: el motor no devuelve plan`)
  if (!plan) continue
  planes.set(v.n, plan)
  const a = argsDeViaje(v)
  const r = comprobarViaje({ D, plan, etiqueta: `Viaje ${v.n}`, entradas: a.entradas, poolNames: [], hasFreeTour: a.hasFreeTour, listas: written, franjas: written.destino?.franjas })
  for (const f of r.fallos) debe(false, f.regla, f.texto)
  comprobaciones++

  // a) El orden de los días: ningún otro orden pierde menos (la prueba los prueba todos).
  const dias = plan.days.filter((d) => d.curatedDay?.id)
  const fechas = dias.map((d) => d.hours.dateIso)
  const ids = dias.map((d) => idBase(d.curatedDay.id))
  const libres = ids.filter((id) => !/medio$|^D0$/.test(id))
  if (fechas.every(Boolean) && libres.length === ids.length && ids.length >= 2 && ids.length <= 7) {
    const suyo = perdidaDe(ids, fechas)
    let mejor = suyo
    let ejemplo = null
    for (const perm of permutaciones(ids)) {
      const p = perdidaDe(perm, fechas)
      if (menor(p, mejor) < 0) { mejor = p; ejemplo = perm }
    }
    debe(menor(suyo, mejor) <= 0, 'orden_dias_pierde_mas', `Viaje ${v.n} (${fechas[0]}): el orden ${ids.join('→')} pierde ${suyo[0]} imprescindibles y ${suyo[1]} de nivel 2 cerrados, y ${ejemplo?.join('→')} solo ${mejor[0]} y ${mejor[1]}`)
  }
  // Un sitio que cierra ese día y sale con tiempo en la ruta es un fallo; solo vale la marca «Cerrado este día» (sin tiempo).
  for (const dia of dias) {
    for (const r2 of paradas(dia)) {
      const place = placeOf(r2.lugar)
      if (!place || r2.modo !== 'dentro' || r2.min <= 0) continue
      if ((place.level ?? 3) === 1 && closedOnDay(place, dia.hours.weekday, dia.hours.dateIso)) debe(false, 'cerrado_con_tiempo', `Viaje ${v.n} · ${dia.hours.dateIso}: «${r2.lugar}» sale por dentro con ${r2.min} min y ese día cierra`)
    }
    const cerradas = (dia.escritoRows ?? []).filter((r2) => r2.cerrado_este_dia)
    for (const marca of cerradas) {
      debe(marca.min === 0 && marca.t1 === marca.t0, 'marca_con_tiempo', `Viaje ${v.n} · ${dia.hours.dateIso}: «${marca.lugar}» está marcada «Cerrado este día» pero ocupa tiempo`)
      debe(!(dia.escritoRows ?? []).some((r2) => r2.llegada && r2.lugar === marca.lugar), 'marca_con_llegada', `Viaje ${v.n} · ${dia.hours.dateIso}: «${marca.lugar}» cerrada lleva «Llegada a…»`)
    }
  }
}

// a) 24-26 de diciembre (Viaje 7): el Vaticano el 24, la Galería (cierra el 25) el 25 y el Coliseo el 26.
{
  const plan = planes.get(7)
  const [d24, d25, d26] = ['2026-12-24', '2026-12-25', '2026-12-26'].map((iso) => diaDe(plan, iso))
  debe(d24?.curatedDay.id === 'D2', 'caso_24_26', `24 de diciembre: sale ${d24?.curatedDay.id} y tiene que ser el Vaticano (D2)`)
  debe(d25?.curatedDay.id === 'D4', 'caso_24_26', `25 de diciembre: sale ${d25?.curatedDay.id} y tiene que ser Villa Borghese (D4: lo que menos se pierde)`)
  debe(d26?.curatedDay.id === 'D1', 'caso_24_26', `26 de diciembre: sale ${d26?.curatedDay.id} y tiene que ser el Coliseo (D1)`)
  debe(d24 && !(d24.escritoRows ?? []).some((r) => r.cerrado_este_dia), 'caso_24_26', 'el Vaticano del 24 sale marcado como cerrado (el 24 abre con horario reducido)')
  debe(d24 && paradas(d24).some((r) => r.lugar === MUSEOS && r.min > 0), 'caso_24_26', 'el 24 los Museos no salen por la mañana con tiempo')
  const galeria = d25 && (d25.escritoRows ?? []).find((r) => r.lugar === 'Galería Borghese' && r.cerrado_este_dia)
  debe(Boolean(galeria), 'caso_24_26', 'la Galería, que el 25 cierra, no sale como «Cerrado este día» (se queda, no se quita)')
}
// e) Viaje 5: el orden es el de la tabla (los Museos cierran los dos días).
{
  const plan = planes.get(5)
  debe(orden(plan).join(',') === 'D1,D2', 'cambio_sin_ganar', `Viaje 5 (14-15 de agosto): el orden es ${orden(plan).join(',')} y tiene que ser el de la tabla, D1,D2 (los Museos cierran los dos días)`)
  const d15 = diaDe(plan, '2027-08-15')
  debe(Boolean(d15 && (d15.escritoRows ?? []).some((r) => r.cerrado_este_dia && r.lugar === MUSEOS)), 'cambio_sin_ganar', 'Viaje 5: el 15 de agosto los Museos no salen «Cerrado este día»')
}
// b) 14-15 de agosto (los dos días cierran los Museos; el 16 ya abren): no hay ningún día en que abran los Museos dentro del viaje.
{
  const plan = planListasTrip({ destData: D, written, totalDays: 3, hasFreeTour: false, poolNames: [], experiencesPositive: [], dateRangeStartIso: '2027-08-14', travel, entradas: {}, freeTourDespues: null, mediaJornada: null, diaCuatro: null })
  const dia = plan.days.find((d) => d.curatedDay?.id === 'D2')
  debe(Boolean(dia), 'cerrado_este_dia', '14-16 de agosto: no sale el día del Vaticano')
  if (dia) {
    const filas = dia.escritoRows ?? []
    const marca = filas.find((r) => r.lugar === MUSEOS && !r.llegada)
    debe(Boolean(marca?.cerrado_este_dia), 'cerrado_este_dia', '14-16 de agosto: los Museos no salen como «Cerrado este día»')
    debe(!filas.some((r) => r.llegada && r.lugar === MUSEOS), 'cerrado_este_dia', '14-16 de agosto: sale «Llegada a los Museos»')
    debe(marca && marca.min === 0 && marca.t0 === marca.t1, 'cerrado_este_dia', '14-16 de agosto: los Museos ocupan tiempo')
    debe(!filas.some((r) => r.lugar === MUSEOS && !r.cerrado_este_dia && r.min > 0), 'cerrado_este_dia', '14-16 de agosto: los Museos salen además con tiempo')
    const visita = dia.schedule.visits.find((v) => v.place.name === MUSEOS)
    debe(visita?.place.outsideKind === 'cerrado' && visita?.place.outsideReason === 'Cerrado este día' && visita.end === visita.start, 'cerrado_este_dia', `14-16 de agosto: la visita de los Museos no lleva la marca (${visita?.place.outsideKind} / ${visita?.place.outsideReason})`)
    debe(/cerrados el 15 de agosto/.test(visita?.place.stopNotice ?? ''), 'cerrado_este_dia', `14-16 de agosto: los Museos no llevan su aviso (${visita?.place.stopNotice})`)
    debe(plan.dayNotices.some((n) => n.dayNumber === dia.dayNumber && n.name === MUSEOS), 'cerrado_este_dia', '14-16 de agosto: falta el aviso del día de los Museos')
    // El resto del día es la versión sin Museos del documento: la Plaza, la Basílica con las Grutas y lo de la tarde.
    debe((dia.curatedDay.variantes ?? []).includes('sin_museos'), 'cerrado_este_dia', `14-16 de agosto: el día no usa la versión sin Museos (${(dia.curatedDay.variantes ?? []).join(',')})`)
    debe(filas.some((r) => r.lugar === BASILICA && /Grutas/.test(r.titulo ?? '')), 'cerrado_este_dia', '14-16 de agosto: la Basílica no sale con las Grutas (versión sin Museos)')
    debe(!(plan.unplacedEssentials ?? []).some((x) => x.name === MUSEOS), 'cerrado_este_dia', '14-16 de agosto: los Museos salen además en «No incluido»')
  }
}
// c) La Basílica con su horario real.
{
  const horarioDe = (dia, name) => { const place = placeOf(name); return parseHoursSessions(effectiveSchedule(place, dia.hours)).sort((a, b) => a.open - b.open) }
  for (const [n, iso] of [[14, '2027-03-24'], [16, '2027-06-30']]) {
    const dia = diaDe(planes.get(n), iso)
    const fila = dia && paradas(dia).find((r) => r.lugar === BASILICA)
    debe(Boolean(fila), 'basilica', `Viaje ${n} · ${iso}: no sale la Basílica`)
    if (!fila) continue
    const sesiones = horarioDe(dia, BASILICA)
    if (fila.modo === 'dentro') {
      const inicio = fila.t0
      debe(sesiones.some((s) => inicio >= s.open && inicio + fila.min <= s.close), 'basilica', `Viaje ${n} · ${iso}: la Basílica sale por dentro de ${toHHMM(fila.t0)} a ${toHHMM(fila.t1)} y su horario ese día es ${sesiones.map((s) => `${toHHMM(s.open)}-${toHHMM(s.close)}`).join(' y ')}`)
    }
  }
  const dia14 = diaDe(planes.get(14), '2027-03-24')
  const f14 = dia14 && paradas(dia14).find((r) => r.lugar === BASILICA)
  debe(f14?.modo === 'fuera', 'basilica', `Viaje 14 · día 1: la Basílica, que a su hora ya ha cerrado, tiene que ir por fuera (va ${f14?.modo}, ${f14 && toHHMM(f14.t0)})`)
  const v14 = dia14?.schedule.visits.find((v) => v.place.name === BASILICA)
  debe(/cerrado/i.test(v14?.place.stopNotice ?? ''), 'basilica', `Viaje 14 · día 1: la Basílica por fuera no lleva su aviso (${v14?.place.stopNotice})`)
  const dia16 = diaDe(planes.get(16), '2027-06-30')
  const f16 = dia16 && paradas(dia16).find((r) => r.lugar === BASILICA)
  debe(f16 && (f16.modo === 'fuera' || f16.t0 >= toMin('12:30')), 'basilica', `Viaje 16 · día 2: la Basílica sale a las ${f16 && toHHMM(f16.t0)} y abre a las 12:30`)
}
// d) Los avisos «Abre a las…».
{
  let avisos = 0
  for (const [n, plan] of planes) {
    for (const dia of plan.days) {
      for (const v of dia.schedule?.visits ?? []) {
        const nota = v.place.stopNotice ?? ''
        const todas = [...nota.matchAll(/abre a las (\d{1,2}:\d{2})/gi)]
        if (todas.length === 0) continue
        avisos++
        const etiqueta = `Viaje ${n} · ${dia.hours?.dateIso} · ${v.place.name}`
        debe(todas.length <= 1, 'avisos_abre', `${etiqueta}: el aviso «Abre a las…» sale ${todas.length} veces («${nota}»)`)
        const abre = toMin(todas[0][1].padStart(5, '0'))
        // (Los sitios por fuera y los que esperan llevan la hora de apertura real de ese día; los demás, si llegan antes de que abra.)
        const sesiones = v.place.name ? parseHoursSessions(effectiveSchedule(placeOf(v.place.name) ?? {}, dia.hours)).sort((a, b) => a.open - b.open) : []
        const real = sesiones.find((s) => s.open === abre)
        debe(sesiones.length === 0 || Boolean(real), 'avisos_abre', `${etiqueta}: dice «Abre a las ${todas[0][1]}» y ese día abre a las ${sesiones.map((s) => toHHMM(s.open)).join(' y ')}`)
        const llegada = v.start
        debe(llegada < abre + 1, 'avisos_abre', `${etiqueta}: dice «Abre a las ${todas[0][1]}» y la ruta llega a las ${toHHMM(llegada)}, cuando ya ha abierto`)
      }
    }
  }
  console.log(`  avisos «Abre a las…» revisados: ${avisos}`)
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) {
  console.log(JSON.stringify(porRegla))
  for (const f of fallos.slice(0, VER)) console.log(`  [${f.regla}] ${f.texto}`)
  process.exitCode = 1
}
setTimeout(() => process.exit(process.exitCode ?? 0), 300).unref()
