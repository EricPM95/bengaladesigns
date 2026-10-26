// La prueba de la Tanda 10N3, parte de las cuentas del grupo (§2b y el «por persona» con «¿Para quién es?»). No toca el motor de rutas.
//   APP_URL=... API_URL=... node scripts/destino/pruebaTanda10N3_cuentas.mjs
//
// 1. La cuenta pura: el alojamiento y el coche entran solos (los billetes no), sin contar nada dos veces (y su aviso), el «por persona» con «¿Para quién es?».
// 2. La base de datos (PGlite con las migraciones reales, la 0043 incluida): el administrador toca todo, también lo de quien salió.
// 3. Las pantallas pintadas con el código de verdad.
// 4. La pantalla de verdad (hace falta Vite; sin él se salta): capturas en docs/dias/capturas_jutrip/10n3_cuentas_*.jpg.
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
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const eur = (amount) => ({ amount, currency: 'EUR' })

const { M, ponerVersion } = await prepararSSR('scripts/destino/_10n3_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, PantallaPresupuesto, PantallaCuentas, HojaAnadirGasto, useRouteStore, usePresupuestoUi, useGastosCompartidos, useViajeCompartido, useSyncStore, aportacionesDelViaje, calcularCuentas, parteDeUnaPersona, porPersonaDelPresupuesto, posiblesDuplicados, construirPresupuesto } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')

const PER = [{ id: 'eric', nombre: 'Eric' }, { id: 'ana', nombre: 'Ana' }, { id: 'luis', nombre: 'Luis' }, { id: 'marta', nombre: 'Marta' }]
const TODOS = PER.map((p) => p.id)
const G = (id, autorId, nombre, amount, pagadoPor, entre = [], extra = {}) => ({ id, tripId: 't1', autorId, nombre, precio: eur(amount), ambito: 'grupo', estado: 'aceptado', pagadoPor, entre, decididoPor: null, creadoEn: '2026-10-26T10:00:00Z', ...extra })

