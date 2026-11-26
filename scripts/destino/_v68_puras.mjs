// V68: comprobaciones PURAS (sin navegador ni servidor) de lo que hace la tanda con rutas inventadas. Uso: node scripts/destino/_v68_puras.mjs
// Empaqueta con esbuild las funciones puras de src/lib y las prueba. Sale con código 1 si algo falla. (`pruebaV68` puede importar el mismo empaquetado: `cargarPuras()`.)
import { build } from 'esbuild'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function cargarPuras() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v68-'))
  const salida = path.join(dir, 'puras.mjs')
  await build({
    stdin: {
      contents: `export { colocarEntradaConSusSitios, placeReservedEntrance, reapplyReservations } from './src/lib/bookings'
export { sitiosRepetidos, repetidosNuevos, guardianDeSitios, claveDeSitio } from './src/lib/sinSitiosRepetidos'
export { recuperarDiaCompleto } from './src/lib/recuperarDia'
export { resumenDeLoMovido } from './src/lib/loQueHizoLaReserva'
export { numberedStopsOf, stopNumbersOf } from './src/lib/stopKind'`,
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: salida,
    logLevel: 'silent',
    define: { 'import.meta.env': '{}' },
  })
  return import(pathToFileURL(salida).href)
}

// ── rutas inventadas ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const parada = (id, name, time, durationMinutes = 45, extra = {}) => ({ id, name, time, durationMinutes, ...extra })
const dia = (n, stops, extra = {}) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', stops, meals: [], ...extra })
const ruta = (days) => ({ id: 'r', destination: 'Roma', days, answers: { dateRange: { start: '2027-07-13', end: '2027-07-15' } } })
const base = () =>
  ruta([
    dia(1, [parada('a1', 'Museos Vaticanos y Capilla Sixtina', '09:15', 180), parada('a2', 'Plaza de San Pedro', '12:25'), parada('a3', 'Basílica de San Pedro', '13:00', 90), parada('a4', 'Trastevere', '15:25'), parada('a5', 'Coliseo (noche)', '21:40', 45, { isNightExperience: true })]),
    dia(2, [parada('b1', 'Coliseo', '09:15', 80), parada('b2', 'Arco de Constantino', '10:35', 10), parada('b3', 'Foro Romano y Palatino', '10:45', 90), parada('b4', 'Plaza del Campidoglio', '12:15'), parada('b5', 'Altar de la Patria', '13:05'), parada('b6', 'Panteón', '16:45'), parada('b7', 'Piazza Navona', '18:10'), parada('b8', 'Fontana de Trevi (noche)', '21:40', 45, { isNightExperience: true })]),
    dia(3, [], { isReturnLeg: true }),
  ])
const reserva = (extra) => ({ id: 'res1', kind: 'entrada', dayNumber: null, paraQuien: null, ...extra })

