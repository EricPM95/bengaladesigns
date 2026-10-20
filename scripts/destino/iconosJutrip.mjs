// Saca los iconos y los archivos del logo de JUTRIP (Tanda 10) del dibujo en código de shared/marca/logoJutrip.js:
//   public/marca/logo-jutrip.svg y logo-jutrip-oscuro.svg  (la estrella con su anillo y su ruta de puntos, sin la palabra)
//   public/favicon.svg                                     (el icono de la pestaña del navegador)
//   public/icons/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png   (la estrella sobre marfil; el «maskable» con margen para que no se corte)
// Uso: node scripts/destino/iconosJutrip.mjs
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { estrellaSvg } from '../../shared/marca/logoJutrip.js'

const raiz = new URL('../../', import.meta.url)
const ruta = (r) => new URL(r, raiz)
fs.mkdirSync(ruta('public/marca/'), { recursive: true })

const conXmlns = (svg) => svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
fs.writeFileSync(ruta('public/marca/logo-jutrip.svg'), conXmlns(estrellaSvg({ ancho: 230, tono: 'claro', id: 'jl' })).replace(' style="overflow:visible;flex:none"', '') + '\n')
fs.writeFileSync(ruta('public/marca/logo-jutrip-oscuro.svg'), conXmlns(estrellaSvg({ ancho: 230, tono: 'oscuro', id: 'jo' })).replace(' style="overflow:visible;flex:none"', '') + '\n')

/** El icono: el fondo marfil con su luz (como la apertura de Design) y la estrella en el centro. `lado` en px; `margen` es la parte del lado que se deja libre alrededor (0,18 = 18 %). */
function iconoSvg(lado, margen, redondo) {
  const caja = lado * (1 - 2 * margen)
  // El dibujo mide 230 x 200: se centra en el cuadrado.
  const k = caja / 230
  const x = (lado - 230 * k) / 2
  const y = (lado - 200 * k) / 2
  const dibujo = estrellaSvg({ ancho: 230, tono: 'claro', id: 'ic' })
    .replace(/^<svg [^>]*>/, '')
    .replace(/<\/svg>$/, '')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">` +
    `<defs><radialGradient id="fondo" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FBF3E2"/><stop offset="1" stop-color="#E7D9BC"/></radialGradient></defs>` +
    `<rect width="${lado}" height="${lado}" rx="${redondo ? lado * 0.22 : 0}" fill="url(#fondo)"/>` +
    `<g transform="translate(${x} ${y}) scale(${k})" fill="none">${dibujo}</g></svg>`
  )
}

const salidas = [
  ['public/icons/icon-192.png', 192, 0.1, false],
  ['public/icons/icon-512.png', 512, 0.1, false],
  // El «maskable»: el sistema recorta hasta un círculo del 80 % del centro; la estrella cabe en el 60 % central.
  ['public/icons/icon-maskable-512.png', 512, 0.2, false],
  // El de Apple: cuadrado, sin esquinas (iOS las redondea).
  ['public/icons/apple-touch-icon.png', 180, 0.1, false],
]
for (const [archivo, lado, margen, redondo] of salidas) {
  await sharp(Buffer.from(iconoSvg(lado * 2, margen, redondo)), { density: 144 }).resize(lado, lado).png().toFile(fileURLToPath(new URL(archivo, raiz)))
  console.log('hecho', archivo)
}
fs.writeFileSync(ruta('public/favicon.svg'), iconoSvg(64, 0.06, true) + '\n')
console.log('hecho public/favicon.svg y public/marca/')
