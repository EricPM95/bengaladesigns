// Tanda 10N10 (agente C) · el presupuesto con el interruptor «Mi cuenta | Cuenta conjunta / Cuenta del grupo», las reglas de personas y las hojas para apuntar dinero.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N10_cuentas.mjs      (SIN_APP=1 salta la pantalla)
// 1. Lo puro (esbuild + Node): la cuenta según las personas, el ejemplo del vuelo de 180 €, 2→3 personas al céntimo, las líneas de a dónde va el dinero.
// 2. El código: nada de lo que se quita sigue en pie. 3. La migración 0067 en un Postgres de verdad (PGlite). 4. La pantalla (capturas docs/dias/capturas_jutrip/10n10_cuentas_*.jpg y la de Design al lado).
import fs from 'node:fs'
import path from 'node:path'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (process.env.DEBUG) console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 90))
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const eur = (amount) => ({ amount, currency: 'EUR' })

const { M } = await prepararSSR('scripts/destino/_10n10_c_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { construirPresupuesto, aportacionesDelViaje, calcularCuentas, cuentaDelViaje, entreSinDecir, nombreDeLaCuentaComun, partesDeUnaPersona, miParteDeLoComun, resolverModo, lineasDeDestino, textoDelBoton, preguntaParaQuien, tituloAnadirGasto, preguntaDeReserva } = M

/* ═══════════════ 1. Lo puro ═══════════════ */
console.log('1. Lo puro')
{
  // 5a · la cuenta según las personas
  debe(cuentaDelViaje(1, false) === 'solo' && cuentaDelViaje(1, true) === 'solo', '5a', 'una persona: sola (sin interruptor)')
  debe(cuentaDelViaje(2, false) === 'conjunta', '5a', 'dos personas (pareja, dos amigos…): cuenta conjunta')
  debe(cuentaDelViaje(4, true) === 'conjunta' && cuentaDelViaje(2, true) === 'conjunta', '5a', 'una familia, sean las que sean: cuenta conjunta')
  debe(cuentaDelViaje(3, false) === 'grupo' && cuentaDelViaje(6, false) === 'grupo', '5a', 'tres o más que no son familia: cuenta del grupo')
  debe(nombreDeLaCuentaComun('conjunta') === 'Cuenta conjunta' && nombreDeLaCuentaComun('grupo') === 'Cuenta del grupo', '5b', 'el interruptor dice «Cuenta conjunta» / «Cuenta del grupo»')
  const ra = (companion) => ({ answers: { companion }, modoCuentas: 'cada_uno' })
  debe(resolverModo(ra('couple'), 2).modo === 'conjunta' && resolverModo(ra('group'), 3).modo === 'cada_uno' && resolverModo(ra('family'), 5).modo === 'conjunta' && resolverModo(ra('solo'), 1).modo === 'solo', '5a', 'resolverModo sigue la regla nueva, no el modoCuentas elegido a mano')
  debe(resolverModo({ answers: { companion: 'group' }, modoCuentas: 'conjunta' }, 3).modo === 'cada_uno' && !resolverModo(ra('couple'), 3).pendiente, '5a', 'lo elegido a mano ya no cuenta y nunca hay nada pendiente de preguntar')

  // El ejemplo de Eric: vuelo de 180 €, para Eric y Viajes, pagó Eric.
  const TODOS = ['eric', 'viajes']
  const rutaVuelo = { id: 'r1', destination: 'Roma', origin: 'Madrid', answers: { companion: 'couple', dateRange: { start: '2026-11-10', end: '2026-11-14' } }, arrivalPrecio: eur(180), departurePrecio: null, days: [{ id: 'd1', dayNumber: 1, city: 'Roma', stops: [] }] }
  const entrada = (yoId, entreDe, route = rutaVuelo, extra = {}) => ({
    route: { ...route, cuentasEntre: entreDe, gastosExtras: [] },
    reservations: [],
    accommodationSelections: {},
    transportBookings: {},
    insuranceBooking: null,
    rentalVehicleBooking: null,
    esimPrecios: {},
    moneda: 'EUR',
    cambio: null,
    pago: true,
    compartido: { gastos: [], extrasDeLaRutaMios: yoId === 'eric', reparto: { yoId, adminId: 'eric', modo: 'conjunta', esInvitado: yoId !== 'eric', todos: TODOS, porDefecto: TODOS, entreDe, ...extra } },
  })
  const entranDe = (p) => p.bloques.flatMap((b) => b.lineas).concat(p.ocultas).filter((l) => l.abrir.tipo === 'llegada').map((l) => ({ clave: l.id, nombre: l.nombre, precio: l.precio, tipo: 'vuelo' }))
  const cuentasDe = (p, entreDe) => {
    const aportaciones = aportacionesDelViaje({ gastos: [], reservas: [], adminId: 'eric', todos: TODOS, porDefecto: TODOS, modo: 'conjunta', pagadoPorDe: { llegada: ['eric'] }, moneda: 'EUR', cambio: null, entran: entranDe(p), entreDe })
    return { aportaciones, cuentas: calcularCuentas({ aportaciones, pagos: [], personas: [{ id: 'eric', nombre: 'Eric' }, { id: 'viajes', nombre: 'Viajes' }], todos: TODOS }) }
  }
  const para2 = { llegada: ['eric', 'viajes'] }
  const pE = construirPresupuesto(entrada('eric', para2))
  debe(pE.total.amount === 180 && pE.loTuyo.length === 0, '6', `vuelo de 180 € para Eric y Viajes: la cuenta conjunta suma 180 € (${pE.total.amount}) y nada es solo suyo`)
  const { aportaciones: apE, cuentas: cE } = cuentasDe(pE, para2)
  debe(miParteDeLoComun(apE, 'eric') === 9000 && miParteDeLoComun(apE, 'viajes') === 9000, '6', '«Tu parte de la cuenta conjunta» es 90 € para cada uno (no 180)')
  const deuda = cE.pendientes[0]
  debe(cE.pendientes.length === 1 && deuda.deudorId === 'viajes' && deuda.acreedorId === 'eric' && deuda.centimos === 9000, '6', '«Viajes le debe 90 € a Eric»')
  debe(cE.personas.reduce((t, p) => t + p.saldo, 0) === 0, '5a', 'los saldos suman cero')
  const pV = construirPresupuesto(entrada('viajes', para2))
  debe(pV.total.amount === 180, '6', 'Viajes también ve 180 € en la cuenta conjunta')
  const soloEric = { llegada: ['eric'] }
  const pS = construirPresupuesto(entrada('eric', soloEric))
  debe(pS.total.amount === 0 && pS.sumaLoTuyo.amount === 180 && pS.loTuyo.length === 1, '6', `solo para Eric: 180 € en su Mi cuenta y 0 en la conjunta (${pS.total.amount} / ${pS.sumaLoTuyo.amount})`)
  const { aportaciones: apS } = cuentasDe(pS, soloEric)
  debe(apS.length === 0 && miParteDeLoComun(apS, 'viajes') === 0, '6', 'y no cuenta en las cuentas ni toca nada a Viajes')
  const pVS = construirPresupuesto(entrada('viajes', soloEric))
  debe(pVS.total.amount === 0 && pVS.sumaLoTuyo.amount === 0, '6', 'Viajes no ve nada de eso en su presupuesto')

  // Mi cuenta = lo mío + mi parte de lo común: cena de 80 € (pagó Eric, entre los dos) + regalo de 40 € solo suyo.
  const gasto = (id, autorId, amount, o = {}) => ({ id, tripId: 't', autorId, nombre: id, precio: eur(amount), ambito: 'grupo', estado: 'aceptado', pagadoPor: [autorId], entre: [], decididoPor: null, creadoEn: '', ...o })
  const eG = entrada('eric', {})
  eG.route = { ...rutaVuelo, arrivalPrecio: null }
  eG.compartido.gastos = [gasto('cena', 'eric', 80), gasto('regalo', 'eric', 40, { ambito: 'mio', pagadoPor: [] }), gasto('taxi', 'viajes', 31)]
  const pG = construirPresupuesto(eG)
  debe(pG.total.amount === 111 && pG.sumaLoTuyo.amount === 40, '5b', `lo común 80 + 31 = 111 € y lo mío 40 € (${pG.total.amount} / ${pG.sumaLoTuyo.amount})`)
  const apG = aportacionesDelViaje({ gastos: eG.compartido.gastos, reservas: [], adminId: 'eric', todos: TODOS, porDefecto: TODOS, modo: 'conjunta', moneda: 'EUR', cambio: null })
  const parteEric = miParteDeLoComun(apG, 'eric')
  debe(parteEric === 5550 + 0 && partesDeUnaPersona(apG, 'eric').length === 2, '5b', `mi parte de lo común 55,50 € (${parteEric}): el importe de arriba en Mi cuenta = 40 + 55,50 = 95,50 €`)
  debe(miParteDeLoComun(apG, 'eric') + miParteDeLoComun(apG, 'viajes') === 11100, '5b', 'las dos partes suman exactamente lo común (111 €)')
  const bloquesMios = M.bloquesDeLoMio(pG.loTuyo, 'EUR')
  debe(bloquesMios.length === 1 && bloquesMios[0].id === 'extras' && bloquesMios[0].suma.amount === 40, '5b', 'Mi cuenta: un bloque «Extras» con mi gasto (40 €)')

  // 5a · de 2 a 3 personas, al céntimo.
  const pareja = { answers: { companion: 'group' }, cuentaConjuntaCon: ['eric', 'ana'] }
  const tres = ['eric', 'ana', 'luis']
  debe(entreSinDecir(pareja, 'grupo', tres).join() === 'eric,ana', '5a', 'al pasar a tres (no familia), lo apuntado sin «entre quién» se queda entre los dos de antes')
  debe(entreSinDecir(pareja, 'conjunta', ['eric', 'ana']).join() === 'eric,ana' && entreSinDecir({ answers: { companion: 'family' }, cuentaConjuntaCon: ['eric', 'ana'] }, 'conjunta', ['eric', 'ana', 'luis']).join() === 'eric,ana,luis', '5a', 'una familia no congela nada: sigue siendo entre todos')
  const porDefecto = entreSinDecir(pareja, 'grupo', tres)
  const g3 = [gasto('hotel', 'eric', 100.01), gasto('cena3', 'luis', 90, { entre: tres, pagadoPor: ['luis'] })]
  const ap3 = aportacionesDelViaje({ gastos: g3, reservas: [], adminId: 'eric', todos: tres, porDefecto, modo: 'cada_uno', moneda: 'EUR', cambio: null })
  const c3 = calcularCuentas({ aportaciones: ap3, pagos: [], personas: tres.map((id) => ({ id, nombre: id })), todos: tres })
  const toca = (id) => c3.personas.find((p) => p.id === id).toca
  debe(toca('eric') === 8001 && toca('luis') === 3000, '5a', `lo de antes (100,01 €) entre Eric y Ana, no entre tres; la cena nueva (90 €) entre los tres (Eric ${toca('eric')}, Ana ${toca('ana')}, Luis ${toca('luis')})`)
  debe(toca('ana') === 5000 + 3000 && toca('luis') === 3000, '5a', `Ana: 50 + 30 y Luis solo 30 (${toca('ana')} / ${toca('luis')})`)
  debe(c3.personas.reduce((t, p) => t + p.saldo, 0) === 0 && c3.personas.reduce((t, p) => t + p.pagado, 0) === c3.personas.reduce((t, p) => t + p.toca, 0), '5a', 'al céntimo: los saldos suman cero y lo pagado = lo que toca')
  // Si alguien sale: lo apuntado no cambia (los saldos siguen con su nombre).
  const sale = calcularCuentas({ aportaciones: ap3, pagos: [], personas: tres.map((id) => ({ id, nombre: id })), todos: ['eric', 'ana'] })
  debe(sale.personas.some((p) => p.id === 'luis') && sale.personas.reduce((t, p) => t + p.saldo, 0) === 0, '5a', 'si Luis sale, lo ya apuntado no cambia y sus deudas siguen en las cuentas')

  // 6 · los textos y la línea pequeña
  debe(preguntaParaQuien('vuelo') === '¿Para quién es este vuelo?' && preguntaParaQuien('alojamiento') === '¿Para quién es el alojamiento?' && preguntaParaQuien('entradas') === '¿Para quién son las entradas?' && preguntaParaQuien('freetour') === '¿Para quién son las entradas?' && preguntaParaQuien('excursion') === '¿Para quién es la excursión?' && preguntaParaQuien('coche') === '¿Para quién es el coche?' && preguntaParaQuien('gasto') === null, '6', 'las preguntas de «¿Para quién…?» de cada hoja, con los textos del prompt; el gasto suelto no pregunta')
  debe(preguntaDeReserva('entrada') === '¿Para quién son las entradas?' && preguntaDeReserva('alojamiento') === '¿Para quién es el alojamiento?', '6', 'y la función antigua usa los mismos textos')
  debe(tituloAnadirGasto('mia') === 'Añadir a Mi cuenta' && tituloAnadirGasto('conjunta') === 'Añadir a la cuenta conjunta' && tituloAnadirGasto('grupo') === 'Añadir a la cuenta del grupo', '6', 'los títulos de «Añadir gasto» según la pestaña')
  const L = (marcados, precio, cuenta, permiso = 'admin') => lineasDeDestino({ solo: false, marcados, yoId: 'eric', precio, cuenta, permiso, nombreAdmin: 'Eric' })
  debe(L(['eric', 'ana'], eur(180), 'conjunta')[0] === '90 € cada uno · Va a la cuenta conjunta', '6', '«90 € cada uno · Va a la cuenta conjunta»')
  debe(L(['eric', 'ana', 'luis'], eur(180), 'grupo')[0] === '60 € cada uno · Va a la cuenta del grupo', '6', '«60 € cada uno · Va a la cuenta del grupo»')
  debe(L(['eric'], eur(50), 'conjunta').join('|') === 'Va a Mi cuenta|Solo lo ves tú', '6', '«Va a Mi cuenta» y debajo «Solo lo ves tú»')
  debe(L(['eric', 'ana'], eur(180), 'conjunta', 'recomendar')[1] === 'Se lo enviamos a Eric' && L(['eric', 'ana'], eur(180), 'conjunta', 'editar')[1] === 'Entra directo en el presupuesto', '6', 'quien solo recomienda: «Se lo enviamos a Eric»; quien edita: «Entra directo en el presupuesto»')
  const B = (marcados, permiso) => textoDelBoton({ normal: 'Guardar el vuelo', solo: false, marcados, yoId: 'eric', permiso, nombreAdmin: 'Eric' })
  debe(B(['eric', 'ana'], 'recomendar') === 'Enviar a Eric' && B(['eric'], 'recomendar') === 'Guardar el vuelo' && B(['eric', 'ana'], 'editar') === 'Guardar el vuelo', '6', 'el botón dice «Enviar a Eric» solo si recomienda algo para varios; lo suyo entra directo')
  debe(lineasDeDestino({ solo: true, marcados: [], yoId: 'eric', precio: eur(10), cuenta: 'conjunta', permiso: 'admin', nombreAdmin: 'Eric' }).length === 0, '6', 'viajando solo: ninguna línea ni pregunta')
}

/* ═══════════════ 2. El código ═══════════════ */
console.log('2. Lo que hay en el código')
{
  const todo = ['src/components/route/presupuesto/PantallaPresupuesto.tsx', 'src/components/route/presupuesto/HojaAnadirGasto.tsx', 'src/components/route/presupuesto/CuentaModo.tsx', 'src/components/route/presupuesto/BloqueDinero.tsx', 'src/components/route/presupuesto/ParaQuien.tsx', 'src/components/route/presupuesto/PantallaCuentas.tsx', 'shared/avisos/textos.js', 'src/components/avisos/abrirAviso.ts'].map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/¿Cómo lleváis las cuentas\?/.test(todo), '5a', 'no queda «¿Cómo lleváis las cuentas?» en ninguna pantalla ni aviso')
  debe(!/ha cambiado las cuentas|Han cambiado las cuentas/.test(todo), '5a', 'ni el aviso «Eric ha cambiado las cuentas…»')
  debe(!/¿A qué cuenta lo sumamos\?|Para todos\]|\[Para mí|¿Para quién has comprado la entrada\?|¿Para quién has reservado/.test(todo), '6', 'ni «¿A qué cuenta lo sumamos?», ni [Para todos] / [Para mí], ni «¿Para quién has comprado…?»')
  debe(!/Lo tuyo|Solo lo ves tú\b.*Del grupo|por persona|data-por-persona|EtiquetaPorPersona|Tu parte ·/.test(sinComentarios(leer('src/components/route/presupuesto/PantallaPresupuesto.tsx'))), '5b', 'el presupuesto ya no tiene «Lo tuyo», «por persona» ni la pastilla «Tu parte»')
  debe(!fs.existsSync('src/components/route/presupuesto/LoTuyo.tsx') && !fs.existsSync('src/store/useModoCuentasUi.ts'), '5a', 'borrados LoTuyo.tsx y useModoCuentasUi.ts')
  const pres = sinComentarios(leer('src/components/route/presupuesto/PantallaPresupuesto.tsx'))
  debe(!/route\.destination\} · \$\{|rangoDelViaje/.test(pres) && /Presupuesto\s*<\/span>/.test(pres), '4', 'el título del presupuesto va solo, sin «Roma · 10 – 14 ago · Eric y Ana»')
  debe(/Tu parte de \{tipoCuenta === 'grupo' \? 'la cuenta del grupo' : 'la cuenta conjunta'\}: \{textoParte\}/.test(pres) && /data-tu-parte-linea/.test(pres), '5b', 'la línea amarilla «Tu parte de la cuenta conjunta: …» (o «de la cuenta del grupo»), tocable')
  debe(/!enMia && hayComunes && <TarjetaCuentas/.test(pres), '5b', '«¿Quién debe a quién?» solo en las pestañas comunes y cuando hay gastos comunes')
  const gasto = sinComentarios(leer('src/components/route/presupuesto/HojaAnadirGasto.tsx'))
  debe(/BloqueDinero/.test(gasto) && !/PastillaElegir/.test(gasto), '4', 'la hoja de gasto usa cuadrados (BloqueDinero) y no pastillas')
  debe(!/PastillaElegir/.test(sinComentarios(leer('src/components/route/presupuesto/ParaQuien.tsx'))), '4', '«¿Para quién…?» de toda la app pasa por los cuadrados')
  const sql = leer('supabase/migrations/0067_cuentas_segun_personas.sql')
  debe(/create or replace function public\.modo_cuentas_del_viaje/.test(sql) && !/modoCuentas/.test(sql.replace(/--.*$/gm, '')), '5a', 'la migración 0067 sustituye modo_cuentas_del_viaje sin mirar el modoCuentas elegido a mano')
  const f = (n) => fs.readdirSync('supabase/migrations').filter((x) => x.startsWith(n))
  debe(f('0067_').length === 1, 'migracion', 'una sola migración 0067')
}

