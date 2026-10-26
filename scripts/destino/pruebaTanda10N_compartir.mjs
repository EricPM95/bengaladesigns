// La prueba de la Tanda 10N, parte B: compartir el viaje, las personas y sus permisos, abrir una invitación y los cambios en directo. No toca el motor de rutas.
//   node scripts/destino/pruebaTanda10N_compartir.mjs
//
// 1. La base de datos (PGlite con las migraciones reales, la 0036 incluida): permisos, quitar con plaza que vuelve, salir, editor que no toca fechas/vuelo, avisos de la campana.
// 2. El código del navegador (esbuild + Node): textos de la hoja, mismo código, tarjeta de RUTA, «Personas del viaje», invitación, tiempo real con un bus de mentira.
// 3. La pantalla (hace falta `npm run dev`/Vite; sin él se salta): capturas a tamaño de móvil en docs/dias/capturas_jutrip/10n_compartir_*.jpg.
// Lo que SOLO se prueba contra Supabase de verdad (Realtime por la red) queda dicho al final.
import fs from 'node:fs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

export const fallos = []
export let comprobaciones = 0
export const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const lanza = async (fn) => {
  try {
    await fn()
    return null
  } catch (error) {
    return String(error?.message ?? error)
  }
}

/* ═══════════════ 1. La base de datos ═══════════════ */
console.log('1. La base de datos (PGlite, migraciones reales hasta la 0036)')
const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
const { q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.includes('0036_permisos_del_viaje.sql'), 'migracion', 'la 0036 se aplica sobre las anteriores')
const sql036 = fs.readFileSync('supabase/migrations/0036_permisos_del_viaje.sql', 'utf8')
debe(!/avisos_tipo_check/.test(sql036.replace(/--.*$/gm, '')), '0036', 'la 0036 no toca la lista de tipos de aviso (la deja la 0035)')

const dia = (n, paradas) => ({ id: 'd' + n, dayNumber: n, city: 'Roma', stops: paradas.map(([id, name]) => ({ id, name })) })
const rutaDe = (dias, inicio = '2026-11-26', fin = '2026-11-29') => JSON.stringify({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: inicio, end: fin } }, days: dias, departureFlightTime: '10:00' })
const base = [dia(1, [['s1', 'Coliseo'], ['s2', 'Arco de Constantino']]), dia(2, [['s3', 'Vaticano']]), dia(3, [['s4', 'Trastevere']]), dia(4, [['s5', 'Villa Borghese']])]

const eric = await nuevoUsuario('eric@correo.es', false, 'Eric Gil')
const ana = await nuevoUsuario('ana@correo.es', false, 'Ana')
const luis = await nuevoUsuario('luis@correo.es', false, 'Luis')
const marta = await nuevoUsuario('marta@correo.es', false, 'Marta')
const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, rutaDe(base)]))[0].id)
const aviso = async (uid, tipo) => (await servidor(() => q("select payload, leido_en from public.avisos where user_id = $1 and tipo = $2 order by creado_en desc", [uid, tipo])))
const gente = async (uid) => como(uid, async () => (await q('select public.gente_del_viaje($1) as g', [viaje]))[0].g)

// Un pase Grupo de 4 de Eric, para ver la plaza que vuelve.
const pase = await servidor(async () => (await q("insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo, trip_id) values ('Roma', $1, 'grupo', 4, 1, 'PASEGRUP', $2) returning id", [eric, viaje]))[0])
await servidor(() => q('insert into public.pass_members (pass_id, user_id) values ($1, $2)', [pase.id, eric]))
const inv = await como(eric, async () => (await q('select public.crear_invitacion($1, $2, 1) as r', [viaje, pase.id]))[0].r)
for (const u of [ana, luis, marta]) {
  const r = await como(u, async () => (await q('select public.canjear_invitacion($1) as r', [inv.codigo]))[0].r)
  debe(r.ya_estaba === false && r.con_pase === true, 'entrar', 'cada uno entra con su plaza del pase')
}
{
  const g = await gente(eric)
  debe(g.length === 4 && g[0].es_admin === true && g[0].permiso === 'admin' && g[0].es_yo === true, '4a', 'la lista: el administrador primero, con permiso admin y «es_yo»')
  debe(g.slice(1).every((p) => p.permiso === 'recomendar'), '4a', 'TODOS los que entran empiezan con «Solo recomendar»')
  const gAna = await gente(ana)
  debe(gAna.find((p) => p.es_yo)?.nombre === 'Ana' && gAna.filter((p) => p.es_yo).length === 1, '4a', 'cada uno se reconoce a sí mismo en la lista («· Tú»)')
  debe((await servidor(() => q('select usos_usados from public.passes where id = $1', [pase.id])))[0].usos_usados === 4, 'plaza', 'el pase Grupo tiene 4 de 4 usadas con los tres que han entrado')
}

