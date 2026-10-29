// Tanda 10N5 §6c · el vuelo y el alojamiento de cada uno, las entradas de todos en las cuentas, y la regla global de los nombres. No toca el motor de rutas.
//   APP_URL=http://localhost:5184 API_URL=http://localhost:8854 node scripts/destino/pruebaTanda10N5_cadauno.mjs
// 1. Lo puro (esbuild + Node): el reparto de las cuentas con los vuelos del administrador, quien pone el suyo sale del reparto, las entradas de un invitado para varios, los duplicados, los nombres.
// 2. La base de datos (PGlite con las migraciones reales, la 0049 incluida): lo suyo es suyo, quién lo tiene, los dos avisos, el administrador cambia el de otros, las entradas del grupo.
// 3. Código: lo que tiene que haber en las pantallas (textos de Design, nombres con nombreVisible).
// 4. La pantalla de verdad (hace falta Vite; con SIN_APP=1 se salta): capturas docs/dias/capturas_jutrip/10n5_cadauno_*.jpg y, al lado, la pieza de Design.
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

const { M } = await prepararSSR('scripts/destino/_10n5_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { aportacionesDelViaje, calcularCuentas, posiblesDuplicados, entreEfectivo, idsConLoSuyo, leerLoSuyo, lineasDeMiVuelo, paraQuienDelVuelo, nombreVisible, nombreDe, nombreDeLaPersona, nombreParaMostrar } = M

/* ═══════════════ 1. Lo puro ═══════════════ */
console.log('1. Lo puro')
const PER = [{ id: 'eric', nombre: 'Eric' }, { id: 'ana', nombre: 'Ana' }, { id: 'luis', nombre: 'Luis' }, { id: 'marta', nombre: 'Marta' }]
const TODOS = PER.map((p) => p.id)
{
  const entran = [
    { clave: 'llegada', nombre: 'Ida a Roma', precio: eur(400), tipo: 'vuelo' },
    { clave: 'vuelta', nombre: 'Vuelta a Madrid', precio: eur(200), tipo: 'vuelo' },
    { clave: 'aloj-d1', nombre: 'Hotel Roma', precio: eur(400), tipo: 'alojamiento' },
  ]
  const base = { gastos: [], reservas: [], adminId: 'eric', todos: TODOS, moneda: 'EUR', cambio: null, entran }
  const ap = aportacionesDelViaje(base)
  debe(ap.length === 3 && ap.filter((a) => a.origen === 'vuelo').length === 2, '6c-5', 'los vuelos del administrador AHORA SÍ entran en las cuentas (cambia lo de la 10N3)')
  debe(ap.every((a) => a.pagan.join() === 'eric' && a.entre.join() === TODOS.join()), '6c-5', 'el vuelo y el alojamiento del administrador se reparten entre todos por defecto')
  const para = aportacionesDelViaje({ ...base, entreDe: { llegada: ['eric', 'ana'], vuelta: ['eric', 'ana'] } })
  debe(para.find((a) => a.clave === 'llegada').entre.join() === 'eric,ana' && para.find((a) => a.clave === 'vuelta').entre.join() === 'eric,ana' && para.find((a) => a.clave === 'aloj-d1').entre.join() === TODOS.join(), '6c-5', 'para dos, el vuelo se reparte entre esos dos; el alojamiento sigue entre todos')
  const conAna = aportacionesDelViaje({ ...base, conVueloPropio: new Set(['ana']) })
  debe(conAna.find((a) => a.clave === 'llegada').entre.join() === 'eric,luis,marta' && conAna.find((a) => a.clave === 'aloj-d1').entre.join() === TODOS.join(), '6c-5', 'si Ana pone SU vuelo, sale del reparto del vuelo del administrador (y solo de ese: el alojamiento sigue igual)')
  const sinAloj = aportacionesDelViaje({ ...base, conAlojamientoPropio: new Set(['luis', 'marta']) })
  debe(sinAloj.find((a) => a.clave === 'aloj-d1').entre.join() === 'eric,ana' && sinAloj.find((a) => a.clave === 'llegada').entre.join() === TODOS.join(), '6c-5', 'si Luis y Marta ponen SU alojamiento, salen del reparto del alojamiento (y solo de ese)')
  const todosPropios = aportacionesDelViaje({ ...base, entreDe: { llegada: ['eric', 'ana'] }, conVueloPropio: new Set(['ana']) })
  debe(todosPropios.find((a) => a.clave === 'llegada') === undefined, '6c-5', 'si todos los demás ponen el suyo, el vuelo se queda en el administrador (lo pagó él) y, al ser solo suyo, es personal: no cuenta en las cuentas del grupo (10N6 §1k)')
  const c = calcularCuentas({ aportaciones: conAna, pagos: [], personas: PER })
  const ana = c.personas.find((p) => p.id === 'ana')
  // vuelos 600 entre eric/luis/marta = 200 cada uno; hotel 400 entre 4 = 100 cada uno.
  debe(ana.toca === 10000 && c.personas.find((p) => p.id === 'luis').toca === 29999 && c.personas.reduce((s, p) => s + p.saldo, 0) === 0, '6c-5', 'las cuentas se ajustan solas: Ana solo paga su parte del hotel (100 €), los demás casi 300 € (los céntimos que sobran los asume quien pagó), y todo cuadra')
  debe(entreEfectivo(null, TODOS, new Set(['ana']), 'eric').join() === 'eric,luis,marta', '6c-5', 'entreEfectivo: todos menos quien tiene lo suyo')
  debe(paraQuienDelVuelo({ cuentasEntre: { llegada: ['eric', 'ana'] } }).join() === 'eric,ana' && paraQuienDelVuelo({}) === null, '6c-5', 'el «¿Para quién es?» del vuelo sale de las cuentas del viaje (sin él: para todos)')
  // Las entradas de un invitado para varios
  const reservaAna = (extra = {}) => ({ id: 'res-ana', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo'], dateIso: '2026-11-26', dayNumber: null, time: '08:00', precio: eur(120), paraQuien: ['ana', 'eric', 'luis', 'marta'], ...extra })
  const conEntrada = aportacionesDelViaje({ ...base, entran: [], entradasDeInvitados: [{ userId: 'ana', reservas: [reservaAna()] }] })
  debe(conEntrada.length === 1 && conEntrada[0].pagan.join() === 'ana' && conEntrada[0].entre.length === 4 && conEntrada[0].centimos === 12000, '6c-entradas', 'Ana reserva el Coliseo para los cuatro: la pagó Ana y se reparte entre los cuatro')
  const cc = calcularCuentas({ aportaciones: conEntrada, pagos: [], personas: PER })
  debe(cc.personas.find((p) => p.id === 'ana').saldo === 9000 && cc.personas.find((p) => p.id === 'luis').saldo === -3000, '6c-entradas', 'Ana pagó 120 €: le deben 90 €; Luis debe 30 €')
  const soloEllaYDos = aportacionesDelViaje({ ...base, entran: [], entradasDeInvitados: [{ userId: 'ana', reservas: [reservaAna({ id: 'a2', paraQuien: ['ana'] }), reservaAna({ id: 'a3', paraQuien: ['ana', 'luis'], precio: eur(60) }), reservaAna({ id: 'a4', kind: 'excursion' })] }] })
  debe(soloEllaYDos.length === 1 && soloEllaYDos[0].entre.join() === 'ana,luis' && soloEllaYDos[0].centimos === 6000, '6c-entradas', 'las solo-para-ella no cuentan; la de dos cuenta entre los dos; una excursión no es una entrada')
  const sinPrecio = aportacionesDelViaje({ ...base, entran: [], entradasDeInvitados: [{ userId: 'ana', reservas: [reservaAna({ precio: null })] }] })
  debe(sinPrecio.length === 0, '6c-entradas', 'sin precio no se inventa nada')
  const dosVeces = aportacionesDelViaje({ ...base, entran: [], entradasDeInvitados: [{ userId: 'ana', reservas: [reservaAna(), reservaAna()] }] })
  debe(dosVeces.length === 1, '6c-entradas', 'la misma reserva dos veces cuenta una sola')
  const dup = posiblesDuplicados(aportacionesDelViaje({ ...base, entran: [], entradasDeInvitados: [{ userId: 'ana', reservas: [reservaAna()] }], gastos: [{ id: 'g1', tripId: 't', autorId: 'luis', nombre: 'Coliseo', precio: eur(120), ambito: 'grupo', estado: 'aceptado', pagadoPor: ['luis'], entre: [], decididoPor: null, creadoEn: '' }] }))
  debe(dup.length === 1 && dup[0].gasto === 'Coliseo', '6c-entradas', 'un gasto [Para todos] «Coliseo» de 120 € y la entrada de Ana de 120 € se AVISAN como posible duplicado (se siguen contando los dos)')
  const dupV = posiblesDuplicados(aportacionesDelViaje({ ...base, gastos: [{ id: 'g1', tripId: 't', autorId: 'luis', nombre: 'Billete de avión', precio: eur(400), ambito: 'grupo', estado: 'aceptado', pagadoPor: ['luis'], entre: [], decididoPor: null, creadoEn: '' }] }))
  debe(dupV.some((d) => d.linea === 'Ida a Roma'), '6c-5', 'un gasto «Billete de avión» de 400 € y el vuelo del administrador de 400 € se avisan como posible duplicado')
  // leer
  const mio = leerLoSuyo({ vuelo: { ida: { hora: '13:40', punto: 'Ciampino', precio: eur(80), codigo: 'fr 123' }, vuelta: { hora: 'malo' } }, alojamiento: { name: ' Trastevere ' } })
  debe(mio.vuelo.ida.hora === '13:40' && mio.vuelo.vuelta === null && mio.alojamiento.name === 'Trastevere' && leerLoSuyo(null).vuelo === null, '6c-3', 'lo de cada uno se lee sin fiarse de la forma')
  debe(lineasDeMiVuelo(mio.vuelo, { ida: 'mar 10', vuelta: 'sáb 14' })[0] === '✈ Ida · mar 10 · 13:40 · FR 123 · Ciampino', '6c-3', 'la línea del vuelo propio como en Design: «✈ Ida · mar 10 · 13:40 · …»')
  debe(idsConLoSuyo({ ana: { vuelo: true, alojamiento: false }, luis: { vuelo: false, alojamiento: true } }, 'vuelo').has('ana') && !idsConLoSuyo({ ana: { vuelo: true, alojamiento: false } }, 'alojamiento').has('ana'), '6c-3', 'quién tiene el vuelo y quién el alojamiento')
}

console.log('1b. Los nombres de las personas (regla global)')
{
  debe(nombreVisible('VIAJES') === 'Viajes' && nombreVisible('josé luis') === 'José Luis' && nombreVisible('  ana   MARÍA ') === 'Ana María' && nombreVisible(null) === '' && nombreVisible('ANA-LUISA') === 'Ana-Luisa', 'nombres', 'nombreVisible: «VIAJES» → «Viajes», «josé luis» → «José Luis», sin nombre → vacío')
  debe(nombreDe({ nombre: 'VIAJES' }) === 'Viajes' && nombreDe(null) === '' && nombreDeLaPersona({ nombre: 'ERIC' }) === 'Eric', 'nombres', 'nombreDe y nombreDeLaPersona (campana, franja, personas del viaje, gastos, RESERVAS) enseñan «Viajes»')
  debe(nombreParaMostrar('VIAJES') === 'Viajes' && nombreParaMostrar('') === 'Viajero', 'nombres', 'el perfil: «Hola, Viajes»; sin nombre, «Viajero»')
  const textos = await import('../../shared/avisos/textos.js')
  debe(textos.textoDelAviso({ tipo: 'unido', payload: { nombre: 'ANA' } }) === 'Ana se ha unido a tu viaje', 'nombres', 'los avisos del servidor también: «ANA se ha unido» → «Ana se ha unido»')
  debe(textos.textoDelAviso({ tipo: 'gasto_pendiente', payload: { autor: 'LUIS' } }) === 'Luis quiere añadir al presupuesto', 'nombres', 'y los de gastos')
  debe(textos.quienDelAviso({ tipo: 'unido', payload: { nombre: 'ANA' } }) === 'Ana', 'nombres', 'y la franja («Eric, Ana y Laura»)')
  // Los avisos nuevos de 6c
  debe(textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'vuelo_propio', quien: 'ANA' } }) === 'Ana ha puesto su propio vuelo.', '6c-3', 'aviso al administrador: «Ana ha puesto su propio vuelo.»')
  debe(textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'alojamiento_propio', quien: 'Ana' } }) === 'Ana ha puesto su propio alojamiento.', '6c-3', '…y el del alojamiento')
  debe(textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'vuelo_cambiado', quien: 'Eric', para: 'todos', suyo_cambiado: true } }) === 'Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.', '6c-2', 'aviso a cada persona: «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.»')
  debe(textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'alojamiento_cambiado', quien: 'Eric', para: 'ti', suyo_cambiado: true } }) === 'Eric ha puesto el alojamiento para ti. Se ha cambiado el tuyo.', '6c-2', '…y el del alojamiento, para ti')
  const f = textos.franjaDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'vuelo_propio', quien: 'Ana', detalle: 'Llegada a Roma · martes 10' } })
  debe(f.titulo === 'Ana ha puesto su propio vuelo.' && f.detalle === 'Llegada a Roma · martes 10' && f.icono === 'persona', '6c-3', 'la franja del administrador, como Design 05: «Ana ha puesto su propio vuelo.» / «Llegada a Roma · martes 10»')
  const g = textos.franjaDelAviso({ tipo: 'reserva_grupo', payload: { caso: 'vuelo_cambiado', quien: 'Eric', para: 'todos', suyo_cambiado: true } })
  debe(g.titulo === 'Eric ha puesto el vuelo para todos.' && g.detalle === 'Se ha cambiado el tuyo.', '6c-2', 'la franja de Ana, como Design 04: «Eric ha puesto el vuelo para todos.» / «Se ha cambiado el tuyo.»')
}

