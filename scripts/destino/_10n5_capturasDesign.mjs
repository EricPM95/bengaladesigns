// Captura UNA pantalla de una pieza de Design (la n-ésima de `Piezas/X.dc.html`) a 390 x 844, para ponerla al lado de la de la app (Tanda 10N5).
//   import { capturarPantallaDeDesign } from './_10n5_capturasDesign.mjs'
//   await capturarPantallaDeDesign('Piezas/Perfil Orden.dc.html', 0, 'docs/dias/capturas_jutrip/10n5_design_perfil_01.jpg')
import { capturarDesign } from './capturaDesign.mjs'

export function capturarPantallaDeDesign(pieza, n, salida, { alto = 844, espera = 7 } = {}) {
  const js = `(() => {
    const marcos = Array.from(document.querySelectorAll('div')).filter((d) => { const r = d.getBoundingClientRect(); return Math.round(r.width) === 390 && r.height > 800 && getComputedStyle(d).borderRadius === '44px' })
    const m = marcos[${n}]
    if (!m) return 'sin marco ' + marcos.length
    // La pantalla se pone fija en la esquina de arriba a la izquierda, tapando todo lo demás, y sin el marco negro del teléfono.
    m.style.cssText += ';position:fixed;left:0;top:0;z-index:99999;border-radius:0;box-shadow:none'
    return marcos.length
  })()`
  return capturarDesign(pieza, salida, { ancho: 390, alto, despues: js, espera })
}
