// Capturas de la pantalla de entrada (V39C): node scripts/destino/_conCola.mjs node scripts/destino/capturasV39C.mjs
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
const dir = 'docs/dias/V39C_capturas'
fs.mkdirSync(dir, { recursive: true })
const app = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off', escala: 2 })
const abrir = async (id) => { await app.evaluar(`import('/src/dev/escaparate.ts').then(() => { window.__escaparate.cerrar?.('c3-A1'); window.__escaparate.abrir('${id}') })`); await app.esp(5000) }
const foto = async (n) => { const r = await app.cdp('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${dir}/${n}.png`, Buffer.from(r.result.data, 'base64')) }
try {
  await abrir('c3-A1'); await foto('A1')
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); await app.esp(800); await foto('A1_reducir_movimiento')
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await app.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 600, deviceScaleFactor: 2, mobile: true }); await app.esp(800); await foto('A1_pantalla_baja')
  await app.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await abrir('c3-A2'); await foto('A2')
  await abrir('c3-A3'); await foto('A3')
} finally { app.cerrar() }
