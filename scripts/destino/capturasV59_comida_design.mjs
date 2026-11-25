// V59 §3: las capturas de Design «Hora de Comer» (C1, C2, C3, C5), una por pantalla, para ponerlas al lado de la de la app. Un Chrome a la vez, por la cola:
//   node scripts/destino/_conCola.mjs node scripts/destino/capturasV59_comida_design.mjs
import fs from 'node:fs'
import path from 'node:path'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V59_capturas')
fs.mkdirSync(CAP, { recursive: true })
for (const id of ['C1', 'C2', 'C3', 'C5']) {
  // La página pone las pantallas en rejilla de 3 columnas: se hace scroll hasta la del móvil de ese rótulo y se deja arriba.
  const despues = `(async () => { const t = Array.from(document.querySelectorAll('span')).find((e) => (e.textContent || '').trim().startsWith('${id} ·')); if (!t) return 'no'; const tablero = t.parentElement; const rejilla = tablero.parentElement; Array.from(rejilla.children).forEach((x) => { if (x !== tablero && x.tagName !== 'SC-FOR') x.style.display = 'none' }); Array.from(rejilla.querySelectorAll(':scope > div')).forEach((x) => { if (x !== tablero) x.style.display = 'none' }); const raiz = rejilla.parentElement; Array.from(raiz.children).forEach((x) => { if (x !== rejilla) x.style.display = 'none' }); raiz.style.padding = '12px 10px'; rejilla.style.gridTemplateColumns = '390px'; window.scrollTo(0, 0); return 'ok' })()`
  await capturarDesign('Hora de Comer.dc.html', path.join(CAP, `${id}_design.jpg`), { ancho: 410, alto: 844, despues, espera: 7 })
  console.log(id, 'hecho')
}
