// V72 §1-2: captura «Ficha Logros en Grande» de Design (la parte de las fichas, bajando la página) para ponerla al lado de la app.
import { capturarDesign } from './capturaDesign.mjs'
for (const [n, y] of [[2, 2330], [3, 3500]]) {
  const ok = await capturarDesign('Ficha Logros en Grande.dc.html', `docs/dias/V72_capturas/design_fichas_${n}.jpg`, { ancho: 1480, alto: 1300, despues: `window.scrollTo(0, ${y})` })
  console.log('design', n, ok)
}