console.log('1b. Cambiar el permiso (solo el administrador) y su aviso')
{
  const noAdmin = await lanza(() => como(ana, () => q("select public.cambiar_permiso($1, $2, 'editar')", [viaje, luis])))
  debe(/Solo el administrador/.test(noAdmin ?? ''), '4a-03', 'un invitado no puede cambiar permisos')
  const aSiMismo = await lanza(() => como(ana, () => q("select public.cambiar_permiso($1, $2, 'editar')", [viaje, ana])))
  debe(/Solo el administrador/.test(aSiMismo ?? ''), '4a-03', 'ni siquiera el suyo')
  const admin = await lanza(() => como(eric, () => q("select public.cambiar_permiso($1, $2, 'admin')", [viaje, luis])))
  debe(/no existe/.test(admin ?? ''), '4a-03', 'el permiso «Administrador» no se puede dar: es solo de quien crea el viaje')
  await como(eric, () => q("select public.cambiar_permiso($1, $2, 'editar')", [viaje, luis]))
  const g = await gente(eric)
  debe(g.find((p) => p.id === luis).permiso === 'editar' && g.find((p) => p.id === ana).permiso === 'recomendar', '4a-03', 'Luis pasa a «Puede editar»; Ana sigue en «Solo recomendar»')
  const av = await aviso(luis, 'permiso')
  debe(av.length === 1 && av[0].payload.permiso === 'editar' && av[0].payload.admin === 'Eric' && av[0].payload.destino === 'Roma', '4a-03', 'a Luis le llega el aviso «permiso» con quién, el destino y el permiso nuevo')
  const igual = await como(eric, async () => (await q("select public.cambiar_permiso($1, $2, 'editar') as r", [viaje, luis]))[0].r)
  debe(igual.cambiado === false && (await aviso(luis, 'permiso')).length === 1, '4a-03', 'guardar el mismo permiso no avisa otra vez')
}

console.log('1c. «Puede editar»: toca la ruta, pero no las fechas, el vuelo ni el alojamiento')
{
  const ruta = (dias, ini = '2026-11-26', fin = '2026-11-29', vuelo = '10:00') => JSON.stringify({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: ini, end: fin } }, days: dias, departureFlightTime: vuelo })
  const nuevaParada = base.map((d, i) => (i === 2 ? { ...d, stops: [...d.stops, { id: 's9', name: 'Fontana di Trevi' }] } : d))
  const guardar = (uid, r, bookings = null) => como(uid, async () => (await q(`update public.trips set route = $2::jsonb ${bookings ? ', bookings = $3::jsonb' : ''} where id = $1 returning id`, bookings ? [viaje, r, bookings] : [viaje, r])).length)
  debe((await guardar(luis, ruta(nuevaParada))) === 1, '4a-editar', 'el editor añade una parada a la ruta (la guarda)')
  debe((await guardar(ana, ruta(base))) === 0, '4a-recomendar', 'quien solo recomienda NO escribe en el viaje (0 filas)')
  const fechas = await lanza(() => guardar(luis, ruta(nuevaParada, '2026-12-01', '2026-12-04')))
  debe(/fechas/.test(fechas ?? ''), '4a-editar', 'el editor no cambia las fechas')
  const vuelo = await lanza(() => guardar(luis, ruta(nuevaParada, '2026-11-26', '2026-11-29', '18:30')))
  debe(/vuelo o el alojamiento/.test(vuelo ?? ''), '4a-editar', 'el editor no cambia el vuelo')
  const alojamiento = await lanza(() => guardar(luis, ruta(nuevaParada), JSON.stringify({ accommodationSelections: { Roma: { nombre: 'Hotel' } } })))
  debe(/vuelo o el alojamiento/.test(alojamiento ?? ''), '4a-editar', 'el editor no cambia el alojamiento')
  debe((await guardar(luis, ruta(nuevaParada), JSON.stringify({ reservations: [{ id: 'x' }] }))) === 1, '4a-editar', 'las reservas sueltas (entradas) sí las puede tocar')
  const quitarDia = nuevaParada.slice(0, 3)
  debe((await guardar(luis, ruta(quitarDia, '2026-11-26', '2026-11-28'))) === 1, '4a-editar', 'quitar un día (que acorta el último día) sí lo puede hacer')
  const borra = await como(luis, async () => (await q('delete from public.trips where id = $1 returning id', [viaje])).length)
  debe(borra === 0, '4a-editar', 'el editor no borra el viaje')
  const invita = await lanza(() => como(luis, () => q('select public.crear_invitacion($1, null, 5)', [viaje])))
  debe(/Solo el administrador/.test(invita ?? ''), '4a-editar', 'el editor no invita')
  const quita = await lanza(() => como(luis, () => q('select public.quitar_del_viaje($1, $2)', [viaje, ana])))
  debe(/Solo el administrador/.test(quita ?? ''), '4a-editar', 'el editor no quita a nadie')
  const dueno = await como(eric, async () => (await q('update public.trips set route = $2::jsonb where id = $1 returning id', [viaje, ruta(base)])).length)
  debe(dueno === 1, '4a-admin', 'el administrador sigue pudiendo guardar todo (también las fechas)')
  await como(eric, async () => q("update public.trips set route = $2::jsonb where id = $1", [viaje, ruta(base, '2026-11-26', '2026-11-29', '19:00')]))
  // Recomendaciones: el editor las ve y las decide.
  const rec = await como(ana, async () => (await q("insert into public.trip_recommendations (trip_id, tipo, payload) values ($1, 'cambio', '{}'::jsonb) returning id", [viaje]))[0].id)
  const ve = await como(luis, async () => (await q('select id from public.trip_recommendations where trip_id = $1', [viaje])).length)
  const decide = await como(luis, async () => (await q("update public.trip_recommendations set estado = 'aceptada' where id = $1 returning id", [rec])).length)
  debe(ve === 1 && decide === 1, '4a-editar', 'el editor ve y acepta las recomendaciones, como el administrador')
  const noDecide = await como(marta, async () => (await q("update public.trip_recommendations set estado = 'rechazada' where id = $1 returning id", [rec])).length)
  debe(noDecide === 0, '4a-recomendar', 'quien solo recomienda no decide las de otros')
}

