import fs from 'node:fs'
const d = JSON.parse(fs.readFileSync(process.argv[2] ?? 'docs/dias/V68_log_a0.json', 'utf8'))
for (const k of Object.keys(d)) {
  if (k === 'base' && !process.argv[3]) continue
  console.log('==', k)
  for (const day of d[k]) console.log(day.n, day.titulo, '|', day.paradas.join(' ; '))
}
