// Tanda 10N7 (M2) · 2b-1: lo «Solo para mí» no lo ve nadie más, tampoco el administrador. La base de datos de verdad (PGlite con las migraciones reales, la 0055 incluida).
//   API_URL=http://localhost:8892 node scripts/destino/pruebaTanda10N7_privacidad.mjs
import fs from 'node:fs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0038|0040|0042|0043|0048|0049|0053|0055)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
const { q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.some((m) => m.startsWith('0055_')), 'migracion', 'la 0055 se aplica sin errores sobre la 0053')
const sql = sinComentarios(leer('supabase/migrations/0055_solo_para_mi_privado.sql'))
debe(!/alter table|drop table|avisos_tipo_check/i.test(sql), 'migracion', 'la 0055 no toca tablas ni la lista de tipos de aviso')
// Idempotente: pegarla otra vez no falla.
try {
  await bd.db.exec('reset role')
  await bd.db.exec(leer('supabase/migrations/0055_solo_para_mi_privado.sql'))
  debe(true, 'migracion', 'la 0055 se puede pegar dos veces')
} catch (e) {
  debe(false, 'migracion', `la 0055 repetida falla: ${String(e.message).slice(0, 200)}`)
  await bd.db.exec('rollback').catch(() => undefined)
}

const eric = await nuevoUsuario('eric7@correo.es', false, 'ERIC GIL')
const ana = await nuevoUsuario('ana7@correo.es', false, 'Ana')
const luis = await nuevoUsuario('luis7@correo.es', false, 'Luis')
const rutaDe = (modo, companion) => JSON.stringify({ id: 'r1', destination: 'Roma', ...(modo ? { modoCuentas: modo } : {}), answers: { ...(companion ? { companion } : {}), dateRange: { start: '2026-11-10', end: '2026-11-14' } }, days: [], arrivalFlightTime: '10:00', arrivalPointId: 'x' })
const crear = async (ruta) => {
  const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route, bookings) values ($1, $2::jsonb, $3::jsonb) returning id', [eric, ruta, '{}']))[0].id)
  for (const u of [ana, luis]) await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, u, eric]))
  return viaje
}
const avisosDe = (uid) => servidor(() => q('select tipo, payload from public.avisos where user_id = $1 order by creado_en', [uid]))
const reserva = (extra = {}) => ({ id: 'res-1', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', shortName: 'el Coliseo', placeNames: ['Coliseo'], dateIso: '2026-11-12', time: '09:15', precio: { amount: 80, currency: 'EUR' }, ...extra })

console.log('1. modo_cuentas_del_viaje')
{
  const m = async (r) => (await servidor(() => q('select public.modo_cuentas_del_viaje($1::jsonb) as m', [r])))[0].m
  debe((await m(rutaDe('conjunta'))) === 'conjunta' && (await m(rutaDe('cada_uno', 'couple'))) === 'cada_uno', '2b-1', 'lo elegido manda sobre «¿Con quién viajas?»')
  debe((await m(rutaDe(null, 'couple'))) === 'conjunta' && (await m(rutaDe(null, 'family'))) === 'conjunta' && (await m(rutaDe(null, 'group'))) === 'cada_uno' && (await m(rutaDe(null, null))) === 'cada_uno', '2b-1', 'sin elegir: pareja y familia = conjunta; amigos y sin dato = cada uno lo suyo')
}

console.log('2. Entradas «Solo para mí» en una cuenta conjunta: ningún aviso')
{
  const viaje = await crear(rutaDe('conjunta'))
  // El administrador reserva solo para él.
  await como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: [reserva({ id: 'e1', paraQuien: [eric] })] })]))
  debe((await avisosDe(ana)).length === 0 && (await avisosDe(luis)).length === 0, '2b-1', 'el administrador reserva «Solo para mí» en una cuenta conjunta: no llega ningún aviso a nadie')
  // Para todos: sí avisa.
  await como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: [reserva({ id: 'e1', paraQuien: [eric] }), reserva({ id: 'e2', refId: 'Foro', name: 'Foro', shortName: 'el Foro', paraQuien: [eric, ana, luis], time: '11:00' })] })]))
  const aAna = await avisosDe(ana)
  debe(aAna.length === 1 && aAna[0].payload.sitio_nombre === 'Foro', '2b-1', 'lo común («Para todos») sí avisa, y solo de lo común: Ana recibe el del Foro y ninguno del Coliseo personal')
  // Un invitado reserva solo para él.
  await servidor(() => q('delete from public.avisos'))
  await como(ana, () => q('insert into public.reservas_invitado (trip_id, user_id, reservas) values ($1, $2, $3::jsonb)', [viaje, ana, JSON.stringify([reserva({ id: 'a1', paraQuien: [ana] })])]))
  debe((await avisosDe(eric)).length === 0 && (await avisosDe(luis)).length === 0, '2b-1', 'Ana reserva «Solo para mí»: ni el administrador ni Luis reciben aviso')
  // entradas_del_grupo: ni el administrador la ve
  const grupoEric = await como(eric, async () => (await q('select public.entradas_del_grupo($1) as r', [viaje]))[0].r)
  debe(grupoEric.every((g) => g.reservas.length === 0), '2b-1', 'entradas_del_grupo no le da al administrador la entrada «Solo para mí» de Ana')
  await como(ana, () => q('update public.reservas_invitado set reservas = $3::jsonb where trip_id = $1 and user_id = $2', [viaje, ana, JSON.stringify([reserva({ id: 'a1', paraQuien: [ana] }), reserva({ id: 'a2', refId: 'Panteon', name: 'Panteón', shortName: 'el Panteón', paraQuien: [ana, eric], time: '12:00' })])]))
  const grupoEric2 = await como(eric, async () => (await q('select public.entradas_del_grupo($1) as r', [viaje]))[0].r)
  debe(grupoEric2.length === 1 && grupoEric2[0].reservas.length === 1 && grupoEric2[0].reservas[0].id === 'a2', '2b-1', 'y la que es para los dos sí le llega')
  const avEric = await avisosDe(eric)
  debe(avEric.length === 1 && avEric[0].payload.sitio_nombre === 'Panteón', '2b-1', 'y su aviso')
}

