// La prueba de la Tanda 10N, parte D2: el presupuesto de un viaje compartido (apartado 9; diseño `Piezas/Presupuesto Compartido`, pantallas 01 a 10). No toca el motor de rutas.
//   node scripts/destino/pruebaTanda10N_presupuesto.mjs
//
// 1. La base de datos (PGlite con las migraciones reales, la 0037 incluida): quién ve qué, quién decide, [Para mí] privado, avisos a quien decide y a quien lo añadió, «vale lo que decida el primero».
// 2. El código (esbuild + Node): la cuenta del grupo (el «por persona» solo de lo del grupo), los textos de los avisos, la pantalla pintada, «334 €», Extras en azul y con la cartera, sin compartir como siempre.
// 3. La pantalla de verdad (hace falta Vite y el servidor; sin ellos se salta): las diez pantallas con un servidor de mentira en memoria, capturas a tamaño de móvil en docs/dias/capturas_jutrip/10n_presupuesto_*.jpg.
// Lo que SOLO se puede probar contra Supabase de verdad (Realtime por la red, el aviso al móvil) queda dicho al final.
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

/* ═══════════════ 1. La base de datos ═══════════════ */
console.log('1. La base de datos (PGlite, migraciones reales hasta la 0037)')
const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037)_/
const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
const { db, q, como, servidor, nuevoUsuario } = bd
debe(bd.aplicadas.includes('0037_presupuesto_compartido.sql'), 'migracion', 'la 0037 se aplica sobre las anteriores')
// (El harness da permiso a todo después de las migraciones; las funciones que la 0037 reserva al servidor se quitan otra vez, como en Supabase.)
for (const f of ['gastos_de_avisos(uuid[])', 'decisores_de_gastos(uuid)', 'nombres_de_pila(uuid[])']) await db.exec(`revoke execute on function public.${f} from authenticated`)

const sql = sinComentarios(leer('supabase/migrations/0037_presupuesto_compartido.sql'))
debe(!/avisos_tipo_check/.test(sql), '0037', 'la 0037 NO toca la lista de tipos de aviso (la deja la 0035)')
debe(/trip_gastos[\s\S]*row level security|enable row level security/.test(sql) && /'trip_gastos', 'autor_id'/.test(sql), '0037', 'la tabla lleva sus reglas de seguridad y «empezar de cero» también la borra')

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

const gasto = (uid, nombre, importe, ambito, estado, pagado) =>
  como(uid, async () => (await q('insert into public.trip_gastos (trip_id, nombre, precio, ambito, estado, pagado_por) values ($1, $2, $3::jsonb, $4, $5, $6::uuid[]) returning id', [viaje, nombre, JSON.stringify(eur(importe)), ambito, estado, pagado]))[0].id)
const veo = (uid) => como(uid, async () => (await q('select id, nombre, ambito, estado from public.trip_gastos where trip_id = $1 order by created_at, id', [viaje])).map((g) => `${g.nombre}:${g.estado}`))
const avisos = (uid, tipo) => servidor(() => q('select payload, leido_en from public.avisos where user_id = $1 and tipo = $2 order by creado_en', [uid, tipo]))
const decidir = (uid, id, estado) => como(uid, async () => (await q('update public.trip_gastos set estado = $2 where id = $1 and estado = $3 returning id', [id, estado, 'pendiente'])).length)

console.log('1a. 03 · Ana añade [Para todos]: espera, y le llega a quien decide')
const cena = await gasto(ana, 'Cena día 1', 30, 'grupo', 'pendiente', `{${ana}}`)
{
  debe((await lanza(() => gasto(ana, 'Truco', 5, 'grupo', 'aceptado', `{${ana}}`))) !== null, '4a', 'quien solo recomienda NO puede meter un gasto del grupo ya aceptado (la base de datos lo impide)')
  debe((await lanza(() => gasto(pepe, 'Ajeno', 5, 'grupo', 'pendiente', `{${pepe}}`))) !== null, 'seguridad', 'quien no está en el viaje no puede apuntar gastos')
  debe((await lanza(() => como(ana, () => q("insert into public.trip_gastos (trip_id, autor_id, nombre, precio, ambito, estado) values ($1, $2, 'Suplantado', '{\"amount\":5,\"currency\":\"EUR\"}', 'grupo', 'pendiente')", [viaje, eric])))) !== null, 'seguridad', 'nadie puede apuntar un gasto a nombre de otra persona')
  debe((await lanza(() => gasto(ana, 'Raro', -3, 'grupo', 'pendiente', `{${ana}}`))) !== null && (await lanza(() => gasto(ana, '   ', 3, 'grupo', 'pendiente', `{${ana}}`))) !== null, 'seguridad', 'un importe negativo o un nombre vacío no entran')
  const g = (await servidor(() => q('select pagado_por, estado, ambito from public.trip_gastos where id = $1', [cena])))[0]
  debe(g.estado === 'pendiente' && g.ambito === 'grupo' && g.pagado_por.length === 1 && g.pagado_por[0] === ana, '03', '«¿Quién lo ha pagado?» se guarda (Ana) y el gasto queda pendiente')
  const aEric = await avisos(eric, 'gasto_pendiente')
  debe(aEric.length === 1 && aEric[0].payload.autor === 'Ana' && aEric[0].payload.nombre === 'Cena día 1' && aEric[0].payload.precio.amount === 30 && aEric[0].payload.pago === 'Ana' && aEric[0].leido_en === null, '06', 'a Eric le llega «Ana quiere añadir al presupuesto» con el gasto dentro (Cena día 1 · pagó Ana · 30 €)')
  debe((await avisos(luis, 'gasto_pendiente')).length === 1, '4a', 'a Luis (puede editar) le llega el mismo aviso')
  debe((await avisos(ana, 'gasto_pendiente')).length === 0 && (await avisos(marta, 'gasto_pendiente')).length === 0, '4a', 'a Ana (la autora) y a Marta (solo recomienda) no les llega')
  debe((await veo(ana)).join() === 'Cena día 1:pendiente', '01', 'Ana ve su gasto pendiente')
  debe((await veo(eric)).join() === 'Cena día 1:pendiente' && (await veo(luis)).join() === 'Cena día 1:pendiente', '06', 'Eric y Luis (quienes deciden) lo ven pendiente')
  debe((await veo(marta)).length === 0 && (await veo(pepe)).length === 0, '03', 'Marta (otra invitada) y quien no está en el viaje no ven un gasto pendiente de otra persona')
}

