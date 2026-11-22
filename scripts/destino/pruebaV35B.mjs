// La prueba de la Tanda V35B (SERVIDOR Y BASE DE DATOS): la migración 0091, quién paga cada pase (con comisión y devoluciones), Próximamente en la base, clics de afiliados, uso, cuentas de prueba, el script de pagos viejos
// y que SIN la 0091 todo siga funcionando («Pronto»). PGlite con todas las migraciones reales (y otra SIN la 0091), un express dentro de la prueba y un cliente de Supabase de mentira: ninguna red, ningún correo, ninguna clave,
// nada contra producción.
//   node scripts/destino/pruebaV35B.mjs
// (La pantalla —campana, país, panel— la prueban pruebaV35B_pantalla.mjs, pruebaV35B_personas.mjs y pruebaV35B_campana.mjs.)
import fs from 'node:fs'
import express from 'express'
import { crearBaseDePrueba, crearAdminDePrueba } from './_baseDeDatosPrueba.mjs'
import { conFrom } from './_fromDePrueba.mjs'
import { registrarRutasPanel } from '../../server/panel/index.js'
import { crearServicioPagos, pasarelaDeMentira, pasarelaStripe } from '../../server/pagos.js'
import { generarSql, leerCobros } from '../pagos/rellenarPagosViejos.mjs'
import { crearCorreo } from '../../server/correo.js'
import { cargarDatos } from '../../server/logros/datos.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log(`  FALLO ${texto}`)
  }
}

const migracion = fs.readFileSync('supabase/migrations/0091_panel_datos.sql', 'utf8')
const comprobar = fs.readFileSync('docs/dias/COMPROBAR_0091.sql', 'utf8')

/* ───────── 1. La migración ───────── */
console.log('1. La migración 0091')
debe(/SIN APLICAR/.test(migracion.split('\n')[0]) && /COMPROBAR_0091\.sql/.test(migracion.split('\n')[0]), 'la cabecera dice «SIN APLICAR» y nombra su COMPROBAR')
// empezar_de_cero: idéntica a la última versión (0089) salvo la línea de uso_diario.
const funcion = (t) => t.slice(t.indexOf('create or replace function public.empezar_de_cero'), t.indexOf('commit;', t.indexOf('create or replace function public.empezar_de_cero'))).trimEnd().split('\n')
const ultima = fs.readFileSync('supabase/migrations/0089_viajero_primera_vez.sql', 'utf8')
const mas = funcion(migracion).filter((l) => !funcion(ultima).includes(l))
const menos = funcion(ultima).filter((l) => !funcion(migracion).includes(l))
debe(mas.length === 1 && /uso_diario/.test(mas[0]) && menos.length === 0, `empezar_de_cero (0091) = la de la 0089 + solo la línea de uso_diario (${mas.length} más, ${menos.length} menos)`)
// Ninguna migración posterior a la 0089 vuelve a definir empezar_de_cero (si no, habría que partir de otra).
const definen = fs.readdirSync('supabase/migrations').filter((f) => /^\d{4}_/.test(f) && /function public\.empezar_de_cero/.test(fs.readFileSync(`supabase/migrations/${f}`, 'utf8'))).sort()
debe(definen[definen.length - 1] === '0091_panel_datos.sql' && definen[definen.length - 2].startsWith('0089'), `la última versión de empezar_de_cero es la de la 0091 y la anterior la de la 0089 (${definen.slice(-3).join(', ')})`)