const fallos = []
let n = 0
const debe = (cond, texto) => {
  n++
  if (!cond) fallos.push(texto)
}
const lista = (d) => d.stops.map((s) => `${s.time} ${s.name}`).join(' ; ')
const minutos = (t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1])

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const P = await cargarPuras()
  const ordenOk = (d) => {
    const horas = d.stops.map((s) => minutos(s.time))
    return horas.every((h, i) => i === 0 || h >= horas[i - 1])
  }
  // 1. «Coliseo, Foro y Palatino» a las 13:00 el 13 de julio (día 1): los DOS sitios viajan, el Coliseo a su hora y el Foro después; ninguno queda en el día 2.
  {
    const r = reserva({ refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: '2027-07-13', time: '13:00' })
    const out = P.placeReservedEntrance(base(), r)
    const d1 = out.days[0]
    const d2 = out.days[1]
    const ic = d1.stops.findIndex((s) => s.name === 'Coliseo')
    const ifo = d1.stops.findIndex((s) => s.name === 'Foro Romano y Palatino')
    debe(ic >= 0 && ifo >= 0, 'coliseo: el Coliseo y el Foro Romano y Palatino están en el día de la reserva')
    debe(d1.stops[ic]?.time === '13:00' && d1.stops[ic]?.reservedId === 'res1', 'coliseo: el Coliseo va a las 13:00 con la marca de la reserva')
    debe(ifo > ic && minutos(d1.stops[ifo].time) > minutos('13:00'), 'coliseo: el Foro y Palatino va DESPUÉS del Coliseo')
    debe(!d2.stops.some((s) => s.name === 'Coliseo' || s.name === 'Foro Romano y Palatino'), 'coliseo: ninguno de los dos se queda en su día de antes')
    debe(P.sitiosRepetidos(out).length === 0, 'coliseo: ningún sitio repetido (el Coliseo de noche no cuenta)')
    debe(ordenOk(d1) && ordenOk(d2), 'coliseo: las horas van en orden (los números salen en orden): ' + lista(d1))
    debe(d1.stops.some((s) => s.name === 'Coliseo (noche)'), 'coliseo: la visita de noche se queda')
  }
  // 2. Museos Vaticanos a las 15:00 el 14 de julio (día 2, el de la Roma antigua): entra a su hora, no el primero.
  {
    const r = reserva({ id: 'res2', refId: 'Museos Vaticanos y Capilla Sixtina', name: 'Museos Vaticanos y Capilla Sixtina', placeNames: ['Museos Vaticanos y Capilla Sixtina'], dateIso: '2027-07-14', time: '15:00' })
    const out = P.placeReservedEntrance(base(), r)
    const d2 = out.days[1]
    const i = d2.stops.findIndex((s) => s.name === 'Museos Vaticanos y Capilla Sixtina')
    debe(i > 0, 'vaticanos: no entra el primero del día (está en el puesto ' + i + ')')
    debe(d2.stops[i]?.time === '15:00', 'vaticanos: a las 15:00')
    debe(d2.stops.slice(0, i).every((s) => minutos(s.time) <= minutos('15:00')) && ordenOk(d2), 'vaticanos: lo de antes es de antes de las 15:00 y todo en orden: ' + lista(d2))
    debe(!out.days[0].stops.some((s) => s.name === 'Museos Vaticanos y Capilla Sixtina'), 'vaticanos: sale de su día de antes')
    debe(P.sitiosRepetidos(out).length === 0, 'vaticanos: nada repetido')
  }
  // 3. Free Tour a las 15:00 (por la tarde) y a las 10:00 (antes del Coliseo de las 09:15, que dura hasta las 10:35).
  {
    const conFT = (hora, dateIso) => {
      const r = ruta(base().days)
      r.days[0].stops.splice(1, 0, parada('ft', 'Free Tour por Roma', '10:00', 180, { isFreeTour: true }))
      return P.placeReservedEntrance(r, reserva({ id: 'res3', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], dateIso, time: hora }))
    }
    const a = conFT('15:00', '2027-07-14').days[1]
    const iA = a.stops.findIndex((s) => s.isFreeTour)
    debe(iA > 0 && a.stops[iA].time === '15:00' && ordenOk(a), 'freetour 15:00: por la tarde, no el primero: ' + lista(a))
    const b = conFT('10:00', '2027-07-14')
    const d2 = b.days[1]
    const iB = d2.stops.findIndex((s) => s.isFreeTour)
    const iColiseo = d2.stops.findIndex((s) => s.name === 'Coliseo')
    debe(iB >= 0 && iColiseo > iB && d2.stops[iB].time === '10:00', 'freetour 10:00: antes del Coliseo: ' + lista(d2))
    debe(ordenOk(d2), 'freetour 10:00: horas en orden: ' + lista(d2))
    debe(P.sitiosRepetidos(b).length === 0, 'freetour: no se repite')
  }
  // 4. Recuperar el día: el Free Tour pasó del día 2 al 1 y se recupera el 2 (y el 1): nada repetido y cada cosa en su día.
  {
    const orig1 = dia(1, [parada('a', 'A', '09:00'), parada('b', 'B', '11:00')])
    const orig2 = dia(2, [parada('x', 'X', '09:00'), parada('ft', 'Free Tour por Roma', '15:00', 180, { isFreeTour: true })])
    const movida = ruta([{ ...dia(1, [parada('a', 'A', '09:00'), parada('b', 'B', '11:00'), parada('ft', 'Free Tour por Roma', '15:00', 180, { isFreeTour: true })]), originalSnapshot: orig1 }, { ...dia(2, [parada('x', 'X', '09:00')]), originalSnapshot: orig2 }])
    const rec2 = P.recuperarDiaCompleto(movida, 'd2')
    debe(P.sitiosRepetidos(rec2).length === 0, 'recuperar 2: sin repetidos')
    debe(rec2.days[1].stops.some((s) => s.isFreeTour) && !rec2.days[0].stops.some((s) => s.isFreeTour), 'recuperar 2: el Free Tour vuelve al día 2 y sale del 1: ' + lista(rec2.days[0]))
    const rec1 = P.recuperarDiaCompleto(movida, 'd1')
    debe(P.sitiosRepetidos(rec1).length === 0 && rec1.days[1].stops.some((s) => s.isFreeTour) && !rec1.days[0].stops.some((s) => s.isFreeTour), 'recuperar 1: lo que entró desde el día 2 vuelve al día 2')
    debe(rec1.days[1].originalSnapshot == null && rec1.days[0].originalSnapshot == null, 'recuperar 1: los dos días vuelven a ser los originales (sin copia)')
    // Recuperar un día cuyo sitio salió a otro día con su propia copia distinta (se movió a un tercero).
    const tres = ruta([{ ...dia(1, [parada('a', 'A', '09:00')]), originalSnapshot: dia(1, [parada('a', 'A', '09:00'), parada('c', 'C', '12:00')]) }, dia(2, [parada('x', 'X', '09:00'), parada('c', 'C', '10:00')])])
    const rec = P.recuperarDiaCompleto(tres, 'd1')
    debe(P.sitiosRepetidos(rec).length === 0 && !rec.days[1].stops.some((s) => s.name === 'C') && rec.days[0].stops.some((s) => s.name === 'C'), 'recuperar: lo que salió a otro día (aunque ese día no tenga copia) vuelve y desaparece de allí')
  }
  // 5. Repetidos: dos Free Tour el 27 y el 28 son un fallo; la Fontana de día y «de noche» no.
  {
    const r = ruta([dia(1, [parada('1', 'Free Tour por Roma', '10:00', 180, { isFreeTour: true })]), dia(2, [parada('2', 'Free Tour por Roma', '10:00', 180, { isFreeTour: true }), parada('3', 'Fontana de Trevi', '09:00'), parada('4', 'Fontana de Trevi', '21:30', 45, { isNightExperience: true })])])
    const rep = P.sitiosRepetidos(r)
    debe(rep.length === 1 && rep[0].nombre === 'Free Tour por Roma', 'repetidos: el Free Tour dos veces sí, la Fontana de noche no')
    const g = P.guardianDeSitios(ruta([dia(1, [parada('1', 'A', '10:00')]), dia(2, [])]), ruta([dia(1, [parada('1', 'A', '10:00')]), dia(2, [parada('2', 'A', '10:00')])]), 'prueba')
    debe(!g.ok && g.route.days[1].stops.length === 0, 'guardián: un cambio que repite un sitio no se guarda (queda la ruta de antes)')
    const g2 = P.guardianDeSitios(r, r, 'prueba')
    debe(g2.ok, 'guardián: lo que ya venía repetido no es un fallo nuevo')
  }
  // 6. El resumen de lo que hizo la app.
  {
    const antes = base()
    const despues = P.placeReservedEntrance(base(), reserva({ refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: '2027-07-13', time: '13:00' }))
    const t = P.resumenDeLoMovido(antes, despues).texto
    debe(/Coliseo/.test(t) && /Foro Romano y Palatino/.test(t) && /Solo se han movido/.test(t), 'resumen: dice solo los dos sitios que se han movido: ' + t)
    const igual = P.resumenDeLoMovido(antes, antes).texto
    debe(/ningún sitio/.test(igual), 'resumen: sin cambios lo dice')
  }
  console.log(`${n - fallos.length}/${n} comprobaciones bien`)
  for (const f of fallos) console.log('FALLO:', f)
  process.exit(fallos.length ? 1 : 0)
}
