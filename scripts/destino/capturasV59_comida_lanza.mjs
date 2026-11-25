// V59 §3 Lanzarote (en coche): la tarjeta de la comida (con restaurante, ya en el restaurante y sin restaurante). Solo observa y captura (iPhone 390x844). Exige la API con DESTINOS_OCULTOS='-'. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV59_comida_lanza.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V59_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}_app.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = /const ANTES = `([\s\S]*?)`\n/.exec(fs.readFileSync(new URL('./pruebaTandaHOY1_A.mjs', import.meta.url), 'utf8'))[1]
const log = {}
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const paso = async (n, fn) => {
  try {
    await fn()
  } catch (e) {
    console.log('!!', n, String(e?.message ?? e).slice(0, 300))
  }
}
const tarjeta = () => a.evaluar("(() => { const e = document.querySelector('[data-hoy-comida]'); return e ? e.getAttribute('data-hoy-comida-estado') + ' | ' + e.innerText.replace(/\\s+/g, ' ') : null })()")
const limpiar = async () => {
  for (let k = 0; k < 14; k++) {
    await a.esp(1200)
    const hay = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido|Ahora no)$/.test((x.textContent || '').trim())); if (b) { b.click(); return true } const h = document.querySelector('[data-visto^=\"hoja-\"]'); if (!h) return false; const w = h.parentElement?.parentElement ?? document; const c = Array.from(w.querySelectorAll('button')).find((x) => /cerrar/i.test(x.getAttribute('aria-label') || '')); if (c) c.click(); return true })()")
    if (!hay && k > 1) break
  }
  await a.esp(500)
}
try {
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'")); i++) await a.esp(500)
  const r = await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => 'ok').catch((e) => 'ERROR ' + String((e && e.message) || e))`)
  console.log('crear:', r)
  if (r !== 'ok') throw new Error(r)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  log.dias = await ev(`(async () => { const r = ${R}.getState().route; return JSON.stringify(r.days.map((d, i) => ({ i, f: d.dateIso, ret: !!d.isReturnLeg, tipo: d.dayType ?? null, meals: d.meals.map((m) => [m.mealTime, m.time, m.windowEnd, (m.chosenRestaurant ?? m.recommendedRestaurant)?.name ?? null]), stops: d.stops.map((s) => s.time + ' ' + s.name) }))) })()`)
  console.log(log.dias)
  const dia = Number(process.env.DIA ?? 2)
  const info = JSON.parse(log.dias)[dia]
  const start = await ev(`${R}.getState().route.answers.dateRange.start`)
  const d0 = new Date(start + 'T12:00:00Z'); d0.setUTCDate(d0.getUTCDate() + dia)
  info.f = d0.toISOString().slice(0, 10)
  const comida = info.meals.find((m) => m[0] === 'lunch' && m[3])
  if (!comida) throw new Error('el día ' + dia + ' no lleva comida con restaurante')
  const [hh, mm] = comida[1].split(':').map(Number)
  const minComida = hh * 60 + mm + 5
  // Se marcan vistas las paradas con hora anterior a la comida: la siguiente es la que viene después.
  const marcar = () => ev(`(async () => { const st = ${R}; const r = st.getState().route; const d = r.days[${dia}]; const stops = d.stops.map((s) => ((s.time ?? '99:99') < '${comida[1]}' ? { ...s, checkedInAt: new Date().toISOString() } : { ...s, checkedInAt: null })); st.setState({ route: { ...r, days: r.days.map((x, i) => (i === ${dia} ? { ...d, stops } : x)) } }); return true })()`)
  const ir = async () => {
    await a.evaluar(`(async () => { const st = ${R}; window.__horaFalsa = ${minComida}; window.__pos = null; window.__perm = 'denied'; st.getState().setDevSimulatedTodayIso('${info.f}'); st.getState().setActiveDayId(null); st.getState().setMode('explore'); return true })()`)
    await a.esp(500)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(2800)
    await limpiar()
  }
  await paso('L1', async () => {
    await marcar()
    await ir()
    log.l1 = await tarjeta()
    await a.captura(png('L1_lanzarote'))
  })
  await paso('L5', async () => {
    log.l5_clic = await a.evaluar("(() => { const b = document.querySelector('[data-hoy-ya-he-llegado]'); if (!b) return false; b.click(); return true })()")
    await a.esp(900)
    log.l5 = await tarjeta()
    await a.captura(png('L5_lanzarote'))
  })
  await paso('L3', async () => {
    await ev(`(async () => { const st = ${R}; const r = st.getState().route; st.setState({ route: { ...r, days: r.days.map((d) => ({ ...d, meals: d.meals.map((m) => ({ ...m, chosenRestaurant: null, recommendedRestaurant: null })) })) } }); return true })()`)
    await ir()
    log.l3 = await tarjeta()
    await a.captura(png('L3_lanzarote'))
  })
  fs.writeFileSync(path.join(CAP, '_log_comida_lanza.json'), JSON.stringify(log, null, 1))
  console.log(JSON.stringify({ l1: log.l1, l5: log.l5, l3: log.l3 }, null, 1))
} finally {
  a.cerrar()
}
