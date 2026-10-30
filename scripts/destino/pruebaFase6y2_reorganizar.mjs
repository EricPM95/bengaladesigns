// La prueba de la Tanda 6y2 (puntos 1 y 2): el orden de prioridad de «Reorganizar este día» y los puntos de las zonas del alojamiento.
//   node scripts/destino/pruebaFase6y2_reorganizar.mjs
// Enciende ella misma el servidor de este árbol en el puerto 8797 (para no chocar con otras pruebas) (para comprobar que la zona del alojamiento llega de verdad hasta el orden).
// Complementa a pruebaFase6y_reorganizar.mjs (nuestros días escritos desordenados y los 200 días mezclados).
import { spawn } from 'node:child_process'
import { reorganizarDia, puntoZonaAlojamiento } from '../../shared/routeEngine/reorganizarDia.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const D = findPipelineV2Data('Roma')
const W = writtenDaysFor('roma')
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const placeBy = new Map(D.places.map((p) => [p.name, p]))
const nocturnas = new Set(D.night_experiences.map((n) => n.name))
const coordsDe = (n) => placeBy.get(n)?.coordinates ?? D.night_experiences.find((x) => x.name === n)?.coordinates ?? null
const mk = (items) => items.map((it, i) => {
  const o = typeof it === 'string' ? { name: it } : it
  return { id: `s${i}`, night: nocturnas.has(o.name), freeTour: o.name === 'Free Tour por Roma', ...o }
})
const ordenDe = (items, extra = {}) => {
  const stops = mk(items)
  const r = reorganizarDia({ stops, written: W, destData: D, hasLunch: true, hasDinner: true, ...extra })
  return { ...r, names: r.order.map((id) => stops.find((s) => s.id === id).name), stops }
}
const camino = (puntos) => puntos.slice(1).reduce((s, p, i) => s + straightLineMeters(puntos[i], p), 0)
const unir = (a) => a.join(' > ')

