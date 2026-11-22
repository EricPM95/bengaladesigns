// (V40) Después de `aplicarEstudio.mjs --escribir`: deja en la app solo lo que suena, ligero.
//   · Cada .wav de public/sonidos/estudio (los ya hechos de Eric y los wav suyos sin retocar) pasa a .m4a (AAC 192 kbps, MISMA tasa y canales) y el .wav se quita: el cargador de la app pide el .m4a.
//   · Los originales (public/sonidos/estudio/originales) no los necesita la app: se quitan (siguen en el zip de Eric).
//   node scripts/sonidos/comprimirEstudio.mjs
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const dir = path.resolve('public/sonidos/estudio')
const sonda = (f, campo) => spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', `stream=${campo}`, '-of', 'default=nw=1:nk=1', f], { encoding: 'utf8' }).stdout.trim()
let antes = 0
let despues = 0
let fallos = 0
for (const n of fs.readdirSync(dir).filter((x) => x.toLowerCase().endsWith('.wav'))) {
  const wav = path.join(dir, n)
  const m4a = wav.replace(/\.wav$/i, '.m4a')
  antes += fs.statSync(wav).size
  if (!fs.existsSync(m4a)) {
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '192k', '-ar', sonda(wav, 'sample_rate'), m4a], { encoding: 'utf8' })
    if (r.status !== 0) { console.log(`ERROR ${n}: ${r.stderr}`); fallos++; continue }
  }
  const dw = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', wav], { encoding: 'utf8' }).stdout)
  const dm = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', m4a], { encoding: 'utf8' }).stdout)
  if (!(Math.abs(dw - dm) < 0.025)) { console.log(`ERROR ${n}: dura ${dw} y su m4a ${dm}`); fallos++; continue }
  fs.rmSync(wav)
}
for (const n of fs.readdirSync(dir)) if (n.toLowerCase().endsWith('.m4a')) despues += fs.statSync(path.join(dir, n)).size
fs.rmSync(path.join(dir, 'originales'), { recursive: true, force: true })
let total = 0
for (const n of fs.readdirSync(dir)) total += fs.statSync(path.join(dir, n)).size
console.log(`wav → m4a: ${(antes / 1048576).toFixed(1)} MB de wav pasan a ${(despues / 1048576).toFixed(2)} MB de m4a · carpeta ahora ${(total / 1048576).toFixed(2)} MB · fallos ${fallos}`)
process.exit(fallos ? 1 : 0)
