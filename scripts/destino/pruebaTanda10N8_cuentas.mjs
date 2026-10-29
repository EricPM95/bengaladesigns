// Tanda 10N8 (N4) · cuentas: «Lo tuyo» también en «Cada uno lo suyo» (8b-d), «Tu parte» con los [Para mí] (0a-6), el cambio del día de cada gasto (0b-7, migración 0063),
// lo «Solo para mí» del administrador guardado aparte (0b-2, migración 0062), vuelo y alojamiento para varios (7c/7d, migración 0061) y los textos «desde quien mira».
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10N8_cuentas.mjs      (lo puro necesita la API encendida; la base de datos es PGlite, sin Chrome)
import fs from 'node:fs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const eur = (amount) => ({ amount, currency: 'EUR' })

const { M } = await prepararSSR('scripts/destino/_10n8_entrada.tsx')
const { construirPresupuesto, aportacionesDelViaje, porPersonaDelPresupuesto, leerLoSuyo, textoLoHaPuesto, lineasDeMiVuelo, fotoDelCambio, deFila } = M

console.log('1. Lo puro: «Lo tuyo» en «Cada uno lo suyo»')
const PER = [{ id: 'eric', nombre: 'Eric' }, { id: 'ana', nombre: 'Ana' }]
const TODOS = PER.map((p) => p.id)
const ruta = { id: 'r1', destination: 'Roma', origin: 'Madrid', answers: { dateRange: { start: '2026-11-10', end: '2026-11-14' } }, arrivalPrecio: null, departurePrecio: null, days: [{ id: 'd1', dayNumber: 1, city: 'Roma', stops: [] }] }
const reserva = (id, nombre, precio, paraQuien) => ({ id, kind: 'entrada', refId: nombre, name: nombre, placeNames: [nombre], dateIso: '2026-11-12', dayNumber: null, time: '09:15', precio: eur(precio), ...(paraQuien ? { paraQuien } : {}) })
const base = (reservations, rep, gastos = []) => ({ route: ruta, reservations, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true, ...(rep ? { compartido: { gastos, extrasDeLaRutaMios: rep.yoId === 'eric', reparto: rep } } : {}) })
const reparto = (yoId, modo) => ({ yoId, adminId: 'eric', modo, esInvitado: yoId !== 'eric', todos: TODOS, entreDe: null })
const lineasDe = (p) => p.bloques.flatMap((b) => b.lineas)
{
  const rs = [reserva('p1', 'Panteón', 25, ['eric'])]
  for (const modo of ['cada_uno', 'conjunta']) {
    const p = construirPresupuesto(base(rs, reparto('eric', modo)))
    debe(p.total.amount === 0 && p.sumaLoTuyo.amount === 25 && p.totalConLoTuyo.amount === 25, '8b-d', `${modo}: «Del grupo 0 € · Lo tuyo 25 € · Total 25 €» (${p.total.amount}/${p.sumaLoTuyo.amount}/${p.totalConLoTuyo.amount})`)
    debe(!lineasDe(p).some((l) => l.id === 'reserva-p1') && p.loTuyo.length === 1, '8b-d', `${modo}: el Panteón sale en «Lo tuyo», no dentro de «Ruta»`)
  }
  const solo = construirPresupuesto(base(rs, undefined))
  debe(solo.total.amount === 25 && solo.loTuyo.length === 0 && lineasDe(solo).some((l) => l.id === 'reserva-p1'), '8b-d', 'viajando solo (sin reparto) todo suma en Ruta, como siempre')
  const deAna = construirPresupuesto(base(rs, reparto('ana', 'cada_uno')))
  debe(deAna.loTuyo.length === 0 && deAna.sumaLoTuyo.amount === 0, '8b-d', 'Ana no ve «Lo tuyo» de Eric')
  // 0a-6: un gasto [Para mí] de Extras cuenta en «Tu parte»
  const gasto = { id: 'g1', tripId: 't', autorId: 'eric', nombre: 'Regalo', precio: eur(40), ambito: 'mio', estado: 'aceptado', pagadoPor: [], entre: [], decididoPor: null, creadoEn: '2026-10-28' }
  const gasto2 = { id: 'g2', tripId: 't', autorId: 'eric', nombre: 'Cena', precio: eur(80), ambito: 'grupo', estado: 'aceptado', pagadoPor: ['eric'], entre: ['eric', 'ana'], decididoPor: null, creadoEn: '2026-10-28' }
  const pg = construirPresupuesto(base([], reparto('eric', 'cada_uno'), [gasto, gasto2]))
  debe(pg.total.amount === 80 && pg.sumaLoTuyo.amount === 40, '0a-6', 'el gasto [Para mí] va a «Lo tuyo» y el del grupo suma en Extras')
  const parte = porPersonaDelPresupuesto({ presupuesto: pg, gastos: [gasto, gasto2], reservas: [], entreDe: undefined, adminId: 'eric', todos: TODOS, yoId: 'eric' })
  debe(parte.tuParte === true && parte.centimos === 8000, '0a-6', `«Tu parte» de Eric = 40 € de la cena + 40 € de su regalo [Para mí]: ${parte.centimos}`)
}

