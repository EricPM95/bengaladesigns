// Tanda 10S5 (agente K): apartados 2 («Vuelo a Roma», fechas enteras, días a todo el ancho, «antes de reservar») y 3 («Propón un sitio»).
//   1 · el presupuesto dice «Vuelo a Roma» / «Tren a Roma» / «Autobús a Roma» / «Barco a Roma» (en coche, «Ida a Roma») y la fecha de cada reserva, entera.
//   2 · las fechas enteras (funciones puras) y los cuadrados de elegir día, cortos; repartirEnFilas (3, 4, 5, 7, 8 días).
//   3 · la migración 0069 en PGlite (se aplica y se repite, RLS, sin políticas, sin columnas privadas) y COMPROBAR_0069.sql («FALTA» antes, «Aplicada» después).
//   4 · el servidor (/api/proponer-sitio) con un servicio de mentira: guarda nombre, comentario, destino y fecha; tacha correos y llaves; 400 sin nombre; frena.
//   5 · el código: el texto con «aquí», la hoja y el gancho global.
//   6 · en la app (Chrome): [Añadir otra reserva] → «Torre Eiffel» → texto con «aquí» subrayado → hoja con el nombre escrito → Enviar (el envío se intercepta: no ensucia la base) → «Gracias»;
//       la hoja se abre también desde otro sitio (gancho global); los días a todo el ancho con 3 y con 7 días, en 375 × 667 y 390 × 844; «Recuerda revisar la disponibilidad antes de reservar.».
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S5_K.mjs
// Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import http from 'node:http'
import express from 'express'
import { PGlite } from '@electric-sql/pglite'
import { prepararSSR } from './_ssr.mjs'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const eur = (amount) => ({ amount, currency: 'EUR' })

// (La migración va la primera: las pruebas con SSR ponen un `window` falso que rompe PGlite.)
console.log('3. La migración 0069 (PGlite) y su comprobación')
let bd = null
{
  bd = new PGlite()
  const sql = leer('supabase/migrations/0069_propuestas_de_sitio.sql')
  const comprobar = leer('docs/dias/COMPROBAR_0069.sql')
  const antes = await bd.query(comprobar.split('-- Para ver')[0])
  debe(antes.rows[0]?.migracion_0069 === 'FALTA', '3 comprobar', `antes de aplicarla, la comprobación dice «${antes.rows[0]?.migracion_0069}»`)
  try {
    await bd.exec(sql)
    await bd.exec(sql)
    debe(true, '3 migración', 'la 0069 se aplica y se puede pegar dos veces')
  } catch (e) {
    debe(false, '3 migración', `la 0069 falla: ${String(e.message).slice(0, 200)}`)
  }
  const despues = await bd.query(comprobar.split('-- Para ver')[0])
  debe(despues.rows[0]?.migracion_0069 === 'Aplicada', '3 comprobar', `después de aplicarla, la comprobación dice «${despues.rows[0]?.migracion_0069}»`)
  const rls = await bd.query("select relrowsecurity as rls from pg_class where oid = 'public.propuestas_de_sitio'::regclass")
  debe(rls.rows[0]?.rls === true, '3 migración', 'RLS encendido')
  const pol = await bd.query("select count(*)::int as n from pg_policies where tablename = 'propuestas_de_sitio'")
  debe(pol.rows[0]?.n === 0, '3 migración', 'y ninguna política (solo escribe el servidor)')
  const cols = await bd.query("select column_name from information_schema.columns where table_name = 'propuestas_de_sitio'")
  debe(!cols.rows.some((c) => /user|email|correo|ip\b|cuenta|persona/i.test(c.column_name)), '3 privado', `ninguna columna guarda quién es (${cols.rows.map((c) => c.column_name)})`)
  await bd.exec("insert into public.propuestas_de_sitio (nombre) values ('Torre Eiffel')")
  const fila = await bd.query('select nombre, comentario, destino, origen, creado from public.propuestas_de_sitio')
  debe(fila.rows.length === 1 && fila.rows[0].comentario === '' && fila.rows[0].creado instanceof Date, '3 migración', 'se puede insertar con solo el nombre; la fecha la pone la base')
}