// ── 1. El orden de prioridad ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// (5 contra 6) La cercanía manda sobre «mañana antes que tarde»: la tarde del Tridente va antes que la mañana del Aventino porque queda más cerca de nada que arrastrar.
{
  const puso = ['Ojo de la Cerradura del Aventino', 'Cementerio Protestante', 'Plaza de España', 'Via Condotti']
  const r = ordenDe(puso)
  const tarde = r.names.indexOf('Plaza de España')
  const manana = r.names.indexOf('Ojo de la Cerradura del Aventino')
  const viejo = ['Ojo de la Cerradura del Aventino', 'Cementerio Protestante', 'Plaza de España', 'Via Condotti']
  debe(tarde < manana, 'P5_cercania', `la tarde del Tridente no va antes que la mañana del Aventino: ${unir(r.names)}`)
  debe(camino(r.names.map(coordsDe)) < camino(viejo.map(coordsDe)) - 100, 'P5_cercania', `el camino no es más corto que con la mañana primero: ${unir(r.names)}`)
  // Lo que va junto en un día escrito sigue en su orden: la mañana del Aventino delante de su tarde.
  debe(manana < r.names.indexOf('Cementerio Protestante'), 'P4_juntos', `la mañana y la tarde del mismo día escrito se han separado de orden: ${unir(r.names)}`)
}
// (6) Mañana o tarde solo desempata: a igual distancia, la mañana va delante. Dos sitios de días distintos con el MISMO punto.
for (const [a, b] of [['Boca de la Verdad', 'Plaza de San Pedro'], ['Plaza de San Pedro', 'Boca de la Verdad']]) {
  const punto = { lat: 41.9, lng: 12.5 }
  const r = ordenDe([{ name: a, coordinates: punto }, { name: b, coordinates: punto }])
  debe(r.names[0] === 'Boca de la Verdad', 'P6_desempate', `con la misma distancia, la mañana (Boca de la Verdad) no va primero: ${unir(r.names)} (puso ${a}, ${b})`)
}
// (1) Lo reservado va primero en su parte, por la hora entre reservas.
{
  const r = ordenDe(['Coliseo', 'Altar de la Patria', { name: 'Museos Vaticanos y Capilla Sixtina', reservedTime: '09:00' }])
  debe(r.names[0] === 'Museos Vaticanos y Capilla Sixtina', 'P1_reservado', `lo reservado a las 9:00 no abre el día: ${unir(r.names)}`)
  const dos = ordenDe([{ name: 'Coliseo', reservedTime: '14:00' }, { name: 'Museos Vaticanos y Capilla Sixtina', reservedTime: '09:30' }, 'Panteón'])
  debe(dos.names.indexOf('Museos Vaticanos y Capilla Sixtina') < dos.names.indexOf('Coliseo'), 'P1_reservado', `dos reservas no van por su hora: ${unir(dos.names)}`)
  // Lo reservado no se compara con la hora de lo que no tiene reserva: la reserva de la mañana va delante aunque lo libre esté más cerca de casa.
  const casa = ordenDe(['Coliseo', 'Altar de la Patria', { name: 'Museos Vaticanos y Capilla Sixtina', reservedTime: '09:00' }], { lodging: [41.8902, 12.4922] })
  debe(casa.names[0] === 'Museos Vaticanos y Capilla Sixtina', 'P1_reservado', `la zona del alojamiento pasa por delante de lo reservado: ${unir(casa.names)}`)
}
// (2) Los momentos fuertes: primera hora sin gente al principio, el paseo de Trastevere al final de la tarde, las nocturnas de noche.
{
  const nocturna = [...nocturnas][0]
  const r = ordenDe(['Coliseo', nocturna, 'Panteón', 'Fontana de Trevi', 'Trastevere', 'Plaza de San Pedro'])
  debe(r.names[0] === 'Fontana de Trevi', 'P2_sin_gente', `Trevi (primera hora, sin gente) no abre el día: ${unir(r.names)}`)
  debe(r.names.at(-1) === nocturna, 'P2_noche', `la nocturna no cierra el día: ${unir(r.names)}`)
  debe(r.names.at(-2) === 'Trastevere', 'P2_trastevere', `el paseo de Trastevere no es lo último de la tarde: ${unir(r.names)}`)
  debe(r.mealAfter.dinner === r.order.indexOf(r.stops.find((s) => s.name === 'Trastevere').id), 'P2_trastevere', 'la cena no va después del paseo de Trastevere')
  // Trevi sigue abriendo el día aunque el alojamiento esté lejos (Prati).
  const casa = ordenDe(['Coliseo', 'Fontana de Trevi', 'Plaza de San Pedro'], { lodging: puntoZonaAlojamiento(D, 'prati') })
  debe(casa.names[0] === 'Fontana de Trevi', 'P2_sin_gente', `con alojamiento en Prati, Trevi no abre el día: ${unir(casa.names)}`)
}
// (3) Dentro de cada grupo, el orden de nuestro día escrito (aunque otro orden fuera más corto): lo cubre la prueba de los días escritos (pruebaFase6y_reorganizar.mjs, A).
// La comida entre grupos, nunca al principio ni al final; la cena al final.
{
  const r = ordenDe(['Coliseo', 'Panteón', 'Plaza de San Pedro', 'Altar de la Patria'])
  debe(r.mealAfter.lunch > 0 && r.mealAfter.lunch < r.names.length - 1, 'P_comida', `la comida no está entre medias: ${JSON.stringify(r.mealAfter)}`)
  debe(r.mealAfter.dinner === r.names.length - 1, 'P_comida', 'la cena no es lo último')
}

