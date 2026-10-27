// Captura una pieza de Design (docs/diseno/proyecto/**/*.dc.html) a tamaño de móvil, para ponerla al lado de la de la app en el REPASO (Tanda 10N4: «cada captura al lado de la de Design»).
//   import { capturarDesign } from './capturaDesign.mjs'
//   await capturarDesign('Piezas/Avisos Gestion.dc.html', 'docs/dias/capturas_jutrip/10n4_design_avisos_gestion.jpg', { ancho: 390, alto: 844, antes: 'window.scrollTo(0, 0)' })
// Sirve la carpeta de Design con un servidor estático de Node (sin tocar el Vite ni el API) y la abre en un Chrome sin ventana. Las piezas con varias pantallas se ven en la misma página (se puede hacer scroll con `antes`
// o pasar `despues` con JavaScript para dejar la pantalla que se quiere, p. ej. hacer scroll hasta un elemento). Devuelve true si capturó.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const RAIZ = path.resolve('docs/diseno/proyecto')
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }

export async function capturarDesign(pieza, salida, { ancho = 390, alto = 844, despues = '', espera = 6 } = {}) {
  const servidor = http.createServer((req, res) => {
    const ruta = path.join(RAIZ, decodeURIComponent((req.url ?? '/').split('?')[0]))
    if (!ruta.startsWith(RAIZ) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] ?? 'application/octet-stream' })
    fs.createReadStream(ruta).pipe(res)
  })
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
  const puerto = servidor.address().port
  try {
    const a = await abrirApp(`http://127.0.0.1:${puerto}`, { ancho, alto, ruta: `/${pieza.split('/').map(encodeURIComponent).join('/')}`, sinEsperarRoot: true, baseFija: true, esperaFija: espera })
    if (despues) await a.evaluar(despues)
    await a.esp(1500)
    await a.captura(salida)
    a.cerrar()
    return true
  } finally {
    servidor.close()
  }
}
