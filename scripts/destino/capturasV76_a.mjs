// V76 (apartado 1): SOLO capturas (no es una prueba) en modo iPhone (390x844) de R5 (la hoja «¿Es para tu excursión a…?») y de la ficha de la excursión con su ferry unido en RESERVAS.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV76_a.mjs roma|lanza
// Guarda docs/dias/V76_capturas/[L_]R5_app.jpg y [L_]R5_reservas_app.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V76_capturas')
fs.mkdirSync(CAP, { recursive: true })
const lanza = (process.argv[2] ?? 'roma') === 'lanza'
const p = lanza ? 'L_' : ''
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar(`(async () => (${e}))()`)
const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const poner = (sel, v) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(v)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
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
  const info = await ev(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); if (!r.days.some((d) => d.dayType === 'excursion' && !d.isReturnLeg)) { const d = r.days.find((x) => x.dayNumber === 3) ?? r.days[2]; d.dayType = 'excursion'; d.title = 'Isla de Ponza (excursión)'; d.curatedTitle = 'Isla de Ponza (excursión)'; d.excursions = [{ id: 'ponza_prueba', title: 'Isla de Ponza (excursión)', length: 'full-day' }]; d.selectedExcursionId = 'ponza_prueba' } const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]; st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} }); st.getState().setActiveDayId(null); st.getState().setMode('bookings'); const B = await import('/src/lib/bookings.ts'); const f = B.excursionesDeLaRuta(r, [])[0]; return { exDiaId: f.day.id } })()`)
  await a.esp(2500)
  await clic('[data-anadir-una-reserva]')
  await a.esp(600)
  await clic('[data-casilla-anadir="ferry"]')
  await a.esp(1100)
  await poner('[data-extra-campo="origen"]', lanza ? 'Órzola' : 'Formia')
  await poner('[data-extra-campo="destino"]', lanza ? 'La Graciosa' : 'Ponza')
  await clic(`[data-dia-cuadrado="${info.exDiaId}"]`)
  await a.esp(300)
  await clic('[data-campo-de-hora="extra-ferry-hora"]')
  await a.esp(700)
  await clic('[data-hoja-de-hora-guardar]')
  await a.esp(450)
  await clic('[data-guardar-extra="ferry"]')
  await a.esp(1300)
  await a.captura(path.join(CAP, `${p}R5_app.jpg`))
  console.log('R5', await a.evaluar("(document.querySelector('[data-hoja=\"unir-reserva\"]') ?? document.body).innerText.replace(/\s+/g, ' ').slice(0, 300)"))
  await clic('[data-boton-hoja="unir-si"]')
  await a.esp(1300)
  await ev(`${R}.getState().setMode('bookings')`)
  await a.esp(1500)
  await a.evaluar("(() => { const c = document.querySelector('[data-blk=\"excursiones\"] [data-cabecera-bloque]'); if (c && !document.querySelector('[data-excursion-unida]')) c.click(); return true })()")
  await a.esp(1500)
  await a.evaluar("(() => { document.querySelector('[data-excursion-unida]')?.scrollIntoView({ block: 'start' }); return true })()")
  await a.esp(1200)
  await a.captura(path.join(CAP, `${p}R5_reservas_app.jpg`))
  console.log('ficha', await a.evaluar("(document.querySelector('[data-excursion-unida]') ?? document.body).innerText.replace(/\s+/g, ' ').slice(0, 300)"))
  await a.evaluar("(() => { document.querySelector('[data-excursion-unida]')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140); return true })()")
  await a.esp(600)
  await a.captura(path.join(CAP, `${p}R5_contador_app.jpg`))
} finally {
  a.cerrar()
}
process.exit(0)