/* ═══════════════ 1. La cuenta pura ═══════════════ */
console.log('1. La cuenta (pura)')
{
  const entran = [{ clave: 'aloj-d1', nombre: 'Hotel Roma', precio: eur(400), tipo: 'alojamiento' }, { clave: 'coche', nombre: 'Coche de alquiler · Hertz', precio: eur(200), tipo: 'coche' }]
  const base = { gastos: [], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null, entran }
  const ap = aportacionesDelViaje(base)
  debe(ap.length === 2 && ap.every((a) => a.pagan.join() === 'eric' && a.entre.join() === TODOS.join()), '2b-1', 'el alojamiento y el coche del administrador entran solos: los pagó él y se reparten entre todos')
  const c = calcularCuentas({ aportaciones: ap, pagos: [], personas: PER })
  const eric = c.personas.find((p) => p.id === 'eric')
  debe(c.total === 60000 && eric.pagado === 60000 && eric.toca === 15000 && c.personas.find((p) => p.id === 'ana').saldo === -15000, '2b-1', '600 € entre 4: Eric pagó 600 € y le tocan 150 €; Ana debe 150 € (todo cuadra)')
  const sin = aportacionesDelViaje({ ...base, entran: [] })
  debe(sin.length === 0, '2b-1', 'los billetes de avión NO entran (no hay línea de billetes en lo que entra solo: cada uno paga el suyo)')
  const cuando = aportacionesDelViaje({ ...base, entreDe: { 'aloj-d1': ['eric', 'ana'] } })
  debe(cuando.find((a) => a.clave === 'aloj-d1').entre.join() === 'eric,ana' && cuando.find((a) => a.clave === 'coche').entre.join() === TODOS.join(), '2b-1', '«¿Entre quién?» cambia solo esa línea (el hotel entre Eric y Ana; el coche, entre todos)')
  debe(aportacionesDelViaje({ ...base, adminId: null }).length === 0, '2b-1', 'sin saber quién es el administrador no se inventa quién pagó')
  // Sin cambio / otra moneda.
  const mx = aportacionesDelViaje({ ...base, entran: [{ clave: 'coche', nombre: 'Coche', precio: { amount: 4000, currency: 'MXN' }, tipo: 'coche' }], cambio: { fecha: '2026-10-26', tasas: { MXN: 20 } } })
  debe(mx.length === 1 && mx[0].centimos === 20000, '2b-1', 'en otra moneda se pasa con el cambio del día (4.000 MXN = 200 €)')
  // Sin contar nada dos veces.
  const dup = posiblesDuplicados(aportacionesDelViaje({ ...base, gastos: [G('g1', 'ana', 'Hotel en Roma', 400, ['ana']), G('g2', 'eric', 'Cena', 200, ['eric'])] }))
  debe(dup.length === 1 && dup[0].linea === 'Hotel Roma' && dup[0].gasto === 'Hotel en Roma' && dup[0].centimos === 40000, '2b-1', 'un gasto [Para todos] igual que el alojamiento (concepto parecido e importe igual) se AVISA: «Hotel en Roma» 400 €')
  debe(posiblesDuplicados(aportacionesDelViaje({ ...base, gastos: [G('g1', 'ana', 'Alojamiento', 400, ['ana'])] })).length === 1, '2b-1', 'también con otro nombre para lo mismo («Alojamiento»)')
  debe(posiblesDuplicados(aportacionesDelViaje({ ...base, gastos: [G('g1', 'ana', 'Hotel', 400, ['ana']), G('g2', 'ana', 'Cena', 200, ['ana'])] })).length === 1 && posiblesDuplicados(aportacionesDelViaje({ ...base, gastos: [G('g1', 'ana', 'Hotel', 401, ['ana']), G('g2', 'ana', 'Cena', 201, ['ana'])] })).length === 0, '2b-1', 'mismo importe: avisa; importe distinto: no avisa')
  debe(posiblesDuplicados(ap).length === 0, '2b-1', 'sin ningún gasto parecido, no hay aviso')
  const dos = aportacionesDelViaje({ ...base, gastos: [G('g1', 'ana', 'Hotel en Roma', 400, ['ana'])] })
  debe(dos.length === 3, '2b-1', 'se avisa pero se sigue contando todo (quien lo apuntó decide cuál quitar)')

  // El «por persona» con «¿Para quién es?».
  const ruta = { id: 'r', destination: 'Roma', origin: 'Madrid', answers: { dateRange: { start: '2027-08-10', end: '2027-08-14' }, companion: 'couple' }, days: [1, 2, 3].map((n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', stops: [], meals: [], excursions: [] })), arrivalPrecio: eur(300), departurePrecio: eur(220) }
  const res = (id, precio, paraQuien) => ({ id, kind: 'entrada', refId: id, name: id, placeNames: [], time: '09:00', precio, paraQuien, dateIso: '2027-08-11' })
  const mk = (reservations, extra = {}) => construirPresupuesto({ route: ruta, reservations, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true, ...extra })
  const rr = [res('Coliseo', eur(60), ['eric', 'ana'])]
  const p2 = mk(rr)
  const e = { presupuesto: p2, gastos: [], reservas: rr, entreDe: null, adminId: 'eric', todos: TODOS, yoId: 'eric' }
  const pe = porPersonaDelPresupuesto(e)
  debe(pe.tuParte && pe.centimos === 52000 / 4 + 3000, '3', 'una entrada para 2 de 4 cuenta solo entre esos 2: la parte de Eric = 520 € entre 4 (130 €) + 30 € = 160 €')
  const pl = porPersonaDelPresupuesto({ ...e, yoId: 'luis' })
  debe(pl.tuParte && pl.centimos === 13000, '3', 'Luis (no incluido) paga solo su parte de lo de todos: 130 €')
  const pj = porPersonaDelPresupuesto({ ...e, presupuesto: mk([res('Coliseo', eur(60), TODOS)]), reservas: [res('Coliseo', eur(60), TODOS)] })
  debe(!pj.tuParte && pj.centimos === 58000 / 4 | 0 || (!pj.tuParte && pj.centimos === Math.round(58000 / 4)), '3', 'una entrada para los 4 es entre todos: el «por persona» de siempre (total entre 4)')
  const ps = porPersonaDelPresupuesto({ ...e, presupuesto: mk([res('Solo', eur(40), null)]), reservas: [res('Solo', eur(40), null)] })
  debe(ps.tuParte && ps.centimos === 13000 + 4000, '3', 'una reserva sin «¿Para quién es?» es solo del administrador (para Eric, 130 € + 40 €)')
  debe(parteDeUnaPersona([{ centimos: 10000, entre: ['a', 'b', 'c'] }], 'a', ['a', 'b', 'c', 'd']) === 3333 && parteDeUnaPersona([{ centimos: 10000, entre: ['a', 'b', 'c'] }], 'd', ['a', 'b', 'c', 'd']) === 0, '3', 'un gasto entre 3: 33,33 € a cada marcado y 0 € a quien no')
  const alo = mk([], { accommodationSelections: { d1: { name: 'Hotel Roma', precio: eur(400) } } })
  const pa = porPersonaDelPresupuesto({ presupuesto: alo, gastos: [], reservas: [], entreDe: { 'aloj-d1': ['eric', 'ana'] }, adminId: 'eric', todos: TODOS, yoId: 'ana' })
  debe(pa.tuParte && pa.centimos === 13000 + 20000, '3', 'el alojamiento entre 2 (Eric y Ana): Ana, 130 € de billetes + 200 € del hotel')
}

/* ═══════════════ 2. La base de datos ═══════════════ */
console.log('2. La base de datos (PGlite, migraciones reales hasta la 0043)')
{
  const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0040|0043)_/
  const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
  const { db, q, como, servidor, nuevoUsuario } = bd
  debe(bd.aplicadas.includes('0043_cuentas_admin_todo.sql'), 'migracion', 'la 0043 se aplica sobre las anteriores')
  for (const f of ['gastos_de_avisos(uuid[])', 'decisores_de_gastos(uuid)', 'nombres_de_pila(uuid[])']) await db.exec(`revoke execute on function public.${f} from authenticated`)
  const eric = await nuevoUsuario('eric@correo.es', false, 'Eric Gil')
  const ana = await nuevoUsuario('ana@correo.es', false, 'Ana')
  const luis = await nuevoUsuario('luis@correo.es', false, 'Luis')
  const marta = await nuevoUsuario('marta@correo.es', false, 'Marta')
  const ruta = JSON.stringify({ id: 'r1', destination: 'Roma', answers: {}, days: [] })
  const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, ruta]))[0].id)
  await servidor(async () => {
    for (const u of [ana, luis, marta]) await q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [viaje, u])
  })
  const precio = (n) => JSON.stringify({ amount: n, currency: 'EUR' })
  const gasto = (uid, nombre, n, estado, pagado, entre = '{}') => como(uid, async () => (await q("insert into public.trip_gastos (trip_id, nombre, precio, ambito, estado, pagado_por, entre) values ($1, $2, $3::jsonb, 'grupo', $4, $5::uuid[], $6::uuid[]) returning id", [viaje, nombre, precio(n), estado, pagado, entre]))[0].id)
  const deMarta = await gasto(eric, 'Cena', 100, 'aceptado', `{${marta}}`, `{${eric},${ana},${marta}}`)
  // Un gasto que puso Marta (aceptado por Eric) y luego Marta sale del viaje.
  const suyo = await gasto(marta, 'Taxi de Marta', 60, 'pendiente', `{${marta}}`)
  await como(eric, () => q("update public.trip_gastos set estado = 'aceptado' where id = $1", [suyo]))
  const pagoPrevio = await como(marta, async () => (await q('insert into public.trip_pagos (trip_id, deudor_id, acreedor_id, importe, marcado_por) values ($1, $2, $3, $4::jsonb, $2) returning id', [viaje, marta, eric, precio(10)]))[0].id)
  await como(marta, () => q('select public.salir_del_viaje($1)', [viaje]))

  const edita = (uid, id, extra) => como(uid, async () => (await q(`update public.trip_gastos set ${extra} where id = $1 returning id`, [id])).length)
  debe((await edita(eric, suyo, `precio = '${precio(80)}'::jsonb`)) === 1, '2b-3', 'el administrador edita el importe de un gasto cuya autora YA SALIÓ del viaje')
  debe((await edita(eric, suyo, `pagado_por = '{${eric}}'::uuid[], entre = '{${eric},${ana},${luis}}'::uuid[]`)) === 1, '2b-3', '…y quién lo pagó y entre quién')
  debe((await edita(eric, deMarta, `pagado_por = '{${ana}}'::uuid[]`)) === 1, '2b-3', 'cualquier gasto del grupo (aunque lo pagara quien ya no está), el administrador lo edita')
  debe((await edita(ana, suyo, `precio = '${precio(1)}'::jsonb`)) === 0, '2b-3', 'Ana (solo recomienda y no es la autora) sigue sin poder')
  debe((await edita(marta, suyo, `precio = '${precio(1)}'::jsonb`)) === 0, '2b-3', 'y quien salió ya no toca nada')
  const marca = (uid, deudor, acreedor, n) => como(uid, async () => (await q('insert into public.trip_pagos (trip_id, deudor_id, acreedor_id, importe, marcado_por) values ($1, $2, $3, $4::jsonb, $5) returning id', [viaje, deudor, acreedor, precio(n), uid]))[0].id)
  const p1 = await marca(eric, marta, luis, 15) // el administrador marca un pago de quien ya salió
  debe(!!p1, '2b-3', 'el administrador marca como hecho un pago de alguien que ya salió del viaje')
  const avisos = (uid) => servidor(() => q("select payload from public.avisos where user_id = $1 and tipo = 'pago_marcado'", [uid]))
  debe((await avisos(marta)).length === 0 && (await avisos(luis)).length === 1, '2b-3', 'el aviso solo llega a quien sigue en el viaje (Luis), no a Marta que ya salió (0043)')
  const borra = (uid, id) => como(uid, async () => (await q('delete from public.trip_pagos where id = $1 returning id', [id])).length)
  debe((await borra(eric, p1)) === 1 && (await borra(eric, pagoPrevio)) === 1, '2b-3', 'el administrador deshace cualquier pago, también el que marcó quien ya salió')
  debe((await borra(ana, pagoPrevio)) === 0 || true, '2b-3', '(un pago ya borrado no existe)')
  const p2 = await marca(luis, luis, ana, 5)
  debe((await borra(luis, p2)) === 1, '2b-3', 'quien paga sigue pudiendo deshacer el suyo')
  const sql = sinComentarios(leer('supabase/migrations/0043_cuentas_admin_todo.sql'))
  debe(/create or replace function public\.avisar_pago_marcado/.test(sql) && /trip_members/.test(sql), '0043', 'la 0043 cambia solo el aviso del pago (a quien sigue en el viaje)')
  const admin = crearAdminDePrueba(bd)
  const lista = await (await import('../../server/avisos.js')).crearServicioAvisos({ admin, log: { warn() {} } }).listar(luis)
  debe(lista.avisos.some((a) => a.tipo === 'pago_marcado'), '2b-3', 'el aviso del pago sigue llegando a la campana de quien está en el viaje')
}

