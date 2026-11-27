// V81 (2b): capturas de «Casi lista» de un tren en grupo (Mi cuenta / cuenta conjunta) y comprobación de las piezas (PersonasCuadradas) y de la línea de abajo.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV81_casi.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V81_capturas')
fs.mkdirSync(CAP, { recursive: true })
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const GENTE = "[{ id: 'p1', nombre: 'Eric', foto: null, esAdmin: true, esYo: true }, { id: 'p2', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' }, { id: 'p3', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' }]"
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar(`(async () => (${e}))()`)
const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const poner = (sel, v) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(v)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.evaluar(`(async () => { const st = ${R}; st.setState({ reservations: [], screen: 'route' }); const V = await import('/src/store/useViajeCompartido.ts'); V.useViajeCompartido.getState().poner({ gente: ${GENTE} }); st.getState().setActiveDayId(null); st.getState().setMode('bookings'); return true })()`)
  await a.esp(2000)
  for (const tipo of ['tren', 'otra']) {
    await a.evaluar(`window.__anadirReserva.getState().abrirFormulario('${tipo}'); true`)
    await a.esp(1200)
    if (tipo === 'tren') { await poner('[data-extra-campo="origen"]', 'Roma Termini'); await poner('[data-extra-campo="destino"]', 'Florencia') } else await poner('[data-extra-campo="nombre"]', 'Tour en kayak')
    await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
    await clic(`[data-campo-de-hora="extra-${tipo}-hora"]`)
    await a.esp(600)
    await clic('[data-hoja-de-hora-guardar]')
    await a.esp(400)
    await clic('[data-siguiente-paso]')
    await a.esp(800)
    for (const cuenta of ['mia', 'comun']) {
      await clic(`[data-cuenta-opcion="${cuenta}"]`)
      await a.esp(500)
      const info = await ev(`(() => {
        const h = document.querySelector('[data-hoja-reserva-extra]'); const pq = h.querySelector('[data-para-quien-cuadrados]'); const qp = h.querySelector('[data-quien-lo-ha-pagado]')
        const cuad = (n) => n ? [...n.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return { t: b.innerText.replace(/\s+/g, ' '), w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left), r: Math.round(r.right) } }) : null
        return { texto: h.innerText.replace(/\s+/g, ' ').slice(0, 400), paraQuien: cuad(pq), pagado: cuad(qp), linea: h.querySelector('[data-linea-destino]')?.innerText ?? null, ancho: Math.round(h.getBoundingClientRect().width) }
      })()`)
      console.log(tipo, cuenta, JSON.stringify(info))
      await a.captura(path.join(CAP, `casi_lista_${tipo}_${cuenta}_app.jpg`))
    }
    await a.evaluar("window.__anadirReserva.getState().cerrar(); true")
    await a.esp(700)
  }
} finally {
  a.cerrar()
}
process.exit(0)
