// V61: captura del probador de Reorganizar (/admin/reorganizar) con un caso preparado, en ordenador (1280). Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV61_probador.mjs [Roma|Lanzarote] [caso]
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V61_capturas')
fs.mkdirSync(CAP, { recursive: true })
const destino = process.argv[2] ?? 'Roma'
const caso = process.argv[3] ?? 'llegada-1600-ft-1700'
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: `/admin/reorganizar?logrosDemo=1&caso=${caso}&destino=${destino}&dias=4${process.argv[4] ?? ''}`, ancho: 1280, alto: 1500, sinEsperarRuta: true, antes: `const f0 = window.fetch.bind(window); window.fetch = (u, o) => (String(u && u.url ? u.url : u).includes('/api/admin/inicio') ? Promise.resolve(new Response(JSON.stringify({ ok: true, reportes_nuevos: 0, fotos_por_aprobar: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f0(u, o))` })
// (Solo en MI navegador de prueba: se tapa la comprobación de administrador de la pantalla para poder capturarla; el motor que usa el probador es el de la app, no necesita cuenta.)
try {
  let linea = ''
  for (let i = 0; i < 240; i++) {
    linea = await a.evaluar("document.querySelector('[data-probador=\"linea-del-motor\"]')?.innerText ?? ''").catch(() => '')
    const err = await a.evaluar("document.querySelector('[data-probador=\"error\"]')?.innerText ?? ''").catch(() => '')
    if (err) { console.log('ERROR del probador:', err); break }
    if (linea && linea.length > 10) break
    await a.esp(1000)
  }
  await a.esp(2500)
  console.log('línea del motor:', linea)
  console.log('texto', (await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 1200)")))
  await a.captura(path.join(CAP, `probador_${destino.toLowerCase()}_${caso}.jpg`))
} finally {
  a.cerrar()
}
