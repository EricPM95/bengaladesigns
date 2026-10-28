// La prueba de la Tanda 10N2: las cuentas del grupo, quién le debe a quién (diseño `Piezas/Cuentas Grupo`, pantallas 01 a 06). No toca el motor de rutas.
//   APP_URL=... API_URL=... node scripts/destino/pruebaTanda10N2.mjs
//
// 1. La cuenta pura: a partes iguales, «… € cada uno», los céntimos que sobran para quien pagó, lo mínimo para quedar en paz, qué cuenta y qué no.
// 2. La base de datos (PGlite con las migraciones reales, la 0040 incluida): «¿Entre quién?», editar un gasto, los pagos y sus avisos, quien sale del viaje.
// 3. Las pantallas pintadas con el código de verdad (react-dom/server).
// 4. La pantalla de verdad (hace falta Vite; sin él se salta): capturas a tamaño de móvil en docs/dias/capturas_jutrip/10n2_*.jpg.
// Lo que SOLO se prueba contra Supabase de verdad (Realtime por la red) queda dicho al final del informe.
import fs from 'node:fs'
import path from 'node:path'
import { crearBaseDePrueba, crearAdminDePrueba } from './_baseDeDatosPrueba.mjs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
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
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const eur = (amount) => ({ amount, currency: 'EUR' })

const { M, ponerVersion } = await prepararSSR('scripts/destino/_10n2_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, PantallaPresupuesto, PantallaCuentas, TarjetaCuentas, HojaAnadirGasto, ListaDeAvisos, useRouteStore, usePresupuestoUi, useGastosCompartidos, useViajeCompartido, useSyncStore, aportacionesDelViaje, cadaUno, calcularCuentas, pagosParaQuedarEnPaz, repartir } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')

/* ═══════════════ 1. La cuenta pura ═══════════════ */
console.log('1. La cuenta (pura)')
const PER = [{ id: 'eric', nombre: 'Eric' }, { id: 'ana', nombre: 'Ana' }, { id: 'luis', nombre: 'Luis' }, { id: 'marta', nombre: 'Marta' }]
const TODOS = PER.map((p) => p.id)
const ap = (id, euros, pagan, entre = TODOS) => ({ id, nombre: id, origen: 'gasto', centimos: Math.round(euros * 100), pagan, entre })
{
  const r = repartir(10000, ['eric'], ['eric', 'ana', 'luis'])
  const suma = (m) => [...m.values()].reduce((a, b) => a + b, 0)
  debe(r.toca.get('ana') === 3333 && r.toca.get('luis') === 3333 && r.toca.get('eric') === 3334 && suma(r.toca) === 10000 && suma(r.pagado) === 10000, '1', '100 € entre 3: 33,33 € cada uno y el céntimo que sobra, para quien lo pagó (Eric 33,34): cuadra al céntimo')
  const r2 = repartir(10000, ['ana'], ['eric', 'luis', 'marta'])
  debe(r2.toca.get('ana') === 1 && suma(r2.toca) === 10000, '1', 'si quien pagó no está entre los marcados, igualmente asume el céntimo que sobra (la suma sigue siendo exacta)')
  const r3 = repartir(1001, ['eric', 'ana'], TODOS)
  debe(suma(r3.pagado) === 1001 && suma(r3.toca) === 1001 && r3.pagado.get('eric') === 501 && r3.pagado.get('ana') === 500, '1', 'dos que pagan: lo que adelantan suma el total (el céntimo, al primero)')
  debe(cadaUno(12000, 4) === 3000 && cadaUno(12000, 3) === 4000 && cadaUno(10000, 3) === 3333, '1', '«… € cada uno»: 120 € entre 4 = 30 €, entre 3 = 40 €')
  // El ejemplo de Design: Eric pagó 240, Ana 135, Luis 135 y Marta 90; en total 600, a 150 cada uno.
  const c = calcularCuentas({ aportaciones: [ap('g1', 240, ['eric']), ap('g2', 135, ['ana']), ap('g3', 135, ['luis']), ap('g4', 90, ['marta'])], pagos: [], personas: PER })
  const saldo = (cu, id) => cu.personas.find((p) => p.id === id).saldo / 100
  debe(c.total === 60000 && c.porPersona === 15000 && c.aPartesIguales, '04', 'Design: total 600 €, 150 € por persona, a partes iguales')
  debe(saldo(c, 'eric') === 90 && saldo(c, 'ana') === -15 && saldo(c, 'luis') === -15 && saldo(c, 'marta') === -60, '04', 'Design: Eric +90, Ana −15, Luis −15, Marta −60')
  const e = c.personas.find((p) => p.id === 'eric')
  debe(e.pagado === 24000 && e.toca === 15000, '04', 'Eric: ha pagado 240 € · le toca 150 €')
  debe(c.personas.reduce((a, p) => a + p.saldo, 0) === 0, '04', 'la suma de los saldos es 0 (siempre cuadra)')
  const pend = c.pendientes.map((x) => `${x.deudorId}>${x.acreedorId}:${x.centimos / 100}`).sort().join()
  debe(pend === 'ana>eric:15,luis>eric:15,marta>eric:60', '04', 'para quedar en paz: Marta 60 € a Eric, Luis 15 € y Ana 15 € (lo mínimo: 3 pagos)')
  debe(!c.enPaz && c.hayGastos, '04', 'no están en paz')
  // 05 · Ana ya ha pagado.
  const c5 = calcularCuentas({ aportaciones: [ap('g1', 240, ['eric']), ap('g2', 135, ['ana']), ap('g3', 135, ['luis']), ap('g4', 90, ['marta'])], pagos: [{ id: 'p1', deudorId: 'ana', acreedorId: 'eric', centimos: 1500, marcadoPor: 'eric' }], personas: PER })
  debe(saldo(c5, 'eric') === 75 && saldo(c5, 'ana') === 0, '05', 'tras «Ya está pagado» de Ana: Eric +75 € y Ana 0 €')
  const a5 = c5.personas.find((p) => p.id === 'ana')
  debe(a5.pagado + a5.enviado === 15000 && a5.toca === 15000, '05', 'Ana: ha pagado 150 € · le toca 150 €')
  debe(c5.pendientes.length === 2 && c5.pagados.length === 1, '05', 'quedan 2 pagos pendientes y 1 pagado')
  // 06 · todos en paz.
  const c6 = calcularCuentas({ aportaciones: [ap('g1', 240, ['eric']), ap('g2', 135, ['ana']), ap('g3', 135, ['luis']), ap('g4', 90, ['marta'])], pagos: [{ id: 'p1', deudorId: 'ana', acreedorId: 'eric', centimos: 1500, marcadoPor: 'eric' }, { id: 'p2', deudorId: 'luis', acreedorId: 'eric', centimos: 1500, marcadoPor: 'eric' }, { id: 'p3', deudorId: 'marta', acreedorId: 'eric', centimos: 6000, marcadoPor: 'marta' }], personas: PER })
  debe(c6.enPaz && c6.pendientes.length === 0 && c6.personas.every((p) => p.saldo === 0), '06', 'con los tres pagos marcados, todos a 0 € y «Estáis en paz»')
  const cVacia = calcularCuentas({ aportaciones: [], pagos: [], personas: PER })
  debe(!cVacia.enPaz && !cVacia.hayGastos, '06', 'sin gastos no se dice «Estáis en paz» (todavía no hay nada)')
  // 03 · entre tres.
  const c3 = calcularCuentas({ aportaciones: [ap('g1', 120, ['eric'], ['eric', 'ana', 'marta'])], pagos: [], personas: PER })
  debe(!c3.aPartesIguales && c3.porPersona === null && saldo(c3, 'luis') === 0 && saldo(c3, 'ana') === -40 && saldo(c3, 'eric') === 80, '03', 'entre 3 (Luis fuera): 40 € cada uno, Luis no debe nada, y sin «por persona» arriba')
  // 100 € entre 3 en el grupo, cuadra.
  const c100 = calcularCuentas({ aportaciones: [ap('g1', 100, ['eric'], ['eric', 'ana', 'luis'])], pagos: [], personas: PER })
  debe(c100.personas.reduce((a, p) => a + p.saldo, 0) === 0 && c100.pendientes.reduce((a, x) => a + x.centimos, 0) === 6666, '1', '100 € entre 3: Ana y Luis deben 33,33 € cada uno a Eric y todo cuadra')
  // Quien sale del viaje sigue en las cuentas.
  const cx = calcularCuentas({ aportaciones: [ap('g1', 90, ['marta'], ['eric', 'ana', 'marta'])], pagos: [], personas: [...PER.filter((p) => p.id !== 'luis'), { id: 'pepe', nombre: 'Pepe' }], todos: ['eric', 'ana', 'marta'] })
  debe(!cx.personas.some((p) => p.id === 'pepe'), '2', 'quien salió y no tiene nada en las cuentas no sale')
  const cs = calcularCuentas({ aportaciones: [ap('g1', 90, ['pepe'], ['eric', 'ana', 'pepe'])], pagos: [], personas: [...PER.filter((p) => p.id !== 'luis' && p.id !== 'marta'), { id: 'pepe', nombre: 'Pepe' }], todos: ['eric', 'ana'] })
  debe(cs.personas.some((p) => p.id === 'pepe' && p.nombre === 'Pepe' && p.pagado === 9000 && p.toca === 3000) && cs.personas.reduce((a, p) => a + p.saldo, 0) === 0, '2', 'quien salió del viaje sigue en las cuentas con su nombre, con lo que puso y lo que le tocaba')
  debe(pagosParaQuedarEnPaz(new Map([['a', 0], ['b', 0]])).length === 0, '04', 'sin saldos, sin pagos')

  // Qué cuenta y qué no.
  const G = (id, ambito, estado, amount, pagadoPor = ['eric'], entre = []) => ({ id, tripId: 't', autorId: 'eric', nombre: id, precio: eur(amount), ambito, estado, pagadoPor, entre, decididoPor: null, creadoEn: '2026-10-26' })
  const gastos = [G('ok', 'grupo', 'aceptado', 100), G('mio', 'mio', 'aceptado', 50, []), G('pend', 'grupo', 'pendiente', 40), G('rech', 'grupo', 'rechazado', 30)]
  const reservas = [{ id: 'r1', name: 'Coliseo', precio: eur(60), paraQuien: ['eric', 'ana'], kind: 'entrada' }, { id: 'r2', name: 'Solo yo', precio: eur(20), paraQuien: null, kind: 'entrada' }, { id: 'r3', name: 'Free Tour', precio: null, paraQuien: TODOS, kind: 'entrada' }]
  const ents = aportacionesDelViaje({ gastos, reservas, adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null })
  debe(ents.map((a) => a.id).join() === 'gasto-ok,reserva-r1', '1', 'cuentan el gasto aceptado y lo reservado para varios; no los [Para mí], los pendientes ni los rechazados, ni la reserva «solo para mí» ni la que no tiene precio')
  const cuentaRes = calcularCuentas({ aportaciones: ents, pagos: [], personas: PER })
  const res = cuentaRes.personas.find((p) => p.id === 'eric')
  debe(ents[1].pagan.join() === 'eric' && ents[1].entre.join() === 'eric,ana' && res.pagado === 16000 && res.toca === 2500 + 3000, '1', 'lo reservado para varios: lo pagó el dueño y se reparte entre las marcadas (60 € entre Eric y Ana = 30 € cada uno)')
  debe(!cuentaRes.aPartesIguales && cuentaRes.porPersona === null, '1', 'una entrada solo para dos hace que no sea «a partes iguales»')
  const mx = aportacionesDelViaje({ gastos: [{ ...G('mx', 'grupo', 'aceptado', 0), precio: { amount: 800, currency: 'MXN' } }], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: { fecha: '2026-10-26', tasas: { MXN: 20 } } })
  debe(mx.length === 1 && mx[0].centimos === 4000, '1', 'un gasto en otra moneda se pasa a la del viajero con el cambio del día (800 MXN = 40 €)')
  debe(aportacionesDelViaje({ gastos: [{ ...G('mx', 'grupo', 'aceptado', 0), precio: { amount: 800, currency: 'MXN' } }], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null }).length === 0, '1', 'sin cambio para esa moneda, no se cuenta (no se inventa un número)')
  const viejo = aportacionesDelViaje({ gastos: [G('v', 'grupo', 'aceptado', 100, ['eric'], [])], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null })
  debe(viejo[0].entre.join() === TODOS.join(), '1', 'un gasto de antes (sin «entre quién») es entre todos los del viaje')
}

