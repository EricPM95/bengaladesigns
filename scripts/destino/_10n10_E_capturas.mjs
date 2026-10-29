// Capturas a mano de la lista del pase (Tanda 10N10, agente E): 390 x 844, sin pase, con pase y con «¿Cuántos sois?» abierta, y la de Design (Piezas/Pase Pelicula, escena 7) al lado.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/_10n10_E_capturas.mjs
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, abrirPase, esp, cuando } from './_10n5_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const SAL = path.resolve('docs/dias/capturas_jutrip')
const foto = (n) => path.join(SAL, `10n10_lista_pase_${n}.jpg`)
const LISTO = "/Elegir mi pase|está activo/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')"

for (const [version, nombre] of [['gratis', 'sin_pase'], ['pago', 'con_pase']]) {
  const a = await conViaje({ ancho: 390, alto: 844, version, extraAntes: version === 'pago' ? 'window.__pruebaDelPase = { cobro: true, conPase: true, puede: true, pruebaGastada: false };' : '' })
  try {
    await abrirPase(a)
    console.log(nombre, await cuando(a, LISTO, 160))
    await esp(2500)
    await a.captura(foto(nombre))
    // la lista, desplazada hasta el final (la última fila se ve entera)
    await a.evaluar("(() => { const l = document.querySelector('[data-lista-pase]'); if (l) l.scrollTop = l.scrollHeight; return true })()")
    await esp(600)
    await a.captura(foto(`${nombre}_final_de_lista`))
    if (nombre === 'sin_pase') {
      await a.evaluar("(() => { const l = document.querySelector('[data-lista-pase]'); if (l) l.scrollTop = 0; const e = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((x) => x.children.length === 0 && x.textContent.trim() === 'Elegir mi pase'); if (e) e.click(); return true })()")
      await esp(1800)
      await a.captura(foto('cuantos_sois'))
    }
  } finally {
    a.cerrar()
  }
}

// Design: la escena 7 (copia temporal de la pieza con la escena 7 por defecto; se espera a que acabe su animación).
const orig = path.resolve('docs/diseno/proyecto/Piezas/Pase Pelicula.dc.html')
const tmp = path.resolve('docs/diseno/proyecto/Piezas/_tmp_e_lista.dc.html')
try {
  let s = fs.readFileSync(orig, 'utf8')
  s = s.replace('"scene":{"editor":"int","default":0,', '"scene":{"editor":"int","default":7,')
  fs.writeFileSync(tmp, s)
  await capturarDesign('Piezas/_tmp_e_lista.dc.html', foto('design_escena7'), { ancho: 390, alto: 844, espera: 18 })
} catch (e) {
  console.log('(No se pudo capturar Design:', e.message, ')')
} finally {
  fs.rmSync(tmp, { force: true })
}
console.log('listo')