console.log('2. «Lo ha puesto…» siempre desde quien mira')
{
  const nombres = { eric: 'Eric', ana: 'Ana', luis: 'Luis', marta: 'Marta' }
  const n = (id) => nombres[id] ?? ''
  const t = (ids, por, yo) => textoLoHaPuesto({ ids, puestoPor: por, yoId: yo, nombreDe: n, total: 4 })
  const a = t(['eric', 'ana'], 'eric', 'ana')
  debe(a.quien === 'Lo ha puesto Eric' && a.para === 'para Eric y para ti', '7b', `Ana ve «${a.quien} · ${a.para}»`)
  const b = t(['ana', 'luis'], 'ana', 'ana')
  debe(b.quien === 'Lo has puesto tú' && b.para === 'para ti y Luis', '7b', `Ana, que lo puso, ve «${b.quien} · ${b.para}»`)
  const c = t(['eric', 'ana', 'luis', 'marta'], 'eric', 'ana')
  debe(c.para === 'para todos', '7b', 'para todos')
  const d = t(['ana'], 'ana', 'ana')
  debe(d.para === 'solo para ti', '7b', 'solo para ti')
  const v = leerLoSuyo({ vuelo: { ida: { hora: '11:15', fecha: '2026-11-10', punto: 'Fiumicino' }, vuelta: { hora: '18:05', fecha: '2026-11-14' }, puestoPor: 'ana', para: ['ana', 'luis'] }, alojamiento: { name: 'Piso', puestoPor: 'ana', para: ['ana'] } })
  debe(v.vuelo?.puestoPor === 'ana' && v.vuelo.para?.length === 2 && v.vuelo.ida?.fecha === '2026-11-10' && v.alojamiento?.para?.[0] === 'ana', '7c', 'lo suyo guarda quién lo puso, para quién es y el día de cada tramo')
  const l = lineasDeMiVuelo(v.vuelo, { ida: 'mar 10', vuelta: 'sáb 14' })
  debe(l[0].includes('Ida · mar 10 · 11:15 · Fiumicino') && l[1].includes('Vuelta · sáb 14 · 18:05'), '7b', `las dos líneas del vuelo: ${l.join(' | ')}`)
}

