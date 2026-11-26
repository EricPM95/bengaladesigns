// V72 §1-2: SOLO capturas (no es una prueba) de la página del destino (P1, P2) y de la ficha en grande (F1-F5) en modo iPhone 390x844, con los datos del demo (Lanzarote y Roma). Un solo Chrome, se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV72_a.mjs lz4|lz7|roma
//   lz4: Lanzarote con 4 de 7 imprescindibles (P1, F1, F3/F3b)  ·  lz7: colección completa (F2/F2b)  ·  roma: sin empezar (P2, F4) y un logro de viajero (F5, F5b)
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V72_capturas')
fs.mkdirSync(CAP, { recursive: true })
const ESCENA = process.argv[2] ?? 'lz4'
// El reloj del navegador: el 27 nov 2026 (Lanzarote, día 2 de su viaje) o el 12 oct 2026 (Roma, día 3), para que «hoy» y [Cómo llegar] salgan como en un viaje en curso.
const FECHA = ESCENA === 'roma' ? '2026-10-12T10:00:00Z' : '2026-11-27T10:00:00Z'
const ANTES = `(() => { const R = Date; const off = new R('${FECHA}').getTime() - R.now(); class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off) } static now() { return R.now() + off } } window.Date = F })()`
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const run = (s) => a.evaluar('(async () => { ' + s + ' })()')
const PANT = "(await import('/src/components/logros/pantallas/useLogrosPantallas.ts')).useLogrosPantallas"
const SYNC = "(await import('/src/store/useSyncStore.ts')).useSyncStore"
const GAN = "(await import('/src/components/logros/pantallas/todos/api.ts')).useGanados"
const cap = async (nombre) => {
  await a.esp(5000)
  await a.captura(path.join(CAP, `${nombre}.jpg`))
  console.log('captura', nombre)
}
const clic = (texto) => ev(`(() => { const b = [...document.querySelectorAll('[data-pantalla-logros] button')].find((x) => (x.textContent || '').includes(${JSON.stringify(texto)}) && !x.getAttribute('aria-label')); b?.click(); return Boolean(b) })()`)
const cerrarFicha = () => ev("(() => { const b = document.querySelector('[data-ficha-grande]')?.querySelector('[data-cruz-de-hoja]'); b?.click(); return Boolean(b) })()")
const textoFicha = () => ev("(document.querySelector('[data-ficha-grande]')?.innerText ?? '(sin ficha)').split(String.fromCharCode(10)).join(' | ').slice(0, 600)")
try {
  for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__demoDestino === 'object' && typeof window.__demoGanados === 'object'").catch(() => false)); i++) await a.esp(500)
  if (ESCENA === 'roma') {
    await run("window.__demoDestino.modo('vacio'); window.__demoGanados.poner('vacio'); true")
    await ev(`${SYNC}.getState().setActiveTripId('demo-viaje')`)
    await ev(`${PANT}.getState().abrir({ t: 'destino', destino: 'roma' })`)
    await a.esp(2000)
    await cap('P2_app_roma')
    await clic('Plazas y fuentes')
    await a.esp(1500)
    console.log('F4:', await textoFicha())
    await cap('F4_app_roma')
    await cerrarFicha()
    await ev(`${PANT}.getState().cerrarTodo()`)
    // F5: un logro de viajero ya ganado (viajero «lleno»).
    await run("window.__demoDestino.modo('completo'); window.__demoGanados.poner('lleno'); true")
    await run(`await ${GAN}.getState().cargar(true)`)
    const clave = await ev(`${GAN}.getState().datos.items.find((i) => i.tipo === 'viajero' && i.def === 'dos_paises_en_un_dia')?.clave ?? ${GAN}.getState().datos.items.find((i) => i.tipo === 'viajero' && i.titulable)?.clave`)
    console.log('clave viajero', clave)
    await ev(`${PANT}.getState().abrir({ t: 'ficha', clave: ${JSON.stringify(clave)} })`)
    await a.esp(1500)
    console.log('F5:', await textoFicha())
    await cap('F5_app_roma')
  } else {
    await run(`window.__demoDestino.lanzarote(${ESCENA === 'lz7' ? 7 : 4}); window.__demoGanados.poner('lleno'); window.__demoDestino.lanzarote(${ESCENA === 'lz7' ? 7 : 4}); true`)
    await ev(`${SYNC}.getState().setActiveTripId('demo-viaje-lz')`)
    await run(`await ${GAN}.getState().cargar(true)`)
    await ev(`${PANT}.getState().abrir({ t: 'destino', destino: 'lanzarote' })`)
    await a.esp(2000)
    if (ESCENA === 'lz4') {
      await cap('P1_app_lanzarote')
      await run("document.querySelector('[data-pantalla-logros] main').scrollTo(0, 400); true")
      await cap('P1_app_lanzarote_abajo')
    }
    await clic('Los imprescindibles de Lanzarote')
    await a.esp(1500)
    console.log('coleccion:', await textoFicha())
    await cap(ESCENA === 'lz7' ? 'F2_app_lanzarote' : 'F1_app_lanzarote')
    if (ESCENA === 'lz4') {
      await run("document.querySelector('[data-ficha-grande] > div:nth-child(2)').scrollTo(0, 99999)")
      await cap('F1_app_lanzarote_abajo')
    }
    await cerrarFicha()
    await a.esp(600)
    await run("document.querySelector('[data-pantalla-logros] main').scrollTo(0, 0); true")
    console.log('antes medalla:', await ev("[...document.querySelectorAll('[data-pantalla-logros] button')].map((x) => (x.textContent || '').slice(0, 25)).slice(0, 6).join(' / ') + ' ficha:' + Boolean(document.querySelector('[data-ficha-grande]'))"))
    await clic('Medalla de Lanzarote')
    await a.esp(1500)
    console.log('medalla:', await textoFicha())
    await cap(ESCENA === 'lz7' ? 'F3_app_lanzarote_diamante' : 'F3_app_lanzarote')
  }
} finally {
  a.cerrar()
}
