// La prueba de la Tanda V39 («Turista en tu país», «El viaje de tus sueños» y la bola del mundo para todos). Es un ENVOLTORIO: corre cada parte (una a una, nunca dos Chrome a la vez) y suma sus fallos.
//   node scripts/destino/pruebaV39.mjs   ·   node scripts/destino/pruebaV39.mjs parte=pais   (pais, suenos o bola)
// pais y suenos no necesitan servidores (motor y PGlite); bola pide el Vite en 5173 (si no, se salta la pantalla diciéndolo).
import { spawnSync } from 'node:child_process'

const PARTES = [
  ['pais', 'scripts/destino/pruebaV39_pais.mjs'],
  ['suenos', 'scripts/destino/pruebaV39_suenos.mjs'],
  ['bola', 'scripts/destino/pruebaV39_bola.mjs'],
]
const pedida = process.argv.find((a) => a.startsWith('parte='))?.slice(6)
const malas = []
for (const [nombre, archivo] of PARTES) {
  if (pedida && pedida !== nombre) continue
  console.log(`\n=== V39 · ${nombre} (${archivo})`)
  const r = spawnSync(process.execPath, [archivo], { stdio: 'inherit', env: { APP_URL: 'http://localhost:5173', ...process.env } })
  if (r.status !== 0) malas.push(nombre)
}
console.log(malas.length ? `\nPrueba V39: FALLAN ${malas.join(', ')}` : '\nPrueba V39: todas las partes en 0 fallos')
process.exit(malas.length ? 1 : 0)
