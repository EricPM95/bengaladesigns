// La prueba de la Tanda V19: EL COBRO DEL PASE, SOLO PARA LOS ADMINISTRADORES (PASES_COBRO_SOLO_ADMINS), con el pago de mentira y una base de datos de verdad (PGlite).
//   node scripts/destino/pruebaV19.mjs   (no necesita servidores; nunca toca Stripe ni el Supabase de producción)
import fs from 'node:fs'
import { crearBaseDePrueba, crearAdminDePrueba } from './_baseDeDatosPrueba.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const pagos = await import('../../server/pagos.js')
const pase = await import('../../server/logros/pase.js')
const express = (await import('express')).default
const mal = []
const bd = await crearBaseDePrueba({ alFallar: (m) => mal.push(m) })
debe(mal.length === 0, 'base', `las migraciones se aplican (${mal.join('; ')})`)
const { q, como, nuevoUsuario } = bd
const fichas = new Map()
const admin = crearAdminDePrueba(bd, fichas)
const precios = JSON.parse(leer('data/pase/precios.json'))

/* ───────── 1. Los interruptores ───────── */
console.log('1. Los interruptores')
{
  debe(pase.cobroSoloAdmins({ PASES_COBRO_SOLO_ADMINS: 'true' }) === true && pase.cobroSoloAdmins({}) === false && pase.cobroSoloAdmins({ PASES_COBRO_SOLO_ADMINS: 'false' }) === false, 'interruptor', 'PASES_COBRO_SOLO_ADMINS solo vale con «true»')
  debe(pagos.modoDePago({ PAGO_DE_MENTIRA: 'true', VERCEL: '1' }) === null, 'mentira', 'el pago de mentira no existe en Vercel (nunca en producción)')
  debe(pagos.modoDePago({ STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x', VERCEL: '1' }) === 'stripe', 'mentira', 'en Vercel solo cobra Stripe')
  const indice = leer('server/index.js')
  debe(/cobroSoloAdmins\(\) \|\| !DESTINOS_OCULTOS\.has/.test(indice) && /esAdmin: esAdminLogros/.test(indice) && /cobroSoloAdmins: cobroSoloAdmins\(\)/.test(indice), 'interruptor', 'el servidor lo pasa al cobro, a los logros y a los destinos (un administrador compra también Lanzarote)')
  debe(!/sk_(test|live)_[A-Za-z0-9]{10,}/.test(leer('server/pagos.js') + leer('src/lib/pagoPase.ts')), 'claves', 'ninguna clave de Stripe escrita en el código')
}

/* ───────── 2. HTTP: el administrador ve el cobro; los demás, nada ───────── */
console.log('2. Por HTTP: solo el administrador ve el cobro')
const eric = await nuevoUsuario('eric@jutrip.test', false, 'Eric')
const alicia = await nuevoUsuario('alicia@jutrip.test', false, 'Alicia')
const anonimo = await nuevoUsuario(null, true)
fichas.set('tok-eric', eric)
fichas.set('tok-alicia', alicia)
fichas.set('tok-anonimo', anonimo)
const ENTORNO = { PAGO_DE_MENTIRA: 'true', PASES_COBRO_SOLO_ADMINS: 'true', LOGROS_ADMIN_EMAILS: 'eric@jutrip.test', APP_URL: 'http://localhost:5173' }
const { esAdmin } = await import('../../server/logros/rutas.js')
const pasarela = pagos.pasarelaDeMentira({ origen: 'http://localhost:5173' })
const servicio = pagos.crearServicioPagos({ admin, precios, destinos: ['Roma', 'Lanzarote'], pasarela, env: ENTORNO, log: { error() {} } })
const app = express()
app.use(express.json())
pagos.registrarRutasPagos(app, { admin, servicio, env: ENTORNO, esAdmin })
const servidor = await new Promise((ok) => {
  const s = app.listen(0, () => ok(s))
})
const base = `http://127.0.0.1:${servidor.address().port}`
const http = async (ruta, { token = null, metodo = 'GET', cuerpo = null } = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), Origin: 'http://localhost:5173' }, body: cuerpo ? JSON.stringify(cuerpo) : undefined })
  return { estado: r.status, datos: await r.json().catch(() => null) }
}
try {
  const cEric = await http('/api/pase/config', { token: 'tok-eric' })
  debe(cEric.datos?.cobro === true && cEric.datos.destinos.includes('Lanzarote') && cEric.datos.destinos.includes('Roma'), 'config', 'el administrador ve el cobro, con Roma y también Lanzarote (destino oculto)')
  debe(cEric.datos.claves && Object.values(cEric.datos.claves).every((v) => typeof v === 'boolean') && !JSON.stringify(cEric.datos).includes('sk_'), 'claves', 'el administrador ve solo si las claves están puestas y si son de prueba (sí/no), nunca su valor')
  for (const [quien, token] of [['una viajera normal (Alicia)', 'tok-alicia'], ['una sesión anónima', 'tok-anonimo'], ['sin sesión', null]]) {
    const c = await http('/api/pase/config', { token })
    debe(c.datos?.cobro === false && !c.datos?.precios, 'config', `${quien}: sin cobro (todo abierto, sin hoja de compra ni precios)`)
  }
  debe((await http('/api/pago/crear', { token: 'tok-alicia', metodo: 'POST', cuerpo: { destino: 'Roma', plan: 'uno' } })).estado === 403, 'crear', 'una viajera normal no puede crear un cobro (403), aunque lo intente a mano')
  debe((await http('/api/pago/crear', { token: 'tok-anonimo', metodo: 'POST', cuerpo: { destino: 'Roma', plan: 'uno' } })).estado === 403, 'crear', 'ni una sesión anónima')
  const mAlicia = await http('/api/pases/mios', { token: 'tok-alicia' })
  debe(mAlicia.estado === 200 && mAlicia.datos.pases.length === 0, 'mis_pases', '«Mis pases» de una viajera normal: vacío, sin error')
  debe((await http('/api/pago/estado?sesion=x', { token: 'tok-alicia' })).estado === 403 && (await http('/api/pases/recibo?pase=x', { token: 'tok-alicia' })).estado === 403, 'crear', 'ni el estado de un pago ni un recibo')

  /* ───────── 3. Los pagos del administrador ───────── */
  console.log('3. Los pagos: bueno, rechazado, devuelto, cerrar la página, Dúo y el precio')
  const crear = (plan, extra = {}, token = 'tok-eric', destino = 'Lanzarote') => http('/api/pago/crear', { token, metodo: 'POST', cuerpo: { destino, plan, ...extra } })
  const resolver = (sesion, resultado) => http('/api/pago/mentira/resolver', { metodo: 'POST', cuerpo: { sesion, resultado } })
  // El precio lo pone el servidor
  const trampa = await crear('uno', { precio: 0.01, importe: 1, total: 1, importe_cent: 1, amount: 1 })
  debe(trampa.estado === 200 && trampa.datos.precio.total === 6.99 && pasarela.sesiones.get(trampa.datos.sesion).importe_cent === 699, 'precio', 'el precio lo pone el servidor (6,99 €) aunque el móvil mande 0,01 € (ni «precio», ni «importe», ni «amount»)')
  debe(!/precio|importe|amount|total/.test(leer('src/lib/pagoPase.ts').match(/cuerpo: \{[^}]*\}/)?.[0] ?? ''), 'precio', 'y la app solo manda destino, plan y personas (nunca un importe)')
  // Cerrar la página de Stripe sin pagar: la sesión se queda sin resolver
  const abandonada = await crear('uno')
  const estAb = await http(`/api/pago/estado?sesion=${abandonada.datos.sesion}`, { token: 'tok-eric' })
  debe(estAb.datos?.listo === false && estAb.datos.rechazado === false && !estAb.datos.pase && (await q('select 1 from public.passes')).length === 0, 'cerrar', 'cerrar la página de pago sin pagar: ni pase ni error (listo: false)')
  // Rechazada
  const rech = await crear('uno')
  const rr = await resolver(rech.datos.sesion, 'rechazado')
  const estRech = await http(`/api/pago/estado?sesion=${rech.datos.sesion}`, { token: 'tok-eric' })
  debe(rr.datos?.accion === 'sin_aviso' && estRech.datos?.rechazado === true && estRech.datos?.listo === false && (await q('select 1 from public.passes')).length === 0, 'rechazado', 'tarjeta rechazada: no se crea ningún pase y la app puede decirlo (rechazado: true)')
  const vista = leer('src/lib/pagoPase.ts') + leer('src/components/pase/PagoHost.tsx')
  debe(/No te hemos cobrado nada/.test(vista) || /rechazado/.test(vista), 'rechazado', 'y la app tiene su mensaje claro para el pago rechazado')
  // Bueno: Pase de 1 persona en Lanzarote
  const lanza = await crear('uno', { trip_id: null })
  const rb = await resolver(lanza.datos.sesion, 'bueno')
  debe(rb.datos?.accion === 'pase_creado', 'bueno', 'pago bueno: el pase se crea')
  const estOk = await http(`/api/pago/estado?sesion=${lanza.datos.sesion}`, { token: 'tok-eric' })
  debe(estOk.datos?.listo === true && estOk.datos.pase?.destino === 'Lanzarote' && estOk.datos.pase.estado === 'activo', 'bueno', 'la app, al volver, ve el pase activo de Lanzarote')
  const mios = await http('/api/pases/mios', { token: 'tok-eric' })
  debe(mios.datos?.pases.length === 1 && mios.datos.pases[0].destino === 'Lanzarote' && mios.datos.pases[0].tiene_recibo === true && !('pago_ref' in mios.datos.pases[0]), 'mis_pases', '«Mis pases»: sale el de Lanzarote, con recibo y sin datos internos del cobro')
  const rec = await http(`/api/pases/recibo?pase=${mios.datos.pases[0].id}`, { token: 'tok-eric' })
  debe(rec.estado === 200 && /^https?:\/\//.test(rec.datos?.url ?? ''), 'recibo', 'el recibo se pide y devuelve su enlace')
  debe((await crear('uno')).estado === 409, 'ya_tienes', 'con el Pase Lanzarote ya comprado no se vuelve a cobrar')
  // Devuelto
  const dev = await resolver(lanza.datos.sesion, 'devuelto')
  const estDev = await http(`/api/pago/estado?sesion=${lanza.datos.sesion}`, { token: 'tok-eric' })
  debe(dev.datos?.accion === 'pase_anulado' && estDev.datos?.devuelto === true && estDev.datos?.listo === false, 'devuelto', 'devolución entera: el pase queda anulado y la app lo enseña (devuelto: true)')
  const miosDev = await http('/api/pases/mios', { token: 'tok-eric' })
  debe(miosDev.datos.pases.every((p) => p.estado !== 'activo'), 'devuelto', 'y en «Mis pases» ya no está activo')
  // Dúo en Roma: lo paga Eric, la segunda plaza la usa Alicia sin pagar
  const duo = await crear('duo', {}, 'tok-eric', 'Roma')
  const trip = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, JSON.stringify({ id: 'r-roma', destination: 'Roma', answers: { dateRange: { start: '2026-12-10', end: '2026-12-13' } }, days: [] })]))[0].id)
  debe(pasarela.sesiones.get(duo.datos.sesion).importe_cent === 1099 && duo.datos.precio.personas === 2, 'duo', 'el Pase Dúo cuesta 10,99 € (lo paga Eric)')
  const rd = await resolver(duo.datos.sesion, 'bueno')
  debe(rd.datos?.accion === 'pase_creado', 'duo', 'el Dúo se activa')
  const paseDuo = (await q("select * from public.passes where destino = 'Roma' and estado = 'activo'"))[0]
  debe(paseDuo && paseDuo.usos_max === 2 && paseDuo.usos_usados === 1 && paseDuo.comprador_id === eric, 'duo', 'el Dúo tiene 2 plazas y la de Eric ya usada')
  const inv = await como(eric, async () => (await q('select public.crear_invitacion($1, $2, 1) as r', [trip, paseDuo.id]))[0].r)
  const entra = await como(alicia, async () => (await q('select public.canjear_invitacion($1) as r', [inv.codigo]))[0].r)
  debe(entra.con_pase === true, 'duo', 'Alicia entra con la segunda plaza del Dúo')
  debe((await q("select 1 from public.pagos_registro where plan = 'duo'")).length === 1 && (await q('select usos_usados from public.passes where id = $1', [paseDuo.id]))[0].usos_usados === 2, 'duo', 'Alicia no paga nada (un solo cobro) y el Dúo queda completo (2 de 2)')
  // Ya con el Dúo, Alicia sigue siendo «viajera normal» para el cobro: no ve la hoja de compra
  debe((await http('/api/pase/config', { token: 'tok-alicia' })).datos?.cobro === false, 'config', 'Alicia, aunque tenga una plaza, no ve el cobro (solo los administradores)')
} finally {
  servidor.close()
}

