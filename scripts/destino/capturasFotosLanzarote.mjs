// Las capturas de móvil del REPASO de las fotos de Lanzarote: DÍAS del martes 10 y del jueves 12 del viaje de Eric, de arriba abajo. Necesita Vite 5173 y API 8787 con DESTINOS_OCULTOS='-'.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasFotosLanzarote.mjs
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', ancho: 390, alto: 844 })
const ev = (js) => a.evaluar(js)
try {
  for (let i = 0; i < 60 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)")
  for (let i = 0; i < 5; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(500)
  }
  for (const [nombre, indice] of [['martes10', 2], ['jueves12', 4]]) {
    await ev(`(() => { const s = window.__ruta.getState(); s.setMode('days'); s.setActiveDayId(s.route.days[${indice}].id); return true })()`)
    await a.esp(3500)
    // Las fotos se piden una a una: se espera a que no quede ninguna cargando.
    for (let i = 0; i < 20; i++) {
      await a.esp(500)
      if (!(await ev("Array.from(document.querySelectorAll('img')).some((i) => !i.complete)"))) break
    }
    for (let n = 1; n <= 3; n++) {
      await a.captura(path.join(SALIDA, `fotos_lz_${nombre}_${n}.jpg`))
      await ev(`(() => { const nombre = window.__ruta.getState().route.days[${indice}].stops[0].name; const e = Array.from(document.querySelectorAll('span,p,h2,h3,div')).find((x) => x.children.length === 0 && x.textContent.trim() === nombre); let sc = e?.parentElement; while (sc && sc.scrollHeight <= sc.clientHeight + 2) sc = sc.parentElement; (sc ?? document.scrollingElement).scrollBy(0, 330); return Boolean(sc) })()`)
      await a.esp(1200)
    }
  }
} finally {
  a.cerrar()
}
