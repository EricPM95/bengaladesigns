// V65 (agente del apartado 1 y la parte visual del 2): SOLO capturas de los dibujos D7a-D7d (Añadir un documento.dc.html).
import path from 'node:path'
import { capturarDesign } from './capturaDesign.mjs'
const CAP = path.resolve('docs/dias/V65_capturas')
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
for (const id of ['D7a', 'D7b', 'D7c', 'D7d', 'D7d2']) {
  await capturarDesign('Añadir un documento.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: aislar(id), ancho: 390, alto: 1100 })
  console.log('design', id)
}
process.exit(0)