const aplicadas = []
const crear = (regex) => crearBaseDePrueba({ migraciones: regex, alFallar: (m) => aplicadas.push(String(m)) })
const con = await crear(/^\d{4}_.*\.sql$/)
const sin = await crear(/^(?!0091)\d{4}_.*\.sql$/)
debe(!aplicadas.some((m) => /^0091/.test(m)), `la 0091 se aplica sin errores (${aplicadas.filter((m) => /^0091/.test(m)).join(' | ')})`)
for (const bd of [con, sin]) await bd.db.exec('alter table auth.users add column if not exists last_sign_in_at timestamptz')
await con.db.exec(migracion) // repetible: pegada otra vez
const FUNCIONES = ['pago_anotar(text, uuid, integer)', 'pago_anotar_devolucion(text, integer)', 'uso_anotar(uuid, text, boolean)', 'afiliado_clic(text, text, text)']
for (const f of FUNCIONES) await con.db.exec(`revoke execute on function public.${f} from authenticated`) // (como en Supabase: la base de pruebas concede todo al final)
const filaComprobar = await con.q(comprobar)
debe(filaComprobar.length === 1, 'COMPROBAR_0091.sql devuelve UNA sola fila')
debe(Object.values(filaComprobar[0] ?? {}).every((v) => v === true) && filaComprobar[0]?.todo === true, `y todo en true (${JSON.stringify(filaComprobar[0])})`)
await sin.db.exec('select 1')
let falta = null
try {
  falta = (await sin.q(comprobar))[0]?.todo
} catch {
  falta = false
}
debe(falta === false, 'sin la 0091, COMPROBAR_0091.sql no da true (da false o falla porque falta la tabla)')
// Lo nuevo de la base no guarda nada de más (sin IP, ni ubicación, ni navegador, ni quién en los clics).
const columnas = async (t) => (await con.q("select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position", [t])).map((c) => c.column_name).join(',')
debe((await columnas('uso_diario')) === 'user_id,dia,aparato,instalada', 'uso_diario guarda SOLO cuenta, día, aparato e instalada (sin IP, ubicación ni navegador)')
debe((await columnas('afiliados_clics')) === 'dia,destino,tipo,proveedor,clics', 'afiliados_clics guarda SOLO día, destino, tipo, proveedor y clics (sin saber quién)')
debe((await columnas('cuentas_de_prueba')) === 'email,marcado_en', 'cuentas_de_prueba es solo correo y fecha')

/* ───────── 2. Cuentas, funciones y «Empezar de cero» ───────── */
console.log('2. Las funciones de la 0091 y «Empezar de cero»')
const ids = {}
const poblar = async (bd) => {
  const x = {}
  for (const [n, correo] of [['admin', 'admin@x.es'], ['ana', 'ana@x.es'], ['bea', 'bea@x.es'], ['pruebas', 'bengala.ingresos+pruebas1@gmail.com'], ['fran', 'fran@x.es']]) x[n] = await bd.nuevoUsuario(correo, false, n[0].toUpperCase() + n.slice(1))
  await bd.q("update auth.users set created_at = '2026-01-01T00:00:00Z'")
  return x
}
ids.con = await poblar(con)
ids.sin = await poblar(sin)
const { q, servidor } = con
await servidor(() => q("select public.uso_anotar($1, 'iphone', true)", [ids.con.ana]))
await servidor(() => q("select public.uso_anotar($1, 'android', false)", [ids.con.ana])) // el mismo día: una sola fila
await servidor(() => q("select public.uso_anotar($1, 'televisor', false)", [ids.con.ana])) // aparato que no vale: nada
debe((await q('select count(*)::int as n from public.uso_diario where user_id = $1', [ids.con.ana]))[0].n === 1, 'un día activo por cuenta (llamarlo dos veces el mismo día deja una sola fila, y un aparato raro no guarda nada)')
debe((await q('select aparato, instalada from public.uso_diario where user_id = $1', [ids.con.ana]))[0].aparato === 'android', 'el último aparato del día manda')
for (let i = 0; i < 3; i++) await servidor(() => q("select public.afiliado_clic('Roma', 'actividad', 'civitatis')"))
await servidor(() => q("select public.afiliado_clic('Roma', 'hotel', 'stay22')"))
await servidor(() => q("select public.afiliado_clic('Roma', 'coche', 'otro')")) // no vale: nada
debe((await q('select sum(clics)::int as n from public.afiliados_clics'))[0].n === 4, 'los clics se cuentan por día, destino y tipo (y lo que no vale no cuenta)')
// Quién pagó y la comisión.
await servidor(() => q("select public.registrar_pago('cs_viejo', 'pi_viejo', 'stripe', $1, 'Roma', 'uno', 1, 699, 'eur', null)", [ids.con.ana]))
await servidor(() => q("select public.pago_anotar('cs_viejo', $1, 35)", [ids.con.ana]))
await servidor(() => q("select public.pago_anotar('cs_viejo', $1, 99)", [ids.con.bea])) // no pisa lo que ya hay
const pv = (await q("select user_id, comision_cent from public.pagos_registro where pago_ref = 'cs_viejo'"))[0]
debe(pv.user_id === ids.con.ana && pv.comision_cent === 35, 'pago_anotar guarda quién pagó y la comisión, y no pisa lo ya guardado')
// «Empezar de cero»: borra lo nuevo de la persona y deja los pagos (contabilidad).
const defn = (await q("select pg_get_functiondef(to_regprocedure('public.empezar_de_cero(uuid)')) as d"))[0].d
debe(/uso_diario/.test(defn) && !/pagos_registro/.test(defn) && !/cuentas_de_prueba/.test(defn) && !/afiliados_clics/.test(defn) && /avisos_de_viajeros/.test(defn) && /viajero_primera_vez/.test(defn), 'la función VIGENTE de empezar_de_cero (pg_get_functiondef) borra uso_diario, conserva lo de la 0089 y no nombra pagos, cuentas de prueba ni clics')
await servidor(() => q('select public.empezar_de_cero($1)', [ids.con.ana]))
debe((await q('select count(*)::int as n from public.uso_diario where user_id = $1', [ids.con.ana]))[0].n === 0, 'Empezar de cero borra el uso de la persona')
const tras = (await q("select user_id from public.pagos_registro where pago_ref = 'cs_viejo'"))[0]
debe(tras?.user_id === ids.con.ana, 'y deja el registro de pagos intacto (con su user_id)')
debe((await q("select count(*)::int as n from public.cuentas_de_prueba where email = 'bengala.ingresos+pruebas1@gmail.com'"))[0].n === 1, 'y la cuenta de pruebas sigue marcada')