console.log('1. El presupuesto: «Vuelo a Roma» y la fecha entera')
{
  const { M, ponerVersion } = await prepararSSR('scripts/destino/_10s4_f_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
  const { useRouteStore, usePresupuestoUi, construirPresupuesto } = M
  const consolaError = console.error
  console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
  ponerVersion('completa')
  usePresupuestoUi.setState({ abierto: true })
  const dia = (id, n) => ({ id, dayNumber: n, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', meals: [], excursions: [], dayType: 'manual', colorIndex: n - 1, stops: [] })
  const ruta = (opcion) => ({
    id: 'p10s5k', destination: 'Roma', country: 'Italia', origin: 'Barcelona', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
    days: [dia('d1', 1), dia('d2', 2)],
    answers: { dateRange: { start: '2027-03-10', end: '2027-03-12' }, days: 3, companion: 'couple' },
    transportContext: { transport_option: { id: opcion }, archetype: null },
    arrivalPrecio: eur(100), departurePrecio: null,
  })
  const reserva = { id: 'r1', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', placeNames: ['Coliseo'], dateIso: '2027-03-12', dayNumber: null, time: '10:00', precio: eur(50) }
  const esperado = { flight: 'Vuelo a Roma', train: 'Tren a Roma', bus: 'Autobús a Roma', ferry: 'Barco a Roma', car: 'Ida a Roma' }
  for (const [opcion, texto] of Object.entries(esperado)) {
    const r = ruta(opcion)
    useRouteStore.setState({ screen: 'route', mode: 'days', route: r, reservations: [reserva], accommodationSelections: {}, transportBookings: {} })
    const p = construirPresupuesto({ route: r, reservations: [reserva], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true })
    const t = p.bloques.find((b) => b.id === 'transporte')
    const l = t?.lineas.find((x) => x.id === 'llegada')
    debe(l?.nombre === texto, '1 billete', `con «${opcion}» la línea dice «${l?.nombre}» y debería decir «${texto}»`)
    const ruta2 = p.bloques.find((b) => b.id === 'ruta')
    const fila = ruta2?.lineas.find((x) => x.nombre === 'Coliseo')
    debe(fila?.sub === 'Viernes 12', '1 fecha', `la fecha de la reserva en el presupuesto es «${fila?.sub}» y debería ser «Viernes 12»`)
  }
  const fuente = sinComentarios(leer('src/lib/presupuesto.ts'))
  debe(!/`Ida a \$\{ciudad\}`/.test(fuente), '1 billete', 'ya no queda «Ida a ${ciudad}» fijo en el presupuesto')
  console.error = consolaError
}

console.log('2. Las fechas enteras y los días repartidos')
{
  const { M: P } = await prepararSSR('scripts/destino/_10s5_k_entrada.tsx')
  const N = P
  const B = P
  const D = P
  const F = P
  debe(N.fechaCorta('2026-11-27') === 'Viernes 27', '2 fecha', `fechaCorta = «${N.fechaCorta('2026-11-27')}»`)
  debe(N.fechaCorta('2026-11-13') === 'Viernes 13' && N.fechaCorta('2026-11-12') === 'Jueves 12', '2 fecha', 'Jueves 12, Viernes 13')
  debe(N.fechaCorta('2026-10-31') === 'Sábado 31', '2 fecha', `«sáb 31» ahora es «${N.fechaCorta('2026-10-31')}»`)
  debe(N.fechaEnProsa('2026-11-27') === 'viernes 27', '2 fecha', 'en medio de una frase, en minúscula')
  debe(N.diaCortoProsa('2026-11-27', 1) === 'viernes 27', '2 fecha', `diaCortoProsa = «${N.diaCortoProsa('2026-11-27', 1)}»`)
  debe(N.fechaConMes('2026-11-26') === 'Jueves 26 Nov', '2 fecha', `fechaConMes = «${N.fechaConMes('2026-11-26')}»`)
  debe(B.fechaDeLista('2026-10-15') === 'Jueves 15 oct' && B.shortDateEs('2026-10-15') === 'jueves 15 oct', '2 fecha', `fechaDeLista = «${B.fechaDeLista('2026-10-15')}», shortDateEs = «${B.shortDateEs('2026-10-15')}»`)
  debe(D.formatFechaListaEs('2026-11-24') === 'Martes 24 Nov', '2 fecha', `formatFechaListaEs = «${D.formatFechaListaEs('2026-11-24')}»`)
  // Los cuadrados de elegir día siguen cortos.
  debe(N.fichaDelDia('2026-11-27', 1)?.semana === 'VIE' && N.fichaDelDia('2026-11-27', 1)?.numero === '27', '2 cuadrado', 'la ficha del cuadrado sigue corta («VIE» y «27»)')
  const hoja = leer('src/components/route/reservas/AddReservationSheet.tsx')
  debe(/weekday: 'short'/.test(hoja) && /chipText/.test(hoja), '2 cuadrado', 'el cuadrado de elegir día de la hoja de reservas sigue con el día corto')
  // Repartir.
  const tam = (n) => F.repartirEnFilas(Array.from({ length: n }, (_, i) => i)).map((f) => f.length)
  debe(JSON.stringify(tam(3)) === '[3]' && JSON.stringify(tam(4)) === '[4]', '2 filas', 'hasta 4 días, una fila')
  debe(JSON.stringify(tam(5)) === '[3,2]' && JSON.stringify(tam(6)) === '[3,3]' && JSON.stringify(tam(7)) === '[4,3]' && JSON.stringify(tam(8)) === '[4,4]', '2 filas', `5, 6, 7 y 8 días en dos filas (${[5, 6, 7, 8].map((n) => JSON.stringify(tam(n)))})`)
  debe(F.repartirEnFilas([]).length === 0 && F.repartirEnFilas([1, 2, 3, 4, 5, 6, 7, 8, 9]).flat().join() === '1,2,3,4,5,6,7,8,9', '2 filas', 'sin días, nada; el orden se conserva')
  debe(!/overflow-x-auto/.test(sinComentarios(hoja).split('data-dias-filas')[1]?.slice(0, 600) ?? ''), '2 filas', 'los días ya no se deslizan de lado')
  const aviso = P
  debe(aviso.AVISO_DISPONIBILIDAD_RESERVAR === 'Recuerda revisar la disponibilidad antes de reservar.', '2 aviso', 'el texto del aviso de la reserva escrita a mano')
  debe(/esLibre \? AVISO_DISPONIBILIDAD_RESERVAR : AVISO_DISPONIBILIDAD/.test(hoja), '2 aviso', 'solo la reserva escrita a mano dice «antes de reservar»; las entradas, igual que antes')
}

console.log('4. El servidor')
{
  const { normalizarPropuesta, registrarRutaPropuestasSitio } = await import('../../server/propuestasSitio.js')
  debe(normalizarPropuesta({ nombre: ' ' }) === null && normalizarPropuesta(null) === null && normalizarPropuesta({ nombre: 'a' }) === null, '4 nombre', 'sin nombre válido no hay propuesta')
  const n = normalizarPropuesta({ nombre: 'Torre Eiffel', comentario: 'escríbeme a ana@correo.es o usa eyJabcdefghijk.abcdefghij.abcdefghij', destino: 'París', origen: 'reservas' })
  debe(n && n.nombre === 'Torre Eiffel' && n.destino === 'París' && n.origen === 'reservas', '4 campos', 'nombre, destino y origen se guardan')
  debe(n && !/ana@|eyJ/.test(n.comentario) && /<correo>/.test(n.comentario) && /<token>/.test(n.comentario), '4 privado', `el correo y el token se tachan (${n?.comentario})`)
  debe(normalizarPropuesta({ nombre: 'x'.repeat(500), comentario: 'y'.repeat(5000) }).nombre.length === 120 && normalizarPropuesta({ nombre: 'xx', comentario: 'y'.repeat(5000) }).comentario.length === 1000, '4 recorte', 'los textos se recortan (120 y 1000)')
  const filas = []
  const servicio = { from: (tabla) => ({ insert: async (reg) => (tabla === 'propuestas_de_sitio' ? (filas.push(reg), { error: null }) : { error: { message: 'tabla rara' } }) }) }
  const lineas = []
  const app = express()
  app.use(express.json())
  registrarRutaPropuestasSitio(app, { servicio, consola: { log: (...a) => lineas.push(a.join(' ')), error: (...a) => lineas.push(a.join(' ')) } })
  const srv = await new Promise((ok) => {
    const s = http.createServer(app).listen(0, '127.0.0.1', () => ok(s))
  })
  const url = `http://127.0.0.1:${srv.address().port}/api/proponer-sitio`
  const post = (cuerpo) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
  const r1 = await post({ nombre: 'Torre Eiffel', comentario: 'Abre hasta tarde', destino: 'París', origen: 'reservas', usuario: 'secreto', email: 'a@b.es', ip: '1.2.3.4' })
  const b1 = await r1.json()
  debe(r1.status === 200 && b1.ok === true && b1.guardado === true, '4 guardar', `el servidor guarda y lo dice (${r1.status} ${JSON.stringify(b1)})`)
  debe(filas.length === 1 && JSON.stringify(Object.keys(filas[0]).sort()) === '["comentario","destino","nombre","origen"]', '4 privado', `solo se guardan nombre, comentario, destino y origen (${Object.keys(filas[0] ?? {})}); la fecha la pone la base`)
  debe(!JSON.stringify(filas[0]).includes('secreto') && !JSON.stringify(filas[0]).includes('1.2.3.4') && !JSON.stringify(filas[0]).includes('a@b.es'), '4 privado', 'nada de lo extra que llegue (usuario, email, IP) se guarda')
  debe(lineas.some((l) => /\[propon-sitio\]/.test(l) && /Torre Eiffel/.test(l)), '4 registro', 'siempre queda una línea [propon-sitio] en el registro del servidor')
  const r2 = await post({ nombre: '', comentario: 'x' })
  debe(r2.status === 400, '4 nombre', `sin nombre, 400 (${r2.status})`)
  let ultimo = 200
  for (let i = 0; i < 8; i++) ultimo = (await post({ nombre: 'Mismo sitio' })).status
  debe(ultimo === 429, '4 freno', `el mismo nombre muchas veces seguidas se frena (${ultimo})`)
  await new Promise((ok) => srv.close(ok))
  // Sin clave de servicio (o la tabla sin crear): 200 con guardado:false y la línea del registro.
  const lineas2 = []
  const app2 = express()
  app2.use(express.json())
  registrarRutaPropuestasSitio(app2, { servicio: null, consola: { log: (...a) => lineas2.push(a.join(' ')), error: (...a) => lineas2.push(a.join(' ')) } })
  const srv2 = await new Promise((ok) => {
    const s = http.createServer(app2).listen(0, '127.0.0.1', () => ok(s))
  })
  const r3 = await fetch(`http://127.0.0.1:${srv2.address().port}/api/proponer-sitio`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Otro sitio' }) })
  const b3 = await r3.json()
  debe(r3.status === 200 && b3.guardado === false && lineas2.length === 1, '4 sin tabla', 'sin clave de servicio: 200, guardado:false y la línea del registro')
  await new Promise((ok) => srv2.close(ok))
  const index = leer('server/index.js')
  debe(/registrarRutaPropuestasSitio\(app, \{ servicio: salesAdmin \}\)/.test(index), '4 ruta', 'la ruta está registrada en el servidor de la app')
}

console.log('5. El código')
{
  const buscador = sinComentarios(leer('src/components/route/reservas/OtraReservaBuscador.tsx'))
  debe(/Este sitio aún no está en JUTRIP\. Ayúdanos a añadirlo desde/.test(buscador) && />\s*aquí\s*</.test(buscador), '5 texto', 'el texto de P1 con «aquí»')
  debe(/underline/.test(buscador.split('data-propon-sitio-aqui')[1]?.slice(0, 300) ?? ''), '5 texto', '«aquí» va subrayado')
  debe(/abrirProponerSitio\(\{ nombre: limpio, origen: 'reservas' \}\)/.test(buscador), '5 hoja', '«aquí» abre la hoja con lo escrito')
  const hoja = leer('src/components/proponerSitio/HojaProponerSitio.tsx')
  for (const t of ['Propón un sitio', 'Nombre del sitio', '¿Algo más que debamos saber?', 'opcional', 'Escríbelo aquí', 'Enviar', 'Gracias. Lo revisamos y, si encaja, lo añadimos.']) debe(hoja.includes(t), '5 textos', `la hoja dice «${t}»`)
  const app = leer('src/App.tsx')
  debe(/<ProponerSitioHost \/>/.test(app), '5 global', 'ProponerSitioHost está montado una vez en App')
  const store = leer('src/store/useProponerSitioStore.ts')
  debe(/export function abrirProponerSitio/.test(store) && /export function useProponerSitio/.test(store), '5 global', 'hay función y gancho globales para abrir la hoja desde cualquier sitio')
  const cliente = sinComentarios(leer('src/lib/proponerSitio.ts'))
  debe(!/userId|user_id|email|correo|getSession|auth\./i.test(cliente), '5 privado', 'el cliente no manda quién es')
  const reglas = leer('docs/REGLAS_DE_LA_APP.md')
  debe(/10S5 · agente K/.test(reglas) && /Viernes 27/.test(reglas) && /abrirProponerSitio/.test(reglas), '5 reglas', 'las reglas nuevas están en REGLAS_DE_LA_APP.md')
}

console.log('6. En la app')
for (const [ancho, alto] of [[390, 844], [375, 667]]) {
  let app = null
  try {
    app = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa', ancho, alto })
    for (let i = 0; i < 240 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
    for (let intento = 0; intento < 8; intento++) {
      const ok = await app.evaluar('window.__rutaPrueba().then(() => true, (e) => String(e && e.message))').catch((e) => String(e))
      if (ok === true) break
      await app.esp(1500)
    }
    for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
    await app.esp(2500)
    const etiqueta = `${ancho}x${alto}`
    const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); ${js} })()`)
    // El envío se intercepta: se queda lo que la app mandaría, y no se escribe nada en la base de verdad.
    await ev("window.__enviados = []; const orig = window.fetch; window.fetch = (u, o) => { if (String(u).includes('/api/proponer-sitio')) { window.__enviados.push(JSON.parse(o.body)); return Promise.resolve(new Response(JSON.stringify({ ok: true, guardado: true }), { status: 200 })) } return orig(u, o) }; return true")
    await ev("st().setMode('bookings'); return true")
    await app.esp(1800)
    await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); if (b && b.children.length < 2) b.firstElementChild?.click(); return true })()`)
    await app.esp(1200)
    const hayBoton = await ev("return Boolean(document.querySelector('[data-anadir-otra-reserva]'))")
    debe(hayBoton, `6 ${etiqueta}`, 'está [Añadir otra reserva]')
    await ev("document.querySelector('[data-anadir-otra-reserva]')?.click(); return true")
    await app.esp(900)
    await app.escribir('[data-otra-reserva-texto]', 'Torre Eiffel')
    await app.esp(900)
    const texto = await ev("return (document.querySelector('[data-propon-sitio-texto]')?.innerText ?? '').replace(/\\s+/g, ' ')")
    debe(texto === 'Este sitio aún no está en JUTRIP. Ayúdanos a añadirlo desde aquí.', `6 ${etiqueta}`, `el texto de P1 es «${texto}»`)
    const subrayado = await ev("const b = document.querySelector('[data-propon-sitio-aqui]'); return b ? getComputedStyle(b).textDecorationLine : null")
    debe(subrayado === 'underline', `6 ${etiqueta}`, `«aquí» va subrayado (${subrayado})`)
    await app.captura(`docs/dias/capturas_jutrip/10s5_proponer_1_${etiqueta}.jpg`).catch(() => {})
    await ev("document.querySelector('[data-propon-sitio-aqui]')?.click(); return true")
    await app.esp(800)
    const nombre = await ev("return document.querySelector('[data-proponer-sitio-nombre]')?.value ?? null")
    debe(nombre === 'Torre Eiffel', `6 ${etiqueta}`, `la hoja sale con «Nombre del sitio» ya escrito (${nombre})`)
    const hojaTxt = await ev("return (document.querySelector('[data-hoja=\"proponer-sitio\"]')?.innerText ?? '').replace(/\\s+/g, ' ')")
    debe(/Propón un sitio/.test(hojaTxt) && /¿Algo más que debamos saber\?/.test(hojaTxt) && /opcional/.test(hojaTxt) && /Enviar/.test(hojaTxt), `6 ${etiqueta}`, `la hoja trae el título, la pregunta opcional y [Enviar] (${hojaTxt})`)
    await app.escribir('[data-proponer-sitio-comentario]', 'Abre hasta las 23:00')
    await app.esp(400)
    await app.captura(`docs/dias/capturas_jutrip/10s5_proponer_2_${etiqueta}.jpg`).catch(() => {})
    await ev("document.querySelector('[data-proponer-sitio-enviar]')?.click(); return true")
    await app.esp(1200)
    const gracias = await ev("return (document.querySelector('[data-proponer-sitio-gracias]')?.innerText ?? '').replace(/\\s+/g, ' ')")
    debe(gracias === 'Gracias. Lo revisamos y, si encaja, lo añadimos.', `6 ${etiqueta}`, `tras enviar sale «${gracias}»`)
    const enviados = await ev('return window.__enviados')
    debe(enviados.length === 1 && enviados[0].nombre === 'Torre Eiffel' && enviados[0].comentario === 'Abre hasta las 23:00' && enviados[0].destino === (await ev('return route().destination')) && enviados[0].origen === 'reservas', `6 ${etiqueta}`, `lo que manda la app: ${JSON.stringify(enviados)}`)
    debe(JSON.stringify(Object.keys(enviados[0] ?? {}).sort()) === '["comentario","destino","nombre","origen"]', `6 ${etiqueta}`, 'solo manda nombre, comentario, destino y origen (nada privado)')
    await app.captura(`docs/dias/capturas_jutrip/10s5_proponer_3_${etiqueta}.jpg`).catch(() => {})
    await ev("document.querySelector('[data-proponer-sitio-cerrar]')?.click(); return true")
    await app.esp(500)
    debe(!(await ev("return Boolean(document.querySelector('[data-hoja=\"proponer-sitio\"]'))")), `6 ${etiqueta}`, 'la hoja se cierra con la ✕')

    // Desde cualquier sitio: sin pasar por [Añadir otra reserva] (como lo haría un botón de otra pantalla).
    await ev("const S = await import('/src/store/useProponerSitioStore.ts'); S.abrirProponerSitio({ nombre: 'Café Procope', origen: 'prueba' }); return true")
    await app.esp(700)
    debe((await ev("return document.querySelector('[data-proponer-sitio-nombre]')?.value ?? null")) === 'Café Procope', `6 ${etiqueta}`, 'la hoja se abre desde cualquier sitio con abrirProponerSitio()')
    await ev("document.querySelector('[data-proponer-sitio-cerrar]')?.click(); return true")
    await app.esp(400)

    // La hoja de la reserva escrita a mano: el aviso y los días a todo el ancho.
    await ev("document.querySelector('[data-otra-reserva-seguir]')?.click(); return true")
    await app.esp(1500)
    const aviso = await ev("return (document.querySelector('[data-aviso=\"disponibilidad\"]')?.innerText ?? '').trim()")
    debe(aviso === 'Recuerda revisar la disponibilidad antes de reservar.', `6 ${etiqueta}`, `el aviso de la reserva escrita a mano dice «${aviso}»`)
    const medir = () => ev(`const filas = Array.from(document.querySelectorAll('[data-dias-fila]')); const g = document.querySelector('[data-dias-filas]'); const gr = g?.getBoundingClientRect(); return { n: document.querySelectorAll('[data-dia-cuadrado]').length, filas: filas.map((f) => { const bs = Array.from(f.querySelectorAll('[data-dia-cuadrado]')).map((b) => b.getBoundingClientRect()); return { cuantos: bs.length, ini: bs[0]?.left, fin: bs[bs.length - 1]?.right, anchos: bs.map((r) => Math.round(r.width)) } }), g: gr ? { ini: gr.left, fin: gr.right } : null, ancho: window.innerWidth }`)
    const comprobarAncho = (m, nombre, filasEsperadas) => {
      debe(m.filas.length === filasEsperadas.length && m.filas.every((f, i) => f.cuantos === filasEsperadas[i]), `6 ${etiqueta}`, `${nombre}: filas ${JSON.stringify(m.filas.map((f) => f.cuantos))}, esperaba ${JSON.stringify(filasEsperadas)}`)
      debe(m.filas.every((f) => Math.abs(f.ini - m.g.ini) <= 1 && Math.abs(f.fin - m.g.fin) <= 1), `6 ${etiqueta}`, `${nombre}: cada fila ocupa todo el ancho (${JSON.stringify(m.filas.map((f) => [Math.round(f.ini), Math.round(f.fin)]))} dentro de ${Math.round(m.g.ini)}-${Math.round(m.g.fin)})`)
      debe(m.filas.every((f) => Math.max(...f.anchos) - Math.min(...f.anchos) <= 1), `6 ${etiqueta}`, `${nombre}: los días de cada fila, a partes iguales (${JSON.stringify(m.filas.map((f) => f.anchos))})`)
      debe(m.g.fin <= m.ancho + 1, `6 ${etiqueta}`, `${nombre}: nada se sale de la pantalla`)
    }
    const dias0 = await ev('return route().days.filter((d) => !d.isReturnLeg).length')
    const m0 = await medir()
    console.log(`  (info ${etiqueta}: la ruta de prueba tiene ${dias0} días contados por la hoja: ${m0.n})`)
    comprobarAncho(m0, `${m0.n} días`, m0.n <= 4 ? [m0.n] : m0.n === 5 ? [3, 2] : m0.n === 6 ? [3, 3] : m0.n === 7 ? [4, 3] : [4, 4])
    await app.captura(`docs/dias/capturas_jutrip/10s5_dias_${m0.n}_${etiqueta}.jpg`).catch(() => {})
    // Con 3 y con 7 días: se cambia el viaje en la memoria (más o menos días) y se vuelve a abrir la hoja.
    for (const total of [3, 7]) {
      if (m0.n === total) continue
      await ev("document.querySelector('#add-reservation-heading')?.closest('[role=\"dialog\"]')?.querySelector('button[aria-label=\"Cerrar\"]')?.click(); return true")
      await app.esp(400)
      await ev(`
        const r = route(); const base = r.days.filter((d) => !d.isReturnLeg)
        const dias = Array.from({ length: ${total} }, (_, i) => { const o = base[i % base.length]; return { ...o, id: 'k10s5-d' + (i + 1), dayNumber: i + 1 } })
        const inicio = r.answers.dateRange.start; const fin = new Date(inicio + 'T12:00:00Z'); fin.setUTCDate(fin.getUTCDate() + ${total} - 1)
        R.useRouteStore.setState({ route: { ...r, days: dias, answers: { ...r.answers, days: ${total}, dateRange: { start: inicio, end: fin.toISOString().slice(0, 10) } } } })
        return true`)
      await app.esp(600)
      await ev("document.querySelector('[data-anadir-otra-reserva]')?.click(); return true")
      await app.esp(700)
      await app.escribir('[data-otra-reserva-texto]', 'Torre Eiffel')
      await app.esp(400)
      await ev("document.querySelector('[data-otra-reserva-seguir]')?.click(); return true")
      await app.esp(1500)
      const m = await medir()
      comprobarAncho(m, `${total} días`, total <= 4 ? [total] : [4, 3])
      await app.captura(`docs/dias/capturas_jutrip/10s5_dias_${total}_${etiqueta}.jpg`).catch(() => {})
    }
  } catch (e) {
    debe(false, `6 ${ancho}x${alto}`, `la prueba en la app ha fallado: ${String(e?.message ?? e).slice(0, 300)}`)
  } finally {
    app?.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
if (fallos.length) {
  for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
  process.exit(1)
}
process.exit(0)
