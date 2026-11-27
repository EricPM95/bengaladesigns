// V80 (apartados 3b y 4): SOLO capturas (no es una prueba) en modo iPhone (390x844) de la excursión cancelada (EX7 en Roma con Pompeya organizada, EX8 y EX8b en Lanzarote con La Graciosa por tu cuenta).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV80_b.mjs roma|lanza
// Guarda docs/dias/V80_capturas/[L_]<id>_app.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V80_capturas')
fs.mkdirSync(CAP, { recursive: true })
const lanza = (process.argv[2] ?? 'roma') === 'lanza'
const p = lanza ? 'L_' : ''
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar(`(async () => (${e}))()`)
const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const abajo = () => a.evaluar("(() => { const c = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)); c.forEach((e) => { e.scrollTop = e.scrollHeight }); window.scrollTo(0, document.body.scrollHeight); return c.length })()")
const arriba = () => a.evaluar("(() => { const c = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)); c.forEach((e) => { e.scrollTop = 0 }); window.scrollTo(0, 0); return c.length })()")
const texto = () => a.evaluar("(document.querySelector('main') ?? document.body).innerText.replace(/\s+/g, ' ').slice(0, 1500)")
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
  // El día de excursión de hoy: Lanzarote, el día 4 (La Graciosa, por tu cuenta); Roma, el día 2 convertido en Pompeya (organizada), sin paradas. Con una parada saltada en el día anterior para que haya un pendiente.
  const hoy = lanza ? '2026-11-11' : '2026-10-18'
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)
  const montar = async () => {
    await a.evaluar(`(async () => {
      const st = ${R}
      const r = JSON.parse(window.__base)
      if (!${lanza}) { const d = r.days.find((x) => x.dayNumber === 2); d.dayType = 'excursion'; d.title = 'Pompeya (excursión)'; d.curatedTitle = 'Pompeya (excursión)'; d.selectedExcursionId = 'pompeya_sorrento'; d.stops = [] }
      const ayer = r.days.find((x) => x.dayNumber === ${lanza ? 3 : 1})
      const ps = ayer.stops.filter((x) => !x.isArrival); ps[0].checkedInAt = "2026-01-01T09:00:00.000Z"; ps[1].saltada = true; const seg = (await import("/src/lib/tuAlojamiento.ts")).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: "route", accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? "The Colors House" : "Hotel Quirinale")}, precio: null } } : {} })
      st.getState().setDevSimulatedTodayIso('${hoy}')
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:')).forEach((k) => localStorage.removeItem(k)) } catch {}
      window.__horaFalsa = 15 * 60; window.__pos = null; window.__perm = 'denied'
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(3500)
  }
  await montar()
  await a.captura(path.join(CAP, `${p}EX_antes_app.jpg`))
  console.log('antes |', await texto())
  await clic('[data-hoy-excursion-cancelar]')
  await a.esp(2500)
  await a.captura(path.join(CAP, `${p}${lanza ? 'EX8' : 'EX7'}_app.jpg`))
  console.log('cancelada |', await texto())
  await abajo()
  await a.esp(900)
  await a.captura(path.join(CAP, `${p}${lanza ? 'EX8' : 'EX7'}_app_abajo.jpg`))
  await arriba()
  if (lanza) {
    await clic('[data-hoy-excursion-otro-dia]')
    await a.esp(1500)
    await a.captura(path.join(CAP, 'L_EX8b_app.jpg'))
    console.log('hoja |', await a.evaluar("(document.querySelector('[data-hoja-mover-dias]') ?? document.body).innerText.replace(/\s+/g, ' ').slice(0, 600)"))
    await clic('[data-mover-dias-cambiar]')
    await a.esp(2500)
    await a.captura(path.join(CAP, 'L_EX8c_despues_app.jpg'))
    console.log('despues |', await texto())
  }
  // AL VOLVER (EX4): Roma, la excursión organizada tras [He terminado]; Lanzarote, la pieza «ideas y pendientes» montada sola sobre HOY (la excursión por tu cuenta llega ahí tras «Vuelta a tu alojamiento»).
  await montar()
  if (!lanza) {
    await clic('[data-hoy-he-terminado]')
    await a.esp(2500)
    await a.captura(path.join(CAP, 'EX4_alvolver_app.jpg'))
    await abajo()
    await a.esp(900)
    await a.captura(path.join(CAP, 'EX4_alvolver_app_abajo.jpg'))
    console.log('al volver |', await texto())
  } else {
    await a.evaluar(`(async () => {
      const fuente = await (await fetch('/src/main.tsx')).text(); const dep = (n) => new RegExp('from *"([^"]*' + n + '[.]js[^"]*)"').exec(fuente)?.[1]
      const rd = await import(dep('react-dom_client')); const createRoot = rd.createRoot ?? rd.default.createRoot; const rc = await import(dep('react')); const React = rc.default ?? rc
      const { IdeasYPendientesHoy } = await import('/src/components/route/hoy/v2/IdeasYPendientesHoy.tsx')
      const r = ${R}.getState().route; const dia = r.days.find((d) => d.dayNumber === 4)
      const div = document.createElement('div'); div.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:auto;background:#F3EBDA;padding:16px'; document.body.appendChild(div)
      createRoot(div).render(React.createElement(IdeasYPendientesHoy, { route: r, day: dia, dateIso: '${hoy}', desde: { lat: 28.9778, lng: -13.4785 }, enCoche: true, ahoraMin: 15 * 60 }))
      return true })()`)
    await a.esp(3500)
    await a.captura(path.join(CAP, 'L_EX4_alvolver_app.jpg'))
  }
} finally {
  a.cerrar()
}
process.exit(0)
