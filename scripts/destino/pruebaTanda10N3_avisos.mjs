// Tanda 10N3 (parte B): artículos en los avisos y «quitar a alguien borra sus propuestas sin decidir». No toca el motor de rutas.
//   node scripts/destino/pruebaTanda10N3_avisos.mjs
import fs from 'node:fs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

console.log('1. Los artículos en los avisos')
{
  await import('../../server/avisos.js') // (al cargarse pone la tabla de artículos de data/logros/articulos.json)
  const textos = await import('../../shared/avisos/textos.js')
  const t = (payload) => textos.textoDelAviso({ tipo: 'viaje_cambiado', payload })
  debe(t({ quien: 'Eric', anadidas: [{ nombre: 'Fontana de Trevi', fecha: '2026-11-28' }] }) === 'Eric ha cambiado el viaje: ha añadido la Fontana de Trevi al sábado 28', '2.2', '«ha añadido la Fontana de Trevi al sábado 28»')
  debe(/ha añadido el Coliseo/.test(t({ quien: 'Eric', anadidas: [{ nombre: 'Coliseo', dia_n: 1 }] })), '2.2', 'el → «el Coliseo»')
  debe(/ha quitado los Museos Capitolinos/.test(t({ quien: 'Eric', quitadas: [{ nombre: 'Museos Capitolinos' }] })), '2.2', 'los → «los Museos Capitolinos»')
  debe(/ha añadido Piazza Navona /.test(t({ quien: 'Eric', anadidas: [{ nombre: 'Piazza Navona', fecha: '2026-11-28' }] })), '2.2', 'sin artículo en la tabla: «Piazza Navona» a secas')
  debe(/ha añadido Sitio inventado/.test(t({ quien: 'Eric', anadidas: [{ nombre: 'Sitio inventado' }] })), '2.2', 'un sitio que no está en la tabla sale sin artículo')
  debe(/ha añadido el Coliseo \(noche\)|ha añadido el Coliseo/.test(t({ quien: 'Eric', anadidas: [{ nombre: 'Coliseo (noche)' }] })) && !/\(noche\)/.test(t({ quien: 'Eric', anadidas: [{ nombre: 'Coliseo (noche)' }] })), '2.2', 'el «(noche)» de las paradas no se cuela en el aviso')
  const tabla = JSON.parse(fs.readFileSync('data/logros/articulos.json', 'utf8')).roma
  const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
  const norma = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const claves = new Set(Object.keys(tabla).map(norma))
  debe(roma.places.every((p) => claves.has(norma(p.name))), '2.2', 'la tabla de artículos tiene TODOS los sitios de Roma')
  const sobra = roma.places.filter((p) => tabla[Object.keys(tabla).find((k) => norma(k) === norma(p.name))] === undefined)
  debe(sobra.length === 0, '2.2', 'ningún sitio de Roma sin valor en la tabla (vacío = sin artículo a propósito)')
  const srv = fs.readFileSync('server/avisos.js', 'utf8')
  debe(srv.includes('ponerTablaDeArticulos') && srv.includes('articulos.json'), '2.2', 'el servidor carga la tabla y los textos de la campana (y del móvil) salen de aquí: mismo texto en todas partes')
}

