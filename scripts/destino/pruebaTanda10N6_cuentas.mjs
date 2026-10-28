// Tanda 10N6 (K4) · 1j presupuesto sin gastos, 1k lo personal no es del grupo, 1l entradas para varios (lo compre quien lo compre), y las respuestas 0a-6, 0a-8 y 0a-10. No toca el motor de rutas.
//   APP_URL=http://localhost:5204 API_URL=http://localhost:8874 node scripts/destino/pruebaTanda10N6_cuentas.mjs
// 1. Lo puro (esbuild + Node): el presupuesto de cada persona, lo personal, las cuentas, las entradas en plural.
// 2. La base de datos (PGlite con las migraciones reales, la 0053 incluida): avisos de entradas del invitado, «Se ha cambiado el tuyo» solo a quien tenía lo suyo, varios cambios en un aviso.
// 3. Lo que hay en el código.
// 4. La pantalla de verdad (hace falta Vite; SIN_APP=1 la salta): capturas docs/dias/capturas_jutrip/10n6_*.jpg y, al lado, la de Design.
import fs from 'node:fs'
import path from 'node:path'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'
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
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })

const { M } = await prepararSSR('scripts/destino/_10n6_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { construirPresupuesto, aportacionesDelViaje, calcularCuentas, porPersonaDelPresupuesto, esSoloDe, reservaEsPersonal, todasLasEntradas, textoLaTienen, frase, meCubre } = M

await import('../../server/avisos.js') // (carga la tabla de artículos: «el Coliseo»)

/* ═══════════════ 1. Lo puro ═══════════════ */
console.log('1. Lo puro')
const PER = [{ id: 'eric', nombre: 'Eric' }, { id: 'ana', nombre: 'Ana' }, { id: 'laura', nombre: 'Laura' }]
const TODOS = PER.map((p) => p.id)
const ruta = { id: 'r1', destination: 'Roma', origin: 'Madrid', answers: { dateRange: { start: '2026-11-10', end: '2026-11-14' } }, arrivalPrecio: eur(300), departurePrecio: eur(200), days: [{ id: 'd1', dayNumber: 1, city: 'Roma', stops: [] }, { id: 'd2', dayNumber: 2, city: 'Roma', stops: [] }, { id: 'd3', dayNumber: 3, city: 'Roma', stops: [] }] }
const reserva = (id, nombre, precio, paraQuien, extra = {}) => ({ id, kind: 'entrada', refId: nombre, name: nombre, placeNames: [nombre], dateIso: '2026-11-12', dayNumber: null, time: '09:15', precio: eur(precio), ...(paraQuien ? { paraQuien } : {}), ...extra })
const entradaBase = (reservations, cuentasEntre, extra = {}) => ({ route: { ...ruta, cuentasEntre }, reservations, accommodationSelections: { d1: { name: 'Hotel Roma', precio: eur(400) } }, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true, ...extra })
const reparto = (yoId, extra = {}) => ({ yoId, adminId: 'eric', esInvitado: yoId !== 'eric', todos: TODOS, entreDe: null, ...extra })
const compartido = (rep) => ({ gastos: [], extrasDeLaRutaMios: rep.yoId === 'eric', reparto: rep })
const lineasDe = (p) => p.bloques.flatMap((b) => b.lineas)
const ids = (p) => lineasDe(p).map((l) => l.id).join()
{
  // 1k · Eric añade el Coliseo 100 € solo para él, y el Foro 60 € para él y Ana.
  const rs = [reserva('r1', 'Coliseo', 100, ['eric']), reserva('r2', 'Foro', 60, ['eric', 'ana'])]
  const pe = construirPresupuesto(entradaBase(rs, undefined, { compartido: compartido(reparto('eric')) }))
  const coliseo = lineasDe(pe).find((l) => l.id === 'reserva-r1')
  debe(coliseo && coliseo.personal === true && coliseo.compartido.vista === 'mio', '1k', 'la reserva solo para quien la paga (Eric) sale en su presupuesto marcada como personal («Solo tú»)')
  const bloqueRuta = pe.bloques.find((b) => b.id === 'ruta')
  debe(bloqueRuta.suma.amount === 60, '1k', `el bloque «Ruta» solo suma lo del grupo (60 €, sin los 100 € personales): ${bloqueRuta.suma.amount}`)
  debe(pe.total.amount === 300 + 200 + 400 + 60, '1k', `«Del grupo» = vuelos 500 + hotel 400 + Foro 60 = 960 € (los 100 € del Coliseo no cuentan): ${pe.total.amount}`)
  const ap = aportacionesDelViaje({ gastos: [], reservas: rs, adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null })
  debe(ap.length === 1 && ap[0].nombre === 'Foro' && ap[0].entre.join() === 'eric,ana', '1k', 'en «Cuentas del grupo» solo entra el Foro (para dos): el Coliseo solo de Eric no cuenta ni como total, ni como pagado, ni como le toca')
  const cu = calcularCuentas({ aportaciones: ap, pagos: [], personas: PER })
  debe(cu.total === 6000 && cu.personas.find((p) => p.id === 'eric').pagado === 6000 && cu.personas.find((p) => p.id === 'eric').toca === 3000 && cu.personas.reduce((s, p) => s + p.saldo, 0) === 0, '1k', 'Total del grupo 60 €; Eric pagó 60 € y le tocan 30 €; las cuentas cuadran a cero')
  const parte = porPersonaDelPresupuesto({ presupuesto: pe, gastos: [], reservas: rs, entreDe: undefined, adminId: 'eric', todos: TODOS, yoId: 'eric' })
  // vuelos 500/3 + hotel 400/3 + Foro 60/2 + personal 100
  const esperado = Math.floor(50000 / 3) + Math.floor(40000 / 3) + 3000 + 10000
  debe(parte.tuParte === true && parte.centimos === esperado, '1k', `«Tu parte» de Eric incluye lo personal (100 €): ${parte.centimos} = ${esperado}`)
  // Para otro: Eric paga el Coliseo solo de Ana → es del grupo, Ana le debe 100 €.
  const rAna = [reserva('r3', 'Coliseo', 100, ['ana'])]
  const apAna = aportacionesDelViaje({ gastos: [], reservas: rAna, adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null })
  const cuAna = calcularCuentas({ aportaciones: apAna, pagos: [], personas: PER })
  debe(apAna.length === 1 && cuAna.personas.find((p) => p.id === 'ana').saldo === -10000 && cuAna.personas.find((p) => p.id === 'eric').saldo === 10000, '1k', 'si Eric paga la entrada solo de Ana, es del grupo: Ana le debe esos 100 €')
  const peAna = construirPresupuesto(entradaBase(rAna, undefined, { compartido: compartido(reparto('eric')) }))
  debe(lineasDe(peAna).find((l) => l.id === 'reserva-r3').personal !== true, '1k', 'y en el presupuesto no es personal')
  // Las reservas de antes de compartir (sin «¿Para quién es?»): solo del administrador.
  const antes = [reserva('r4', 'Panteón', 30, null)]
  debe(reservaEsPersonal(undefined, 'eric') && reservaEsPersonal([], 'eric') && reservaEsPersonal(['eric'], 'eric') && !reservaEsPersonal(['eric', 'ana'], 'eric') && !reservaEsPersonal(['ana'], 'eric'), '1k', 'reservaEsPersonal: sin lista o solo quien paga = personal; para otro o para varios = del grupo')
  debe(aportacionesDelViaje({ gastos: [], reservas: antes, adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null }).length === 0, '1k', 'una reserva de antes de compartir no es del grupo')
  // Un invitado: no ve lo personal del administrador.
  const pAna = construirPresupuesto(entradaBase(rs, undefined, { compartido: compartido(reparto('ana')) }))
  debe(!ids(pAna).includes('reserva-r1') && ids(pAna).includes('reserva-r2'), '1k', 'Ana no ve el Coliseo personal de Eric (los demás no lo ven) y sí el Foro, que la incluye')
  debe(pAna.ocultas.some((l) => l.id === 'reserva-r1'), '1k', 'lo que no ve va a «ocultas», para que las cuentas lo tengan')
  // Gastos: uno solo para quien lo paga tampoco es del grupo.
  const g = (id, autorId, amount, pagadoPor, entre) => ({ id, tripId: 't', autorId, nombre: id, precio: eur(amount), ambito: 'grupo', estado: 'aceptado', pagadoPor, entre, decididoPor: null, creadoEn: '' })
  debe(aportacionesDelViaje({ gastos: [g('mio1', 'ana', 20, ['ana'], ['ana']), g('dos', 'ana', 20, ['ana'], ['ana', 'eric'])], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null }).map((a) => a.id).join() === 'gasto-dos', '1k', 'un gasto solo para quien lo paga no cuenta en las cuentas; para dos, sí')
}

console.log('1b. Alojamiento, coche y vuelos (10N5): lo que es solo para quien lo pone también es personal')
{
  const rep = reparto('eric', { entreDe: { 'aloj-d1': ['eric'], llegada: ['eric', 'ana'], vuelta: ['eric', 'ana'] } })
  const pe = construirPresupuesto(entradaBase([], rep.entreDe, { compartido: compartido(rep) }))
  const aloj = lineasDe(pe).find((l) => l.id === 'aloj-d1')
  const ida = lineasDe(pe).find((l) => l.id === 'llegada')
  debe(aloj.personal === true && ida.personal !== true, '1k', 'el hotel solo para Eric es personal; el vuelo para Eric y Ana es del grupo')
  const entran = [{ clave: 'aloj-d1', nombre: 'Hotel Roma', precio: eur(400), tipo: 'alojamiento' }, { clave: 'llegada', nombre: 'Ida', precio: eur(300), tipo: 'vuelo' }]
  const ap = aportacionesDelViaje({ gastos: [], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null, entran, entreDe: rep.entreDe })
  debe(ap.length === 1 && ap[0].clave === 'llegada' && ap[0].entre.join() === 'eric,ana', '1k', 'en las cuentas solo entra el vuelo (el hotel personal no)')
  // 0a-8 · el presupuesto de un invitado enseña lo suyo
  const repAna = reparto('ana', { entreDe: { llegada: ['eric', 'laura'], vuelta: ['eric', 'laura'] } })
  const pAna = construirPresupuesto(entradaBase([], repAna.entreDe, { compartido: compartido(repAna) }))
  debe(!ids(pAna).includes('llegada') && !ids(pAna).includes('vuelta'), '0a-8', 'Ana no ve el vuelo de Eric si no va en él')
  debe(pAna.ocultas.some((l) => l.id === 'llegada'), '0a-8', '…pero las cuentas lo tienen (en ocultas)')
  const repAna2 = reparto('ana', { entreDe: { llegada: ['eric', 'ana'] } })
  const pAna2 = construirPresupuesto(entradaBase([], repAna2.entreDe, { compartido: compartido(repAna2) }))
  debe(ids(pAna2).includes('llegada') && pAna2.ocultas.every((l) => l.id !== 'llegada'), '0a-8', 'si Ana va en el vuelo de Eric, lo ve')
  const repAna3 = reparto('ana', { entreDe: { llegada: ['eric', 'ana'] }, conVueloPropio: new Set(['ana']), loSuyo: { vuelo: { ida: { hora: '10:00', precio: eur(90) }, vuelta: null }, alojamiento: { name: 'Mi piso', precio: eur(250) } } })
  const pAna3 = construirPresupuesto(entradaBase([], repAna3.entreDe, { compartido: compartido(repAna3) }))
  debe(!ids(pAna3).includes('llegada') && ids(pAna3).includes('mi-ida') && ids(pAna3).includes('mi-aloj'), '0a-8', 'si Ana tiene SU vuelo y SU alojamiento, ve los suyos (con candado) y no el del administrador')
  debe(lineasDe(pAna3).filter((l) => l.id.startsWith('mi-')).every((l) => l.personal === true), '0a-8', 'lo suyo sale con «Solo tú»')
  const partePropia = porPersonaDelPresupuesto({ presupuesto: pAna3, gastos: [], reservas: [], entreDe: repAna3.entreDe, adminId: 'eric', todos: TODOS, yoId: 'ana', conVueloPropio: new Set(['ana']) })
  debe(partePropia.tuParte === true && partePropia.centimos >= 34000, '0a-8', `«Tu parte» de Ana incluye lo suyo (340 €): ${partePropia.centimos}`)
}

console.log('1c. Entradas para varios: las compre quien las compre')
{
  const rEric = reserva('e1', 'Coliseo', 80, ['eric', 'ana'])
  const rAna = reserva('a1', 'Coliseo', 80, ['ana', 'laura'], { time: '11:00' })
  const todas = todasLasEntradas({ adminId: 'eric', reservasDelDueno: [rEric], entradasInv: [{ userId: 'ana', reservas: [rAna] }] })
  debe(todas.length === 2 && todas[0].compradorId === 'eric' && todas[1].compradorId === 'ana', '1l', 'las entradas del administrador y las del invitado, cada una con su comprador')
  debe(meCubre(todas[1], 'laura') && !meCubre(todas[1], 'eric') && meCubre(todas[0], 'ana'), '1l', 'a cada marcado le cubre; al que no, no (sea quien sea quien compró)')
  const ruta1 = { ...ruta }
  const t1 = textoLaTienen(ruta1, [{ nombres: ['Eric', 'Ana'], reserva: rEric }])
  debe(t1 === 'Eric y Ana la tienen para el jueves 12 · 9:15', '1l', `plural con nombres: «${t1}»`)
  const t2 = textoLaTienen(ruta1, [{ nombres: ['Eric', 'Ana', 'Laura'], reserva: rEric }])
  debe(t2 === 'Eric, Ana y Laura la tienen para el jueves 12 · 9:15', '1l', `con más de dos: «${t2}»`)
  const t3 = textoLaTienen(ruta1, [{ nombres: ['Eric'], reserva: rEric }])
  debe(t3 === 'Eric la tiene para el jueves 12 · 9:15', '1l', `uno solo: «${t3}»`)
  const t4 = textoLaTienen(ruta1, [{ nombres: ['Eric'], reserva: rEric }, { nombres: ['Ana'], reserva: rAna }])
  debe(t4 === 'Eric la tiene a las 9:15 · Ana a las 11:00', '1l', `dos horas distintas: «${t4}»`)
  debe(frase(['Eric', 'Ana']) === 'Eric y Ana' && frase(['Eric']) === 'Eric' && frase([]) === '', '1l', 'frase()')
  // el aviso (textos del servidor)
  const textos = await import('../../shared/avisos/textos.js')
  const av = (extra) => textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { quien: 'Eric', sitio: 'Coliseo', dia: 'jueves 12', hora: '09:15', ...extra } })
  debe(av({ incluido: true, caso: 'incluido' }) === 'Eric ha reservado el Coliseo para ti · jueves 12 · 9:15', '1l', `a los marcados: «${av({ incluido: true })}»`)
  debe(av({ incluido: false, tienen: ['Eric', 'Ana'] }) === 'Eric y Ana han reservado el Coliseo · jueves 12 · 9:15. ¿Reservas la tuya a la misma hora?', '1l', `a los no marcados, en plural: «${av({ tienen: ['Eric', 'Ana'] })}»`)
  debe(av({ incluido: false, tienen: ['Eric', 'Ana', 'Laura'] }).startsWith('Eric, Ana y Laura han reservado'), '1l', 'con más de dos: «Eric, Ana y Laura han reservado…»')
  debe(av({ incluido: false }) === 'Eric ha reservado el Coliseo · jueves 12 · 9:15. ¿Reservas la tuya a la misma hora?', '1l', 'sin lista de nombres (avisos antiguos): quien reservó')
  // 0a-6 · «Se ha cambiado el tuyo» solo a quien tenía lo suyo
  const lc = (suyo) => textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'vuelo_cambiado', quien: 'Eric', para: 'todos', ...(suyo === undefined ? {} : { suyo_cambiado: suyo }) } })
  debe(lc(true) === 'Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.' && lc(false) === 'Eric ha puesto el vuelo para todos.' && lc(undefined) === 'Eric ha puesto el vuelo para todos.', '0a-6', 'solo a quien tenía su propio vuelo: «Se ha cambiado el tuyo.»; a los demás, «Eric ha puesto el vuelo para todos.»')
  const fr = (suyo) => textos.franjaDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'alojamiento_cambiado', quien: 'Eric', para: 'todos', suyo_cambiado: suyo } })
  debe(fr(true).detalle === 'Se ha cambiado el tuyo.' && fr(false).detalle === '', '0a-6', 'y en la franja: el detalle solo si lo tenía')
}