// ── 2. Los puntos de las zonas del alojamiento ───────────────────────────────────────────────────────────────────────────────────────
const zonas = D.destination_config.zonas_alojamiento
debe(zonas.length >= 7, 'Z_zonas', `faltan zonas de alojamiento (${zonas.length})`)
for (const z of zonas) {
  if (z.id === 'nose') {
    debe(puntoZonaAlojamiento(D, 'nose') === null && !z.coordinates, 'Z_nose', '«Aún no lo sé» no debe tener punto')
    continue
  }
  const c = z.coordinates
  const ok = c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && c.lat > 41.75 && c.lat < 42.05 && c.lng > 12.35 && c.lng < 12.65
  debe(Boolean(ok), 'Z_punto', `la zona «${z.id}» no tiene un punto lat/lng válido dentro de Roma (${JSON.stringify(c)})`)
  const p = puntoZonaAlojamiento(D, z.id)
  debe(Array.isArray(p) && p[0] === c?.lat && p[1] === c?.lng, 'Z_lector', `el lector no devuelve el punto de «${z.id}»`)
}
debe(puntoZonaAlojamiento(D, null) === null && puntoZonaAlojamiento(D, 'no_existe') === null, 'Z_lector', 'una zona que no existe debería dar null')
// El texto que ve el viajero no cambia (id, nombre, sub), y el servidor se las pasa tal cual al cliente.
debe(zonas.every((z) => typeof z.id === 'string' && typeof z.nombre === 'string'), 'Z_forma', 'una zona perdió su id o su nombre')
// Cada punto queda cerca de lo que dice su nombre (a menos de 1,2 km del sitio de referencia).
const REFERENCIA = { centro: 'Panteón', plaza_de_espana: 'Plaza de España', prati: 'Plaza de San Pedro', trastevere: 'Iglesia de Santa Maria in Trastevere', termini: null, monti: 'Basílica de Santa María la Mayor' }
for (const [id, lugar] of Object.entries(REFERENCIA)) {
  const p = puntoZonaAlojamiento(D, id)
  const ref = lugar ? coordsDe(lugar) : [41.9009, 12.5016]
  if (!ref) { fallos.push({ regla: 'Z_cerca', texto: `no hay referencia para ${id} (${lugar})` }); continue }
  debe(straightLineMeters(p, ref) < (id === 'prati' ? 1800 : 1200), 'Z_cerca', `la zona ${id} queda a ${Math.round(straightLineMeters(p, ref))} m de ${lugar ?? 'Termini'}`)
}