console.log('3. «Cada uno lo suyo»: todo igual que con la 0053')
{
  const viaje = await crear(rutaDe('cada_uno'))
  await como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: [reserva({ id: 'e1', paraQuien: [eric] })] })]))
  debe((await avisosDe(ana)).length === 1, '1c', 'en «Cada uno lo suyo» la entrada solo para quien la paga sigue avisando (para que los demás reserven la suya)')
  await como(ana, () => q('insert into public.reservas_invitado (trip_id, user_id, reservas) values ($1, $2, $3::jsonb)', [viaje, ana, JSON.stringify([reserva({ id: 'a1', paraQuien: [ana], time: '10:00' })])]))
  const g = await como(luis, async () => (await q('select public.entradas_del_grupo($1) as r', [viaje]))[0].r)
  debe(g.length === 1 && g[0].reservas.length === 1, '1c', 'y entradas_del_grupo sigue enseñándola (solo cambia el dinero)')
}

console.log('4. Lo suyo de cada uno (vuelo y alojamiento propios) en una cuenta conjunta')
{
  const viaje = await crear(rutaDe('conjunta'))
  await servidor(() => q('delete from public.avisos'))
  await como(ana, () => q('insert into public.lo_suyo_del_viaje (trip_id, user_id, vuelo, alojamiento) values ($1, $2, $3::jsonb, $4::jsonb)', [viaje, ana, JSON.stringify({ ida: { hora: '09:00' } }), JSON.stringify({ name: 'Mi piso' })]))
  debe((await avisosDe(eric)).length === 0, '2b-1', 'Ana pone su propio vuelo y alojamiento en una cuenta conjunta: el administrador no recibe aviso')
  const paraEric = await como(eric, async () => (await q('select public.lo_suyo_del_grupo($1) as r', [viaje]))[0].r)
  const paraAna = await como(ana, async () => (await q('select public.lo_suyo_del_grupo($1) as r', [viaje]))[0].r)
  debe(paraEric.length === 0 && paraAna.length === 1, '2b-1', 'el administrador no sabe que Ana tiene lo suyo; Ana sí lo sabe de lo suyo')
  const v2 = await crear(rutaDe('cada_uno'))
  await servidor(() => q('delete from public.avisos'))
  await como(ana, () => q('insert into public.lo_suyo_del_viaje (trip_id, user_id, vuelo) values ($1, $2, $3::jsonb)', [v2, ana, JSON.stringify({ ida: { hora: '09:00' } })]))
  debe((await avisosDe(eric)).length === 1, '1c', 'en «Cada uno lo suyo» el aviso «Ana ha puesto su propio vuelo» sigue llegando')
  const g2 = await como(eric, async () => (await q('select public.lo_suyo_del_grupo($1) as r', [v2]))[0].r)
  debe(g2.length === 1, '1c', 'y lo_suyo_del_grupo sigue contándolo')
}

console.log('5. Gastos «Solo para mí» (trip_gastos): ni el administrador los lee')
{
  const viaje = await crear(rutaDe('conjunta'))
  await como(ana, () => q("insert into public.trip_gastos (trip_id, autor_id, nombre, precio, ambito, estado, pagado_por, entre) values ($1, $2, 'Regalo', $3::jsonb, 'mio', 'aceptado', '{}', '{}')", [viaje, ana, JSON.stringify({ amount: 40, currency: 'EUR' })]))
  const veEric = await como(eric, () => q('select nombre from public.trip_gastos where trip_id = $1', [viaje]))
  const veAna = await como(ana, () => q('select nombre from public.trip_gastos where trip_id = $1', [viaje]))
  const veLuis = await como(luis, () => q('select nombre from public.trip_gastos where trip_id = $1', [viaje]))
  debe(veEric.length === 0 && veLuis.length === 0 && veAna.length === 1, '2b-1', 'el gasto «Solo para mí» de Ana solo lo lee Ana (ni el administrador ni quien puede editar)')
  // Quien solo recomienda: su gasto «Para los dos» queda pendiente hasta que decida el administrador (2b-3).
  await como(ana, () => q("insert into public.trip_gastos (trip_id, autor_id, nombre, precio, ambito, estado, pagado_por, entre) values ($1, $2, 'Cena', $3::jsonb, 'grupo', 'pendiente', $4, '{}')", [viaje, ana, JSON.stringify({ amount: 80, currency: 'EUR' }), `{${ana}}`]))
  const pendienteEric = await como(eric, () => q("select nombre, estado from public.trip_gastos where trip_id = $1 and ambito = 'grupo'", [viaje]))
  debe(pendienteEric.length === 1 && pendienteEric[0].estado === 'pendiente', '2b-3', 'el gasto «Para los dos» de quien solo recomienda llega pendiente al administrador')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