/* ═══════════════ 3. La migración 0067 (PGlite) ═══════════════ */
console.log('3. La migración 0067 en un Postgres de verdad')
{
  const { crearBaseDePrueba } = await import('./_baseDeDatosPrueba.mjs')
  const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0038|0040|0042|0043|0048|0049|0053|0055|0061|0064|0067)_/
  const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
  const { q, como, servidor, nuevoUsuario } = bd
  debe(bd.aplicadas.some((x) => x.startsWith('0067_')), 'migracion', 'la 0067 se aplica sin errores sobre las anteriores')
  try {
    await bd.db.exec('reset role')
    await bd.db.exec(leer('supabase/migrations/0067_cuentas_segun_personas.sql'))
    debe(true, 'migracion', 'la 0067 se puede pegar dos veces')
  } catch (e) {
    debe(false, 'migracion', `la 0067 repetida falla: ${String(e.message).slice(0, 160)}`)
    await bd.db.exec('rollback').catch(() => undefined)
  }
  const modo = async (route) => (await servidor(() => q('select public.modo_cuentas_del_viaje($1::jsonb) as m', [JSON.stringify(route)])))[0].m
  debe((await modo({ answers: { companion: 'couple' } })) === 'conjunta', '5a', 'sin dato de personas, una pareja es conjunta (como antes)')
  debe((await modo({ answers: { companion: 'couple' }, cuentasPersonas: 3 })) === 'cada_uno', '5a', 'tres personas aunque dijeran «pareja»: del grupo')
  debe((await modo({ answers: { companion: 'group' }, cuentasPersonas: 2 })) === 'conjunta', '5a', 'dos amigos: conjunta')
  debe((await modo({ answers: { companion: 'family' }, cuentasPersonas: 5 })) === 'conjunta', '5a', 'una familia de cinco: conjunta')
  debe((await modo({ answers: { companion: 'group' }, cuentasPersonas: 4, modoCuentas: 'conjunta' })) === 'cada_uno', '5a', 'el modoCuentas elegido a mano ya no cuenta')
  debe((await modo({ answers: { companion: 'couple' }, cuentasPersonas: 2, modoCuentas: 'cada_uno' })) === 'conjunta', '5a', '…tampoco al revés')
  debe((await modo({ answers: {}, cuentasPersonas: 1 })) === 'cada_uno', '5a', 'una sola persona: no es cuenta conjunta')
  const preg = (await servidor(() => q('select public.cuentas_por_preguntar($1::jsonb, 3) as p', [JSON.stringify({ answers: { companion: 'group' } })])))[0].p
  debe(preg === false, '5a', 'ya no se pregunta «¿Cómo lleváis las cuentas?» al unirse alguien')

  // Lo apartado de una cuenta conjunta vuelve a trips.bookings cuando entra una tercera persona (no familia).
  const eric = await nuevoUsuario('eric10@correo.es', false, 'ERIC GIL')
  const ana = await nuevoUsuario('ana10@correo.es', false, 'Ana')
  const ruta = (extra) => JSON.stringify({ id: 'r1', destination: 'Roma', answers: { companion: 'group', dateRange: { start: '2026-11-10', end: '2026-11-14' } }, days: [], ...extra })
  const res = { id: 'e1', kind: 'entrada', refId: 'Panteon', name: 'Panteón', placeNames: ['Panteon'], dateIso: '2026-11-12', time: '09:00', precio: eur(25), paraQuien: [eric] }
  const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route, bookings) values ($1, $2::jsonb, $3::jsonb) returning id', [eric, ruta({ cuentasPersonas: 2 }), '{}']))[0].id)
  await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, ana, eric]))
  await como(eric, () => q('update public.trips set bookings = $2::jsonb where id = $1', [viaje, JSON.stringify({ reservations: [res] })]))
  const apartada = await como(eric, async () => (await q('select reservas from public.reservas_privadas_admin where trip_id = $1', [viaje]))[0]?.reservas ?? [])
  debe(apartada.length === 1, '5a', 'con dos personas, lo «Solo para mí» del administrador se aparta')
  await como(eric, () => q("update public.trips set route = route || '{\"cuentasPersonas\":3}'::jsonb where id = $1", [viaje]))
  const vuelve = await como(ana, async () => (await q('select bookings from public.trips where id = $1', [viaje]))[0].bookings)
  debe((vuelve.reservations ?? []).some((r) => r.id === 'e1'), '5a', 'cuando entra la tercera persona (cuenta del grupo), lo apartado vuelve a las reservas del viaje')
  await bd.db.close?.()
}

