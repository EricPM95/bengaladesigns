// Capturas de la V38 (iPhone 390x844) para el REPASO: antes y después de (2) el asa de los días, (3) el mapa de «Crear mi propio día» al cambiar de viaje (Roma → Lanzarote) y (4) los iconos de los puntos del mapa de Explorar.
//   FASE=antes|despues APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV38.mjs
// Ninguna parte toca el Supabase de producción (la red de seguridad de _enLaApp.mjs lo bloquea); viaje de pruebas de la app (__rutaPrueba / __rutaLanzarote).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const FASE = process.env.FASE === 'antes' ? 'antes' : 'despues'
const D = 'docs/dias/V38_capturas'
fs.mkdirSync(D, { recursive: true })
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
const R = (js) => a.evaluar(`(async () => { const imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; const R = await imp('/src/store/useRouteStore.ts'); const F = await imp('/src/store/useAddFlowStore.ts'); const st = () => R.useRouteStore.getState(); ${js} })()`)
const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^${texto}/.test((x.textContent || '').trim())); b?.click(); return Boolean(b) })()`)
const avisos = async () => {
  for (let i = 0; i < 6; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
}
try {
  // ── Roma ──
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  await avisos()
  await R("st().setMode('days'); return true")
  await a.esp(2500)
  await a.captura(`${D}/dias_asa_${FASE}.jpg`)
  await R("st().setMode('explore'); return true")
  await a.esp(2500)
  await clic('Atracciones')
  await a.esp(7000)
  await a.captura(`${D}/explorar_iconos_roma_${FASE}.jpg`)
  await a.evaluar("(() => { document.querySelector('button[aria-label=Cerrar], button[aria-label=Atrás], button[aria-label=Volver]')?.click(); return true })()")
  await a.esp(800)
  await R("st().setMode('days'); const id = st().route.days[1].id; F.useAddFlowStore.getState().openOwnDayFlow(id); return id")
  await a.esp(8000)
  await a.captura(`${D}/propio_mapa_roma_${FASE}.jpg`)
  await R('F.useAddFlowStore.getState().closeOwnDayFlow(); return true')
  await a.esp(800)
  // ── Lanzarote (en la MISMA página: el mapa compartido de Explorar ya estaba en Roma) ──
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)")
  await a.esp(3000)
  await avisos()
  await R("st().setMode('explore'); return true")
  await a.esp(2500)
  await clic('Playas y charcos')
  await a.esp(7000)
  await a.captura(`${D}/explorar_iconos_lanzarote_${FASE}.jpg`)
  await a.evaluar("(() => { document.querySelector('button[aria-label=Cerrar], button[aria-label=Atrás], button[aria-label=Volver]')?.click(); return true })()")
  await a.esp(800)
  await R("st().setMode('days'); const id = st().route.days[1].id; F.useAddFlowStore.getState().openOwnDayFlow(id); return id")
  await a.esp(8000)
  await a.captura(`${D}/propio_mapa_lanzarote_${FASE}.jpg`)
} finally {
  a.cerrar()
}
console.log('listo', FASE)