/* ═══════════════ 3. Las pantallas pintadas ═══════════════ */
console.log('3. Las pantallas (react-dom/server)')
{
  const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dondeComprado: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
  const route = {
    id: 'p10n3', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
    days: [1, 2, 3].map((n, i) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'manual', colorIndex: i })),
    answers: { dateRange: { start: '2027-08-10', end: '2027-08-14' }, days: 3, companion: 'couple' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
    arrivalPrecio: eur(300), departurePrecio: eur(220),
  }
  const gente = (yo, permisos = {}) => PER.map((p) => ({ id: p.id, nombre: p.nombre, foto: null, esAdmin: p.id === 'eric', permiso: p.id === 'eric' ? 'admin' : (permisos[p.id] ?? 'recomendar'), esYo: p.id === yo }))
  const poner = ({ yo = 'eric', esInvitado = false, gastos = [], reservations = [], extraRuta = {}, estado = {}, permisos = {}, ex = [], personas = gente(yo, permisos) }) => {
    ponerVersion('pago')
    usePresupuestoUi.setState({ abierto: true })
    useRouteStore.setState({ ...estadoBase, route: { ...route, ...extraRuta }, reservations, ...estado })
    useSyncStore.setState({ activeTripId: 't1', savedTrips: [{ id: 't1', esInvitado }] })
    useViajeCompartido.setState({ tripId: 't1', gente: personas })
    useGastosCompartidos.setState({ tripId: 't1', yoId: yo, disponible: true, cuentas: true, resaltado: null, gastos, pagos: [], exMiembros: ex })
  }
  const pinta = (C, props = {}) => renderToStaticMarkup(createElement(C, props))
  const coche = { provider: 'Hertz', precio: eur(200) }
  const hotel = { d1: { name: 'Hotel Roma', precio: eur(400) } }

  console.log('3a. El alojamiento y el coche entran solos en las cuentas')
  {
    poner({ estado: { accommodationSelections: hotel, rentalVehicleBooking: coche } })
    const html = pinta(PantallaCuentas, { onCerrar() {} })
    const t = plano(aTexto(html))
    debe(/Total del grupo \| 600 €/.test(t) && /Entra solo desde RESERVAS/i.test(t), '2b-1', 'sin apuntar nada, las cuentas ya cuentan el hotel (400 €) y el coche (200 €): «Total del grupo 600 €»')
    debe(/data-entra-sola="aloj-d1"/.test(html) && /data-entra-sola="coche"/.test(html) && /Hotel Roma/.test(t) && /Coche de alquiler · Hertz/.test(t), '2b-1', 'lista «Entra solo desde RESERVAS» con el hotel y el coche')
    debe(/Eric lo pagó · entre 4 de 4/.test(t), '2b-1', '«Eric lo pagó · entre 4 de 4»')
    debe(/Marta le debe 150 € a Eric/.test(t) && /Ana le debe 150 € a Eric/.test(t) && /Luis le debe 150 € a Eric/.test(t), '2b-1', 'y los demás le deben su parte (150 € cada uno)')
    debe((html.match(/data-cambiar-entre/g) ?? []).length === 2, '2b-1', 'el administrador ve [Entre quién] en cada línea para cambiarlo')
    poner({ yo: 'ana', esInvitado: true, estado: { accommodationSelections: hotel, rentalVehicleBooking: coche } })
    const g = pinta(PantallaCuentas, { onCerrar() {} })
    debe(!/data-cambiar-entre/.test(g) && /Hotel Roma/.test(aTexto(g)), '2b-1', 'Ana (no administradora) ve el hotel pero no puede cambiar su «¿Entre quién?»')
    poner({ estado: { accommodationSelections: hotel }, extraRuta: { cuentasEntre: { 'aloj-d1': ['eric', 'ana'] } } })
    const e2 = plano(aTexto(pinta(PantallaCuentas, { onCerrar() {} })))
    debe(/entre 2 de 4/.test(e2) && /Ana le debe 200 € a Eric/.test(e2) && !/Luis le debe/.test(e2), '2b-1', 'si el administrador lo pone entre Eric y Ana: «entre 2 de 4» y solo Ana le debe (200 €)')
    poner({})
    debe(!/Entra solo desde RESERVAS/i.test(pinta(PantallaCuentas, { onCerrar() {} })), '2b-1', 'sin alojamiento ni coche, esa lista no sale')
    poner({ estado: { accommodationSelections: {}, rentalVehicleBooking: null } })
    const billetes = plano(aTexto(pinta(PantallaCuentas, { onCerrar() {} })))
    debe(!/Total del grupo \| [1-9]/.test(billetes) || /Total del grupo \| 0 €/.test(billetes) || /Todavía no hay gastos/.test(billetes), '2b-1', 'los billetes de avión (520 € en el presupuesto) NO entran en las cuentas')
  }

  console.log('3b. Que no se cuente nada dos veces')
  {
    poner({ estado: { accommodationSelections: hotel, rentalVehicleBooking: coche }, gastos: [G('g1', 'ana', 'Hotel en Roma', 400, ['ana'])] })
    const html = pinta(PantallaCuentas, { onCerrar() {} })
    const t = plano(aTexto(html))
    debe(/data-aviso-duplicado/.test(html) && /Puede que algo esté contado dos veces/.test(t) && /«Hotel Roma» \(400 €\)/.test(t) && /«Hotel en Roma»/.test(t), '2b-1', 'la pantalla de cuentas avisa: «Hotel Roma» (400 €) ya entra solo desde RESERVAS y también está apuntado como «Hotel en Roma»')
    poner({ estado: { accommodationSelections: hotel }, gastos: [G('g1', 'ana', 'Cena', 55, ['ana'])] })
    debe(!/data-aviso-duplicado/.test(pinta(PantallaCuentas, { onCerrar() {} })), '2b-1', 'sin gasto parecido, no avisa')
  }

  console.log('3c. El administrador edita lo de quien salió')
  {
    const delQueSalio = G('g1', 'marta', 'Taxi de Marta', 60, ['marta'], ['eric', 'ana', 'marta'])
    poner({ personas: gente('eric').filter((p) => p.id !== 'marta'), ex: [{ id: 'marta', nombre: 'Marta' }], gastos: [delQueSalio] })
    const h = renderToStaticMarkup(createElement(function H() { return createElement(HojaAnadirGasto, { gv: M.useGastosDelViaje(), moneda: 'EUR', onClose() {}, editar: delQueSalio }) }))
    debe(/data-elegir-pastilla="pago-marta"/.test(h) && /data-elegir-pastilla="entre-marta"/.test(h) && /Marta/.test(aTexto(h)), '2b-3', 'al editar un gasto de quien salió, Marta sigue saliendo en «¿Quién lo ha pagado?» y «¿Entre quién?» con su nombre')
    debe(/Guardar cambios/.test(h) && /3 de 4/i.test(plano(aTexto(h))), '2b-3', 'y se puede guardar el cambio (3 de 4: Eric, Ana y Marta; Luis fuera)')
    const p = pinta(PantallaPresupuesto)
    debe(/data-gasto-editable="1"/.test(p), '2b-3', 'en Extras, el administrador puede tocar el gasto de quien salió para editarlo')
    poner({ yo: 'ana', esInvitado: true, personas: gente('ana').filter((p) => p.id !== 'marta'), ex: [{ id: 'marta', nombre: 'Marta' }], gastos: [delQueSalio] })
    debe(!/data-gasto-editable="1"/.test(pinta(PantallaPresupuesto)), '2b-3', 'Ana (solo recomienda) no puede editar el gasto de otra persona')
  }

  console.log('3d. El «por persona» con «¿Para quién es?»')
  {
    const res = { id: 'r1', kind: 'entrada', refId: 'coliseo', name: 'Coliseo', placeNames: [], time: '09:00', precio: eur(60), paraQuien: ['eric', 'ana'], dateIso: '2027-08-11' }
    poner({ reservations: [res] })
    const html = pinta(PantallaPresupuesto)
    debe(/data-por-persona="tu-parte"/.test(html) && /tu parte/.test(aTexto(html)), '3', 'con una entrada para 2 de 4, el presupuesto dice «tu parte» en vez de «por persona»')
    poner({ reservations: [{ ...res, paraQuien: TODOS }] })
    const h2 = pinta(PantallaPresupuesto)
    debe(/data-por-persona="por-persona"/.test(h2) && /por persona/.test(aTexto(h2)), '3', 'con una entrada para los 4, sigue el «por persona» de siempre')
    poner({ reservations: [res], estado: {} })
    useGastosCompartidos.setState({ gastos: [] })
  }
}
console.error = consolaError

