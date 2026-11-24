// V49: SOLO capturas (no es una prueba) en modo iPhone: [Reorganizar] en el día de llegada (antes y después), la hoja de la excursión con todos los días y el aviso E1. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV49.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V49_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

async function abrir(ancho = 390) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago', ancho, alto: 844 })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  return { a, ev }
}

// 1 · [Reorganizar] en el día de llegada: Roma del 1 al 5 de diciembre, zona Plaza de España, vuelo Barcelona 08:30 → Fiumicino 11:15, con Free Tour
{
  const { a, ev } = await abrir()
  try {
    await a.evaluar(`(() => { const st = window.__ruta.getState(); const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, accommodationZone: 'espana', answers: { ...r.answers, month: 12, dateRange: { start: '2026-12-01', end: '2026-12-05' }, experiencesPositive: ['free_tour'] }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:15', arrivalPointId: 'fco', arrivalOtroPunto: 'El Prat', arrivalOtraHora: '08:30', arrivalCodigo: 'VY6102' } }); st.setMode('days'); return true })()`)
    await a.esp(2500)
    const contar = () => ev(`(async () => { const r = ${R}.getState().route; const d = r.days.find((x) => !x.isReturnLeg); return JSON.stringify({ n: d.stops.length, nombres: d.stops.map((s) => s.name) }) })()`)
    console.log('día 1 antes', await contar())
    await a.captura(png('v49_dia1_antes'))
    const res = await a.evaluar(`(async () => { const M = await import('/src/lib/reorganizarDia.ts'); const R = ${R}.getState().route; const d = R.days.find((x) => !x.isReturnLeg); const c = await M.reorganizarDias([d.id]); return JSON.stringify({ cambiados: c.length }) })()`)
    console.log('reorganizar', res)
    await a.esp(2500)
    console.log('día 1 después', await contar())
    await a.captura(png('v49_dia1_despues'))
    const boton = async () => a.evaluar(`(async () => JSON.stringify({ dias: (await import('/src/store/useReorganizarStore.ts')).useReorganizarStore.getState().dias }))()`)
    console.log('botón justo después', await boton())
    await a.esp(6000)
    console.log('botón 6 s después', await boton())
  } finally {
    a.cerrar()
  }
}

// 2 · La excursión en otro día: viaje del 25 al 29 de noviembre (5 días de ciudad), la excursión de la ruta el sábado 28
{
  const { a, ev } = await abrir()
  try {
    await a.evaluar(`(() => { const st = window.__ruta.getState(); const r = st.route; const base = r.days.find((x) => !x.isReturnLeg && x.dayNumber === 2); const mk = (n, extra = {}) => ({ ...JSON.parse(JSON.stringify(base)), id: 'dia-v49-' + n, dayNumber: n, ...extra }); const exc = { id: 'pompeya', title: 'Excursión a Pompeya', durationHours: 13, durationLabel: '13 h', meetingPoint: null, halfDay: false, priceLabel: '', page: null }; const dias = [mk(1), mk(2), mk(3), mk(4, { dayType: 'excursion', stops: [], meals: [], excursions: [exc], selectedExcursionId: 'pompeya' }), mk(5)]; const vuelta = r.days.filter((x) => x.isReturnLeg).map((x) => ({ ...x, dayNumber: 6 })); window.__ruta.setState({ route: { ...r, days: [...dias, ...vuelta], answers: { ...r.answers, dateRange: { start: '2026-11-25', end: '2026-11-29' } } } }); st.setMode('bookings'); return true })()`)
    await a.esp(2500)
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(1500)
    await a.evaluar(`(() => { const b = document.querySelector('[data-blk="excursiones"]'); b?.querySelector('[data-cabecera-clara]')?.click(); return true })()`)
    await a.esp(2000)
    const abre = await a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Ya la tengo/.test(x.textContent || '')); if (!b) return false; b.click(); return true })()`)
    console.log('abre la hoja', abre)
    await a.esp(2000)
    console.log('hoja', await a.evaluar(`JSON.stringify({ texto: (document.querySelector('[role="dialog"]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 380), dias: Array.from(document.querySelectorAll('[role="dialog"] [role="group"] button')).map((b) => (b.textContent || '').replace(/\\s+/g, ' ').trim()) })`))
    await a.captura(png('v49_excursion_hoja'))
    // elegir el primer día que NO sea el de la ruta y guardar
    await a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('[role="dialog"] [role="group"] button')).find((x) => !/En tu ruta/.test(x.textContent || '')); b?.click(); return Boolean(b) })()`)
    await a.esp(1500)
    await a.evaluar(`(() => { const b = document.querySelector('[data-guardar-reserva]'); b?.click(); return Boolean(b) })()`)
    await a.esp(2000)
    console.log('aviso E1', await a.evaluar(`JSON.stringify({ hay: Boolean(document.querySelector('[data-aviso-dias-cambian]')), texto: (document.querySelector('[data-aviso-dias-cambian]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 400) })`))
    await a.captura(png('v49_aviso_e1'))
    await a.evaluar(`document.querySelector('[data-aviso-de-acuerdo]')?.click(); true`)
    await a.esp(2500)
    console.log('días tras guardar', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => [d.dayNumber, d.dayType ?? 'normal', d.stops.length]))`))
    await a.captura(png('v49_tras_guardar'))
  } finally {
    a.cerrar()
  }
}
console.log('capturas hechas')
