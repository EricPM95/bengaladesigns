// V79 (apartados 1-2): SOLO capturas (no es una prueba) del «Resumen de tu viaje a Roma / Lanzarote» (VL7a, VL7b) en modo iPhone 390x844. Un solo Chrome, se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV79_a.mjs roma|lanza|pocos
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { ROMA, LANZAROTE, VIAJERO, pocosLogros } from './_datosV79_a.mjs'

const CAP = path.resolve('docs/dias/V79_capturas')
fs.mkdirSync(CAP, { recursive: true })
const ESCENA = process.argv[2] ?? 'roma'
const d = ESCENA === 'roma' ? ROMA : ESCENA === 'lanza' ? LANZAROTE : pocosLogros(LANZAROTE)
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const API = "(await import('/src/components/logros/momentos/api.ts'))"
const UI = "(await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI"
try {
  for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__momentos === 'object'").catch(() => false)); i++) await a.esp(500)
  await ev(`(${API}).datosDePrueba.estado = ${JSON.stringify(d.estado)}`)
  await ev(`(${API}).datosDePrueba.resumen = ${JSON.stringify(d.resumen)}`)
  await ev(`(${API}).datosDePruebaViajero.v = ${JSON.stringify(VIAJERO)}`)
  await ev("(await import('/src/store/useSyncStore.ts')).useSyncStore.getState().setActiveTripId('demo-viaje')")
  await ev(`${UI}.getState().abrirResumenViaje()`)
  await a.esp(5000)
  console.log('hay resumen:', await ev("Boolean(document.querySelector('[data-resumen-del-viaje]'))"))
  console.log(await ev("(document.querySelector('[data-resumen-del-viaje]')?.innerText ?? '').split(String.fromCharCode(10)).join(' | ').slice(0, 1200)"))
  await a.captura(path.join(CAP, `app_resumen_${ESCENA}_1.jpg`))
  const alto = await ev("document.querySelector('[data-resumen-del-viaje]').scrollHeight")
  for (let n = 2, y = 700; y < alto + 400 && n < 6; n++, y += 700) {
    await ev(`(() => { document.querySelector('[data-resumen-del-viaje]').scrollTo(0, ${y}); return true })()`)
    await a.esp(700)
    await a.captura(path.join(CAP, `app_resumen_${ESCENA}_${n}.jpg`))
  }
} finally {
  a.cerrar()
}
