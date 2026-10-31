// Capturas de Design (Entradas Billete) para la 10S8 (agente D). Un Chrome a la vez: node scripts/destino/_conCola.mjs node scripts/destino/_10s8_d_design.mjs
import { capturarDesign } from './capturaDesign.mjs'
const ir = (rotulo) => `(() => { const t = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(rotulo)}) && x.children.length === 0); const tel = t.parentElement.querySelector('div'); const r = tel.getBoundingClientRect(); window.scrollTo(r.left + scrollX - 28, r.top + scrollY - 40); return true })()`
for (const [r, n] of [['E1 ·', 'e1'], ['E2 ·', 'e2'], ['E5 ·', 'e5'], ['A1 ·', 'a1'], ['A1p ·', 'a1p'], ['A2 ·', 'a2'], ['A2p ·', 'a2p'], ['A3 ·', 'a3']]) {
  await capturarDesign('Piezas/Entradas Billete.dc.html', `docs/dias/capturas_jutrip/10s8_${n}_design.jpg`, { ancho: 450, alto: 950, despues: ir(r), espera: 8 })
  console.log('hecha', n)
}