console.log('3. El cambio del día de cada gasto (0b-7)')
{
  const cambioHoy = { fecha: '2026-10-28', tasas: { MXN: 20 } }
  debe(fotoDelCambio(eur(10), cambioHoy) === null, '0b-7', 'en euros no hace falta foto')
  const f2 = fotoDelCambio({ amount: 2150, currency: 'MXN' }, cambioHoy)
  debe(f2 && f2.fecha === '2026-10-28' && f2.tasas.MXN === 20 && Object.keys(f2.tasas).length === 1, '0b-7', 'la foto guarda la fecha y solo la tasa de la moneda del gasto')
  const g = deFila({ id: 'g', trip_id: 't', autor_id: 'eric', nombre: 'Cena', precio: { amount: 2150, currency: 'MXN' }, ambito: 'grupo', estado: 'aceptado', pagado_por: ['eric'], entre: ['eric', 'ana'], decidido_por: null, created_at: '2026-10-20', cambio: { fecha: '2026-10-20', tasas: { MXN: 25 } } })
  debe(g.cambio?.tasas.MXN === 25, '0b-7', 'el gasto lee su foto')
  const ap = aportacionesDelViaje({ gastos: [g], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: cambioHoy })
  debe(ap.length === 1 && ap[0].centimos === 8600, '0b-7', `2150 MXN con el cambio del día del gasto (25) = 86 €, no 107,50 € (el de hoy): ${ap[0]?.centimos}`)
  const sinFoto = aportacionesDelViaje({ gastos: [{ ...g, cambio: null }], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: cambioHoy })
  debe(sinFoto[0].centimos === 10750, '0b-7', 'sin foto (gasto de antes), el cambio de hoy como siempre')
  const manana = aportacionesDelViaje({ gastos: [g], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: { fecha: '2026-10-29', tasas: { MXN: 18 } } })
  debe(manana[0].centimos === ap[0].centimos, '0b-7', 'mañana, aunque cambie el cambio, la deuda no cambia')
}