console.log('3b. Sellar cuentasPersonas en la ruta no genera «Ha cambiado el viaje» (con las migraciones de avisos de la 0065)')
{
  const { crearBaseDePrueba } = await import('./_baseDeDatosPrueba.mjs')
  const MIG = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0038|0040|0041|0042|0043|0046|0048|0049|0051|0053|0054|0055|0058|0059|0061|0064|0065|0067)_/
  const bd = await crearBaseDePrueba({ migraciones: MIG, alFallar: (m) => debe(false, 'migracion', m) })
  const { q, como, servidor, nuevoUsuario } = bd
  const eric = await nuevoUsuario('eric10b@correo.es', false, 'ERIC GIL')
  const ana = await nuevoUsuario('ana10b@correo.es', false, 'Ana')
  const luis = await nuevoUsuario('luis10b@correo.es', false, 'Luis')
  const ruta = JSON.stringify({ id: 'r1', destination: 'Roma', answers: { companion: 'group', dateRange: { start: '2026-11-10', end: '2026-11-14' } }, days: [{ id: 'd1', dayNumber: 1, city: 'Roma', stops: [{ id: 's1', name: 'Coliseo' }] }] })
  const viaje = await como(eric, async () => (await q('insert into public.trips (traveler_id, route, bookings) values ($1, $2::jsonb, $3::jsonb) returning id', [eric, ruta, '{}']))[0].id)
  await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, ana, eric]))
  const cuantos = (uid, tipo) => servidor(async () => (await q('select count(*)::int as n from public.avisos where user_id = $1 and tipo = $2', [uid, tipo]))[0].n)
  const antes = await cuantos(ana, 'viaje_cambiado')
  await como(eric, () => q("update public.trips set route = route || '{\"cuentasPersonas\":2,\"cuentaConjuntaCon\":[\"a\",\"b\"]}'::jsonb where id = $1", [viaje]))
  await como(eric, () => q("update public.trips set route = route || '{\"cuentasPersonas\":3}'::jsonb where id = $1", [viaje]))
  debe((await cuantos(ana, 'viaje_cambiado')) === antes, '5a', 'sellar cuántas personas hay (dos veces) no genera ningún aviso «Ha cambiado el viaje» ni lo junta con otro')
  await servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'editar')", [viaje, luis, eric]))
  debe((await cuantos(eric, 'cuentas_modo')) === 0 && (await cuantos(ana, 'cuentas_modo')) === 0, '5a', 'ni aviso de «ha cambiado las cuentas» al entrar un tercero')
  const unido = await servidor(async () => (await q("select payload from public.avisos where user_id = $1 and tipo = 'unido' order by creado_en desc limit 1", [eric]))[0]?.payload)
  debe(unido && unido.pregunta_cuentas === false, '5a', 'el aviso «se ha unido» ya no lleva la pregunta de las cuentas')
  // Un cambio de verdad (quitar la parada) sigue avisando, aunque haya sellos entre medias.
  await como(eric, () => q("update public.trips set route = jsonb_set(route, '{days,0,stops}', '[]'::jsonb) || '{\"cuentasPersonas\":3}'::jsonb where id = $1", [viaje]))
  debe((await cuantos(ana, 'viaje_cambiado')) === antes + 1, '5a', 'y un cambio de verdad de la ruta sí avisa (1 aviso)')
  await bd.db.close?.()
}

