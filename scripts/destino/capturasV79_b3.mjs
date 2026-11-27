// V79 §3: el dibujo VL7a/VL7b de Design (miniaturas «Italia · país nuevo»), a 390x844 de ancho de móvil.
import path from 'node:path'
import { capturarDesign } from './capturaDesign.mjs'
const CAP = path.resolve('docs/dias/V79_capturas')
const sube = "(() => { const x = [...document.querySelectorAll('*')].find((e) => e.children.length < 4 && /País nuevo/.test(e.textContent || '') && e.getBoundingClientRect().height > 8 && e.getBoundingClientRect().height < 80); if (x) { x.scrollIntoView({ block: 'center' }); } return Boolean(x) })()"
console.log(await capturarDesign('La vuelta en HOY.dc.html', path.join(CAP, 'design_VL7a_pais.jpg'), { ancho: 390, alto: 844, despues: sube }))
