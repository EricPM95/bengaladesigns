// V82: capturas de la app (demo, iPhone 390x844) de «Todos mis logros». Un Chrome, cerrado al acabar.
//   node scripts/destino/capturasV82_app.mjs [n1 fichas ...]
import path from 'node:path'
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
const CAP = path.resolve('docs/dias/V82_capturas')
fs.mkdirSync(CAP, { recursive: true })
const que = process.argv.slice(2)
const quiero = (k) => que.length === 0 || que.includes(k)
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
const abrir = (p) => a.evaluar(`import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().abrir(${JSON.stringify(p)}); return true })`)
const hoja = (c) => a.evaluar(`import('/src/components/logros/pantallas/todos/api.ts').then((m) => { m.useHojasDeLogros.getState().abrirFicha(${JSON.stringify(c)}); return true })`)
const cerrarHojas = () => a.evaluar("import('/src/components/logros/pantallas/todos/api.ts').then((m) => { m.useHojasDeLogros.getState().cerrarFicha(); return true })")
const sc = (y) => a.evaluar(`(() => { const e = document.querySelector('[data-todos]'); if (e) e.scrollTo(0, ${y === -1 ? 'e.scrollHeight' : y}); return true })()`)
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__momentos === 'object'").catch(() => false)); i++) await a.esp(500)
  await abrir({ t: 'todos', pestana: 'todos' })
  await a.esp(4500)
  if (quiero('n1')) {
    for (const [n, y] of [['arriba', 0], ['medio', 1000], ['abajo', -1]]) {
      await sc(y)
      await a.esp(900)
      await a.captura(path.join(CAP, `N1_${n}_app.jpg`))
    }
  }
  if (quiero('n3')) {
    await abrir({ t: 'mi_coleccion', grupo: 'tiempo' })
    await a.esp(3500)
    await a.captura(path.join(CAP, 'N3_app.jpg'))
    await a.evaluar("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().volver(); return true })")
    await a.esp(500)
  }
  if (quiero('destinos')) {
    await a.evaluar("window.__demoDestino?.modo?.('parcial'); import('/src/lib/logrosDemo_ganados.ts').then((m) => { m.ponerLanzarote(4); return true })")
    await a.evaluar("import('/src/components/logros/pantallas/todos/api.ts').then((m) => m.useGanados.getState().cargar(true)).then(() => true)")
    await abrir({ t: 'destino', destino: 'lanzarote' })
    await a.esp(3500)
    await a.captura(path.join(CAP, 'D1_app.jpg'))
    await a.evaluar("document.querySelector('[data-colecciones-del-destino]')?.scrollIntoView({ block: 'start' }); true")
    await a.esp(700)
    await a.captura(path.join(CAP, 'D1_colecciones_app.jpg'))
    await hoja('coleccion:lanzarote:lz_imprescindibles')
    await a.esp(2500)
    await a.captura(path.join(CAP, 'F1_app.jpg'))
    await cerrarHojas()
    await hoja('sello:lanzarote:lanzarote')
    await a.esp(2500)
    await a.captura(path.join(CAP, 'F3_app.jpg'))
    await cerrarHojas()
    await a.evaluar("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().volver(); return true })")
    await a.evaluar("window.__demoDestino?.modo?.('vacio'); import('/src/lib/logrosDemo_ganados.ts').then((m) => { m.ponerEscenario('vacio'); return true })")
    await abrir({ t: 'destino', destino: 'roma' })
    await a.esp(3500)
    await a.captura(path.join(CAP, 'D2_app.jpg'))
    await a.evaluar("document.querySelector('[data-colecciones-del-destino]')?.scrollIntoView({ block: 'start' }); true")
    await a.esp(700)
    await a.captura(path.join(CAP, 'D2_colecciones_app.jpg'))
  }
  if (quiero('fichas')) {
    const claves = JSON.parse(await a.evaluar("import('/src/components/logros/pantallas/todos/api.ts').then((m) => JSON.stringify(m.useGanados.getState().datos?.items.map((i) => i.clave + '|' + i.tipo)))"))
    console.log(claves.join('\n'))
  }
} finally {
  a.cerrar()
}
process.exit(0)
