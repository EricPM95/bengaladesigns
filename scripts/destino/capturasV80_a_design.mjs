import { capturarDesign } from './capturaDesign.mjs'
await capturarDesign('Día de excursión en HOY.dc.html', 'docs/dias/V80_capturas/_design_fila2.jpg', { ancho: 1900, alto: 2400, espera: 8, despues: 'document.querySelectorAll("*").forEach(e=>{if(e.scrollHeight>e.clientHeight+500&&getComputedStyle(e).overflowY!="visible")e.scrollTop=2300});window.scrollTo(0,2300)' })
