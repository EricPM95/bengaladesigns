// Capturas de Design de `Piezas/Pase Lista` para la 10N11 (agente C): 1 = la lista, 2 = HOY sin pase (día de prueba sin usar), 2b = ya usado. Un Chrome a la vez (por la cola):
//   node scripts/destino/_conCola.mjs node scripts/destino/_10n11_c_design.mjs
import { capturarDesign } from './capturaDesign.mjs'

const ir = (rotulo, y = 0) => `(() => { const t = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(rotulo)}) && x.children.length === 0); const tel = t.parentElement.querySelector('div'); const r = tel.getBoundingClientRect(); window.scrollTo(r.left + scrollX - 28, r.top + scrollY - 40 + ${y}); return true })()`
const piezas = [
  ['1 · El Pase Roma', 'lista_pase_1_design', 0],
  ['1 · El Pase Roma', 'lista_pase_2_final_design', 1100],
  ['2 · HOY sin pase', 'hoy_sin_pase_1_sin_usar_design', 0],
  ['2b · HOY sin pase', 'hoy_sin_pase_2_usado_design', 0],
]
for (const [rotulo, nombre, y] of piezas) {
  await capturarDesign('Piezas/Pase Lista.dc.html', `docs/dias/capturas_jutrip/10n11_${nombre}.jpg`, { ancho: 450, alto: 950, despues: ir(rotulo, y), espera: 8 })
  console.log('hecha', nombre)
}
