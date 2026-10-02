// Un solo uso (2026-10-03, PARA_CODE_PENDIENTE A.4): los sitios que valen por dentro, si están cerrados, se quitan (no se ven por fuera).
import { readFileSync, writeFileSync } from 'node:fs'
const names = ['Basílica de San Clemente', 'Museos Capitolinos', 'Palazzo Doria Pamphilj']
let total = 0
for (const file of ['D1-FT', 'D1', 'D5', 'D5C', 'D6', 'D7']) {
  const path = `data/dias/roma/${file}.json`
  let text = readFileSync(path, 'utf8')
  let count = 0
  for (const name of names) {
    const re = new RegExp(`("lugar": "${name}"[^]{0,300}?"si_cerrado": )"fuera"`, 'g')
    text = text.replace(re, (match, head) => {
      count++
      return `${head}"quitar"`
    })
  }
  if (count > 0) {
    JSON.parse(text)
    writeFileSync(path, text)
  }
  console.log(file, count)
  total += count
}
console.log('total', total)
