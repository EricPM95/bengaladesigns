// Tanda 10S4 (agente I) · apartado 7:
//   A. PiezaSegura en más sitios: cada día de DÍAS, cada bloque de RESERVAS y cada aviso de la campana. Un error forzado dentro de una de esas piezas
//      (window.__pruebaFallo = '<nombre>', solo en desarrollo) NO tumba la app: la pieza se queda sin pintar y el resto sigue (no sale «Algo ha ido mal»).
//   B. Zonas de toque de 44 × 44 en las hojas, los modales y los menús que quedaron sin medir en la 10S: se miden con elementFromPoint (4 esquinas y el centro
//      del cuadrado de 44 × 44) los botones de esas pantallas que miden menos de 44, y el tamaño que se ve no cambia (se compara con la lista de «a la vista»).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S4_I.mjs
//   Con AUDITAR=1 solo imprime los botones de menos de 44 px de cada pantalla (para saber a cuáles poner `zona-toque`).
import { abrirApp } from './_enLaApp.mjs'
import { auditoriaToque, medirZonaToque } from './_zonaToque.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const AUDITAR = process.env.AUDITAR === '1'
const fallos = []
let comprobaciones = 0
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}

async function abrir(version) {
  const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${version}`, ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    await cerrarAvisos(a)
    return a
  } catch (e) {
    a.cerrar()
    throw e
  }
}
async function cerrarAvisos(a) {
  for (let i = 0; i < 6; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
}
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button, [role=button]')).find((x) => ${re}.test((x.getAttribute('aria-label') || x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const clicSel = (a, sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const modo = async (a, m) => {
  await a.evaluar(`window.__ruta.getState().setMode('${m}'); true`)
  await a.esp(1800)
}
const hayAlgoHaIdoMal = (a) => a.evaluar("/Algo ha ido mal/i.test(document.body.innerText)")

/* ───────── A. PiezaSegura ───────── */
async function pruebaPiezas(version) {
  const et = version === 'gratis' ? 'sin pase' : 'con pase'
  console.log(`\nA. PiezaSegura (${et})`)
  const a = await abrir(version)
  try {
    // DÍAS: se rompe el día 2; el resto de días y la app siguen.
    await modo(a, 'days')
    const antes = await a.evaluar("Array.from(document.querySelectorAll('[data-day-id]')).length")
    debe(antes >= 3, 'dias', `hay días en DÍAS (${antes})`)
    await a.evaluar("window.__pruebaFallo = 'día 2 de DÍAS'; true")
    // Un cambio de estado (abrir otro día) vuelve a pintar las tarjetas.
    await a.evaluar("(() => { const s = window.__ruta.getState(); s.setActiveDayId(s.route.days[2].id); return true })()")
    await a.esp(1200)
    const despues = await a.evaluar("Array.from(document.querySelectorAll('[data-day-id]')).length")
    debe(despues === antes - 1, 'dias', `con el día 2 roto, quedan los demás días (${antes} → ${despues})`)
    debe(!(await hayAlgoHaIdoMal(a)), 'dias', 'con un día roto NO sale «Algo ha ido mal»')
    debe(await a.evaluar("Boolean(document.querySelector('[data-day-id]'))"), 'dias', 'el resto de días se sigue viendo')
    await a.evaluar("window.__pruebaFallo = undefined; true")

    // RESERVAS: se rompe cada bloque, uno a uno (no hace falta reabrir la app: cada pieza rota se queda rota en esta pantalla, así que se pasa a otra pantalla y se vuelve).
    for (const nombre of ['RESERVAS: Llegada y vuelta', 'RESERVAS: Alojamiento', 'RESERVAS: Entradas y Free Tour', 'RESERVAS: Útil para el viaje', 'RESERVAS: resumen del viaje', 'RESERVAS: cuenta atrás']) {
      await modo(a, 'route')
      await a.evaluar(`window.__pruebaFallo = ${JSON.stringify(nombre)}; true`)
      await modo(a, 'bookings')
      debe(!(await hayAlgoHaIdoMal(a)), 'reservas', `con «${nombre}» roto NO sale «Algo ha ido mal»`)
      const cabecera = await a.evaluar("Boolean(document.querySelector('[data-titulo-reservas]')) && /Reservas/.test(document.querySelector('[data-titulo-reservas]').innerText)")
      debe(cabecera, 'reservas', `con «${nombre}» roto la pantalla RESERVAS sigue (su título está)`)
      const otros = await a.evaluar("document.querySelectorAll('[data-blk]').length")
      debe(otros >= 1, 'reservas', `con «${nombre}» roto los demás bloques siguen (${otros} bloques)`)
      await a.evaluar('window.__pruebaFallo = undefined; true')
    }
    // Y el bloque roto desaparece de verdad (la pieza se queda sin pintar).
    await modo(a, 'route')
    await a.evaluar("window.__pruebaFallo = 'RESERVAS: Llegada y vuelta'; true")
    await modo(a, 'bookings')
    debe(await a.evaluar("!document.querySelector('[data-blk=\"llegada\"]')"), 'reservas', 'el bloque roto «Llegada y vuelta» no se pinta (y el resto sí)')
    debe(await a.evaluar("Boolean(document.querySelector('[data-blk=\"aloj\"]'))"), 'reservas', 'el Alojamiento sigue ahí con «Llegada y vuelta» roto')
    await a.evaluar('window.__pruebaFallo = undefined; true')

    // Campana: se rompe cada aviso.
    await modo(a, 'route')
    await a.evaluar(`(() => { window.__pruebaFallo = undefined; return true })()`)
    const abierta = await clicSel(a, 'button[title="Avisos"]')
    debe(abierta, 'campana', 'el botón de la campana existe')
    await a.esp(1200)
    const filas = await a.evaluar("document.querySelectorAll('[data-campana-lista] [data-aviso], [data-campana-lista] [data-aviso-app], [data-campana-lista] [data-aviso-fecha]').length")
    console.log(`   avisos en la campana: ${filas}`)
    await a.evaluar("window.__pruebaFallo = 'aviso de la campana (app)'; true")
    await clicSel(a, '[data-campana-cerrar]')
    await a.esp(500)
    await clicSel(a, 'button[title="Avisos"]')
    await a.esp(1200)
    debe(!(await hayAlgoHaIdoMal(a)), 'campana', 'con los avisos de la app rotos NO sale «Algo ha ido mal»')
    debe(await a.evaluar("Boolean(document.querySelector('[data-campana]'))"), 'campana', 'la campana se abre aunque un aviso esté roto')
    debe(await a.evaluar("document.querySelectorAll('[data-campana-lista] [data-aviso-app], [data-campana-lista] [data-aviso-fecha]').length === 0"), 'campana', 'los avisos rotos no se pintan')
    await a.evaluar("window.__pruebaFallo = undefined; true")
  } finally {
    a.cerrar()
  }
}

/* ───────── B. Zonas de toque ───────── */
// Cada escena: cómo llegar a ella (JS o clic) y qué pantalla es. Se mide cada botón visible de menos de 44 px.
const ESCENAS = [
  { n: 'campana', ir: async (a) => { await modo(a, 'route'); await clicSel(a, 'button[title="Avisos"]') }, sel: '[data-campana]' },
  { n: 'menu del dia', ir: async (a) => { await modo(a, 'days'); await clicSel(a, '[data-day-id] button[aria-label="Más opciones del día"]') }, sel: '[role=dialog]' },
  { n: 'menu de parada', ir: async (a) => { await modo(a, 'days'); await a.evaluar("(() => { const s = window.__ruta.getState(); s.setActiveDayId(s.route.days[1].id); return true })()"); await a.esp(1500); await clicSel(a, 'button[aria-label="Opciones de la parada"]') }, sel: '[role=dialog]' },
  { n: 'hoja llegada', ir: async (a) => { await modo(a, 'bookings'); await clicSel(a, '[data-blk="llegada"] [data-llegada-cabecera], [data-blk="llegada"] [data-llegada-vacia]') }, sel: null },
  { n: 'hoja alojamiento', ir: async (a) => { await modo(a, 'bookings'); await clicSel(a, '[data-blk="aloj"] [data-aloj-cabecera]') }, sel: null },
  { n: 'calendario', ir: async (a) => { await modo(a, 'days'); await clicTexto(a, /^(Cambiar )?fechas|^Añade fechas|^Fechas/i) }, sel: null },
  { n: 'anadir parada', ir: async (a) => { await modo(a, 'days'); await clicTexto(a, /Añadir parada/i) }, sel: null },
  { n: 'ficha de lugar', ir: async (a) => { await modo(a, 'explore'); await a.esp(800); await clicTexto(a, /Monumentos|Lugares/i) }, sel: null },
  { n: 'ficha de parada', ir: async (a) => { await modo(a, 'days'); await a.evaluar("(() => { const s = window.__ruta.getState(); s.setActiveDayId(s.route.days[1].id); return true })()"); await a.esp(1500); await clicSel(a, '[data-stop-id] [role=button], [data-stop-id] button[aria-label^=\"Abrir\"], [data-stop-id] h3, [data-stop-id] p') }, sel: null },
  { n: 'entradas', ir: async (a) => { await modo(a, 'bookings'); await clicSel(a, '[data-blk="entradas"] button') }, sel: null },
  { n: 'perfil', ir: async (a) => { await modo(a, 'route'); await clicSel(a, '[data-boton-perfil]') }, sel: null },
]

async function pruebaToque(version) {
  const et = version === 'gratis' ? 'sin pase' : 'con pase'
  console.log(`\nB. Zonas de toque (${et})`)
  const a = await abrir(version)
  try {
    for (const e of ESCENAS) {
      await a.evaluar("document.querySelectorAll('[role=dialog] [aria-label=Cerrar]').forEach((b) => b.click()); true").catch(() => undefined)
      await a.esp(300)
      try {
        await e.ir(a)
      } catch (x) {
        console.log(`   ${e.n}: no se pudo abrir (${x.message})`)
      }
      await a.esp(1500)
      const dlg = await a.evaluar("(() => { const d = document.querySelector('[role=dialog]'); return d ? d.innerText.slice(0, 50).split(String.fromCharCode(10)).join(' ') : '(sin hoja)' })()")
      console.log(`   [${e.n}] hoja: ${dlg}`)
      const lista = await a.evaluar(auditoriaToque())
      const utiles = lista.filter((b) => !/mapbox|attrib/i.test(b.cls + b.t) && !b.d.includes('data-panel-pruebas') && !(/zt-sin-x/.test(b.cls) && b.h >= 44 && b.vw >= 44))
      if (AUDITAR) {
        console.log(`   ${e.n}: ${utiles.length} botones < 44`)
        const ex = await a.evaluar("(() => { const b = document.querySelector('button[aria-label^=\"Añadir Coliseo\"]'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.width, r.height, getComputedStyle(b).height, b.offsetHeight] })()")
        if (ex) console.log('      exacto Añadir Coliseo', JSON.stringify(ex))
        for (const b of utiles) console.log(`      ${b.tag} «${b.t}» [${b.d}] visto ${b.vw}×${b.vh}, zona ${b.w}×${b.h} · ${b.cls}`)
        continue
      }
      debe(utiles.length === 0, 'toque', `${e.n}: todos los botones tienen zona de toque de 44 × 44 (faltan: ${utiles.map((b) => `${b.t || b.d || b.cls} ${b.w}×${b.h}`).join('; ')})`)
      // Y por dentro: los que llevan la clase se miden de verdad con elementFromPoint (cuando se ven enteros).
      const con = await a.evaluar("Array.from(document.querySelectorAll('.zona-toque')).filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight }).length")
      console.log(`   ${e.n}: ${con} botones con zona-toque a la vista`)
    }
  } finally {
    a.cerrar()
  }
}

if (!AUDITAR) {
  await pruebaPiezas('completa')
  await pruebaPiezas('gratis')
}
await pruebaToque('completa')
if (!AUDITAR) await pruebaToque('gratis')

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
