// (V40C) Prepara las fotos de Eric para el mosaico de la pantalla de entrada: recorte 4:5 mirando lo importante de cada una, WebP de 240 x 300.
//   node scripts/entrada/prepararFotosV40C.mjs [carpeta con los .jpg]
// Cada recorte se dice en fracciones de la foto original: [izquierda, arriba] del recorte; el recorte mide el máximo que cabe en 4:5.
import fs from 'node:fs'
import sharp from 'sharp'

const dir = process.argv[2] ?? 'C:/Users/ERIC/Downloads/fotos_entrada/fotos_entrada'
const salida = 'public/fotos/entrada'
const AREA = { londres: [0.18, 0], madrid: [0, 0], lisboa: [0, 0.04], nueva_york: [0, 0.1], shangai: [0.15, 0], islandia: [0, 0], japon: [0.425, 0], maldivas: [0, 0.148], estambul: [0, 0.02], capadocia: [0, 0] }
const NOMBRE = { shangai: 'shanghai' }
let total = 0
for (const [k, [fx, fy]] of Object.entries(AREA)) {
  const img = sharp(`${dir}/${k}.jpg`)
  const { width: W, height: H } = await img.metadata()
  // El mayor 4:5 que cabe.
  let w = W
  let h = Math.round(W / 0.8)
  if (h > H) {
    h = H
    w = Math.round(H * 0.8)
  }
  const left = Math.min(W - w, Math.round(fx * W))
  const top = Math.min(H - h, Math.round(fy * H))
  const destino = `${salida}/${NOMBRE[k] ?? k}.webp`
  let calidad = 70
  let tam = 0
  for (; calidad >= 40; calidad -= 5) {
    const r = await sharp(`${dir}/${k}.jpg`).extract({ left, top, width: w, height: h }).resize(240, 300, { fit: 'cover' }).webp({ quality: calidad }).toFile(destino)
    tam = r.size
    if (tam <= 18 * 1024) break
  }
  total += tam
  console.log(`${k} → ${destino} · recorte ${w}x${h} en (${left},${top}) · calidad ${calidad} · ${(tam / 1024).toFixed(1)} KB`)
}
console.log(`Total de las 10: ${(total / 1024).toFixed(1)} KB`)
fs.writeFileSync('docs/dias/_v40c_peso.txt', String(total))