console.log('1d. Los cambios del viaje llegan a la campana (un aviso por tanda)')
{
  await servidor(() => q("delete from public.avisos where tipo = 'viaje_cambiado'"))
  const ruta = (dias, ini = '2026-11-26', fin = '2026-11-29') => JSON.stringify({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: ini, end: fin } }, days: dias, departureFlightTime: '19:00' })
  const dos = base.slice(0, 2)
  await como(eric, () => q('update public.trips set route = $2::jsonb where id = $1', [viaje, ruta(dos, '2026-11-26', '2026-11-27')]))
  let av = await aviso(ana, 'viaje_cambiado')
  debe(av.length === 1 && av[0].payload.dias_quitados === 2 && av[0].payload.quien === 'Eric', '10', 'Eric quita 2 días: a Ana le llega UN aviso «ha quitado 2 días»')
  debe((await aviso(eric, 'viaje_cambiado')).length === 0, '10', 'el aviso no le llega a quien hace el cambio')
  debe((await aviso(luis, 'viaje_cambiado')).length === 1 && (await aviso(marta, 'viaje_cambiado')).length === 1, '10', 'le llega a todos los demás del viaje')
  const con = dos.map((d, i) => (i === 1 ? { ...d, stops: [...d.stops, { id: 's9', name: 'Fontana di Trevi' }] } : d))
  await como(eric, () => q('update public.trips set route = $2::jsonb where id = $1', [viaje, ruta(con, '2026-11-26', '2026-11-27')]))
  av = await aviso(ana, 'viaje_cambiado')
  debe(av.length === 1 && av[0].payload.dias_quitados === 2 && av[0].payload.anadidas.length === 1 && av[0].payload.anadidas[0].nombre === 'Fontana di Trevi' && av[0].payload.anadidas[0].fecha === '2026-11-27', '10', 'varios cambios seguidos de la misma persona se juntan en UN solo aviso (quitó 2 días y añadió la Fontana al día 27)')
  await como(luis, () => q('update public.trips set route = $2::jsonb where id = $1', [viaje, ruta(con.map((d, i) => (i === 0 ? { ...d, stops: [d.stops[1], d.stops[0]] } : d)), '2026-11-26', '2026-11-27')]))
  const delEditor = await aviso(eric, 'viaje_cambiado')
  debe(delEditor.length === 1 && delEditor[0].payload.quien === 'Luis' && delEditor[0].payload.reordenado === true, '10', 'los cambios de quien puede editar llegan también al administrador («Luis ha cambiado el viaje»)')
  debe((await aviso(ana, 'viaje_cambiado')).length === 2, '10', 'y a los demás, cada autor con su aviso')
  await como(eric, () => q("update public.trips set bookings = '{}'::jsonb, updated_at = now() where id = $1", [viaje]))
  debe((await aviso(ana, 'viaje_cambiado')).length === 2, '10', 'un guardado sin cambios en la ruta no avisa')
  await como(eric, () => q('update public.trips set route = $2::jsonb where id = $1', [viaje, ruta(con, '2026-11-26', '2026-11-27').replace('"2026-11-26"', '"2026-12-01"')]))
  debe((await aviso(ana, 'viaje_cambiado'))[0].payload.fechas === true, '10', 'cambiar las fechas se avisa («ha cambiado las fechas»)')
  await como(eric, () => q('update public.trips set route = $2::jsonb where id = $1', [viaje, ruta(base)]))
}