/* ───────── 4. Los logros y los avisos: los demás, como con el cobro apagado ───────── */
console.log('4. Los logros y los avisos de los demás: todo abierto')
{
  const { crearServicioLogros } = await import('../../server/logros/servicio.js')
  const fuente = leer('server/logros/servicio.js')
  debe(/cobroDe = async \(userId\) => Boolean\(cobro\) && \(!cobroSoloAdmins/.test(fuente) && (fuente.match(/const cobro = await cobroDe\(userId\)/g) ?? []).length === 2, 'logros', 'el servicio de logros pregunta por cuenta si se cobra (nunca con el «cobro» global)')
  debe(/cobroSoloAdmins\(env\)/.test(leer('server/avisosViaje.js')), 'avisos', 'los avisos del móvil también: quien no es administrador recibe todos, como con el cobro apagado')
  debe(typeof crearServicioLogros === 'function', 'logros', 'el servicio de logros carga')
  // Con datos de verdad: puedeGanar de una viajera normal con el cobro solo para administradores
  const { cargarDatos, cargarCatalogo } = await import('../../server/logros/datos.js')
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma') }
  const repo = { sinPaseDe: async () => false, pasesDe: async () => [], hechosDe: async () => [], viajesDe: async () => [], logrosDe: async () => [], pruebaDe: async () => null, cuentaDe: async () => ({ cuenta: null }), ordenPionero: async () => null, probadorDe: async () => null, perfilDe: async () => null, pruebaHoyDe: async () => null, insertarHecho: async () => null, deshacerHecho: async () => {} }
  const conTodo = crearServicioLogros({ repo, datos, catalogos, cobro: true, cobroSoloAdmins: true, esAdminDeCuenta: async (uid) => uid === 'admin' })
  const abierto = await conTodo.estadoDelPase('viajera', null)
  const cerrado = await conTodo.estadoDelPase('admin', null)
  debe(abierto.cobro === false && cerrado.cobro === true, 'logros', 'estado del pase: una viajera normal, cobro: false (todo abierto); el administrador, cobro: true')
}

/* ───────── 5. Los campos del aviso de Stripe (versión de la API del webhook) ───────── */
console.log('5. Los campos que lee el cobro del aviso de Stripe')
{
  const src = leer('server/pagos.js')
  const lee = (clave) => new RegExp(clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(src)
  const usados = ['o.payment_status', 'o.metadata', 'o.payment_intent', 'o.amount_total', 'o.currency', 'o.refunded', 'o.amount_refunded', 'o.amount', 'o.id']
  debe(usados.every(lee), 'webhook', `el cobro lee de checkout.session.completed y charge.refunded solo: ${usados.join(', ')}`)
  // Aviso de pago con la forma de Stripe: se procesa
  const pasarelaE = pagos.pasarelaDeMentira()
  const servicioE = pagos.crearServicioPagos({ admin, precios, destinos: ['Roma'], pasarela: pasarelaE, env: ENTORNO, log: { error() {} } })
  const evento = { id: 'evt_t', type: 'checkout.session.completed', data: { object: { id: 'cs_test_v19', object: 'checkout.session', payment_status: 'paid', payment_intent: 'pi_v19', amount_total: 699, currency: 'eur', metadata: { pase: '1', uid: alicia, destino: 'Roma', plan: 'uno', personas: '1', trip_id: '' } } } }
  debe((await servicioE.procesarEvento(evento)).accion === 'pase_creado', 'webhook', 'un checkout.session.completed con la forma de Stripe crea el pase')
  const dev = { id: 'evt_d', type: 'charge.refunded', data: { object: { id: 'ch_v19', object: 'charge', payment_intent: 'pi_v19', amount: 699, amount_refunded: 699, refunded: true, metadata: {} } } }
  debe((await servicioE.procesarEvento(dev)).accion === 'pase_anulado', 'webhook', 'un charge.refunded entero, con la forma de Stripe, anula el pase')
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