// ── 3. El día empieza por el grupo más cerca de la zona (sin primera hora ni reservado) ─────────────────────────────────────────────────
{
  const sitios = ['Plaza de San Pedro', 'Boca de la Verdad']
  const vistos = new Set()
  for (const id of ['prati', 'monti', 'termini', 'trastevere', 'centro', 'plaza_de_espana']) {
    const punto = puntoZonaAlojamiento(D, id)
    const primero = [...sitios].sort((a, b) => straightLineMeters(punto, coordsDe(a)) - straightLineMeters(punto, coordsDe(b)))[0]
    vistos.add(primero)
    for (const entrada of [sitios, [...sitios].reverse()]) {
      const r = ordenDe(entrada, { lodging: punto })
      debe(r.names[0] === primero, 'Z_empieza_cerca', `con alojamiento en ${id} el día no empieza por ${primero}: ${unir(r.names)}`)
    }
  }
  debe(vistos.size === 2 && sitios.includes('Plaza de San Pedro') && vistos.has('Boca de la Verdad') && vistos.has('Plaza de San Pedro'), 'Z_dato_prueba', '(la prueba) las zonas no se reparten entre los dos sitios: la prueba no distingue nada')
  // Con primera hora (Trevi) o con algo reservado, la zona no manda sobre ellos.
  const conReserva = ordenDe(['Plaza de San Pedro', { name: 'Coliseo', reservedTime: '09:00' }], { lodging: puntoZonaAlojamiento(D, 'prati') })
  debe(conReserva.names[0] === 'Coliseo', 'Z_no_manda', `la zona manda sobre una reserva: ${unir(conReserva.names)}`)
  // Sin zona (null) el orden es el de siempre.
  const sinZona = ordenDe(['Plaza de San Pedro', 'Coliseo'], { lodging: null })
  const nose = ordenDe(['Plaza de San Pedro', 'Coliseo'], { lodging: puntoZonaAlojamiento(D, 'nose') })
  debe(unir(sinZona.names) === unir(nose.names), 'Z_nose', '«Aún no lo sé» cambia el orden')
}
// Propiedad: con la zona, el camino desde el alojamiento nunca es más largo que sin ella (60 días de 4 a 7 sitios, semilla fija; sin primera hora ni reservas).
{
  let semilla = 20261012
  const azar = () => { semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const todos = D.places.map((p) => p.name)
  let probados = 0
  for (let n = 0; n < 120 && probados < 60; n++) {
    const k = 4 + Math.floor(azar() * 4)
    const nombres = [...new Set(Array.from({ length: k }, () => todos[Math.floor(azar() * todos.length)]))]
    const sin = ordenDe(nombres)
    if ((sin.moments?.primera ?? []).length) continue
    probados++
    for (const z of zonas.filter((x) => x.id !== 'nose')) {
      const punto = puntoZonaAlojamiento(D, z.id)
      const con = ordenDe(nombres, { lodging: punto })
      debe(con.names.length === nombres.length && new Set(con.names).size === nombres.length, 'Z_mismas', `${z.id}: no son las mismas paradas`)
      const largo = (names) => camino([punto, ...names.filter((x) => !nocturnas.has(x)).map(coordsDe)])
      debe(largo(con.names) <= largo(sin.names) + 1, 'Z_no_peor', `${z.id}: con la zona el camino es más largo (${Math.round(largo(con.names))} contra ${Math.round(largo(sin.names))}) para ${nombres.join(', ')}`)
    }
  }
  debe(probados >= 40, 'Z_muestra', `solo se probaron ${probados} días`)
}

// ── 4. De punta a punta: el servidor lee el punto de la zona ───────────────────────────────────────────────────────────────────────────
const PUERTO = 8797
const servidor = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, SERVER_PORT: String(PUERTO) }, stdio: 'ignore' })
const apagar = () => { try { servidor.kill() } catch { /* ya apagado */ } }
process.on('exit', apagar)
const URL_BASE = `http://localhost:${PUERTO}`
for (let i = 0; i < 60; i++) {
  try { const p = await fetch(`${URL_BASE}/api/destination-excursions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }); if (p.ok) break } catch { /* aún no */ }
  await new Promise((r) => setTimeout(r, 500))
}
const pedir = async (zona) => {
  const stops = [{ id: 'a', name: 'Plaza de San Pedro' }, { id: 'b', name: 'Boca de la Verdad' }]
  const res = await fetch(`${URL_BASE}/api/reorganizar-dia`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', stops, has_lunch: true, has_dinner: true, accommodation_zone: zona }) })
  return { ok: res.ok, cuerpo: await res.json() }
}
for (const [zona, primero] of [['prati', 'a'], ['monti', 'b'], ['termini', 'b'], ['nose', null], [null, null]]) {
  const r = await pedir(zona)
  debe(r.ok && Array.isArray(r.cuerpo.order) && r.cuerpo.order.length === 2, 'S_servidor', `${zona}: el servidor no responde bien (${JSON.stringify(r.cuerpo)})`)
  if (primero) debe(r.cuerpo.order[0] === primero, 'S_servidor', `con la zona ${zona} el servidor no empieza por ${primero}: ${JSON.stringify(r.cuerpo.order)}`)
}
{
  const res = await fetch(`${URL_BASE}/api/destination-excursions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })
  const datos = await res.json()
  debe(Array.isArray(datos.zonas_alojamiento) && datos.zonas_alojamiento.length === zonas.length && datos.zonas_alojamiento.every((z) => z.id && z.nombre), 'S_zonas_cliente', 'el servidor ya no entrega las zonas del alojamiento al cliente')
}
// (Tanda 10S: se espera a que el servidor de la prueba haya salido ANTES de process.exit; salir con un hijo cerrándose da el cierre raro 0xC0000409 de Windows.)
const servidorFuera = new Promise((r) => servidor.once('exit', r))
apagar()
await Promise.race([servidorFuera, new Promise((r) => setTimeout(r, 4000))])
await new Promise((r) => setTimeout(r, 300))

console.log(`\nPrueba 6y2 (Reorganizar): ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos.slice(0, 40)) console.log(`[${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
