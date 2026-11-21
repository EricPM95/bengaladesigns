// La prueba de la Tanda V37 (21-nov): medallas (ningún «sello» fuera del pasaporte), el sello del pasaporte con sonido, viaje sin `originalRoute` y «Borrar mi cuenta».
// Es un ENVOLTORIO: corre cada parte (una a una, nunca dos Chrome a la vez) y suma sus fallos. Las partes también se pasan sueltas:
//   node scripts/destino/pruebaV37.mjs            (todas)    ·    node scripts/destino/pruebaV37.mjs parte=cuenta   (una sola: textos, sello, viaje o cuenta)
import { spawnSync } from 'node:child_process'

const PARTES = [
  ['textos', 'scripts/destino/pruebaV37_textos.mjs'],
  ['cuenta', 'scripts/destino/pruebaV37_cuenta.mjs'],
  ['viaje', 'scripts/destino/pruebaV37_viaje.mjs'],
  ['sello', 'scripts/destino/pruebaV37_sello.mjs'], // la última: usa el navegador (un solo Chrome)
]
const pedida = process.argv.find((a) => a.startsWith('parte='))?.slice(6)
const malas = []
for (const [nombre, archivo] of PARTES) {
  if (pedida && pedida !== nombre) continue
  console.log(`\n=== V37 · ${nombre} (${archivo})`)
  const r = spawnSync(process.execPath, [archivo], { stdio: 'inherit', env: process.env })
  if (r.status !== 0) malas.push(nombre)
}
console.log(malas.length ? `\nPrueba V37: FALLAN ${malas.join(', ')}` : '\nPrueba V37: todas las partes en 0 fallos')
process.exit(malas.length ? 1 : 0)
