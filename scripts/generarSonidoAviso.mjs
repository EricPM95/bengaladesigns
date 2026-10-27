// Genera public/sonidos/aviso.wav: la campanita suave de los avisos nuevos (Tanda 10N4 §4b). Dos notas cortas (mi6 y la6) con caída suave, ~0,7 s, sin clics.
// Uso: node scripts/generarSonidoAviso.mjs
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const HZ = 22050
const DURACION = 0.72
const n = Math.floor(HZ * DURACION)
const muestras = new Float32Array(n)
const nota = (frecuencia, inicio, volumen) => {
  for (let i = 0; i < n; i++) {
    const t = i / HZ - inicio
    if (t < 0) continue
    const ataque = Math.min(1, t / 0.006)
    const caida = Math.exp(-t * 7.5)
    // Fundamental + un armónico suave: suena a campanita, no a pitido.
    const onda = Math.sin(2 * Math.PI * frecuencia * t) + 0.28 * Math.sin(2 * Math.PI * frecuencia * 2.76 * t) * Math.exp(-t * 14)
    muestras[i] += onda * ataque * caida * volumen
  }
}
nota(1318.5, 0, 0.34)
nota(1760, 0.11, 0.3)
const datos = Buffer.alloc(44 + n * 2)
datos.write('RIFF', 0)
datos.writeUInt32LE(36 + n * 2, 4)
datos.write('WAVEfmt ', 8)
datos.writeUInt32LE(16, 16)
datos.writeUInt16LE(1, 20)
datos.writeUInt16LE(1, 22)
datos.writeUInt32LE(HZ, 24)
datos.writeUInt32LE(HZ * 2, 28)
datos.writeUInt16LE(2, 32)
datos.writeUInt16LE(16, 34)
datos.write('data', 36)
datos.writeUInt32LE(n * 2, 40)
for (let i = 0; i < n; i++) {
  const fundido = Math.min(1, (n - i) / (HZ * 0.05))
  datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, muestras[i] * fundido)) * 32000), 44 + i * 2)
}
writeFileSync(join(AQUI, '..', 'public', 'sonidos', 'aviso.wav'), datos)
console.log(`aviso.wav: ${datos.length} bytes`)