console.log('1b. 07 y 09 · Eric acepta: suma al grupo, aviso a Ana, y vale lo que decide el primero')
{
  debe((await decidir(marta, cena, 'aceptado')) === 0, '4a', 'Marta (solo recomienda) no puede aceptar el gasto de Ana')
  debe((await decidir(ana, cena, 'aceptado')) === 0, '4a', 'Ana tampoco puede aceptar su propio gasto')
  debe((await decidir(eric, cena, 'aceptado')) === 1, '07', 'Eric acepta')
  debe((await decidir(luis, cena, 'rechazado')) === 0, '4a', 'si Luis llega después, ya está decidido: vale lo que decidió el primero (no cambia nada)')
  const fila = (await servidor(() => q('select estado, decidido_por from public.trip_gastos where id = $1', [cena])))[0]
  debe(fila.estado === 'aceptado' && fila.decidido_por === eric, '07', 'queda aceptado, decidido por Eric')
  const aAna = await avisos(ana, 'gasto_resuelto')
  debe(aAna.length === 1 && aAna[0].payload.resultado === 'aceptado' && aAna[0].payload.admin === 'Eric' && aAna[0].payload.nombre === 'Cena día 1' && aAna[0].payload.precio.amount === 30, '09', 'a Ana le llega SIEMPRE su aviso en la campana: «Eric ha aceptado tu gasto · Cena día 1 · 30 €»')
  debe((await avisos(eric, 'gasto_pendiente')).every((a) => a.leido_en) && (await avisos(luis, 'gasto_pendiente')).every((a) => a.leido_en), '07', 'el aviso de quien decidía queda leído para los dos (ya está decidido) y se queda en la lista')
  debe((await veo(marta)).join() === 'Cena día 1:aceptado', '09', 'ahora lo ven todos los del viaje (Marta también): suma al grupo')
  debe((await veo(pepe)).length === 0, 'seguridad', 'quien no está en el viaje sigue sin ver nada')
  const rpc = await servidor(() => q('select public.gastos_de_avisos($1::uuid[]) as r', [`{${cena}}`]))
  debe(rpc[0].r[0].estado === 'aceptado', 'avisos', 'el servidor sabe cómo está hoy el gasto de cada aviso (para la lista de la campana)')
  debe((await lanza(() => como(ana, () => q('select public.gastos_de_avisos($1::uuid[])', [`{${cena}}`])))) !== null, 'seguridad', 'esa función no la puede llamar el móvil')
}

console.log('1c. 08 y 10 · Luis (puede editar) rechaza: se le queda a Ana como suyo')
{
  const taxi = await gasto(ana, 'Taxi', 20, 'grupo', 'pendiente', `{${ana},${marta}}`)
  debe((await decidir(luis, taxi, 'rechazado')) === 1, '4a', 'quien puede editar también decide')
  const aAna = (await avisos(ana, 'gasto_resuelto')).find((a) => a.payload.gasto_id === taxi)
  debe(aAna && aAna.payload.resultado === 'rechazado' && aAna.payload.admin === 'Luis', '10', 'a Ana le llega «Luis ha preferido no sumar tu gasto» (SIEMPRE en su campana)')
  debe((await veo(ana)).includes('Taxi:rechazado'), '10', 'Ana sigue viendo su gasto: se le queda como suyo (rechazado = solo para ella)')
  debe(!(await veo(eric)).includes('Taxi:rechazado') && !(await veo(marta)).includes('Taxi:rechazado'), '10', 'los demás ya no lo ven: no suma al grupo')
  const g = (await servidor(() => q('select pagado_por from public.trip_gastos where id = $1', [taxi])))[0]
  debe(g.pagado_por.length === 2, '03', '«¿Quién lo ha pagado?» admite a más de una persona')
}

console.log('1d. 04 · [Para mí]: solo lo ve quien lo añade, no pasa por nadie')
{
  const antes = (await servidor(() => q('select count(*)::int as n from public.avisos'))) [0].n
  await gasto(ana, 'Souvenirs', 25, 'mio', 'aceptado', '{}')
  debe((await servidor(() => q('select count(*)::int as n from public.avisos')))[0].n === antes, '04', 'un [Para mí] no avisa a nadie (no pasa por el dueño)')
  debe((await veo(ana)).includes('Souvenirs:aceptado'), '04', 'Ana ve sus Souvenirs')
  for (const [quien, uid] of [['Eric', eric], ['Luis', luis], ['Marta', marta]]) debe(!(await veo(uid)).includes('Souvenirs:aceptado'), '04', `${quien} no ve el [Para mí] de Ana`)
  await gasto(eric, 'Regalo para casa', 40, 'mio', 'aceptado', '{}')
  debe((await veo(eric)).includes('Regalo para casa:aceptado') && !(await veo(ana)).includes('Regalo para casa:aceptado'), '02', 'Eric también tiene [Para mí] y Ana no lo ve')
  debe((await lanza(() => gasto(ana, 'Mío pendiente', 5, 'mio', 'pendiente', '{}'))) !== null, '04', 'un [Para mí] no puede nacer pendiente')
  debe((await lanza(() => gasto(ana, 'Mío con pagador', 5, 'mio', 'aceptado', `{${ana}}`))) !== null, '04', 'un [Para mí] no lleva «¿Quién lo ha pagado?»')
  const mio = (await servidor(() => q("select id from public.trip_gastos where nombre = 'Souvenirs'")))[0].id
  debe((await decidir(eric, mio, 'aceptado')) === 0, '04', 'ni el dueño puede «aceptar» el [Para mí] de otra persona: ni lo ve')
}

console.log('1e. 05 · Los que deciden añaden directo')
{
  await gasto(eric, 'Cena día 2', 42, 'grupo', 'aceptado', `{${eric}}`)
  await gasto(luis, 'Propinas', 10, 'grupo', 'aceptado', `{${luis}}`)
  debe((await veo(marta)).includes('Cena día 2:aceptado') && (await veo(marta)).includes('Propinas:aceptado'), '05', 'el gasto [Para todos] del administrador y el de quien puede editar entran directos y los ve el grupo')
  const nuevos = await servidor(() => q("select count(*)::int as n from public.avisos where tipo = 'gasto_pendiente' and payload ->> 'nombre' in ('Cena día 2', 'Propinas')"))
  debe(nuevos[0].n === 0, '05', 'y sin pasar por nadie: no se crea ningún aviso')
}

