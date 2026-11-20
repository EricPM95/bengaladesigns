// Capturas del panel nuevo (con la demo) para ponerlas al lado de las de Design: node scripts/destino/capturasPanelV35A.mjs [ids…]
//   ids: P1 P2 P2b P3 P4 P5 P5b M1 M2 M2b M4 M5 M6 (como los de Design). Salen en docs/dias/V35A_capturas/panel_<id>.jpg
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V35A_capturas'
fs.mkdirSync(CAP, { recursive: true })
const quiero = process.argv.slice(2)
const RUTA = (p) => `${p}?cuentas=on&logros=on&logrosDemo=1&apertura=0`
const esperar = async (a, js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const toque = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
const casos = [
  ['P1', '/admin', 1280, 840, async () => esperar(globalThis.__a, "Boolean(document.querySelector('[data-seccion=\"inicio\"] [data-donut]'))")],
  ['P2', '/admin/reportes', 1280, 800, async (a) => esperar(a, "Boolean(document.querySelector('[data-reporte]'))")],
  ['P2b', '/admin/reportes', 1280, 1000, async (a) => { await esperar(a, "Boolean(document.querySelector('[data-reporte=\"a1\"]'))"); await toque(a, '[data-reporte="a1"]'); return esperar(a, "Boolean(document.querySelector('[data-reporte-abierto]'))") }],
  ['P3', '/admin/fotos', 1280, 800, async (a) => esperar(a, "Boolean(document.querySelector('[data-seccion=\"fotos\"]'))")],
  ['P4', '/admin/destinos', 1280, 900, async (a) => esperar(a, "Boolean(document.querySelector('[data-pedido]'))")],
  ['P5', '/admin/ventas', 1280, 1110, async (a) => esperar(a, "Boolean(document.querySelector('[data-compra]'))")],
  ['P5b', '/admin/ventas', 1280, 1110, async (a) => { await esperar(a, "Boolean(document.querySelector('[data-compra]'))"); await toque(a, '[data-periodo=\"custom\"]'); return esperar(a, "Boolean(document.querySelector('[data-calendario]'))") }],
  ['M1', '/admin', 390, 1760, async (a) => esperar(a, "Boolean(document.querySelector('[data-seccion=\"inicio\"] [data-donut]'))")],
  ['M2', '/admin/reportes', 390, 844, async (a) => esperar(a, "Boolean(document.querySelector('[data-reporte]'))")],
  ['M2b', '/admin/reportes', 390, 1500, async (a) => { await esperar(a, "Boolean(document.querySelector('[data-reporte=\"a1\"]'))"); await toque(a, '[data-reporte="a1"]'); return esperar(a, "Boolean(document.querySelector('[data-reporte-abierto]'))") }],
  ['M4', '/admin/destinos', 390, 1650, async (a) => esperar(a, "Boolean(document.querySelector('[data-pedido]'))")],
  ['M5', '/admin/ventas', 390, 1760, async (a) => esperar(a, "Boolean(document.querySelector('[data-compra]'))")],
  ['M6', '/admin/fotos', 390, 1100, async (a) => esperar(a, "Boolean(document.querySelector('[data-seccion=\"fotos\"]'))")],
]
for (const [id, ruta, w, h, preparar] of casos) {
  if (quiero.length && !quiero.includes(id)) continue
  const a = await abrirApp(APP, { ruta: RUTA(ruta), ancho: w, alto: h, sinEsperarRoot: true, esperaFija: 5 })
  try {
    globalThis.__a = a
    await esperar(a, "Boolean(document.querySelector('[data-panel-jutrip]'))")
    const ok = await preparar(a)
    await a.esp(900)
    await a.captura(`${CAP}/panel_${id}.jpg`)
    console.log(id, ok ? 'ok' : 'SIN preparar')
  } finally {
    a.cerrar()
  }
}
