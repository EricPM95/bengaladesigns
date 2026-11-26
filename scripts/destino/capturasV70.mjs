// V70: SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV70.mjs atardecer|fundido|margen|aloj|ficha|dia
// Guarda docs/dias/V70_capturas/<id>_app.jpg y un log con el texto de cada pantalla.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V70_capturas')
fs.mkdirSync(CAP, { recursive: true })
const CASO = process.argv[2] ?? 'atardecer'
const lanza = ['atardecer', 'aloj', 'dia'].includes(CASO)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=completa'
const DIA = lanza ? '2026-11-09' : '2026-10-18'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const texto = (sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)}) ?? document.body).innerText.split(String.fromCharCode(10)).join(' ').slice(0, 700)`)
const sacar = async (id, sel = 'body') => {
  await a.esp(1200)
  await a.captura(path.join(CAP, `${id}_${lanza ? 'lanza_' : ''}app.jpg`))
  log[id] = await texto(sel)
  console.log('captura', id, '|', String(log[id]).slice(0, 300))
}
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '" + DIA + "' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const hoy = async (min) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${DIA}')
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1'); localStorage.setItem('trazo:ajuste:sugerencias-companero', '1') } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(4000)
  }
  if (CASO === 'atardecer') {
    // Lanzarote, dos horas antes de la puesta de sol: el botón dice «Ir a El Golfo» (nombre corto), no «…y el Charco de los Clicos».
    for (const min of [16 * 60 + 30, 17 * 60]) {
      await hoy(min)
      const t = await a.evaluar("(() => { const c = document.querySelector('[data-hoy-atardecer]'); if (!c) return null; c.scrollIntoView({ block: 'center' }); return c.innerText.split(String.fromCharCode(10)).join(' | ') })()")
      console.log('atardecer', min, t)
      if (t) {
        await a.evaluar("(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Dejarlo como est/.test((x.textContent || '').trim())); if (b) b.click(); return true })()")
        await a.esp(1000)
        await a.evaluar("(() => { document.querySelector('[data-hoy-atardecer]')?.scrollIntoView({ block: 'center' }); return true })()")
        await sacar('A1_atardecer')
        log.boton = await texto('[data-hoy-atardecer-como-llegar]')
        break
      }
    }
  }
  if (CASO === 'fundido') {
    await hoy(10 * 60 + 30)
    log.huecos = await a.evaluar("document.querySelectorAll('[data-imagen-hueco]').length")
    log.listas = await a.evaluar("document.querySelectorAll('[data-imagen-hueco=lista]').length")
    await sacar('F1_hoy_fotos')
  }
  if (CASO === 'margen') {
    log.acceso = await a.evaluar("(async () => { const m = await import('/src/components/route/reservas/DatosDeLaEntrada.tsx'); return JSON.stringify([['Museos Capitolinos', '10:00'], ['Coliseo', '09:15'], ['Museos Vaticanos', '11:00'], ['Domus Aurea', '10:00'], ['Free Tour', '10:00'], ['Última Cena', '10:00'], ['Foro Romano y Palatino', '10:00']].map(([n, h]) => [n, m.accesoDeLaEntrada(n, h)])) })()")
    console.log(log.acceso)
  }
  if (CASO === 'aloj') {
    await a.evaluar(`(async () => { const st = ${R}; const r = st.getState().route; const sel = {}; for (const d of r.days) sel[d.id] = { name: 'Hotel de prueba', precio: null }; st.setState({ accommodationSelections: sel }); st.getState().setActiveDayId(null); st.getState().setMode('bookings'); return true })()`)
    await a.esp(2500)
    await ev("(await import('/src/store/useReservasFocusStore.ts')).useReservasFocusStore.getState().pedir('alojamiento')").catch(() => null)
    await a.esp(1500)
    console.log('abrir', await a.evaluar("(() => { const c = [...document.querySelectorAll('button,[role=button],div,section')].filter((x) => /^Alojamiento\s*Listo/.test((x.textContent || '').trim()) && (x.textContent || '').length < 60); const x = c[c.length - 1]; if (!x) return 'sin cabecera'; x.click(); return 'clic ' + x.tagName })()"))
    await a.esp(1500)
    const ok = await a.evaluar("(() => { const b = document.querySelector('[data-anadir-doc=\"reserva-aloj-anadir\"]'); if (!b) return false; b.scrollIntoView({ block: 'center' }); return JSON.stringify({ t: b.textContent, bg: getComputedStyle(b).backgroundColor, bd: getComputedStyle(b).borderColor }) })()")
    console.log('boton alojamiento', ok)
    log.boton = ok
    await sacar('B1_alojamiento')
  }
  if (CASO === 'ficha') {
    // La ficha de una parada «por fuera porque ya ha cerrado»: sin «A esta hora ya ha cerrado».
    await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days[1]; const p = d.stops.find((s) => !s.isArrival && !s.isBreak); p.visitMode = 'fuera'; p.outsideKind = 'ya_cerrado'; p.outsideReason = 'A esta hora ya ha cerrado'; window.__idF = p.id; st.setState({ route: r }); st.getState().setActiveDayId(d.id); st.getState().setMode('days'); return true })()`)
    await a.esp(2500)
    const ok = await a.evaluar("(() => { const n = (window.__nF ??= null); const x = [...document.querySelectorAll('[data-parada], li, article, div')].filter((e) => (e.textContent || '').includes('Fontana de Trevi') && e.querySelector('button') && (e.textContent || '').length < 260); const e = x[x.length - 1]; if (!e) return 'sin tarjeta'; (e.querySelector('button') ?? e).click(); return 'ok' })()")
    console.log('abrir ficha', ok)
    await a.esp(2500)
    log.hayTexto = await a.evaluar("document.body.innerText.includes('A esta hora ya ha cerrado')")
    log.porFuera = await a.evaluar("(() => { const x = [...document.querySelectorAll('p')].find((p) => /Por fuera/.test(p.textContent || '')); return x ? x.textContent : null })()")
    await sacar('FI_ficha')
  }
  fs.writeFileSync(`docs/dias/V70_log_${CASO}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
