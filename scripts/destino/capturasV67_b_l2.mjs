// V67 (apartado 3, L2): SOLO mira el día de llegada de Lanzarote (aterriza 9:30, vuelta 18:05, Costa Teguise, domingo 8-nov-2026). No es una prueba.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV67_b_l2.mjs [antes|despues]   (la API con DESTINOS_OCULTOS='-')
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const CAP = path.resolve('docs/dias/V67_capturas')
fs.mkdirSync(CAP, { recursive: true })
const ETIQ = process.argv[2] ?? 'antes'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=completa', ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true)")
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(4000)
  const dias = await ev(`JSON.stringify(${R}.getState().route.days.slice(0, 2))`)
  const txt = JSON.parse(dias).map((d) => `DIA ${d.dayNumber} ${d.date ?? ''} ${d.title ?? ''}\n` + (d.stops ?? []).map((s) => `  ${s.time ?? ''} ${s.name} (${s.durationMinutes ?? ''})`).join('\n') + `\n  comidas: ${JSON.stringify((d.meals ?? []).map((m) => [m.time, m.suggested_time, m.zone_display]))}\n  llegada_ll: ${JSON.stringify(d.llegada_ll ?? null)}\n  llegada_aeropuerto: ${JSON.stringify(d.llegada_aeropuerto ?? null)}\n  avisos: ${JSON.stringify(d.avisos ?? null)}`).join('\n')
  fs.writeFileSync(path.join(CAP, `L2_${ETIQ}.txt`), txt)
  console.log(txt)
  await ev(`${R}.getState().setMode('explore')`)
  await a.captura(path.join(CAP, `L2_${ETIQ}.jpg`))
} finally { a.cerrar() }
process.exit(0)
