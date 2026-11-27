// La prueba de la TANDA V68: guardar una reserva para otro día, «Recuperar el día», nunca un sitio dos veces y que Reorganizar nunca quite nada (docs/dias/PROMPT_TANDA_V68.md, DECISIONES_V68.md).
//   node scripts/destino/pruebaV68.mjs                      (Roma; hace falta la API en 8787 solo para la parte de Reorganizar)
//   V68_LANZAROTE=1 node scripts/destino/pruebaV68.mjs      (además Reorganizar en Lanzarote: la API normal; al acabar, déjala normal con _reiniciar_api.ps1)
//   V68_SIN_API=1 …                                         (solo la parte pura, sin API)
// Parte pura (sin navegador ni servidor): 1. Roma: las 26 comprobaciones de _v68_puras.mjs (Coliseo+Foro a su hora, Vaticanos a las 15:00, Free Tour 10:00 y 15:00, recuperar, repetidos, resumen).
// 2. Lanzarote: una reserva de un sitio y una entrada de dos sitios a otro día y a su hora; recuperar; nada repetido. 3. Los números de las paradas, en orden. 4. Reorganizar llama al guardián.
// Parte con la API: comprobarReorganizarV68.mjs (vuelo 15:30 y 17:30: nada «se quita», cambio mínimo, comida/cena según la hora real, franjas, idempotente).
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { cargarPuras } from './_v68_puras.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const minutos = (t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1])
const lista = (d) => d.stops.map((s) => `${s.time} ${s.name}`).join(' ; ')
const enOrden = (d) => d.stops.every((s, i) => i === 0 || minutos(s.time) >= minutos(d.stops[i - 1].time))

/* ───────────────────────── 1. Roma (funciones puras, 26 comprobaciones) ───────────────────────── */
console.log('1. Roma: reservas a otro día, recuperar, repetidos (_v68_puras.mjs)')
{
  const r = spawnSync(process.execPath, ['scripts/destino/_v68_puras.mjs'], { encoding: 'utf8' })
  const m = /(\d+)\/(\d+) comprobaciones bien/.exec(r.stdout)
  const total = m ? Number(m[2]) : 1
  const bien = m ? Number(m[1]) : 0
  comprobaciones += total
  if (r.status !== 0 || bien !== total) fallos.push({ regla: 'roma', texto: `las comprobaciones puras de Roma: ${bien}/${total}. ${(r.stdout.match(/FALLO:.*/g) ?? []).join(' | ')}` })
}