/* ═══════════════ 2. La base de datos ═══════════════ */
console.log('2. La base de datos (PGlite, migraciones reales hasta la 0049)')
{
  const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0038|0042|0048|0049|0053)_/
  const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
  const { q, como, servidor, nuevoUsuario } = bd
  debe(bd.aplicadas.includes('0049_lo_suyo_de_cada_uno.sql') && bd.aplicadas.includes('0048_avisos_borrado.sql'), 'migracion', 'la 0048 y la 0049 se aplican sin un error')
  const sql49 = sinComentarios(leer('supabase/migrations/0049_lo_suyo_de_cada_uno.sql'))
  debe(!/avisos_tipo_check/.test(sql49), 'migracion', 'la 0049 no toca la lista de tipos de aviso (usa `reserva_grupo`)')
  const textos = await import('../../shared/avisos/textos.js')
  const eric = await nuevoUsuario('eric@correo.es', false, 'ERIC GIL')
  const ana = await nuevoUsuario('ana@correo.es', false, 'ana')
  const luis = await nuevoUsuario('luis@correo.es', false, 'Luis')
  const marta = await nuevoUsuario('marta@correo.es', false, 'Marta')
  const ajeno = await nuevoUsuario('ajeno@correo.es', false, 'Ajeno')
  const ruta = (extra = {}) => JSON.stringify({ id: 'r1', destination: 'Roma', answers: { dateRange: { start: '2026-11-10', end: '2026-11-14' } }, days: [{ id: 'd1', dayNumber: 1, city: 'Roma', stops: [] }], ...extra })
  const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route) values ($1, $2::jsonb) returning id', [eric, ruta()]))[0].id)
  for (const u of [ana, luis]) await servidor(() => q('insert into public.trip_members (trip_id, user_id, invited_by) values ($1, $2, $3)', [viaje, u, eric]))
  const avisosDe = (uid) => servidor(() => q("select tipo, clave, payload from public.avisos where user_id = $1 and tipo = 'reserva_grupo' order by creado_en", [uid]))
  const lo = (uid, vuelo, aloj) => como(uid, () => q('insert into public.lo_suyo_del_viaje (trip_id, user_id, vuelo, alojamiento) values ($1, $2, $3::jsonb, $4::jsonb) on conflict (trip_id, user_id) do update set vuelo = excluded.vuelo, alojamiento = excluded.alojamiento', [viaje, uid, vuelo ? JSON.stringify(vuelo) : null, aloj ? JSON.stringify(aloj) : null]))

  // Ana pone su vuelo y su alojamiento.
  await lo(ana, { ida: { hora: '13:40', punto: 'Ciampino' }, vuelta: { hora: '20:30' } }, { name: 'Trastevere' })
  const deEric = await avisosDe(eric)
  debe(deEric.length === 2 && deEric.some((a) => a.payload.caso === 'vuelo_propio') && deEric.some((a) => a.payload.caso === 'alojamiento_propio'), '6c-3', 'al administrador le llegan los dos avisos (vuelo propio y alojamiento propio)')
  const av = deEric.find((a) => a.payload.caso === 'vuelo_propio')
  debe(textos.textoDelAviso({ tipo: av.tipo, payload: av.payload }) === 'Ana ha puesto su propio vuelo.' && av.payload.detalle === 'Llegada a Roma · martes 10', '6c-3', `«Ana ha puesto su propio vuelo.» con «${av.payload.detalle}» (el nombre guardado era «ana»)`)
  await lo(ana, { ida: { hora: '13:40', punto: 'Ciampino' }, vuelta: { hora: '20:30' } }, { name: 'Trastevere' })
  debe((await avisosDe(eric)).length === 2, '6c-3', 'guardar lo mismo otra vez no repite el aviso')
  await lo(ana, { ida: { hora: '14:10', punto: 'Ciampino' }, vuelta: { hora: '20:30' } }, { name: 'Trastevere' })
  debe((await avisosDe(eric)).length === 3, '6c-3', 'si cambia su vuelo, llega el aviso nuevo (es otra cosa)')
  debe((await avisosDe(ana)).length === 0 && (await avisosDe(luis)).length === 0, '6c-3', 'a nadie más le llega ese aviso')
  // Es suyo
  const deAnaParaLuis = await como(luis, () => q('select 1 from public.lo_suyo_del_viaje where trip_id = $1', [viaje]))
  const deAnaParaEric = await como(eric, () => q('select 1 from public.lo_suyo_del_viaje where trip_id = $1', [viaje]))
  debe(deAnaParaLuis.length === 0 && deAnaParaEric.length === 0, '6c-1', 'lo de Ana es suyo: ni Eric ni Luis lo leen (RLS)')
  let impide = false
  try {
    await como(ajeno, () => q('insert into public.lo_suyo_del_viaje (trip_id, user_id, vuelo) values ($1, $2, $3::jsonb)', [viaje, ajeno, JSON.stringify({ ida: { hora: '10:00' } })]))
  } catch {
    impide = true
  }
  debe(impide, '6c-1', 'quien no es del viaje no puede poner lo suyo')
  // Quién lo tiene
  const grupo = await como(eric, async () => (await q('select public.lo_suyo_del_grupo($1) as r', [viaje]))[0].r)
  debe(grupo.length === 1 && grupo[0].user_id === ana && grupo[0].vuelo === true && grupo[0].alojamiento === true && !('hora' in grupo[0]), '6c-4', 'el administrador ve QUIÉN tiene lo suyo (sí/no), sin los datos')
  let ajenoVe = true
  try {
    await como(ajeno, () => q('select public.lo_suyo_del_grupo($1)', [viaje]))
  } catch {
    ajenoVe = false
  }
  debe(!ajenoVe, '6c-1', 'quien no es del viaje no puede preguntar quién tiene lo suyo')
  // El administrador pone el vuelo para todos: se cambia el de Ana
  await como(eric, () => q("update public.trips set route = $2::jsonb where id = $1", [viaje, ruta({ arrivalFlightTime: '11:15', arrivalPointId: 'fiumicino', departureFlightTime: '18:05' })]))
  const aAna = (await avisosDe(ana)).filter((a) => a.payload.caso === 'vuelo_cambiado')
  const aLuis = (await avisosDe(luis)).filter((a) => a.payload.caso === 'vuelo_cambiado')
  debe(aAna.length === 1 && aLuis.length === 1, '6c-2', 'el administrador pone el vuelo para todos: cada persona recibe su aviso')
  debe(textos.textoDelAviso({ tipo: aAna[0].tipo, payload: aAna[0].payload }) === 'Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.', '6c-2', `«${textos.textoDelAviso({ tipo: aAna[0].tipo, payload: aAna[0].payload })}» (el nombre guardado era «ERIC GIL»)`)
  const lAna = await como(ana, () => q('select vuelo, alojamiento from public.lo_suyo_del_viaje where trip_id = $1', [viaje]))
  debe(lAna[0].vuelo === null && lAna[0].alojamiento !== null, '6c-2', 'su vuelo se cambia por el del administrador (lo suyo se borra) y su alojamiento, que no tocó, sigue')
  // Guardar otra cosa del viaje no repite
  await como(eric, () => q("update public.trips set route = $2::jsonb where id = $1", [viaje, ruta({ arrivalFlightTime: '11:15', arrivalPointId: 'fiumicino', departureFlightTime: '18:05', destination: 'Roma' })]))
  debe((await avisosDe(ana)).filter((a) => a.payload.caso === 'vuelo_cambiado').length === 1, '6c-2', 'guardar otra vez el mismo vuelo no repite el aviso')
  // Para algunos (solo Eric y Ana): Luis no recibe nada
  await lo(luis, { ida: { hora: '09:00' } }, null)
  await como(eric, () => q("update public.trips set route = $2::jsonb where id = $1", [viaje, ruta({ arrivalFlightTime: '12:00', arrivalPointId: 'fiumicino', departureFlightTime: '18:05', cuentasEntre: { llegada: [eric, ana], vuelta: [eric, ana] } })]))
  const nuevoAna = (await avisosDe(ana)).filter((a) => a.payload.caso === 'vuelo_cambiado')
  const nuevoLuis = (await avisosDe(luis)).filter((a) => a.payload.caso === 'vuelo_cambiado')
  debe(nuevoAna.length === 1 && nuevoAna[0].payload.para === 'ti', '6c-2', 'para dos (Eric y Ana): a Ana le llega «para ti» (10N6: varios cambios seguidos se juntan en un solo aviso, con lo último que quedó)')
  debe(nuevoLuis.length === 1, '6c-2', 'Luis, que no está en ese «¿Para quién es?», no recibe aviso nuevo')
  const lLuis = await como(luis, () => q('select vuelo from public.lo_suyo_del_viaje where trip_id = $1', [viaje]))
  debe(lLuis[0].vuelo !== null, '6c-2', 'y su vuelo propio NO se toca (el del administrador no es para él)')
  // Alojamiento del administrador
  await como(eric, () => q("update public.trips set bookings = $2::jsonb where id = $1", [viaje, JSON.stringify({ accommodationSelections: { d1: { name: 'Hotel Artemide' } } })]))
  const alAna = (await avisosDe(ana)).filter((a) => a.payload.caso === 'alojamiento_cambiado')
  debe(alAna.length === 1 && textos.textoDelAviso({ tipo: alAna[0].tipo, payload: alAna[0].payload }) === 'Eric ha puesto el alojamiento para todos. Se ha cambiado el tuyo.', '6c-2', 'el alojamiento del administrador para todos: «Eric ha puesto el alojamiento para todos. Se ha cambiado el tuyo.»')
  const lAna2 = await como(ana, () => q('select alojamiento from public.lo_suyo_del_viaje where trip_id = $1', [viaje]))
  debe(lAna2[0].alojamiento === null, '6c-2', 'y el alojamiento propio de Ana se cambia por el del administrador')
  // Las entradas de los invitados para varios
  const reserva = (extra = {}) => ({ id: 'res-ana', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', placeNames: ['Coliseo'], dateIso: '2026-11-11', time: '08:00', precio: eur(120), paraQuien: [ana, eric, luis], ...extra })
  await como(ana, () => q('insert into public.reservas_invitado (trip_id, user_id, reservas) values ($1, $2, $3::jsonb)', [viaje, ana, JSON.stringify([reserva(), reserva({ id: 'solo', paraQuien: [ana] }), reserva({ id: 'sin', paraQuien: undefined }), reserva({ id: 'exc', kind: 'excursion' })])]))
  const entradas = await como(eric, async () => (await q('select public.entradas_del_grupo($1) as r', [viaje]))[0].r)
  debe(entradas.length === 1 && entradas[0].user_id === ana && entradas[0].reservas.length === 2 && entradas[0].reservas.some((r) => r.id === 'res-ana'), '6c-entradas', 'el grupo ve las entradas de Ana con «¿Para quién es?» (las que no tienen lista y las excursiones no salen)')
  const entradasLuis = await como(luis, async () => (await q('select public.entradas_del_grupo($1) as r', [viaje]))[0].r)
  debe(entradasLuis.length === 1, '6c-entradas', 'cualquiera del viaje las ve (para las cuentas)')
  let ajenoEntradas = true
  try {
    await como(ajeno, () => q('select public.entradas_del_grupo($1)', [viaje]))
  } catch {
    ajenoEntradas = false
  }
  debe(!ajenoEntradas, '6c-entradas', 'quien no es del viaje no las ve')
}

/* ═══════════════ 3. Lo que hay en el código ═══════════════ */
console.log('3. Lo que hay en el código')
{
  const ui = sinComentarios(leer('src/components/route/reservas/LoDeCadaUno.tsx'))
  // (10N8, 7b) El texto sale de textoLoHaPuesto (src/lib/loSuyo.ts): «Lo ha puesto Eric» + «para Eric y para ti», siempre desde quien mira, en una sola pastilla.
  debe(/textoLoHaPuesto/.test(ui) && /Lo ha puesto /.test(sinComentarios(leer('src/lib/loSuyo.ts'))) && !/>\s*\{nombre\} · para/.test(ui), '6c-design', 'siempre «Lo ha puesto Eric · …», también en la 01')
  debe(/Poner el mío/.test(ui) && /Tuyo/.test(ui) && /Cambiar/.test(ui) && /En este vuelo/.test(ui) && /tiene su propio/.test(ui) && !/Pon el tuyo/.test(ui), '6c-design', '(10N10, Vuelo Reservas 06-07) los textos nuevos: «Poner el mío», «Tuyo», «Cambiar», «En este vuelo», «tiene su propio vuelo»; ya no «Pon el tuyo»')
  const panel = sinComentarios(leer('src/components/route/ReservasPanel.tsx'))
  debe(/LoDeCadaUnoParaElInvitado/.test(panel) && /QuienVaEnLoDelAdmin/.test(panel), '6c-1', 'RESERVAS enseña lo de cada uno al invitado y a quién cubre al administrador')
  const cuentas = sinComentarios(leer('src/hooks/useCuentasDelGrupo.ts'))
  debe(/'llegada' \|\| l\.abrir\.tipo === 'vuelta'/.test(cuentas) && /entradasDeInvitados/.test(cuentas), '6c-5', 'las cuentas incluyen los vuelos y las entradas de los invitados')
  const srv = sinComentarios(leer('src/lib/cuentasGrupo.ts'))
  debe(!/Los billetes de avión NO/.test(srv), '6c-5', 'ya no dice que los billetes no entran')
  const add = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(/const paraQuienVisible = grupo\.compartido\b/.test(add), '6c-entradas', 'quien reserva en el viaje de otro también dice «¿Para quién es?»')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