console.log('1e. Quitar a alguien: deja de ver el viaje, su plaza vuelve y le llega su aviso')
{
  const info = await como(eric, async () => (await q('select public.info_quitar($1, $2) as i', [viaje, luis]))[0].i)
  debe(info.nombre === 'Luis' && info.plaza?.tipo === 'grupo' && info.plaza.usos_usados === 4 && info.plaza.usos_max === 4, '4a-04', '«Plaza del pase Grupo · 4 de 4 usadas» para el recuadro de quitar')
  const solo = await lanza(() => como(ana, () => q('select public.quitar_del_viaje($1, $2)', [viaje, marta])))
  debe(/Solo el administrador/.test(solo ?? ''), '4a-04', 'solo el administrador quita a alguien')
  const aSi = await lanza(() => como(eric, () => q('select public.quitar_del_viaje($1, $2)', [viaje, eric])))
  debe(/no puede quitarse/.test(aSi ?? ''), '4a-admin', 'el administrador no puede quitarse a sí mismo')
  const sale = await lanza(() => como(eric, () => q('select public.salir_del_viaje($1)', [viaje])))
  debe(/no puede salir/.test(sale ?? ''), '4a-admin', 'el administrador no puede salir del viaje')
  debe((await como(luis, async () => (await q('select id from public.trips where id = $1', [viaje])).length)) === 1, '4a-04', 'antes de quitarlo, Luis ve el viaje')
  const r = await como(eric, async () => (await q('select public.quitar_del_viaje($1, $2) as r', [viaje, luis]))[0].r)
  debe(r.quitado === true && r.plaza_devuelta === true, '4a-04', 'se le quita y la plaza vuelve')
  debe((await como(luis, async () => (await q('select id from public.trips where id = $1', [viaje])).length)) === 0, '4a-04', 'Luis deja de ver el viaje enseguida')
  const p = (await servidor(() => q('select usos_usados from public.passes where id = $1', [pase.id])))[0]
  debe(p.usos_usados === 3, '4a-04', 'el pase Grupo pasa de 4 a 3 usadas: la plaza vuelve a quien la compró')
  debe((await servidor(() => q('select 1 from public.pass_members where pass_id = $1 and user_id = $2', [pase.id, luis]))).length === 0, '4a-04', 'Luis pierde su plaza del pase')
  const av = await aviso(luis, 'quitado')
  debe(av.length === 1 && av[0].payload.destino === 'Roma', '4a-06', 'a Luis le llega «Ya no formas parte del viaje a Roma»')
  debe((await gente(eric)).length === 3, '4a-04', 'la lista del viaje queda con 3')
  // Y la plaza se puede dar a otro.
  const nuevo = await nuevoUsuario('pablo@correo.es', false, 'Pablo')
  const entra = await como(nuevo, async () => (await q('select public.canjear_invitacion($1) as r', [inv.codigo]))[0].r)
  debe(entra.ya_estaba === false, '4a-04', 'la plaza que vuelve se la puede quedar otra persona')
  // Salir uno mismo: misma cosa, sin aviso.
  const sal = await como(marta, async () => (await q('select public.salir_del_viaje($1) as r', [viaje]))[0].r)
  debe(sal.quitado === true && (await aviso(marta, 'quitado')).length === 0, '4a-05', '[Salir del viaje]: lo mismo que al quitarlo, sin aviso a sí mismo')
  debe((await servidor(() => q('select usos_usados from public.passes where id = $1', [pase.id])))[0].usos_usados === 3, '4a-05', 'al salir también vuelve la plaza (4→3 con Pablo dentro y Marta fuera)')
  const noEsta = await lanza(() => como(marta, () => q('select public.salir_del_viaje($1)', [viaje])))
  debe(/No estás/.test(noEsta ?? ''), '4a-05', 'quien ya no está no puede salir otra vez')
  // Sin pase: la invitación libera su plaza.
  const inv2 = await como(eric, async () => (await q('select public.crear_invitacion($1, null, 10) as r', [viaje]))[0].r)
  const sinPase = await nuevoUsuario('sinpase@correo.es', false, 'Sin')
  await como(sinPase, () => q('select public.canjear_invitacion($1)', [inv2.codigo]))
  const antes = (await como(eric, async () => (await q('select usos_usados from public.trip_invitations where id = $1', [inv2.id]))[0])).usos_usados
  const r2 = await como(eric, async () => (await q('select public.quitar_del_viaje($1, $2) as r', [viaje, sinPase]))[0].r)
  const despues = (await como(eric, async () => (await q('select usos_usados from public.trip_invitations where id = $1', [inv2.id]))[0])).usos_usados
  debe(antes === 1 && despues === 0 && r2.plaza_devuelta === false, '4a-04', 'sin pase, la plaza de la invitación (de 10) queda libre y no se toca ningún pase')
}

