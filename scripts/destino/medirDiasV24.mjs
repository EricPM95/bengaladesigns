// V24: cuántos días caben de una vez en un iPhone (375 × 812), antes y después de dejar las tarjetas más estrechas. «Antes» = las medidas viejas puestas encima con CSS (fila de 80 px mínimo, relleno de 12 px arriba y abajo,
// título de 22 px, número de 22 px): es la misma pantalla con lo de antes. Se pasa a mano: node scripts/destino/_conCola.mjs node scripts/destino/medirDiasV24.mjs
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0', ancho: 375, alto: 812 })
try {
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: '2026-10-01', activeDayId: null, accommodationSelections: {} }); m.useRouteStore.getState().setMode('days'); return true })")
  await a.esp(1500)
  await a.evaluar("document.querySelectorAll('button').forEach((b) => { if (b.getAttribute('aria-label') === 'Cerrar' || /^(Entendido|Vale)$/.test((b.textContent || '').trim())) b.click() }); true")
  const medir = () =>
    a.evaluar(`(() => { const t = Array.from(document.querySelectorAll('[data-day-id]')); const c = t[0].closest('.overflow-y-auto'); const alto = t.map((x) => Math.round(x.getBoundingClientRect().height)); const salto = t.length > 1 ? Math.round(t[1].getBoundingClientRect().top - t[0].getBoundingClientRect().top) : alto[0]; const util = c.clientHeight; const bloques = document.querySelector('[data-bloques-del-viaje]'); const hb = bloques ? Math.round(bloques.getBoundingClientRect().height + 12) : 0; return { alto, salto, util, hb, caben: Math.floor((util - hb - 16) / salto) , tarjetaTitulo: getComputedStyle(t[0].querySelector('[data-titulo-del-dia]')).fontSize } })()`)
  const despues = await medir()
  await a.evaluar("(() => { const s = document.createElement('style'); s.id = 'v24-antes'; s.textContent = '[data-day-id] > [role=button] { min-height: 80px !important; padding-top: 12px !important; padding-bottom: 12px !important; padding-left: 16px !important; padding-right: 12px !important; gap: 14px !important } [data-day-id] [data-titulo-del-dia] { font-size: 22px !important; min-height: 24px !important } [data-day-id] .font-display.text-\\\\[19px\\\\] { font-size: 22px !important }'; document.head.appendChild(s); return true })()")
  await a.esp(500)
  const antes = await medir()
  console.log('ANTES  ', JSON.stringify(antes))
  console.log('DESPUÉS', JSON.stringify(despues))
} finally {
  a.cerrar()
  await new Promise((r) => setTimeout(r, 600))
}
