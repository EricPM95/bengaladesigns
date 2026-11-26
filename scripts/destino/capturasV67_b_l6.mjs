// V67 (apartado 3, L6): SOLO captura (no es una prueba) en iPhone 390x844 de HOY en Lanzarote con un mirador/playa de día pasada la puesta de sol (19:00) y, de contraste, a las 12:00.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV67_b_l6.mjs   (la API con DESTINOS_OCULTOS='-')
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const CAP = path.resolve('docs/dias/V67_capturas')
fs.mkdirSync(CAP, { recursive: true })
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const DIA = ['El Golfo y el Charco de los Clicos', 'Caletón Blanco', 'Los Hervideros', 'Salinas de Janubio', 'Caleta de Famara y Playa de Famara', 'Ermita de las Nieves', 'Mirador de Guinate', 'Ciudad Estratificada (Rofera de Teseguite)', 'Playa de Montaña Bermeja', 'Las Grietas (Montaña Blanca)', 'Mirador del Bosquecillo (Risco de Famara)', 'Mirador de Haría', 'Mirador de los Helechos', 'Playa de La Garita', 'Volcán del Cuervo', 'Caldera Blanca']
const log = {}
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10' }).then(() => true)")
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(3000)
  for (let i = 0; i < 4; i++) { const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!h) break; await a.esp(600) }
  const dias = JSON.parse(await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, date: d.date, stops: (d.stops || []).map((s) => s.name) })))`))
  const k0 = dias.find((d) => d.n >= 2 && d.stops.some((n) => DIA.includes(n))); const k = k0 && { ...k0, date: new Date(Date.parse('2026-11-08T12:00:00Z') + (k0.n - 1) * 86400000).toISOString().slice(0, 10) }
  console.log('días', JSON.stringify(dias.map((d) => [d.n, d.date, d.stops.length])))
  if (!k) throw new Error('ningún día con un sitio de día')
  const sitio = k.stops.find((n) => DIA.includes(n))
  console.log('día', k.n, k.date, 'sitio', sitio)
  await a.evaluar(`(async () => { const st = ${R}; try { sessionStorage.clear() } catch {}; st.getState().setDevSimulatedTodayIso('${k.date}'); try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}; window.__perm = 'denied'; st.getState().setActiveDayId(null); st.getState().setMode('explore'); return true })()`)
  for (const [id, min] of [['L6_12h', 12 * 60], ['L6_19h', 19 * 60]]) {
    // Los sitios de antes del de día, hechos: así es «el siguiente».
    await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dayNumber === ${k.n}); let hecho = true; for (const s of d.stops) { if (s.name === ${JSON.stringify(sitio)}) hecho = false; else if (hecho) s.checkedInAt = new Date().toISOString() } st.setState({ route: r }); window.__horaFalsa = ${min}; st.getState().setMode('explore'); return true })()`)
    await a.esp(600)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(4000)
    await a.evaluar("(() => { const c = document.querySelector('[data-hoy-siguiente]'); if (c) c.scrollIntoView({ block: 'start' }); return !!c })()")
    await a.esp(1500)
    await a.captura(path.join(CAP, `${id}.jpg`))
    log[id] = await a.evaluar("(document.querySelector('[data-hoy-siguiente]') ?? document.body).innerText.replace(/\s+/g, ' ').slice(0, 600)")
    console.log(id, '|', log[id])
  }
  fs.writeFileSync(path.join(CAP, 'L6_log.json'), JSON.stringify(log, null, 2))
} finally { a.cerrar() }
process.exit(0)
