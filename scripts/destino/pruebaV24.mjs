// La prueba de la Tanda V24: DÍAS con el alojamiento y el vehículo ARRIBA, y los DÍAS QUE YA PASARON («Hecho», sin cambios).
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV24.mjs     (Vite en 5173 y la API en 8787)
//  1. Pura: la regla de los días pasados, el orden y la zona horaria   2. En la app: bloques de arriba, día 1, vehículo, tarjetas compactas, días pasados, almacén, HOY, viaje terminado
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { diasPasados, hoyDelViaje, ordenRespetaLosPasados } from '../../src/lib/diasPasados.ts'
import { todayIso } from '../../src/lib/dateRange.ts'

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
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V24_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. La regla (pura) ───────── */
console.log('1. La regla de los días pasados')
{
  const ruta = (destino = 'Roma') => ({ destination: destino, answers: { dateRange: { start: '2026-10-17', end: '2026-10-20' } }, days: [1, 2, 3, 4].map((n) => ({ id: `d${n}`, dayNumber: n })) })
  const r = ruta()
  debe([...diasPasados(r, '2026-10-16')].length === 0, 'antes', 'antes del viaje, ningún día ha pasado')
  debe([...diasPasados(r, '2026-10-17')].length === 0, 'hoy', 'el día 1 siendo hoy: ninguno ha pasado (el de hoy sí se cambia)')
  debe(JSON.stringify([...diasPasados(r, '2026-10-18')]) === '["d1"]', 'dia2', 'estando en el día 2, el día 1 ha pasado')
  debe(JSON.stringify([...diasPasados(r, '2026-10-19')]) === '["d1","d2"]', 'dia3', 'estando en el día 3, los días 1 y 2 han pasado')
  debe([...diasPasados(r, '2026-11-30')].length === 4, 'terminado', 'con el viaje terminado, todos los días han pasado')
  debe(diasPasados({ ...r, answers: {} }, '2026-10-19').size === 0, 'sin-fechas', 'sin fechas, ninguno')
  debe(ordenRespetaLosPasados(r, ['d1', 'd3', 'd2', 'd4'], '2026-10-18') === true, 'orden', 'mover días de después (3 y 2) con el 1 ya pasado: vale')
  debe(ordenRespetaLosPasados(r, ['d2', 'd1', 'd3', 'd4'], '2026-10-18') === false, 'orden', 'poner un día delante del que ya pasó: no vale')
  debe(ordenRespetaLosPasados(r, ['d2', 'd3', 'd4', 'd1'], '2026-10-18') === false, 'orden', 'mover un día pasado: no vale')
  // la zona horaria: a la misma hora, en Kiritimati (UTC+14) ya es otro día que en Pago Pago (UTC-11)
  const a = todayIso('Pacific/Kiritimati')
  const b = todayIso('Pacific/Pago_Pago')
  debe(/^\d{4}-\d{2}-\d{2}$/.test(a) && a > b, 'zona', `«hoy» se cuenta en la zona que se pide (Kiritimati ${a}, Pago Pago ${b})`)
  const roma = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const lz = new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  debe(hoyDelViaje(ruta('Roma')) === roma && hoyDelViaje(ruta('Lanzarote')) === lz, 'zona', 'el «hoy» del viaje es el de la zona de su destino (Roma, Lanzarote), no el del móvil')
  const f = leer('src/lib/todayMode.ts')
  debe(f.includes('zonaDelDestino(route.destination)'), 'zona', 'HOY y DÍAS cuentan el día con la misma zona del destino')
}

