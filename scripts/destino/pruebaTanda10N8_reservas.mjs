// Tanda 10N8 (N6) · EN PANTALLA lo principal de N4: bloque único de vuelo/alojamiento para quien no es administrador, hoja del vuelo con «Guardar el vuelo» (sin [Guardar] suelto),
// «Añadir gasto» con solo quien lo añade marcado y sin [Para todos]/[Para mí] en «Cada uno lo suyo», presupuesto con «Lo tuyo» y el de quien viaja solo («Tu viaje»),
// comprar la entrada a la misma hora («Comprar a las HH:MM», «Ya la tengo · Guardarla» y la pregunta al volver).
// Capturas docs/dias/capturas_jutrip/10n8_reservas_*.jpg y, al lado, las de Design (10n8_design_*.jpg; SIN_DESIGN=1 las salta).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N8_reservas.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10n8_reservas_${n}.jpg`)
const GENTE = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'editar' },
  { id: 'p-luis', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' },
]

const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
const ev = (js) => a.evaluar(js)
const texto = () => ev("document.body.innerText.replace(/\\s+/g, ' ')")
const hoja = () => ev("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? null")
const clic = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const botones = (raiz = 'document') => ev(`Array.from(${raiz}.querySelectorAll('button')).map((b) => (b.textContent || '').trim())`)
const ponerGente = (yo, modo = 'cada_uno') =>
  ev(`(async () => {
    const yo = ${JSON.stringify(yo)}
    const g = ${JSON.stringify(GENTE)}.map((p) => ({ ...p, esYo: p.id === 'p-' + yo }))
    sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso')
    if (yo && yo !== 'eric') { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', yo === 'luis' ? 'recomendar' : 'editar') }
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
    const tiendas = [window.__viaje]
    for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
    for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); st.getState().poner({ gente: yo ? g : [] }) }
    if (yo) window.__modoCuentas?.poner(${JSON.stringify(modo)}, 3)
    return true
  })()`)
const loSuyo = (js) =>
  ev(`(async () => {
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useLoSuyo.ts')))]
    const tiendas = [window.__loSuyo]
    for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useLoSuyo)
    for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); await (async (s) => { ${js} })(st) }
    return true
  })()`)
const presUi = (m) => ev(`(async () => { const n = performance.getEntriesByType('resource').map((r) => r.name).find((x) => x.includes('store/usePresupuestoUi.ts')); const mod = await import(/* @vite-ignore */ n ?? '/src/store/usePresupuestoUi.ts'); mod.usePresupuestoUi.getState().${m}(); return true })()`)
const textoPres = () => ev("(document.querySelector('[aria-labelledby=\"titulo-presupuesto\"]')?.innerText ?? 'SIN PANTALLA').replace(/\\s+/g, ' ')")
const irAReservas = async () => {
  await ev("window.__ruta.getState().setMode('bookings'); true")
  await a.esp(1800)
}

