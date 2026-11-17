// Capturas del REPASO_V4: las insignias de «Entre viñas de ceniza» (lz7) y «Pueblos con alma» (lz6) de la app, con 0, 3 y todos los gajos, en la página de dibujos de desarrollo.
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/_v4_repaso_capturas.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SAL = 'docs/dias/V4_capturas'
fs.mkdirSync(SAL, { recursive: true })
const app = await abrirApp(process.env.APP_URL || 'http://localhost:5199', { ruta: '/?dibujos=1', ancho: 390, alto: 3200, sinEsperarRuta: true })
try {
  for (let i = 0; i < 80 && !(await app.evaluar("document.querySelectorAll('[data-lz3=colecciones] [data-gajos]').length === 21")); i++) await app.esp(500)
  await app.esp(2500)
  // Las celdas de cada colección: de 3 en 3 (0, 3 gajos, completa) en el orden lz1..lz7.
  for (const [nombre, idx] of [['pueblos_con_alma', 5], ['entre_vinas_de_ceniza', 6]]) {
    await app.esp(400)
    const rect = await app.evaluar(`(() => {
      const celdas = Array.from(document.querySelectorAll('[data-lz3=colecciones] > div')).slice(${idx * 3}, ${idx * 3 + 3})
      celdas[0].scrollIntoView({ block: 'start' })
      const rs = celdas.map((c) => c.getBoundingClientRect())
      const x0 = Math.min(...rs.map((r) => r.left)), y0 = Math.min(...rs.map((r) => r.top)), x1 = Math.max(...rs.map((r) => r.right)), y1 = Math.max(...rs.map((r) => r.bottom))
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, n: celdas.length, textos: celdas.map((c) => c.innerText), gajos: celdas.map((c) => { const g = c.querySelector('[data-gajos]'); return g ? [Number(g.dataset.gajos), Number(g.dataset.ganados)] : null }) }
    })()`)
    console.log(nombre, JSON.stringify(rect.gajos), rect.textos.join(' | ').replace(/\n/g, ' '))
    const r = await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, rect.x - 6), y: Math.max(0, rect.y - 6), width: rect.w + 12, height: rect.h + 12, scale: 2 } })
    fs.writeFileSync(path.join(SAL, `app_${nombre}.png`), Buffer.from(r.result.data, 'base64'))
  }
} finally {
  await app.cerrar()
}
console.log('listo')
