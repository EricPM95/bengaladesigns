// V73 (apartados 4 y 5): captura del dibujo «Hoy Al Acabar» (AC1-AC3) para mirar MAÑANA y el alojamiento. Un solo Chrome, se cierra al acabar.
import path from 'node:path'
import { capturarDesign } from './capturaDesign.mjs'
const CAP = path.resolve('docs/dias/V73_capturas')
await capturarDesign('Hoy Al Acabar.dc.html', path.join(CAP, '_design_AC_entero.jpg'), { ancho: 1500, alto: 1900, despues: "window.scrollTo(0,0); [...document.querySelectorAll('div')].filter(d=>/^AC\d/.test((d.firstElementChild&&d.firstElementChild.textContent||'').trim())).map(d=>d.firstElementChild.textContent.trim()).join('|')" })
process.exit(0)
