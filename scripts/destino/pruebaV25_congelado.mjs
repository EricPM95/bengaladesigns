// La prueba del fallo «logros congelados» (19-nov, Eric y Alicia en Lanzarote): una parte de logros que falla al cargar ya no deja todo lo de logros muerto hasta cerrar la app.
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV25_congelado.mjs     (Vite en 5173; demo de logros, ninguna llamada a producción)
//  1. Código   2. Una pieza de logros que se rompe: avisa con [Reintentar], el resto de la app sigue y, al reintentar, logros vuelve   3. La hoja con una respuesta que no llega: «No se ha podido cargar, vuelve a probar» y [Reintentar]
//  4. Abrir logros → [Yo también estaba] → cerrar → volver a abrir, 5 veces seguidas, en tamaño de iPhone
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { conLimite, esFalloDeCargaDeParte } from '../../src/lib/cargaSegura.ts'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V25_capturas'
fs.mkdirSync(CAP, { recursive: true })

console.log('1. El código')
{
  debe(esFalloDeCargaDeParte(new Error('Failed to fetch dynamically imported module: https://x/assets/HojaLogros-abc.js')) && esFalloDeCargaDeParte(new TypeError('Importing a module script failed.')) && !esFalloDeCargaDeParte(new Error('x is undefined')), 'detectar', 'se reconoce un archivo que ya no existe (versión nueva) y no se confunde con un fallo de dibujado')
  debe((await conLimite(new Promise(() => undefined), 40, 'tope')) === 'tope' && (await conLimite(Promise.resolve('ok'), 1000, 'tope')) === 'ok' && (await conLimite(Promise.reject(new Error('x')), 1000, 'tope')) === 'tope', 'tope', 'una espera sin fin acaba en el tope; una respuesta normal, no se toca')
  const logros = leer('src/lib/logros.ts')
  debe((logros.match(/signal: control\.signal/g) ?? []).length === 2 && /TOPE_RESPUESTA_MS = 15000/.test(logros) && /conLimite\(Promise\.resolve\(supabase\?\.auth\.getSession\(\)\)/.test(logros), 'tiempo', 'las llamadas de logros llevan tope de tiempo (la sesión 8 s, la respuesta 15 s)')
  debe(/conLimite\(\s*\(async/.test(leer('src/components/logros/momentos/api.ts')), 'tiempo', 'la petición del estado no deja una promesa colgada en `enVuelo`')
  const app = leer('src/App.tsx')
  debe(/PiezaSegura nombre="MomentosHost" reintentable/.test(app) && /PiezaSegura nombre="PantallasHost" reintentable/.test(app), 'pieza', 'los anfitriones de logros no se quedan muertos al fallar (reintentable)')
  const lazies = ['src/components/logros/momentos/MomentosHost.tsx', 'src/components/logros/momentos/ExpHost.tsx', 'src/components/logros/momentos/HojaLogros.tsx', 'src/components/logros/pantallas/PantallasHost.tsx'].map(leer).join('\n')
  debe(!/\blazy\(/.test(lazies) && /lazyReintentable/.test(lazies), 'lazy', 'las partes perezosas de logros se pueden reintentar (React.lazy se acuerda del primer fallo para siempre)')
  const principal = leer('src/main.tsx') + leer('src/components/PiezaSegura.tsx')
  debe(/vite:preloadError/.test(principal) && /avisarVersionNueva/.test(principal) && !/location\.reload/.test(principal) && !/recargarUnaVez/.test(principal), 'version', 'con una versión nueva publicada, la app NO se recarga sola: avisa («Hay una versión nueva · [Actualizar]»)')
  const cs = leer('src/lib/cargaSegura.ts')
  debe((cs.match(/location\.reload/g) ?? []).length === 1 && /export function actualizarAhora/.test(cs), 'version', 'el único sitio que recarga es [Actualizar] (actualizarAhora)')
}

async function iniciar(ruta, extra = '', antes = undefined) {
  const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta, antes })
  const ev = (js) => app.evaluar(js)
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  await ev(`window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; ${extra} true`)
  await ev('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await ev("__imp('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Empezar mi día)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await app.esp(700)
  }
  return { app, ev }
}
const hayHoja = async (ev, esp, ms = 6000) => {
  for (let t = 0; t < ms; t += 250) {
    if (await ev("Boolean(document.querySelector('[data-hoja-logros]'))")) return true
    await esp(250)
  }
  return false
}

console.log('2. Una pieza de logros se rompe')
{
  const { app, ev } = await iniciar('/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', '', "window.__pruebaFallo = 'MomentosHost'")
  try {
    for (let i = 0; i < 20 && !(await ev("Boolean(document.querySelector('[data-pieza-fallida=\"MomentosHost\"]'))")); i++) await app.esp(250)
    const aviso = await ev("document.querySelector('[data-pieza-fallida=\"MomentosHost\"]')?.innerText ?? ''")
    debe(/No se ha podido cargar, vuelve a probar\./.test(aviso) && /Reintentar/.test(aviso), 'aviso', `una pieza de logros que se rompe dice «No se ha podido cargar, vuelve a probar.» con [Reintentar] (${aviso.replace(/\n/g, ' ')})`)
    debe(await ev("Boolean(document.querySelector('nav, [role=tablist], button'))"), 'resto', 'el resto de la app sigue ahí')
    await app.captura(`${CAP}/congelado_aviso.jpg`)
    await ev("window.__pruebaFallo = ''; document.querySelector('[data-reintentar-pieza]').click(); true")
    await app.esp(1200)
    debe(!(await ev("Boolean(document.querySelector('[data-pieza-fallida]'))")), 'reintentar', 'al tocar [Reintentar] el aviso se va')
    await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().abrirHojaLogros(); return true })")
    debe(await hayHoja(ev, (ms) => app.esp(ms), 7000), 'reintentar', 'y la hoja de logros vuelve a abrirse (antes se quedaba muerta hasta cerrar la app)')
  } finally {
    app.cerrar()
    await new Promise((r) => setTimeout(r, 600))
  }
}

