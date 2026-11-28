// V82: N1 de Design en tres alturas (arriba, medio y abajo): se desliza el contenedor interno del móvil del dibujo.
import path from 'node:path'
import { capturarDesign } from './capturaDesign.mjs'
const CAP = path.resolve('docs/dias/V82_capturas')
const f = (pos) => `(() => {
  const tabl = [...document.querySelectorAll('div')].filter((d) => d.style && d.style.width === '390px' && d.firstElementChild && /^N1 · /.test((d.firstElementChild.textContent || '').trim()))[0]
  const grid = tabl.parentElement
  ;[...grid.children].forEach((c) => { if (c !== tabl) c.style.display = 'none' })
  grid.style.gridTemplateColumns = '390px'
  let p = grid.parentElement; p.style.padding = '0'; p.style.minHeight = '0'
  ;[...p.children].forEach((c) => { if (c !== grid) c.style.display = 'none' })
  const sc = [...tabl.querySelectorAll('div')].find((d) => d.style.overflowY === 'auto')
  sc.scrollTop = ${pos} === -1 ? sc.scrollHeight : ${pos}
  window.scrollTo(0, 0)
  return sc.scrollHeight
})()`
for (const [n, pos] of [['arriba', 0], ['medio', 700], ['mar', 1500], ['mar2', 1900], ['abajo', -1]]) {
  await capturarDesign('Todos mis logros nuevo.dc.html', path.join(CAP, `N1_${n}_design.jpg`), { despues: f(pos), ancho: 390, alto: 900 })
  console.log('ok', n)
}
process.exit(0)