/* ═══════════════ 2. La base de datos ═══════════════ */
console.log('2. La base de datos (PGlite, migraciones reales hasta la 0053)')
{
  const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0038|0042|0048|0049|0053)_/
  const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
  const { q, como, servidor, nuevoUsuario } = bd
  debe(bd.aplicadas.includes('0053_entradas_de_invitados_y_avisos_de_lo_suyo.sql'), 'migracion', 'la 0053 se aplica sin un error sobre la 0049')
  const sql = sinComentarios(leer('supabase/migrations/0053_entradas_de_invitados_y_avisos_de_lo_suyo.sql'))
  debe(!/alter table|drop table|avisos_tipo_check/i.test(sql), 'migracion', 'la 0053 no toca tablas ni la lista de tipos de aviso')
  const textos = await import('../../shared/avisos/textos.js')
  const eric = await nuevoUsuario('eric6@correo.es', false, 'ERIC GIL')
  const ana = await nuevoUsuario('ana6@correo.es', false, 'Ana')
  const laura = await nuevoUsuario('laura6@correo.es', false, 'Laura')
  const ruta = JSON.stringify({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: '2026-11-10', end: '2026-11-14' } }, days: [], arrivalFlightTime: '10:00', arrivalPointId: 'x', departureFlightTime: '18:00' })
  const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route, bookings) values ($1, $2::jsonb, $3::jsonb) returning id', [eric, ruta, '{}']))[0].id)
  for (const u of [ana, laura]) await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, u, eric]))
  const avisosDe = (uid, caso) => servidor(() => q("select payload from public.avisos where user_id = $1 and tipo = 'reserva_grupo' order by creado_en", [uid])).then((r) => r.filter((a) => a.payload.caso === caso))
  const reserva = (extra = {}) => ({ id: 'res-1', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', shortName: 'el Coliseo', placeNames: ['Coliseo'], dateIso: '2026-11-12', time: '09:15', precio: { amount: 80, currency: 'EUR' }, ...extra })

  // 1l · Ana (invitada) reserva para ella y Eric: a Eric le sale como suya, a Laura con los botones.
  await como(ana, () => q('insert into public.reservas_invitado (trip_id, user_id, reservas) values ($1, $2, $3::jsonb)', [viaje, ana, JSON.stringify([reserva({ paraQuien: [ana, eric] })])]))
  const aEric = await avisosDe(eric, 'incluido')
  const aLaura = await avisosDe(laura, 'no_incluido')
  const aAnaMisma = (await servidor(() => q("select 1 from public.avisos where user_id = $1 and tipo = 'reserva_grupo'", [ana]))).length
  debe(aEric.length === 1 && aLaura.length === 1 && aAnaMisma === 0, '1l', 'Ana (invitada) reserva para ella y para Eric: avisa a Eric (marcado) y a Laura (no marcada), y no a sí misma')
  debe(aEric[0] && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: aEric[0].payload }) === 'Ana ha reservado el Coliseo para ti · jueves 12 · 9:15', '1l', `el aviso de Eric: «${aEric[0] && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: aEric[0].payload })}»`)
  debe(aLaura[0] && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: aLaura[0].payload }) === 'Ana y Eric han reservado el Coliseo · jueves 12 · 9:15. ¿Reservas la tuya a la misma hora?', '1l', `el de Laura, en plural y con los nombres: «${aLaura[0] && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: aLaura[0].payload })}»`)
  // Guardar lo mismo otra vez no repite.
  await como(ana, () => q('update public.reservas_invitado set reservas = $3::jsonb where trip_id = $1 and user_id = $2', [viaje, ana, JSON.stringify([reserva({ paraQuien: [ana, eric] })])]))
  debe((await avisosDe(laura, 'no_incluido')).length === 1, '1l', 'guardar lo mismo no repite el aviso')
  // Solo para ella (personal): solo cambia el dinero. La entrada se ve y avisa igual, para que los demás reserven la suya a la misma hora.
  await como(ana, () => q('update public.reservas_invitado set reservas = $3::jsonb where trip_id = $1 and user_id = $2', [viaje, ana, JSON.stringify([reserva({ paraQuien: [ana, eric] }), reserva({ id: 'res-2', refId: 'Panteon', name: 'Panteón', shortName: 'el Panteón', paraQuien: [ana], time: '11:00' })])]))
  const solo = await avisosDe(laura, 'no_incluido')
  debe(solo.length === 2 && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: solo[1].payload }) === 'Ana ha reservado el Panteón · jueves 12 · 11:00. ¿Reservas la tuya a la misma hora?', '1k', 'una entrada solo para quien la reserva se ve y avisa igual (solo cambia el dinero): «Ana ha reservado el Panteón…»')
  const grupo = await como(laura, async () => (await q('select public.entradas_del_grupo($1) as r', [viaje]))[0].r)
  debe(grupo.length === 1 && grupo[0].reservas.length === 2, '1l', 'y entradas_del_grupo enseña las dos a todos (para ver quién tiene entrada y a qué hora: «Eric la tiene a las 9:15 · Ana a las 11:00»)')
  // El administrador reserva solo para él: avisa igual (solo cambia el dinero); para varios, en plural.
  await servidor(() => q("delete from public.avisos"))
  await como(eric, () => q("update public.trips set bookings = $2::jsonb where id = $1", [viaje, JSON.stringify({ reservations: [reserva({ id: 'e1', paraQuien: [eric] })] })]))
  debe((await avisosDe(laura, 'no_incluido')).length === 1, '1k', 'el administrador reserva solo para él: la entrada avisa igual (para que los demás reserven la suya a la misma hora)')
  await servidor(() => q('delete from public.avisos'))
  await como(eric, () => q("update public.trips set bookings = $2::jsonb where id = $1", [viaje, JSON.stringify({ reservations: [reserva({ id: 'e2', paraQuien: [eric, ana] })] })]))
  const aLauraE = await avisosDe(laura, 'no_incluido')
  debe(aLauraE.length === 1 && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: aLauraE[0].payload }) === 'Eric y Ana han reservado el Coliseo · jueves 12 · 9:15. ¿Reservas la tuya a la misma hora?', '1l', `el administrador reserva para él y Ana: Laura lee «${aLauraE[0] && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: aLauraE[0].payload })}»`)

  // 0a-6 · «Se ha cambiado el tuyo» solo a quien tenía lo suyo
  await servidor(() => q("delete from public.avisos"))
  await como(ana, () => q('insert into public.lo_suyo_del_viaje (trip_id, user_id, vuelo) values ($1, $2, $3::jsonb)', [viaje, ana, JSON.stringify({ ida: { hora: '09:00' } })]))
  await servidor(() => q("delete from public.avisos"))
  const ponerVuelo = (h) => como(eric, () => q("update public.trips set route = jsonb_set(route, '{arrivalFlightTime}', to_jsonb($2::text)) where id = $1", [viaje, h]))
  await ponerVuelo('11:15')
  const vAna = await avisosDe(ana, 'vuelo_cambiado')
  const vLaura = await avisosDe(laura, 'vuelo_cambiado')
  debe(vAna.length === 1 && vAna[0].payload.suyo_cambiado === true && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: vAna[0].payload }) === 'Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.', '0a-6', 'a Ana, que tenía su propio vuelo: «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.»')
  debe(vLaura.length === 1 && vLaura[0].payload.suyo_cambiado === false && textos.textoDelAviso({ tipo: 'reserva_grupo', payload: vLaura[0].payload }) === 'Eric ha puesto el vuelo para todos.', '0a-6', 'a Laura, que no tenía el suyo: «Eric ha puesto el vuelo para todos.» (sin «Se ha cambiado el tuyo»)')
  // 0a-10 · varios cambios seguidos en un solo aviso, con lo último que quedó
  await ponerVuelo('12:30')
  await ponerVuelo('13:45')
  const vAna2 = await avisosDe(ana, 'vuelo_cambiado')
  const vLaura2 = await avisosDe(laura, 'vuelo_cambiado')
  debe(vAna2.length === 1 && vLaura2.length === 1, '0a-10', `tres cambios seguidos del vuelo: UN solo aviso para cada uno (${vAna2.length} / ${vLaura2.length})`)
  debe(vAna2[0].payload.suyo_cambiado === true && vLaura2[0].payload.suyo_cambiado === false, '0a-10', 'el aviso juntado conserva lo que dijo (Ana tenía el suyo, Laura no)')
  const claves = await servidor(() => q("select clave from public.avisos where user_id = $1 and tipo = 'reserva_grupo'", [laura]))
  debe(claves.length === 1 && claves[0].clave.endsWith(await servidor(() => q("select md5(concat_ws('|', route ->> 'arrivalFlightTime', route ->> 'arrivalPointId', route ->> 'departureFlightTime', route ->> 'departurePointId', route #>> '{cuentasEntre,llegada}')) as m from public.trips where id = $1", [viaje])).then((r) => r[0].m)), '0a-10', 'y refleja lo último que quedó (la huella es la del vuelo de ahora)')
  // Si ya lo ha leído, el siguiente cambio es un aviso nuevo
  await servidor(() => q("update public.avisos set leido_en = now() where user_id = $1", [laura]))
  await ponerVuelo('14:00')
  debe((await avisosDe(laura, 'vuelo_cambiado')).length === 2, '0a-10', 'si ya lo había leído, el cambio siguiente es un aviso nuevo')
}

