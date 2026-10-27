// Capturas de Design para el REPASO de la Tanda 10N6 (agente K3): Recuerdos Ficha (A·01, A·02, A·03).
import { capturarDesign } from './capturaDesign.mjs'
const ir = (t) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(t)})); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
for (const [t, n] of [['A · 01', 'sin_fotos'], ['A · 02', 'con_fotos'], ['A · 03', 'hoja']]) {
  await capturarDesign('Piezas/Recuerdos Ficha.dc.html', `docs/dias/capturas_jutrip/10n6_design_recuerdos_${n}.jpg`, { ancho: 520, alto: 930, despues: ir(t), espera: 8 })
  console.log('hecha', n)
}
