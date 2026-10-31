// Capturas de Design de Piezas/Billete Reservas para la 10S8 (agente C). Por la cola: node scripts/destino/_conCola.mjs node scripts/destino/_10s8_c_design.mjs
import { capturarDesign } from './capturaDesign.mjs'
const ir = (rotulo) => `(() => { const t = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(rotulo)}) && x.children.length === 0); const tel = t.parentElement.querySelector('div'); const r = tel.getBoundingClientRect(); window.scrollTo(r.left + scrollX - 28, r.top + scrollY - 40); return true })()`
const piezas = [['B1b ·', 'vuelo_b1b'], ['B1c ·', 'vuelo_b1c'], ['B1d ·', 'vuelo_b1d'], ['B2 ·', 'vuelo_b2'], ['B2c ·', 'vuelo_b2c'], ['B2b ·', 'vuelo_b2b'], ['B3 ·', 'vuelo_b3']]
for (const [rotulo, nombre] of piezas) {
  await capturarDesign('Piezas/Billete Reservas.dc.html', `docs/dias/capturas_jutrip/10s8_${nombre}_design.jpg`, { ancho: 450, alto: 950, despues: ir(rotulo), espera: 8 })
  console.log('hecha', nombre)
}