/* ═══════════════ 2. La base de datos ═══════════════ */
console.log('2. La base de datos (PGlite, migraciones reales hasta la 0040)')
{
  const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0040)_/
  const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
  const { db, q, como, servidor, nuevoUsuario } = bd
  debe(bd.aplicadas.includes('0040_cuentas_del_grupo.sql'), 'migracion', 'la 0040 se aplica sobre las anteriores')
  for (const f of ['gastos_de_avisos(uuid[])', 'decisores_de_gastos(uuid)', 'nombres_de_pila(uuid[])']) await db.exec(`revoke execute on function public.${f} from authenticated`)
  const sql = sinComentarios(leer('supabase/migrations/0040_cuentas_del_grupo.sql'))
  debe(/'gasto_pendiente', 'gasto_resuelto', 'pago_marcado'/.test(sql) && /'permiso', 'quitado', 'viaje_cambiado', 'sin_enviar', 'reserva_grupo'/.test(sql) && /'recomendacion', 'aceptada', 'rechazada', 'unido', 'd10', 'resumen', 'sorpresas', 'sorteo', 'amigo_viaje'/.test(sql), '0040', 'la lista de tipos de aviso lleva TODOS los de la 0035 más `pago_marcado`')
  debe(/'trip_pagos', 'marcado_por'/.test(sql) && /'trip_ex_miembros', 'user_id'/.test(sql) && /'trip_gastos', 'autor_id'/.test(sql), '0040', '«empezar de cero» borra también los pagos y el rastro de quien salió (y sigue borrando los gastos)')

  const eric = await nuevoUsuario('eric@correo.es', false, 'Eric Gil')
  const ana = await nuevoUsuario('ana@correo.es', false, 'Ana')
  const luis = await nuevoUsuario('luis@correo.es', false, 'Luis')
  const marta = await nuevoUsuario('marta@correo.es', false, 'Marta')
  const pepe = await nuevoUsuario('pepe@correo.es', false, 'Pepe')
  const ruta = JSON.stringify({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: '2026-11-26', end: '2026-11-29' } }, days: [] })
  const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, ruta]))[0].id)
  await servidor(async () => {
    for (const u of [ana, luis, marta]) await q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viaje, u])
  })
  await como(eric, () => q("select public.cambiar_permiso($1, $2, 'editar')", [viaje, luis]))
  const precio = (n) => JSON.stringify({ amount: n, currency: 'EUR' })
  const gasto = (uid, nombre, n, estado, pagado, entre = '{}') =>
    como(uid, async () => (await q("insert into public.trip_gastos (trip_id, nombre, precio, ambito, estado, pagado_por, entre) values ($1, $2, $3::jsonb, 'grupo', $4, $5::uuid[], $6::uuid[]) returning id", [viaje, nombre, precio(n), estado, pagado, entre]))[0].id)

  console.log('2a. «¿Entre quién?» se guarda y editar un gasto')
  const cena = await gasto(eric, 'Cena', 120, 'aceptado', `{${eric}}`, `{${eric},${ana},${marta}}`)
  {
    const f = (await servidor(() => q('select entre from public.trip_gastos where id = $1', [cena])))[0]
    debe(f.entre.length === 3 && f.entre.includes(ana) && !f.entre.includes(luis), '03', '«¿Entre quién?» se guarda (Eric, Ana y Marta; Luis fuera)')
    const sinEntre = await gasto(eric, 'De antes', 10, 'aceptado', `{${eric}}`)
    debe((await servidor(() => q('select entre from public.trip_gastos where id = $1', [sinEntre])))[0].entre.length === 0, '1', 'sin «entre quién» queda vacío = entre todos (los gastos de antes de la 0040)')
    const edita = (uid, id, n, extra = '') => como(uid, async () => (await q(`update public.trip_gastos set precio = $2::jsonb ${extra} where id = $1 returning id`, [id, precio(n)])).length)
    debe((await edita(ana, cena, 99)) === 0, '1', 'Ana (ni lo añadió ni puede editar) no puede editar el gasto de Eric')
    debe((await edita(marta, cena, 99)) === 0, '1', 'Marta (solo recomienda) tampoco')
    debe((await edita(eric, cena, 130)) === 1, '1', 'quien lo añadió (Eric) sí puede editar el importe')
    debe((await edita(luis, cena, 150)) === 1, '1', 'quien puede editar (Luis) sí')
    await como(luis, () => q('update public.trip_gastos set pagado_por = $2::uuid[], entre = $3::uuid[], nombre = $4 where id = $1', [cena, `{${ana}}`, `{${eric},${ana},${luis},${marta}}`, 'Cena grande']))
    const g = (await servidor(() => q('select nombre, pagado_por, entre, precio from public.trip_gastos where id = $1', [cena])))[0]
    debe(g.nombre === 'Cena grande' && g.pagado_por[0] === ana && g.entre.length === 4 && g.precio.amount === 150, '1', 'se puede cambiar quién lo pagó, entre quién, el nombre y el importe')
    // Un gasto de Ana, aceptado por Eric: Ana (autora) lo edita.
    const deAna = await gasto(ana, 'Museo', 30, 'pendiente', `{${ana}}`)
    debe((await edita(ana, deAna, 33)) === 1, '1', 'la autora edita su gasto aunque siga pendiente')
    await como(eric, () => q("update public.trip_gastos set estado = 'aceptado' where id = $1", [deAna]))
    debe((await edita(ana, deAna, 36)) === 1 && (await edita(marta, deAna, 1)) === 0, '1', 'ya aceptado, Ana (autora) sigue pudiendo editarlo y Marta no')
    const raro = await lanza(() => como(eric, () => q("update public.trip_gastos set estado = 'rechazado', precio = $2::jsonb where id = $1", [deAna, precio(1)])))
    debe(raro === null ? (await servidor(() => q('select estado from public.trip_gastos where id = $1', [deAna])))[0].estado === 'aceptado' : true, '1', 'cambiar estado y datos a la vez no entra')
    const ambito = await lanza(() => como(eric, () => q("update public.trip_gastos set ambito = 'mio' where id = $1", [cena])))
    debe(ambito !== null || (await servidor(() => q('select ambito from public.trip_gastos where id = $1', [cena])))[0].ambito === 'grupo', '1', 'un gasto del grupo no se convierte en [Para mí]')
    const mio = await como(ana, async () => (await q("insert into public.trip_gastos (trip_id, nombre, precio, ambito, estado) values ($1, 'Mío', $2::jsonb, 'mio', 'aceptado') returning id", [viaje, precio(7)]))[0].id)
    debe((await edita(eric, mio, 1)) === 0 && (await edita(ana, mio, 8)) === 1, '1', 'el [Para mí] solo lo edita quien lo apuntó')
  }

  console.log('2b. 05 · «Ya está pagado»: quién puede, el aviso y deshacer')
  const pago = (uid, deudor, acreedor, n, marcadoPor = uid) => como(uid, async () => (await q('insert into public.trip_pagos (trip_id, deudor_id, acreedor_id, importe, marcado_por) values ($1, $2, $3, $4::jsonb, $5) returning id', [viaje, deudor, acreedor, precio(n), marcadoPor]))[0].id)
  const avisos = (uid, tipo = 'pago_marcado') => servidor(() => q('select payload from public.avisos where user_id = $1 and tipo = $2 order by creado_en', [uid, tipo]))
  {
    const p1 = await pago(eric, ana, eric, 15)
    const aAna = await avisos(ana)
    debe(aAna.length === 1 && aAna[0].payload.actor === 'Eric' && aAna[0].payload.para === 'deudor' && aAna[0].payload.importe.amount === 15 && (await avisos(eric)).length === 0, '05', 'Eric (quien cobra) marca el pago de Ana: a Ana le llega el aviso en la campana, a Eric no')
    const av = await import('../../server/avisos.js')
    const servicio = av.crearServicioAvisos({ admin: crearAdminDePrueba(bd), log: { warn() {} } })
    const lAna = await servicio.listar(ana)
    debe(lAna.avisos.find((x) => x.tipo === 'pago_marcado')?.texto === 'Eric ha marcado como pagados los 15 € que le debías.', '05', 'el aviso de Ana dice «Eric ha marcado como pagados los 15 € que le debías.»')
    const p2 = await pago(ana, ana, eric, 5)
    const aEric = await avisos(eric)
    debe(aEric.length === 1 && aEric[0].payload.para === 'acreedor', '05', 'Ana (quien paga) lo marca: a Eric le llega el aviso')
    const lEric = await servicio.listar(eric)
    debe(lEric.avisos.find((x) => x.tipo === 'pago_marcado')?.texto === 'Ana ha marcado como pagados los 5 € que te debía.', '05', 'el aviso de Eric dice «Ana ha marcado como pagados los 5 € que te debía.»')
    debe((await lanza(() => pago(marta, ana, eric, 3))) !== null, '4a', 'Marta (solo recomienda y no es parte del pago) no puede marcarlo')
    debe((await lanza(() => pago(pepe, ana, eric, 3))) !== null, 'seguridad', 'quien no está en el viaje, tampoco')
    debe((await lanza(() => pago(ana, ana, eric, 3, eric))) !== null, 'seguridad', 'nadie marca un pago «en nombre de» otra persona')
    const p3 = await pago(luis, marta, eric, 20)
    debe((await avisos(marta)).length === 1 && (await avisos(eric)).length === 2 && (await avisos(luis)).length === 0, '05', 'quien puede editar (Luis) lo marca entre Marta y Eric: les llega a los dos, no a él')
    const lMarta = await servicio.listar(marta)
    debe(lMarta.avisos.find((x) => x.tipo === 'pago_marcado')?.texto === 'Luis ha marcado como pagados los 20 € que le debías a Eric.', '05', 'el aviso de Marta: «Luis ha marcado como pagados los 20 € que le debías a Eric.»')
    const p4 = await pago(eric, luis, marta, 9) // el administrador, entre otros dos
    debe((await avisos(luis)).length === 1, '05', 'el administrador puede marcar cualquier pago')
    for (const u of [eric, ana, luis, marta]) debe((await como(u, async () => (await q('select id from public.trip_pagos where trip_id = $1', [viaje])).length)) === 4, '06', 'todo el grupo ve todos los pagos')
    debe((await como(pepe, async () => (await q('select id from public.trip_pagos')).length)) === 0, 'seguridad', 'quien no está en el viaje no ve ningún pago')
    const borra = (uid, id) => como(uid, async () => (await q('delete from public.trip_pagos where id = $1 returning id', [id])).length)
    debe((await borra(marta, p1)) === 0 && (await borra(pepe, p1)) === 0, '05', 'Marta (ajena a ese pago) no puede deshacerlo')
    debe((await borra(ana, p1)) === 1, '05', 'Ana (quien paga) deshace el pago')
    debe((await borra(luis, p3)) === 1, '05', 'quien puede editar deshace un pago ajeno')
    debe((await borra(eric, p4)) === 1 && (await borra(eric, p2)) === 1, '05', 'el administrador deshace cualquiera')
    debe((await lanza(() => como(eric, () => q('insert into public.trip_pagos (trip_id, deudor_id, acreedor_id, importe, marcado_por) values ($1, $2, $2, $3::jsonb, $4)', [viaje, ana, precio(1), eric])))) !== null, '05', 'nadie se debe a sí mismo')
  }

  console.log('2c. Quien sale del viaje sigue en las cuentas con su nombre')
  {
    const deMarta = await gasto(eric, 'Comida de Marta', 60, 'aceptado', `{${marta}}`, `{${eric},${marta}}`)
    await como(marta, () => q('select public.salir_del_viaje($1)', [viaje]))
    const ex = await como(eric, async () => (await q('select user_id, nombre from public.trip_ex_miembros where trip_id = $1', [viaje])))
    debe(ex.length === 1 && ex[0].user_id === marta && ex[0].nombre === 'Marta', '2', 'al salir, queda su nombre en `trip_ex_miembros` (lo ven el dueño y el grupo)')
    debe((await como(pepe, async () => (await q('select * from public.trip_ex_miembros')).length)) === 0, 'seguridad', 'quien no está en el viaje no lo ve')
    const g = await como(eric, async () => (await q('select pagado_por, entre from public.trip_gastos where id = $1', [deMarta]))[0])
    debe(g.pagado_por[0] === marta && g.entre.includes(marta), '2', 'su gasto y lo que le tocaba se quedan en el gasto, con su id')
    debe((await como(marta, async () => (await q('select id from public.trip_gastos where trip_id = $1', [viaje])).length)) <= 1, '2', 'y ella ya no ve las cuentas del grupo')
    await como(eric, () => q('select public.quitar_del_viaje($1, $2)', [viaje, luis]))
    debe((await como(eric, async () => (await q('select user_id from public.trip_ex_miembros where trip_id = $1', [viaje])).length)) === 2, '2', 'quitar a alguien también deja su nombre')
  }
}

