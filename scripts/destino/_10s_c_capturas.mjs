// Capturas de la 10S (agente C, apartado 5): las de Design que faltaban en REPASO_10N11 y REPASO_10N12, y la del aviso pequeño a 375x667 (app).
//   node scripts/destino/_conCola.mjs node scripts/destino/_10s_c_capturas.mjs        (un Chrome a la vez; la parte de la app necesita el Vite estable y la API)
//   SOLO_DESIGN=1 → solo Design (no necesita servidor).
import path from 'node:path'
import { capturarDesign } from './capturaDesign.mjs'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const BASE = process.env.APP_URL || 'http://localhost:5173'
const esp = (ms) => new Promise((r) => setTimeout(r, ms))

const verRotulo = (n) => `(() => { const t = Array.from(document.querySelectorAll('*')).find((e) => e.children.length < 3 && (e.textContent || '').trim().startsWith(${JSON.stringify(n)})); t?.scrollIntoView({ block: 'start' }); return true })()`
const dis = (pieza, rotulo, salida, opts = {}) =>
  capturarDesign(`Piezas/${pieza}.dc.html`, path.join(SALIDA, salida), { despues: verRotulo(rotulo), ...opts }).then(() => console.log('hecha', salida))

// DÍAS día 1 y tarjeta del vuelo (Alojamiento Dias 01, 02, 02b, 03).
await dis('Alojamiento Dias', '01 ·', '10n11_alojamiento_dias_01_design.jpg')
await dis('Alojamiento Dias', '02 ·', '10n11_alojamiento_dias_02_design.jpg')
await dis('Alojamiento Dias', '02b ·', '10n11_alojamiento_dias_02b_design.jpg')
await dis('Alojamiento Dias', '03 ·', '10n11_alojamiento_dias_03_design.jpg')
// El alojamiento 02 y 03, regeneradas (Vuelo Reservas 09p y 08p).
await dis('Vuelo Reservas', '09p', '10n11_aloj_02_tarjeta_con_pase_design.jpg')
await dis('Vuelo Reservas', '08p', '10n11_aloj_03_hoja_desplegable_cerrado_design.jpg')
// La lista del pase y HOY sin pase (Pase Lista 1, 2 y 2b), con el mismo método que _10n11_c_design.mjs.
const ir = (rotulo, y = 0) => `(() => { const t = Array.from(document.querySelectorAll('span')).find((x) => x.textContent.trim().startsWith(${JSON.stringify(rotulo)}) && x.children.length === 0); const tel = t.parentElement.querySelector('div'); const r = tel.getBoundingClientRect(); window.scrollTo(r.left + scrollX - 28, r.top + scrollY - 40 + ${y}); return true })()`
for (const [rotulo, nombre, y] of [
  ['1 · El Pase Roma', '10n12_lista_1_arriba_design', 0],
  ['1 · El Pase Roma', '10n12_lista_3_final_design', 1100],
  ['2 · HOY sin pase', '10n12_hoy_sin_pase_1_cuenta_atras_design', 0],
  ['2b · HOY sin pase', '10n12_hoy_sin_pase_5_terminado_design', 0],
]) {
  await capturarDesign('Piezas/Pase Lista.dc.html', path.join(SALIDA, `${nombre}.jpg`), { ancho: 450, alto: 950, despues: ir(rotulo, y), espera: 8 })
  console.log('hecha', nombre)
}

// El aviso pequeño a 375x667 (app): el [Ir] con candado del día 1 de DÍAS, sin pase.
if (process.env.SOLO_DESIGN !== '1') {
  const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
  const antes = "try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; window.__pruebaDelPase = " + JSON.stringify({ cobro: true, conPase: false, puede: true, pruebaGastada: false })
  const a = await abrirApp(BASE, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0', antes, ancho: 375, alto: 667 })
  try {
    for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
    await a.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
    await a.esp(3500)
    await a.evaluar(`${store}.then((s) => { const id = s.route.days[0].id; s.setAccommodationHotel(id, { name: 'Hotel Aurora', precio: null }); s.setActiveDayId(id); s.setMode('days'); return true })`)
    await a.esp(3000)
    const ok = await a.evaluar("(() => { const b = document.querySelector('[data-alojamiento-dia=\"ir-candado\"]'); if (!b) return false; b.click(); return true })()")
    await a.esp(1000)
    const hay = await a.evaluar("Boolean(document.querySelector('[data-aviso-pase]'))")
    console.log('aviso a 375x667:', ok && hay ? 'abierto' : 'NO se ha abierto')
    await a.captura(path.join(SALIDA, '10s_aviso_375x667.jpg'))
  } finally {
    a.cerrar()
  }
}
