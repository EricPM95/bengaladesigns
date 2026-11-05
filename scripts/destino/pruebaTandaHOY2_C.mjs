// La prueba de la tanda HOY2, agente C (5-nov-2026): «Quiero comer ahora» (24), «A la hora de comer» (Completa 4), «¿Qué hacemos con…?» (28), «Tu entrada corre peligro» (29 y 29b) y la lluvia (32 y 32b).
// Hace falta el servidor de la app (5173) y la API (8787, con DESTINOS_OCULTOS='-' para ver Lanzarote como administrador) YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY2_C.mjs
// Un solo Chrome, que se cierra al acabar. Salida: «N comprobaciones · M fallos». Capturas 390x844 (de TODO el scroll) en docs/dias/capturas_jutrip/hoy2_<tema>_<n>.jpg (el viaje de Eric en Lanzarote, martes 10).
// Reloj de mentira y ubicación de mentira: los de pruebaTandaHOY1_A (`window.__horaFalsa`, `window.__pos`, `window.__perm`).
//
// Pruebas viejas que cambian con esta tanda (antes → ahora → decisión de Eric, 5-nov): pruebaTandaHOY1_C (los avisos del tiempo: [Ver alternativa] ya no abre la pantalla C14 con Entra/Sale sino «Plan de lluvia» con el formato común de las propuestas;
// «Ha parado de llover» lleva [Ver plan] → «¿Volvemos al plan?», no [Volver al plan] directo) y pruebaTandaHOY2_A (el aviso de lluvia de Roma); ver sus cabeceras.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const png = (n) => path.join(SALIDA, `hoy2_${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

const ANTES = `(function(){const RD=Date;const base=RD.now();function fijo(){if(window.__horaFalsa==null)return null;const d=new RD();d.setHours(Math.floor(window.__horaFalsa/60),window.__horaFalsa%60,0,0);return d.getTime()+(RD.now()-base)%60000}class FD extends RD{constructor(...a){if(a.length===0){const f=fijo();super(f==null?RD.now():f)}else super(...a)}static now(){const f=fijo();return f==null?RD.now():f}}window.Date=FD;
Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok,no){const p=window.__pos;if(!p){no&&no({code:1});return}ok({coords:{latitude:p.lat,longitude:p.lng,accuracy:10}})},watchPosition(){return 1},clearWatch(){}},configurable:true});
try{navigator.permissions.query=async()=>({state:window.__perm||'denied',addEventListener(){},removeEventListener(){}})}catch(e){}})();`

const ROMA = /Roma|Fiumicino|Ciampino|Termini|Pante[óo]n|Trastevere|Vaticano|Coliseo|Trevi|Pincio|Jan[ií]culo|Cap[ií]tolio/i
const textosVistos = []
const MIRADOR = { lat: 29.2145, lng: -13.4812 }
// A 2 km del Mirador del Río (para no estar «ya aquí»)
const CERCA_DEL_MIRADOR = { lat: 29.2145, lng: -13.4612 }
const CUEVA = { lat: 29.1609, lng: -13.43885 }
const por = (f) => Array.from({ length: 24 }, (_, h) => f(h))
const SECO = { probability: por(() => 0), precipitation: por(() => 0), cloud: por(() => 10), gust: por(() => 15) }

