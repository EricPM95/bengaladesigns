// HOY3: vuelca a un archivo el viaje de Eric en Lanzarote (domingo 8-nov 08:25 → viernes 13-nov 19:40, Costa Teguise, coche de alquiler) tal como lo genera la app, para calcular su lista de avisos
// con el módulo puro SIN Chrome. Un solo Chrome, que se cierra al acabar. NO arranca ningún servidor (hacen falta el Vite 5173 y la API 8787 con DESTINOS_OCULTOS='-').
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/_hoy3_volcarRutaEric.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/_hoy3_ruta_eric.json')
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa' })
try {
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("(async () => { await window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }); return true })()")
  const volcado = await a.evaluar(`(async () => { const s = ${R}.getState(); return JSON.stringify({ route: s.route, reservations: s.reservations ?? [] }) })()`)
  fs.writeFileSync(SALIDA, volcado)
  console.log('Volcado:', SALIDA, Math.round(volcado.length / 1024), 'KB')
} finally {
  a.cerrar()
}