console.log('1f. Ya dentro del viaje, la invitación no vuelve a enseñarse')
{
  const inv3 = await como(eric, async () => (await q('select public.crear_invitacion($1, null, 10) as r', [viaje]))[0].r)
  const nuevo = await nuevoUsuario('nuevo@correo.es', false, 'Nuevo')
  const antes = await como(nuevo, async () => (await q('select public.ver_invitacion($1) as v', [inv3.codigo]))[0].v)
  debe(antes.valida === true && antes.ya_dentro === false && antes.trip_id === null, '5', 'antes de unirse: la invitación se enseña (ya_dentro false)')
  await como(nuevo, () => q('select public.canjear_invitacion($1)', [inv3.codigo]))
  const despues = await como(nuevo, async () => (await q('select public.ver_invitacion($1) as v', [inv3.codigo]))[0].v)
  debe(despues.ya_dentro === true && despues.trip_id === viaje, '5', 'ya unido: ya_dentro true y el viaje al que ir directo')
  const dueno = await como(eric, async () => (await q('select public.ver_invitacion($1) as v', [inv3.codigo]))[0].v)
  debe(dueno.ya_dentro === true, '5', 'el administrador abriendo su propio enlace también va directo al viaje')
  await como(eric, () => q('select public.anular_invitacion($1)', [inv3.id]))
  const anulada = await como(nuevo, async () => (await q('select public.ver_invitacion($1) as v', [inv3.codigo]))[0].v)
  debe(anulada.valida === true && anulada.ya_dentro === true, '5', 'aunque la invitación se anule después, quien ya está dentro va directo (no ve «se ha anulado»)')
  const yaEstaba = await como(nuevo, async () => (await q('select public.canjear_invitacion($1) as r', [inv3.codigo]))[0].r)
  debe(yaEstaba.ya_estaba === true, '5', 'canjear otra vez no gasta ningún uso ni da error')
  const sinPase = (await servidor(() => q('select count(*)::int as n from public.pass_members where user_id = $1', [nuevo])))[0].n
  debe(sinPase === 0, '5', 'un invitado sin Dúo ni Grupo NO recibe ningún pase (cuenta normal, ninguna plaza en pass_members)')
}

