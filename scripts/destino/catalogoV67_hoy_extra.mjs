// CATALOGO V67 (HOY, Roma): lo que no cubren los otros guiones: la cena sin restaurante (C4), la cena ya en el restaurante (C6) y «Si te sobra tiempo» (plegado y abierto).
// SOLO capturas (no cambia nada de la app). Por la cola:  APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/catalogoV67_hoy_extra.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrir, hoy as hoyBase } from './viajero_roma_comun.mjs'

const CAP = path.resolve('docs/dias/_catalogoV67_hoy_tmp')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const log = {}
const limpiar = async (a) => { for (let i = 0; i < 3; i++) { const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!h) break; await a.esp(800) } }
const hoy = async (c, iso, min) => { await hoyBase(c, iso, min); for (let k = 0; k < 14; k++) { await c.a.esp(1200); await limpiar(c.a); const hay = await c.a.evaluar("(() => { const h = document.querySelector('[data-visto^=\"hoja-\"]'); if (!h) return false; const w = h.parentElement?.parentElement ?? document; const b = Array.from(w.querySelectorAll('button')).find((x) => /cerrar/i.test(x.getAttribute('aria-label') || '')); if (b) b.click(); return true })()"); if (!hay && k > 1) break } await c.a.esp(600) }
const c = await abrir()
const { a, ev } = c
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const paso = async (n, fn) => { try { await fn() } catch (e) { console.log('!!', n, String(e?.message ?? e).slice(0, 300)) } }
const tarjeta = () => a.evaluar("(() => { const e = document.querySelector('[data-hoy-comida]'); return e ? e.getAttribute('data-hoy-comida-estado') + ' | ' + e.innerText.replace(/\s+/g, ' ') : null })()")
const vistasHasta = (iso, nombre) => ev(`(async () => { const st = ${R}; const r = st.getState().route; const d = r.days.find((x) => x.date === '${iso}' || x.dateIso === '${iso}') ?? r.days[2]; let ok = true; const stops = d.stops.map((s) => { if (!ok) return { ...s, checkedInAt: null }; if (s.name === '${nombre}') ok = false; return { ...s, checkedInAt: new Date().toISOString() } }); st.setState({ route: { ...r, days: r.days.map((x) => (x.id === d.id ? { ...d, stops } : x)) } }); return d.id })()`)
const iso = '2026-10-19'
try {
  await paso('C6', async () => {
    await vistasHasta(iso, 'Piazza Navona')
    await hoy(c, iso, 20 * 60 + 30)
    await a.evaluar("(() => { const b = document.querySelector('[data-hoy-ya-he-llegado]'); if (!b) return false; b.click(); return true })()")
    await a.esp(900)
    log.c6 = await tarjeta()
    await a.evaluar("document.querySelector('[data-hoy-comida]')?.scrollIntoView({ block: 'start' }); true")
    await a.esp(600)
    await a.captura(png('C6'))
  })
  await paso('C4', async () => {
    await ev(`(async () => { const st = ${R}; const r = st.getState().route; st.setState({ route: { ...r, days: r.days.map((d) => ({ ...d, meals: d.meals.map((m) => ({ ...m, chosenRestaurant: null, recommendedRestaurant: null })) })) } }); return true })()`)
    await vistasHasta(iso, 'Piazza Navona')
    await hoy(c, iso, 20 * 60 + 30)
    log.c4 = await tarjeta()
    await a.evaluar("document.querySelector('[data-hoy-comida]')?.scrollIntoView({ block: 'start' }); true")
    await a.esp(600)
    await a.captura(png('C4'))
  })
  await paso('sobra', async () => {
    // Una visita que «sobra» (la lista de DÍAS «Si te sobra tiempo»): se pasa la última parada del día a `spareStops`, solo en la copia del viaje de prueba.
    await ev(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dateIso === '${iso}' || x.date === '${iso}') ?? r.days[2]; const quita = d.stops.filter((s) => !s.isBreak && !s.isArrival && !s.reservedId).slice(-2); d.spareStops = quita.map((s) => ({ ...s, spareReason: 'No te da tiempo hoy' })); d.stops = d.stops.filter((s) => !quita.includes(s)); d.stops.forEach((s) => { delete s.checkedInAt }); st.setState({ route: r }); return quita.length })()`)
    await hoy(c, iso, 10 * 60)
    await a.evaluar("document.querySelector('[data-hoy-sobra-tiempo]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(700)
    log.sobra_hay = await a.evaluar("Boolean(document.querySelector('[data-hoy-sobra-tiempo]'))")
    await a.captura(png('sobra_plegada'))
    await a.evaluar("document.querySelector('[data-hoy-sobra-tiempo-cabecera]')?.click(); true")
    await a.esp(800)
    await a.evaluar("document.querySelector('[data-hoy-sobra-tiempo]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(500)
    log.sobra = await a.evaluar("(document.querySelector('[data-hoy-sobra-tiempo]')?.innerText ?? '').replace(/\s+/g, ' ')")
    await a.captura(png('sobra_abierta'))
  })
  await paso('lluvia', async () => {
    // El plan de lluvia: el aviso azul [Ver plan] y la hoja que abre (el gancho de desarrollo «lluvia de prueba»).
    await ev(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); r.days.forEach((d) => d.stops.forEach((s) => { delete s.checkedInAt })); st.setState({ route: r }); return true })()`)
    await a.evaluar("sessionStorage.setItem('trazo:lluvia-de-prueba', '1'); true")
    await hoy(c, '2026-10-17', 9 * 60 + 30)
    await a.esp(2000)
    log.lluvia_aviso = await a.evaluar("(document.querySelector('[data-hoy-aviso-fila]')?.innerText ?? '').replace(/\s+/g, ' ')")
    const ab = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Ver plan/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    await a.esp(2200)
    log.lluvia_abre = ab
    log.lluvia_plan = await a.evaluar("(document.querySelector('[role=dialog]')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 500)")
    await a.captura(png('lluvia_plan'))
    await a.evaluar("sessionStorage.removeItem('trazo:lluvia-de-prueba'); true")
  })
  fs.writeFileSync(path.join(CAP, '_log_extra.json'), JSON.stringify(log, null, 1))
  console.log(JSON.stringify(log, null, 1))
} finally {
  a.cerrar()
}
process.exit(0)
