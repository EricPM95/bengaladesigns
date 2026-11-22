// La prueba de la Tanda V39B (el Coliseo con su suspense y «Una maravilla nueva»). ENVOLTORIO: corre cada parte (una a una, nunca dos Chrome a la vez) y suma sus fallos.
//   node scripts/destino/pruebaV39B.mjs   ·   node scripts/destino/pruebaV39B.mjs parte=coliseo   (coliseo o maravilla)
import { spawnSync } from 'node:child_process'

const PARTES = [
  ['coliseo', 'scripts/destino/pruebaV39B_coliseo.mjs'],
  ['maravilla', 'scripts/destino/pruebaV39B_maravilla.mjs'],
]
const pedida = process.argv.find((a) => a.startsWith('parte='))?.slice(6)
const malas = []
for (const [nombre, archivo] of PARTES) {
  if (pedida && pedida !== nombre) continue
  console.log(`\n=== V39B · ${nombre} (${archivo})`)
  const r = spawnSync(process.execPath, [archivo], { stdio: 'inherit', env: { APP_URL: 'http://localhost:5173', ...process.env } })
  if (r.status !== 0) malas.push(nombre)
}
console.log(malas.length ? `\nPrueba V39B: FALLAN ${malas.join(', ')}` : '\nPrueba V39B: todas las partes en 0 fallos')
process.exit(malas.length ? 1 : 0)