/* ───────── 2. En la app ───────── */
console.log('2. En la app')
async function viaje() {
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0', ancho: 375, alto: 812 })
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  return a
}
const estado = (a, js) => a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => { const S = m.useRouteStore; const st = S.getState(); return (${js})(S, st) })`)
const ponerDias = (a, extra = '{}') => estado(a, `(S, st) => { S.setState({ ...${extra} }); st.setMode('days'); return true }`)
const arriba = async (a) => {
  await abrirTodo(a)
  await a.evaluar("(() => { const d = document.querySelector('[data-day-id]'); const c = d && d.closest('.overflow-y-auto'); if (c) c.scrollTop = 0; return true })()")
  await a.esp(500)
}
const abrirTodo = (a) => a.evaluar("(() => { document.querySelectorAll('button').forEach((b) => { if (/^(Entendido|Vale|Cerrar)$/.test((b.textContent || '').trim()) || b.getAttribute('aria-label') === 'Cerrar') b.click() }); return true })()")

const app = await viaje()
try {
  const ids = JSON.parse(await estado(app, `(S, st) => JSON.stringify(st.route.days.map((d) => ({ id: d.id, n: d.dayNumber, ciudad: d.city, paradas: d.stops.map((p) => p.id), ret: Boolean(d.isReturnLeg) })))`))
  console.log(`   (viaje de prueba: ${ids.map((d) => `día ${d.n} ${d.paradas.length}p`).join(', ')})`)
  const d1 = ids[0].id
  const d2 = ids[1].id

  // —— A. Sin alojamiento, antes del viaje
  await ponerDias(app, "{ dev_simulated_today_iso: '2026-10-16', accommodationSelections: {}, rentalVehicleBooking: null }")
  await app.esp(1200)
  await abrirTodo(app)
  const a1 = await app.evaluar(`(() => { const b = document.querySelector('[data-alojamiento-dia-bloque]'); const primero = document.querySelector('[data-day-id]'); const todos = document.querySelectorAll('[data-alojamiento-dia-bloque]').length; return { hay: Boolean(b), tipo: b?.dataset.alojamientoDiaBloque, texto: (b?.innerText ?? '').split(String.fromCharCode(10)).join(' | '), antes: b && primero ? Boolean(b.compareDocumentPosition(primero) & Node.DOCUMENT_POSITION_FOLLOWING) : false, todos, borde: b ? getComputedStyle(b).borderStyle : '' } })()`)
  debe(a1.hay && a1.tipo === 'vacio' && a1.antes, 'arriba', 'sin alojamiento: el bloque sale ARRIBA, antes del primer día')
  debe(a1.texto.includes('Añade tu alojamiento') && a1.texto.includes('Para ajustar tu ruta a tu zona') && a1.borde === 'dashed', 'vacio', `con borde de puntos, «Añade tu alojamiento» y «Para ajustar tu ruta a tu zona» (${a1.texto})`)
  debe(await app.evaluar("Boolean(document.querySelector('[data-alojamiento-dia=\"anadir\"] svg'))"), 'mas', 'y el botón redondo [+]')
  await arriba(app)
  await app.captura(`${CAP}/dias_sin_alojamiento.jpg`)
  // abrir el día 1: no lleva el alojamiento dentro
  await estado(app, `(S, st) => { S.setState({ activeDayId: '${d1}' }); return true }`)
  await app.esp(1500)
  const dentro = await app.evaluar(`(() => { const d = document.querySelector('[data-day-id="${d1}"]'); return { aloj: d.querySelectorAll('[data-alojamiento-dia-bloque]').length, veh: d.querySelectorAll('[data-vehiculo-bloque]').length, comoLlegar: /Cómo llegar|Llegada|vuelo|Añade/i.test(d.innerText), texto: d.innerText.split(String.fromCharCode(10)).slice(0, 40).join(' | ') } })()`)
  debe(dentro.aloj === 0 && dentro.veh === 0, 'dentro', 'el día 1 abierto no lleva el alojamiento ni el vehículo dentro')
  debe(!/Añade tu alojamiento/.test(dentro.texto), 'dentro', 'ni «Añade tu alojamiento» dentro del día 1')
  debe(/LLEGADA/.test(dentro.texto), 'dia1', `el día 1 se queda con lo de llegar (${dentro.texto.slice(-120)})`)

  // —— B. Con alojamiento
  await estado(app, `(S, st) => { S.setState({ accommodationSelections: { '${d1}': { name: 'Hotel Palatino' } }, route: { ...st.route, accommodationAddress: 'Via dei Cappellari, 30' }, activeDayId: null }); return true }`)
  await app.esp(900)
  const a2 = await app.evaluar(`(() => { const b = document.querySelector('[data-alojamiento-dia-bloque]'); return { tipo: b?.dataset.alojamientoDiaBloque, texto: (b?.innerText ?? '').split(String.fromCharCode(10)).join(' | '), ir: Boolean(document.querySelector('[data-alojamiento-dia^="ir"]')), uno: document.querySelectorAll('[data-alojamiento-dia-bloque]').length } })()`)
  debe(a2.tipo !== 'vacio' && a2.texto.includes('ALOJAMIENTO') && a2.texto.includes('Hotel Palatino') && a2.ir && a2.uno === 1, 'con-aloj', `con alojamiento: «TU ALOJAMIENTO · …», el nombre y [Ir] (${a2.texto})`)
  await arriba(app)
  await app.captura(`${CAP}/dias_con_alojamiento.jpg`)
  await estado(app, `(S, st) => { S.setState({ activeDayId: '${d2}' }); return true }`)
  await app.esp(900)
  debe(await app.evaluar("Boolean(document.querySelector('[data-alojamiento-dia-bloque]'))"), 'se-queda', 'el bloque se queda (siempre) aunque se abra un día')

  // —— C. El vehículo de alquiler
  await estado(app, `(S, st) => { S.setState({ activeDayId: null, route: { ...st.route, transportContext: { ...st.route.transportContext, vehicle_type: 'car', vehicle_ownership: 'rental' } }, rentalVehicleBooking: null }); return true }`)
  await app.esp(900)
  const v1 = await app.evaluar(`(() => { const v = document.querySelector('[data-vehiculo-bloque]'); const primero = document.querySelector('[data-day-id]'); return { hay: Boolean(v), texto: (v?.innerText ?? '').split(String.fromCharCode(10)).join(' | '), antes: v && primero ? Boolean(v.compareDocumentPosition(primero) & Node.DOCUMENT_POSITION_FOLLOWING) : false, borde: v ? getComputedStyle(v).borderStyle : '' } })()`)
  debe(v1.hay && v1.antes && v1.borde === 'dashed' && v1.texto.includes('Añade tu vehículo de alquiler') && v1.texto.includes('Necesario para todo tu viaje') && !v1.texto.includes('Necesaria'), 'vehiculo', `sin reservar: el bloque de puntos arriba, «Necesario para todo tu viaje» (${v1.texto})`)
  await arriba(app)
  await app.captura(`${CAP}/dias_con_vehiculo.jpg`)
  await estado(app, `(S, st) => { S.setState({ rentalVehicleBooking: { provider: 'Europcar', startDate: '2026-10-17', endDate: '2026-10-19', precio: null } }); return true }`)
  await app.esp(700)
  debe(!(await app.evaluar("Boolean(document.querySelector('[data-vehiculo-bloque]'))")), 'vehiculo', 'reservado el vehículo, su bloque DESAPARECE de DÍAS')
  const unSolo = await app.evaluar("document.querySelectorAll('[data-vehiculo-bloque]').length")
  debe(unSolo === 0, 'vehiculo', 'y ya no sale en ningún sitio de DÍAS')
  await estado(app, `(S, st) => { S.setState({ rentalVehicleBooking: null, route: { ...st.route, transportContext: { ...st.route.transportContext, vehicle_type: 'car', vehicle_ownership: 'owned' } } }); return true }`)
  await app.esp(500)
  debe(!(await app.evaluar("Boolean(document.querySelector('[data-vehiculo-bloque]'))")), 'vehiculo', 'un viaje sin vehículo de alquiler no lleva el bloque')

  // —— D. Las tarjetas de los días, más compactas
  await estado(app, `(S, st) => { S.setState({ activeDayId: null }); return true }`)
  await app.esp(600)
  const m = await app.evaluar(`(() => { const tarjetas = Array.from(document.querySelectorAll('[data-day-id]')); const fila = (t) => t.querySelector('[role="button"]'); const alto = tarjetas.map((t) => Math.round(fila(t).getBoundingClientRect().height)); const sc = document.querySelector('.overflow-y-auto'); const r0 = tarjetas[0].getBoundingClientRect(); const vis = tarjetas.filter((t) => { const r = t.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight - 76 }).length; const titulo = tarjetas[0].querySelector('[data-titulo-del-dia]'); return { alto, vis, tituloPx: titulo ? getComputedStyle(titulo).fontSize : null, menos: Math.min(...alto) } })()`)
  debe(m.menos >= 44 && Math.max(...m.alto) <= 76, 'compactas', `las tarjetas cerradas miden ${m.alto.join(', ')} px de alto (antes, 80 como mínimo); la zona de tocar no baja de 44`)
  console.log(`   (días a la vista de una vez en un iPhone de 812 px, con los bloques de arriba: ${m.vis}; título ${m.tituloPx})`)

  // —— E. Estando en el día 2: el día 1 queda en «Hecho»
  await estado(app, `(S, st) => { S.setState({ dev_simulated_today_iso: '2026-10-18', activeDayId: null, accommodationSelections: {} }); return true }`)
  await app.esp(1200)
  const p = await app.evaluar(`(() => { const t = document.querySelector('[data-day-id="${d1}"]'); const t2 = document.querySelector('[data-day-id="${d2}"]'); const q = (e, s) => e.querySelector(s); const pasos = (e) => ({ pasado: e.dataset.diaPasado === '1', hecho: (q(e, '[data-dia-hecho]')?.innerText ?? ''), marca: Boolean(q(e, '[data-dia-hecho-marca]')), menu: Boolean(q(e, '[aria-label*="opciones" i], [aria-label*="Más"]')), fondo: getComputedStyle(e).backgroundColor }); return { d1: pasos(t), d2: pasos(t2), hoy: /(^|\\s)HOY(\\s|$)/.test(document.body.innerText) || Boolean(document.querySelector('[data-etiqueta-hoy]')), lista: Array.from(document.querySelectorAll('[data-day-id]')).map((e) => e.dataset.diaPasado === '1') } })()`)
  debe(p.d1.pasado && /^Hecho · (\d+ fotos?|Ver tu día)$/.test(p.d1.hecho.trim()) && p.d1.marca, 'hecho', `estando en el día 2, el día 1 sale en «Hecho» con su ✓ verde (${p.d1.hecho.trim()})`)
  debe(!p.d2.pasado && !p.d2.marca && p.d2.hecho === '', 'hoy', 'el día de hoy (2) sale normal, no en «Hecho»')
  debe(!p.hoy, 'sin-HOY', 'sin etiqueta «HOY» en el día de hoy')
  // (V27, decisión de Eric) El día pasado ya NO va en gris: el fondo es el de un día normal; solo se distingue por el ✓ verde y «Hecho · …».
  debe(p.d1.fondo !== 'rgb(243, 238, 226)' && p.d1.fondo === p.d2.fondo, 'gris', `el día pasado tiene el fondo de un día normal, sin gris (${p.d1.fondo} · ${p.d2.fondo})`)
  await arriba(app)
  await app.captura(`${CAP}/dias_dia1_hecho.jpg`)
  const asa = await app.evaluar(`(() => { const t = document.querySelector('[data-day-id="${d1}"]'); const cont = t.parentElement; const e = cont.querySelector('[data-edit-tool]'); return { tieneAsa: Boolean(e), visible: e ? getComputedStyle(e).display !== 'none' && e.offsetParent !== null : false, menu: Boolean(t.querySelector('button[aria-haspopup], button[aria-label*="Más"], button[aria-label*="opciones"]')) } })()`)
  debe(!asa.visible && !asa.menu, 'sin-asa', 'el día pasado no lleva asa para arrastrar ni los «…»')
  // se abre para verlo
  await app.evaluar(`document.querySelector('[data-day-id="${d1}"] [role="button"]').click(); true`)
  await app.esp(1800)
  const ab = await app.evaluar(`(() => { const t = document.querySelector('[data-day-id="${d1}"]'); const heads = Array.from(t.querySelectorAll('[data-edit-tool]')).filter((e) => e.offsetParent !== null).length; const paradas = t.innerText.length; return { abierto: paradas > 400, herramientas: heads, quien: Array.from(t.querySelectorAll('[data-edit-tool]')).filter((e) => e.offsetParent !== null).map((e) => e.innerText.trim().slice(0, 30) + '/' + e.getAttribute('aria-label')).join(' ; '), menus: t.querySelectorAll('[aria-label*="Más opciones"], [aria-label*="Opciones de"]').length, anadir: /\\+ Añadir parada/.test(t.innerText) } })()`)
  debe(ab.abierto, 'ver', 'el día pasado se abre para verlo (sus paradas)')
  debe(ab.herramientas === 0 && !ab.anadir, 'solo-lectura', `abierto, sin herramientas: ni asas ni «+ Añadir parada» (${ab.herramientas}: ${ab.quien}; añadir ${ab.anadir})`)
  await arriba(app)
  await app.captura(`${CAP}/dias_dia1_abierto.jpg`)
  await estado(app, `(S, st) => { S.setState({ activeDayId: null }); return true }`)

  // —— F. El almacén no deja cambiar un día pasado
  const antes = JSON.parse(await estado(app, `(S, st) => JSON.stringify({ dias: st.route.days.map((d) => d.id), d1: st.route.days[0].stops.map((p) => p.id + '@' + p.time), d2: st.route.days[1].stops.length })`))
  const parada = { id: 'v24-nueva', name: 'Parada de prueba V24', coordinates: { lat: 41.9, lng: 12.5 }, durationMinutes: 30, time: '10:00', category: 'otro' }
  const tras = JSON.parse(
    await estado(
      app,
      `(S, st) => { const g = () => S.getState(); const p = ${JSON.stringify(parada)}; const ids = g().route.days.map((d) => d.id); const primero = g().route.days[0].stops[0]?.id
        g().addPlaceToDay('${d1}', p, '10:00'); g().addStop('${d1}', { ...p, id: 'v24-b' }); g().insertStopAt('${d1}', 0, { ...p, id: 'v24-c' })
        if (primero) g().removeStop('${d1}', primero)
        g().reorderStops('${d1}', [...g().route.days[0].stops.map((x) => x.id)].reverse())
        g().reorderDays([ids[1], ids[0], ...ids.slice(2)]); g().reorderDays([...ids.slice(0, 1), ...ids.slice(1).reverse()])
        g().deleteDay('${d1}'); g().moveFreeDay('${d1}', 1)
        const r = g().route; return JSON.stringify({ dias: r.days.map((d) => d.id), d1: r.days[0].stops.map((x) => x.id + '@' + x.time), d2: r.days[1].stops.length, ordenDespues: r.days.map((d) => d.id) }) }`,
    ),
  )
  debe(tras.d1.join() === antes.d1.join(), 'almacen', 'el día pasado no deja añadir, quitar ni mover paradas (almacén)')
  debe(tras.dias[0] === antes.dias[0] && tras.dias.length === antes.dias.length, 'almacen', 'ni borrarlo ni ponerle otro día delante')
  const movidoVale = JSON.parse(await estado(app, `(S, st) => { const g = () => S.getState(); const ids = g().route.days.map((d) => d.id); g().reorderDays([ids[0], ids[2], ids[1], ...ids.slice(3)]); return JSON.stringify(g().route.days.map((d) => d.id)) }`))
  debe(movidoVale[0] === antes.dias[0] && movidoVale[1] === antes.dias[2], 'almacen', 'los días de después sí se pueden mover entre ellos')
  await estado(app, `(S, st) => { const g = () => S.getState(); g().reorderDays(${JSON.stringify(antes.dias)}); return true }`)

  // —— G. El día de HOY sí se cambia y sale en HOY
  const hoy = JSON.parse(await estado(app, `(S, st) => { const g = () => S.getState(); const p = ${JSON.stringify({ ...parada, id: 'v24-hoy', name: 'Parada nueva de hoy V24' })}; g().addPlaceToDay('${d2}', p, '16:00'); return JSON.stringify({ n: g().route.days[1].stops.length, esta: g().route.days[1].stops.some((x) => x.id === 'v24-hoy') }) }`))
  debe(hoy.n === antes.d2 + 1 && hoy.esta, 'hoy-edita', 'el día de hoy sí deja añadir una parada')
  await estado(app, `(S, st) => { st.setMode('today'); return true }`)
  await app.esp(2500)
  const enHoy = await app.evaluar("document.body.innerText.includes('Parada nueva de hoy V24')")
  debe(enHoy, 'hoy-sale', 'la parada añadida hoy en DÍAS sale al momento en HOY')
  await arriba(app)
  await app.captura(`${CAP}/hoy_con_la_parada.jpg`)
  await estado(app, `(S, st) => { st.setMode('days'); return true }`)

  // —— H. Viaje terminado: todos en «Hecho»
  await estado(app, `(S, st) => { S.setState({ dev_simulated_today_iso: '2026-11-30', activeDayId: null }); return true }`)
  await app.esp(1200)
  const fin = await app.evaluar("Array.from(document.querySelectorAll('[data-day-id]')).map((e) => e.dataset.diaPasado === '1' && Boolean(e.querySelector('[data-dia-hecho-marca]')))")
  debe(fin.length >= 3 && fin.every(Boolean), 'terminado', `con el viaje terminado, todos los días en «Hecho» (${fin.length})`)

  // —— I. Antes de empezar, ninguno
  await estado(app, `(S, st) => { S.setState({ dev_simulated_today_iso: '2026-10-01', activeDayId: null }); return true }`)
  await app.esp(900)
  debe(await app.evaluar("Array.from(document.querySelectorAll('[data-day-id]')).every((e) => e.dataset.diaPasado !== '1')"), 'antes', 'antes del viaje, ningún día en «Hecho»')
} finally {
  app.cerrar()
  await new Promise((r) => setTimeout(r, 600))
}

/* ───────── 3. El código ───────── */
console.log('3. El código')
{
  const dayList = leer('src/components/route/DayList.tsx')
  const panel = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(!/<AccommodationBlock|<VehicleBlock/.test(panel), 'codigo', 'el panel del día ya no pinta el alojamiento ni el vehículo')
  debe(/<AccommodationBlock/.test(dayList) && /<VehicleBlock/.test(dayList), 'codigo', 'la lista de días los pinta arriba')
  debe(!/HOY\s*<\/span>/.test(dayList) && !dayList.includes('data-etiqueta-hoy'), 'codigo', 'DÍAS ya no tiene la etiqueta «HOY»')
}

console.log(`\nPrueba de la Tanda V24: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
