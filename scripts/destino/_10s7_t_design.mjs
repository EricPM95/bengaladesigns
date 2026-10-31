// Capturas de Design de `Piezas/Entradas Billete` (A1, A2) y `Piezas/Pase Lista` (1) para la 10S7 (agente T). Un Chrome a la vez (por la cola):
//   node scripts/destino/_conCola.mjs node scripts/destino/_10s7_t_design.mjs
import { capturarDesign } from './capturaDesign.mjs'

const ir = (rotulo) => `(() => { const t = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(rotulo)}) && x.children.length === 0); const tel = t.parentElement.querySelector('div'); const r = tel.getBoundingClientRect(); window.scrollTo(r.left + scrollX - 28, r.top + scrollY - 40); return true })()`
const piezas = [
  ['Piezas/Entradas Billete.dc.html', 'A1 ·', 'alojamiento_a1_design'],
  ['Piezas/Entradas Billete.dc.html', 'A2 ·', 'alojamiento_a2_design'],
  ['Piezas/Pase Lista.dc.html', '1 ·', 'lista_pase_design'],
]
for (const [pieza, rotulo, nombre] of piezas) {
  await capturarDesign(pieza, `docs/dias/capturas_jutrip/10s7_${nombre}.jpg`, { ancho: 450, alto: 950, despues: ir(rotulo), espera: 8 })
  console.log('hecha', nombre)
}
