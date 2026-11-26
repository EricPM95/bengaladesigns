// V74 (apartados 3, 4 y 4b): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV74_b.mjs lanza|roma <caso>
// Casos: explorar (escribe el viaje), revisa (restaurante con «Revisa el horario», Lanzarote), sobra (HOY y DÍAS: «Si te sobra tiempo»), aviso (aviso de abajo de la entrada del Coliseo, Roma).
// Guarda docs/dias/V74_capturas/<modo>_<caso>_*.jpg y docs/dias/V74_log_b_<modo>_<caso>.json con el texto de la pantalla.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V74_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'lanza'
const CASO = process.argv[3] ?? 'explorar'
const lanza = MODO === 'lanza'

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=' + (CASO === 'ultimo' ? 'completa' : 'pago')
const IDA = lanza ? '2026-11-08' : '2026-10-17'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const cap = async (id) => { await a.esp(1500); await a.captura(path.join(CAP, `${MODO}_${id}_app.jpg`)) }
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const dias = await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, tipo: d.dayType ?? null, comidas: (d.meals ?? []).map((m) => [m.mealTime, m.time, m.recommendedRestaurant?.name ?? null, (m.options ?? []).map((o) => o.name ?? o.nombre ?? o)]), sobra: (d.spareStops ?? d.sparePlaces ?? []).length, stops: d.stops.filter((s) => !s.isArrival).map((s) => (s.time || '?') + ' ' + s.name.slice(0, 22)) })))`)
  console.log('viaje', dias)
  log.dias = dias
  const claves = await ev(`JSON.stringify(Object.keys(${R}.getState().route.days[1]))`)
  console.log('claves de un dia', claves)
  const hoyDe = async (iso, min) => {
    await a.evaluar(`(async () => { const st = ${R}; try { sessionStorage.clear() } catch {}; st.getState().setDevSimulatedTodayIso('${iso}'); try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}; window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'; st.getState().setActiveDayId(null); st.getState().setMode('explore'); return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(4500)
    for (let i = 0; i < 3; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
  }
  const diaIso = (n) => new Date(new Date(IDA + 'T12:00:00Z').getTime() + (n - 1) * 86400000).toISOString().slice(0, 10)
  if (CASO === 'revisa') {
    // Día 1: la comida de las 12:30 con Brisa Marina (sin horario seguro) y las dos primeras paradas ya vistas.
    const iso = diaIso(1)
    await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dayNumber === 1)
      const m = d.meals.find((x) => x.mealTime === 'lunch'); m.recommendedRestaurant = { name: 'Brisa Marina', coordinates: { lat: 28.86287, lng: -13.82898 }, address: 'Av. Marítima, 97-99' }; m.chosenRestaurant = undefined
      let k = 0; for (const s of d.stops) { if (s.isArrival) continue; if (k < 2) s.checkedInAt = '${iso}T09:30:00.000Z'; k++ }
      st.setState({ route: r, screen: 'route' }); return true })()`)
    await hoyDe(iso, 12 * 60 + 40)
    await a.esp(2500)
    await a.evaluar("(() => { const c = document.querySelector('[data-hoy-comida-duracion]') ?? [...document.querySelectorAll('*')].find((x) => /Revisa el horario/.test(x.textContent || '') && x.children.length < 6); if (c) c.scrollIntoView({ block: 'center' }); return true })()")
    await cap('revisa_horario')
    log.revisa = await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 900)")
    console.log('revisa', String(log.revisa).slice(0, 600))
  }
  if (CASO === 'sobra') {
    // El último sitio del día 2 pasa a «Si te sobra tiempo» (como cuando no cabe).
    await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dayNumber === 2)
      const i = d.stops.map((s) => !s.isArrival && !s.isBreak).lastIndexOf(true); const [s] = d.stops.splice(i, 1); d.spareStops = [s]
      st.setState({ route: r, screen: 'route' }); window.__sobraNombre = s.name; return true })()`)
    log.sobraNombre = await ev('window.__sobraNombre')
    await hoyDe(diaIso(2), 9 * 60 + 30)
    await a.evaluar("(() => { document.querySelector('[data-hoy-sobra-tiempo-cabecera]')?.click(); return true })()")
    await a.evaluar("(() => { const c = document.querySelector('[data-hoy-sobra-tiempo]'); if (c) c.scrollIntoView({ block: 'center' }); return true })()")
    await cap('sobra_hoy')
    log.hoy = await a.evaluar("(document.querySelector('[data-hoy-sobra-tiempo]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 600)")
    console.log('hoy', log.hoy)
    // DÍAS: el día 2 abierto.
    await a.evaluar(`(async () => { const st = ${R}; const d = st.getState().route.days.find((x) => x.dayNumber === 2); st.getState().setMode('days'); st.getState().setActiveDayId(d.id); return true })()`)
    await a.esp(3500)
    await a.evaluar("(() => { const c = document.querySelector('[data-sobra-tiempo]'); if (c) { c.scrollIntoView({ block: 'center' }); c.querySelector('button')?.click() } return true })()")
    await a.esp(800)
    await a.evaluar("(() => { const c = document.querySelector('[data-sobra-tiempo]'); if (c) c.scrollIntoView({ block: 'center' }); return true })()")
    await cap('sobra_dias')
    log.dias_sobra = await a.evaluar("(document.querySelector('[data-sobra-tiempo]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 600)")
    console.log('dias', log.dias_sobra)
  }
  if (CASO === 'aviso') {
    await a.evaluar(`(async () => { const st = ${R}; st.setState({ reservations: [], screen: 'route' }); st.getState().setMode('days'); st.getState().setActiveDayId(null); return true })()`)
    await a.esp(2500)
    await a.evaluar(`(async () => { const st = ${R}; st.getState().addReservation({ id: 'res-col', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: '2026-10-18', dayNumber: 2, time: '10:00', precio: null }); return true })()`)
    await a.esp(3500)
    log.toast = await ev("(await import('/src/store/useAddFlowStore.ts')).useAddFlowStore.getState().toast?.message ?? null")
    console.log('toast', log.toast)
    await cap('aviso_coliseo')
  }
  if (CASO === 'ultimo') {
    await a.evaluar("window.__rutaLanzarote({ zona: 'arrecife', coche: 'alquiler', hoy: '2026-11-13', vuelos: { llegada: '10:00', vuelta: '18:30' } }).then(() => true)")
    await a.esp(3000)
    log.ultimo = await ev(`JSON.stringify(${R}.getState().route.days.filter((d) => d.isReturnLeg).map((d) => ({ n: d.dayNumber, comidas: d.meals, stops: d.stops.map((s) => s.name) })))`)
    console.log('ultimo', String(log.ultimo).slice(0, 1500))
  }
  fs.writeFileSync(`docs/dias/V74_log_b_${MODO}_${CASO}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
