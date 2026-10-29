// Tanda 10N9 · §1 lo «Solo para mí» del administrador apartado SOLO en la cuenta conjunta (migración 0064, que sustituye a la 0062 y se aplica sin ella).
//   node scripts/destino/pruebaTanda10N9_cuentas.mjs      (PGlite con las migraciones reales, sin Chrome)
import fs from 'node:fs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const eur = (amount) => ({ amount, currency: 'EUR' })

console.log('1. La 0064 sin la 0062')
const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0038|0040|0042|0043|0048|0049|0053|0055|0061|0064)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
const { q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.some((x) => x.startsWith('0064_')) && !bd.aplicadas.some((x) => x.startsWith('0062_')), '1', 'la 0064 se aplica sin errores y sin la 0062')
try {
  await bd.db.exec('reset role')
  await bd.db.exec(leer('supabase/migrations/0064_solo_para_mi_admin_aparte_solo_conjunta.sql'))
  debe(true, '1', 'la 0064 se puede pegar dos veces')
} catch (e) {
  debe(false, '1', `la 0064 repetida falla: ${String(e.message).slice(0, 160)}`)
  await bd.db.exec('rollback').catch(() => undefined)
}

const eric = await nuevoUsuario('eric9@correo.es', false, 'ERIC GIL')
const ana = await nuevoUsuario('ana9@correo.es', false, 'Ana')
const luis = await nuevoUsuario('luis9@correo.es', false, 'Luis')
const ruta = (modo) => JSON.stringify({ id: 'r1', destination: 'Roma', modoCuentas: modo, answers: { dateRange: { start: '2026-11-10', end: '2026-11-14' } }, days: [] })
const res = (extra) => ({ id: 'e1', kind: 'entrada', refId: 'Panteon', name: 'Panteón', placeNames: ['Panteon'], dateIso: '2026-11-12', time: '09:00', precio: eur(25), ...extra })
const nuevoViaje = async (modo) => {
  const id = await como(eric, async () => (await q('insert into public.trips (traveler_id, route, bookings) values ($1, $2::jsonb, $3::jsonb) returning id', [eric, ruta(modo), '{}']))[0].id)
  for (const u of [ana, luis]) await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [id, u, eric]))
  return id
}
const guardar = (viaje, lista) => como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: lista })]))
const delViaje = (quien, viaje) => como(quien, async () => (await q('select bookings from public.trips where id = $1', [viaje]))[0].bookings)
const tablaDe = (viaje) => como(eric, async () => (await q('select reservas from public.reservas_privadas_admin where trip_id = $1', [viaje]))[0]?.reservas ?? [])

console.log('2. «Cada uno lo suyo»: sus entradas las siguen viendo los demás')
{
  const v = await nuevoViaje('cada_uno')
  await guardar(v, [res({ paraQuien: [eric] }), res({ id: 'e2', name: 'Foro', paraQuien: [eric, ana] })])
  const ana1 = await delViaje(ana, v)
  debe(ana1.reservations.length === 2 && ana1.reservations.some((r) => r.id === 'e1'), '1', 'en «Cada uno lo suyo» Ana sigue viendo la entrada del administrador (Eric la tiene a las 9:00)')
  debe((await tablaDe(v)).length === 0, '1', 'en «Cada uno lo suyo» no se aparta nada')
}

console.log('3. Cuenta conjunta: lo «Solo para mí» se aparta')
let conjunta
{
  conjunta = await nuevoViaje('conjunta')
  await guardar(conjunta, [res({ paraQuien: [eric] }), res({ id: 'e2', name: 'Foro', paraQuien: [eric, ana] })])
  const ana1 = await delViaje(ana, conjunta)
  debe(ana1.reservations.length === 1 && ana1.reservations[0].id === 'e2', '1', 'en la cuenta conjunta Ana NO recibe la reserva «Solo para mí» de Eric (ni en los datos)')
  const t = await tablaDe(conjunta)
  debe(t.length === 1 && t[0].id === 'e1', '1', 'Eric la tiene aparte')
  const l = await como(luis, () => q('select * from public.reservas_privadas_admin where trip_id = $1', [conjunta]))
  debe(l.length === 0, '1', 'Luis no puede leer la tabla privada')
  await como(ana, () => q('update public.trips set bookings = $2::jsonb where id = $1', [conjunta, JSON.stringify({ reservations: [res({ id: 'e2', name: 'Foro', paraQuien: [eric, ana] })] })]))
  debe((await tablaDe(conjunta)).length === 1, '1', 'un guardado de otra persona no borra lo apartado')
}

console.log('4. Del modo conjunto a «Cada uno lo suyo»: lo apartado vuelve')
{
  await como(eric, () => q('update public.trips set route = $2::jsonb where id = $1', [conjunta, ruta('cada_uno')]))
  const luis1 = await delViaje(luis, conjunta)
  debe(luis1.reservations.some((r) => r.id === 'e1') && luis1.reservations.some((r) => r.id === 'e2'), '1', 'al pasar a «Cada uno lo suyo», la entrada vuelve a trips.bookings y Luis la ve')
  debe((await tablaDe(conjunta)).length === 0, '1', 'y la tabla queda vacía')
  await guardar(conjunta, [res({ paraQuien: [eric] }), res({ id: 'e2', name: 'Foro', paraQuien: [eric, ana] })])
  debe((await tablaDe(conjunta)).length === 0 && (await delViaje(ana, conjunta)).reservations.length === 2, '1', 'ya en «Cada uno lo suyo», guardar no aparta nada')
}

console.log('5. Código del móvil')
{
  const t = leer('src/lib/reservasPrivadasAdmin.ts')
  debe(/esCuentaConjuntaDelServidor/.test(t) && /couple/.test(t) && /family/.test(t), '1', 'reservasPrivadasAdmin.ts solo actúa en la cuenta conjunta (misma regla que la base de datos)')
  const m = leer('supabase/migrations/0064_solo_para_mi_admin_aparte_solo_conjunta.sql')
  debe(/modo_cuentas_del_viaje\(new\.route\) is distinct from 'conjunta'/.test(m), '1', 'el disparador de la 0064 mira el modo')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