/* ═══════════════ 2. El código del navegador ═══════════════ */
console.log('2. El código (esbuild): mismo código, tiempo real, textos')
{
  const { build } = await import('esbuild')
  const os = await import('node:os')
  const path = await import('node:path')
  const { createRequire } = await import('node:module')
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'p10n-')), 'm.cjs')
  const almacen = () => {
    const m = new Map()
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
  }
  globalThis.window = { location: { search: '', origin: 'http://x' }, localStorage: almacen(), sessionStorage: almacen(), addEventListener() {}, removeEventListener() {}, dispatchEvent() {} }
  globalThis.localStorage = window.localStorage
  globalThis.sessionStorage = window.sessionStorage
  await build({ entryPoints: ['scripts/destino/_10n_compartir_entrada.ts'], outfile: out, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.css': 'empty' }, define: { 'import.meta.env': JSON.stringify({ DEV: false, MODE: 'test' }) } })
  const M = createRequire(import.meta.url)(out)
  const textos = await import('../../shared/avisos/textos.js')
  const src = (f) => fs.readFileSync(f, 'utf8')
  debe(M.PLAZAS_SIN_PASE === 10, '4', 'sin pase, un código sirve para 10 personas')
  const inv = (o) => ({ anulada: false, usosMax: 10, usosUsados: 0, passId: null, ...o })
  debe(M.invitacionReutilizable(inv({}), null) && !M.invitacionReutilizable(inv({ anulada: true }), null) && !M.invitacionReutilizable(inv({ usosUsados: 10 }), null) && !M.invitacionReutilizable(inv({ passId: 'p' }), null) && M.invitacionReutilizable(inv({ passId: 'p' }), 'p'), '4', 'se reutiliza la invitación vigente; una gastada, anulada o de otro pase no')
  const hoja = src('src/components/pase/HojaInvitar.tsx')
  debe(hoja.includes('Invita a los tuyos a tu viaje a ${destino}') && hoja.includes('Tus acompañantes verán tu ruta y podrán proponerte cambios.') && hoja.includes('Invita hasta ${PLAZAS_SIN_PASE} personas con este código.') && !hoja.includes('Cada persona que entra con el código'), '4', 'la hoja de compartir lleva los textos nuevos')
  debe(hoja.includes('invitacionDelViaje(') && !hoja.includes('crearInvitacion(viaje') && hoja.includes('Personas del viaje · {gente.length}'), '4', 'la hoja reutiliza el código y abre «Personas del viaje · N»')
  const card = src('src/components/propuesta/BotonesDeViaje.tsx')
  debe(card.includes('Compartir\n') && card.includes('data-caras-del-viaje-boton') && card.includes('data-numero-de-personas') && card.includes('if (esInvitado) return null'), '4a', 'la tarjeta: [Compartir] sin compartir, caras con número ya compartido, y el invitado nunca ve [Compartir]')
  debe(src('src/components/route/RouteOverview.tsx').includes('Viaje de {nombreAdmin}'), '2', '«Viaje de Eric» debajo del destino para el invitado')
  const per = src('src/components/compartir/PersonasDelViaje.tsx')
  debe(['Cambiar permiso', 'Quitar del viaje', 'Invitar a alguien', 'Guardar permiso', 'Vuelve a ti', 'Salir del viaje', 'Solo {solo}'].every((x) => per.includes(x)), '4a', 'las pantallas 02-05 tienen sus botones y textos')
  debe(M.textoDelPermiso.admin === 'Administrador' && M.textoDelPermiso.editar === 'Puede editar' && M.textoDelPermiso.recomendar === 'Solo recomendar', '4a', 'los tres permisos con su nombre')
  const hook = src('src/hooks/usePermisosDelViaje.ts')
  debe(['esAdmin', 'puedeEditar', 'soloRecomienda', 'nombreAdmin', 'esInvitado'].every((x) => hook.includes(x)), '4a', 'usePermisosDelViaje con la forma acordada')
  debe(src('src/App.tsx').includes('!invitacionEnMarcha && <TrazoFlow'), '5', '«Crear viaje» no se pinta con una invitación en marcha')
  debe(src('src/components/cuenta/PuertaDeCuenta.tsx').includes('v.ya_dentro && v.trip_id') && src('src/components/cuenta/InvitacionRecibida.tsx').includes('data-logo-invitacion'), '5', 'ya dentro va directo al viaje; el logo pequeño arriba en «Eric te invita»')
  debe(M.codigoDeLaDireccion('?invitacion=ABCD2345') === 'ABCD2345', '5', 'el código sale de la dirección')
  const repo = src('server/logros/repo.js')
  debe(repo.includes('comprador_id.eq.${userId},para_id.eq.${userId}') && repo.includes("from('pass_members').select('pass_id').eq('user_id', userId)"), '5', 'el pase de una cuenta sale SOLO de passes/pass_members: un invitado normal sin Dúo ni Grupo no lo recibe (comprobado en 1f)')
  const bus = []
  const nube = { channel: (n) => { const c = { n, ons: [], on(t, f, cb) { c.ons.push({ f, cb }); return c }, subscribe() { return c } }; bus.push(c); return c }, removeChannel: (c) => { c.quitado = true } }
  const visto = []
  const soltar = M.conectarViaje(nube, 'T1', 'U1', { alViaje: () => visto.push('viaje'), alGente: () => visto.push('gente'), alAviso: (a) => visto.push(a.tipo) })
  const c = bus[0]
  debe(c.n === 'viaje:T1' && c.ons.length === 3 && c.ons.some((o) => o.f.table === 'trips' && o.f.filter === 'id=eq.T1') && c.ons.some((o) => o.f.table === 'trip_members' && o.f.filter === 'trip_id=eq.T1') && c.ons.some((o) => o.f.table === 'avisos' && o.f.filter === 'user_id=eq.U1'), '10', 'escucha el viaje, su gente y mis avisos')
  c.ons[0].cb({})
  c.ons[1].cb({})
  c.ons[2].cb({ new: { tipo: 'viaje_cambiado', payload: {} } })
  debe(visto.join() === 'viaje,gente,viaje_cambiado', '10', 'cada evento llega a su escucha')
  soltar()
  debe(c.quitado === true, '10', 'al cerrar el viaje se suelta el canal')
  const av = (tipo, p) => M.accionPorAviso({ tipo, payload: { trip_id: 'T1', ...p } }, 'T1')
  debe(av('viaje_cambiado', { quien: 'Eric' }).linea === 'Eric ha cambiado el viaje.' && av('viaje_cambiado', { quien: 'Eric' }).accion === 'refrescar', '10', 'línea «Eric ha cambiado el viaje.» y se vuelve a pedir la ruta')
  debe(av('quitado', { destino: 'Roma' }).accion === 'quitado' && av('permiso', {}).accion === 'gente' && M.accionPorAviso({ tipo: 'viaje_cambiado', payload: { trip_id: 'OTRO' } }, 'T1').accion === 'ninguna', '10', 'quitado, permiso y avisos de otro viaje')
  const r = (days) => ({ days: days.map(([id, ...paradas]) => ({ id, stops: paradas.map((s) => ({ id: s, name: s })) })) })
  const cam = M.cambiosEntreRutas(r([['d1', 's1', 's2'], ['d2', 's3'], ['d3', 's4']]), r([['d1', 's1'], ['d2', 's3', 's9']]))
  debe(cam.diasQuitados.join() === 'd3' && cam.paradasQuitadas.join() === 's2,s4' && cam.paradasAnadidas[0].id === 's9', '10', 'qué días y paradas han salido o entrado (para marcar la propuesta a medias)')
  debe(M.canonico({ b: 1, a: { d: 2, c: 3 } }) === M.canonico({ a: { c: 3, d: 2 }, b: 1 }), '10', 'el eco del propio guardado se reconoce aunque la base de datos reordene las claves')
  const t = (tipo, payload) => textos.textoDelAviso({ tipo, payload })
  debe(t('viaje_cambiado', { quien: 'Eric', dias_quitados: 2 }) === 'Eric ha cambiado el viaje: ha quitado 2 días', '10', 'aviso «ha quitado 2 días»')
  debe(t('viaje_cambiado', { quien: 'Luis', anadidas: [{ nombre: 'Fontana di Trevi', fecha: '2026-11-28' }] }) === 'Luis ha cambiado el viaje: ha añadido Fontana di Trevi al sábado 28', '10', 'aviso «ha añadido … al sábado 28»')
  debe(/ha cambiado las fechas/.test(t('viaje_cambiado', { quien: 'Eric', fechas: true })), '10', 'aviso «ha cambiado las fechas»')
  debe(t('permiso', { admin: 'Eric', destino: 'Roma', permiso: 'editar' }) === 'Eric te ha dado permiso para editar el viaje a Roma' && /ahora puedes recomendar cambios/.test(t('permiso', { admin: 'Eric', destino: 'Roma', permiso: 'recomendar' })), '4a-03', 'avisos de permiso')
  debe(t('quitado', { destino: 'Roma' }) === 'Ya no formas parte del viaje a Roma', '4a-06', 'aviso «Ya no formas parte del viaje a Roma»')
}

/* ═══════════════ 3. La pantalla (a tamaño de móvil, con capturas) ═══════════════ */
console.log('3. La pantalla (hace falta Vite; sin él se salta)')
{
  const APP = process.env.APP_URL ?? 'http://localhost:5173'
  const arriba = await fetch(APP).then((r) => r.ok).catch(() => false)
  if (!arriba) console.log('  (sin Vite en APP_URL: se salta la parte de pantalla)')
  else {
    const { abrirApp } = await import('./_enLaApp.mjs')
    const path = await import('node:path')
    const SAL = path.resolve('docs/dias/capturas_jutrip')
    const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
    try {
      const ev = (js) => a.evaluar(js)
      for (let i = 0; i < 90 && !(await ev("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
      await ev('window.__rutaPrueba().then(() => true)')
      await a.esp(2500)
      const cerrarAvisos = () => ev("(() => { for (let i = 0; i < 3; i++) { const b = [...document.querySelectorAll('button')].find((b) => /^(siguiente|entendido|vale|cerrar|ahora no)$/i.test(b.innerText.trim())); if (b) b.click() } return true })()")
      for (let i = 0; i < 4; i++) { await cerrarAvisos(); await a.esp(500) }
      await ev("(() => { const r = [...document.querySelectorAll('button,a,[role=tab]')].find((b) => /^ruta$/i.test(b.innerText.trim())); r && r.click(); return true })()")
      await a.esp(1500)
      const gente = (yo) => `window.__viaje.getState().poner({ tripId: 'demo-viaje', gente: [{ id: 'e', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin', esYo: ${yo === 'e'} }, { id: 'a', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar', esYo: ${yo === 'a'} }, { id: 'l', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'editar', esYo: ${yo === 'l'} }, { id: 'm', nombre: 'Marta', foto: null, esAdmin: false, permiso: 'recomendar', esYo: false }] })`
      const hay = (sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
      const texto = () => ev('document.body.innerText')
      const clic = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
      const foto = (n) => a.captura(path.join(SAL, `10n_compartir_${n}.jpg`))

      // Sin compartir: [Compartir] en champán, sin caras.
      await ev("window.__viaje.getState().poner({ tripId: 'demo-viaje', gente: [] })")
      await a.esp(700)
      debe((await hay('[data-compartir-viaje]')) && !(await hay('[data-caras-del-viaje-boton]')), '4a', 'sin compartir: el botón [Compartir] y ninguna cara')
      debe(/Compartir/.test(await ev("document.querySelector('[data-compartir-viaje]').innerText")), '4a', 'el botón dice «Compartir»')
      await foto('01_tarjeta_sin_compartir')
      // Ya compartido: caras con el número.
      await ev(gente('e'))
      await a.esp(700)
      debe(!(await hay('[data-compartir-viaje]')) && (await ev("document.querySelector('[data-numero-de-personas]')?.innerText")) === '4' && (await ev("document.querySelectorAll('[data-cara-persona]').length")) === 4, '4a', 'ya compartido: las 4 caras con el número 4 y sin [Compartir]')
      debe((await ev("document.querySelector('[data-pastilla-pase]')?.innerText.trim()")) === 'Pase Roma', '4a', 'la pastilla de RUTA dice solo «Pase Roma»')
      debe(await ev("(() => { const p = document.querySelector('[data-pastilla-pase]').getBoundingClientRect(); const c = document.querySelector('[data-caras-del-viaje-boton]').getBoundingClientRect(); const t = document.querySelector('[aria-label^=\"Tips\"],[aria-label=\"Recuperar mi ruta\"]').getBoundingClientRect(); return p.right <= c.left + 1 && c.right < t.left + 200 && p.top < c.bottom })()"), '4a', 'el orden: pastilla, caras a su lado, y bombilla y flecha a la derecha')
      await foto('02_tarjeta_compartida')
      // 02 · Personas del viaje (administrador).
      await clic('[data-caras-del-viaje-boton]')
      await a.esp(2000)
      let t = await texto()
      debe(/Personas del viaje/.test(t) && /Administrador/.test(t) && (t.match(/Solo recomendar/g) ?? []).length === 2 && /Puede editar/.test(t) && /Invitar a alguien/.test(t) && /· Tú/.test(t), '4a-02', 'la lista: Administrador, Puede editar, Solo recomendar y [+ Invitar a alguien]')
      await foto('03_personas_administrador')
      await ev("document.querySelector('[data-persona-fila=\"a\"] button')?.click()")
      await a.esp(500)
      debe((await hay('[data-cambiar-permiso]')) && (await hay('[data-quitar-del-viaje]')), '4a-02', 'al tocar a Ana se abre su fila con [Cambiar permiso] y [Quitar del viaje]')
      await foto('04_fila_abierta')
      await clic('[data-cambiar-permiso]')
      await a.esp(600)
      t = await texto()
      debe(/Permiso de Ana/.test(t) && /SOLO ERIC|Solo Eric/i.test(t) && /Guardar permiso/.test(t) && (await hay('[data-opcion-permiso="editar"]')), '4a-03', '«Permiso de Ana» con los tres permisos, Administrador con «Solo Eric» y [Guardar permiso]')
      await foto('05_permiso_de_ana')
      await ev("document.querySelector('[aria-label=\"Cerrar\"]:last-of-type')?.click(); true")
      await ev("(() => { const hojas = [...document.querySelectorAll('[data-hoja=\"permiso-de\"] .hoja-fondo')]; hojas.forEach((h) => h.click()); return true })()")
      await a.esp(500)
      await ev("document.querySelector('[data-persona-fila=\"l\"] button')?.click()")
      await a.esp(400)
      await clic('[data-quitar-del-viaje]')
      await a.esp(700)
      t = await texto()
      debe(/¿Quitar a Luis del viaje a Roma\?/.test(t) && (await hay('[data-confirmar-quitar]')) && /Quitar a Luis/.test(t) && /Cancelar/.test(t), '4a-04', '«¿Quitar a Luis del viaje a Roma?» con [Quitar a Luis] y [Cancelar]')
      await foto('06_quitar_a_luis')
      await ev("document.querySelector('[data-boton-hoja=\"cancelar-quitar\"]')?.click(); true")
      await a.esp(400)
      // Hoja de invitar (con el código de ejemplo).
      await ev("document.querySelector('[data-hoja=\"personas-del-viaje\"] .hoja-fondo')?.click(); true")
      await a.esp(400)
      await a.esp(600)
      await ev(`(async () => { const urls = performance.getEntriesByType('resource').map((r) => r.name).filter((u) => u.includes('usePagoStore')); const m = await import(urls[urls.length - 1] ?? '/src/store/usePagoStore.ts'); m.usePagoStore.getState().abrir({ tipo: 'invitar', modo: 'viaje', destino: 'Roma', tripId: 'demo-viaje', pase: null, codigoInicial: 'K7MQ4XWH' }); return true })()`)
      await a.esp(2500)
      t = await texto()
      debe(/Invita a los tuyos a tu viaje a Roma/.test(t) && /Tus acompañantes verán tu ruta y podrán proponerte cambios\./.test(t) && /Invita hasta 10 personas con este código\./.test(t) && /Personas del viaje · 4/.test(t) && /K7MQ4XWH/.test(t) && !/Cada persona que entra/.test(t), '4', 'la hoja de compartir: título, subtítulo, «hasta 10 personas», código y «Personas del viaje · 4»')
      await foto('07_hoja_de_invitar')
      await ev("document.querySelector('[data-hoja=\"RS2\"] .hoja-fondo')?.click(); true")
      await a.esp(500)
      // 05 · Un invitado (Ana): sin [Compartir] ni [+ Invitar], con «Viaje de Eric» y [Salir del viaje].
      await ev("sessionStorage.setItem('trazo:invitado', '1'); true")
      await ev(gente('a'))
      await a.esp(900)
      t = await texto()
      debe(/Viaje de Eric/.test(t) && !(await hay('[data-compartir-viaje]')) && (await hay('[data-caras-del-viaje-boton]')), '2', 'el invitado: «Viaje de Eric» debajo de Roma, caras con número y nunca [Compartir]')
      await foto('08_tarjeta_del_invitado')
      await clic('[data-caras-del-viaje-boton]')
      await a.esp(2000)
      t = await texto()
      debe(/· Tú/.test(t) && (await hay('[data-salir-del-viaje]')) && !(await hay('[data-invitar-a-alguien]')) && !(await hay('[data-persona-fila] [data-fila-abierta]')), '4a-05', 'lo que ve un invitado: «· Tú», sin botones de gestión, con [Salir del viaje]')
      await foto('09_personas_invitado')
      await clic('[data-salir-del-viaje]')
      await a.esp(600)
      debe((await hay('[data-confirmar-salir]')) && /¿Salir del viaje a Roma\?/.test(await texto()), '4a-05', '[Salir del viaje] pide confirmación')
      await foto('10_salir_del_viaje')
      // Puede editar (Luis): ve las caras, ningún [Compartir].
      await ev("document.querySelector('[data-boton-hoja=\"cancelar-salir\"]')?.click(); true")
      await ev("document.querySelector('[data-hoja=\"personas-del-viaje\"] .hoja-fondo')?.click(); true")
      await ev("sessionStorage.setItem('trazo:permiso', 'editar'); true")
      await ev(gente('l'))
      await a.esp(700)
      debe(!(await hay('[data-compartir-viaje]')) && (await hay('[data-caras-del-viaje-boton]')), '4a', 'quien puede editar ve las caras y nunca [Compartir]')
    } finally {
      a.cerrar()
    }
  }
}

export { bd, viaje, eric, ana, luis, marta }

const resumen = () => {
  console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  for (const f of fallos) console.log('  ✗', f.regla, '-', f.texto)
}
if (!process.env.PRUEBA_10N_SIN_FIN) {
  resumen()
  process.exit(fallos.length ? 1 : 0)
}
