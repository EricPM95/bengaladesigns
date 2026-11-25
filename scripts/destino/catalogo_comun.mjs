// Ayudante del CATALOGO de avisos (PARTE 4 de la noche del 24-25 nov): abre la app en modo iPhone (390x844), monta el viaje de prueba y apunta cada captura en un manifiesto.
// NO cambia nada de la app: solo usa lo que ya existe en desarrollo (window.__rutaPrueba, window.__momentos, window.__horaFalsa, setDevSimulatedTodayIso...).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

export const CAP = path.resolve('docs/dias/CATALOGO_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MANIFIESTO = path.join(CAP, '_manifiesto.json')
export const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
export const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]

/** Apunta una captura (o un «no se pudo») en el manifiesto; cada script solo toca sus propias entradas. */
export function anotar(id, datos) {
  let m = {}
  try {
    m = JSON.parse(fs.readFileSync(MANIFIESTO, 'utf8'))
  } catch {
    /* primera vez */
  }
  m[id] = { ...(m[id] ?? {}), ...datos }
  fs.writeFileSync(MANIFIESTO, JSON.stringify(m, null, 1))
}

export async function abrir(extra = {}) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844, ...extra })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  await cerrarAvisos(a)
  return { a, ev }
}
export async function cerrarAvisos(a) {
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
}
export const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
export const textoDe = (a, sel, n = 500) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, ${n})`)
export const cuerpo = (a, n = 600) => a.evaluar(`(document.body.innerText ?? '').replace(/\\s+/g, ' ').slice(0, ${n})`)

/** Monta HOY con la hora falsa (minutos desde las 0:00), el día simulado y el permiso de ubicación; `mut` cambia la ruta (JS con `r` = copia de la ruta). */
export async function montarHoy({ a, ev }, min, { mut = '', fecha = '2026-10-17', pos = null, perm = 'denied', modo = 'today' } = {}) {
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    window.__horaFalsa = ${min}; window.__pos = ${pos ? JSON.stringify(pos) : 'null'}; window.__perm = '${perm}'
    st.getState().setDevSimulatedTodayIso('${fecha}'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('${modo}')`)
  await a.esp(3000)
}

/** Una captura con su nombre; devuelve el nombre del archivo. */
export async function foto(a, id, datos = {}) {
  const f = `${id}.jpg`
  await a.captura(path.join(CAP, f))
  anotar(id, { ok: true, archivo: f, ...datos })
  console.log('captura', f)
  return f
}
export const nada = (id, motivo) => {
  anotar(id, { ok: false, motivo })
  console.log('NO SE PUDO', id, motivo)
}
