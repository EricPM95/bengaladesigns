// Capturas de Design de Piezas/Entradas Billete (E1 a E4) y Entradas Lista (L2) para la 10S7 (agente S). Un Chrome a la vez (por la cola):
//   node scripts/destino/_conCola.mjs node scripts/destino/_10s7_s_design.mjs
import { capturarDesign } from './capturaDesign.mjs'

const ir = (rotulo) => `(() => { const t = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(rotulo)}) && x.children.length === 0); const tel = t.parentElement.querySelector('div'); const r = tel.getBoundingClientRect(); window.scrollTo(r.left + scrollX - 28, r.top + scrollY - 40); return true })()`
const piezas = [
  ['Piezas/Entradas Billete.dc.html', 'E1 ·', 'entradas_billete_01_e1_design'],
  ['Piezas/Entradas Billete.dc.html', 'E2 ·', 'entradas_billete_03_e2_design'],
  ['Piezas/Entradas Billete.dc.html', 'E3 ·', 'entradas_billete_04_e3_design'],
  ['Piezas/Entradas Billete.dc.html', 'E4 ·', 'entradas_billete_06_hoy_design'],
  ['Piezas/Entradas Lista.dc.html', 'L2 ·', 'entradas_billete_05_l2_design'],
]
for (const [pieza, rotulo, nombre] of piezas) {
  await capturarDesign(pieza, `docs/dias/capturas_jutrip/10s7_${nombre}.jpg`, { ancho: 450, alto: 950, despues: ir(rotulo), espera: 8 })
  console.log('hecha', nombre)
}