console.log('2. Quitar a alguien borra sus propuestas sin decidir (PGlite, migraciones reales)')
{
  const bd = await crearBaseDePrueba({ migraciones: /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0039|0041)_/, alFallar: (m) => debe(false, 'migracion', m) })
  const { q, como, servidor, nuevoUsuario } = bd
  debe(bd.aplicadas.includes('0041_quitar_borra_propuestas.sql'), '2.3', 'la 0041 se aplica sobre las anteriores')
  const eric = await nuevoUsuario('eric@x.es', false, 'Eric')
  const ana = await nuevoUsuario('ana@x.es', false, 'Ana')
  const luis = await nuevoUsuario('luis@x.es', false, 'Luis')
  const ruta = JSON.stringify({ id: 'r', destination: 'Roma', answers: { dateRange: { start: '2026-11-26', end: '2026-11-29' } }, days: [] })
  const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, ruta]))[0].id)
  const inv = await como(eric, async () => (await q('select public.crear_invitacion($1, null, 10) as r', [viaje]))[0].r)
  for (const u of [ana, luis]) await como(u, () => q('select public.canjear_invitacion($1)', [inv.codigo]))
  const recomendar = (u, tipo = 'cambio') => como(u, async () => (await q("insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, $2, '{}'::jsonb) returning id", [viaje, tipo]))[0].id)
  const a1 = await recomendar(ana)
  const a2 = await recomendar(ana, 'dia')
  const a3 = await recomendar(ana)
  const l1 = await recomendar(luis)
  await como(eric, () => q("update public.trip_recommendations set estado = 'aceptada' where id = $1", [a2]))
  await como(eric, () => q("update public.trip_recommendations set estado = 'rechazada' where id = $1", [a3]))
  const estados = async () => Object.fromEntries((await servidor(() => q('select id, estado from public.trip_recommendations'))).map((r) => [r.id, r.estado]))
  let e = await estados()
  debe(e[a1] === 'pendiente' && e[a2] === 'aceptada' && e[a3] === 'rechazada' && e[l1] === 'pendiente', '2.3', 'antes de quitar: una pendiente, una aceptada y una rechazada de Ana, y una pendiente de Luis')
  const r = await como(eric, async () => (await q('select public.quitar_del_viaje($1, $2) as r', [viaje, ana]))[0].r)
  e = await estados()
  debe(r.propuestas_borradas === 1 && !(a1 in e), '2.3', 'se borra la propuesta de Ana que nadie había decidido')
  debe(e[a2] === 'aceptada' && e[a3] === 'rechazada', '2.3', 'las ya decididas (aceptada y rechazada) se quedan')
  debe(e[l1] === 'pendiente', '2.3', 'las de otras personas no se tocan')
  const av = await servidor(() => q("select leido_en from public.avisos where user_id = $1 and tipo = 'recomendacion' and clave = $2", [eric, 'rec:' + a1]))
  debe(av.length === 0 || av[0].leido_en !== null, '2.3', 'el aviso de la campana de esa propuesta borrada queda leído')
  const s = await como(luis, async () => (await q('select public.salir_del_viaje($1) as r', [viaje]))[0].r)
  debe(s.propuestas_borradas === 1 && !((l1) in (await estados())), '2.3', 'al salir uno mismo también se borran sus propuestas sin decidir')
  const quitado = await servidor(() => q("select 1 from public.avisos where user_id = $1 and tipo = 'quitado'", [ana]))
  debe(quitado.length === 1, '2.3', 'sigue llegando el aviso «Ya no formas parte del viaje»')
}

console.log('3. La propuesta sin enviar de un viaje que ya no se ve se borra del móvil')
{
  const { limpiarPropuestasHuerfanas } = await import('../../src/lib/propuestasHuerfanas.ts')
  const m = new Map([['trazo:propuesta:V1', 'x'], ['trazo:propuesta:V2', 'x'], ['trazo:propuesta-procesada:V2', 'x'], ['trazo:otra:V2', 'x'], ['trazo:propuesta:V3', 'x']])
  const almacen = { get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null, removeItem: (k) => m.delete(k) }
  const borradas = limpiarPropuestasHuerfanas(['V1', 'V3'], almacen)
  debe(borradas.sort().join() === 'trazo:propuesta-procesada:V2,trazo:propuesta:V2' && m.has('trazo:propuesta:V1') && m.has('trazo:propuesta:V3') && m.has('trazo:otra:V2'), '2.3', 'se borra la propuesta (y sus procesadas) del viaje que ya no está; las de los viajes que sí se ven y las claves ajenas se quedan')
  const t = fs.readFileSync('src/components/sync/TripSync.tsx', 'utf8')
  debe(t.includes('limpiarPropuestasHuerfanas(trips.map'), '2.3', 'al abrir la app, con los viajes ya cargados, se limpia')
  debe(fs.readFileSync('src/lib/personasViaje.ts', 'utf8').includes('olvidarPropuestaDe(tripId)'), '2.3', 'y también al dejar de ver el viaje en directo')
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '-', f.texto)
process.exit(fallos.length ? 1 : 0)
