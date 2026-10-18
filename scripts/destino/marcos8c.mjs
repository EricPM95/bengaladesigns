// Convierte los 10 marcos de rango de Design (PNG de 700 KB a 1,2 MB) a WebP para la app. Reproducible:
//   node scripts/destino/marcos8c.mjs
// Origen:  docs/diseno/proyecto/assets/marco-nivel1.png … marco-nivel10.png (el marco, con la ventana transparente)
//          docs/diseno/proyecto/assets/hueco-1.png … hueco-10.png (la forma de la ventana: la foto se recorta con ella)
// Salida:  public/marcos/marco-1.webp … marco-10.webp (~40–60 KB cada uno) y public/marcos/hueco-1.webp … hueco-10.webp (unos pocos KB)
// Se cargan SOLO cuando se ven (MarcoDeRango, con <img loading="lazy">); nada de esto entra en el paquete al abrir la app.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ORIGEN = 'docs/diseno/proyecto/assets'
const SALIDA = 'public/marcos'
/** Ancho del marco en píxeles: el Perfil lo pinta a ~110 px (220 con pantalla doble); los cambios de rango a 250 px (500 con pantalla doble). */
export const ANCHO_MARCO = 500
/** Ancho del hueco (solo la forma): con 160 px basta para recortar la foto. */
export const ANCHO_HUECO = 160

/** Cada marco se baja de calidad (y, si hace falta, de ancho) hasta que pesa como mucho `MAXIMO_KB`: los marcos con muchos adornos pesan más que los sencillos. */
export const MAXIMO_KB = 58
async function ajustar(origen, salida) {
  for (const ancho of [ANCHO_MARCO, 460, 420, 380]) {
    for (let calidad = 76; calidad >= 36; calidad -= 4) {
      const buf = await sharp(origen).resize({ width: ancho }).webp({ quality: calidad, alphaQuality: 70, effort: 6, smartSubsample: true }).toBuffer()
      if (buf.length / 1024 <= MAXIMO_KB || (ancho === 380 && calidad <= 36)) {
        fs.writeFileSync(salida, buf)
        return
      }
    }
  }
}

fs.mkdirSync(SALIDA, { recursive: true })
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(1)
let totalAntes = 0
let totalDespues = 0
for (let n = 1; n <= 10; n++) {
  const marcoOrigen = path.join(ORIGEN, `marco-nivel${n}.png`)
  const huecoOrigen = path.join(ORIGEN, `hueco-${n}.png`)
  const marcoSalida = path.join(SALIDA, `marco-${n}.webp`)
  const huecoSalida = path.join(SALIDA, `hueco-${n}.webp`)
  await ajustar(marcoOrigen, marcoSalida)
  // El hueco solo necesita su forma (la transparencia): se guarda como WebP con alfa, muy pequeño.
  await sharp(huecoOrigen).resize({ width: ANCHO_HUECO }).webp({ quality: 60, alphaQuality: 90, effort: 6 }).toFile(huecoSalida)
  const antes = fs.statSync(marcoOrigen).size
  const despues = fs.statSync(marcoSalida).size
  totalAntes += antes
  totalDespues += despues
  console.log(`marco ${String(n).padStart(2)}: ${(antes / 1024).toFixed(0)} KB -> ${kb(marcoSalida)} KB   (hueco ${kb(huecoSalida)} KB)`)
}
console.log(`Total marcos: ${(totalAntes / 1024).toFixed(0)} KB -> ${(totalDespues / 1024).toFixed(0)} KB`)
