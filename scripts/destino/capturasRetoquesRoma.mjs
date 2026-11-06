// Una captura de móvil de un día de Roma para el REPASO de RETOQUES_TARJETAS (la línea del trayecto y el horario «9:00–19:00» iguales que en Lanzarote).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasRetoquesRoma.mjs
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', ancho: 390, alto: 844 })
const ev = (js) => a.evaluar(js)
try {
  for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  await a.esp(1500)
  await ev("(() => { const s = window.__ruta.getState(); s.setMode('days'); s.setActiveDayId(s.route.days[0].id); return true })()")
  await a.esp(2600)
  for (let i = 0; i < 4; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(500)
  }
  await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim() === 'Rutas'); b?.scrollIntoView({ block: 'center' }); return true })()")
  await a.esp(700)
  console.log('ciudad:', await ev('window.__ruta.getState().route.destination'))
  await a.captura(path.resolve('docs/dias/capturas_jutrip/retoques_dias_roma.jpg'))
} finally {
  a.cerrar()
}