console.log('1f. Lo demás de las reglas')
{
  const g1 = (await servidor(() => q("select id from public.trip_gastos where nombre = 'Cena día 2'")))[0].id
  const pend = await gasto(ana, 'Pendiente raro', 9, 'grupo', 'pendiente', `{${ana}}`)
  const cambio = await lanza(() => como(eric, () => q("update public.trip_gastos set precio = '{\"amount\":1,\"currency\":\"EUR\"}', estado = 'aceptado' where id = $1", [pend])))
  debe(/solo puede aceptarse o rechazarse/.test(cambio ?? ''), 'regla', 'quien decide solo decide: no puede reescribir el precio ni el nombre de otra persona')
  debe((await decidir(eric, pend, 'aceptado')) === 1, 'regla', '…pero sí aceptarlo tal cual')
  debe((await como(ana, async () => (await q('delete from public.trip_gastos where id = $1 returning id', [g1])).length)) === 0, 'quitar', 'Ana no puede quitar el gasto de Eric')
  debe((await como(luis, async () => (await q('delete from public.trip_gastos where id = $1 returning id', [pend])).length)) === 1, 'quitar', 'Luis (puede editar) sí puede quitar un gasto del grupo')
  const sinP = await gasto(ana, 'Pendiente que retira', 4, 'grupo', 'pendiente', `{${ana}}`)
  debe((await como(ana, async () => (await q('delete from public.trip_gastos where id = $1 returning id', [sinP])).length)) === 1, 'quitar', 'Ana retira su propio gasto pendiente')
  const lista = await servidor(() => q("select payload from public.avisos where tipo = 'gasto_pendiente' and payload ->> 'nombre' = 'Pendiente que retira'"))
  debe(lista.length >= 1, 'avisos', 'su aviso sigue en la lista de quien decide (el servidor lo marca «Retirado»)')
}

console.log('1g. La lista de la campana que ve cada uno (el servicio real de avisos, con un cliente de mentira)')
{
  const avisosMod = await import('../../server/avisos.js')
  const admin = crearAdminDePrueba(bd)
  const servicio = avisosMod.crearServicioAvisos({ admin, log: { warn() {} } })
  const nueva = await gasto(ana, 'Museo', 15, 'grupo', 'pendiente', `{${ana}}`)
  const lEric = await servicio.listar(eric)
  const a = lEric.avisos.find((x) => x.tipo === 'gasto_pendiente' && x.payload.gasto_id === nueva)
  debe(a && a.texto === 'Ana quiere añadir al presupuesto' && a.etiqueta === null && a.payload.gasto_estado === 'pendiente' && a.quien === 'Ana', '06', 'la lista de Eric: «Ana quiere añadir al presupuesto», pendiente (con botones), con la inicial de Ana')
  debe(lEric.sin_leer >= 1, '06', 'y cuenta como sin leer')
  await decidir(eric, nueva, 'aceptado')
  const lEric2 = await servicio.listar(eric)
  const a2 = lEric2.avisos.find((x) => x.tipo === 'gasto_pendiente' && x.payload.gasto_id === nueva)
  debe(a2.etiqueta === 'Aceptado' && a2.payload.gasto_estado === 'aceptado', '07', 'después de aceptar, ese mismo aviso dice «Aceptado» y se queda en la lista')
  const lAna = await servicio.listar(ana)
  const r = lAna.avisos.find((x) => x.tipo === 'gasto_resuelto' && x.payload.gasto_id === nueva)
  debe(r && r.texto === 'Eric ha aceptado tu gasto' && r.detalle === 'Museo · 15 € · ya suma en el grupo', '09', 'la campana de Ana: «Eric ha aceptado tu gasto» con «Museo · 15 € · ya suma en el grupo»')
  const rech = await gasto(ana, 'Bolso', 80, 'grupo', 'pendiente', `{${ana}}`)
  await decidir(eric, rech, 'rechazado')
  const lAna2 = await servicio.listar(ana)
  const r2 = lAna2.avisos.find((x) => x.tipo === 'gasto_resuelto' && x.payload.gasto_id === rech)
  debe(r2 && r2.texto === 'Eric ha preferido no sumar tu gasto' && r2.detalle === 'Bolso · 80 € · se queda solo para ti', '10', 'la campana de Ana: «Eric ha preferido no sumar tu gasto» con «Bolso · 80 € · se queda solo para ti»')
  const lEric3 = await servicio.listar(eric)
  debe(lEric3.avisos.find((x) => x.tipo === 'gasto_pendiente' && x.payload.gasto_id === rech)?.etiqueta === 'Rechazado', '08', 'el de Eric dice «Rechazado»')
  // Sin la 0037 (la función de los gastos no existe): la lista de avisos no se rompe.
  const sinFuncion = { ...admin, rpc: async (n, a) => (n === 'gastos_de_avisos' ? { data: null, error: { message: 'no existe' } } : admin.rpc(n, a)) }
  const lSin = await avisosMod.crearServicioAvisos({ admin: sinFuncion, log: { warn() {} } }).listar(eric)
  debe(lSin.ok === true && lSin.avisos.some((x) => x.tipo === 'gasto_pendiente' && x.payload.gasto_estado === 'pendiente'), '0037', 'sin la 0037 la lista de avisos no se rompe: los gastos salen pendientes')
}

/* ═══════════════ 2. El código ═══════════════ */
console.log('2. El código (textos, cuenta del grupo y pantalla)')
{
  const t = await import('../../shared/avisos/textos.js')
  debe(t.textoDelAviso({ tipo: 'gasto_pendiente', payload: { autor: 'Ana' } }) === 'Ana quiere añadir al presupuesto', '06', 'texto: «Ana quiere añadir al presupuesto»')
  debe(t.textoDelAviso({ tipo: 'gasto_pendiente', payload: {} }) === 'Quieren añadir un gasto al presupuesto', '06', 'sin nombre no se inventa uno')
  debe(t.textoDelPush({ tipo: 'gasto_resuelto', payload: { resultado: 'rechazado', admin: 'Eric', nombre: 'Cena día 1', precio: eur(30) } }) === 'Eric ha preferido no sumar tu gasto. Cena día 1 · 30 € · se queda solo para ti', '10', 'el aviso del móvil dice lo mismo que la campana')
  const vocab = sinComentarios(leer('shared/avisos/textos.js'))
  debe(!/€/.test(vocab), '€', 'ningún «€» escrito a mano en los textos de los avisos (sale del formateador de la app)')
}


