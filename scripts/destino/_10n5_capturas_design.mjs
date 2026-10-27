import { capturarDesign } from './capturaDesign.mjs'
const D = 'docs/dias/capturas_jutrip/10n5_design_'
await capturarDesign('Piezas/Pase Estilo.dc.html', D + 'pase_estilo_01.jpg', { ancho: 520, alto: 1000, despues: 'window.scrollTo(0, 0); true', espera: 5 })
await capturarDesign('Piezas/Pase Pelicula.dc.html', D + 'pelicula.jpg', { ancho: 700, alto: 1000, despues: 'window.scrollTo(0, 0); true', espera: 18 })
console.log('listo')
