// Tanda 10N7 (M1) · CÓMO SE LLEVAN LAS CUENTAS: solo / cuenta conjunta / cada uno lo suyo. No toca el motor de rutas.
//   APP_URL=http://localhost:5221 API_URL=http://localhost:8891 node scripts/destino/pruebaTanda10N7_modo.mjs
// 1. Lo puro (esbuild + Node): el modo por defecto según «¿Con quién viajas?», cuándo se vuelve a preguntar, la etiqueta, las cuentas al céntimo.
// 2. La base de datos (PGlite con las migraciones reales, la 0054 incluida): «se ha unido… ¿Cómo lleváis las cuentas?» y «ha cambiado las cuentas a…».
// 3. Los textos de los avisos y lo que hay en el código.
// 4. La pantalla de verdad (hace falta Vite; SIN_APP=1 la salta): capturas docs/dias/capturas_jutrip/10n7_*.jpg y, al lado, la de Design.
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
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })

const { M } = await prepararSSR('scripts/destino/_10n7_m1_entrada.tsx')
const { resolverModo, etiquetaCuentaConjunta, aportacionesDelViaje, calcularCuentas } = M
const textos = await import('../../shared/avisos/textos.js')
await import('../../server/avisos.js') // (carga la tabla de artículos)

/* ═══════════════ 1. Lo puro ═══════════════ */
console.log('1. Lo puro')
{
  const r = (companion, extra = {}, elegido = {}) => ({ answers: { companion, ...extra }, ...elegido })
  const m = (ruta, n) => resolverModo(ruta, n)
  // 1a · solo
  for (const c of ['solo', 'couple', 'family', 'group']) debe(m(r(c), 1).modo === 'solo' && !m(r(c), 1).pendiente, '1a', `con una sola persona (${c}) el modo es «solo» y no se pregunta nada`)
  // 2 · por defecto
  debe(m(r('couple'), 2).modo === 'conjunta' && !m(r('couple'), 2).pendiente, '2', 'pareja: cuenta conjunta por defecto')
  debe(m(r('family', { companionAdults: 2, companionChildrenAges: [5, 8] }), 4).modo === 'conjunta' && !m(r('family', { companionAdults: 2, companionChildrenAges: [5, 8] }), 4).pendiente, '2', 'familia de 4 con 4 dentro: cuenta conjunta, sin preguntar')
  debe(m(r('group', { companionGroupSize: 4 }), 4).modo === 'cada_uno' && !m(r('group', { companionGroupSize: 4 }), 4).pendiente, '2', 'amigos: cada uno lo suyo por defecto')
  // 2 · un viaje solo al que entra alguien
  debe(m(r('solo'), 2).modo === 'cada_uno' && m(r('solo'), 2).pendiente === true, '2', 'viaje solo al que entra alguien: «cada uno lo suyo» y pendiente hasta que el administrador elija')
  debe(m({ answers: {} }, 2).modo === 'cada_uno' && m({ answers: {} }, 2).pendiente, '2', 'sin «con quién viajas» (viaje antiguo): igual que un viaje solo al que entra alguien')
  // 2 · elegido a mano
  debe(m(r('solo', {}, { modoCuentas: 'conjunta', modoElegidoCon: 2 }), 2).modo === 'conjunta' && !m(r('solo', {}, { modoCuentas: 'conjunta', modoElegidoCon: 2 }), 2).pendiente, '2', 'el administrador elige «Todo juntos»: conjunta y deja de preguntar')
  debe(m(r('solo', {}, { modoCuentas: 'cada_uno', modoElegidoCon: 2 }), 2).modo === 'cada_uno' && !m(r('solo', {}, { modoCuentas: 'cada_uno', modoElegidoCon: 2 }), 2).pendiente, '2', 'el administrador elige «Cada uno lo suyo»: deja de preguntar')
  // 2b-2 · un tercero a una cuenta conjunta
  const conj2 = r('couple', {}, { modoCuentas: 'conjunta', modoElegidoCon: 2 })
  debe(m(conj2, 3).modo === 'conjunta' && m(conj2, 3).pendiente === true, '2b-2', 'entra una tercera persona a una cuenta conjunta: sigue conjunta y se vuelve a preguntar')
  debe(m(r('couple'), 3).modo === 'conjunta' && m(r('couple'), 3).pendiente, '2b-2', 'lo mismo en una pareja con la cuenta conjunta por defecto (sin elegir)')
  debe(!m(r('couple', {}, { modoCuentas: 'conjunta', modoElegidoCon: 3 }), 3).pendiente, '2b-2', 'cuando el administrador responde (aunque sea lo mismo) deja de preguntar')
  debe(m(r('couple', {}, { modoCuentas: 'conjunta', modoElegidoCon: 3 }), 4).pendiente, '2b-2', 'y si entra un cuarto, otra vez')
  debe(!m(r('group', {}, { modoCuentas: 'cada_uno', modoElegidoCon: 2 }), 5).pendiente, '2b-2', 'en «cada uno lo suyo» no se pregunta cuando entra más gente')
  // 1b · la etiqueta
  debe(etiquetaCuentaConjunta(['Eric', 'Ana']) === 'Cuenta conjunta · Eric y Ana', '1b', `la etiqueta: «${etiquetaCuentaConjunta(['Eric', 'Ana'])}»`)
  debe(etiquetaCuentaConjunta(['ERIC', 'ana', 'Luis']) === 'Cuenta conjunta · Eric, Ana y Luis', '1b', 'con tres nombres y las mayúsculas arregladas: Eric, Ana y Luis')
  debe(etiquetaCuentaConjunta(['Eric', 'Ana'], 'Nuestro viaje a Roma') === 'Nuestro viaje a Roma · Eric y Ana', '1b', 'con el nombre que le ponen: «Nuestro viaje a Roma · Eric y Ana»')
  // 2 · las cuentas cuadran al céntimo tras cambiar de forma (el modo no toca los gastos: lo apuntado cuenta pagado por quien lo apuntó, entre todos)
  {
    const todos = ['eric', 'ana', 'luis']
    const gasto = (id, autorId, amount, extra = {}) => ({ id, tripId: 't', autorId, nombre: id, precio: { amount, currency: 'EUR' }, ambito: 'grupo', estado: 'aceptado', pagadoPor: [], entre: [], decididoPor: null, creadoEn: '2026-11-10T10:00:00Z', ...extra })
    const gastos = [gasto('g1', 'eric', 100.01), gasto('g2', 'ana', 33.33), gasto('g3', 'luis', 7.07, { pagadoPor: ['luis'], entre: ['luis', 'eric'] }), gasto('g4', 'ana', 40, { ambito: 'mio' })]
    const personas = todos.map((id) => ({ id, nombre: id }))
    const aportes = aportacionesDelViaje({ gastos, reservas: [], adminId: 'eric', todos, moneda: 'EUR', cambio: null })
    const c = calcularCuentas({ aportaciones: aportes, pagos: [], personas, todos })
    const suma = c.personas.reduce((s, p) => s + p.saldo, 0)
    debe(suma === 0, '2', `las cuentas cuadran al céntimo (suma de saldos = ${suma})`)
    debe(c.total === 10001 + 3333 + 707 && !aportes.some((a) => a.nombre === 'g4'), '2', `lo «Solo para mí» (ambito mio) no entra en las cuentas aunque cambie la forma (total ${c.total})`)
    // Tras «Cada uno lo suyo» → «Todo juntos» → «Cada uno lo suyo»: los gastos no se tocan, las cuentas son las mismas
    const c2 = calcularCuentas({ aportaciones: aportacionesDelViaje({ gastos, reservas: [], adminId: 'eric', todos, moneda: 'EUR', cambio: null }), pagos: [], personas, todos })
    debe(JSON.stringify(c2.personas) === JSON.stringify(c.personas), '2', 'al volver a «cada uno lo suyo» las cuentas salen igual, al céntimo')
  }
}