/* ───────────────────────── 2. Lanzarote y números en orden (funciones puras) ───────────────────────── */
console.log('2. Lanzarote: una reserva de un sitio y una entrada de dos sitios a otro día, a su hora')
const P = await cargarPuras()
const parada = (id, name, time, durationMinutes = 45, extra = {}) => ({ id, name, time, durationMinutes, ...extra })
const dia = (n, stops, extra = {}) => ({ id: `d${n}`, dayNumber: n, city: 'Lanzarote', stops, meals: [], ...extra })
const ruta = (days) => ({ id: 'r', destination: 'Lanzarote', days, answers: { dateRange: { start: '2027-03-07', end: '2027-03-10' } } })
const reserva = (extra) => ({ id: 'resL', kind: 'entrada', dayNumber: null, paraQuien: null, ...extra })
const baseLz = () =>
  ruta([
    dia(1, [parada('a1', 'Parque Nacional de Timanfaya', '09:30', 120), parada('a2', 'La Geria', '12:30', 60), parada('a3', 'El Golfo', '14:30', 45)]),
    dia(2, [parada('b1', 'Jameos del Agua', '09:30', 90), parada('b2', 'Cueva de los Verdes', '11:30', 60), parada('b3', 'Mirador del Río', '13:30', 45), parada('b4', 'Fundación César Manrique', '15:30', 75)]),
    dia(3, [parada('c1', 'Playa Blanca', '10:00', 90), parada('c2', 'Papagayo', '12:30', 120)]),
    dia(4, [], { isReturnLeg: true }),
  ])
{
  // Un solo sitio: la Cueva de los Verdes a las 16:30 el día 3; entra a su hora (no la primera) y sale del día 2.
  const out = P.placeReservedEntrance(baseLz(), reserva({ refId: 'Cueva de los Verdes', name: 'Cueva de los Verdes', placeNames: ['Cueva de los Verdes'], dateIso: '2027-03-09', time: '16:30' }))
  const d3 = out.days[2]
  const i = d3.stops.findIndex((s) => s.name === 'Cueva de los Verdes')
  debe(i > 0 && d3.stops[i].time === '16:30', 'lanzarote', 'la Cueva de los Verdes va a las 16:30 en el día 3, no la primera: ' + lista(d3))
  debe(!out.days[1].stops.some((s) => s.name === 'Cueva de los Verdes'), 'lanzarote', 'sale del día 2')
  debe(enOrden(d3) && P.sitiosRepetidos(out).length === 0, 'lanzarote', 'horas en orden y nada repetido: ' + lista(d3))
  debe(out.days[1].stops.length === 3, 'lanzarote', 'el resto del día 2 se queda (solo se mueve ese sitio)')
}
{
  // Entrada de dos sitios (Jameos + Cueva) a otro día, a las 11:00: los dos viajan, Jameos a su hora, la Cueva después; ninguno se queda atrás.
  const out = P.placeReservedEntrance(baseLz(), reserva({ id: 'resL2', refId: 'Jameos del Agua y Cueva de los Verdes', name: 'Jameos del Agua y Cueva de los Verdes', placeNames: ['Jameos del Agua', 'Cueva de los Verdes'], dateIso: '2027-03-09', time: '11:00' }))
  const d3 = out.days[2]
  const ij = d3.stops.findIndex((s) => s.name === 'Jameos del Agua')
  const ic = d3.stops.findIndex((s) => s.name === 'Cueva de los Verdes')
  debe(ij >= 0 && ic >= 0, 'lanzarote', 'los dos sitios de la entrada están en el día de la reserva: ' + lista(d3))
  debe(d3.stops[ij]?.time === '11:00' && ic > ij, 'lanzarote', 'Jameos a las 11:00 y la Cueva después')
  debe(!out.days[1].stops.some((s) => s.name === 'Jameos del Agua' || s.name === 'Cueva de los Verdes'), 'lanzarote', 'ninguno de los dos se queda en el día 2')
  debe(enOrden(d3) && P.sitiosRepetidos(out).length === 0, 'lanzarote', 'horas en orden y nada repetido')
  // Recuperar el día 2 deshace lo que le tocó (cuando el día lleva su copia).
  const conCopia = { ...out, days: out.days.map((d, k) => (k === 1 ? { ...d, originalSnapshot: baseLz().days[1] } : d)) }
  const rec = P.recuperarDiaCompleto(conCopia, 'd2')
  debe(P.sitiosRepetidos(rec).length === 0 && rec.days[1].stops.some((s) => s.name === 'Jameos del Agua') && !rec.days[2].stops.some((s) => s.name === 'Jameos del Agua'), 'lanzarote', 'recuperar el día 2: Jameos vuelve y no queda repetido en el día 3')
}
console.log('3. Los números de las paradas, siempre en orden (nunca un 4 encima del 1)')
{
  const casos = [
    ['roma', P.placeReservedEntrance({ id: 'r', destination: 'Roma', days: [dia(1, [parada('a', 'Coliseo', '09:15', 80), parada('b', 'Foro Romano y Palatino', '10:45', 90), parada('c', 'Panteón', '16:45')]), dia(2, [parada('x', 'Trastevere', '10:00')])], answers: {} }, reserva({ id: 'res9', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], dateIso: '2027-07-13', time: '10:00', dayNumber: 1 }))],
    ['lanzarote', P.placeReservedEntrance(baseLz(), reserva({ refId: 'Mirador del Río', name: 'Mirador del Río', placeNames: ['Mirador del Río'], dateIso: '2027-03-09', time: '10:30' }))],
  ]
  for (const [nombre, r] of casos) {
    for (const d of r.days) {
      const nums = [...P.stopNumbersOf(d).values()]
      debe(enOrden(d) && nums.every((n, k) => n === k + 1), 'numeros', `${nombre}, día ${d.dayNumber}: horas en orden y números 1..${nums.length} sin saltos: ${lista(d)}`)
    }
  }
}

