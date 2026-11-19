// Saca la captura del panel «Avisos de viajeros» con los avisos de prueba de la demo (solo desarrollo). node scripts/destino/_capturaPanelV20.mjs
import { abrirApp } from './_enLaApp.mjs'
const a = await abrirApp('http://localhost:5173', { ancho: 800, alto: 1100, ruta: '/?admin=logros&logros=on&logrosDemo=1&cuentas=off' })
try {
  for (let i = 0; i < 60 && !(await a.evaluar("Boolean(document.querySelector('[data-admin-logros]'))").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("Array.from(document.querySelectorAll('nav button')).find((b) => /Avisos de viajeros/.test(b.innerText))?.click(); true")
  for (let i = 0; i < 30 && !(await a.evaluar("Boolean(document.querySelector('[data-aviso-de-viajero]'))")); i++) await a.esp(400)
  await a.esp(800)
  const r = await a.evaluar("({ avisos: document.querySelectorAll('[data-aviso-de-viajero]').length, nuevos: document.querySelector('[data-contador-nuevos]')?.innerText, destinos: document.querySelectorAll('[data-destino-pedido]').length, ya: Boolean(Array.from(document.querySelectorAll('button')).find((b) => b.innerText === 'Ya está')), hecho: Boolean(Array.from(document.querySelectorAll('button')).find((b) => /^Hecho/.test(b.innerText))) })")
  console.log(JSON.stringify(r))
  await a.captura('docs/dias/V20_capturas/panel_avisos.jpg')
  process.exitCode = r.avisos === 5 && r.destinos === 2 && r.ya && r.hecho ? 0 : 1
} finally { await a.cerrar() }