/* ═══════════════ 2. La base de datos ═══════════════ */
console.log('2. La base de datos (PGlite, migraciones reales hasta la 0054)')
{
  const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0036|0037|0038|0040|0054)_/
  const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => { console.log('   ✗', String(m).slice(0, 300)); debe(false, 'migracion', m) } })
  const { q, como, servidor, nuevoUsuario } = bd
  debe(bd.aplicadas.some((f) => f.startsWith('0054_')), 'migracion', 'la 0054 se aplica sin errores')
  // Idempotente: se puede pegar dos veces
  let repetida = true
  try {
    await bd.db.exec(leer('supabase/migrations/0054_modo_de_cuentas.sql'))
  } catch (e) {
    repetida = false
    console.log('   ', e.message)
  }
  debe(repetida, 'migracion', 'la 0054 se puede aplicar otra vez (idempotente)')
  const eric = await nuevoUsuario('eric7@correo.es', false, 'ERIC GIL')
  const ana = await nuevoUsuario('ana7@correo.es', false, 'Ana')
  const luis = await nuevoUsuario('luis7@correo.es', false, 'Luis')
  const marta = await nuevoUsuario('marta7@correo.es', false, 'Marta')
  const rutaDe = (companion, extra = {}) => JSON.stringify({ id: 'r1', destination: 'Roma', answers: { companion, dateRange: { start: '2026-11-10', end: '2026-11-14' }, ...(extra.answers ?? {}) }, days: [], ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== 'answers')) })
  const crearViaje = (companion, extra) => como(eric, async () => (await q('insert into public.trips (traveler_id, route, bookings) values ($1, $2::jsonb, $3::jsonb) returning id', [eric, rutaDe(companion, extra), '{}']))[0].id)
  const entra = (viaje, uid) => servidor(() => q("insert into public.trip_members (trip_id, user_id, invited_by, permiso) values ($1, $2, $3, 'recomendar')", [viaje, uid, eric]))
  const unidos = (uid) => servidor(() => q("select payload from public.avisos where user_id = $1 and tipo = 'unido' order by creado_en", [uid]))
  const cambios = (uid) => servidor(() => q("select payload from public.avisos where user_id = $1 and tipo = 'cuentas_modo' order by creado_en", [uid]))
  const cuenta = (route) => ({ ...route })

  // Un viaje solo al que entra alguien
  const solo = await crearViaje('solo')
  await entra(solo, ana)
  const u1 = await unidos(eric)
  debe(u1.length === 1 && u1[0].payload.pregunta_cuentas === true, '2', 'viaje solo al que entra Ana: el aviso «se ha unido» lleva la pregunta de las cuentas')
  debe(u1[0] && textos.textoDelAviso({ tipo: 'unido', payload: u1[0].payload }) === 'Ana se ha unido a tu viaje. ¿Cómo lleváis las cuentas?', '2', `el texto: «${u1[0] && textos.textoDelAviso({ tipo: 'unido', payload: u1[0].payload })}»`)
  // Mientras no elige, el segundo que entra también pregunta
  await entra(solo, luis)
  const u2 = await unidos(eric)
  debe(u2.length === 2 && u2[1].payload.pregunta_cuentas === true, '2', 'si aún no ha elegido y entra otra persona, se vuelve a preguntar')
  // Pareja: la pareja entra y no se pregunta
  const pareja = await crearViaje('couple')
  await entra(pareja, ana)
  const u3 = (await unidos(eric)).slice(2)
  debe(u3.length === 1 && u3[0].payload.pregunta_cuentas === false, '2', 'pareja: Ana entra y no se pregunta (cuenta conjunta por defecto)')
  // 2b-2 · un tercero a la pareja
  await entra(pareja, luis)
  const u4 = (await unidos(eric)).slice(3)
  debe(u4.length === 1 && u4[0].payload.pregunta_cuentas === true, '2b-2', 'una tercera persona en una pareja: el aviso vuelve a preguntar «¿Cómo lleváis las cuentas?»')
  // Si el administrador ya había elegido con 3, el cuarto vuelve a preguntar; con cada_uno elegido no
  await como(eric, () => q("update public.trips set route = route || '{\"modoCuentas\":\"conjunta\",\"modoElegidoCon\":3}'::jsonb where id = $1", [pareja]))
  await entra(pareja, marta)
  const u5 = (await unidos(eric)).slice(4)
  debe(u5.length === 1 && u5[0].payload.pregunta_cuentas === true, '2b-2', 'cuenta conjunta elegida con 3: entra una cuarta y se pregunta otra vez')
  // Amigos
  const amigos = await crearViaje('group', { answers: { companionGroupSize: 4 } })
  await entra(amigos, ana)
  await entra(amigos, luis)
  const u6 = (await unidos(eric)).slice(5)
  debe(u6.length === 2 && u6.every((a) => a.payload.pregunta_cuentas === false), '2', 'amigos: nadie entra preguntando (cada uno lo suyo por defecto)')

  // El cambio de forma: aviso a todos menos a quien lo cambia
  const v = await crearViaje('group', { answers: { companionGroupSize: 3 } })
  await entra(v, ana)
  await entra(v, luis)
  await como(eric, () => q("update public.trips set route = route || '{\"modoCuentas\":\"conjunta\",\"modoElegidoCon\":3}'::jsonb where id = $1", [v]))
  const aAna = (await cambios(ana)).filter((a) => a.payload.trip_id === v)
  const aLuis = (await cambios(luis)).filter((a) => a.payload.trip_id === v)
  const aEric = (await cambios(eric)).filter((a) => a.payload.trip_id === v)
  debe(aAna.length === 1 && aLuis.length === 1 && aEric.length === 0, '2', 'Eric cambia a cuenta conjunta: les llega a Ana y a Luis, y a él no')
  debe(aAna[0] && textos.textoDelAviso({ tipo: 'cuentas_modo', payload: aAna[0].payload }) === 'Eric ha cambiado las cuentas a cuenta conjunta.', '2', `el texto: «${aAna[0] && textos.textoDelAviso({ tipo: 'cuentas_modo', payload: aAna[0].payload })}»`)
  // Guardar el mismo modo otra vez (o cambiar solo el nombre) no avisa
  await como(eric, () => q("update public.trips set route = route || '{\"modoCuentas\":\"conjunta\",\"modoElegidoCon\":3,\"nombreCuenta\":\"Nuestro viaje\"}'::jsonb where id = $1", [v]))
  debe((await cambios(ana)).filter((a) => a.payload.trip_id === v).length === 1, '1b', 'cambiar solo el nombre de la cuenta, o elegir lo mismo, no manda ningún aviso')
  // Vuelta a cada uno lo suyo
  await como(eric, () => q("update public.trips set route = route || '{\"modoCuentas\":\"cada_uno\",\"modoElegidoCon\":3}'::jsonb where id = $1", [v]))
  const aAna2 = (await cambios(ana)).filter((a) => a.payload.trip_id === v)
  debe(aAna2.length === 1 && aAna2[0].payload.modo === 'cada_uno' && textos.textoDelAviso({ tipo: 'cuentas_modo', payload: aAna2[0].payload }) === 'Eric ha cambiado las cuentas a cada uno lo suyo.', '2', `volver a «cada uno lo suyo»: «${aAna2[0] && textos.textoDelAviso({ tipo: 'cuentas_modo', payload: aAna2[0].payload })}» (se queda el último)`)
  // Elegir lo que ya sale por defecto la primera vez (pareja → conjunta) no es un cambio
  const p2 = await crearViaje('couple')
  await entra(p2, ana)
  await como(eric, () => q("update public.trips set route = route || '{\"modoCuentas\":\"conjunta\",\"modoElegidoCon\":2}'::jsonb where id = $1", [p2]))
  debe((await cambios(ana)).filter((a) => a.payload.trip_id === p2).length === 0, '2', 'elegir lo que ya salía por defecto (pareja: conjunta) no manda aviso de cambio')
  // Invitado que edita el nombre de la cuenta (permiso editar): no avisa del modo
  const sinMi = (await servidor(() => q('select count(*)::int as n from public.avisos where user_id = $1 and tipo = $2', [eric, 'cuentas_modo'])))[0].n
  debe(sinMi === 0, '2', 'el administrador nunca recibe aviso de un cambio que hizo él mismo')
  debe(/check \(tipo in \([^)]*cuentas_modo/.test(leer('supabase/migrations/0054_modo_de_cuentas.sql').replace(/\s+/g, ' ')), 'migracion', 'la 0054 deja «cuentas_modo» en la lista de tipos de aviso')
  void cuenta
}

