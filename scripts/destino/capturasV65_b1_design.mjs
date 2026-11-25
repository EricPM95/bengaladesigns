// V65 (apartados 2 y 3): captura SOLO el dibujo de Design «Las entradas de cada uno» (D7e, «Añadir un documento.dc.html») en 390 de ancho. Un Chrome, que se cierra al acabar.
import fs from 'node:fs'
import path from 'node:path'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V65_capturas')
fs.mkdirSync(CAP, { recursive: true })
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
await capturarDesign('Añadir un documento.dc.html', path.join(CAP, 'hoja_design.jpg'), { despues: aislar('D7e'), ancho: 390, alto: 900 })
console.log('design hoja_design')
process.exit(0)