/* ═══════════════ 3. Las pantallas pintadas ═══════════════ */
console.log('3. Las pantallas (react-dom/server)')
{
  const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dondeComprado: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
  const route = {
    id: 'p10n2', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
    days: [1, 2, 3].map((n, i) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'manual', colorIndex: i })),
    answers: { dateRange: { start: '2027-08-10', end: '2027-08-14' }, days: 3, companion: 'group' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
  const G = (id, autorId, nombre, amount, pagadoPor, entre = [], extra = {}) => ({ id, tripId: 't1', autorId, nombre, precio: eur(amount), ambito: 'grupo', estado: 'aceptado', pagadoPor, entre, decididoPor: null, creadoEn: '2026-10-26T10:00:00Z', ...extra })
  const gente = (yo, n = 4, permisos = {}) => PER.slice(0, n).map((p) => ({ id: p.id, nombre: p.nombre, foto: null, esAdmin: p.id === 'eric', permiso: p.id === 'eric' ? 'admin' : (permisos[p.id] ?? 'recomendar'), esYo: p.id === yo }))
  const GASTOS = [G('g1', 'eric', 'Cena', 240, ['eric']), G('g2', 'ana', 'Entradas', 135, ['ana']), G('g3', 'luis', 'Comida', 135, ['luis']), G('g4', 'marta', 'Taxi', 90, ['marta'])]
  const poner = ({ yo = 'eric', esInvitado = false, personas = gente(yo), gastos = GASTOS, pagos = [], ex = [], cuentas = true, disponible = true, reservations = [] }) => {
    ponerVersion('pago')
    usePresupuestoUi.setState({ abierto: true })
    useRouteStore.setState({ ...estadoBase, route, reservations })
    useSyncStore.setState({ activeTripId: 't1', savedTrips: [{ id: 't1', esInvitado }] })
    useViajeCompartido.setState({ tripId: 't1', gente: personas })
    useGastosCompartidos.setState({ tripId: 't1', yoId: yo, disponible, cuentas, resaltado: null, gastos, pagos, exMiembros: ex })
  }
  const pinta = (C, props = {}) => renderToStaticMarkup(createElement(C, props))
  const pago = (id, d, a, n, por = 'eric') => ({ id, deudorId: d, acreedorId: a, centimos: n * 100, marcadoPor: por })

  console.log('3a. 01 · la tarjeta «Cuentas del grupo» en el presupuesto')
  {
    poner({})
    const html = pinta(PantallaPresupuesto)
    const t = plano(aTexto(html))
    debe(/data-tarjeta-cuentas/.test(html) && /Cuentas del grupo/.test(t) && /Ana le debe 15 € a Eric/.test(t) || /Luis le debe 15 € a Eric/.test(t) || /Marta le debe 60 € a Eric/.test(t), '01', 'debajo de «Del grupo», la tarjeta «Cuentas del grupo» con la primera deuda pendiente')
    debe(/Marta le debe 60 € a Eric/.test(t), '01', 'la primera deuda es la mayor (Marta 60 € a Eric)')
    debe((html.match(/data-cara-persona=/g) ?? []).length >= 4, '01', 'con las caras del grupo')
    debe(html.indexOf('data-tarjeta-cuentas') > html.indexOf('Del grupo') && html.indexOf('data-tarjeta-cuentas') < html.indexOf('data-blk="'), '01', 'y la tarjeta va debajo de la tarjeta oscura, antes de los bloques')
    poner({ pagos: [pago('p1', 'marta', 'eric', 60), pago('p2', 'ana', 'eric', 15), pago('p3', 'luis', 'eric', 15)] })
    const paz = pinta(PantallaPresupuesto)
    debe(/Estáis en paz/.test(plano(aTexto(paz))) && /data-en-paz="1"/.test(paz), '06', 'si todo está pagado, la tarjeta dice «Estáis en paz» (en verde)')
    // Sin compartir: ni tarjeta ni pantalla.
    poner({ personas: gente('eric', 1) })
    useGastosCompartidos.setState({ gastos: [] })
    debe(!/data-tarjeta-cuentas|Cuentas del grupo/.test(pinta(PantallaPresupuesto)), 'sin-compartir', 'sin compartir, no hay tarjeta de cuentas')
    poner({ disponible: false })
    debe(!/data-tarjeta-cuentas/.test(pinta(PantallaPresupuesto)), '0037', 'con la 0037 sin aplicar, tampoco')
    poner({ cuentas: false })
    debe(/data-tarjeta-cuentas/.test(pinta(PantallaPresupuesto)), '0040', 'con la 0040 sin aplicar la tarjeta sale igual (las cuentas se calculan con lo que hay)')
  }

  console.log('3b. 04 · la pantalla de las cuentas')
  {
    poner({})
    const html = pinta(PantallaCuentas, { onCerrar() {} })
    const t = plano(aTexto(html))
    debe(/Cuentas del grupo/.test(t) && /4 personas/i.test(t) && /a partes iguales/i.test(t), '04', '«4 personas · a partes iguales»')
    debe(/Total del grupo \| 600 €/.test(t) && /150 € por persona/.test(t), '04', '«Total del grupo 600 €» y «150 € por persona»')
    debe(/Ha pagado 240 € · Le toca 150 €/.test(t) && /Ha pagado 135 € · Le toca 150 €/.test(t) && /Ha pagado 90 € · Le toca 150 €/.test(t), '04', 'cada persona con «Ha pagado … · Le toca …»')
    debe(/\+90 €/.test(t) && /−15 €/.test(t) && /−60 €/.test(t), '04', 'los saldos: +90 €, −15 € y −60 €')
    debe(/oklch\(0\.96 0\.035 150\)/.test(html) && /oklch\(0\.45 0\.16 25\)/.test(html), '04', 'en verde con «+» y en rojo con «−»')
    debe(/PARA QUEDAR EN PAZ|Para quedar en paz/i.test(t) && /Marta le debe 60 € a Eric/.test(t) && /Luis le debe 15 € a Eric/.test(t) && /Ana le debe 15 € a Eric/.test(t), '04', '«Para quedar en paz» con los tres pagos')
    debe((html.match(/data-ya-pagado/g) ?? []).length === 3, '04', 'y [Ya está pagado] en cada uno (Eric, administrador, puede marcarlos todos)')
    debe(!/Estáis en paz/.test(t), '04', 'todavía no están en paz')
    // Quien paga, quien cobra, puede editar y solo recomienda.
    poner({ yo: 'ana', esInvitado: true })
    const ana = pinta(PantallaCuentas, { onCerrar() {} })
    debe((ana.match(/data-ya-pagado/g) ?? []).length === 1 && /Ana le debe 15 € a Eric/.test(plano(aTexto(ana))), '05', 'Ana (solo recomienda) puede marcar lo suyo: solo su línea tiene botón')
    poner({ yo: 'luis', esInvitado: true, personas: gente('luis', 4, { luis: 'editar' }) })
    debe((pinta(PantallaCuentas, { onCerrar() {} }).match(/data-ya-pagado/g) ?? []).length === 3, '05', 'quien puede editar marca cualquiera')
    poner({ yo: 'marta', esInvitado: true, pagos: [], gastos: GASTOS })
    const lineas = pinta(PantallaCuentas, { onCerrar() {} })
    debe((lineas.match(/data-ya-pagado/g) ?? []).length === 1 && /data-saldo="-6000"/.test(lineas), '05', 'Marta solo marca lo suyo; ve las cuentas de todos (con cualquier permiso)')
    poner({ yo: 'ana', esInvitado: true, personas: gente('ana', 4, { ana: 'recomendar' }) })
    debe(/data-pantalla-cuentas/.test(pinta(PantallaCuentas, { onCerrar() {} })), '04', 'la ve todo el grupo con cualquier permiso')
    poner({ cuentas: false })
    debe(!/data-ya-pagado/.test(pinta(PantallaCuentas, { onCerrar() {} })) && /Marta le debe 60 € a Eric/.test(plano(aTexto(pinta(PantallaCuentas, { onCerrar() {} })))), '0040', 'sin la 0040 se ven las cuentas pero no hay botón de marcar pagos')
  }

  console.log('3c. 05 y 06 · pagado y en paz')
  {
    poner({ pagos: [pago('p1', 'ana', 'eric', 15)] })
    const html = pinta(PantallaCuentas, { onCerrar() {} })
    const t = plano(aTexto(html))
    debe(/data-pago-linea="pagado"/.test(html) && /Ana le debía 15 € a Eric/.test(t) && /Pagado/.test(t), '05', 'la línea de Ana, en verde con «✓ Pagado»')
    debe(/\+75 €/.test(t) && /Ha pagado 150 € · Le toca 150 €/.test(t) && /0 € ✓/.test(t), '05', 'Eric +75 €, Ana «Ha pagado 150 € · Le toca 150 €» y «0 € ✓»')
    debe(/data-pago-deshacer/.test(html), '05', 'se puede deshacer')
    debe((html.match(/data-ya-pagado/g) ?? []).length === 2, '05', 'quedan 2 pagos por marcar')
    poner({ yo: 'marta', esInvitado: true, pagos: [pago('p1', 'ana', 'eric', 15)] })
    debe(!/data-pago-deshacer/.test(pinta(PantallaCuentas, { onCerrar() {} })), '05', 'Marta (ajena a ese pago) no ve «Deshacer»')
    poner({ pagos: [pago('p1', 'ana', 'eric', 15), pago('p2', 'luis', 'eric', 15), pago('p3', 'marta', 'eric', 60)] })
    const paz = pinta(PantallaCuentas, { onCerrar() {} })
    const tp = plano(aTexto(paz))
    debe(/data-en-paz/.test(paz) && /Estáis en paz/.test(tp) && (tp.match(/0 € ✓/g) ?? []).length === 4, '06', 'todos a «0 € ✓» y la tarjeta verde «Estáis en paz»')
    debe(!/data-ya-pagado/.test(paz), '06', 'y ya no queda nada por pagar')
  }

  console.log('3d. Si no todos tienen lo mismo, y quien sale')
  {
    poner({ gastos: [G('g1', 'eric', 'Cena', 120, ['eric'], ['eric', 'ana', 'marta']), G('g2', 'eric', 'Taxi', 30, ['eric'])] })
    const t = plano(aTexto(pinta(PantallaCuentas, { onCerrar() {} })))
    debe(/Total del grupo \| 150 €/.test(t) && !/por persona/.test(t) && !/a partes iguales/i.test(t), '04', 'si no todos tienen lo mismo: arriba solo el total (sin «por persona» ni «a partes iguales»)')
    debe(/Luis[^|]*\|[^|]*Ha pagado 0 € · Le toca 7,50 €/.test(t) || /Le toca 7,50 €/.test(t), '04', '«Le toca» es lo de cada uno (Luis solo el taxi: 7,50 €)')
    poner({ personas: gente('eric', 3), ex: [{ id: 'marta', nombre: 'Marta' }], gastos: [G('g1', 'marta', 'Taxi', 90, ['marta'], ['eric', 'ana', 'marta'])] })
    const s = pinta(PantallaCuentas, { onCerrar() {} })
    const ts = plano(aTexto(s))
    debe(/Marta/.test(ts) && /Ya no está en el viaje/.test(ts) && /Ha pagado 90 € · Le toca 30 €/.test(ts), '2', 'quien salió sigue en las cuentas con su nombre, lo que puso y lo que le tocaba')
    debe(/Eric le debe 30 € a Marta/.test(ts) && /Ana le debe 30 € a Marta/.test(ts), '2', 'y los demás le siguen debiendo lo suyo')
    // Lo reservado para varios.
    poner({ gastos: [], reservations: [{ id: 'r1', kind: 'entrada', refId: 'coliseo', name: 'Coliseo', placeNames: [], time: '09:00', precio: eur(60), paraQuien: ['eric', 'ana'], dateIso: '2027-08-11' }] })
    const r = plano(aTexto(pinta(PantallaCuentas, { onCerrar() {} })))
    debe(/Total del grupo \| 60 €/.test(r) && /Ana le debe 30 € a Eric/.test(r), '1', 'lo reservado para varios cuenta: lo pagó Eric y se reparte entre las marcadas (Ana le debe 30 €)')
  }

  console.log('3e. 02 y 03 · «¿Entre quién?» en la hoja de añadir gasto')
  {
    const hoja = (yo, esInvitado, extra = {}) => {
      poner({ yo, esInvitado, ...extra })
      const html = renderToStaticMarkup(createElement(function H() { return createElement(HojaAnadirGasto, { gv: M.useGastosDelViaje(), moneda: 'EUR', onClose() {}, editar: extra.editar }) }))
      return { html, t: plano(aTexto(html)) }
    }
    const h = hoja('eric', false)
    debe(/¿Para quién es\?/i.test(h.t) && /1 de 4/.test(h.t), '02', '(10N7) «¿Para quién es?» y «1 de 4»: por defecto solo marcado quien lo añade')
    debe(['eric', 'ana', 'luis', 'marta'].every((id) => new RegExp('data-elegir-pastilla="entre-' + id + '"').test(h.html)) && new RegExp('data-elegir-pastilla="entre-eric"[^>]*data-elegida="1"|data-elegida="1"[^>]*data-elegir-pastilla="entre-eric"').test(h.html) && !new RegExp('data-elegir-pastilla="entre-ana"[^>]*data-elegida="1"').test(h.html), '02', '(10N7) una pastilla por persona, solo quien lo añade (Eric) marcada por defecto')
    debe(/Solo para ti/.test(h.t) && /data-linea-para-quien/.test(h.html), '02', '(10N7) debajo, la línea pequeña «Solo para ti: …» (ya no hay «… € cada uno»)')
    debe(h.html.indexOf('data-gasto-quien-pago') < h.html.indexOf('data-gasto-entre-quien'), '02', '«¿Para quién es?» va debajo de «¿Quién ha pagado?»')
    const e = hoja('eric', false, { editar: G('g1', 'eric', 'Cena día 1', 120, ['eric'], ['eric', 'ana', 'marta']) })
    debe(/Editar gasto/.test(e.t) && /Guardar cambios/.test(e.t) && /3 de 4/.test(e.t) && /Para 3 personas/.test(e.t), '03', '(10N7) al editar: «Editar gasto», [Guardar cambios], «3 de 4» y «Para 3 personas»')
    debe(!/Se lo enviamos|Entra directo/.test(e.t) && !/data-elegir="gasto-ambito"/.test(e.html), '03', 'al editar no se pregunta [Para todos] / [Para mí]')
    const src = sinComentarios(leer('src/components/route/presupuesto/HojaAnadirGasto.tsx'))
    debe(/soloMio \|\| conjunta \? \[\] : entreFinal/.test(src) && /\{!conjunta && \(\s*<div data-gasto-entre-quien>/.test(src), '04', '(10N7) lo «Solo para ti» y la cuenta conjunta no llevan «¿Para quién es?» con nombres')
  }

  console.log('3f. El aviso de la campana')
  {
    const aviso = { id: 'av1', tipo: 'pago_marcado', texto: 'Eric ha marcado como pagados los 15 € que le debías.', quien: 'Eric', creado_en: new Date().toISOString(), leido: false, etiqueta: null, payload: {} }
    debe(/Eric ha marcado como pagados los 15 € que le debías\./.test(plano(aTexto(renderToStaticMarkup(createElement(ListaDeAvisos, { avisos: [aviso], onTocar() {} }))))), '05', 'la lista de avisos pinta «Eric ha marcado como pagados los 15 € que le debías.»')
  }
}
console.error = consolaError

/* ═══════════════ 4. El código ═══════════════ */
console.log('4. El código')
{
  const red = sinComentarios(leer('src/lib/gastosCompartidosRed.ts'))
  debe(/table: 'trip_pagos'/.test(red) && /table: 'trip_gastos'/.test(red), 'directo', 'Realtime escucha los gastos Y los pagos: lo que marque otra persona te cambia sin recargar')
  debe(/const p = await supabase\.from\('trip_pagos'\)/.test(red) && /\.from\('trip_pagos'\)\.insert/.test(red) && /\{ error \} = await supabase\.from\('trip_gastos'\)\.insert\(fila\)|\(\{ error \} = await supabase\.from\('trip_gastos'\)\.insert\(fila\)\)/.test(red), '0040', 'con la 0040 sin aplicar, añadir un gasto se guarda como antes (sin `entre`) y los errores de Postgrest se miran siempre')
  const host = sinComentarios(leer('src/components/presupuesto/GastosCompartidosHost.tsx'))
  debe(/escuchar\(tripId/.test(host) && /setInterval/.test(host), 'directo', 'el anfitrión sigue leyendo en directo, cada poco y al volver a la app')
  for (const f of ['src/lib/cuentasGrupo.ts', 'src/hooks/useCuentasDelGrupo.ts', 'src/components/route/presupuesto/PantallaCuentas.tsx']) debe(!/€/.test(sinComentarios(leer(f))), '€', `${f}: ningún «€» escrito a mano`)
  const pantalla = sinComentarios(leer('src/components/route/presupuesto/PantallaPresupuesto.tsx'))
  debe(/gv\.compartido && modoCuentas\.modo !== 'conjunta' && <TarjetaCuentas/.test(pantalla) && /cuentasAbiertas && gv\.compartido && <PantallaCuentas/.test(pantalla), 'sin-compartir', '(10N7) la tarjeta y la pantalla solo existen en un viaje compartido (y la tarjeta no en cuenta conjunta)')
}

/* ═══════════════ 5. La pantalla de verdad (móvil, con un servidor de mentira en memoria) ═══════════════ */
console.log('5. La pantalla de verdad (hace falta Vite; sin él se salta)')
{
  const SALIDA = path.resolve('docs/dias/capturas_jutrip')
  fs.mkdirSync(SALIDA, { recursive: true })
  const base = process.env.APP_URL || 'http://localhost:5173'
  let arriba = false
  try {
    arriba = (await fetch(base, { signal: AbortSignal.timeout(60000) })).status < 500
  } catch {
    /* sin Vite */
  }
  if (!arriba) console.log('  (sin Vite: se salta la parte de la pantalla)')
  else {
    const { abrirApp } = await import('./_enLaApp.mjs')
    const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
    const ev = async (js) => {
      try {
        return await a.evaluar(js)
      } catch (e) {
        throw new Error(`${e.message} :: ${js.slice(0, 200)}`)
      }
    }
    try {
      for (let i = 0; i < 80 && !(await ev("typeof window.__rutaPrueba === 'function' && Boolean(window.__ruta) && Boolean(window.__gastosFalsos)")); i++) await a.esp(500)
      await ev('window.__rutaPrueba().then(() => true)')
      await a.esp(1500)
      await ev("(() => { try { localStorage.setItem('trazo:logros:primerdia', 'si') } catch {} window.__ruta.setState({ screen: 'route', mode: 'days' }); return true })()")
      await a.esp(1000)
      for (let i = 0; i < 4; i++) {
        const hubo = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Empezar mi día)$/.test(x.textContent?.trim() ?? '')); if (!b) return false; b.click(); return true })()")
        if (!hubo) break
        await a.esp(700)
      }
      const FAL = 'window.__gastosFalsos'
      const texto = () => ev('document.body.innerText')
      const f = (n) => path.join(SALIDA, `10n2_${n}.jpg`)
      const clic = async (sel, contiene) => {
        const r = await ev(`(() => { const els = Array.from(document.querySelectorAll(${JSON.stringify(sel)})); const e = els.find((x) => !${JSON.stringify(contiene ?? '')} || x.textContent.includes(${JSON.stringify(contiene ?? '')})); if (!e) return false; e.click(); return true })()`)
        await a.esp(450)
        return r
      }
      const abrirPresupuesto = async () => {
        await ev("(() => { const b = Array.from(document.querySelectorAll('[data-cartera]')).find((x) => x.offsetParent !== null) ?? document.querySelector('[data-cartera]'); b?.click(); return true })()")
        await a.esp(900)
      }
      const cerrarPresupuesto = async () => {
        await ev("(() => { document.querySelector('[aria-labelledby=\"titulo-presupuesto\"] button[aria-label=\"Atrás\"]')?.click(); return true })()")
        await a.esp(500)
      }
      const nombreCampo = async (nombre, importe) => {
        await a.escribir('[data-gasto-nombre]', nombre)
        await a.escribir('[data-gasto-importe]', importe)
        await a.esp(300)
      }
      // El viaje del diseño: Eric pagó 240 €, Ana 135 €, Luis 135 € y Marta 90 € (600 € entre cuatro, a 150 €).
      await ev(`(async () => { ${FAL}.reiniciar(); window.__modoCuentas?.poner('cada_uno'); await ${FAL}.usar('eric', ['eric', 'ana', 'luis', 'marta']); const b = ${FAL}.bd; for (const [id, autor, n, a] of [['c1', 'eric', 'Cena día 1', 240], ['c2', 'ana', 'Entradas Coliseo', 135], ['c3', 'luis', 'Comida Trastevere', 135], ['c4', 'marta', 'Taxi', 90]]) b.gastos.push({ id, tripId: 'demo-viaje', autorId: autor, nombre: n, precio: { amount: a, currency: 'EUR' }, ambito: 'grupo', estado: 'aceptado', pagadoPor: [autor], entre: [], decididoPor: null, decididoEn: null, creadoEn: new Date().toISOString() }); await window.__gastos.getState().recargar(); return true })()`)
      await a.esp(500)

      // 01 · la tarjeta en el presupuesto
      await abrirPresupuesto()
      let t = await texto()
      debe(/Cuentas del grupo/.test(t) && /Marta le debe 60 € a Eric/.test(t), '01', 'pantalla: debajo de «Del grupo», la tarjeta «Cuentas del grupo» con «Marta le debe 60 € a Eric»')
      await a.captura(f('01_presupuesto_tarjeta'))

      // 02 y 03 · ¿Entre quién?
      await clic('[data-anadir-gasto]')
      await nombreCampo('Cena día 2', '120')
      t = await texto()
      await ev("(() => { document.querySelectorAll('[data-elegir-pastilla^=\"entre-\"]').forEach((p) => { if (p.dataset.elegida !== '1') p.click() }); return true })()")
      await a.esp(300)
      t = await texto()
      debe(/4 de 4/i.test(t), '02', '(10N7) pantalla: «¿Para quién es?» marcando a los 4: «4 de 4»')
      await ev("(() => { document.querySelector('[data-gasto-entre-quien]')?.scrollIntoView({ block: 'center' }); return true })()")
      await a.esp(300)
      await a.captura(f('02_entre_los_4'))
      await clic('[data-elegir-pastilla="entre-luis"]')
      t = await texto()
      debe(/3 de 4/.test(t) && /Para 3 personas/.test(t), '03', '(10N7) pantalla: desmarcas a Luis y sale «3 de 4» y «Para 3 personas»')
      await a.captura(f('03_entre_3_luis_desmarcado'))
      await clic('[data-elegir-pastilla="entre-luis"]')
      await clic('[data-gasto-enviar]')
      await a.esp(800)
      t = await texto()
      debe(/Cena día 2/.test(t) && /Marta le debe 60 € a Eric|Marta le debe 90 € a Eric|le debe/.test(t), '02', 'pantalla: el gasto entra y las cuentas se actualizan')
      // Se quita para volver al ejemplo exacto de Design.
      await ev(`(() => { const b = ${FAL}.bd; b.gastos = b.gastos.filter((g) => g.nombre !== 'Cena día 2'); return true })()`)
      await ev('window.__gastos.getState().recargar().then(() => true)')
      await a.esp(400)

      // 04 · la pantalla de las cuentas
      await clic('[data-tarjeta-cuentas]')
      await a.esp(500)
      t = await texto()
      debe(/4 PERSONAS/i.test(t) && /A PARTES IGUALES/i.test(t) && /Total del grupo\s*600 €/.test(t) && /150 € por persona/.test(t), '04', 'pantalla: «4 personas · a partes iguales», «Total del grupo 600 €» y «150 € por persona»')
      debe(/Ha pagado 240 € · Le toca 150 €/.test(t) && /\+90 €/.test(t) && /−15 €/.test(t) && /−60 €/.test(t), '04', 'pantalla: Eric +90 €, Ana −15 €, Luis −15 €, Marta −60 €')
      debe(/Marta le debe 60 € a Eric/.test(t) && /Luis le debe 15 € a Eric/.test(t) && /Ana le debe 15 € a Eric/.test(t), '04', 'pantalla: «Para quedar en paz» con los tres pagos')
      await a.captura(f('04_cuentas_del_grupo'))

      // 05 · [Ya está pagado]
      await ev("(() => { const l = Array.from(document.querySelectorAll('[data-pago-linea=\"pendiente\"]')).find((x) => x.textContent.includes('Ana le debe')); l.querySelector('[data-ya-pagado]').click(); return true })()")
      await a.esp(700)
      t = await texto()
      debe(/Ana le debía 15 € a Eric/.test(t) && /Pagado/.test(t) && /\+75 €/.test(t) && /Ha pagado 150 € · Le toca 150 €/.test(t), '05', 'pantalla: la línea de Ana en verde con «✓ Pagado», Eric +75 € y Ana a 0 €')
      await a.captura(f('05_ana_ya_ha_pagado'))
      const aMarta = await ev(`${FAL}.bd.avisos.filter((x) => x.tipo === 'pago_marcado').length`)
      debe(aMarta === 1, '05', 'pantalla: al otro (Ana) le llega su aviso')
      // Deshacer.
      await clic('[data-pago-deshacer]')
      await a.esp(500)
      t = await texto()
      debe(/Ana le debe 15 € a Eric/.test(t) && !/Pagado/.test(t.replace(/Ya está pagado/g, '')), '05', 'pantalla: [Deshacer] devuelve la línea a pendiente')
      await ev(`(async () => { ${FAL}.bd.avisos = []; return true })()`)

      // En directo: otra persona marca un pago mientras sigo mirando la pantalla (como si llegara por Realtime).
      await ev(`(async () => { const b = ${FAL}; const antes = b.bd.yo; b.bd.yo = 'luis'; await b.backend.marcarPago({ tripId: 'demo-viaje', deudorId: 'luis', acreedorId: 'eric', importe: { amount: 15, currency: 'EUR' } }); b.bd.yo = antes; await window.__gastos.getState().recargar(); return true })()`)
      await a.esp(600)
      t = await texto()
      debe(/Luis le debía 15 € a Eric/.test(t) && /Pagado/.test(t), 'directo', 'pantalla: en directo, lo que marca otra persona (Luis) le cambia al resto sin recargar')

      // 06 · todos en paz
      await clic('[data-ya-pagado]')
      await clic('[data-ya-pagado]')
      await a.esp(700)
      t = await texto()
      debe(/Estáis en paz/.test(t) && (t.match(/0 € ✓/g) ?? []).length === 4, '06', 'pantalla: todos a «0 € ✓» y la tarjeta verde «Estáis en paz»')
      await a.captura(f('06_todos_en_paz'))
      await ev("(() => { document.querySelector('[data-pantalla-cuentas] button[aria-label=\"Atrás\"]')?.click(); return true })()")
      await a.esp(500)
      t = await texto()
      debe(/Estáis en paz/.test(t), '06', 'pantalla: la tarjeta del presupuesto también dice «Estáis en paz»')
      await a.captura(f('07_presupuesto_en_paz'))

      // El aviso en la campana de Ana.
      await cerrarPresupuesto()
      await ev(`(async () => { ${FAL}.bd.avisos = []; ${FAL}.bd.pagos = []; await ${FAL}.usar('eric'); await window.__gastos.getState().marcarPago({ deudorId: 'ana', acreedorId: 'eric', importe: { amount: 15, currency: 'EUR' } }); await ${FAL}.usar('ana'); window.__avisos.getState().abrir(); return true })()`)
      await a.esp(900)
      t = await texto()
      debe(/Eric ha marcado como pagados los 15 € que le debías\./.test(t), '05', 'pantalla: en la campana de Ana: «Eric ha marcado como pagados los 15 € que le debías.»')
      await a.captura(f('08_campana_de_ana'))
      await ev('(() => { window.__avisos.getState().cerrar(); return true })()')
      await a.esp(400)

      // Editar un gasto del grupo (quien lo añadió: Eric).
      await ev(`(async () => { ${FAL}.bd.pagos = []; ${FAL}.bd.avisos = []; await ${FAL}.usar('eric'); return true })()`)
      await abrirPresupuesto()
      await clic('[data-gasto-editable="1"]', 'Cena día 1')
      await a.esp(500)
      t = await texto()
      debe(/Editar gasto/.test(t) && /Guardar cambios/.test(t) && /4 de 4/i.test(t), '1', 'pantalla: tocar un gasto del grupo lo abre para editarlo (quién lo pagó, entre quién, el importe)')
      await a.captura(f('09_editar_gasto'))
      await clic('[data-elegir-pastilla="entre-marta"]')
      await a.escribir('[data-gasto-importe]', '300')
      await clic('[data-gasto-enviar]')
      await a.esp(800)
      const g = await ev(`${FAL}.bd.gastos.find((x) => x.id === 'c1')`)
      debe(g.precio.amount === 300 && g.entre.length === 3 && !g.entre.includes('marta'), '1', 'pantalla: guarda el nuevo importe (300 €) y «entre 3» (Marta fuera)')
      await cerrarPresupuesto()

      // Quien sale sigue en las cuentas.
      await ev(`(async () => { await ${FAL}.usar('eric', ['eric', 'ana', 'luis', 'marta']); await ${FAL}.salir('marta'); return true })()`)
      await abrirPresupuesto()
      await clic('[data-tarjeta-cuentas]')
      await a.esp(500)
      t = await texto()
      debe(/Marta/.test(t) && /Ya no está en el viaje/.test(t), '2', 'pantalla: Marta salió del viaje y sigue en las cuentas con su nombre')
      await a.captura(f('10_quien_sale_sigue'))
      await ev("(() => { document.querySelector('[data-pantalla-cuentas] button[aria-label=\"Atrás\"]')?.click(); return true })()")
      await cerrarPresupuesto()

      // Con cualquier permiso: Ana (solo recomienda) ve las cuentas y marca solo lo suyo.
      await ev(`(async () => { ${FAL}.reiniciar(); window.__modoCuentas?.poner('cada_uno'); await ${FAL}.usar('ana', ['eric', 'ana', 'luis', 'marta']); const b = ${FAL}.bd; for (const [id, autor, n, a] of [['c1', 'eric', 'Cena día 1', 240], ['c2', 'ana', 'Entradas Coliseo', 135], ['c3', 'luis', 'Comida Trastevere', 135], ['c4', 'marta', 'Taxi', 90]]) b.gastos.push({ id, tripId: 'demo-viaje', autorId: autor, nombre: n, precio: { amount: a, currency: 'EUR' }, ambito: 'grupo', estado: 'aceptado', pagadoPor: [autor], entre: [], decididoPor: null, decididoEn: null, creadoEn: new Date().toISOString() }); await window.__gastos.getState().recargar(); return true })()`)
      await abrirPresupuesto()
      await clic('[data-tarjeta-cuentas]')
      await a.esp(500)
      const botones = await ev("document.querySelectorAll('[data-ya-pagado]').length")
      t = await texto()
      debe(/Total del grupo\s*600 €/.test(t) && botones === 1, '05', 'pantalla: Ana (solo recomienda) ve todas las cuentas y solo puede marcar su propio pago')
      await a.captura(f('11_cuentas_vistas_por_ana'))
      await ev("(() => { document.querySelector('[data-pantalla-cuentas] button[aria-label=\"Atrás\"]')?.click(); return true })()")
      await cerrarPresupuesto()

      // Sin compartir: ni tarjeta ni pantalla.
      await ev("(() => { sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso'); window.__viaje.getState().poner({ gente: [] }); window.__gastos.getState().poner({ gastos: [], pagos: [] }); return true })()")
      await a.esp(500)
      await abrirPresupuesto()
      t = await texto()
      debe(!/Cuentas del grupo/.test(t) && (await ev("Boolean(document.querySelector('[data-tarjeta-cuentas]'))")) === false, 'sin-compartir', 'pantalla: sin gente, ni tarjeta ni pantalla de cuentas')
      await a.captura(f('12_sin_compartir'))
    } finally {
      a.cerrar()
    }
  }
}

for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
console.log(`\nPrueba 10N2: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