/* ───────── 3. El webhook: quién pagó, comisión y devoluciones ───────── */
console.log('3. Una compra de prueba guarda quién pagó, la comisión y la devolución (y sin la 0091 el cobro sigue funcionando)')
const precios = JSON.parse(fs.readFileSync('data/pase/precios.json', 'utf8'))
const callado = { log() {}, error() {}, warn() {} }
async function compra(bd, uid, destino = 'Roma') {
  const admin = crearAdminDePrueba(bd, new Map())
  const pasarela = pasarelaDeMentira()
  const s = crearServicioPagos({ admin, precios, destinos: ['Roma'], pasarela, env: {}, log: callado })
  const r = await s.crearPago({ id: uid, email: 'x@x.es', is_anonymous: false }, { destino, plan: 'uno' }, 'http://localhost:5173')
  const sesion = r.cuerpo.sesion
  const pagado = await s.procesarEvento(pasarela.eventoDe(sesion, 'bueno'))
  return { s, pasarela, sesion, pagado }
}
const a = await compra(con, ids.con.fran)
const fila = (await q('select user_id, comision_cent, estado, importe_cent, devuelto_cent from public.pagos_registro where pago_ref = $1', [a.sesion]))[0]
debe(a.pagado.accion === 'pase_creado' && fila.user_id === ids.con.fran, 'una compra de prueba crea el pase y guarda quién pagó (user_id)')
debe(fila.comision_cent === Math.round(fila.importe_cent * 0.014) + 25, `y la comisión de Stripe (${fila.comision_cent} cent)`)
const dev = await a.s.procesarEvento(a.pasarela.eventoDe(a.sesion, 'devuelto'))
const fila2 = (await q('select estado, devuelto_cent from public.pagos_registro where pago_ref = $1', [a.sesion]))[0]
debe(dev.accion === 'pase_anulado' && fila2.estado === 'devuelto' && fila2.devuelto_cent === fila.importe_cent, `la devolución se guarda (estado «${fila2.estado}», ${fila2.devuelto_cent} cent devueltos) y anula el pase`)
const b = await compra(sin, ids.sin.fran)
debe(b.pagado.accion === 'pase_creado', 'SIN la 0091 la compra sigue creando el pase (anotar quién pagó no la rompe)')
const bd2 = await b.s.procesarEvento(b.pasarela.eventoDe(b.sesion, 'devuelto'))
debe(bd2.accion === 'pase_anulado', 'y la devolución también')
// La comisión de Stripe de verdad: de balance_transaction, solo GET.
const llamadas = []
const stripe = pasarelaStripe({ clave: 'sk_test_de_mentira', secretoAviso: 'x', fetchFn: async (u, o) => { llamadas.push([o?.method ?? 'GET', String(u)]); return { ok: true, json: async () => ({ latest_charge: { balance_transaction: { fee: 53 } } }) } } })
debe((await stripe.comision('pi_1')) === 53 && llamadas.every(([m, u]) => m === 'GET' && /balance_transaction/.test(u)), 'la comisión de Stripe sale de balance_transaction.fee (una petición de solo lectura)')

