// V58 Lanzarote: punto 1 (solo con la zona), 6 (km en coche, minutos y cierres, comida sin restaurantes). Solo observa y captura (iPhone 390x844). Exige la API normal. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV58_lanza.mjs [sufijo=despues]
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SUF = process.argv[2] ?? 'despues'
const CAP = path.resolve('docs/dias/V58_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}_${SUF}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = /const ANTES = `([\s\S]*?)`\n/.exec(fs.readFileSync(new URL('./pruebaTandaHOY1_A.mjs', import.meta.url), 'utf8'))[1]
const log = {}
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const texto = (max = 1500) => a.evaluar(`(document.body.innerText ?? '').replace(/\\s+/g, ' ').slice(0, ${max})`)
const paso = async (n, fn) => {
  try {
    await fn()
  } catch (e) {
    console.log('!!', n, String(e?.message ?? e).slice(0, 200))
  }
}
const ir = async (iso, min, m = 'today') => {
  await a.evaluar(`(async () => { const st = ${R}; window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'; st.getState().setDevSimulatedTodayIso('${iso}'); st.getState().setActiveDayId(null); st.getState().setMode('explore'); return true })()`)
  await a.esp(500)
  await ev(`${R}.getState().setMode('${m}')`)
  await a.esp(2800)
}
try {
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'")); i++) await a.esp(500)
  // El viaje SOLO con la zona (sin hotel puesto), como lo deja quien elige «Costa Teguise» y no escribe el nombre del hotel.
  const r = await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => 'ok').catch((e) => 'ERROR ' + String((e && e.message) || e))`)
  console.log('crear:', r)
  if (r !== 'ok') throw new Error(r)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  log.hotel_puesto = await ev(`JSON.stringify(${R}.getState().accommodationSelections)`)
  log.zona = await ev(`${R}.getState().route.accommodationZone`)
  // Plan completo: horas, minutos, cierre de cada sitio y comida.
  log.plan = await ev(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const r = ${R}.getState().route; return JSON.stringify(r.days.map((d, i) => ({ i, fecha: d.dateIso ?? null, tipo: d.dayType ?? null, coche: d.coche ? { ida: d.coche.ida?.km ?? null, vuelta: d.coche.vuelta?.km ?? null, activo: d.coche.activo } : null, stops: numberedStopsOf(d).map((s) => ({ n: s.name, t: s.time, dur: s.durationMinutes, hours: s.hours ?? s.schedule ?? null, kmCoche: s.trayectoCoche?.km ?? null })), meals: (d.meals ?? []).map((m) => ({ t: m.mealTime, zona: m.curatedZone ?? null, rest: (m.restaurants ?? []).map((x) => x.name) })) }))) })()`)
  // (6) Ninguna visita acaba después de que cierre el sitio.
  log.visitas_tras_cierre = JSON.parse(log.plan).flatMap((d) => d.stops.map((x) => { const m = /(dd):(dd)s*-s*(dd):(dd)/.exec(x.hours ?? ''); if (!m || !x.t) return null; const fin = (Number(x.t.slice(0, 2)) * 60 + Number(x.t.slice(3, 5))) + x.dur; const cierra = Number(m[3]) * 60 + Number(m[4]); return fin > cierra ? `${d.i}: ${x.n} acaba a las ${Math.floor(fin / 60)}:${String(fin % 60).padStart(2, '0')} y cierra a las ${m[3]}:${m[4]}` : null }).filter(Boolean))
  const start = await ev(`${R}.getState().route.answers.dateRange.start`)
  const fecha = (n) => { const d = new Date(start + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
  await paso('1 RESERVAS solo zona', async () => {
    await ir(fecha(2), 11 * 60, 'bookings')
    log.reservas = await texto(900)
    log.resumen = await a.evaluar("document.querySelector('[data-blk=resumen]')?.innerText ?? null")
    log.alojamiento_card = await a.evaluar("document.querySelector('[data-blk=aloj]')?.innerText ?? null")
    await a.captura(png('1-solo-zona'))
  })
  await paso('1 DÍAS solo zona', async () => {
    await ir(fecha(2), 11 * 60, 'days')
    log.dias_aloj = await a.evaluar("document.querySelector('[data-alojamiento-dia-bloque]')?.innerText ?? null")
    await a.captura(png('1-solo-zona-dias'))
  })
  await paso('1 HOY solo zona', async () => {
    await ir(fecha(2), 11 * 60, 'today')
    log.hoy_aloj = await a.evaluar("document.querySelector('[data-alojamiento-hoy]')?.innerText ?? null")
    log.hoy_desde = await texto(900)
    await a.captura(png('1-solo-zona-hoy'))
  })
  await paso('6 km en coche (DÍAS, día de ruta 2)', async () => {
    const id = await ev(`${R}.getState().route.days[2].id`)
    await a.evaluar(`(async () => { const st = ${R}; window.__horaFalsa = 600; st.getState().setDevSimulatedTodayIso('${fecha(2)}'); st.getState().setMode('days'); st.getState().setActiveDayId('${id}'); return true })()`)
    await a.esp(3500)
    log.dias_cabecera = await a.evaluar("(() => { const e = Array.from(document.querySelectorAll('span')).find((x) => /km en coche|km a pie/.test(x.textContent || '')); return e?.parentElement?.parentElement?.innerText ?? null })()")
    await a.captura(png('6-km-coche'))
  })
  await paso('6 comer sin restaurantes (jueves, Marina Rubicón o Playa Blanca)', async () => {
    const id = await ev(`${R}.getState().route.days[4].id`)
    await a.evaluar(`(async () => { const st = ${R}; window.__horaFalsa = 880; st.getState().setDevSimulatedTodayIso('${fecha(4)}'); st.getState().setMode('days'); st.getState().setActiveDayId('${id}'); return true })()`)
    await a.esp(3500)
    log.comer_click = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button, [role=button]')).find((x) => /Hora de comer/.test(x.textContent || '')); if (!b) return false; b.scrollIntoView({ block: 'center' }); return b.closest('[class]')?.parentElement?.innerText?.slice(0, 400) ?? true })()")
    await a.esp(2500)
    log.comer_texto = await texto(1500)
    await a.captura(png('6-comer-sin-restaurantes'))
  })
  fs.writeFileSync(path.join(CAP, `_log_lanza_${SUF}.json`), JSON.stringify(log, null, 1))
  console.log(JSON.stringify(log, null, 1).slice(0, 6000))
} finally {
  a.cerrar()
}