console.log('4. La base de datos: 0061, 0062, 0063 (PGlite con las migraciones reales)')
const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0038|0040|0042|0043|0048|0049|0053|0055|0061|0062|0063)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
const { q, como, servidor, nuevoUsuario } = bd
for (const m of ['0061_', '0062_', '0063_']) debe(bd.aplicadas.some((x) => x.startsWith(m)), 'migracion', `la ${m.slice(0, 4)} se aplica sin errores`)
for (const archivo of fs.readdirSync('supabase/migrations').filter((f) => /^(0061|0062|0063)_/.test(f))) {
  try {
    await bd.db.exec('reset role')
    await bd.db.exec(leer(`supabase/migrations/${archivo}`))
    debe(true, 'migracion', `${archivo} se puede pegar dos veces`)
  } catch (e) {
    debe(false, 'migracion', `${archivo} repetida falla: ${String(e.message).slice(0, 160)}`)
    await bd.db.exec('rollback').catch(() => undefined)
  }
}
const eric = await nuevoUsuario('eric8@correo.es', false, 'ERIC GIL')
const ana = await nuevoUsuario('ana8@correo.es', false, 'Ana')
const luis = await nuevoUsuario('luis8@correo.es', false, 'Luis')
const rutaBd = JSON.stringify({ id: 'r1', destination: 'Roma', modoCuentas: 'cada_uno', answers: { dateRange: { start: '2026-11-10', end: '2026-11-14' } }, days: [] })
const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route, bookings) values ($1, $2::jsonb, $3::jsonb) returning id', [eric, rutaBd, '{}']))[0].id)
for (const u of [ana, luis]) await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, u, eric]))
const avisosDe = (uid) => servidor(() => q('select tipo, payload from public.avisos where user_id = $1 order by creado_en', [uid]))
{
  // 0062
  const res = (extra) => ({ id: 'e1', kind: 'entrada', refId: 'Panteon', name: 'Panteón', placeNames: ['Panteon'], dateIso: '2026-11-12', time: '09:00', precio: eur(25), ...extra })
  await como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: [res({ paraQuien: [eric] }), res({ id: 'e2', name: 'Foro', paraQuien: [eric, ana] })] })]))
  const lecturaAna = await como(ana, async () => (await q('select bookings from public.trips where id = $1', [viaje]))[0].bookings)
  debe(lecturaAna.reservations.length === 1 && lecturaAna.reservations[0].id === 'e2', '0b-2', 'Ana lee el viaje y NO le llega la reserva «Solo para mí» de Eric (ni en los datos)')
  const lecturaEric = await como(eric, async () => (await q('select reservas from public.reservas_privadas_admin where trip_id = $1', [viaje]))[0]?.reservas)
  debe(lecturaEric?.length === 1 && lecturaEric[0].id === 'e1', '0b-2', 'Eric la tiene aparte, en reservas_privadas_admin')
  const lecturaLuis = await como(luis, () => q('select * from public.reservas_privadas_admin where trip_id = $1', [viaje]))
  const lecturaAna2 = await como(ana, () => q('select * from public.reservas_privadas_admin where trip_id = $1', [viaje]))
  debe(lecturaLuis.length === 0 && lecturaAna2.length === 0, '0b-2', 'ni Luis ni Ana pueden leer la tabla privada (RLS)')
  await como(ana, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: [res({ id: 'e2', name: 'Foro', paraQuien: [eric, ana] })] })]))
  const sigue = await como(eric, async () => (await q('select reservas from public.reservas_privadas_admin where trip_id = $1', [viaje]))[0]?.reservas)
  debe(sigue?.length === 1, '0b-2', 'un guardado de otra persona no borra lo privado')
  await como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: [res({ paraQuien: [eric, luis] }), res({ id: 'e2', name: 'Foro', paraQuien: [eric, ana] })] })]))
  const ahora = await como(luis, async () => (await q('select bookings from public.trips where id = $1', [viaje]))[0].bookings)
  const tabla = await como(eric, async () => (await q('select reservas from public.reservas_privadas_admin where trip_id = $1', [viaje]))[0]?.reservas)
  debe(ahora.reservations.some((r) => r.id === 'e1') && tabla.length === 0, '0b-2', 'si deja de ser «Solo para mí», sale de la tabla y vuelve al viaje')
  await servidor(() => q('delete from public.avisos'))
  await como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: [res({ id: 'e3', name: 'Regalo', paraQuien: [eric] })] })]))
  debe((await avisosDe(ana)).length === 0 && (await avisosDe(luis)).length === 0, '0b-2', 'añadir algo «Solo para mí» no avisa a nadie')
}
{
  // 0063
  await como(ana, () => q("insert into public.trip_gastos (trip_id, autor_id, nombre, precio, ambito, estado, pagado_por, entre, cambio) values ($1, $2, 'Cena', $3::jsonb, 'grupo', 'aceptado', $4, '{}', $5::jsonb)", [viaje, ana, JSON.stringify({ amount: 2150, currency: 'MXN' }), `{${ana}}`, JSON.stringify({ fecha: '2026-10-20', tasas: { MXN: 25 } })]))
  const g = await como(eric, () => q('select cambio from public.trip_gastos where trip_id = $1', [viaje]))
  debe(g.length === 1 && g[0].cambio.tasas.MXN === 25, '0b-7', 'el gasto guarda la foto del cambio del día')
  let fallo = false
  try {
    await como(ana, () => q("insert into public.trip_gastos (trip_id, autor_id, nombre, precio, ambito, estado, pagado_por, cambio) values ($1, $2, 'Mala', $3::jsonb, 'grupo', 'aceptado', $4, $5::jsonb)", [viaje, ana, JSON.stringify({ amount: 5, currency: 'EUR' }), `{${ana}}`, JSON.stringify({ tasas: 3 })]))
  } catch {
    fallo = true
  }
  debe(fallo, '0b-7', 'una foto mal formada no entra')
}
{
  // 0061
  await servidor(() => q('delete from public.avisos'))
  const vuelo = { ida: { hora: '11:15', fecha: '2026-11-10' }, vuelta: { hora: '18:05', fecha: '2026-11-14' }, puestoPor: ana, para: [ana, luis] }
  await como(ana, () => q('select public.poner_lo_suyo_para($1, $2::jsonb, null, $3::uuid[], $4)', [viaje, JSON.stringify(vuelo), `{${ana},${luis}}`, 'ida mar 10 · 11:15, vuelta sáb 14 · 18:05']))
  const filas = await servidor(() => q('select user_id from public.lo_suyo_del_viaje where trip_id = $1 and vuelo is not null', [viaje]))
  debe(filas.length === 2 && filas.some((f) => f.user_id === ana) && filas.some((f) => f.user_id === luis), '7c', 'el vuelo de Ana queda puesto para Ana y para Luis (los marcados)')
  const aLuis = await avisosDe(luis)
  debe(aLuis.length === 1 && aLuis[0].payload.para_txt === 'ti y Ana' && aLuis[0].payload.detalle.includes('vuelta sáb 14'), '7d', `un solo aviso a Luis, con ida y vuelta juntas: ${JSON.stringify(aLuis[0]?.payload?.para_txt)}`)
  const aEric = await avisosDe(eric)
  debe(aEric.length === 1 && aEric[0].payload.para_txt === 'Ana y Luis', '7d', `y uno al administrador: ${JSON.stringify(aEric[0]?.payload?.para_txt)}`)
  debe((await avisosDe(ana)).length === 0, '7d', 'nadie recibe aviso de lo que ha hecho él mismo')
  await servidor(() => q('delete from public.avisos'))
  await como(luis, () => q('select public.poner_lo_suyo_para($1, null, $2::jsonb, $3::uuid[], $4)', [viaje, JSON.stringify({ name: 'Mi piso', puestoPor: luis, para: [luis] }), `{${luis}}`, 'Mi piso']))
  const aE2 = await avisosDe(eric)
  debe(aE2.length === 1 && aE2[0].payload.caso === 'alojamiento_propio', '7d', 'solo para sí: al administrador le llega «ha puesto su propio alojamiento», una vez')
  let sinViaje = false
  try {
    const intruso = await nuevoUsuario('intruso8@correo.es', false, 'Intruso')
    await como(intruso, () => q('select public.poner_lo_suyo_para($1, $2::jsonb, null, $3::uuid[], $4)', [viaje, JSON.stringify(vuelo), `{${intruso}}`, 'x']))
  } catch {
    sinViaje = true
  }
  debe(sinViaje, '7c', 'quien no es del viaje no puede poner nada')
}

