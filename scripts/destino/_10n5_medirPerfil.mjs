// Mide cuánto tarda en abrirse el Perfil (Tanda 10N5, apartado 4): del toque en el círculo del Perfil a (a) la hoja pintada, (b) «Hola, …» con el marco, (c) el nivel y la EXP.
//   APP_URL=http://localhost:5182 node scripts/destino/_10n5_medirPerfil.mjs [etiqueta] [repeticiones]
// Con red de 4G (1,6 Mbit/s de bajada de móvil real en cobertura media: se usan 9 Mbit/s, 170 ms de latencia) y la CPU 4 veces más lenta (un iPhone de gama media-baja frente a este ordenador),
// y el servidor de logros tardando 500 ms en contestar (`window.__retrasoDemo`). Con la caché del navegador vacía, y la app ya abierta unos segundos (para que la precarga en reposo tenga tiempo).
// Dos modos: «frio» (primera vez: sin nada guardado del perfil) y «caliente» (se abre el perfil una vez, se cierra y se recarga la app: lo último que se vio del perfil ya está guardado en el móvil).
import { abrirApp } from './_enLaApp.mjs'

const etiqueta = process.argv[2] ?? 'ahora'
const repeticiones = Number(process.argv[3] ?? 3)
const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

async function una(modo) {
  const app = await abrirApp('http://localhost:5182', { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  const esp = app.esp
  try {
    for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await esp(500)
    for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await esp(500)
    await app.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await esp(1000)
    await esp(3000)
    for (let i = 0; i < 6; i++) {
      const h = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await esp(700)
    }
    for (let i = 0; i < 40 && !(await app.evaluar("Boolean(document.querySelector('[data-boton-perfil]'))")); i++) await esp(500)
    await app.evaluar("window.__retrasoDemo = { '/api/logros/perfil': 500 }; true")
    if (modo === 'caliente') {
      // Una primera vez para que quede guardado lo último que se vio, y se cierra.
      for (let i = 0; i < 60 && !(await app.evaluar("Boolean(document.querySelector('[data-boton-perfil]'))")); i++) await esp(500)
      await esp(1500)
      await app.evaluar("document.querySelector('[data-boton-perfil]').click(); true")
      for (let i = 0; i < 40 && !(await app.evaluar("Boolean(document.querySelector('[data-nivel-y-rango]'))")); i++) await esp(500)
      await esp(500)
      await app.evaluar("document.querySelector('[aria-label=\"Cerrar el Perfil\"]').click(); true")
      await esp(800)
    }
    await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 170, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 })
    await app.cdp('Emulation.setCPUThrottlingRate', { rate: 4 })
    for (let i = 0; i < 60 && !(await app.evaluar("Boolean(document.querySelector('[data-boton-perfil]'))")); i++) await esp(500)
    await esp(1500)
    await app.evaluar(`(() => {
      window.__m = { a: null, b: null, c: null }
      const t0 = performance.now()
      window.__t0 = t0
      const mira = () => {
        const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
        const ahora = performance.now() - t0
        if (d && window.__m.a === null) window.__m.a = ahora
        if (d && /Hola,/.test(d.innerText) && window.__m.b === null) window.__m.b = ahora
        if (d && d.querySelector('[data-nivel-y-rango]') && window.__m.c === null) window.__m.c = ahora
      }
      new MutationObserver(mira).observe(document.body, { childList: true, subtree: true, characterData: true })
      document.querySelector('[data-boton-perfil]').click()
      mira()
      return true
    })()`)
    for (let i = 0; i < 60 && !(await app.evaluar('window.__m.c !== null')); i++) await esp(250)
    return await app.evaluar('window.__m')
  } finally {
    app.cerrar()
  }
}

for (const modo of ['frio', 'caliente']) {
  const r = { a: [], b: [], c: [] }
  for (let i = 0; i < repeticiones; i++) {
    let m = null
    for (let intento = 0; intento < 3 && !m; intento++) {
      try {
        m = await una(modo)
      } catch (e) {
        console.log('  (reintento: ' + String(e.message).split(String.fromCharCode(10))[0] + ')')
      }
    }
    if (!m) continue
    for (const k of ['a', 'b', 'c']) r[k].push(m[k] ?? 99999)
    console.log(`  ${etiqueta} · ${modo} #${i + 1}: hoja ${Math.round(m.a)} ms · «Hola» ${Math.round(m.b)} ms · nivel y EXP ${Math.round(m.c)} ms`)
  }
  console.log(`${etiqueta} · ${modo} (mediana de ${repeticiones}): hoja ${Math.round(mediana(r.a))} ms · «Hola» ${Math.round(mediana(r.b))} ms · nivel y EXP ${Math.round(mediana(r.c))} ms`)
}
