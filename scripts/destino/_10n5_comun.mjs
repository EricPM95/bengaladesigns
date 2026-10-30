// Ayudante de las pruebas de la Tanda 10N5 (agente H3: película del pase, candados, cajas del pase, tres colores).
// Abre la app con el viaje de prueba (/?cuentas=off&logros=on&logrosDemo=1&version=<pago|gratis>&apertura=0) en un Chrome sin ventana a un tamaño de móvil.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

export const BASE = process.env.APP_URL ?? 'http://localhost:5173'
export const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
export const foto = (n) => path.join(SALIDA, `10n5_${n}.jpg`)
export const esp = (ms) => new Promise((r) => setTimeout(r, ms))
export const leer = (f) => fs.readFileSync(f, 'utf8')

/** Un viaje de prueba abierto. `version`: 'gratis' (sin pase) | 'pago' (con pase). (Tanda 10N10, 8b: ya no hay película ni «ya vista»: si alguien aún pasa `vista`, se ignora; todo abre directo la lista del pase.)`extraAntes`: JavaScript antes de cargar. */
export async function conViaje(o = {}) {
  // (Otros agentes editan el mismo árbol: si la página se recarga o falla a mitad de crear el viaje, se vuelve a intentar.)
  let ultimo
  for (let i = 0; i < 3; i++) {
    try {
      return await conViaje1(o)
    } catch (e) {
      ultimo = e
      // (Tanda 10S: una espera agotada —el Vite no sirve la página en minutos— no mejora repitiéndola: se lanza el error y la prueba sale, en vez de gastar 3 intentos de varios minutos.)
      if (/esperé \d+ s|no existe|no salió|no arrancó/.test(String(e?.message ?? e))) break
    }
  }
  throw ultimo
}
async function conViaje1({ ancho = 390, alto = 664, version = 'gratis', extraAntes = '', ruta } = {}) {
  const antes = `try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(e){}; ${version === 'gratis' ? 'window.__pruebaDelPase = { cobro: true, conPase: false, puede: true, pruebaGastada: false };' : ''} ${extraAntes}`
  const a = await abrirApp(BASE, { ancho, alto, ruta: ruta ?? `/?cuentas=off&logros=on&logrosDemo=1&version=${version}&apertura=0`, antes })
  // (Tanda 10S: si cualquier paso falla, el Chrome de este intento se CIERRA antes de reintentar o de lanzar el error: antes cada reintento dejaba uno vivo y la prueba no acababa.)
  try {
    // (Tanda 10S: esperas de verdad, con tope y mensaje claro; `abrirApp` ya espera a que exista `window.__rutaPrueba`.)
    await a.hasta("Boolean(document.querySelector('[data-primera-pantalla]'))", { segundos: 120, lanzar: 'conViaje: la pantalla de inicio no salió' })
    await a.hasta("typeof window.__rutaPrueba === 'function'", { segundos: 180, lanzar: 'conViaje: window.__rutaPrueba no existe' })
    let creado
    for (let i = 0; i < 3 && creado !== true; i++) {
      creado = await a.evaluar('window.__rutaPrueba().then(() => true, (e) => String((e && e.message) || e))')
      if (creado !== true) await a.esp(1500)
    }
    if (creado !== true) throw new Error(`conViaje: no se creó el viaje de pruebas (${creado})`)
    await a.hasta(modulo('/src/store/useRouteStore.ts') + '.then((m) => Boolean(m.useRouteStore.getState().route))', { segundos: 90, lanzar: 'conViaje: el almacén no tiene viaje' })
    await a.esp(3500)
    for (let i = 0; i < 4; i++) {
      const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!hecho) break
      await a.esp(600)
    }
    return a
  } catch (e) {
    a.cerrar()
    throw e
  }
}
/** Importa un módulo de la app DESDE LA MISMA dirección que usa la página (con Vite abierto mientras otros editan, las direcciones llevan «?t=…»: sin esto saldría una copia distinta del almacén). */
export const modulo = (ruta) => `(async () => { const n = performance.getEntriesByType('resource').map((r) => r.name).find((x) => x.includes(${JSON.stringify(ruta)})); return import(n || ${JSON.stringify(ruta)}) })()`
export const abrirPase = (a) => a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
export const cuando = async (a, js, veces = 40) => {
  for (let i = 0; i < veces; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
export const clicEn = async (a, x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
  await esp(500)
}
