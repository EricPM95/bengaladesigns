// Comprueba con peticiones reales que cada parada recibe su foto propia (data/dias/<destino>/_fotos.json): el nombre con
// el que la pide la app, fuera y dentro de sus fechas, y que el fichero existe.
//   node scripts/destino/comprobarFotos.mjs [api=http://localhost:8787]
import { readFileSync } from 'node:fs'

const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const api = a.api ?? 'http://localhost:8787'
const table = JSON.parse(readFileSync('data/dias/roma/_fotos.json', 'utf8'))
const ask = async (name, date) => {
  const response = await fetch(`${api}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, city: 'Roma', ...(date ? { date } : {}) }) })
  return response.json()
}
const inWindow = '2026-12-20'
const outWindow = '2027-05-12'
let bad = 0
for (const foto of table.fotos) {
  for (const name of foto.lugares ?? []) {
    const date = foto.fechas ? inWindow : outWindow
    const got = await ask(name, date)
    const expected = foto.verificar ? '(no sale: verificar)' : `${table.carpeta}/${foto.archivo}`
    const winner = table.fotos.filter((other) => !other.verificar && (other.lugares ?? []).includes(name) && (!other.fechas || date === inWindow)).find((other) => other.fechas) ?? foto
    const ok = foto.verificar ? got.photo_url !== `${table.carpeta}/${foto.archivo}` : got.photo_url === `${table.carpeta}/${winner.archivo}`
    let file = ''
    if (got.photo_source === 'propia') {
      const head = await fetch(`${api.replace(/:8787$/, ':5173')}${got.photo_small}`).catch(() => null)
      file = head ? ` · tarjeta ${head.status}` : ''
    }
    if (!ok) bad++
    console.log(`${ok ? 'OK ' : 'MAL'} ${name} (${date}) → ${got.photo_source} ${got.photo_url ?? ''}${file}${foto.verificar ? ` [${expected}]` : ''}`)
  }
  // Las de unas fechas, fuera de ellas: nunca.
  if (foto.fechas) for (const name of foto.lugares ?? []) {
    const got = await ask(name, outWindow)
    const ok = got.photo_url !== `${table.carpeta}/${foto.archivo}`
    if (!ok) bad++
    console.log(`${ok ? 'OK ' : 'MAL'} ${name} (${outWindow}, fuera de fechas) → ${got.photo_source} ${got.photo_url ?? ''}`)
  }
}
console.log(bad === 0 ? '\nTodas bien.' : `\n${bad} mal.`)
