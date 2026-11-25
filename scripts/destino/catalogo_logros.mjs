// CATALOGO · los logros: las series de momentos (pedazo, emblema, sello, país, «Y además…», medalla, EXP, subir de nivel). Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/catalogo_logros.mjs [serie ...]
import { abrir, anotar, foto, nada } from './catalogo_comun.mjs'

const quiero = new Set(process.argv.slice(2))
const SERIES = [
  ['coliseo', 'serieColiseo', 'La serie del Coliseo como primer sitio'],
  ['fila', 'serieFila', 'Dos pedazos y subida de nivel (con EXP)'],
  ['petra', 'serieSegundaMaravilla', 'La medalla de maravilla y «Y además…»'],
  ['final7', 'serieFinal7', 'El final de las 7 maravillas'],
  ['viajeros', 'serieViajeros', 'Logros de viajero'],
]
const limpio = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)
const hojas = async (a) => JSON.parse(await a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('[role=dialog]')).map((d) => ({ n: d.getAttribute('aria-label'), t: (d.innerText || '').replace(/\\s+/g, ' ').slice(0, 220) })))`))

for (const [clave, fn, desc] of SERIES) {
  if (quiero.size && !quiero.has(clave)) continue
  const c = await abrir()
  const { a } = c
  try {
    await a.evaluar('window.__momentos.cerrar(); true')
    await a.evaluar(`window.__momentos.${fn}(); true`)
    await a.esp(2500)
    for (let n = 1; n <= 14; n++) {
      let ds = await hojas(a)
      for (let k = 0; k < 16 && ds.length === 0; k++) {
        await a.esp(500)
        ds = await hojas(a)
      }
      const d = ds[ds.length - 1]
      if (!d) {
        console.log(clave, 'sin más pantallas tras', n - 1)
        break
      }
      await a.esp(7500) // que acabe la animación y salga [Seguir]
      await foto(a, `logros_${clave}_${String(n).padStart(2, '0')}_${limpio(d.n)}`, { serie: clave, aria: d.n, texto: d.t })
      // «Seguir» (o el botón principal de la pantalla)
      const ok = await a.evaluar(`(() => { const ds = Array.from(document.querySelectorAll('[role=dialog]')); const d = ds[ds.length - 1]; const b = Array.from(d.querySelectorAll('button')).find((x) => /^(Seguir|Continuar|Listo|Cerrar|Vale|Entendido)$/.test((x.textContent || '').trim())); if (b) { b.click(); return 'boton' } d.click(); return 'toque' })()`)
      await a.esp(1500)
    }
  } catch (e) {
    console.log('FALLO en', clave, e.message)
    anotar(`logros_${clave}_error`, { ok: false, motivo: e.message })
  } finally {
    a.cerrar()
  }
}
console.log('logros hecho')