// ── La pantalla pintada con el código de verdad (react-dom/server) y los almacenes de verdad ──
{
  const { M, ponerVersion } = await prepararSSR('scripts/destino/_10n_presupuesto_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
  const { createElement, renderToStaticMarkup, PantallaPresupuesto, HojaAnadirGasto, ListaDeAvisos, useRouteStore, usePresupuestoUi, useGastosCompartidos, useViajeCompartido, useSyncStore, construirPresupuesto, gastosQueVeo, sumaAlGrupo, estadoInicial, vistaDeGasto, textoDeQuienPago, nombresEnFrase, ICONOS } = M
  const consolaError = console.error
  console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
  const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
  const plano = (t) => t.replace(/\n/g, ' | ')
  const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dondeComprado: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
  const route = {
    id: 'p10n', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
    days: [1, 2, 3].map((n, i) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'manual', colorIndex: i })),
    answers: { dateRange: { start: '2027-08-10', end: '2027-08-14' }, days: 3, companion: 'couple' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
    arrivalPrecio: eur(300), departurePrecio: eur(220),
  }
  const G = (id, autorId, nombre, amount, ambito, estado, pagadoPor) => ({ id, tripId: 't1', autorId, nombre, precio: eur(amount), ambito, estado, pagadoPor, decididoPor: estado === 'aceptado' || estado === 'rechazado' ? 'eric' : null, creadoEn: '2026-10-26T10:00:00Z' })
  const gastosDelDiseno = [
    G('g1', 'eric', 'Taxi al aeropuerto', 50, 'grupo', 'aceptado', ['eric']),
    G('g2', 'ana', 'Supermercado', 30, 'grupo', 'aceptado', ['ana']),
    G('g3', 'ana', 'Cena día 1', 30, 'grupo', 'pendiente', ['ana']),
    G('g4', 'ana', 'Souvenirs', 25, 'mio', 'aceptado', []),
    G('g5', 'eric', 'Regalo para casa', 40, 'mio', 'aceptado', []),
  ]
  const gente = (yo, permisoAna = 'recomendar') => [
    { id: 'eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin', esYo: yo === 'eric' },
    { id: 'ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: permisoAna, esYo: yo === 'ana' },
  ]
  const poner = ({ yo, esInvitado, personas = gente(yo), gastos = gastosDelDiseno, version = 'pago', disponible = true }) => {
    ponerVersion(version)
    usePresupuestoUi.setState({ abierto: true })
    useRouteStore.setState({ ...estadoBase, route })
    useSyncStore.setState({ activeTripId: 't1', savedTrips: [{ id: 't1', esInvitado }] })
    useViajeCompartido.setState({ tripId: 't1', gente: personas })
    useGastosCompartidos.setState({ tripId: 't1', yoId: yo, disponible, resaltado: null, gastos: gastos.filter((g) => g.autorId === yo || (g.ambito === 'grupo' && g.estado === 'aceptado') || (g.ambito === 'grupo' && g.estado === 'pendiente' && yo === 'eric')) })
  }
  const pinta = () => renderToStaticMarkup(createElement(PantallaPresupuesto))
  const bloqueExtras = (html) => html.slice(html.indexOf('data-extras-compartidos'))

  console.log('2a. La cuenta (pura): el grupo suma solo lo del grupo')
  {
    debe(gastosQueVeo(gastosDelDiseno, 'ana').map((g) => g.nombre).join() === 'Taxi al aeropuerto,Supermercado,Cena día 1,Souvenirs', '01', 'Ana ve lo del grupo y lo suyo (su pendiente y su [Para mí]), nunca el [Para mí] de Eric')
    debe(gastosQueVeo(gastosDelDiseno, 'eric').map((g) => g.nombre).join() === 'Taxi al aeropuerto,Supermercado,Regalo para casa', '02', 'Eric ve lo del grupo y lo suyo')
    debe(gastosDelDiseno.filter(sumaAlGrupo).reduce((a, g) => a + g.precio.amount, 0) === 80, '01', 'suman 80 €: solo lo aceptado del grupo')
    const rech = G('x', 'ana', 'x', 1, 'grupo', 'rechazado', ['ana'])
    debe(vistaDeGasto(rech) === 'rechazado' && !sumaAlGrupo(rech), '10', 'rechazado: se queda como suyo y no suma')
    debe(estadoInicial('grupo', false) === 'pendiente' && estadoInicial('grupo', true) === 'aceptado' && estadoInicial('mio', false) === 'aceptado', '4a', 'nace pendiente solo el [Para todos] de quien solo recomienda')
    debe(textoDeQuienPago(['Eric']) === 'Pagó Eric' && textoDeQuienPago(['Eric', 'Ana']) === 'Pagaron Eric y Ana' && nombresEnFrase(['Eric', 'Ana', 'Luis']) === 'Eric, Ana y Luis', '03', 'los textos de quién pagó y de la gente')
    const entrada = { route, reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true }
    const p = construirPresupuesto({ ...entrada, compartido: { gastos: gastosQueVeo(gastosDelDiseno, 'ana'), extrasDeLaRutaMios: false } })
    debe(p.total.amount === 600, '01', 'el total del grupo de Ana son 600 € (520 de billetes + 80 del grupo), sin sus 25 € de Souvenirs ni su pendiente')
    const sinC = construirPresupuesto({ ...entrada, route: { ...route, gastosExtras: [{ id: 'e1', nombre: 'Propina', precio: eur(5) }] } })
    debe(sinC.total.amount === 525 && sinC.bloques.find((b) => b.id === 'extras').lineas[0].compartido === undefined, 'sin-compartir', 'sin compartir: los Extras suman como siempre (525 €) y sin marcas de compartido')
  }

  console.log('2b. 01 · el presupuesto de Ana (invitada)')
  {
    poner({ yo: 'ana', esInvitado: true })
    const html = pinta()
    const t = plano(aTexto(html))
    debe(/de Eric/.test(t) && !/Eric y Ana/.test(t), '01', 'arriba, «de Eric»')
    debe(/Del grupo/.test(t) && !/Total del viaje/.test(t) && /600 €/.test(t), '01', '«Del grupo» y 600 €')
    debe(/€ •••/.test(t) && /por persona/.test(t), '01', 'el «por persona» con su ojo (escondido hasta que lo tocas)')
    debe(/Extras \| 80 €/.test(t), '01', 'Extras suma 80 € (sin su [Para mí] ni su pendiente)')
    debe(/Taxi al aeropuerto/.test(t) && /Pagó Eric · Para todos/.test(t) && /Pagó Ana · Para todos/.test(t), '01', 'cada gasto con «Pagó Eric · Para todos» / «Pagó Ana · Para todos»')
    debe(/Cena día 1 \| Pendiente de Eric/.test(t) && /data-gasto-vista="pendiente"/.test(html), '01', 'su gasto pendiente, en amarillo, con «Pendiente de Eric»')
    debe(/Souvenirs \| Solo para ti/.test(t) && /data-gasto-vista="mio"/.test(html), '01', 'su [Para mí] con «Solo para ti»')
    debe(!/Regalo para casa/.test(t), '01', 'no sale el [Para mí] de Eric')
    debe(/Añadir gasto/.test(t) && /data-anadir-gasto/.test(html), '01', '[+ Añadir gasto]')
    debe(!/Cambiar personas|Nombre del gasto/.test(t), '01', 'ni «Cambiar personas» ni el formulario viejo de Extras')
    debe(!/aria-label="Quitar Taxi/.test(html) && /aria-label="Quitar Souvenirs/.test(html) && /aria-label="Quitar Cena/.test(html), '01', 'solo puede quitar lo suyo (no el taxi de Eric)')
    const extras = bloqueExtras(html)
    const carteras = extras.split(`d="${ICONOS.presupuesto}"`).length - 1
    debe(carteras === 3, 'azul', `Extras lleva la cartera en el apartado y en cada gasto del grupo (3; salen ${carteras})`)
    debe(/oklch\(0\.55 0\.1 220 \/ \.14\)/.test(html) && /data-blk="extras"/.test(html), 'azul', 'el apartado de Extras, en nuestro azul')
    debe(!/€\s?\d/.test(aTexto(html)) && /\d+ €/.test(aTexto(html)), '€', 'los precios con el símbolo DETRÁS («50 €»), nunca «€50»')
  }

  console.log('2c. 02 · el presupuesto de Eric (dueño) y los permisos')
  {
    poner({ yo: 'eric', esInvitado: false })
    const html = pinta()
    const t = plano(aTexto(html))
    debe(/Eric y Ana/.test(t) && !/de Eric/.test(t), '02', 'arriba, «Eric y Ana»')
    debe(/Regalo para casa \| Solo para ti/.test(t) && !/Souvenirs/.test(t), '02', 'sus gastos «Solo para ti», sin los de Ana')
    debe(!/Cena día 1/.test(t) && /Del grupo/.test(t) && /600 €/.test(t) && /Extras \| 80 €/.test(t), '02', 'el pendiente de Ana no suma ni sale en su lista (le llega por la campana); el grupo, 600 €')
    debe(/aria-label="Quitar Taxi/.test(html) && /aria-label="Quitar Regalo/.test(html), '4a', 'el administrador puede quitar lo del grupo y lo suyo')
    poner({ yo: 'luis', esInvitado: true, personas: [...gente('luis'), { id: 'luis', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'editar', esYo: true }] })
    debe(/aria-label="Quitar Taxi/.test(pinta()), '4a', 'quien puede editar quita también lo del grupo')
  }

  console.log('2d. 03, 04 y 05 · la hoja de añadir gasto')
  {
    const hoja = (yo, esInvitado, personas = gente(yo)) => {
      poner({ yo, esInvitado, personas })
      const html = renderToStaticMarkup(createElement(function Hoja() { return createElement(HojaAnadirGasto, { gv: M.useGastosDelViaje(), moneda: 'EUR', onClose() {} }) }))
      return { html, t: plano(aTexto(html)) }
    }
    const marcada = (html, id) => new RegExp(`<button[^>]*data-elegir-pastilla="pago-${id}"[^>]*data-elegida="1"|<button[^>]*data-elegida="1"[^>]*data-elegir-pastilla="pago-${id}"`).test(html)
    const a = hoja('ana', true)
    debe(/Añadir gasto/.test(a.t) && /Para todos/.test(a.t) && /Para mí/.test(a.t) && /data-elegir="gasto-ambito"/.test(a.html), '03', 'la hoja: «Añadir gasto», [Para todos] [Para mí] con el estilo de elegir')
    debe(/Se lo enviamos a Eric/.test(a.t), '03', '«Se lo enviamos a Eric»')
    debe(/quién lo ha pagado/i.test(a.t) && /pago-eric/.test(a.html) && /pago-ana/.test(a.html), '03', '«¿Quién lo ha pagado?» con una pastilla por persona')
    debe(marcada(a.html, 'ana') && !marcada(a.html, 'eric'), '03', 'quien lo añade (Ana), ya marcada; Eric, no')
    debe(/Enviar a Eric/.test(a.t), '03', 'el botón dice [Enviar a Eric]')
    const e = hoja('eric', false)
    debe(/Entra directo en el presupuesto/.test(e.t) && !/Se lo enviamos|Enviar a/.test(e.t), '05', 'Eric: «Entra directo en el presupuesto» y el botón [Añadir gasto]')
    debe(/quién lo ha pagado/i.test(e.t) && marcada(e.html, 'eric') && /Para mí/.test(e.t), '05', 'con «¿Quién lo ha pagado?» (Eric marcado) y también tiene [Para mí]')
    const l = hoja('luis', true, [...gente('luis'), { id: 'luis', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'editar', esYo: true }])
    debe(/Entra directo en el presupuesto/.test(l.t) && !/Enviar a/.test(l.t), '4a', 'quien puede editar (Luis): entra directo, sin esperar')
    const src = sinComentarios(leer('src/components/route/presupuesto/HojaAnadirGasto.tsx'))
    debe(/Solo lo ves tú/.test(src) && /\{ambito === 'grupo' && \(/.test(src) && /pagadoPor: ambito === 'mio' \? \[\] : pagadoPor/.test(src), '04', 'con [Para mí]: «Solo lo ves tú», sin «¿Quién lo ha pagado?» y sin pagador guardado')
  }

  console.log('2e. 06, 07 y 08 · el aviso en la campana de Eric')
  {
    const aviso = (extra = {}) => ({ id: 'av1', tipo: 'gasto_pendiente', texto: 'Ana quiere añadir al presupuesto', quien: 'Ana', creado_en: new Date(Date.now() - 2 * 60000).toISOString(), leido: false, etiqueta: null, payload: { gasto_id: 'g3', nombre: 'Cena día 1', precio: eur(30), pago: 'Ana', autor_id: 'ana', gasto_estado: 'pendiente', ...extra } })
    const lista = (a) => renderToStaticMarkup(createElement(ListaDeAvisos, { avisos: [a], onTocar() {} }))
    const p = lista(aviso())
    const t = plano(aTexto(p))
    debe(/Ana quiere añadir al presupuesto/.test(t) && /hace 2 min/.test(t), '06', '«Ana quiere añadir al presupuesto» · hace 2 min')
    debe(/Cena día 1/.test(t) && /Para todos · pagó Ana/.test(t) && /30 €/.test(t), '06', 'con el gasto DENTRO: «Cena día 1 · Para todos · pagó Ana · 30 €»')
    debe(/data-gasto-rechazar/.test(p) && /data-gasto-aceptar/.test(p) && /Rechazar \| Aceptar/.test(t), '06', '[Rechazar] [Aceptar] dentro del mismo aviso')
    const ac = lista({ ...aviso({ gasto_estado: 'aceptado' }), etiqueta: 'Aceptado', leido: true })
    debe(/Aceptado · suma al grupo/.test(plano(aTexto(ac))) && !/data-gasto-aceptar/.test(ac), '07', 'después de aceptar: «✓ Aceptado · suma al grupo», sin botones')
    const re = lista({ ...aviso({ gasto_estado: 'rechazado' }), etiqueta: 'Rechazado', leido: true })
    debe(/Rechazado/.test(plano(aTexto(re))) && !/data-gasto-aceptar/.test(re) && /data-gasto-resultado="rechazado"/.test(re), '08', 'después de rechazar: «Rechazado», sin botones')
    const res = plano(aTexto(lista({ id: 'av2', tipo: 'gasto_resuelto', texto: 'Eric ha aceptado tu gasto', detalle: 'Cena día 1 · 30 € · ya suma en el grupo', quien: 'Eric', creado_en: new Date().toISOString(), leido: false, etiqueta: null, payload: {} })))
    debe(/Eric ha aceptado tu gasto/.test(res) && /Cena día 1 · 30 € · ya suma en el grupo/.test(res), '09', 'a Ana, en su campana: «Eric ha aceptado tu gasto» con su detalle')
  }

  console.log('2f. 09 y 10 · Ana, después de aceptar y de rechazar')
  {
    const tras = (estado) => {
      poner({ yo: 'ana', esInvitado: true, gastos: gastosDelDiseno.map((g) => (g.id === 'g3' ? { ...g, estado, decididoPor: 'eric' } : g)) })
      return pinta()
    }
    const t = plano(aTexto(tras('aceptado')))
    debe(/Cena día 1 \| (A \| )?Pagó Ana · Para todos/.test(t) && !/Pendiente de Eric/.test(t), '09', 'el gasto pasa a «Pagó Ana · Para todos»')
    debe(/630 €/.test(t) && /Extras \| 110 €/.test(t), '09', 'suben el total (630 €) y los Extras (110 €)')
    useGastosCompartidos.setState({ resaltado: 'g3' })
    debe(/oklch\(0\.96 0\.035 150\)/.test(pinta()), '09', 'el gasto aceptado se marca en verde un momento')
    const t2 = plano(aTexto(tras('rechazado')))
    debe(/Cena día 1 \| Eric prefirió no sumarlo · ahora solo para ti/.test(t2), '10', 'el gasto se le queda como suyo: «Eric prefirió no sumarlo · ahora solo para ti»')
    debe(/600 €/.test(t2) && /Extras \| 80 €/.test(t2), '10', 'y no suma: el total sigue en 600 €')
  }

  console.log('2g. Sin compartir, el presupuesto se queda como ahora')
  {
    poner({ yo: 'eric', esInvitado: false, personas: [{ id: 'eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin', esYo: true }], gastos: [] })
    useRouteStore.setState({ route: { ...route, personas: 2, gastosExtras: [{ id: 'e1', nombre: 'Propina', precio: eur(5) }] } })
    const html = pinta()
    const t = plano(aTexto(html))
    debe(/Total del viaje/.test(t) && !/Del grupo/.test(t) && /525 €/.test(t), 'sin-compartir', 'sin gente: «Total del viaje», 525 € (como siempre)')
    debe(/Nombre del gasto/.test(html) && !/data-extras-compartidos|Para todos|Para mí|Quién lo ha pagado/i.test(html), 'sin-compartir', 'el formulario de Extras de siempre, sin [Para todos] / [Para mí] ni «¿Quién lo ha pagado?»')
    debe(/2 personas/.test(t), 'sin-compartir', 'con «2 personas» en la cabecera, como antes')
    poner({ yo: 'eric', esInvitado: false, disponible: false })
    useRouteStore.setState({ route: { ...route, personas: 2 } })
    const h2 = pinta()
    debe(/Total del viaje/.test(plano(aTexto(h2))) && !/data-extras-compartidos/.test(h2), '0037', 'con la 0037 sin aplicar, el presupuesto se queda como siempre')
  }
  console.error = consolaError
}

/* ═══════════════ 3. Lo que se mira en el código ═══════════════ */
console.log('3. El código')
{
  debe(!/esInvitado/.test(sinComentarios(leer('src/components/presupuesto/BotonCartera.tsx'))), '01', 'la cartera ya sale también para el invitado')
  debe(/gv\.esInvitado/.test(sinComentarios(leer('src/components/route/presupuesto/PantallaPresupuesto.tsx'))), '01', 'el invitado ve las líneas del dueño sin poder cambiarlas')
  const host = sinComentarios(leer('src/components/presupuesto/GastosCompartidosHost.tsx'))
  debe(/escuchar\(tripId/.test(host) && /setInterval/.test(host) && /visibilitychange/.test(host) && /data-franja-gasto/.test(host), '09', 'los gastos se leen en directo (Realtime), cada poco y al volver, y la franja de arriba existe')
  const red = sinComentarios(leer('src/lib/gastosCompartidosRed.ts'))
  debe(/postgres_changes/.test(red) && /table: 'trip_gastos'/.test(red) && /\{ error \} = await supabase\.from\('trip_gastos'\)\.insert/.test(red), '09', 'Realtime sobre trip_gastos y los errores de Postgrest se miran siempre ({ error })')
  const store = sinComentarios(leer('src/store/useGastosCompartidos.ts'))
  debe(/franja:/.test(store) && /useAvisosStore\.getState\(\)\.cargar\(\)/.test(store), '09', 'si deciden un gasto mío con la app abierta: la franja y la campana se refrescan')
  debe(/<GastosCompartidosHost \/>/.test(sinComentarios(leer('src/App.tsx'))), '09', 'el anfitrión está montado en la app')
  debe(/<AvisoDeGasto/.test(sinComentarios(leer('src/components/avisos/ListaDeAvisos.tsx'))), '06', 'la lista de avisos pinta el aviso del gasto con sus botones')
  for (const f of ['src/lib/gastosCompartidos.ts', 'src/lib/gastosCompartidosRed.ts', 'src/store/useGastosCompartidos.ts', 'src/hooks/useGastosDelViaje.ts', 'src/components/route/presupuesto/ExtrasCompartidos.tsx', 'src/components/route/presupuesto/HojaAnadirGasto.tsx', 'src/components/avisos/AvisoDeGasto.tsx', 'src/components/presupuesto/GastosCompartidosHost.tsx']) {
    debe(!/€/.test(sinComentarios(leer(f))), '€', `${f}: ningún «€» escrito a mano`)
  }
}

/* ═══════════════ 4. La pantalla de verdad (móvil, con un servidor de mentira en memoria) ═══════════════ */
console.log('4. La pantalla de verdad (hace falta Vite; sin él se salta)')
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
        throw new Error(`${e.message} :: ${js.slice(0, 160)}`)
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
      await ev("(() => { window.__ruta.setState((s) => ({ route: { ...s.route, arrivalPrecio: { amount: 300, currency: 'EUR' }, departurePrecio: { amount: 220, currency: 'EUR' } } })); return true })()")
      const texto = () => ev("document.querySelector('[data-extras-compartidos]') ? document.body.innerText : document.body.innerText")
      const abrirPresupuesto = async () => {
        await ev("(() => { const b = Array.from(document.querySelectorAll('[data-cartera]')).find((x) => x.offsetParent !== null) ?? document.querySelector('[data-cartera]'); b?.click(); return true })()")
        await a.esp(900)
      }
      const cerrarPresupuesto = async () => {
        await ev("(() => { document.querySelector('[aria-labelledby=\"titulo-presupuesto\"] button[aria-label=\"Atrás\"]')?.click(); return true })()")
        await a.esp(500)
      }
      const clic = async (sel, contiene) => {
        const r = await ev(`(() => { const els = Array.from(document.querySelectorAll(${JSON.stringify(sel)})); const e = els.find((x) => !${JSON.stringify(contiene ?? '')} || x.textContent.includes(${JSON.stringify(contiene ?? '')})); if (!e) return false; e.click(); return true })()`)
        await a.esp(500)
        return r
      }
      const escribirGasto = async (nombre, importe) => {
        await a.escribir('[data-gasto-nombre]', nombre)
        await a.escribir('[data-gasto-importe]', importe)
        await a.esp(300)
      }
      const f = (n) => path.join(SALIDA, `10n_presupuesto_${n}.jpg`)
      const FAL = 'window.__gastosFalsos'

      // 01 · Ana (invitada)
      await ev(`(async () => { ${FAL}.reiniciar(); ${FAL}.sembrarComoElDiseno(); await ${FAL}.usar('ana'); return true })()`)
      await a.esp(600)
      // Ana ya tiene su gasto pendiente de partida (Cena día 1), como en el diseño.
      await ev(`(async () => { const b = ${FAL}.bd; b.gastos.push({ id: 'g-cena', tripId: 'demo-viaje', autorId: 'ana', nombre: 'Cena día 1', precio: { amount: 30, currency: 'EUR' }, ambito: 'grupo', estado: 'pendiente', pagadoPor: ['ana'], decididoPor: null, decididoEn: null, creadoEn: new Date().toISOString() }); b.avisos.push({ id: 'a-cena', uid: 'eric', tipo: 'gasto_pendiente', creado: new Date(Date.now() - 120000).toISOString(), leido: false, payload: { trip_id: 'demo-viaje', gasto_id: 'g-cena', autor_id: 'ana', autor: 'Ana', nombre: 'Cena día 1', precio: { amount: 30, currency: 'EUR' }, pago: 'Ana' } }); await window.__gastos.getState().recargar(); return true })()`)
      await abrirPresupuesto()
      let t = await texto()
      debe(/Del grupo/i.test(t) && /de Eric/.test(t) && /600 €/.test(t), '01', 'pantalla: el de Ana dice «de Eric», «Del grupo» y 600 €')
      debe(/Pagó Eric · Para todos/.test(t) && /Pendiente de Eric/.test(t) && /Solo para ti/.test(t) && /Añadir gasto/.test(t), '01', 'pantalla: «Pagó Eric · Para todos», «Pendiente de Eric», «Solo para ti» y [+ Añadir gasto]')
      await clic('[aria-label="Ver precio por persona"]')
      t = await texto()
      debe(/300 €\s*por persona/.test(t), '01', 'pantalla: el ojo enseña «300 € por persona» (600 € entre dos)')
      await a.captura(f('01_ana'))
      await clic('[aria-label="Ocultar precio por persona"]')

      // 03 · Ana añade [Para todos]
      await clic('[data-anadir-gasto]')
      await escribirGasto('Cena día 3', '24')
      t = await texto()
      debe(/Se lo enviamos a Eric/.test(t) && /Enviar a Eric/.test(t), '03', 'pantalla: la hoja dice «Se lo enviamos a Eric» y [Enviar a Eric]')
      await a.captura(f('03_ana_para_todos'))
      await clic('[data-gasto-enviar]')
      await a.esp(800)
      t = await texto()
      debe(/Cena día 3\s*\n?\s*Pendiente de Eric/.test(t), '03', 'pantalla: queda «Pendiente de Eric»')
      debe(/600 €/.test(t), '03', 'pantalla: lo pendiente no sube el total (sigue en 600 €)')

      // 04 · Ana añade [Para mí]
      await clic('[data-anadir-gasto]')
      await clic('[role="radio"]', 'Para mí')
      await escribirGasto('Postales', '8')
      t = await texto()
      debe(/Solo lo ves tú/.test(t) && !/¿Quién lo ha pagado/i.test(t) && /Añadir gasto/.test(t), '04', 'pantalla: [Para mí] dice «Solo lo ves tú» y no pregunta quién lo ha pagado')
      await a.captura(f('04_ana_para_mi'))
      await clic('[data-gasto-enviar]')
      await a.esp(800)
      t = await texto()
      debe(/Postales\s*\n?\s*Solo para ti/.test(t) && /600 €/.test(t), '04', 'pantalla: entra directo, «Solo para ti», y no suma al grupo (600 €)')
      await clic('[aria-label="Ver precio por persona"]')
      debe(/300 €\s*por persona/.test(await texto()), '04', 'pantalla: el «por persona» sigue en 300 € (los [Para mí] no cuentan)')
      await cerrarPresupuesto()

      // 02 y 05 · Eric
      await ev(`(async () => { await ${FAL}.usar('eric'); return true })()`)
      await a.esp(800)
      await abrirPresupuesto()
      t = await texto()
      debe(/Eric y Ana/.test(t) && /Regalo para casa\s*\n?\s*Solo para ti/.test(t) && !/Postales|Souvenirs/.test(t), '02', 'pantalla: el de Eric dice «Eric y Ana», con sus gastos «Solo para ti» y sin los de Ana')
      await a.captura(f('02_eric'))
      await clic('[data-anadir-gasto]')
      await escribirGasto('Cena día 2', '42')
      t = await texto()
      debe(/Entra directo en el presupuesto/.test(t) && /quién lo ha pagado/i.test(t) && /Para mí/.test(t), '05', 'pantalla: Eric: «Entra directo en el presupuesto», con «¿Quién lo ha pagado?» y [Para mí]')
      await a.captura(f('05_eric_para_todos'))
      await clic('[data-gasto-enviar]')
      await a.esp(800)
      t = await texto()
      debe(/Cena día 2\s*\n?\s*(E\s*\n?\s*)?Pagó Eric · Para todos/.test(t) && /642 €/.test(t), '05', 'pantalla: entra directo («Pagó Eric · Para todos») y sube el total (642 €)')
      await cerrarPresupuesto()

      // 06, 07 y 08 · la campana de Eric
      await ev("(() => { window.__avisos.getState().abrir(); return true })()")
      await a.esp(900)
      t = await texto()
      debe(/Ana quiere añadir al presupuesto/.test(t) && /Para todos · pagó Ana/.test(t) && /Rechazar/.test(t) && /Aceptar/.test(t), '06', 'pantalla: la campana de Eric: «Ana quiere añadir al presupuesto» con el gasto dentro y [Rechazar] [Aceptar]')
      await a.captura(f('06_eric_campana'))
      // (hay dos pendientes de Ana: la cena del día 1 y la del día 3; se acepta la primera y se rechaza la otra)
      const botones = await ev("Array.from(document.querySelectorAll('[data-gasto-estado=\"pendiente\"]')).length")
      debe(botones === 2, '06', `pantalla: los dos gastos de Ana esperan en la campana (${botones})`)
      await ev("(() => { document.querySelector('[data-gasto-estado=\"pendiente\"] [data-gasto-aceptar]').click(); return true })()")
      await a.esp(900)
      t = await texto()
      debe(/Aceptado · suma al grupo/.test(t), '07', 'pantalla: después de aceptar, en el mismo aviso: «✓ Aceptado · suma al grupo»')
      await a.captura(f('07_eric_aceptado'))
      await ev("(() => { document.querySelector('[data-gasto-estado=\"pendiente\"] [data-gasto-rechazar]').click(); return true })()")
      await a.esp(900)
      t = await texto()
      debe(/Rechazado/.test(t) && (await ev("document.querySelectorAll('[data-gasto-resultado]').length")) === 2, '08', 'pantalla: después de rechazar, «Rechazado»; los dos avisos se quedan en la lista')
      await a.captura(f('08_eric_rechazado'))
      await ev("(() => { window.__avisos.getState().cerrar(); return true })()")
      await a.esp(500)

      // 09 y 10 · Ana, después (con la app abierta: la franja de arriba y el cambio en directo)
      await ev(`(async () => { await ${FAL}.reiniciar(); ${FAL}.sembrarComoElDiseno(); await ${FAL}.usar('ana'); const b = ${FAL}.bd; for (const [id, n, a] of [['g-ok', 'Cena día 1', 30], ['g-no', 'Bolso', 80]]) b.gastos.push({ id, tripId: 'demo-viaje', autorId: 'ana', nombre: n, precio: { amount: a, currency: 'EUR' }, ambito: 'grupo', estado: 'pendiente', pagadoPor: ['ana'], decididoPor: null, decididoEn: null, creadoEn: new Date().toISOString() }); await window.__gastos.getState().recargar(); return true })()`)
      await abrirPresupuesto()
      await ev(`(async () => { await ${FAL}.decidirComo('eric', 'g-ok', 'aceptado'); await window.__gastos.getState().recargar(); return true })()`)
      await a.esp(700)
      t = await texto()
      debe(/Eric ha aceptado tu gasto/.test(t) && /Cena día 1 · 30 € · ya suma en el grupo/.test(t), '09', 'pantalla: con la app abierta sale arriba «Eric ha aceptado tu gasto · Cena día 1 · 30 € · ya suma en el grupo»')
      debe(/630 €/.test(t) && /Pagó Ana · Para todos/.test(t), '09', 'pantalla: el cambio en directo: el gasto pasa a «Pagó Ana · Para todos» y sube el total (630 €)')
      debe((await ev("(document.querySelector('[data-gasto-fila=\"Cena día 1\"]')?.getAttribute('style') ?? '').includes('0.96 0.035 150')")) === true, '09', 'pantalla: el gasto aceptado se marca en verde un momento')
      await a.captura(f('09_ana_aceptado'))
      await a.esp(5600)
      debe((await ev("Boolean(document.querySelector('[data-franja-gasto]'))")) === false, '09', 'pantalla: la franja se va sola')
      await ev(`(async () => { await ${FAL}.decidirComo('eric', 'g-no', 'rechazado'); await window.__gastos.getState().recargar(); return true })()`)
      await a.esp(700)
      t = await texto()
      debe(/Eric ha preferido no sumar tu gasto/.test(t) && /Bolso · 80 € · se queda solo para ti/.test(t), '10', 'pantalla: con la app abierta sale arriba «Eric ha preferido no sumar tu gasto · Bolso · 80 € · se queda solo para ti»')
      debe(/Eric prefirió no sumarlo · ahora solo para ti/.test(t) && /630 €/.test(t), '10', 'pantalla: el gasto se le queda como suyo («Eric prefirió no sumarlo · ahora solo para ti») y el total no sube')
      await a.captura(f('10_ana_rechazado'))
      // El aviso siempre en su campana.
      await cerrarPresupuesto()
      await ev("(() => { window.__avisos.getState().abrir(); return true })()")
      await a.esp(700)
      t = await texto()
      debe(/Eric ha aceptado tu gasto/.test(t) && /Eric ha preferido no sumar tu gasto/.test(t), '09', 'pantalla: y los dos avisos están SIEMPRE en la campana de Ana')
      await a.captura(f('11_ana_campana'))
      await ev("(() => { window.__avisos.getState().cerrar(); return true })()")

      // Sin compartir: como ahora.
      await ev("(() => { sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso'); window.__viaje.getState().poner({ gente: [] }); window.__gastos.getState().poner({ gastos: [] }); return true })()")
      await a.esp(500)
      await abrirPresupuesto()
      t = await texto()
      debe(/Total del viaje/i.test(t) && !/Del grupo/i.test(t) && !/Para todos|Para mí/.test(t) && (await ev(`Boolean(document.querySelector('[aria-label="Nombre del gasto"]'))`)) === true, 'sin-compartir', 'pantalla: sin gente, el presupuesto se queda como siempre')
      await a.captura(f('12_sin_compartir'))
    } finally {
      a.cerrar()
    }
  }
}

for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
console.log(`\nPrueba 10N presupuesto: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
