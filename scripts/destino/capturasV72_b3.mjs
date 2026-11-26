// V72 §3: capturas (no es una prueba) en modo iPhone 390x844 de «Todos mis logros» (L1, L2) con el viajero de demostración (Roma) y una tarjeta de Lanzarote. Un Chrome, se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV72_b3.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V72_capturas')
fs.mkdirSync(CAP, { recursive: true })
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__momentos === 'object'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().abrir({ t: 'todos', pestana: 'todos' }); return true })")
  await a.esp(2500)
  // Una tarjeta de Lanzarote al lado de la de Roma (copia de la de Roma con su nombre: las tarjetas de destino no se tocan).
  await a.evaluar("import('/src/components/logros/pantallas/todos/api.ts').then((m) => { const g = m.useGanados.getState().datos; if (g && !g.por_destino.some((d) => d.destino === 'lanzarote')) m.useGanados.getState().poner({ ...g, por_destino: [...g.por_destino, { ...g.por_destino[0], destino: 'lanzarote', ciudad: 'Lanzarote', pais: 'España' }] }); return true })")
  await a.esp(1500)
  const main = "document.querySelector('[data-todos]')"
  const alto = Number(await a.evaluar(`${main}.scrollHeight`))
  console.log('alto', alto)
  const info = await a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('[data-tarjeta-de-viajero]')).slice(0, 40).map((b) => { const r = b.getBoundingClientRect(); const n = b.querySelector('span:last-of-type'); const m = b.querySelector('[data-medalla-de-viajero]').getBoundingClientRect(); return [b.dataset.fila, Math.round(r.width), Math.round(r.height), Math.round(m.width), Boolean(b.querySelector('[data-avance-de-viajero]')), b.querySelector('[data-pin-vitrina]')?.dataset.pinVitrina ?? '-'].join('/') }))`)
  console.log(info)
  const pasos = [['L1_arriba', 0], ['L1_mundo_tiempo', 520], ['L1_como_viajas', 900], ['L1_coleccionista_maravillas', 1300], ['L1_exclusivos', alto]]
  for (const [nombre, y] of pasos) {
    await a.evaluar(`${main}.scrollTo(0, ${y}); true`)
    await a.esp(700)
    await a.captura(path.join(CAP, `app_${nombre}.jpg`))
  }
  // L2: el grupo «El tiempo» (sin ganar) arriba.
  await a.evaluar(`(() => { const g = document.querySelector('[data-grupo="tiempo"]'); ${main}.scrollTo(0, g.offsetTop - 60); return true })()`)
  await a.esp(700)
  await a.captura(path.join(CAP, 'app_L2_el_tiempo.jpg'))
  // Un recorte a la derecha del grupo «El tiempo»: las tarjetas que siguen.
  await a.evaluar("(() => { const f = document.querySelector('[data-grupo=\"tiempo\"] .vt-oculto'); f.scrollTo(f.scrollWidth, 0); return true })()")
  await a.esp(600)
  await a.captura(path.join(CAP, 'app_L2_el_tiempo_final.jpg'))
} finally {
  a.cerrar()
}