try {
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await ev('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await ev('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
  await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useLoSuyo.ts'), import('/src/store/useMisReservas.ts')]).then(() => true)")
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  // El vuelo y el alojamiento del administrador.
  await ev(`(() => {
    const U = window.__ruta
    const dia = U.getState().route.days[0].id
    U.setState((s) => ({ route: { ...s.route, arrivalFlightTime: '11:15', departureFlightTime: '18:05', arrivalPointId: s.route.arrivalPointId ?? 'fiumicino', departurePointId: s.route.departurePointId ?? 'ciampino' }, accommodationSelections: { ...s.accommodationSelections, [dia]: { name: 'Hotel Prati', precio: null } } }))
    return true
  })()`)

  /* ═══ 7b · un solo bloque de vuelo y uno de alojamiento (Ana, invitada) ═══ */
  console.log('7b. Bloque único de vuelo y alojamiento')
  await ponerGente('ana')
  await loSuyo('s.setState({ mio: { vuelo: null, alojamiento: null }, grupo: {}, entradas: [] })')
  await irAReservas()
  // «Falta» (Reservas Cada Uno 01): el administrador aún no ha puesto ni vuelo ni alojamiento.
  await ev(`(() => { const U = window.__ruta; const s = U.getState(); window.__n8guardado = { r: { arrivalFlightTime: s.route.arrivalFlightTime, departureFlightTime: s.route.departureFlightTime, arrivalPointId: s.route.arrivalPointId, departurePointId: s.route.departurePointId }, a: s.accommodationSelections }; U.setState((x) => ({ route: { ...x.route, arrivalFlightTime: null, departureFlightTime: null, arrivalPointId: null, departurePointId: null }, accommodationSelections: {} })); return true })()`)
  await a.esp(1200)
  const falta = await ev("({ vuelo: Boolean(document.querySelector('[data-falta-tarjeta=\"vuelo\"]')), aloj: Boolean(document.querySelector('[data-falta-tarjeta=\"alojamiento\"]')), texto: document.body.innerText.replace(/\\s+/g, ' ').includes('Falta') })")
  debe(falta.vuelo && falta.aloj && falta.texto, '7b', `sin nada puesto: las dos tarjetas dicen «Falta» (${JSON.stringify(falta)})`)
  await a.captura(foto('00_invitado_falta'))
  await ev(`(() => { const g = window.__n8guardado; window.__ruta.setState((x) => ({ route: { ...x.route, ...g.r }, accommodationSelections: g.a })); return true })()`)
  await a.esp(1200)
  let t = await texto()
  const n = await ev("({ vuelo: document.querySelectorAll('[data-tarjeta-vuelo]').length, aloj: document.querySelectorAll('[data-tarjeta-aloj]').length, adminGris: Boolean(document.querySelector('[data-blk=\"llegada\"]')), otros: document.querySelectorAll('[data-pon-el-tuyo]').length })")
  debe(n.vuelo === 1 && n.aloj === 1, '7b', `un solo bloque de vuelo y uno de alojamiento (${JSON.stringify(n)})`)
  debe(!n.adminGris, '7b', 'el bloque gris del administrador no está duplicado')
  debe(/Lo ha puesto Eric · para (Eric y para ti|todos)/.test(t), '7b', `«Lo ha puesto Eric · para Eric y para ti» desde quien mira (${(t.match(/Lo ha puesto[^.]{0,40}/) ?? [''])[0]})`)
  debe(!/Lo lo ha puesto/.test(t), '7b', 'sin el «Lo lo ha puesto» repetido')
  debe(/Poner el mío/.test(t), '7b', '(10N10) con «Poner el mío»')
  await a.captura(foto('01_invitado_bloque_unico'))
  await ev("document.querySelector('[data-tarjeta-aloj]')?.scrollIntoView({block:'center'}); true")
  await a.captura(foto('02_invitado_alojamiento'))

  /* ═══ 7c/7d · hoja del vuelo ═══ */
  console.log('7c/7d. Hoja del vuelo')
  await clic('[data-pon-el-tuyo="vuelo"]')
  await a.esp(1000)
  const hv = await hoja()
  const bv = await botones('document.querySelector(\'[role="dialog"]\')')
  debe(bv.includes('Guardar el vuelo'), '7d', `la hoja trae «Guardar el vuelo» (${bv.join(' | ').slice(0, 160)})`)
  debe(!bv.includes('Guardar'), '7d', 'y ningún [Guardar] suelto (la rueda de la hora ya no lo lleva)')
  debe(/¿Para quién es este vuelo\?/.test(hv ?? ''), '7c', `con «¿Para quién es?» (${(hv ?? '').slice(0, 100)})`)
  const marcadas = await ev("Array.from(document.querySelectorAll('[role=\"dialog\"] [data-persona-cuadrada]')).filter((p) => p.getAttribute('data-elegida') === '1').map((p) => p.textContent.trim())")
  debe(marcadas.length === 1 && /Ana/.test(marcadas[0]), '7c', `solo quien lo pone viene marcado (${JSON.stringify(marcadas)})`)
  await a.captura(foto('03_hoja_vuelo_guardar'))
  await ev("document.querySelector('[data-mi-vuelo-guardar]')?.scrollIntoView({ block: 'end' }); true")
  await a.esp(500)
  await a.captura(foto('03b_hoja_vuelo_boton_guardar_el_vuelo'))
  await ev("document.querySelector('[role=\"dialog\"] button[aria-label=\"Cerrar\"]')?.click(); true")
  await a.esp(600)

  /* ═══ 7e · Añadir gasto en «Cada uno lo suyo» ═══ */
  console.log('7e. Añadir gasto')
  await ev("import('/src/dev/gastosFalsos.ts').then(() => true)")
  await ev("window.__gastosFalsos.reiniciar(); window.__modoCuentas?.poner('cada_uno'); window.__gastosFalsos.usar('ana', ['eric', 'ana', 'luis']).then(() => true)")
  await a.esp(900)
  await presUi('abrir')
  await a.esp(1500)
  await ev("document.querySelector('[data-pestana-cuenta=\"comun\"]')?.click(); true")
  await a.esp(500)
  await ev("document.querySelector('[data-anadir-gasto]')?.scrollIntoView({block:'center'}); document.querySelector('[data-anadir-gasto]')?.click(); true")
  await a.esp(1000)
  const bg = await botones('document.querySelector(\'[aria-labelledby="hoja-anadir-gasto"]\') ?? document')
  debe(!bg.includes('Para todos') && !bg.includes('Para mí'), '7e', 'en la cuenta del grupo no hay [Para todos]/[Para mí]')
  await a.escribir('input[aria-label="¿Cuánto ha costado en total?"]', '25')
  await a.esp(400)
  const pagan = await ev("Array.from(document.querySelectorAll('[data-personas-cuadradas=\"pagado\"] [data-persona-cuadrada]')).filter((p) => p.getAttribute('data-elegida') === '1').length")
  debe(pagan === 1, '7e', `(10N10) «¿Quién lo ha pagado?» en cuadrados: solo quien lo añade marcado (${pagan})`)
  debe(!(await ev("Boolean(document.querySelector('[data-gasto-entre-quien]'))")), '7e', '(10N10) sin «¿Para quién es?»: el gasto va a la pestaña desde la que se abre (hay «Solo para algunos»)')
  await a.captura(foto('04_anadir_gasto_cada_uno'))
  await ev("document.querySelector('[aria-labelledby=\"hoja-anadir-gasto\"] button[aria-label=\"Cerrar\"]')?.click(); true")
  await a.esp(600)
  await presUi('cerrar')
  await a.esp(500)

  /* ═══ 8b-d · presupuesto con «Lo tuyo» (Eric, cada uno lo suyo) ═══ */
  console.log('8b-d. Presupuesto con «Lo tuyo»')
  await ev("window.__gastosFalsos.reiniciar(); window.__modoCuentas?.poner('cada_uno', 3); window.__gastosFalsos.usar('eric', ['eric', 'ana', 'luis']).then(() => true)")
  await ev(`(() => {
    const U = window.__ruta
    const d = U.getState().route.answers?.dateRange?.start ?? '2026-10-18'
    U.setState((s) => ({ reservations: [{ id: 'n8-pan', kind: 'entrada', refId: 'Panteón', name: 'Panteón', placeNames: ['Panteón'], dateIso: d, dayNumber: null, time: '09:15', precio: { amount: 25, currency: 'EUR' }, paraQuien: ['eric'] }] }))
    return true
  })()`)
  await a.esp(900)
  await presUi('abrir')
  await a.esp(1500)
  t = await textoPres()
  debe(/Panteón/.test(t) && !/Lo tuyo/.test(t) && (await ev("document.querySelector('[data-importe-arriba]')?.textContent.trim()")) === '25 €', '8b-d', `(10N10) «Mi cuenta» de Eric: el Panteón y 25 € (${t.slice(0, 120)})`)
  await ev("document.querySelector('[data-pestana-cuenta=\"comun\"]')?.click(); true")
  await a.esp(500)
  debe(/0 €/.test(await textoPres()) && !/Panteón/.test(await textoPres()), '8b-d', '(10N10) en la cuenta del grupo: 0 € y sin el Panteón (es solo suyo)')
  await a.captura(foto('05_presupuesto_lo_tuyo'))
  await presUi('cerrar')
  await a.esp(600)
  // La misma pantalla en «Cuenta conjunta» de dos (Cuentas Modo 02b).
  await ev("window.__gastosFalsos.reiniciar(); window.__modoCuentas?.poner('conjunta', 2); window.__gastosFalsos.usar('eric', ['eric', 'ana']).then(() => true)")
  await a.esp(900)
  await presUi('abrir')
  await a.esp(1500)
  t = await textoPres()
  debe(/Cuenta conjunta/i.test(t) && /Panteón/.test(t) && !/Lo tuyo/.test(t), '8b-d', `(10N10) en cuenta conjunta, «Mi cuenta» tiene el Panteón (${t.slice(0, 120)})`)

  await a.captura(foto('05b_presupuesto_conjunta_lo_tuyo'))
  await presUi('cerrar')
  await a.esp(600)

  /* ═══ 0b-5 · presupuesto de quien viaja solo ═══ */
  console.log('0b-5. Presupuesto de quien viaja solo')
  await ponerGente('')
  await a.esp(900)
  await presUi('abrir')
  await a.esp(1500)
  t = await textoPres()
  debe(/Total del viaje/i.test(t), '0b-5', `(10N10) viajando solo: «Total del viaje» (${t.slice(0, 80)})`)
  debe(!/por persona/i.test(t), '0b-5', 'y sin «por persona»')
  await a.captura(foto('06_presupuesto_solo'))
  await presUi('cerrar')
  await a.esp(600)

  /* ═══ 8 · comprar la entrada a la misma hora ═══ */
  console.log('8. Comprar a la misma hora')
  await ev(`(() => { window.__ruta.setState((s) => ({ reservations: s.reservations.filter((r) => r.id !== 'n8-pan') })); return true })()`)
  await ponerGente('eric')
  await irAReservas()
  await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); const cab = b?.firstElementChild; if (cab && b.children.length < 2) cab.click(); return true })()`)
  await a.esp(1500)
  const botonColiseo = `(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).filter((x) => /Añádela/.test(x.textContent || '')).find((x) => /Coliseo/.test(x.closest('[class*="min-h-"]')?.textContent || '')); if (!b) return false; b.click(); return true })()`
  for (let i = 0; i < 40 && !(await ev(`(() => { const bloque = document.querySelector('[data-blk="entradas"]'); return Boolean(bloque) && Array.from(bloque.querySelectorAll('button')).some((x) => /Añádela/.test(x.textContent || '') && /Coliseo/.test(x.closest('[class*="min-h-"]')?.textContent || '')) })()`)); i++) await a.esp(500)
  await ev(botonColiseo)
  await a.esp(1500)
  const guardada = await ev(`(async () => {
    const hoja = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')
    if (!hoja) return null
    const fichas = Array.from(hoja.querySelectorAll('[role="group"] button')).filter((b) => !b.disabled)
    ;(fichas[1] ?? fichas[0]).click()
    await new Promise((r) => setTimeout(r, 1500))
    const g = hoja.querySelector('[data-guardar-reserva]')
    for (let i = 0; i < 30 && g.disabled; i++) await new Promise((r) => setTimeout(r, 300))
    g.click()
    await new Promise((r) => setTimeout(r, 1200))
    Array.from(document.querySelectorAll('button')).find((b) => /^De acuerdo$/.test((b.textContent || '').trim()))?.click()
    await new Promise((r) => setTimeout(r, 2500))
    const res = window.__ruta.getState().reservations.find((x) => /Coliseo/.test(x.refId))
    return res ? { time: res.time } : null
  })()`)
  debe(Boolean(guardada), '8', 'el administrador guarda su entrada del Coliseo')
  const horaDueno = guardada?.time ?? ''
  await ponerGente('luis')
  await a.esp(1200)
  await irAReservas()
  await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); const cab = b?.firstElementChild; if (cab && b.children.length < 2) cab.click(); return true })()`)
  await a.esp(1500)
  const abierta = await ev(`(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).find((x) => /Reservar la mía a la misma hora/.test(x.textContent || '')); if (!b) return false; b.click(); return true })()`)
  debe(abierta === true, '8', 'Luis ve [Reservar la mía a la misma hora]')
  await a.esp(1800)
  const bh = await botones('(document.querySelector(\'#add-reservation-heading\')?.closest(\'[role="dialog"]\') ?? document)')
  const comprar = bh.find((x) => /^Ir a comprar$/.test(x))
  const hh = (horaDueno || '').replace(/^0/, '')
  debe(Boolean(comprar), '8', `(10N10) el botón dice «Ir a comprar», sin hora (${comprar}; ${hh})`)
  debe(bh.includes('Ya la tengo · Guardarla'), '8', '«Ya la tengo · Guardarla» debajo')
  await a.captura(foto('07_comprar_misma_hora'))
  await ev("document.querySelector('[data-ya-la-tengo-guardarla]')?.scrollIntoView({ block: 'end' }); true")
  await a.esp(500)
  await a.captura(foto('07b_comprar_boton_y_ya_la_tengo'))
  await ev("window.open = () => null; document.querySelector('[data-guardar-reserva=\"comprar\"]')?.click(); true")
  await a.esp(700)
  await ev("document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); true")
  await a.esp(900)
  const pregunta = await ev("document.querySelector('[data-pregunta-compra]')?.innerText.replace(/\\s+/g, ' ') ?? null")
  debe(Boolean(pregunta) && /¿Has comprado la entrada del Coliseo/.test(pregunta) && /Guardar/.test(pregunta) && /Todavía no/.test(pregunta), '8', `al volver: «¿Has comprado la entrada…?» con [Guardar] y [Todavía no] (el nombre de la entrada es el de la reserva) (${pregunta})`)
  await a.esp(2500)
  await ev("document.querySelector('[data-pregunta-compra]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(500)
  await a.captura(foto('08_pregunta_al_volver'))
  await ev("document.querySelector('[data-compra-no]')?.click(); true")
  await a.esp(500)
  debe(!(await ev("Boolean(document.querySelector('[data-pregunta-compra]'))")), '8', '[Todavía no] cierra la pregunta')
} catch (e) {
  debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 400))
} finally {
  a.cerrar()
}

if (process.env.SIN_DESIGN !== '1') {
  const ir = (re) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => ${re}.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
  for (const [pieza, n, salida] of [['Reservas Cada Uno', '01', 'reservas_01'], ['Reservas Cada Uno', '02b', 'reservas_02b'], ['Reservas Cada Uno', '05', 'reservas_05'], ['Cuentas Modo', '01', 'cuentas_01'], ['Cuentas Modo', '02b', 'cuentas_02b'], ['Cuentas Modo', '05', 'cuentas_05']]) {
    await capturarDesign(`Piezas/${pieza}.dc.html`, path.join(SALIDA, `10n8_design_${salida}.jpg`), { despues: ir(`/^${n} ·/`) }).catch((e) => console.log('  (sin captura de Design)', pieza, n, e.message))
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
