// V77 (13): captura la página de Design «Consejos del día» (C1-C3) para ponerla junto a la de la app. Un Chrome, cerrado al acabar.
import { capturarDesign } from './capturaDesign.mjs'
await capturarDesign('Consejos del dia.dc.html', 'docs/dias/V77_capturas/design_consejos_c1_c3.jpg', { ancho: 1400, alto: 1000, despues: 'window.scrollTo(0, 330)', espera: 7 })
process.exit(0)
