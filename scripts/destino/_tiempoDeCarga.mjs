// (Arreglo 6-nov, §3) Mide cuánto tarda «Trazando tu ruta…» y a dónde se va el tiempo, llamada a llamada (/api/...). Lanzarote vs Roma. Necesita Vite 5173 y API 8787 con DESTINOS_OCULTOS='-'.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/_tiempoDeCarga.mjs [lanzarote|roma]
import { abrirApp } from './_enLaApp.mjs'
const cual = process.argv[2] ?? 'lanzarote'
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa' })
try {
  const fn = cual === 'roma' ? '__rutaPrueba' : '__rutaLanzarote'
  for (let i = 0; i < 60 && !(await a.evaluar(`typeof window.${fn} === 'function'`).catch(() => false)); i++) await a.esp(500)
  const js = `(async () => {
    performance.clearResourceTimings()
    const t0 = performance.now()
    await window.${fn}(${cual === 'roma' ? '' : "{ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }"})
    const total = Math.round(performance.now() - t0)
    const llamadas = performance.getEntriesByType('resource').filter((e) => e.name.includes('/api/')).map((e) => ({ ruta: '/api/' + e.name.split('/api/')[1].slice(0, 60), ini: Math.round(e.startTime - t0), ms: Math.round(e.duration) }))
    return JSON.stringify({ total, llamadas })
  })()`
  const r = await a.evaluar(js)
  const { total, llamadas } = JSON.parse(r)
  console.log(`${cual}: TOTAL ${total} ms · ${llamadas.length} llamadas a /api`)
  const por = {}
  for (const l of llamadas) { const k = l.ruta.split('?')[0]; por[k] ??= { n: 0, ms: 0, max: 0 }; por[k].n++; por[k].ms += l.ms; por[k].max = Math.max(por[k].max, l.ms) }
  for (const [k, v] of Object.entries(por).sort((x, y) => y[1].ms - x[1].ms)) console.log(`  ${String(v.ms).padStart(6)} ms  ×${String(v.n).padStart(2)}  (la más lenta ${v.max} ms)  ${k}`)
} finally {
  a.cerrar()
}