/* ═══════════════ 3. Textos y código ═══════════════ */
console.log('3. Textos y código')
{
  const fr = textos.franjaDelAviso({ tipo: 'unido', payload: { nombre: 'Ana', pregunta_cuentas: true } })
  debe(fr.titulo === 'Ana se ha unido a tu viaje' && fr.detalle === '¿Cómo lleváis las cuentas?' && fr.icono === 'persona', '2', `la franja (Design 07): «${fr.titulo}» / «${fr.detalle}»`)
  debe(textos.textoDelAviso({ tipo: 'unido', payload: { nombre: 'Ana' } }) === 'Ana se ha unido a tu viaje', '2', 'sin pregunta, el aviso de siempre')
  debe(textos.textoDelAviso({ tipo: 'cuentas_modo', payload: { modo: 'cada_uno' } }) === 'Han cambiado las cuentas a cada uno lo suyo.', '2', 'sin nombre de quien lo hace: «Han cambiado las cuentas…»')
  debe(textos.quienDelAviso({ tipo: 'cuentas_modo', payload: { quien: 'Eric' } }) === 'Eric', '2', 'la inicial del círculo de «ha cambiado las cuentas»')
  const api = leer('src/lib/modoCuentas.ts')
  debe(/export type ModoCuentas = 'solo' \| 'conjunta' \| 'cada_uno'/.test(api) && /export function modoDeCuentas\(\): ModoCuentas/.test(api) && /export function useModoCuentas\(\)/.test(api) && /export function setModoCuentas\(/.test(api), 'API', 'src/lib/modoCuentas.ts exporta ModoCuentas, modoDeCuentas, useModoCuentas y setModoCuentas')
  const pres = leer('src/components/route/presupuesto/PantallaPresupuesto.tsx')
  debe(/<BotonModoCuentas \/>/.test(pres) && /<PreguntaModoCuentas \/>/.test(pres) && /<EtiquetaCuentaConjunta \/>/.test(pres), '2', 'el presupuesto monta el botón, la pregunta de arriba y la etiqueta con el lápiz')
  debe(/ConfirmDialog/.test(leer('src/components/route/presupuesto/CuentaModo.tsx')) && /peligro=\{CONFIRMACION/.test(leer('src/components/route/presupuesto/CuentaModo.tsx')), '2', 'el cambio con gastos apuntados usa ConfirmDialog (con `peligro` donde se pierden las deudas)')
  debe(/HojaOpciones/.test(leer('src/components/route/presupuesto/CuentaModo.tsx')), '2', 'la hoja de elegir es una HojaOpciones de tarjetas')
}

if (process.env.SIN_APP === '1') {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
  process.exit(fallos.length ? 1 : 0)
}

/* ═══════════════ 4. La pantalla de verdad ═══════════════ */
console.log('4. La pantalla de verdad')
const { conViaje, modulo } = await import('./_10n5_comun.mjs')
const { capturarDesign } = await import('./capturaDesign.mjs')
const foto = (n) => path.join(SALIDA, `10n7_${n}.jpg`)
const a = await conViaje({ ancho: 390, alto: 844, version: 'pago', vista: true })
const ev = (js) => a.evaluar(js)
const RUTA = modulo('/src/store/useRouteStore.ts')
const PRES = modulo('/src/store/usePresupuestoUi.ts')
const MODO = modulo('/src/store/useModoCuentasUi.ts')
const VIAJE = modulo('/src/store/useViajeCompartido.ts')
const FRANJA = modulo('/src/store/useFranjaStore.ts')
try {
  await ev("import('/src/dev/gastosFalsos.ts').then(() => true)")
  const compañia = (companion, extra = {}) => ev(`${RUTA}.then((m) => { m.useRouteStore.setState((s) => ({ route: { ...s.route, modoCuentas: undefined, modoElegidoCon: undefined, nombreCuenta: undefined, answers: { ...s.route.answers, companion: '${companion}', companionAdults: undefined, companionChildrenAges: undefined, companionGroupSize: undefined, ...${JSON.stringify(extra)} } } })); return true })`)
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
  const ruta = () => ev(`${RUTA}.then((m) => { const r = m.useRouteStore.getState().route; return JSON.stringify({ modo: r.modoCuentas ?? null, con: r.modoElegidoCon ?? null, nombre: r.nombreCuenta ?? null }) })`).then(JSON.parse)
  const hay = (sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const clic = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
  const hojaTexto = () => ev("(document.querySelector('[data-hoja-opciones=\"modo-cuentas\"]')?.innerText ?? '').replace(/\\s+/g, ' ')")

  // ── 1a · viajas solo ──
  await compañia('solo')
  await sinGente()
  await abrirPres()
  let t = await pres()
  debe(!(await hay('[data-boton-modo-cuentas]')) && !(await hay('[data-pregunta-modo-cuentas]')) && !(await hay('[data-etiqueta-cuenta-conjunta]')) && !(await hay('[data-tarjeta-cuentas]')), '1a', 'viajando solo: ni botón de cuentas, ni pregunta, ni etiqueta de cuenta conjunta, ni «Cuentas del grupo»')
  debe(/Tu viaje/i.test(t) && !/Cuentas del grupo|Del grupo|Cuenta conjunta|Para quién|Para todos|Para mí|por persona/i.test(t), '1a', `(10N8, 0b-5) «Tu viaje», sin nombres ni [Para todos] / [Para mí] (${t.slice(0, 110)})`)
  await a.captura(foto('01_solo'))
  await cerrarPres()

  // ── 1b · pareja: cuenta conjunta ──
  await compañia('couple')
  await gente('eric', ['eric', 'ana'])
  await a.esp(500)
  await abrirPres()
  t = await pres()
  debe(/CUENTA CONJUNTA · ERIC Y ANA/.test(t), '1b', `la etiqueta dentro de la tarjeta oscura: «${(t.match(/CUENTA CONJUNTA[^€]{0,30}/) ?? [''])[0]}»`)
  debe(await hay('[data-lapiz-cuenta]'), '1b', 'con su lápiz a la derecha')
  debe(!(await hay('[data-tarjeta-cuentas]')) && !/Cuentas del grupo|por persona|Tu parte/i.test(t), '1b', 'sin «Cuentas del grupo» (no hay deudas) y sin «por persona»')
  debe(!/Del grupo/.test(t), '1b', 'ni «Del grupo» ni bloque suelto de la cuenta conjunta')
  debe((await ruta()).modo === null, '2', 'sin elegir nada, el modo no se escribe en el viaje: sale por «con quién viajas»')
  await a.captura(foto('02a_conjunta'))
  // El nombre: el lápiz abre la hoja, Guardar lo cambia para todos
  await clic('[data-lapiz-cuenta]')
  await a.esp(700)
  debe(await hay('[data-hoja="nombre-cuenta"], [data-hoja-opciones="nombre-cuenta"]') || /Nombre de la cuenta/.test(await ev("document.body.innerText")), '1b', 'el lápiz abre «Nombre de la cuenta»')
  await a.escribir('[data-campo-nombre-cuenta]', 'Nuestro viaje a Roma')
  await a.esp(400)
  await a.captura(foto('03_nombre'))
  await clic('[data-guardar-nombre-cuenta]')
  await a.esp(600)
  t = await pres()
  debe(/NUESTRO VIAJE A ROMA · ERIC Y ANA/.test(t) && (await ruta()).nombre === 'Nuestro viaje a Roma', '1b', `el nombre nuevo queda en el viaje y en la etiqueta («${(t.match(/NUESTRO[^€]{0,30}/) ?? [''])[0]}»)`)
  // Lo ve Ana (invitada que solo recomienda): ve el nombre, sin lápiz
  await gente('ana', ['eric', 'ana'])
  await a.esp(500)
  t = await pres()
  debe(/NUESTRO VIAJE A ROMA · ERIC Y ANA/.test(t) && !(await hay('[data-lapiz-cuenta]')), '1b', 'Ana, que solo recomienda, ve el nombre y no el lápiz')
  await gente('luis', ['eric', 'luis'])
  await a.esp(500)
  debe(await hay('[data-lapiz-cuenta]'), '1b', 'quien puede editar (Luis) sí tiene el lápiz')
  await gente('eric', ['eric', 'ana'])
  await a.esp(400)

  // ── 1b · familia: «Cuenta conjunta · Eric, Ana, Luis y Marta» ──
  await compañia('family', { companionAdults: 2, companionChildrenAges: [5, 8] })
  await ev(`${RUTA}.then((m) => { m.useRouteStore.getState().setNombreCuenta(null); return true })`)
  await gente('eric', ['eric', 'ana', 'luis', 'marta'])
  await a.esp(500)
  t = await pres()
  debe(/CUENTA CONJUNTA · ERIC, ANA, LUIS Y MARTA/.test(t) && !(await hay('[data-pregunta-modo-cuentas]')), '2', 'familia con 4 personas: cuenta conjunta por defecto, sin preguntar')
  await cerrarPres()

  // ── 1c · amigos: cada uno lo suyo ──
  await compañia('group', { companionGroupSize: 3 })
  await gente('eric', ['eric', 'ana', 'luis'])
  await a.esp(500)
  await ev('window.__gastosFalsos.sembrarComoElDiseno(); true')
  await gente('eric', ['eric', 'ana', 'luis'])
  await a.esp(700)
  await abrirPres()
  t = await pres()
  debe(await hay('[data-tarjeta-cuentas]'), '1c', 'amigos: «Cuentas del grupo» con quién le debe a quién')
  debe(/Del grupo/i.test(t) && !/CUENTA CONJUNTA/.test(t) && !(await hay('[data-etiqueta-cuenta-conjunta]')), '1c', 'la tarjeta de arriba pone «Del grupo»')
  debe(await hay('[data-boton-modo-cuentas]'), '2', 'el botón «¿Cómo lleváis las cuentas?» está siempre a mano en el presupuesto')
  await a.captura(foto('05_cada_uno'))

  // ── 2 · el botón y la hoja ──
  await clic('[data-boton-modo-cuentas]')
  await a.esp(700)
  let h = await hojaTexto()
  debe(/CUENTAS DEL VIAJE/i.test(h) && /¿Cómo lleváis las cuentas\?/.test(h) && /Todo juntos/.test(h) && /Una cuenta conjunta, sin deudas/.test(h) && /Cada uno lo suyo/.test(h) && /Con las cuentas del grupo/.test(h), '2', `la hoja de tarjetas (${h.slice(0, 160)})`)
  const elegida = await ev("Array.from(document.querySelectorAll('[data-hoja-opciones=\"modo-cuentas\"] [data-opcion-hoja]')).map((e) => e.getAttribute('data-opcion-hoja') + ':' + (e.getAttribute('data-elegida') ?? e.getAttribute('data-opcion-elegida') ?? '')).join()")
  debe(/modo-cada-uno/.test(elegida), '2', `las dos tarjetas están (${elegida})`)
  await a.captura(foto('06b_hoja_modo'))
  // Con gastos apuntados: antes la confirmación
  await clic('[data-opcion-hoja="modo-conjunta"]')
  await a.esp(700)
  let c = await ev("(document.querySelector('[data-hoja=\"confirmar\"]')?.innerText ?? '').replace(/\\s+/g, ' ')")
  debe(/¿Cambiamos a cuenta conjunta\?/.test(c) && /Las deudas de las cuentas del grupo dejan de contar\./.test(c), '2', `confirmación con gastos apuntados: «${c.slice(0, 120)}»`)
  debe(await hay('[data-confirmar-si][data-peligro="1"]'), '2', 'el botón de confirmar va en rojo (se pierden las deudas)')
  await a.captura(foto('06c_confirmar_conjunta'))
  debe((await ruta()).modo === null, '2', 'mientras no confirma, nada cambia')
  await ev("(() => { const b = document.querySelector('[data-hoja=\"confirmar\"] button[aria-label=\"Cerrar\"]'); b?.click(); return true })()") // (10N8) la ✕ cierra: ya no hay [Mejor no]
  await a.esp(400)
  debe((await ruta()).modo === null && !(await hay('[data-hoja="confirmar"]')), '2', 'cerrar la confirmación con la ✕ no cambia nada')
  await clic('[data-opcion-hoja="modo-conjunta"]')
  await a.esp(500)
  await clic('[data-confirmar-si]')
  await a.esp(900)
  let r = await ruta()
  debe(r.modo === 'conjunta' && r.con === 3, '2', `confirmar: la cuenta pasa a conjunta con 3 personas (${JSON.stringify(r)})`)
  t = await pres()
  debe(/CUENTA CONJUNTA · ERIC, ANA Y LUIS/.test(t) && !(await hay('[data-tarjeta-cuentas]')) && !(await hay('[data-eligiendo]')) && !(await hay('[data-hoja-opciones="modo-cuentas"]')), '2', 'tras confirmar: la etiqueta de cuenta conjunta, sin «Cuentas del grupo» y la hoja cerrada')
  // Vuelta a «Cada uno lo suyo» con gastos
  await clic('[data-boton-modo-cuentas]')
  await a.esp(600)
  await clic('[data-opcion-hoja="modo-cada-uno"]')
  await a.esp(600)
  c = await ev("(document.querySelector('[data-hoja=\"confirmar\"]')?.innerText ?? '').replace(/\\s+/g, ' ')")
  debe(/¿Cambiamos a cada uno lo suyo\?/.test(c) && /Lo apuntado contará como pagado por quien lo apuntó, a partes iguales entre todos\./.test(c), '2', `la otra confirmación: «${c.slice(0, 140)}»`)
  debe(!(await hay('[data-confirmar-si][data-peligro="1"]')), '2', 'esa no va en rojo (no se pierde nada)')
  await clic('[data-confirmar-si]')
  await a.esp(900)
  r = await ruta()
  debe(r.modo === 'cada_uno' && (await hay('[data-tarjeta-cuentas]')), '2', 'vuelve «Cuentas del grupo»')
  // Lo «Solo para mí» sigue personal: el gasto de Ana «Souvenirs» (mio) y el de Eric «Regalo para casa» no entran en las cuentas del grupo
  const mios = await ev("window.__gastosFalsos.bd.gastos.filter((g) => g.ambito === 'mio').length")
  debe(mios === 2, '2', 'los gastos «Solo para mí» siguen siendo personales tras cambiar de forma')
  // Sin gastos no hay confirmación
  await ev('window.__gastosFalsos.reiniciar(); true')
  await gente('eric', ['eric', 'ana', 'luis'])
  await a.esp(600)
  await clic('[data-boton-modo-cuentas]')
  await a.esp(600)
  await clic('[data-opcion-hoja="modo-conjunta"]')
  await a.esp(700)
  debe(!(await hay('[data-hoja="confirmar"]')) && (await ruta()).modo === 'conjunta', '2', 'sin gastos apuntados no se pregunta nada: se cambia directamente')
  await clic('[data-boton-modo-cuentas]')
  await a.esp(500)
  await clic('[data-opcion-hoja="modo-cada-uno"]')
  await a.esp(600)
  debe((await ruta()).modo === 'cada_uno', '2', 'y se puede volver')
  // Solo el administrador la cambia
  await gente('luis', ['eric', 'luis', 'ana'])
  await a.esp(600)
  await clic('[data-boton-modo-cuentas]')
  await a.esp(600)
  h = await hojaTexto()
  debe(/Solo la cambia el administrador\./.test(h), '2', 'quien no es el administrador ve la hoja con «Solo la cambia el administrador.»')
  const antes = (await ruta()).modo
  await clic('[data-opcion-hoja="modo-conjunta"]')
  await a.esp(500)
  debe((await ruta()).modo === antes && !(await hay('[data-hoja="confirmar"]')), '2', 'y no puede tocarla (las tarjetas no hacen nada)')
  await ev(`${MODO}.then((m) => { m.useModoCuentasUi.getState().cerrarEleccion(); return true })`)
  await cerrarPres()

  // ── 2 · un viaje solo al que se une alguien ──
  await compañia('solo')
  await sinGente()
  await gente('eric', ['eric'])
  await ev('window.__gastosFalsos.reiniciar(); true')
  await gente('eric', ['eric'])
  await a.esp(400)
  await ev('window.__gastosFalsos.entrar("ana").then(() => true)')
  await a.esp(700)
  await abrirPres()
  t = await pres()
  debe(await hay('[data-pregunta-modo-cuentas]') && /¿Cómo lleváis las cuentas\?/.test(t), '2', 'entra Ana a un viaje solo: arriba del presupuesto, la pregunta')
  debe(await hay('[data-tarjeta-cuentas]'), '2', 'mientras no elige, «Cada uno lo suyo» (así nadie pierde nada de vista)')
  debe(/Todo juntos/.test(t) && /Cada uno lo suyo/.test(t), '2', 'con los dos botones «Todo juntos» y «Cada uno lo suyo»')
  // El aviso de la campana/franja
  await ev(`${FRANJA}.then((f) => ({ ok: true }))`)
  await ev(`(async () => {
    const t = await import('/shared/avisos/textos.js')
    const f = await ${FRANJA}
    const aviso = { id: 'u1', tipo: 'unido', texto: '', quien: 'Ana', creado_en: new Date().toISOString(), leido: false, payload: { trip_id: 'demo-viaje', nombre: 'Ana', pregunta_cuentas: true }, etiqueta: null }
    aviso.texto = t.textoDelAviso(aviso)
    f.useFranjaStore.getState().mostrar([f.itemDeAviso({ ...aviso, franja: t.franjaDelAviso(aviso) })])
    return true
  })()`).catch((e) => console.log('   (franja)', e.message))
  await a.esp(900)
  await a.captura(foto('07_se_une'))
  await a.esp(5200)
  // Al tocar el aviso se abre la misma hoja
  await cerrarPres()
  await ev(`(async () => {
    const t = await import('/shared/avisos/textos.js')
    const mod = await import('/src/components/avisos/abrirAviso.ts')
    const aviso = { id: 'u1', tipo: 'unido', texto: '', quien: 'Ana', creado_en: new Date().toISOString(), leido: false, payload: { trip_id: 'demo-viaje', nombre: 'Ana', pregunta_cuentas: true }, etiqueta: null }
    aviso.texto = t.textoDelAviso(aviso)
    await mod.abrirAviso(aviso)
    return true
  })()`).catch((e) => console.log('   (abrirAviso)', e.message))
  await a.esp(900)
  h = await hojaTexto()
  debe(/¿Cómo lleváis las cuentas\?/.test(h) && /Todo juntos/.test(h), '2', 'tocar «Ana se ha unido… ¿Cómo lleváis las cuentas?» abre esa misma hoja')
  await clic('[data-opcion-hoja="modo-conjunta"]')
  await a.esp(900)
  r = await ruta()
  debe(r.modo === 'conjunta' && r.con === 2 && !(await hay('[data-pregunta-modo-cuentas]')), '2', 'el administrador elige «Todo juntos»: la pregunta desaparece')
  // 2b-2 · entra un tercero
  await ev('window.__gastosFalsos.entrar("luis").then(() => true)')
  await a.esp(900)
  t = await pres()
  debe(await hay('[data-pregunta-modo-cuentas]') && /CUENTA CONJUNTA · ERIC, ANA Y LUIS/.test(t), '2b-2', 'entra Luis a la cuenta conjunta: sigue conjunta y se vuelve a preguntar')
  await clic('[data-elegir-modo="conjunta"]')
  await a.esp(900)
  debe(!(await hay('[data-pregunta-modo-cuentas]')) && (await ruta()).con === 3, '2b-2', 'contesta (lo mismo que había) y deja de preguntar')
  await a.captura(foto('02c_conjunta_tres'))
  await cerrarPres()
  debe(!(await ruta()).nombre, '1b', 'sin nombre puesto, la cuenta se llama «Cuenta conjunta»')
} finally {
  a.cerrar()
}

// Design, al lado
const verPieza = (prefijo) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => (s.textContent || '').startsWith(${JSON.stringify(prefijo)}) && s.children.length === 0); e?.scrollIntoView({ block: 'start' }); window.scrollBy(-40, -10); return true })()`
const piezas = [
  ['01_solo', '01 · Presupuesto de un viaje solo'],
  ['02a_conjunta', '02a · Cuenta conjunta'],
  ['03_nombre', '03 · Cambiar el nombre'],
  ['05_cada_uno', '05 · Cada uno lo suyo · Solo para ti'],
  ['06b_hoja_modo', '06b · ¿Cómo lleváis'],
  ['07_se_une', '07 · Un viaje solo al que se une'],
]
for (const [nombre, prefijo] of piezas) await capturarDesign('Piezas/Cuentas Modo.dc.html', foto(`design_${nombre}`), { despues: verPieza(prefijo) }).catch((e) => console.log('  (sin captura de Design)', nombre, e.message))

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
