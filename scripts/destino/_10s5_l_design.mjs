// Capturas de Design de `Piezas/Billete Reservas` (B1, B2, B3, B4) para la 10S5 (agente L). Un Chrome a la vez (por la cola):
//   node scripts/destino/_conCola.mjs node scripts/destino/_10s5_l_design.mjs
import { capturarDesign } from './capturaDesign.mjs'

const ir = (rotulo) => `(() => { const t = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(rotulo)}) && x.children.length === 0); const tel = t.parentElement.querySelector('div'); const r = tel.getBoundingClientRect(); window.scrollTo(r.left + scrollX - 28, r.top + scrollY - 40); return true })()`
const piezas = [
  ['B1 ·', 'billete_b1_design'],
  ['B2 ·', 'billete_b2_design'],
  ['B3 ·', 'billete_b3_design'],
  ['B4 ·', 'billete_b4_design'],
]
for (const [rotulo, nombre] of piezas) {
  await capturarDesign('Piezas/Billete Reservas.dc.html', `docs/dias/capturas_jutrip/10s5_${nombre}.jpg`, { ancho: 450, alto: 950, despues: ir(rotulo), espera: 8 })
  console.log('hecha', nombre)
}
