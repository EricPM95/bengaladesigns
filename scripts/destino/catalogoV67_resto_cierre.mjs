// V67 (catálogo, parte «resto»): SOLO capturas (no es una prueba), iPhone 390x844. DÍAS: el horario del día en la tarjeta plegada, «Cerrado este día» y el aviso al añadir una parada a un día en que cierra.
//   APP_URL=http://localhost:5173 node scripts/destino/catalogoV67_resto_cierre.mjs [sondeo]
// No cambia nada de la app: usa el viaje de prueba y toca el viaje en memoria (el dato `closedThisDay` de una parada), como los demás scripts de captura.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const CAP = path.resolve('docs/dias/catalogo/_tmp')
fs.mkdirSync(CAP, { recursive: true })
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const clic = (re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) { const h = await clic(/^(Siguiente|Entendido|Vale|Cerrar)$/); if (!h) break; await a.esp(600) }
  const dia2 = await ev(`${R}.getState().route.days.find((d) => d.dayNumber === 2).id`)
  await ev(`(${R}.getState().setMode('days'), ${R}.getState().setActiveDayId(${JSON.stringify(dia2)}), true)`)
  await a.esp(4500)
  // 1) El horario del día en la tarjeta plegada: se lleva la lista a una parada con horario real.
  console.log('horario', await a.evaluar(`(() => { const e = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && /^Galería Borghe/.test((x.textContent || '').trim())); if (e) e.scrollIntoView({ block: 'center' }); return Boolean(e) })()`))
  await a.esp(1200)
  await a.captura(path.join(CAP, 'dias_horario_plegada.jpg'))
  // 2) «Cerrado este día»: una parada del día con el dato closedThisDay (el que pone el motor cuando no hay otro día).
  const nombre = await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dayNumber === 2); const s = d.stops.filter((x) => !x.isArrival)[2]; s.closedThisDay = true; st.setState({ route: r }); return s.name })()`)
  console.log('cerrado este día →', nombre)
  await a.esp(1500)
  console.log('hay texto', await a.evaluar(`(() => { const e = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && /^Cerrado este día/.test((x.textContent || '').trim())); if (e) e.scrollIntoView({ block: 'center' }); return Boolean(e) })()`))
  await a.esp(1000)
  await a.captura(path.join(CAP, 'dias_cerrado_este_dia.jpg'))
  // 3) Añadir un sitio a un día en que cierra (el domingo, Museos Vaticanos): se añade igual y sale el aviso de arriba.
  await a.evaluar("window.scrollTo(0, 0)")
  console.log('añadir', await clic(/Añadir parada/))
  await a.esp(3000)
  console.log('sitio', await a.evaluar(`(() => { const e = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && /^Museos Vaticanos/.test((x.textContent || '').trim())); if (!e) return 'no está'; let n = e; for (let i = 0; i < 6 && n; i++) { const b = [...n.querySelectorAll('button')].find((x) => /Añadir|añadir/.test(x.getAttribute('aria-label') || '')); if (b) { b.click(); return 'click ' + b.getAttribute('aria-label') } n = n.parentElement } return 'sin botón' })()`))
  await a.esp(1500)
  console.log((await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 400)")))
  await a.captura(path.join(CAP, 'dias_aviso_al_anadir_1.jpg'))
} finally {
  a.cerrar()
}
process.exit(0)