console.log('5. Lo que hay en el código')
{
  const sh = leer('src/components/route/reservas/AddReservationSheet.tsx')
  debe(!/la pasamos a ese día de tu viaje/.test(sh), '7a', 'fuera «Tu reserva es del viernes 13: la pasamos a ese día de tu viaje»')
  debe(/Ir a comprar/.test(sh) && /Ya la tengo · Guardarla/.test(sh) && /¿Has comprado la entrada/.test(sh) && /Guárdala aquí/.test(sh) && /Todavía no/.test(sh), '8', 'comprar a la misma hora: «Comprar a las …», «Ya la tengo · Guardarla» y la pregunta al volver')
  const lc = leer('src/components/route/reservas/LoDeCadaUno.tsx')
  debe(/Guardar el vuelo/.test(lc) && !/Pon tu vuelo/.test(lc), '7d', '«Guardar el vuelo»; ya no hay «Pon tu vuelo» suelto')
  debe(/Guardar el alojamiento/.test(lc), '7d', '«Guardar el alojamiento»')
  const llegada = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
  debe(!/\{falta \? 'Elige primero el punto' : 'Guardar'\}/.test(llegada), '7d', 'la rueda de la hora ya no tiene [Guardar]')
  const gasto = leer('src/components/route/presupuesto/HojaAnadirGasto.tsx')
  debe(!/>\s*Para mí\s*</.test(gasto), '7e', 'en «Añadir gasto» no hay [Para mí]')
  debe(/\[gv\.yoId\]/.test(gasto), '7e', '«¿Para quién es?» arranca con solo quien lo añade marcado')
  const pdf = leer('src/lib/exportPdf.ts')
  debe(/solo lo tuyo/.test(pdf) && /modoDeCuentas/.test(pdf), '0b-6', '(10N10) el PDF lleva el modo y «Mi cuenta, solo lo tuyo»')
  for (const f of ['PurchaseSection', 'StopReservation', 'ArrivalDetailSheet']) {
    const dir = f === 'StopReservation' ? 'reservas' : 'dayDetail'
    debe(/precioTiendaEnVista/.test(leer(`src/components/route/${dir}/${f}.tsx`)), 'moneda', `${f}: el precio sale en la moneda del viajero`)
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
