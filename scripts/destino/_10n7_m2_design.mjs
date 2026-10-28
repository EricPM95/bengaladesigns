// Capturas de Design de «Cuentas Modo» para la 10N7 (M2).
import { capturarDesign } from './capturaDesign.mjs'
const ir = (t) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(t)})); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
const lista = process.argv.slice(2).length ? process.argv.slice(2) : ['01', '01b', '02a', '02b', '02c', '03', '04', '04b', '05', '05b', '05c', '06', '06b', '07', '08', '09', '09b']
for (const n of lista) {
  await capturarDesign('Piezas/Cuentas Modo.dc.html', `docs/dias/capturas_jutrip/10n7_design_cuentas_${n}.jpg`, { ancho: 480, alto: 960, despues: ir(`${n} · `), espera: 8 })
  console.log('hecha', n)
}