if (process.env.SIN_APP === '1') {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
  process.exit(fallos.length ? 1 : 0)
}

/* ═══════════════ 4. La pantalla de verdad ═══════════════ */
console.log('4. La pantalla de verdad')
const { conViaje, modulo, SALIDA } = await import('./_10n5_comun.mjs')
const foto = (n) => path.join(SALIDA, `10n10_cuentas_${n}.jpg`)
const a = await conViaje({ ancho: 390, alto: 844, version: 'pago' })
const ev = (js) => a.evaluar(js)
const RUTA = modulo('/src/store/useRouteStore.ts')
const PRES = modulo('/src/store/usePresupuestoUi.ts')
const VIAJE = modulo('/src/store/useViajeCompartido.ts')
try {
  await ev("import('/src/dev/gastosFalsos.ts').then(() => true)")
  const compañia = (companion, extra = {}) => ev(`${RUTA}.then((m) => { m.useRouteStore.setState((s) => ({ route: { ...s.route, modoCuentas: undefined, cuentasPersonas: undefined, cuentaConjuntaCon: undefined, answers: { ...s.route.answers, companion: '${companion}', companionAdults: undefined, companionChildrenAges: undefined, companionGroupSize: undefined, ...${JSON.stringify(extra)} } } })); return true })`)
  const sinGente = () => ev(`window.__gastosFalsos.reiniciar(); ${VIAJE}.then((m) => { m.useViajeCompartido.getState().poner({ gente: [] }); return true })`)
  const gente = (yo, miembros) => ev(`window.__gastosFalsos.usar('${yo}', ${JSON.stringify(miembros)}).then(() => true)`)
  const abrirPres = async () => {
    await ev(`${PRES}.then((m) => { m.usePresupuestoUi.getState().abrir(); return true })`)
    await a.esp(1100)
  }
  const cerrarPres = async () => {
    await ev(`${PRES}.then((m) => { m.usePresupuestoUi.getState().cerrar(); return true })`)
    await a.esp(300)
  }
  const pres = () => ev("(document.querySelector('[aria-labelledby=\"titulo-presupuesto\"]')?.innerText ?? 'SIN PRESUPUESTO').replace(/\\s+/g, ' ')")
  const hay = (sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const clic = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
  const pestana = async (id) => {
    await clic(`[data-pestana-cuenta="${id}"]`)
    await a.esp(500)
  }

  // ── una persona ──
  await compañia('solo')
  await sinGente()
  await abrirPres()
  let t = await pres()
  debe(!(await hay('[data-interruptor-cuenta]')) && /Total del viaje/i.test(t) && !/Mi cuenta|Cuenta conjunta|por persona|Tu parte|Quién debe a quién/i.test(t), '5a', `una persona: «Total del viaje», sin interruptor (${t.slice(0, 90)})`)
  debe(!/Roma ·/.test(t) && /^Presupuesto/.test(t), '4', 'el título va solo, sin la línea del destino y las fechas')
  await a.captura(foto('01_solo'))
  await cerrarPres()

  // ── dos personas: Mi cuenta | Cuenta conjunta ──
  await compañia('couple')
  await gente('eric', ['eric', 'ana'])
  await ev('window.__gastosFalsos.sembrarComoElDiseno(); true')
  await gente('eric', ['eric', 'ana'])
  await a.esp(700)
  await abrirPres()
  t = await pres()
  const orden = await ev("Array.from(document.querySelectorAll('[data-pestana-cuenta]')).map((e) => e.getAttribute('data-pestana-cuenta') + ':' + e.textContent.trim()).join()")
  debe(orden === 'mia:Mi cuenta,comun:Cuenta conjunta', '5b', `el interruptor: «Mi cuenta» a la izquierda y «Cuenta conjunta» (${orden})`)
  debe(!/DEL GRUPO|MI CUENTA\s*\d/i.test(t.replace(/Mi cuenta Cuenta conjunta/i, '')) && !/Lo tuyo|por persona/.test(t), '5b', 'fuera el texto pequeño «DEL GRUPO / MI CUENTA» encima del importe, y fuera «Lo tuyo» y «por persona»')
  const leyenda = await ev("document.querySelector('[data-leyenda]')?.innerText.replace(/\\s+/g, ' ') ?? ''")
  debe(/ · \d/.test(leyenda) || leyenda === '', '5b', `la leyenda de «Mi cuenta» lleva importes («${leyenda}»)`)
  await a.captura(foto('02_mi_cuenta_conjunta'))
  const apuntado = JSON.parse(await ev(`${RUTA}.then((m) => { const r = m.useRouteStore.getState().route; return JSON.stringify({ n: r.cuentasPersonas ?? null, con: r.cuentaConjuntaCon ?? null }) })`))
  debe(apuntado.n === 2 && Array.isArray(apuntado.con) && apuntado.con.length === 2, '5a', `la app del administrador apunta en la ruta cuántas personas hay (2) y quiénes son, para repartir bien si entra una tercera (${JSON.stringify(apuntado)})`)
  await pestana('comun')
  t = await pres()
  debe(await hay('[data-tarjeta-cuentas]'), '5b', '«¿Quién debe a quién?» en la cuenta conjunta')
  debe(/¿Quién debe a quién\?/.test(t) && !/Cuentas del grupo/.test(t), '5b', 'con ese título')
  const leyenda2 = await ev("document.querySelector('[data-leyenda]')?.innerText.replace(/\\s+/g, ' ') ?? ''")
  debe(/ · \d/.test(leyenda2), '5b', `y la leyenda con importes («${leyenda2}»)`)
  await a.captura(foto('03_cuenta_conjunta'))
  await pestana('mia')
  debe(!(await hay('[data-tarjeta-cuentas]')), '5b', '«¿Quién debe a quién?» nunca en «Mi cuenta»')

  // ── Añadir gasto desde Mi cuenta y desde la cuenta conjunta ──
  await clic('[data-anadir-gasto]')
  await a.esp(700)
  let h = await ev("(document.querySelector('#hoja-anadir-gasto')?.closest('[role=\"dialog\"]')?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ')")
  debe(/Añadir a Mi cuenta/.test(h) && !(await hay('[data-persona-cuadrada]')) && !/¿Para quién|¿A qué cuenta/.test(h), '6', `desde «Mi cuenta»: título «Añadir a Mi cuenta», solo concepto y precio (${h.slice(0, 120)})`)
  await a.captura(foto('04_anadir_mi_cuenta'))
  await ev("(() => { const b = document.querySelector('[aria-label=\"Cerrar\"]'); b?.click(); return true })()")
  await a.esp(500)
  await pestana('comun')
  await clic('[data-anadir-gasto]')
  await a.esp(700)
  await a.escribir('[data-gasto-nombre]', 'Taxi')
  await a.escribir('input[aria-label="¿Cuánto ha costado en total?"]', '30')
  await a.esp(400)
  h = await ev("(document.querySelector('#hoja-anadir-gasto')?.closest('[role=\"dialog\"]')?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ')")
  debe(/Añadir a la cuenta conjunta/.test(h) && /¿Cuánto ha costado en total\?/.test(h) && /¿Quién lo ha pagado\?/.test(h) && !/Solo para algunos/.test(h), '6', `desde la conjunta: título, precio y «¿Quién lo ha pagado?» en cuadrados, sin «Solo para algunos» (${h.slice(0, 160)})`)
  debe((await ev("document.querySelectorAll('[data-persona-cuadrada]').length")) >= 2 && /15 € cada uno · Va a la cuenta conjunta/.test(h), '4', 'son cuadrados, y la línea pequeña dice «15 € cada uno · Va a la cuenta conjunta»')
  await a.captura(foto('05_anadir_conjunta'))
  await clic('[data-gasto-enviar]')
  await a.esp(900)
  await cerrarPres()

  // ── tres personas: Cuenta del grupo ──
  await compañia('group', { companionGroupSize: 3 })
  await gente('eric', ['eric', 'ana', 'luis'])
  await a.esp(700)
  await abrirPres()
  const orden3 = await ev("Array.from(document.querySelectorAll('[data-pestana-cuenta]')).map((e) => e.textContent.trim()).join()")
  debe(orden3 === 'Mi cuenta,Cuenta del grupo', '5a', `tres que no son familia: «Mi cuenta | Cuenta del grupo» (${orden3})`)
  await pestana('comun')
  debe(await hay('[data-tarjeta-cuentas]'), '5b', '«¿Quién debe a quién?» también en la cuenta del grupo')
  await a.captura(foto('06_cuenta_grupo'))
  await pestana('mia')
  const linea = await ev("document.querySelector('[data-tu-parte-linea]')?.innerText.replace(/\\s+/g, ' ') ?? ''")
  debe(/^Tu parte de la cuenta del grupo: \d/.test(linea), '5b', `la línea amarilla de «Mi cuenta» del grupo: «${linea}»`)
  await a.captura(foto('07_mi_cuenta_grupo'))
  await clic('[data-tu-parte-linea]')
  await a.esp(600)
  debe(await hay('[data-titulo-tu-parte]') && (await ev("document.querySelectorAll('[data-tu-parte-fila]').length")) > 0, '5b', 'tocarla abre el detalle de mi parte, con los gastos que la forman')
  await a.captura(foto('08_tu_parte'))
  await clic('[data-tu-parte-fila]')
  await a.esp(700)
  debe(await hay('#hoja-anadir-gasto'), '5b', 'y desde ahí se toca cada gasto para corregirlo (se abre su hoja)')
  await a.captura(foto('09_editar_gasto'))
  await ev("(() => { const b = document.querySelector('[aria-label=\"Cerrar\"]'); b?.click(); return true })()")
  await a.esp(500)
  await pestana('comun')
  await clic('[data-anadir-gasto]')
  await a.esp(700)
  h = await ev("(document.querySelector('#hoja-anadir-gasto')?.closest('[role=\"dialog\"]')?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ')")
  debe(/Añadir a la cuenta del grupo/.test(h) && /Solo para algunos/.test(h), '6', 'en la cuenta del grupo: «Añadir a la cuenta del grupo» y la opción pequeña «Solo para algunos»')
  await clic('[data-solo-para-algunos] button')
  await a.esp(500)
  debe((await ev("document.querySelectorAll('[data-personas-cuadradas=\"solo-para-algunos\"] [data-persona-cuadrada]').length")) === 3, '6', '«Solo para algunos» abre los nombres para marcar, en cuadrados')
  await a.captura(foto('10_solo_para_algunos'))
  await cerrarPres()
} finally {
  await a.cerrar()
}

if (process.env.SIN_DESIGN !== '1') {
  const { capturarDesign } = await import('./capturaDesign.mjs')
  const ir = (re) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => ${re}.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
  for (const n of ['01', '02', '03', '05', '09']) {
    await capturarDesign('Piezas/Presupuesto Compartido.dc.html', foto(`design_${n}`), { despues: ir(`/^${n} ·/`) }).catch((e) => console.log('  (sin captura de Design)', n, e.message))
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
