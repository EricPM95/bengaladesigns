// V55: comprobación (no es una prueba) de la rueda de la hora en un Chrome de iPhone: monta la pieza REAL `CampoDeHora` (la que usan TimeField y todas las hojas) y mira qué guarda al pulsar ✓ sin mover la rueda y al tocar fuera.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV55_rueda.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V55_capturas')
fs.mkdirSync(CAP, { recursive: true })
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&version=pago', ancho: 390, alto: 844 })
try {
  await a.evaluar(`(async () => {
    const reactM = await import('/node_modules/.vite/deps/react.js'); const React = reactM.default ?? reactM
    const rdc = await import('/node_modules/.vite/deps/react-dom_client.js'); const createRoot = rdc.createRoot ?? rdc.default?.createRoot
    const { CampoDeHora } = await import('/src/components/ui/HojaDeHora.tsx')
    const { TimeField } = await import('/src/components/ui/TimeField.tsx')
    window.__guardado = []
    const cont = document.createElement('div'); cont.id = 'v55-rueda'; cont.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10;background:#fff;padding:20px;display:flex;flex-direction:column;gap:12px'
    document.body.appendChild(cont)
    const E = React.createElement
    const Demo = () => {
      const [v1, setV1] = React.useState(null); const [v2, setV2] = React.useState('09:15'); const [v3, setV3] = React.useState('')
      return E('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        E('div', { 'data-demo': 'vacio' }, E(CampoDeHora, { valor: v1, onChange: (h) => { window.__guardado.push(['vacio', h]); setV1(h) }, titulo: 'Hora de vuelo', ejemplo: '08:30' })),
        E('div', { 'data-demo': 'con-hora' }, E(CampoDeHora, { valor: v2, onChange: (h) => { window.__guardado.push(['con-hora', h]); setV2(h) }, titulo: 'Hora con valor', ejemplo: '08:30' })),
        E('div', { 'data-demo': 'timefield' }, E(TimeField, { value: v3, onChange: (h) => { window.__guardado.push(['timefield', h]); setV3(h) }, title: 'Hora de entrada', placeholder: 'Elige la hora' })),
        E('div', { 'data-demo': 'lista' }, E(TimeField, { value: '', onChange: (h) => { window.__guardado.push(['lista', h]) }, title: 'Hora de la entrada', options: ['09:00', '10:30', '12:00'] })))
    }
    createRoot(cont).render(E(Demo))
    return true })()`)
  await a.esp(1500)
  const clic = (sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
  const log = () => a.evaluar('JSON.stringify(window.__guardado)')
  // 1. Vacía (hora gris 08:30): abrir la rueda y pulsar ✓ SIN moverla
  await clic('[data-demo="vacio"] [data-campo-de-hora]')
  await a.esp(900)
  await a.captura(path.join(CAP, 'rueda_vacia_abierta_despues.jpg'))
  await clic('[data-hoja-de-hora-guardar]')
  await a.esp(600)
  console.log('1 vacía + ✓ sin mover →', await log(), '| casilla:', await a.evaluar("document.querySelector('[data-demo=vacio] [data-campo-de-hora-texto]')?.textContent"))
  // 2. Con hora 09:15: ✓ sin mover guarda 09:15
  await clic('[data-demo="con-hora"] [data-campo-de-hora]')
  await a.esp(700)
  await clic('[data-hoja-de-hora-guardar]')
  await a.esp(500)
  console.log('2 con 09:15 + ✓ →', await log())
  // 3. Tocar fuera: no guarda (con la casilla vacía de TimeField)
  await clic('[data-demo="timefield"] [data-time-field]')
  await a.esp(700)
  await clic('[data-hoja-de-hora-fondo]')
  await a.esp(500)
  console.log('3 TimeField vacío + tocar fuera →', await log(), '| casilla vacía:', await a.evaluar("document.querySelector('[data-demo=timefield] [data-time-field]')?.getAttribute('data-vacia')"))
  // 4. TimeField vacío + ✓ sin mover: guarda la que se ve (09:00 de partida)
  await clic('[data-demo="timefield"] [data-time-field]')
  await a.esp(700)
  await clic('[data-hoja-de-hora-guardar]')
  await a.esp(500)
  console.log('4 TimeField vacío + ✓ sin mover →', await log())
  // 5. Con lista de horas: ✓ sin mover guarda la primera que se ve
  await clic('[data-demo="lista"] [data-time-field]')
  await a.esp(700)
  await a.captura(path.join(CAP, 'rueda_lista_abierta_despues.jpg'))
  await clic('[data-hoja-de-hora-guardar]')
  await a.esp(500)
  console.log('5 lista de horas + ✓ sin mover →', await log())
  // 6. Tocar fuera con la casilla vacía de «vacio» ya llena: no cambia
  console.log('6 Escape →', await a.evaluar("(async () => { document.querySelector('[data-demo=con-hora] [data-campo-de-hora]')?.click(); await new Promise((r) => setTimeout(r, 500)); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await new Promise((r) => setTimeout(r, 400)); return JSON.stringify({ guardado: window.__guardado.length, hojaAbierta: Boolean(document.querySelector('[data-hoja-de-hora]')) }) })()"))
} finally {
  a.cerrar()
}