/* ═══════════════ 3. Lo que hay en el código ═══════════════ */
console.log('3. Lo que hay en el código')
{
  const pres = sinComentarios(leer('src/components/route/presupuesto/PantallaPresupuesto.tsx'))
  debe(/Aquí se irán añadiendo todos los gastos de tu ruta\./.test(pres) && /data-bloque-vacio/.test(pres), '1j', 'sin gastos: el bloque «Ruta» vacío con su línea')
  debe(!/Todavía no hay gastos/.test(pres) && !/border-dashed border-text\/\[\.18\]/.test(pres), '1j', 'fuera el recuadro de rayas y «Todavía no hay gastos»')
  debe(/Solo tú/.test(pres) && /nombre="candado"/.test(pres), '1k', 'lo personal sale con el candado y «Solo tú»')
  const hook = sinComentarios(leer('src/hooks/useCuentasDelGrupo.ts'))
  debe(/presupuesto\?\.ocultas/.test(hook), '0a-8', 'las cuentas leen también lo que un invitado no ve en su presupuesto (nada se pierde)')
  const comp = sinComentarios(leer('src/components/compartir/CompartidoHost.tsx'))
  debe(/useLoSuyoDelViaje\(\)/.test(comp), '1l', 'una sola carga de las entradas de los demás para DÍAS, la ficha y RESERVAS')
  const stop = sinComentarios(leer('src/components/route/reservas/useStopEntradas.ts'))
  debe(/deOtros/.test(stop) && /textoLaTienen/.test(stop), '1l', 'la ficha y DÍAS miran las entradas de cualquier comprador')
  const entradas = sinComentarios(leer('src/components/route/reservas/EntradasYFreeTour.tsx'))
  debe(/deOtros/.test(entradas) && /textoLaTienen/.test(entradas), '1l', 'RESERVAS también')
  const sqlNuevo = leer('supabase/migrations/0053_entradas_de_invitados_y_avisos_de_lo_suyo.sql')
  debe(/Aplícala DESPUÉS/.test(sqlNuevo) && !/0049_lo_suyo/.test(sinComentarios(sqlNuevo)), 'migracion', 'la 0053 es nueva y no edita la 0049 entregada')
  debe(leer('supabase/migrations/0049_lo_suyo_de_cada_uno.sql').includes("'Se ha cambiado el tuyo'") === false, 'migracion', 'la 0049 queda como se entregó')
}