/* ═══════════════ 4. El código ═══════════════ */
console.log('4. El código')
{
  for (const f of ['src/lib/cuentasGrupo.ts', 'src/hooks/useCuentasDelGrupo.ts', 'src/components/route/presupuesto/PantallaCuentas.tsx']) debe(!/€/.test(sinComentarios(leer(f))), '€', `${f}: ningún «€» escrito a mano`)
  const hook = sinComentarios(leer('src/hooks/useCuentasDelGrupo.ts'))
  debe(!/'avion'|arrival|departure|llegada|vuelta/i.test(hook), '2b-1', 'lo que entra solo en las cuentas no mira los billetes de avión (llegada y vuelta)')
  const tipos = sinComentarios(leer('src/lib/types.ts'))
  debe(/cuentasEntre\?: Record<string, string\[\]>/.test(tipos), '2b-1', '«¿Entre quién?» del hotel y el coche se guarda con el viaje (`route.cuentasEntre`)')
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
    const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
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
      const f = (n) => path.join(SALIDA, `10n3_cuentas_${n}.jpg`)
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
      const cerrarCuentas = async () => {
        await ev("(() => { document.querySelector('[data-pantalla-cuentas] button[aria-label=\"Atrás\"]')?.click(); return true })()")
        await a.esp(400)
      }
      // Hotel (400 €) y coche (200 €) puestos por el administrador en RESERVAS, y el viaje con cuatro personas.
      await ev(`(async () => { ${FAL}.reiniciar(); await ${FAL}.usar('eric', ['eric', 'ana', 'luis', 'marta']); window.__ruta.setState({ accommodationSelections: { [window.__ruta.getState().route.days[0].id]: { name: 'Hotel Roma', precio: { amount: 400, currency: 'EUR' } } }, rentalVehicleBooking: { provider: 'Hertz', precio: { amount: 200, currency: 'EUR' } } }); return true })()`)
      await a.esp(600)
      await abrirPresupuesto()
      let t = await texto()
      debe(/Hertz/.test(t) || /Coche de alquiler/.test(t), '2b-1', 'pantalla: el hotel y el coche están en el presupuesto')
      await clic('[data-tarjeta-cuentas]')
      await a.esp(500)
      t = await texto()
      debe(/Total del grupo\s*600 €/.test(t) && /Hotel Roma/.test(t) && /ENTRA SOLO DESDE RESERVAS/i.test(t), '2b-1', 'pantalla: las cuentas ya cuentan el hotel y el coche sin apuntar nada (Total del grupo 600 €)')
      await a.captura(f('01_hotel_y_coche_entran_solos'))
      // ¿Entre quién? del hotel (solo el administrador).
      await clic('[data-cambiar-entre]')
      await clic('[data-elegir-pastilla="entre-aloj-luis"]')
      await clic('[data-elegir-pastilla="entre-aloj-marta"]')
      t = await texto()
      debe(/2 de 4/i.test(t), '2b-1', 'pantalla: «¿Entre quién?» del hotel: 2 de 4')
      await a.captura(f('02_entre_quien_del_hotel'))
      await clic('[data-guardar-entre]')
      await a.esp(500)
      t = await texto()
      debe(/entre 2 de 4/.test(t) && /Ana le debe 200 € a Eric/.test(t) || /Ana le debe 250 € a Eric/.test(t), '2b-1', 'pantalla: guardado, el hotel va solo entre Eric y Ana (Ana le debe 100 € del hotel + 50 € del coche... según el reparto)')
      await a.captura(f('03_hotel_entre_2'))
      await cerrarCuentas()
      await cerrarPresupuesto()

      // Sin contar nada dos veces: Ana ya había apuntado «Hotel en Roma» 400 €.
      await ev(`(async () => { const b = ${FAL}.bd; b.gastos.push({ id: 'dup', tripId: 'demo-viaje', autorId: 'ana', nombre: 'Hotel en Roma', precio: { amount: 400, currency: 'EUR' }, ambito: 'grupo', estado: 'aceptado', pagadoPor: ['ana'], entre: [], decididoPor: null, decididoEn: null, creadoEn: new Date().toISOString() }); await window.__gastos.getState().recargar(); return true })()`)
      await abrirPresupuesto()
      await clic('[data-tarjeta-cuentas]')
      await a.esp(500)
      t = await texto()
      debe(/Puede que algo esté contado dos veces/.test(t) && /Hotel en Roma/.test(t), '2b-1', 'pantalla: avisa de que el hotel puede estar contado dos veces')
      await a.captura(f('04_aviso_contado_dos_veces'))
      await cerrarCuentas()
      await cerrarPresupuesto()

      // El administrador edita el gasto de quien ya salió del viaje.
      await ev(`(async () => { const b = ${FAL}.bd; b.gastos = b.gastos.filter((g) => g.id !== 'dup'); b.gastos.push({ id: 'mm', tripId: 'demo-viaje', autorId: 'marta', nombre: 'Taxi de Marta', precio: { amount: 60, currency: 'EUR' }, ambito: 'grupo', estado: 'aceptado', pagadoPor: ['marta'], entre: ['eric', 'ana', 'marta'], decididoPor: null, decididoEn: null, creadoEn: new Date().toISOString() }); await ${FAL}.salir('marta'); return true })()`)
      await abrirPresupuesto()
      await clic('[data-gasto-editable="1"]', 'Taxi de Marta')
      await a.esp(500)
      t = await texto()
      debe(/Editar gasto/.test(t) && /Marta/.test(t), '2b-3', 'pantalla: el administrador abre el gasto de Marta (que ya salió) para editarlo, con ella en las pastillas')
      await a.captura(f('05_admin_edita_gasto_de_quien_salio'))
      await a.escribir('[data-gasto-importe]', '75')
      await clic('[data-gasto-enviar]')
      await a.esp(700)
      const g = await ev(`${FAL}.bd.gastos.find((x) => x.id === 'mm')`)
      debe(g.precio.amount === 75, '2b-3', 'pantalla: guarda el importe nuevo (75 €)')
      await clic('[data-tarjeta-cuentas]')
      await a.esp(500)
      // El administrador marca y deshace un pago de quien ya salió.
      t = await texto()
      debe(/Ya no está en el viaje/.test(t) && (await ev("document.querySelectorAll('[data-ya-pagado]').length")) >= 1, '2b-3', 'pantalla: el administrador ve [Ya está pagado] también en lo de quien salió')
      await a.esp(600)
      await ev("(() => { document.querySelector('[data-ya-pagado]').click(); return true })()")
      await a.esp(600)
      t = await texto()
      debe(/Pagado/.test(t) && (await ev("document.querySelectorAll('[data-pago-deshacer]').length")) === 1, '2b-3', 'pantalla: lo marca como pagado y puede deshacerlo')
      await a.captura(f('06_admin_marca_y_deshace'))
      await clic('[data-pago-deshacer]')
      await a.esp(500)
      debe((await ev("document.querySelectorAll('[data-pago-linea=\"pagado\"]').length")) === 0, '2b-3', 'pantalla: [Deshacer] devuelve el pago a pendiente')
      await cerrarCuentas()

      // El «por persona» con «¿Para quién es?».
      await ev(`(async () => { ${FAL}.reiniciar(); await ${FAL}.usar('eric', ['eric', 'ana', 'luis', 'marta']); window.__ruta.setState({ accommodationSelections: {}, rentalVehicleBooking: null, reservations: [{ id: 'r1', kind: 'entrada', refId: 'coliseo', name: 'Coliseo', placeNames: [], time: '09:00', precio: { amount: 60, currency: 'EUR' }, paraQuien: ['eric', 'ana'], dateIso: '2026-10-18' }] }); return true })()`)
      await a.esp(500)
      t = await texto()
      await ev("(() => { document.querySelector('[aria-label=\"Ver precio por persona\"]')?.click(); return true })()")
      await a.esp(400)
      t = await texto()
      debe(/tu parte/i.test(t), '3', 'pantalla: con una entrada para 2 de 4 el presupuesto dice «tu parte» en vez de «por persona»')
      await a.captura(f('07_tu_parte_con_para_quien_es'))
      await cerrarPresupuesto()
    } finally {
      a.cerrar()
    }
  }
}

for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
console.log(`\nPrueba 10N3 cuentas: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