/* ───────── 4. El servidor del panel con la 0091 y sin ella ───────── */
console.log('4. El panel: Próximamente, ventas, clics y cuentas de prueba (con la 0091 y sin ella)')
const ENV = { LOGROS_ADMIN_EMAILS: 'admin@x.es', APP_URL: 'https://app.test' }
const reloj = Date.parse('2026-11-21T10:00:00Z')
const datos = cargarDatos()
const correo = crearCorreo({ apiKey: undefined, fetchFn: async () => { throw new Error('sin clave no se llama a nadie') } })
const geo = async (nombre) => ({ lat: 35.68, lng: 139.69, iso: 'jp', pais: 'Japón', nombre })
async function levantar(bd, uidAdmin) {
  const fichas = new Map([['T-admin', uidAdmin]])
  const admin = conFrom(crearAdminDePrueba(bd, fichas), bd)
  const app = express()
  app.use(express.json())
  registrarRutasPanel(app, { admin, env: ENV, correo, ahora: () => reloj, consola: callado, datos, geocodificar: geo, lanzados: () => [{ clave: 'florencia', nombre: 'Florencia' }] })
  const srv = await new Promise((ok) => {
    const s = app.listen(0, '127.0.0.1', () => ok({ s, base: `http://127.0.0.1:${s.address().port}` }))
  })
  const pedir = async (ruta, { metodo = 'GET', cuerpo, token = 'T-admin' } = {}) => {
    const r = await fetch(`${srv.base}${ruta}`, { method: metodo, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' }, ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}) })
    const t = await r.text()
    let json = null
    try {
      json = JSON.parse(t)
    } catch {
      /* no era JSON */
    }
    return { estado: r.status, json, texto: t }
  }
  return { srv, pedir, cerrar: () => srv.s.close() }
}
const P1 = await levantar(con, ids.con.admin)
const P0 = await levantar(sin, ids.sin.admin)
try {
  // 4a. Próximamente
  let r = await P1.pedir('/api/destinos-proximamente', { token: null })
  debe(r.estado === 200 && r.json.origen === 'base' && r.json.destinos.map((d) => d.clave).join() === 'berlin,cartagena_de_indias', `con la 0091 el mapa lee la base y un destino ya publicado no sale en gris (${r.json.destinos?.map((d) => d.clave).join()})`)
  r = await P1.pedir('/api/destinos-proximamente', { token: null })
  debe(!/user|email/.test(r.texto), 'la lista pública no lleva nada personal')
  r = await P1.pedir('/api/admin/destinos/proximamente', { metodo: 'POST', cuerpo: { destino: 'Tokio', pais: 'Japón' } })
  debe(r.estado === 200 && r.json.ok, '[+ Añadir un destino] / [Pasar a Próximamente] guarda el destino')
  r = await P1.pedir('/api/destinos-proximamente', { token: null })
  debe(r.json.destinos.some((d) => d.clave === 'tokio' && d.lat === 35.68), 'y el mapa lo recibe, con su posición')
  r = await P1.pedir('/api/admin/destinos/proximamente', { metodo: 'POST', cuerpo: { destino: 'Tokio', pais: 'Japón' } })
  debe(r.estado === 409 && r.json.ya_esta, 'no se puede añadir dos veces')
  r = await P1.pedir('/api/admin/destinos/proximamente', { metodo: 'POST', cuerpo: { destino: 'Florencia', pais: 'Italia' } })
  debe(r.estado === 409 && r.json.lanzado, 'un destino que ya está en la app no pasa a Próximamente: nunca en los dos sitios')
  r = await P1.pedir('/api/admin/destinos/proximamente', { metodo: 'POST', cuerpo: { destino: 'x', pais: '' } })
  debe(r.estado === 400, 'un nombre que no vale se rechaza')
  r = await P1.pedir('/api/admin/destinos/proximamente', { metodo: 'POST', cuerpo: { destino: 'Lima' }, token: 'otro' })
  debe(r.estado === 401, 'sin sesión de administrador no se puede cambiar nada')
  r = await P1.pedir('/api/admin/destinos')
  debe(r.json.puede_editar === true && r.json.proximamente.every((p) => p.clave) && r.json.proximamente.some((p) => p.destino === 'Florencia' && p.publicado === true) && r.json.proximamente.some((p) => p.destino === 'Berlín' && p.publicado === false), 'Destinos pedidos: se puede editar, y cada Próximamente dice si ya está publicado')
  debe(r.json.pedidos.every((x) => !(x.proximamente && x.lanzado)), '«En Próximamente» solo en los que están en la lista y aún no están publicados (nunca «próximamente» y «ya en la app» a la vez)')
  r = await P1.pedir('/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Berlín' } })
  debe(r.estado === 409 && r.json.no_publicado && /Aún no está en la app/.test(r.json.error), '[Avisar] de un destino sin publicar: «Aún no está en la app»')
  r = await P1.pedir('/api/admin/destinos/ya-disponible', { metodo: 'POST', cuerpo: { destino: 'Florencia' } })
  debe(r.estado === 200 && r.json.ok, '[Ya está disponible] de uno publicado sí avisa')
  r = await P1.pedir('/api/admin/destinos/proximamente/quitar', { metodo: 'POST', cuerpo: { clave: 'tokio' } })
  debe(r.estado === 200, '[Quitar de Próximamente] lo quita')
  r = await P1.pedir('/api/destinos-proximamente', { token: null })
  debe(!r.json.destinos.some((d) => d.clave === 'tokio'), 'y el mapa deja de enseñarlo')

  // 4b. Ventas: comisión, devoluciones, clics, quién compró
  await servidor(() => q("update public.pagos_registro set creado_en = '2026-11-20T09:00:00Z'"))
  await servidor(() => q("update public.pagos_registro set proveedor = 'stripe' where pago_ref = $1", [a.sesion])) // (la compra de prueba usó el pago de mentira: aquí se trata como un cobro real devuelto)
  await servidor(() => q("select public.registrar_pago('cs_dos', 'pi_dos', 'stripe', $1, 'Roma', 'uno', 1, 1000, 'eur', null)", [ids.con.bea]))
  await servidor(() => q("select public.pago_anotar('cs_dos', $1, 50)", [ids.con.bea]))
  await servidor(() => q("update public.pagos_registro set creado_en = '2026-11-20T10:00:00Z' where pago_ref = 'cs_dos'"))
  r = await P1.pedir('/api/admin/ventas?periodo=30d')
  const v = r.json
  const comisiones = (await q("select coalesce(sum(comision_cent), 0)::int as c from public.pagos_registro where proveedor <> 'mentira' and creado_en >= '2026-10-22'"))[0].c
  const devueltos = (await q("select coalesce(sum(case when estado = 'devuelto' then coalesce(devuelto_cent, importe_cent) else coalesce(devuelto_cent, 0) end), 0)::int as c from public.pagos_registro where proveedor <> 'mentira' and creado_en >= '2026-10-22'"))[0].c
  debe(v.te_queda.comision_cent === comisiones && comisiones > 0, `«Lo que te queda» lleva la comisión de Stripe (${v.te_queda.comision_cent} cent)`)
  debe(v.te_queda.devoluciones_cent === devueltos, `y las devoluciones (${v.te_queda.devoluciones_cent} cent)`)
  debe(v.te_queda.cent === v.ingresos_cent - comisiones - devueltos && v.te_queda.antes_de_impuestos === true, 'te queda = ingresos − comisión − devoluciones, antes de impuestos')
  debe(v.compras.some((c) => c.estado === 'reembolsado') && v.compras.some((c) => c.persona?.nombre === 'Bea'), 'las compras llevan quién pagó (por su user_id) y las devoluciones salen como «reembolsado»')
  for (const d of [['Roma', 'actividad', 'civitatis'], ['Roma', 'actividad', 'civitatis'], ['Lanzarote', 'hotel', 'stay22']]) await P1.pedir('/api/afiliados/clic', { metodo: 'POST', token: null, cuerpo: { destino: d[0], tipo: d[1], proveedor: d[2] } })
  r = await P1.pedir('/api/afiliados/clic', { metodo: 'POST', token: null, cuerpo: { destino: 'Roma', tipo: 'coche', proveedor: 'x' } })
  // (V39) Los clics se apuntan con el día REAL de la base (hoy); el reloj de esta prueba está parado el 21-nov. Se llevan al 20-nov, como las compras de arriba: si no, desde el 22-nov caen fuera del periodo y salen a 0.
  await servidor(() => q("update public.afiliados_clics set dia = '2026-11-20'"))
  debe(r.estado === 204, 'el clic responde 204 sin enseñar nada, también si no vale')
  r = await P1.pedir('/api/admin/ventas?periodo=30d')
  const af = r.json.afiliados
  debe(af.clics === 4 + 3 && af.por_destino.find((d) => d.destino === 'Roma')?.actividad === 3 + 2 && af.por_destino.find((d) => d.destino === 'Lanzarote')?.hotel === 1 && af.por_proveedor.civitatis === 5 && af.por_proveedor.stay22 === 2, `Ventas › Afiliados cuenta los clics por destino y tipo (${JSON.stringify(af.por_proveedor)})`)
  debe(!/user_id|cuenta|ip/i.test(JSON.stringify(af).replace(/por_proveedor|proveedor/g, '')), 'y no sabe quién pulsó')

  // 4c. Cuentas de prueba
  r = await P1.pedir('/api/admin/inicio?periodo=todo')
  const total = r.json.usuarios.total
  debe(r.json.sin_pruebas === true && r.json.hay.pruebas === true, 'Inicio dice que «Sin cuentas de prueba» está encendido por defecto')
  const completo = (await q('select count(*)::int as n from auth.users where is_anonymous = false'))[0].n
  debe(total === completo - 2, `con «Sin cuentas de prueba» no cuentan la de pruebas ni la de administrador (${total} de ${completo})`)
  r = await P1.pedir('/api/admin/inicio?periodo=todo&sin_pruebas=0')
  debe(r.json.usuarios.total === completo - 1 && r.json.sin_pruebas === false, 'apagado, cuenta la de pruebas (la de administrador no cuenta nunca)')
  r = await P1.pedir('/api/admin/cuentas-de-prueba', { metodo: 'POST', cuerpo: { email: 'bea@x.es', marcar: true } })
  const marcada = r.estado === 200
  r = await P1.pedir('/api/admin/inicio?periodo=todo')
  debe(marcada && r.json.usuarios.total === completo - 3, 'marcar una cuenta por correo hace que deje de contar')
  r = await P1.pedir('/api/admin/cuentas-de-prueba', { metodo: 'POST', cuerpo: { email: 'bea@x.es', marcar: false } })
  r = await P1.pedir('/api/admin/inicio?periodo=todo')
  debe(r.json.usuarios.total === completo - 2, 'desmarcarla la devuelve a las cifras')
  // Usuarios: la lista las sigue enseñando (con «Prueba»); los totales no las cuentan.
  r = await P1.pedir('/api/admin/usuarios')
  const filaPrueba = r.json.usuarios?.find((u) => u.email === 'bengala.ingresos+pruebas1@gmail.com')
  debe(Boolean(filaPrueba) && filaPrueba.prueba === true && r.json.usuarios.find((u) => u.email === 'ana@x.es')?.prueba === false, 'la lista de usuarios enseña la cuenta de pruebas con la etiqueta «Prueba» y las demás sin ella')
  r = await P1.pedir('/api/admin/usuarios/totales?periodo=todo')
  const r0 = await P1.pedir('/api/admin/usuarios/totales?periodo=todo&sin_pruebas=0')
  debe(r.json.sin_pruebas === true && r0.json.sin_pruebas === false && r0.json.cuentas_ocultas === r.json.cuentas_ocultas - 1, 'los totales de Usuarios no cuentan la de pruebas con el interruptor encendido, y sí apagado (la de administrador, nunca)')
  r = await P1.pedir('/api/admin/cuentas-de-prueba', { metodo: 'POST', cuerpo: { email: 'admin@x.es', marcar: true } })
  debe(r.estado === 409, 'las de administrador no se pueden marcar: no cuentan nunca')
  r = await P1.pedir('/api/admin/cuentas-de-prueba')
  debe(r.json.disponible === true && r.json.cuentas.some((c) => c.email === 'bengala.ingresos+pruebas1@gmail.com') && r.json.administradores.includes('admin@x.es'), 'Herramientas ve la lista (con la de pruebas ya marcada) y los administradores')
  r = await P1.pedir('/api/admin/ventas?periodo=30d')
  debe(r.json.sin_pruebas === true, 'Ventas también dice si el interruptor está encendido')

  // 4d. SIN la 0091: todo funciona, con «Pronto»
  r = await P0.pedir('/api/destinos-proximamente', { token: null })
  debe(r.estado === 200 && r.json.origen === 'archivo' && r.json.destinos.length >= 2, 'SIN la 0091 el mapa sigue leyendo el JSON')
  r = await P0.pedir('/api/admin/destinos')
  debe(r.estado === 200 && r.json.puede_editar === false && r.json.proximamente.length >= 3, 'SIN la 0091 Destinos pedidos funciona y dice que no se puede editar («Pronto»)')
  r = await P0.pedir('/api/admin/destinos/proximamente', { metodo: 'POST', cuerpo: { destino: 'Lima', pais: 'Perú' } })
  debe(r.estado === 409 && r.json.pronto === true, 'y [+ Añadir un destino] contesta «Pronto» sin romper nada')
  await servidor(() => sin.q("select public.registrar_pago('cs_sin', 'pi_sin', 'stripe', $1, 'Roma', 'uno', 1, 699, 'eur', null)", [ids.sin.fran]))
  await servidor(() => sin.q("update public.pagos_registro set creado_en = '2026-11-20T09:00:00Z'")) // (V39) igual que arriba: el reloj de la prueba está parado el 21-nov
  r = await P0.pedir('/api/admin/ventas?periodo=todo')
  debe(r.estado === 200 && r.json.te_queda.comision_cent === null && r.json.afiliados.clics === null && r.json.ingresos_cent > 0, 'SIN la 0091 Ventas funciona: la comisión y los clics salen «pronto»')
  r = await P0.pedir('/api/admin/inicio?periodo=todo')
  debe(r.estado === 200 && r.json.hay.pagos === false && r.json.hay.uso === false && r.json.hay.pais === false, 'SIN la 0091 Inicio funciona y sabe qué datos no hay')
  r = await P0.pedir('/api/admin/cuentas-de-prueba')
  debe(r.estado === 200 && r.json.disponible === false, 'SIN la 0091 Herramientas dice «Pronto» en cuentas de prueba')
  r = await P0.pedir('/api/admin/cuentas-de-prueba', { metodo: 'POST', cuerpo: { email: 'x@x.es', marcar: true } })
  debe(r.estado === 409 && r.json.pronto === true, 'y no deja marcar nada')
  r = await P0.pedir('/api/afiliados/clic', { metodo: 'POST', token: null, cuerpo: { destino: 'Roma', tipo: 'hotel', proveedor: 'stay22' } })
  debe(r.estado === 204, 'y un clic de afiliado sigue respondiendo 204 sin guardar nada')
  r = await P0.pedir('/api/admin/inicio?periodo=todo')
  const sinPruebas0 = r.json.usuarios.total
  debe(sinPruebas0 === (await sin.q('select count(*)::int as n from auth.users where is_anonymous = false'))[0].n - 1, 'SIN la 0091 solo el administrador deja de contar (no hay lista de cuentas de prueba)')
} finally {
  P1.cerrar()
  P0.cerrar()
}

