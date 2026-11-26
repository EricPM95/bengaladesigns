// V67 (apartado 3, P3): SOLO captura (no es una prueba) de la secuencia de carga de la tarjeta del viaje en el Perfil (iPhone 390x844) con la red lenta (las fotos tardan): 1) al abrir, 2) a mitad de fundido, 3) con la foto.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV67_b_p3.mjs <antes|despues>   (la API con DESTINOS_OCULTOS='-')
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
const CAP = path.resolve('docs/dias/V67_capturas')
fs.mkdirSync(CAP, { recursive: true })
const ETIQ = process.argv[2] ?? 'despues'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10' }).then(() => true)")
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(3000)
  for (let i = 0; i < 4; i++) { const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!h) break; await a.esp(600) }
  try { await a.evaluar("(() => { localStorage.removeItem('jutrip.portadas_vistas'); return true })()") } catch {}
  // Red lenta y sin caché: las imágenes tardan unos segundos.
  await a.cdp('Network.enable')
  await a.cdp('Network.setCacheDisabled', { cacheDisabled: true })
  await a.cdp('Network.emulateNetworkConditions', { offline: false, latency: 1800, downloadThroughput: 40 * 1024, uploadThroughput: 40 * 1024 })
  await a.evaluar("(() => { const b = document.querySelector('button[aria-label*=\"erfil\"], header button:last-of-type'); if (b) b.click(); return !!b })()")
  const log = {}
  for (const [id, ms] of [['P3_1_abre', 250], ['P3_2_cargando', 1800], ['P3_3_foto', 9000]]) {
    await a.esp(ms)
    await a.captura(path.join(CAP, `${id}_${ETIQ}.jpg`))
    log[id] = await a.evaluar(`(() => { const t = document.querySelector('[data-tarjeta-de-viaje]'); if (!t) return 'sin tarjeta'; const h = t.querySelector('[data-imagen-hueco]'); const i = t.querySelector('img[data-portada-foto-url]'); return JSON.stringify({ hueco: h && h.getAttribute('data-imagen-hueco'), opacidadFoto: i && getComputedStyle(i).opacity, credito: !!t.querySelector('[data-credito-portada]'), origen: t.getAttribute('data-portada-origen') }) })()`)
    console.log(id, log[id])
  }
  fs.writeFileSync(path.join(CAP, `P3_log_${ETIQ}.json`), JSON.stringify(log, null, 2))
} finally { a.cerrar() }
process.exit(0)
