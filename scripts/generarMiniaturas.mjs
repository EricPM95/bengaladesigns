// Saca de cada foto propia de los sitios una MINIATURA en WebP (Tanda 8A2): la foto pequeña que Design pone en las listas de paradas en vez del círculo con ✓.
//   node scripts/generarMiniaturas.mjs [destino=roma]
//
// 144 x 144 px (se ve bien a unos 48 px en una pantalla de alta resolución, 3x), recortada al centro, WebP. Sale de la versión de tarjeta (<foto>_p.jpg, 640 px) si existe y,
// si no, de la grande. Van en public/fotos/<destino>/mini/<foto>.webp. Si cambia una foto, se vuelve a lanzar (solo rehace las que han cambiado).
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const destino = (process.argv[2] ?? 'roma').replace(/^destino=/, '')
const carpeta = path.join('public', 'fotos', destino)
const salida = path.join(carpeta, 'mini')
const LADO = 144

fs.mkdirSync(salida, { recursive: true })
const grandes = fs.readdirSync(carpeta).filter((f) => f.endsWith('.jpg') && !f.endsWith('_p.jpg'))
let hechas = 0
let saltadas = 0
let bytes = 0
const tamanos = []
for (const archivo of grandes) {
  const base = archivo.replace(/\.jpg$/, '')
  const origen = fs.existsSync(path.join(carpeta, `${base}_p.jpg`)) ? path.join(carpeta, `${base}_p.jpg`) : path.join(carpeta, archivo)
  const destinoArchivo = path.join(salida, `${base}.webp`)
  if (fs.existsSync(destinoArchivo) && fs.statSync(destinoArchivo).mtimeMs >= fs.statSync(origen).mtimeMs) {
    saltadas++
  } else {
    await sharp(origen).resize(LADO, LADO, { fit: 'cover', position: 'attention' }).webp({ quality: 72, effort: 6 }).toFile(destinoArchivo)
    hechas++
  }
  const t = fs.statSync(destinoArchivo).size
  bytes += t
  tamanos.push(t)
}
tamanos.sort((a, b) => a - b)
console.log(`Miniaturas de ${destino}: ${grandes.length} (hechas ${hechas}, ya estaban ${saltadas})`)
console.log(`Peso total: ${(bytes / 1024).toFixed(1)} KB · media ${(bytes / grandes.length / 1024).toFixed(1)} KB · la más pequeña ${(tamanos[0] / 1024).toFixed(1)} KB · la mayor ${(tamanos[tamanos.length - 1] / 1024).toFixed(1)} KB`)