/* ───────── 5. Los pagos viejos (script que solo lee) ───────── */
console.log('5. El script de los pagos viejos: solo lee, solo en modo de prueba, y escribe un SQL aparte')
const cobros = [
  { ref: 'cs_test_1', uid: '11111111-2222-3333-4444-555555555555', email: 'a@x.es', comision_cent: 35 },
  { ref: 'cs_test_2', uid: null, email: "o'neil@x.es", comision_cent: null },
  { ref: 'cs_raro; drop table x', uid: null, email: 'z@x.es', comision_cent: 1 },
]
const sql = generarSql(cobros, { ahora: new Date('2026-11-21T10:00:00Z') })
debe(/^begin;/m.test(sql) && /commit;/.test(sql) && !/delete|drop|truncate|insert/i.test(sql.replace('NO lo subas', '')), 'el SQL generado solo hace update dentro de una transacción')
debe(/where pago_ref = 'cs_test_1'/.test(sql) && /coalesce\(user_id, '11111111-2222-3333-4444-555555555555'::uuid\)/.test(sql) && /comision_cent, 35\)/.test(sql), 'rellena quién pagó y la comisión sin pisar lo que ya haya (coalesce)')
debe(/lower\(email\) = lower\('o''neil@x.es'\)/.test(sql), 'sin identificador, busca por el correo del cliente (con comillas bien puestas)')
debe(!/cs_raro/.test(sql), 'una referencia rara no entra en el SQL')
const peticiones = []
const falsoStripe = async (u, o) => {
  peticiones.push([o?.method, String(u)])
  if (/balance_transactions/.test(u)) return { ok: true, json: async () => ({ fee: 40 }) }
  return { ok: true, json: async () => ({ has_more: false, data: [{ id: 'cs_test_9', payment_status: 'paid', metadata: { pase: '1', uid: '11111111-2222-3333-4444-555555555555' }, customer_details: { email: 'a@x.es' }, payment_intent: { latest_charge: { balance_transaction: 'txn_1' } } }, { id: 'cs_test_8', payment_status: 'unpaid', metadata: { pase: '1' } }] }) }
}
const leidos = await leerCobros({ clave: 'sk_test_de_mentira', fetchFn: falsoStripe })
debe(leidos.length === 1 && leidos[0].comision_cent === 40 && peticiones.every(([m]) => m === 'GET'), 'lee de Stripe solo cobros pagados de pases, con la comisión, y solo con GET')
let rechazada = false
try {
  await leerCobros({ clave: 'sk_live_de_mentira', fetchFn: falsoStripe })
} catch {
  rechazada = true
}
debe(rechazada && !JSON.stringify(peticiones).includes('sk_'), 'con una clave que no es de PRUEBA (sk_live_…) se niega sin hacer ninguna petición')
debe(!/STRIPE_SECRET_KEY\s*=\s*['"]?sk_/.test(fs.readFileSync('scripts/pagos/rellenarPagosViejos.mjs', 'utf8').split('\n').filter((l) => !l.startsWith('//')).join('\n')), 'el script no lleva ninguna clave dentro')

/* ───────── 6. El código de la app sigue sin depender de la 0091 ───────── */
console.log('6. La app no depende de la 0091')
const mapa = fs.readFileSync('src/lib/proximamente.ts', 'utf8')
debe(/origen === 'base'/.test(mapa) && /catch\(\(\) => undefined\)/.test(mapa), 'el mapa solo usa la lista del servidor si viene de la base; si falla o es del archivo, sigue con el JSON')
const base = fs.readFileSync('server/panel/base.js', 'utf8')
debe(/conRespaldo/.test(base) && /soloSiExiste/.test(base), 'el panel lee con las columnas nuevas y, si no existen, con las de siempre')

for (const bd of [con, sin]) await bd.db.close?.()
console.log(`\nPrueba de la Tanda V35B (servidor y base de datos): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
