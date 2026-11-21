// Capturas de la V37 para el REPASO: (1) las medallas con su texto nuevo («TU MEDALLA DE ROMA · BRONCE», …) dentro del marco de iPhone del estudio de sonidos; (2) la hoja «Borrar mi cuenta» de Ajustes (390 px).
//   mkdir .chrome.lock → APP_URL=http://localhost:5173 node scripts/destino/capturasV37.mjs → rmdir .chrome.lock   (o con scripts/destino/_conCola.mjs)
// Ninguna parte toca el Supabase de producción: modo demo de los logros (?logrosDemo=1), cuenta de mentira.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const D = 'docs/dias/V37_capturas'
fs.mkdirSync(D, { recursive: true })
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const toque = async (a, sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
const textos = {}

/* 1. Medallas en el marco del estudio */
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
const adm = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0', ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
try {
  await esperar(adm, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20")
  await esperar(adm, "Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)", 160)
  for (const id of ['medalla_bronce', 'medalla_oro']) {
    await toque(adm, `[data-animacion-tarjeta="${id}"]`)
    await esperar(adm, `document.querySelector('[data-visor-iframe]').contentDocument.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') === '${id}'`, 60)
    await adm.esp(1900)
    textos[id] = await adm.evaluar("(document.querySelector('[data-visor-iframe]').contentDocument.querySelector('[data-visor-de-animacion]')?.innerText ?? '').replace(/\\s+/g, ' ').trim()")
    await adm.evaluar("document.querySelector('[data-marco-iphone]').scrollIntoView({ block: 'center' }); true")
    await adm.esp(300)
    await adm.captura(`${D}/${id}.jpg`)
  }
} finally {
  adm.cerrar()
}

/* 2. La hoja «Borrar mi cuenta» en el móvil (390 px): como administrador (la demo lo es) y como una persona normal (se simula que el servidor dice «no es administrador») */
const NO_ADMIN = "window.sessionStorage.setItem('trazo:demo-no-admin', '1');" // (el interruptor de la demo: el servidor de mentira dice «no es administrador»)
for (const [nombre, antes] of [['administrador', undefined], ['normal', NO_ADMIN]]) {
  const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', antes })
  try {
    for (let i = 0; i < 120 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
    await app.evaluar("window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; true")
    await app.evaluar("__imp('/src/store/useAjustesUi.ts').then((m) => { m.useAjustesUi.getState().abrir('ajustes'); return true })")
    await esperar(app, "Boolean(document.querySelector('[data-borrar-cuenta]'))", 60)
    await app.esp(1500)
    await toque(app, '[data-borrar-cuenta]')
    await esperar(app, "Boolean(document.querySelector('[data-borrar-dialogo]'))", 40)
    await app.esp(500)
    textos['hoja_' + nombre] = await app.evaluar("document.querySelector('[data-borrar-dialogo]')?.innerText.replace(/\\s+/g, ' ').trim()")
    await app.captura(`${D}/borrar_cuenta_${nombre}.jpg`)
    if (nombre === 'normal') {
      textos.botonApagadoAntes = await app.evaluar("document.querySelector('[data-confirmar-borrar]')?.disabled ?? 'sin botón'")
      await app.evaluar("(() => { const i = document.querySelector('[data-borrar-palabra]'); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(i, 'BORRAR'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
      await app.esp(400)
      textos.botonApagadoDespues = await app.evaluar("document.querySelector('[data-confirmar-borrar]')?.disabled ?? 'sin botón'")
      await app.captura(`${D}/borrar_cuenta_escrito.jpg`)
    }
  } finally {
    app.cerrar()
  }
}
fs.writeFileSync(`${D}/textos.json`, JSON.stringify(textos, null, 2))
console.log(JSON.stringify(textos, null, 2))
