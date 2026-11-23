// (V40D) Las dos pantallas de Design (Entradas Ficha Pestaña) a 390 x 844, para ponerlas al lado de las de la app en el REPASO.
//   node scripts/destino/capturasDesignV40D.mjs <carpeta del zip descomprimido>
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const dir = process.argv[2]
const salida = 'docs/dias/V40D_capturas'
fs.mkdirSync(salida, { recursive: true })
const app = await abrirApp('file:///' + dir, { ruta: '/Entradas%20Ficha%20Pestana.dc.html', baseFija: true, sinEsperarRuta: true, ancho: 1000, alto: 900 })
try {
  await app.esp(6000)
  const cajas = JSON.parse(await app.evaluar("JSON.stringify([...document.querySelectorAll('div')].filter((d) => getComputedStyle(d).width === '390px' && getComputedStyle(d).height === '844px').map((d) => { const r = d.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } }))"))
  console.log('pantallas encontradas', cajas.length)
  for (let i = 0; i < Math.min(2, cajas.length); i++) {
    const c = cajas[i]
    const r = await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 85, clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale: 1 }, captureBeyondViewport: true })
    fs.writeFileSync(`${salida}/design_${i === 0 ? 'cerradas' : 'abierta'}.jpg`, Buffer.from(r.result.data, 'base64'))
  }
} finally {
  app.cerrar()
}