let _a = null
const ev = (expr) => _a.evaluar('(async () => (' + expr + '))()')
async function abrir() {
  for (let intento = 0; intento < 3; intento++) {
    const a = (_a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES }))
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'")); i++) await a.esp(500)
    await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true)`)
    for (let i = 0; i < 180 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
    if (await ev(`${R}.getState().route ? true : false`).catch(() => false)) {
      await a.esp(2500)
      for (let i = 0; i < 4; i++) {
        const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!hecho) break
        await a.esp(600)
      }
      return a
    }
    a.cerrar()
  }
  throw new Error('No se pudo crear el viaje de Lanzarote')
}

let ORIGINAL = null
/** Prepara el martes 10 (día 3) con la hora `min`, la ubicación `pos` y vuelve a montar HOY. `mut` (JavaScript) cambia la ruta `r`; `tiempo` es la previsión de mentira; `limpiar:false` no borra lo apuntado en el móvil. */
async function ir(a, { min = 715, mut = '', pos = null, perm = 'denied', tiempo = SECO, horaLocal = 12, limpiar = true } = {}) {
  if (!(await ev(`${R}.getState().route ? true : false`).catch(() => false))) {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true)`)
    for (let i = 0; i < 180 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
  }
  if (!ORIGINAL) ORIGINAL = await ev(`JSON.stringify(${R}.getState().route)`)
  await a.evaluar(`(async () => {
    const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
    const r = JSON.parse(${JSON.stringify(ORIGINAL)})
    const dia = (n) => r.days.find((d) => d.dayNumber === n)
    const parada = (d, nombre) => d.stops.find((s) => s.name.startsWith(nombre))
    r.days.forEach((d) => { delete d.sunsetText; delete d.rainBackup; numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset; delete s.reservationTime }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { ${limpiar ? "Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy')).forEach((k) => localStorage.removeItem(k));" : ''} localStorage.setItem('trazo:logros:permisos-vistos', '1'); sessionStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/components/logros/visto/vistoStore.ts')).useVistoStore.getState().poner({ permisos: false }) } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${JSON.stringify(perm)}
    window.__hoy1HoraLocal = ${horaLocal}; window.__hoy1Tiempo = ${JSON.stringify(tiempo)}
    const ini = r.answers.dateRange.start; const d = new Date(ini + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 2); const iso = d.toISOString().slice(0, 10)
    st.getState().setDevSimulatedTodayIso(iso); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return iso })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(2800)
}
const txt = (a, sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
const hay = (a, sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const cuantos = (a, sel) => a.evaluar(`document.querySelectorAll(${JSON.stringify(sel)}).length`)
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const hoja = async (a) => {
  const t = await a.evaluar("(() => { const d = document.querySelectorAll('[role=\"dialog\"]'); return d.length ? d[d.length - 1].innerText.replace(/\\s+/g, ' ').trim() : null })()")
  if (t) textosVistos.push(t)
  return t
}
const hojaSinRegistrar = (a) => a.evaluar("(() => { const d = document.querySelectorAll('[role=dialog]'); return d.length ? d[d.length - 1].innerText.replace(/\\s+/g, ' ').trim() : null })()")
/** Abre la hoja de «Quiero comer ahora»: por [Cambiar plan] (la tarjeta de la parada) o, si ya es la hora de comer, por [Cambiar] (la tarjeta de la comida). */
const abrirComer = async (a) => {
  if (await hay(a, '[data-hoy-cambiar-plan]')) {
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="comer"]')
  } else await clic(a, '[data-hoy-comida-cambiar]')
}
/** La captura de TODO el scroll de HOY (390 de ancho): se estira la ventana a lo que mide el contenido y se vuelve a 844. */
const capturaEntera = async (a, nombre) => {
  // (las hojas de «Guarda un recuerdo» salen al marcar paradas a mano en la prueba: se quitan para la captura)
  await a.evaluar("(() => { document.querySelectorAll('[role=dialog] button[aria-label=Cerrar], button[aria-label=Cerrar]').forEach((b) => { if (!b.closest('[data-hoy-v2]')) b.click() }); return true })()")
  await a.esp(900)
  await a.evaluar("(() => { const c = document.querySelector('[data-hoy-v2]'); if (c) c.scrollTop = 0; return true })()")
  const alto = await a.evaluar("(() => { const c = document.querySelector('[data-hoy-v2]'); if (!c) return 844; const r = c.getBoundingClientRect(); return Math.ceil(c.scrollHeight + r.top + (window.innerHeight - r.bottom)) })()")
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: Math.max(844, Math.min(alto, 7000)), deviceScaleFactor: 1, mobile: true })
  await a.esp(900)
  await a.captura(png(nombre))
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await a.esp(400)
}
/** La hoja abierta, entera: se estira la ventana a lo que mide su contenido. */
const capturaHoja = async (a, nombre) => {
  const alto = await a.evaluar("(() => { const d = document.querySelectorAll('[role=\"dialog\"]'); const h = d[d.length - 1]; if (!h) return 844; const c = h.children[1]; return Math.ceil((c ? c.scrollHeight : 700) / 0.88) + 24 })()")
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: Math.max(844, Math.min(alto, 2400)), deviceScaleFactor: 1, mobile: true })
  await a.esp(1500)
  await a.captura(png(nombre))
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await a.esp(400)
}
/** El estado que importa del día 3 para comparar «como estaba»: hora, saltada y visto de cada parada, la lista de «Si te sobra tiempo», la comida y su restaurante, y el resto de días. */
const snap = () =>
  ev(`(async () => { const r = ${R}.getState().route; return JSON.stringify(r.days.map((d) => ({ n: d.dayNumber, stops: d.stops.map((s) => [s.id, s.time, Boolean(s.saltada), Boolean(s.checkedInAt)]), spare: (d.spareStops ?? []).map((s) => s.id), meals: d.meals.map((m) => [m.id, m.time, m.chosenRestaurant?.name ?? null]), ma: d.mealAfter ?? null, backup: Boolean(d.rainBackup) }))) })()`)
const dia3 = () => ev(`(async () => { const d = ${R}.getState().route.days.find((x) => x.dayNumber === 3); return JSON.stringify({ stops: d.stops.map((s) => ({ id: s.id, n: s.name, t: s.time, saltada: Boolean(s.saltada), visto: Boolean(s.checkedInAt), res: s.reservationTime ?? null })), spare: (d.spareStops ?? []).map((s) => s.name), meals: d.meals.map((m) => ({ id: m.id, t: m.time, sitio: m.chosenRestaurant?.name ?? null })), backup: d.rainBackup ? d.rainBackup.motivo ?? 'si' : null }) })()`).then((x) => JSON.parse(x))

const MUT_VISTOS = `const d3 = dia(3); parada(d3, 'Jameos').checkedInAt = '2026-11-10T10:55:00Z'; parada(d3, 'Cueva').checkedInAt = '2026-11-10T12:10:00Z'; const cm = parada(d3, 'Casa-Museo'); cm.time = '16:30'; cm.reservationTime = '16:30';`
const MUT_COMIDA = `const d3 = dia(3); parada(d3, 'Jameos').checkedInAt = '2026-11-10T10:55:00Z'; parada(d3, 'Cueva').checkedInAt = '2026-11-10T12:10:00Z'; parada(d3, 'Mirador del R').checkedInAt = '2026-11-10T13:30:00Z'; d3.meals.find((m) => m.mealTime === 'lunch').recommendedRestaurant = { name: 'El Veril', coordinates: { lat: 29.23045, lng: -13.50374 }, zone: 'Haría' };`

let nSec = 0
const SOLO = process.env.PARTES ? process.env.PARTES.split(',').map(Number) : null
const sec = async (fn) => {
  nSec++
  if (SOLO && !SOLO.includes(nSec)) return
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `la prueba se ha parado en la parte ${nSec}: ${String(e?.message ?? e).slice(0, 400)}`)
  }
}

const a = await abrir()
try {
  /* ───────────── 0. Los motores, sin pantalla ───────────── */
  await sec(async () => {
    const r = await a.evaluar(`(async () => {
      const c = await import('/src/lib/hoyComer.ts')
      const o = {}
      const dia = (iso) => iso
      const v = c.ventanasDeHorario
      const abre = (txt, dow, min, cierra = []) => { const w = v(txt, cierra); const x = w && w.get(dow); return Boolean(x && x.some(([i, f]) => min >= i && min <= f)) }
      // Roma: «Lun-Sáb 12:30-15:00, 19:00-23:00. Domingo cerrado.»
      o.roma1 = [abre('Lun-Sáb 12:30-15:00, 19:00-23:00. Domingo cerrado.', 2, 13 * 60), abre('Lun-Sáb 12:30-15:00, 19:00-23:00. Domingo cerrado.', 2, 16 * 60), abre('Lun-Sáb 12:30-15:00, 19:00-23:00. Domingo cerrado.', 0, 13 * 60), abre('Lun-Sáb 12:30-15:00, 19:00-23:00. Domingo cerrado.', 6, 21 * 60)]
      o.roma2 = [abre('Mar-Sáb 12:30-15:00, 19:30-23:00. Domingo 12:30-15:00. Lunes cerrado.', 0, 13 * 60), abre('Mar-Sáb 12:30-15:00, 19:30-23:00. Domingo 12:30-15:00. Lunes cerrado.', 1, 13 * 60)]
      o.roma3 = [abre('Jue-Mar 18:30-00:30. Miércoles cerrado.', 5, 23 * 60), abre('Jue-Mar 18:30-00:30. Miércoles cerrado.', 3, 23 * 60), abre('Todos los días 12:00-00:00.', 1, 23 * 60 + 40)]
      // Lanzarote: prosa
      o.lz1 = [abre('de martes a sábado de 13:00 a 18:00; cierra domingo y lunes.', 2, 14 * 60), abre('de martes a sábado de 13:00 a 18:00; cierra domingo y lunes.', 1, 14 * 60), abre('de jueves a lunes de 10:00 a 22:00; cierra martes y miércoles.', 2, 14 * 60)]
      o.lz2 = [abre('de miércoles a sábado de 11:00 a 23:00; de domingo a martes de 11:00 a 18:00, es decir, sin cenas.', 2, 21 * 60), abre('de miércoles a sábado de 11:00 a 23:00; de domingo a martes de 11:00 a 18:00, es decir, sin cenas.', 2, 15 * 60), abre('Wanderlog da de lunes a sábado de 10:00 a 20:00 y domingo de 11:00 a 19:00. La Maleta Inquieta da de lunes a sábado de 9:00 a 18:00.', 0, 11 * 60 + 30), abre('Wanderlog da de lunes a sábado de 10:00 a 20:00 y domingo de 11:00 a 19:00. La Maleta Inquieta da de lunes a sábado de 9:00 a 18:00.', 0, 19 * 60 + 40)]
      o.sinDatos = [v('sin confirmar.') === null, v('') === null, v(null) === null, v('Horario variable.') === null]
      // El estado: sin horario claro no es «abierto»
      o.estado = [c.horarioDeComer({ schedule: 'sin confirmar.', hours_data: {} }, '2026-11-10', 13 * 60).abierto, c.horarioDeComer({ schedule: 'Todos los días 12:00-23:00.', hours_data: { closed_on: ['martes'] } }, '2026-11-10', 13 * 60).abierto, c.horarioDeComer({ schedule: 'Todos los días 12:00-23:00.', hours_data: {} }, '2026-11-10', 22 * 60 + 45).abierto, c.horarioDeComer({ schedule: 'Todos los días 12:00-23:00.', hours_data: {} }, '2026-11-10', 13 * 60).abierto]
      return JSON.stringify(o)
    })()`)
    const o = JSON.parse(r)
    debe(JSON.stringify(o.roma1) === '[true,false,false,true]', 'horario', `Roma «Lun-Sáb 12:30-15:00, 19:00-23:00. Domingo cerrado.» (${JSON.stringify(o.roma1)})`)
    debe(JSON.stringify(o.roma2) === '[true,false]', 'horario', `Roma «Mar-Sáb… Domingo 12:30-15:00. Lunes cerrado.» (${JSON.stringify(o.roma2)})`)
    debe(JSON.stringify(o.roma3) === '[true,false,true]', 'horario', `«Jue-Mar 18:30-00:30. Miércoles cerrado.» y «00:00» como medianoche (${JSON.stringify(o.roma3)})`)
    debe(JSON.stringify(o.lz1) === '[true,false,false]', 'horario', `Lanzarote «de martes a sábado… cierra domingo y lunes» (${JSON.stringify(o.lz1)})`)
    debe(JSON.stringify(o.lz2) === '[false,true,true,false]', 'horario', `Lanzarote «de domingo a martes de 11:00 a 18:00», y la primera fuente manda (${JSON.stringify(o.lz2)})`)
    debe(o.sinDatos.every(Boolean), 'horario', 'sin horario claro (sin confirmar, vacío, variable): no se dice que esté abierto')
    debe(JSON.stringify(o.estado) === '[null,false,false,true]', 'horario', `el estado: sin datos = null; closed_on = cerrado; a 15 min de cerrar = cerrado; abierto (${JSON.stringify(o.estado)})`)
  })

  /* ───────────── 1. Quiero comer ahora (24) ───────────── */
  await sec(async () => {
    await ir(a, { min: 12 * 60 + 50, mut: MUT_VISTOS, pos: CERCA_DEL_MIRADOR, perm: 'granted' })
    const inicio = await snap()
    debe(await hay(a, '[data-hoy-cambiar-plan]'), '24 puerta', 'la tarjeta de la parada tiene [Cambiar plan]')
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    debe(/Quiero comer ahora/.test((await txt(a, '[data-cambiar-opcion="comer"]')) ?? ''), '24 puerta', 'la hoja de [Cambiar plan] lleva «Quiero comer ahora»')
    await clic(a, '[data-cambiar-opcion="comer"]')
    await a.esp(2500)
    const t = (await hoja(a)) ?? ''
    debe(await hay(a, '[data-comer-hoja="lista"]'), '24 hoja', 'abre la hoja de restaurantes')
    debe(!/Va con retraso|Voy con retraso/.test(t), '24 hoja', 'no es la hoja de retraso')
    const nombres = await a.evaluar("Array.from(document.querySelectorAll('[data-comer-fila]')).map((e) => e.getAttribute('data-comer-fila'))")
    debe(nombres.length >= 2, '24 abiertos', `salen restaurantes abiertos (${nombres.join(' · ')})`)
    // Solo abiertos: se comprueba cada uno con el motor, y los que se sabe que no deben salir
    const cierto = await a.evaluar(`(async () => {
      const { fetchDestinationPlaces } = await import('/src/lib/destinationPlacesApi.ts'); const c = await import('/src/lib/hoyComer.ts')
      const cat = await fetchDestinationPlaces('Lanzarote'); const nombres = ${JSON.stringify(nombres)}
      return JSON.stringify(nombres.map((n) => [n, c.horarioDeComer(cat.places.find((p) => p.kind === 'restaurant' && p.name === n), '2026-11-10', 12 * 60 + 50).abierto]))
    })()`)
    debe(JSON.parse(cierto).every(([, ab]) => ab === true), '24 abiertos', `todos los que salen están abiertos a las 12:50 (${cierto})`)
    debe(!nombres.some((n) => /Casa de la Playa|El Amanecer|Brisa Marina|Punta Fariones|Dunas de Famara|Villa Toledo|Carmencita/.test(n)), '24 abiertos', 'ninguno cerrado (martes), sin horario o que abre más tarde')
    debe((await cuantos(a, '[data-comer-abierto]')) === nombres.length, '24 abiertos', 'cada fila dice «Abierto»')
    debe((await cuantos(a, '[data-comer-ir-aqui]')) === nombres.length, '24 ir aquí', 'cada fila lleva [Ir aquí]')
    debe(await hay(a, '[data-comer-mapa]'), '24 mapa', 'la hoja lleva el mapa')
    debe(!ROMA.test(t), 'sin_roma', 'la hoja no habla de Roma')
    // Orden por cercanía
    const mins = await a.evaluar("Array.from(document.querySelectorAll('[data-comer-minutos]')).map((e) => parseInt(e.textContent))")
    debe(mins.every((m, i) => i === 0 || m >= mins[i - 1]), '24 cercanos', `de más cerca a más lejos (${mins.join(', ')})`)
    await capturaHoja(a, 'comer_24_lista')
    // [Ir aquí]: la comida pasa a ahora y el resto se recoloca, como PROPUESTA
    const antesMeal = (await dia3()).meals.find((m) => m.id === 'meal-3-lunch')
    await clic(a, '[data-comer-ir-aqui]')
    await a.esp(800)
    const p = (await hoja(a)) ?? ''
    debe((await dia3()).meals.find((m) => m.id === 'meal-3-lunch').sitio === antesMeal.sitio, '24 propuesta', 'elegir un sitio no mueve nada: antes hay propuesta')
    debe(/Cambia:/.test(p) && /Se mantiene:/.test(p) && /Aplicar/.test(p) && /Volver a mi ruta original/.test(p), '24 formato', `con el formato común (${p.slice(0, 220)})`)
    debe(/La comida pasa a ahora, en/.test(p), '24 cambia', 'dice que la comida pasa a ahora')
    debe(/Casa-Museo|4:30|16:30|tu entrada/i.test((await txt(a, '[data-propuesta="mantiene"]')) ?? ''), '24 mantiene', `«Se mantiene» nombra lo fijo (${await txt(a, '[data-propuesta="mantiene"]')})`)
    debe(!/\d+\s*min/.test(p.replace(/\d+:\d+/g, '')), '24 sin minutos', 'sin minutos crudos en la propuesta')
    await capturaHoja(a, 'comer_24_propuesta')
    // [Ver otra opción] si hay
    const hayOtra = await hay(a, '[data-propuesta-otra]')
    if (hayOtra) {
      const c1 = await txt(a, '[data-propuesta="cambia"]')
      await clic(a, '[data-propuesta-otra]')
      await a.esp(500)
      debe((await txt(a, '[data-propuesta="cambia"]')) !== c1, '24 otra', '[Ver otra opción] enseña otra propuesta')
      await clic(a, '[data-propuesta-otra]')
      await a.esp(400)
    }
    const sitioElegido = ((await txt(a, '[data-propuesta="cambia"]')) ?? '').match(/en ([^,]+?)(?: y |$)/)?.[1] ?? ''
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(1000)
    const d = await dia3()
    const cm = d.stops.find((s) => s.n.startsWith('Casa-Museo'))
    debe(cm.t === '16:30' && cm.res === '16:30' && !cm.saltada, '24 fija', `la entrada de las 16:30 no se mueve (${cm.t}, ${cm.res}, saltada ${cm.saltada})`)
    const comida = d.meals.find((m) => m.id === 'meal-3-lunch')
    debe(comida.sitio != null && comida.t !== antesMeal.t, '24 aplicar', `la comida pasa a ahora y a ese sitio (${antesMeal.t} → ${comida.t}, ${comida.sitio}; propuesto «${sitioElegido}»)`)
    const mt = comida.t.split(':').map(Number)
    debe(mt[0] * 60 + mt[1] >= 12 * 60 + 50 && mt[0] * 60 + mt[1] <= 13 * 60 + 40, '24 aplicar', `a la hora de ahora, no a otra (${comida.t})`)
    // Lo imprescindible no se quita sin preguntar
    const quitadas = d.stops.filter((s) => s.saltada).map((s) => s.n)
    debe(!quitadas.some((n) => /Mirador del R[ií]o/.test(n)), '24 prioridad', `lo que se quita no es lo imprescindible (${quitadas.join(', ') || 'nada'})`)
    const aviso = (await txt(a, '[data-plan-actualizado]')) ?? ''
    debe(/Plan actualizado/.test(aviso) && /Deshacer/.test(aviso), '30 aviso', `«Plan actualizado · Deshacer» (${aviso})`)
    debe((await cuantos(a, '[data-plan-actualizado]')) === 1, '30 aviso', 'y solo uno')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(800)
    debe((await snap()) === inicio, 'deshacer', '[Deshacer] deja el día (y los demás) como estaba')
    // Volver a mi ruta original (dos cambios)
    for (let i = 0; i < 2; i++) {
      await abrirComer(a)
      await a.esp(1800)
      await clic(a, '[data-comer-ir-aqui]')
      await a.esp(700)
      await clic(a, '[data-propuesta-aplicar]')
      await a.esp(900)
    }
    debe((await snap()) !== inicio, 'original', 'hay cambios hechos antes de volver a la original')
    await abrirComer(a)
    await a.esp(1800)
    await clic(a, '[data-comer-ir-aqui]')
    await a.esp(700)
    await clic(a, '[data-propuesta-original]')
    await a.esp(900)
    debe((await snap()) === inicio, 'original', '«Volver a mi ruta original» deja el día como estaba')
  })

  /* ───────────── 1b. Si no hay ningún restaurante abierto cerca ───────────── */
  await sec(async () => {
    await ir(a, { min: 12 * 60 + 50, mut: MUT_VISTOS, pos: { lat: 28.84292, lng: -13.78813 }, perm: 'granted' })
    await clic(a, '[data-hoy-cambiar-plan]')
    await a.esp(500)
    await clic(a, '[data-cambiar-opcion="comer"]')
    await a.esp(2200)
    const t = (await hoja(a)) ?? ''
    debe((await cuantos(a, '[data-comer-fila]')) === 0 || /Abierto/.test(t), '24 vacío', 'lejos de todo, o no sale ninguno o los que salen están a tiro')
  })

  /* ───────────── 2. A la hora de comer (Completa 4) ───────────── */
  await sec(async () => {
    await ir(a, { min: 13 * 60 + 54, mut: MUT_COMIDA, pos: MIRADOR, perm: 'granted' })
    debe(await hay(a, '[data-hoy-comida]'), 'Completa 4', 'a la hora de comer, la tarjeta de la comida')
    debe(!(await hay(a, '[data-hoy-siguiente]')), 'Completa 4', 'sustituye a la tarjeta de la parada')
    const titulo = (await txt(a, '[data-hoy-comida-titulo]')) ?? ''
    debe(/^Tu restaurante está a \d+ minutos?$/.test(titulo), 'Completa 4', `«Tu restaurante está a N minutos» (${titulo})`)
    const cab = (await txt(a, '[data-hoy-cabecera]')) ?? ''
    debe(/Hora de comer/.test(cab), 'Completa 4', `la cabecera dice «Hora de comer» (${cab})`)
    const tray = (await txt(a, '[data-hoy-comida-trayecto]')) ?? ''
    debe(/En coche · \d+ min/.test(tray) && /El Veril/.test(tray), 'Completa 4', `«En coche · N min» y el sitio (${tray})`)
    debe(await hay(a, '[data-hoy-comida-como-llegar]'), 'Completa 4', 'lleva [Cómo llegar]')
    const href = await a.evaluar("document.querySelector('[data-hoy-comida-como-llegar]')?.href ?? ''")
    debe(/29\.23045/.test(href) && /driving/.test(href), 'Completa 4', `[Cómo llegar] va al restaurante en coche (${href.slice(0, 90)})`)
    debe(await hay(a, '[data-hoy-comida-cambiar]'), 'Completa 4', 'lleva [Cambiar]')
    debe(!ROMA.test((await txt(a, '[data-hoy-comida]')) ?? ''), 'sin_roma', 'sin textos de Roma')
    const orden = await a.evaluar(`(() => { const r = document.querySelector('[data-hoy-v2]'); const t = Array.from(r.querySelectorAll('*')); const q = (s) => t.indexOf(r.querySelector(s)); return [q('[data-hoy-cabecera]'), q('[data-hoy-comida]'), q('[data-cerca-de-ti]'), q('[data-hoy-tu-dia]')] })()`)
    debe(orden.every((x) => x >= 0) && orden.every((x, i) => i === 0 || x > orden[i - 1]), 'Completa 4', `orden: cabecera · comida · Cerca de ti · Tu día (${orden.join(',')})`)
    await capturaEntera(a, 'comer_c4_hora_de_comer')
    // [Cambiar] abre la misma hoja
    await clic(a, '[data-hoy-comida-cambiar]')
    await a.esp(2200)
    debe(await hay(a, '[data-comer-hoja="lista"]'), 'Completa 4 cambiar', '[Cambiar] abre la misma hoja de «Quiero comer ahora»')
    await clic(a, '[data-comer-ir-aqui]')
    await a.esp(700)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(1000)
    debe(/en .+/.test((await txt(a, '[data-hoy-comida-trayecto]')) ?? '') || (await hay(a, '[data-hoy-comida]')), 'Completa 4 cambiar', 'tras aplicarlo, la tarjeta sigue con el sitio nuevo')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(700)
    // Ya he comido: vuelve la parada
    await clic(a, '[data-hoy-comida-hecha]')
    await a.esp(800)
    debe(!(await hay(a, '[data-hoy-comida]')) && (await hay(a, '[data-hoy-siguiente]')), 'Completa 4 hecha', '«Ya he comido» devuelve la tarjeta de la parada')
    // Un restaurante cerrado
    await ir(a, { min: 13 * 60 + 54, mut: MUT_COMIDA.replace("name: 'El Veril', coordinates: { lat: 29.23045, lng: -13.50374 }", "name: 'La Casa de la Playa', coordinates: { lat: 29.12816, lng: -13.46482 }"), pos: MIRADOR, perm: 'granted' })
    debe((await a.evaluar("document.querySelector('[data-hoy-comida]')?.getAttribute('data-hoy-comida-estado')")) === 'cerrado', 'Completa 4 cerrado', 'si su restaurante está cerrado hoy (La Casa de la Playa cierra los martes), la tarjeta lo dice y no manda allí')
    debe(!(await hay(a, '[data-hoy-comida-como-llegar]')), 'Completa 4 cerrado', 'sin [Cómo llegar] a un sitio cerrado')
    // Sin restaurante propio
    await ir(a, { min: 13 * 60 + 54, mut: MUT_COMIDA.replace(/d3\.meals\.find[^;]+;/, ''), pos: MIRADOR, perm: 'granted' })
    debe((await a.evaluar("document.querySelector('[data-hoy-comida]')?.getAttribute('data-hoy-comida-estado')")) === 'sin_sitio', 'Completa 4 sin sitio', 'sin restaurante, «Es hora de comer» con [Elegir sitio]')
    // Antes de la hora de comer, no sale
    await ir(a, { min: 11 * 60, mut: MUT_COMIDA, pos: MIRADOR, perm: 'granted' })
    debe(!(await hay(a, '[data-hoy-comida]')), 'Completa 4 hora', 'a las 11:00 todavía no toca comer')
  })

  /* ───────────── 3. ¿Qué hacemos con…? (28) ───────────── */
  await sec(async () => {
    const MUT = `const d3 = dia(3); parada(d3, 'Jameos').checkedInAt = '2026-11-10T10:55:00Z'`
    // Estás en la Cueva (sin marcarla)…
    await ir(a, { min: 11 * 60, mut: MUT, pos: CUEVA, perm: 'granted' })
    debe(!(await hay(a, '[data-no-marcada]')), '28 aqui', 'mientras estás en la parada, no pregunta')
    // …y te vas lejos sin marcarla
    await ir(a, { min: 11 * 60 + 40, mut: MUT, pos: MIRADOR, perm: 'granted', limpiar: false })
    await a.esp(800)
    debe(await hay(a, '[data-no-marcada]'), '28 pregunta', 'te alejas sin marcarla: pregunta')
    const t = (await hoja(a)) ?? ''
    debe(/¿Qué hacemos con Cueva de los Verdes\?/.test(t), '28 texto', `«¿Qué hacemos con la parada?» (${t.slice(0, 80)})`)
    debe(/Ya lo visité/.test(t) && /Lo dejo pendiente/.test(t) && /Ahora no/.test(t), '28 botones', 'con sus 3 botones')
    debe(/Lo marcamos como visto/.test(t) && /Se queda en «Tu día»/.test(t) && /No volvemos a preguntar/.test(t), '28 botones', 'y sus tres líneas de abajo')
    debe((await cuantos(a, '[data-no-marcada-opcion]')) === 3, '28 botones', 'exactamente 3')
    await capturaHoja(a, 'parada_28_que_hacemos')
    await clic(a, '[data-no-marcada-opcion="ahora_no"]')
    await a.esp(500)
    debe(!(await hay(a, '[data-no-marcada]')), '28 ahora no', '[Ahora no] cierra')
    // Una sola vez: se vuelve a montar HOY y no vuelve a preguntar
    await ir(a, { min: 11 * 60 + 45, mut: MUT, pos: MIRADOR, perm: 'granted', limpiar: false })
    await a.esp(800)
    debe(!(await hay(a, '[data-no-marcada]')), '28 una vez', 'no vuelve a preguntar (una sola vez)')
    // [Ya lo visité] marca la parada como vista
    await ir(a, { min: 11 * 60, mut: MUT, pos: CUEVA, perm: 'granted' })
    await ir(a, { min: 11 * 60 + 40, mut: MUT, pos: MIRADOR, perm: 'granted', limpiar: false })
    await a.esp(800)
    debe(await hay(a, '[data-no-marcada]'), '28 visite', 'otra vez la pregunta (apuntes borrados)')
    await clic(a, '[data-no-marcada-opcion="visite"]')
    await a.esp(700)
    debe((await dia3()).stops.find((s) => s.n.startsWith('Cueva')).visto === true, '28 visite', '[Ya lo visité] marca la parada como vista')
    // [Lo dejo pendiente]: no cambia nada y no vuelve a preguntar
    await ir(a, { min: 11 * 60, mut: MUT, pos: CUEVA, perm: 'granted' })
    await ir(a, { min: 11 * 60 + 40, mut: MUT, pos: MIRADOR, perm: 'granted', limpiar: false })
    await a.esp(800)
    const antes = await snap()
    await clic(a, '[data-no-marcada-opcion="pendiente"]')
    await a.esp(600)
    debe((await snap()) === antes && !(await hay(a, '[data-no-marcada]')), '28 pendiente', '[Lo dejo pendiente] no toca la parada y cierra')
    // Sin haber estado cerca, no pregunta
    await ir(a, { min: 11 * 60 + 40, mut: MUT, pos: MIRADOR, perm: 'granted' })
    await a.esp(800)
    debe(!(await hay(a, '[data-no-marcada]')), '28 sin estar', 'si nunca estuviste cerca, no pregunta')
  })

  /* ───────────── 4. Tu entrada corre peligro (29 y 29b) ───────────── */
  await sec(async () => {
    const MUT = `const d3 = dia(3); parada(d3, 'Cueva').reservationTime = '11:30'`
    // A tiempo: sin aviso
    await ir(a, { min: 10 * 60, mut: MUT, pos: CUEVA, perm: 'granted' })
    debe(!(await hay(a, '[data-hoy-peligro]')), '29 a tiempo', 'si llegas a tiempo, no hay aviso')
    // Lejos y tarde: Jameos antes, el turno de las 11:30 detrás
    await ir(a, { min: 10 * 60 + 50, mut: MUT, pos: CERCA_DEL_MIRADOR, perm: 'granted' })
    debe(await hay(a, '[data-hoy-peligro]'), '29 aviso', 'a tu ritmo no llegas al turno: aviso de peligro')
    const tx = (await txt(a, '[data-hoy-peligro-texto]')) ?? ''
    debe(/Tu entrada de las 11:30 en Cueva de los Verdes corre peligro\./.test(tx), '29 texto', `«Tu entrada… corre peligro» (${tx})`)
    debe(await hay(a, '[data-hoy-peligro] [data-hoy-aviso-x]'), '29 X', 'lleva su X')
    debe(await hay(a, '[data-peligro-ver-solucion]'), '29 botón', 'lleva [Ver solución]')
    const orden = await a.evaluar(`(() => { const r = document.querySelector('[data-hoy-v2]'); const t = Array.from(r.querySelectorAll('*')); const q = (s) => t.indexOf(r.querySelector(s)); return [q('[data-hoy-avisos]'), q('[data-hoy-peligro]'), q('[data-hoy-siguiente]')] })()`)
    debe(orden[1] > orden[0] && orden[2] > orden[1], '29 orden', `arriba, encima de la tarjeta (${orden.join(',')})`)
    debe(await a.evaluar("document.querySelector('[data-hoy-avisos] > *')?.hasAttribute('data-hoy-peligro') === true"), '29 primero', 'es el primero de los avisos (el más urgente), encima del cierre de horario')
    await capturaEntera(a, 'peligro_29_aviso')
    const inicio = await snap()
    await clic(a, '[data-peligro-ver-solucion]')
    await a.esp(700)
    const t = (await hoja(a)) ?? ''
    if (!/Cambia:/.test(t)) console.log('DEBUG 29b', t)
    debe(/Una solución/.test(t), '29b titulo', '«Una solución»')
    debe(/Llegarás tarde a tu entrada de las 11:30\./.test(t) || /tendríamos que dejar/.test(t), '29b intro', `«Llegarás tarde a tu entrada de las 11:30» (${t.slice(0, 160)})`)
    debe(/Cambia:/.test(t) && /Se mantiene:/.test(t) && /Aplicar|Sí, dejarlo/.test(t) && /Volver a mi ruta original/.test(t), '29b formato', 'Cambia… / Se mantiene… / [Aplicar] / «Volver a mi ruta original»')
    debe(/11:30/.test((await txt(a, '[data-propuesta="mantiene"]')) ?? ''), '29b mantiene', `«Se mantiene» nombra el turno (${await txt(a, '[data-propuesta="mantiene"]')})`)
    debe(/Jameos/.test((await txt(a, '[data-propuesta="cambia"]')) ?? ''), '29b cambia', `lo que sale es lo de antes del turno (${await txt(a, '[data-propuesta="cambia"]')})`)
    debe(!/\d+\s*min\b/.test(t), '29b sin minutos', 'sin minutos crudos')
    debe((await dia3()).stops.find((s) => s.n.startsWith('Jameos')).saltada === false && (await snap()) === inicio, '29b nada solo', 'ver la solución no mueve nada')
    await capturaHoja(a, 'peligro_29b_solucion')
    const pregunta = /Sí, dejarlo/.test(await txt(a, '[data-propuesta-aplicar]'))
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(1000)
    const d = await dia3()
    const cueva = d.stops.find((s) => s.n.startsWith('Cueva'))
    debe(cueva.t === '11:30' && cueva.res === '11:30' && !cueva.saltada, '29b fija', `la entrada de las 11:30 no se mueve (${cueva.t}, ${cueva.res})`)
    const jameos = d.stops.find((s) => s.n.startsWith('Jameos'))
    debe(jameos.saltada || jameos.t !== '10:00' || d.spare.length > 0, '29b aplicar', `Jameos ya no estorba antes del turno (${jameos.t}, saltada ${jameos.saltada}; spare ${d.spare.join(',')}; pregunta ${pregunta})`)
    debe(!(await hay(a, '[data-hoy-peligro]')), '29b resuelto', 'tras aplicarlo, el peligro se va')
    debe(/Plan actualizado/.test((await txt(a, '[data-plan-actualizado]')) ?? ''), '30 aviso', '«Plan actualizado · Deshacer»')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(800)
    debe((await snap()) === inicio, 'deshacer', '[Deshacer] deja el día como estaba')
    debe(await hay(a, '[data-hoy-peligro]'), '29 vuelve', 'y el peligro vuelve a avisar, porque sigue siendo verdad')
    // «Volver a mi ruta original»
    await clic(a, '[data-peligro-ver-solucion]')
    await a.esp(600)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(800)
    await ir(a, { min: 10 * 60 + 50, mut: MUT, pos: MIRADOR, perm: 'granted', limpiar: false })
    // La X: cierra y no vuelve ese día
    await clic(a, '[data-hoy-peligro] [data-hoy-aviso-x]')
    await a.esp(500)
    debe(!(await hay(a, '[data-hoy-peligro]')), '29 X', 'la X cierra el aviso')
    await ir(a, { min: 10 * 60 + 52, mut: MUT, pos: MIRADOR, perm: 'granted', limpiar: false })
    debe(!(await hay(a, '[data-hoy-peligro]')), '29 X', 'el aviso cerrado no vuelve ese día')
    // Pasada la hora, ya no avisa
    await ir(a, { min: 12 * 60 + 10, mut: MUT, pos: MIRADOR, perm: 'granted' })
    debe(!(await hay(a, '[data-hoy-peligro]')), '29 pasado', 'pasados 30 minutos de la hora, el aviso se va')
  })

  /* ───────────── 5. La lluvia (31, 32 y 32b) ───────────── */
  await sec(async () => {
    const LLUVIA = { probability: por((h) => (h >= 14 && h <= 20 ? 90 : 0)), precipitation: por((h) => (h >= 14 && h <= 20 ? 1.2 : 0)), cloud: por(() => 10), gust: por(() => 15) }
    const MUT = `const d3 = dia(3); parada(d3, 'Jameos').checkedInAt = '2026-11-10T10:55:00Z'; parada(d3, 'Cueva').checkedInAt = '2026-11-10T12:10:00Z'; parada(d3, 'Mirador del R').checkedInAt = '2026-11-10T13:30:00Z'; const cm = parada(d3, 'Casa-Museo'); cm.reservationTime = '16:14'; cm.reservedId = 'res-cm';`
    await ir(a, { min: 13 * 60, mut: MUT, tiempo: LLUVIA, horaLocal: 13 })
    await a.esp(1200)
    debe(await hay(a, '[data-aviso-tiempo="lluvia"]'), '32 aviso', 'con lluvia por la tarde, aviso del tiempo')
    const av = (await txt(a, '[data-aviso-tiempo="lluvia"]')) ?? ''
    debe(/Va a llover esta tarde/.test(av), '32 aviso', `«Va a llover esta tarde…» (${av})`)
    debe(await hay(a, '[data-aviso-tiempo="lluvia"] [data-hoy-aviso-x]'), '32 X', 'lleva su X')
    await capturaEntera(a, 'lluvia_32_aviso')
    const inicio = await snap()
    await clic(a, '[data-ver-alternativa]')
    await a.esp(700)
    const t = (await hoja(a)) ?? ''
    debe(/Plan de lluvia/.test(t), '32 titulo', '«Plan de lluvia»')
    debe(/Va a llover esta tarde\. Te proponemos un plan a cubierto\./.test(t), '32 intro', `«Va a llover esta tarde. Te proponemos un plan a cubierto.» (${t.slice(0, 140)})`)
    debe(/Cambia:/.test(t) && /Se mantiene:/.test(t) && /Aplicar/.test(t) && /Ver otra opción/.test(t) && /Volver a mi ruta original/.test(t), '32 formato', 'Cambia… / Se mantiene… / [Aplicar] / [Ver otra opción] / «Volver a mi ruta original»')
    debe(/sale|salen/.test((await txt(a, '[data-propuesta="cambia"]')) ?? '') && /entra|entran/.test((await txt(a, '[data-propuesta="cambia"]')) ?? ''), '32 cambia', `lo que sale y lo que entra (${await txt(a, '[data-propuesta="cambia"]')})`)
    debe(/Las reservas no se tocan/.test((await txt(a, '[data-propuesta="mantiene"]')) ?? ''), '32 mantiene', 'las reservas no se tocan')
    debe(!ROMA.test(t), 'sin_roma', 'sin textos de Roma')
    debe((await snap()) === inicio, '32 nada solo', 'ver la alternativa no mueve nada')
    await capturaHoja(a, 'lluvia_32_plan')
    // Otra opción: hoy toca descansar
    await clic(a, '[data-propuesta-otra]')
    await a.esp(500)
    debe(/descansar/.test((await txt(a, '[data-propuesta="cambia"]')) ?? ''), '32 otra', `[Ver otra opción]: hoy toca descansar (${await txt(a, '[data-propuesta="cambia"]')})`)
    await clic(a, '[data-propuesta-otra]')
    await a.esp(400)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(1000)
    let d = await dia3()
    debe(d.backup === 'lluvia', '32 aplicar', `se guarda la copia del día (${d.backup})`)
    debe(d.stops.find((s) => s.n.startsWith('Casa-Museo')).t === '16:14' && !d.stops.find((s) => s.n.startsWith('Casa-Museo')).saltada, '32 fija', 'la entrada reservada no se toca')
    debe(!d.stops.some((s) => /Har[ií]a y el Valle/.test(s.n)), '32 aplicar', 'lo que estaba al aire libre sale')
    debe(/Plan actualizado/.test((await txt(a, '[data-plan-actualizado]')) ?? ''), '30 aviso', '«Plan actualizado · Deshacer»')
    debe(await hay(a, '[data-tiempo-cambiado="lluvia"]'), '32 usando', 'y el aviso «Estás usando el plan de lluvia»')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(800)
    debe((await snap()) === inicio, 'deshacer', '[Deshacer] deja el día como estaba')
    // Aplicar de nuevo y dejar de llover: 32b
    await clic(a, '[data-ver-alternativa]')
    await a.esp(600)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(900)
    debe(!(await hay(a, '[data-ha-parado-de-llover]')), '32b aun', 'con lluvia por delante, no sale «Ha parado de llover»')
    const PARO = { probability: por((h) => (h >= 14 && h <= 16 ? 90 : 0)), precipitation: por((h) => (h >= 14 && h <= 16 ? 1.2 : 0)), cloud: por(() => 10), gust: por(() => 15) }
    await a.evaluar(`(() => { window.__hoy1Tiempo = ${JSON.stringify(PARO)}; window.__hoy1HoraLocal = 18; window.dispatchEvent(new Event('hoy1-tiempo')); return true })()`)
    await a.esp(1500)
    debe(await hay(a, '[data-ha-parado-de-llover]'), '32b aviso', 'al parar de llover sale el aviso')
    debe(/Ha parado de llover/.test((await txt(a, '[data-ha-parado-de-llover]')) ?? '') && (await hay(a, '[data-ver-plan]')), '32b aviso', '«Ha parado de llover.» con [Ver plan]')
    debe(await hay(a, '[data-ha-parado-de-llover] [data-hoy-aviso-x]'), '32b X', 'lleva su X')
    await capturaEntera(a, 'lluvia_32b_ha_parado')
    const conLluvia = await snap()
    await clic(a, '[data-ver-plan]')
    await a.esp(700)
    const v = (await hoja(a)) ?? ''
    debe(/¿Volvemos al plan\?/.test(v), '32b titulo', '«¿Volvemos al plan?»')
    debe(/Ha parado de llover\./.test(v) && /Cambia:/.test(v) && /vuelve|vuelven/.test(v) && /para otro día/.test(v), '32b texto', `«Cambia: … vuelve a tu ruta / … se queda para otro día» (${v.slice(0, 220)})`)
    debe(/Se mantiene:/.test(v) && /Las reservas no se tocan/.test(v) && /Aplicar/.test(v) && /Volver a mi ruta original/.test(v), '32b formato', 'Se mantiene… / [Aplicar] / «Volver a mi ruta original»')
    debe((await snap()) === conLluvia, '32b nada solo', 'ver el plan no mueve nada')
    await capturaHoja(a, 'lluvia_32b_volvemos')
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(1000)
    d = await dia3()
    debe(d.backup === null && d.stops.some((s) => /Har[ií]a y el Valle/.test(s.n)), '32b aplicar', 'el plan de antes vuelve')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(800)
    debe((await snap()) === conLluvia, '32b deshacer', '[Deshacer] vuelve al plan de lluvia')
    // «Volver a mi ruta original» deja el día como estaba al empezar
    await clic(a, '[data-ver-plan]')
    await a.esp(600)
    await clic(a, '[data-propuesta-original]')
    await a.esp(900)
    debe((await snap()) === inicio, 'original', '«Volver a mi ruta original» deja el día como estaba antes de la lluvia')
    // Nubes sobre un mirador
    const NUBES = { probability: por(() => 0), precipitation: por(() => 0), cloud: por((h) => (h >= 11 && h <= 14 ? 95 : 10)), gust: por(() => 15) }
    await ir(a, { min: 9 * 60 + 30, mut: `const d3 = dia(3);`, tiempo: NUBES, horaLocal: 9 })
    await a.esp(1200)
    debe(await hay(a, '[data-aviso-tiempo="nubes"]'), '31 nubes', 'con nubes en el norte, aviso de nubes (31)')
    await clic(a, '[data-aviso-tiempo="nubes"] [data-ver-alternativa]')
    await a.esp(700)
    const n = (await hoja(a)) ?? ''
    debe(/Cambia:/.test(n) && /Se mantiene:/.test(n) && /Aplicar/.test(n), '31 nubes', `la alternativa de las nubes, con el formato común (${n.slice(0, 160)})`)
    await clic(a, '[data-propuesta-cerrar], [aria-label="Cerrar"]')
  })

  /* ───────────── 5b. La lluvia en Roma («Si llueve», con el mismo formato) ───────────── */
  await sec(async () => {
    await a.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && (await ev(`${R}.getState().route?.destination`).catch(() => null)) !== 'Roma'; i++) await a.esp(1000)
    await a.esp(2500)
    debe((await ev(`${R}.getState().route?.destination`)) === 'Roma', 'roma', 'el viaje de pruebas es el de Roma')
    // Roma también: los restaurantes abiertos a las 13:00 de un martes, cerca del Panteón (a pie), y ninguno cerrado
    const abRoma = await a.evaluar(`(async () => {
      const { fetchDestinationPlaces } = await import('/src/lib/destinationPlacesApi.ts'); const c = await import('/src/lib/hoyComer.ts')
      const cat = await fetchDestinationPlaces('Roma')
      const ab = c.restaurantesAbiertos({ restaurantes: cat.places, origen: { lat: 41.8986, lng: 12.4769 }, dateIso: '2026-11-10', ahoraMin: 13 * 60, enCoche: false })
      const todosAbiertos = ab.every((x) => c.horarioDeComer(cat.places.find((p) => p.kind === 'restaurant' && p.name === x.nombre), '2026-11-10', 13 * 60).abierto === true)
      const domingo = c.restaurantesAbiertos({ restaurantes: cat.places, origen: { lat: 41.8986, lng: 12.4769 }, dateIso: '2026-11-08', ahoraMin: 21 * 60 + 40, enCoche: false })
      return JSON.stringify({ n: ab.length, todosAbiertos, modo: ab[0]?.modo, nombres: ab.map((x) => x.nombre), domingoNoche: domingo.map((x) => x.nombre) })
    })()`)
    const rr = JSON.parse(abRoma)
    debe(rr.n >= 2 && rr.todosAbiertos && rr.modo === 'pie', 'roma comer', `Roma: restaurantes abiertos a pie a las 13:00 (${rr.nombres.join(' · ')})`)
    await a.evaluar(`(async () => {
      sessionStorage.setItem('trazo:lluvia-de-prueba', '1')
      const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
      const r = structuredClone(st.getState().route)
      r.days.forEach((d) => { delete d.rainBackup; numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
      const d = r.days[0]; const paradas = numberedStopsOf(d)
      window.__romaSale = paradas[1].name; window.__romaEntra = 'Museo de prueba cubierto'
      d.rainPlan = { text: 'Si llueve, lo del aire libre se cambia por una visita a cubierto.', remove: [paradas[1].name], add: [{ ...structuredClone(paradas[1]), id: 'lluvia-roma-1', name: 'Museo de prueba cubierto', time: paradas[1].time }], slot: 'dia' }
      st.setState({ route: r, screen: 'route' })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
      window.__horaFalsa = 10 * 60; window.__pos = null; window.__perm = 'denied'
      st.getState().setDevSimulatedTodayIso(r.answers.dateRange.start); st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(3200)
    const roma0 = await snap()
    debe(await hay(a, '[data-aviso-lluvia]'), 'roma lluvia', 'Roma con lluvia: el aviso de «Si llueve»')
    debe(/Hay previsión de lluvia/.test((await txt(a, '[data-aviso-lluvia]')) ?? '') && (await hay(a, '[data-aviso-lluvia] [data-hoy-aviso-x]')), 'roma lluvia', 'con su texto y su X')
    await clic(a, '[data-aviso-lluvia] [data-ver-alternativa]')
    await a.esp(700)
    const t = (await hojaSinRegistrar(a)) ?? ''
    debe(/Plan de lluvia/.test(t) && /Cambia:/.test(t) && /Se mantiene:/.test(t) && /Aplicar/.test(t) && /Volver a mi ruta original/.test(t), 'roma 32', `«Plan de lluvia» con el formato común (${t.slice(0, 200)})`)
    debe(/Museo de prueba cubierto/.test(t), 'roma 32', 'lo que entra es lo del «Si llueve»')
    debe((await snap()) === roma0, 'roma 32', 'ver la alternativa no mueve nada')
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(900)
    const cambiado = await ev(`(async () => { const r = ${R}.getState().route; return JSON.stringify({ b: Boolean(r.days[0].rainBackup), n: r.days[0].stops.map((s) => s.name) }) })()`).then((x) => JSON.parse(x))
    debe(cambiado.b && cambiado.n.includes('Museo de prueba cubierto') && !cambiado.n.includes(await ev('window.__romaSale')), 'roma aplicar', 'Aplicar cambia el día y guarda la copia')
    debe(/Plan actualizado/.test((await txt(a, '[data-plan-actualizado]')) ?? ''), 'roma 30', '«Plan actualizado · Deshacer»')
    debe((await a.evaluar("document.querySelector('[data-aviso-lluvia]')?.getAttribute('data-aviso-lluvia-estado')")) === 'usando', 'roma usando', '«Estás usando la alternativa para la lluvia»')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(800)
    debe((await snap()) === roma0, 'roma deshacer', '[Deshacer] deja el día como estaba')
    await clic(a, '[data-aviso-lluvia] [data-ver-alternativa]')
    await a.esp(600)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(800)
    await clic(a, '[data-ver-plan]')
    await a.esp(600)
    const v = (await hojaSinRegistrar(a)) ?? ''
    debe(/¿Volvemos al plan\?/.test(v) && /vuelve|vuelven/.test(v), 'roma 32b', `«¿Volvemos al plan?» (${v.slice(0, 160)})`)
    await clic(a, '[data-propuesta-aplicar]')
    await a.esp(900)
    debe((await ev(`${R}.getState().route.days[0].rainBackup ? 1 : 0`)) === 0 && (await ev(`${R}.getState().route.days[0].stops.map((s) => s.name).includes(window.__romaSale)`)), 'roma 32b', 'el plan de antes vuelve')
    await clic(a, '[data-plan-deshacer]')
    await a.esp(700)
    await clic(a, '[data-ver-plan]')
    await a.esp(600)
    await clic(a, '[data-propuesta-original]')
    await a.esp(900)
    debe((await snap()) === roma0, 'roma original', '«Volver a mi ruta original» deja el día como estaba')
    await a.evaluar("sessionStorage.removeItem('trazo:lluvia-de-prueba')")
  })

  /* ───────────── 6. Sin textos de Roma en Lanzarote ───────────── */
  debe(textosVistos.length >= 8, 'sin_roma', `se han leído ${textosVistos.length} hojas`)
  debe(!textosVistos.some((t) => ROMA.test(t)), 'sin_roma', `ninguna hoja de Lanzarote habla de Roma (${textosVistos.filter((t) => ROMA.test(t)).map((t) => (t.match(ROMA) ?? [''])[0]).join(',')})`)
} finally {
  a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
