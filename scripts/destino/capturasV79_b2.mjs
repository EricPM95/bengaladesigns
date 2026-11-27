// V79 §3: «Todos mis logros» (viajero de demostración) y el dibujo VL7 de Design, a 390x844. Un Chrome cada vez, cerrado al acabar.
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V79_capturas')
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__momentos === 'object'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().abrir({ t: 'todos', pestana: 'todos' }); return true })")
  await a.esp(5000)
  await a.evaluar("document.querySelector('[data-todos]')?.scrollTo(0, 99999); true")
  await a.esp(1200)
  await a.captura(path.join(CAP, 'v79_todos_abajo.jpg'))
  await a.evaluar("document.querySelector('[data-todos]')?.scrollTo(0, 0); true")
  await a.esp(800)
  await a.captura(path.join(CAP, 'v79_todos.jpg'))
} finally {
  a.cerrar()
}
console.log('design VL7:', await capturarDesign('La vuelta en HOY.dc.html', path.join(CAP, 'design_VL7.jpg'), { ancho: 390, alto: 844 }))
