// V81 §3: ayudante de las capturas y la prueba del teclado del iPhone. Chrome de pruebas no simula el teclado de iOS: se SIMULA su efecto.
//   · Antes de cargar la app se pone un `window.visualViewport` falso (EventTarget con height/offsetTop/scale) y `window.__vv.poner(alto)` lo cambia y dispara `resize`, como hace Safari.
//   · La ventana (innerHeight) se queda en 844, igual que en iOS (el teclado solo encoge la vista visible).
//   · Se dibuja un rectángulo gris «TECLADO» (336 px) abajo, para ver lo que taparía.
//   · modo 'antes': la vista falsa NO cambia (equivale al código viejo, que no hacía nada con el teclado); solo se pinta el rectángulo. modo 'despues': la vista pasa a 844 - 336 y el código nuevo actúa.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

export const TECLADO = 336
const ANTES_BASE = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const FALSO = `(() => { const t = new EventTarget(); const vv = { width: 390, height: 844, offsetTop: 0, offsetLeft: 0, scale: 1, pageTop: 0, pageLeft: 0, addEventListener: t.addEventListener.bind(t), removeEventListener: t.removeEventListener.bind(t), dispatchEvent: t.dispatchEvent.bind(t) }
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
  window.__vv = { poner(h, top = 0) { vv.height = h; vv.offsetTop = top; t.dispatchEvent(new Event('resize')) } } })();`

export async function abrir(modo) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=on&logros=off&apertura=0&hoy2=on&version=pago', antes: `${ANTES_BASE}\n${FALSO}`, ancho: 390, alto: 844 })
  const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.evaluar(`(() => { const d = document.createElement('div'); d.id = 'teclado-falso'; d.textContent = 'TECLADO'; d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:${TECLADO}px;background:#c9ccd2;z-index:99999;display:none;align-items:center;justify-content:center;font:600 18px sans-serif;color:#555'; document.body.appendChild(d); return true })()`)
  const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button, [role=button]')).filter((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().startsWith(${JSON.stringify(texto)})).sort((p, q) => (p.textContent || '').length - (q.textContent || '').length)[0]; if (!b) return false; b.click(); return true })()`)
  /** Pone el foco en el campo y «saca el teclado». */
  const sacarTeclado = async (selector) => {
    await a.evaluar(`(() => { document.getElementById('teclado-falso').style.display = 'flex'; const e = document.querySelector(${JSON.stringify(selector)}); e.focus(); return true })()`)
    await a.esp(150)
    if (modo === 'despues') await a.evaluar(`window.__vv.poner(${844 - TECLADO})`)
    await a.esp(500)
  }
  const quitarTeclado = async () => {
    await a.evaluar("(() => { document.activeElement?.blur?.(); document.getElementById('teclado-falso').style.display = 'none'; return true })()")
    if (modo === 'despues') await a.evaluar('window.__vv.poner(844)')
    await a.esp(500)
  }
  const teclear = async (texto) => {
    await a.cdp('Input.insertText', { text: texto })
    await a.esp(600)
  }
  /** Cajas (top/bottom) de la hoja abierta, su título y el campo con el foco. */
  const medidas = () =>
    a.evaluar(`(() => { const d = document.querySelector("[role=dialog][aria-modal=true]:last-of-type") ?? document.querySelector("[role=dialog]"); const ds = [...document.querySelectorAll("[role=dialog][aria-modal=true]")]; const dlg = ds[ds.length - 1]; const p = dlg.lastElementChild; const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) } }
      const t = dlg.querySelector('[data-hoja-opciones-titulo], h1, h2, h3') ; return { panel: r(p), titulo: r(t), campo: r(document.activeElement), vv: window.visualViewport.height, scrollTop: p.scrollTop } })()`)
  const ajustes = async () => {
    await ev(`${R}.getState().setMode('explore')`)
    await a.esp(1200)
    await ev("(await import('/src/store/useAjustesUi.ts')).useAjustesUi.getState().abrir()")
    await a.esp(2000)
  }
  const reserva = async () => {
    await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]; st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: 'Hotel Quirinale', precio: null } } : {} }); st.getState().setActiveDayId(null); st.getState().setMode('bookings'); return true })()`)
    await a.esp(2500)
    await a.evaluar("window.__anadirReserva.getState().abrirFormulario('ferry'); true")
    await a.esp(1500)
  }
  return { a, ev, clic, sacarTeclado, quitarTeclado, teclear, medidas, ajustes, reserva }
}
