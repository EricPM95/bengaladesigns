// Capturas 390x844 de la tanda LL (Lanzarote): los 6 días del viaje de Eric (llegada 08:25 el dom 8-nov, vuelta 19:40 el vie 13-nov, Costa Teguise, alquiler, con pase),
// un día de llegada de la fila C y otro de la fila F. Un Chrome por la cola; la API con DESTINOS_OCULTOS='-' y el Vite estable en 5173.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/_ll_lz_capturas.mjs
import fs from 'node:fs'
import path from 'node:path'
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
const informe = {}
try {
  const ev = (js) => a.evaluar(js)
  const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  for (let i = 0; i < 360 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  const cerrarHojas = async () => {
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
  }
  const escenarios = [
    { clave: 'eric', zona: 'costa_teguise', vuelos: { llegada: '08:25', vuelta: '19:40' }, dias: [1, 2, 3, 4, 5, 6] },
    { clave: 'filaC', zona: 'costa_teguise', vuelos: { llegada: '12:00', vuelta: '19:40' }, dias: [1] },
    { clave: 'filaF', zona: 'costa_teguise', vuelos: { llegada: '19:00', vuelta: '19:40' }, dias: [1, 2] },
  ]
  for (const e of escenarios.filter((x) => !process.env.SOLO || x.clave === process.env.SOLO)) {
    await ev(`window.__rutaLanzarote({ zona: '${e.zona}', coche: 'alquiler', vuelos: ${JSON.stringify(e.vuelos)} }).then(() => true)`)
    await a.esp(3500)
    await cerrarHojas()
    const resumen = await R("return route().days.map((d) => ({ n: d.dayNumber, id: d.id, titulo: d.title, retorno: Boolean(d.isReturnLeg), paradas: d.stops.map((s) => `${s.suggestedTime ?? s.time ?? ''} ${s.name}`) }))")
    informe[e.clave] = resumen
    for (const n of e.dias) {
      await R(`const d = route().days.find((x) => x.dayNumber === ${n}); if (!d) return false; st().setMode('days'); st().setActiveDayId(d.id); return true`)
      await a.esp(2500)
      await cerrarHojas()
      await a.captura(path.join(SALIDA, `ll_lz_${e.clave}_dia${n}_1.jpg`))
    }
  }
} finally {
  fs.writeFileSync(process.env.SOLO ? 'docs/dias/_ll_lz_capturas_' + process.env.SOLO + '.json' : 'docs/dias/_ll_lz_capturas.json', JSON.stringify(informe, null, 1))
  await a.cerrar()
}
console.log(JSON.stringify(informe, null, 1).slice(0, 3000))
