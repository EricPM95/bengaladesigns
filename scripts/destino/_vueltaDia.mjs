// Mira qué dice el día de vuelta del viaje de prueba de Lanzarote (herramienta de diagnóstico).
import { abrirApp } from './_enLaApp.mjs'
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', ancho: 390, alto: 844 })
const ev = (js) => a.evaluar(js)
try {
  for (let i = 0; i < 60 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)")
  const n = await ev('window.__ruta.getState().route.days.length')
  await ev(`(() => { const s = window.__ruta.getState(); s.setMode('days'); s.setActiveDayId(s.route.days[${n - 1}].id); return true })()`)
  await a.esp(2600)
  const t = await ev('document.body.innerText')
  console.log(t.split('\n').filter((l) => /cena|cenar|cenas/i.test(l)).join('\n'))
  console.log('meals:', JSON.stringify(await ev('window.__ruta.getState().route.days.at(-1).meals.map((m) => m.mealTime)')))
} finally {
  a.cerrar()
}
