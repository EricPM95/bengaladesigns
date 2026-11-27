// V75: SOLO capturas de los tableros de Design «Añadir una reserva» (R1a, R2, R3, R3g, R3h, R3b, R3c, R4, R6, R7a, R7b, R12, D1) a 390 px.
//   node scripts/destino/capturasV75_design.mjs [id ...]
import fs from 'node:fs'
import path from 'node:path'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V76_capturas')
fs.mkdirSync(CAP, { recursive: true })
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['R5', 'R9', 'R10']
const aislar = (id) => `(() => {
  const tabl = [...document.querySelectorAll('div')].filter((d) => d.style && d.style.width === '390px' && d.firstElementChild && /^${id} · /.test((d.firstElementChild.textContent || '').trim()))[0]
  if (!tabl) return 'sin tablero'
  const grid = tabl.parentElement
  ;[...grid.children].forEach((c) => { if (c !== tabl) c.style.display = 'none' })
  grid.style.gridTemplateColumns = '390px'
  let p = grid.parentElement; p.style.padding = '0'; p.style.minHeight = '0'
  ;[...p.children].forEach((c) => { if (c !== grid) c.style.display = 'none' })
  tabl.style.padding = '8px'
  document.documentElement.style.background = '#E7DCC6'
  window.scrollTo(0, 0)
  return 'ok'
})()`
for (const id of ids) {
  await capturarDesign('Añadir una reserva.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: aislar(id), ancho: 390, alto: 1100 })
  console.log('design', id)
}
process.exit(0)