console.log('3. La hoja con una respuesta que no llega')
{
  const { app, ev } = await iniciar('/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', "window.__retrasoDemo = new Proxy({}, { get: () => 40000 });")
  try {
    await ev("__imp('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.setState({ activeTripId: 'viaje-de-prueba' }); return true })")
    await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().abrirHojaLogros(); return true })")
    debe(await hayHoja(ev, (ms) => app.esp(ms), 8000), 'tarda', 'la hoja se abre aunque lo de logros tarde')
    const esqueleto = await ev("Boolean(document.querySelector('[data-logros-cargando]'))")
    debe(esqueleto, 'tarda', 'mientras llega, el esqueleto de siempre')
    for (let i = 0; i < 60 && !(await ev("Boolean(document.querySelector('[data-logros-sin-cargar]'))")); i++) await app.esp(500)
    const msg = await ev("document.querySelector('[data-logros-sin-cargar]')?.innerText ?? ''")
    debe(/No se ha podido cargar, vuelve a probar\./.test(msg) && /Reintentar/.test(msg), 'tarda', `a los 10 s dice «No se ha podido cargar, vuelve a probar.» con [Reintentar] (${msg.replace(/\n/g, ' ')})`)
    await app.captura(`${CAP}/congelado_hoja_sin_cargar.jpg`)
    await ev(`window.__retrasoDemo = {}; __imp('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = ${JSON.stringify(JSON.parse(leer('src/dev/escaparates/datos/hoja_antes.json')))}; document.querySelector('[data-reintentar-logros]').click(); return true })`)
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-sello]'))")); i++) await app.esp(500)
    debe(await ev("Boolean(document.querySelector('[data-sello]'))"), 'tarda', 'al tocar [Reintentar] llegan los logros')
    debe(await ev("Boolean(document.querySelector('button[aria-label=Cerrar]'))"), 'tarda', 'y la hoja se puede cerrar (no se queda congelada)')
  } finally {
    app.cerrar()
    await new Promise((r) => setTimeout(r, 600))
  }
}

console.log('4. Abrir logros → «Yo también estaba» → cerrar → volver a abrir, 5 veces')
{
  const { app, ev } = await iniciar('/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0')
  try {
    const estado = JSON.parse(leer('src/dev/escaparates/datos/hoja_despues.json'))
    await ev(`window.__demoHoy = '2026-11-02'; __imp('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = ${JSON.stringify(estado)}; return true })`)
    let todas = 0
    for (let vuelta = 1; vuelta <= 5; vuelta++) {
      const clic = await ev("(() => { const b = document.querySelector('[data-boton-logros]'); if (!b) return false; b.click(); return true })()")
      if (!clic) await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().abrirHojaLogros(); return true })")
      const abre = await hayHoja(ev, (ms) => app.esp(ms), 7000)
      if (abre) todas++
      else {
        const tapa = await ev("(() => { const e = document.elementFromPoint(195, 420); return e ? e.tagName + ' ' + String(e.className).slice(0, 50) : null })()")
        console.log(`   vuelta ${vuelta}: no abre; encima: ${tapa}`)
      }
      await ev("document.querySelector('[data-companero=\"tarjeta\"]')?.click(); true")
      await app.esp(900)
      if (await ev("Boolean(document.querySelector('[data-companero=\"en-todos\"], [data-companero=\"yo-tambien\"]'))")) {
        await ev("(document.querySelector('[data-companero=\"en-todos\"]') ?? document.querySelector('[data-companero=\"yo-tambien\"]')).click(); true")
        await app.esp(3500)
      }
      for (let i = 0; i < 14; i++) {
        const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Saltar todo|Siguiente|Entendido|Seguir)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!h) break
        await app.esp(500)
      }
      await ev("document.querySelector('button[aria-label=Cerrar]')?.click(); __imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarHojaLogros(); return true })")
      await app.esp(1200)
    }
    debe(todas === 5, 'vueltas', `la hoja de logros abre las 5 veces seguidas (${todas} de 5)`)
    const capa = await ev("(() => { const fixed = Array.from(document.querySelectorAll('body *')).filter((e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.position === 'fixed' && r.width >= innerWidth - 2 && r.height >= innerHeight - 2 && s.pointerEvents !== 'none' && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0 && (e.innerText || '').trim() === '' }).map((e) => e.tagName + '.' + String(e.className).slice(0, 40)); return JSON.stringify(fixed) })()")
    debe(capa === '[]', 'capa', `al acabar no queda una capa invisible a pantalla completa que tape los toques (${capa})`)
  } finally {
    app.cerrar()
    await new Promise((r) => setTimeout(r, 600))
  }
}

console.log(`\nPrueba de los logros congelados: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