/* ═══════════════ 4. La pantalla de verdad ═══════════════ */
console.log('4. La pantalla de verdad')
if (process.env.SIN_APP === '1') console.log('   (saltada: SIN_APP=1)')
else {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const { capturarDesign } = await import('./capturaDesign.mjs')
  const APP = process.env.APP_URL ?? 'http://localhost:5173'
  const foto = (n) => path.join(SALIDA, `10n6_${n}.jpg`)
    const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  const ev = (js) => a.evaluar(js)
  try {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await ev("window.__ruta?.getState().route != null").catch(() => false)); i++) await a.esp(1000)
    await a.esp(3000)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    // (El servidor de mentira del presupuesto compartido pone a la gente: eric / ana / luis. Con yo = null, un viaje sin compartir.)
    await ev("import('/src/dev/gastosFalsos.ts').then(() => true)").catch(() => false)
    const ponerGente = (yo) => (yo ? ev(`window.__gastosFalsos.reiniciar(); window.__modoCuentas?.poner('cada_uno'); window.__gastosFalsos.usar(${JSON.stringify(yo)}, ['eric', 'ana', 'luis']).then(() => true)`) : ev("window.__gastosFalsos.reiniciar(); window.__modoCuentas?.poner('cada_uno'); true"))
    const tienda = (modulo, nombre, js) =>
      ev(`(async () => {
        const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(${JSON.stringify(modulo)})))]
        const tiendas = []
        for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u))[${JSON.stringify(nombre)}])
        if (!tiendas.length) tiendas.push((await import(${JSON.stringify(modulo)}))[${JSON.stringify(nombre)}])
        for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); await (async (s) => { ${js} })(st) }
        return true
      })()`)
    await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useLoSuyo.ts'), import('/src/store/useMisReservas.ts'), import('/src/store/usePresupuestoUi.ts')]).then(() => true)")
    const abrirPresupuesto = async () => {
      await tienda('/src/store/usePresupuestoUi.ts', 'usePresupuestoUi', 's.getState().abrir()')
      await a.esp(1500)
    }
    const textoPresu = () => ev("(document.querySelector('[aria-labelledby=\"titulo-presupuesto\"]')?.innerText ?? 'SIN PANTALLA').replace(/\\s+/g, ' ')")

    /* 1j · sin gastos */
    await ev("window.__ruta.setState((s) => ({ reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, route: { ...s.route, arrivalPrecio: null, departurePrecio: null, gastosExtras: [] } })); true")
    await ponerGente('eric')
    await abrirPresupuesto()
    const vacio = await textoPresu()
    debe(/Ruta/.test(vacio) && /Aquí se irán añadiendo todos los gastos de tu ruta\./.test(vacio) && /Extras/.test(vacio) && /Añadir gasto/.test(vacio) && !/Todavía no hay gastos(?! del grupo)/.test(vacio), '1j', `el bloque «Ruta» vacío con su línea y debajo «Extras» (${vacio.slice(0, 160)})`)
    const orden = await ev("(() => { const r = document.querySelector('[data-blk=\"ruta\"]'); const e = document.querySelector('[data-blk=\"extras\"]'); return r && e ? [r.getBoundingClientRect().top < e.getBoundingClientRect().top, !r.querySelector('[style*=\"dashed\"]') && !r.className.includes('border-dashed'), Math.round(e.getBoundingClientRect().top - r.getBoundingClientRect().bottom)] : null })()")
    debe(orden && orden[0] && orden[1] && orden[2] >= 8, '1j', `«Ruta» arriba, «Extras» debajo, sin rayas y con aire entre bloques (${JSON.stringify(orden)})`)
    await a.captura(foto('presupuesto_vacio'))

    /* 1k · reserva solo para quien la paga */
    await ev(`window.__ruta.setState((s) => ({ reservations: [
      { id: 'r1', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo'], dateIso: '2026-11-12', dayNumber: null, time: '09:15', precio: { amount: 100, currency: 'EUR' }, paraQuien: ['eric'] },
      { id: 'r2', kind: 'entrada', refId: 'Panteón', name: 'Panteón', placeNames: ['Panteón'], dateIso: '2026-11-13', dayNumber: null, time: '10:00', precio: { amount: 60, currency: 'EUR' }, paraQuien: ['eric', 'ana'] },
    ] })); true`)
    await ponerGente('eric')
    await tienda('/src/store/useLoSuyo.ts', 'useLoSuyo', 's.setState({ mio: { vuelo: null, alojamiento: null }, grupo: {}, entradas: [] })')
    await a.esp(1500)
    const t1 = await textoPresu()
    debe(/Coliseo, Foro y Palatino[^|]*Solo tú/.test(t1) && /Del grupo\s*60/i.test(t1), '1k', `en el presupuesto de Eric: el Coliseo con «Solo tú» y «Del grupo» = 60 € (${t1.slice(0, 260)})`)
    debe(await ev("Boolean(document.querySelector('[data-solo-tu] svg'))"), '1k', 'con el icono del candado')
    await a.captura(foto('presupuesto_solo_tu'))
    // Cuentas del grupo
    await ev("(() => { const b = Array.from(document.querySelectorAll('[aria-labelledby=\"titulo-presupuesto\"] button')).find((x) => /Cuentas del grupo/.test(x.textContent || '')); b?.click(); return true })()")
    await a.esp(1200)
    const cu = await ev("(document.querySelector('[role=\"dialog\"][aria-labelledby=\"titulo-cuentas\"], [data-pantalla-cuentas]')?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ')")
    debe(/Total del grupo\s*60/.test(cu) && !/Total del grupo\s*160/.test(cu), '1k', `«Cuentas del grupo»: Total del grupo 60 €, no 160 € (${cu.slice(0, 200)})`)
    await a.captura(foto('cuentas_sin_lo_personal'))
    // Ana (invitada) no ve el Coliseo personal de Eric
    await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Atrás|Cerrar)$/.test(x.getAttribute('aria-label') || '')); b?.click(); return true })()")
    await ponerGente('ana')
    await a.esp(1500)
    const tAna = await textoPresu()
    debe(tAna === 'SIN PANTALLA' || !/Coliseo, Foro y Palatino/.test(tAna), '1k', 'Ana no ve el Coliseo personal de Eric en su presupuesto')
  } finally {
    a.cerrar()
  }
  await capturarDesign('Piezas/Cuentas Modo.dc.html', foto('design_presupuesto_vacio'), { despues: "(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => /^01 ·/.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); return true })()" }).catch(() => undefined)
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