/* ───────────────────────── 4. Reorganizar llama al guardián ───────────────────────── */
console.log('4. Reorganizar pasa por el guardián de sitios repetidos')
for (const f of ['src/lib/adaptarVuelos.ts', 'src/lib/reorganizarDia.ts']) {
  const t = fs.readFileSync(f, 'utf8')
  debe(/guardianDeSitios\(antes, resultado, 'reorganizar'\)/.test(t), 'guardian', `${f} llama a guardianDeSitios(antes, resultado, 'reorganizar') sobre el resultado completo`)
}
{
  const bien = P.guardianDeSitios(ruta([dia(1, [parada('1', 'A', '10:00')]), dia(2, [])]), ruta([dia(1, []), dia(2, [parada('1', 'A', '10:00')])]), 'reorganizar')
  const mal = P.guardianDeSitios(ruta([dia(1, [parada('1', 'A', '10:00')]), dia(2, [])]), ruta([dia(1, [parada('1', 'A', '10:00')]), dia(2, [parada('2', 'A', '10:00')])]), 'reorganizar')
  debe(bien.ok && !mal.ok && mal.route.days[1].stops.length === 0, 'guardian', 'mover un sitio vale; repetirlo no se guarda')
}

/* ───────────────────────── 5. Reorganizar con el vuelo a las 15:30 y a las 17:30 (con la API) ───────────────────────── */
async function reorganizar(destino, inicio, dias) {
  console.log(`5. Reorganizar en ${destino} con el vuelo a las 15:30 y a las 17:30`)
  const r = spawnSync(process.execPath, ['scripts/destino/comprobarReorganizarV68.mjs', destino, inicio, String(dias)], { encoding: 'utf8', env: { ...process.env, VUELOS: '15:30,17:30' }, timeout: 900000 })
  const salida = (r.stdout ?? '') + (r.stderr ?? '')
  const casos = [...salida.matchAll(/=== .*?, vuelo (\S+): (OK|FALLA)/g)]
  debe(casos.length === 2, 'reorganizar', `${destino}: salen los dos casos (15:30 y 17:30)`)
  for (const [, vuelo, res] of casos) {
    // 6 comprobaciones por caso: nada desaparece, nada repetido nuevo, 0 «se quita», comida/cena, franjas e idempotente.
    for (let k = 0; k < 6; k++) debe(res === 'OK', 'reorganizar', `${destino} ${vuelo}: ${(salida.match(/ERROR: .*/g) ?? []).join(' | ')}`)
    const m = new RegExp(`vuelo ${vuelo.replace(':', ':')}: OK\\s+Días que cambian: (\\d+) \\(.*?\\) de (\\d+)\\s+Tarjetas de la hoja: (\\d+); a pendientes: \\d+; quitadas: (\\d+)`).exec(salida)
    if (m) {
      debe(Number(m[4]) === 0, 'reorganizar', `${destino} ${vuelo}: 0 tarjetas «se quita»`)
      // (V74) Los Vaticanos y el Free Tour entran en el mejor día siguiente y lo menos importante de ese día sale a pendientes: pueden cambiar hasta 3 días (el de la llegada y los dos que reciben), nunca todos ni 45 tarjetas.
      debe(Number(m[1]) <= 3 && Number(m[1]) < Number(m[2]), 'reorganizar', `${destino} ${vuelo}: cambio mínimo (${m[1]} días de ${m[2]}, ${m[3]} tarjetas; antes 3 y 45)`)
      debe(Number(m[3]) <= 20, 'reorganizar', `${destino} ${vuelo}: pocas tarjetas (${m[3]})`)
    }
  }
  debe(r.status === 0, 'reorganizar', `${destino}: el script sale en 0 (${r.status}). ${salida.slice(-300)}`)
}
if (process.env.V68_SIN_API) console.log('5. (V68_SIN_API: Reorganizar con la API no se pasa)')
else {
  await reorganizar('Roma', '2026-11-27', 4)
  if (process.env.V68_LANZAROTE) await reorganizar('Lanzarote', '2027-03-07', 6)
  else console.log('   (Lanzarote en Reorganizar: solo con V68_LANZAROTE=1)')
}

console.log(`\nPrueba de la V68: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
