// La parte 3 de la prueba de la Tanda V23: la pestaña «Entradas» (tarjetas cerradas y estrechas, detalles al tocar, importes, «€» suelto, foto en la segunda vez).
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV23_entradas.mjs     (Vite en 5173)
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

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
const CAP = 'docs/dias/V23_capturas'
fs.mkdirSync(CAP, { recursive: true })

console.log('3. La pestaña Entradas')
const { limpiarImportes, precioConNumero } = await import('../../src/lib/importesTexto.ts')
debe(limpiarImportes('Entrada (24EUR)') === 'Entrada (24 €)' && limpiarImportes('Guía 10 EUR y 5,50EUR') === 'Guía 10 € y 5,50 €' && limpiarImportes('Sin importes') === 'Sin importes', 'importes', 'los importes de fuera («24EUR») salen con el formato de la app («24 €»)')
debe(!precioConNumero('€') && !precioConNumero('') && !precioConNumero(null) && precioConNumero('7 €'), 'euro-suelto', 'un «€» sin número no cuenta como precio')
const tab = leer('src/components/route/reservas/StopReservation.tsx')
// (V28, 20-nov) El enlace sale de lib/entradaEnlace.ts: la página de ESA actividad en Civitatis; si no la hay, la web oficial del sitio (sin aid); si tampoco, ningún botón (nunca el buscador de las entradas con `sin_civitatis`).
const reglaEnlace = fs.readFileSync('src/lib/entradaEnlace.ts', 'utf8')
debe(tab.includes('enlaceDeCompraDeEntrada(entrada, route.destination)') && reglaEnlace.includes('entrada.civitatis?.url ?? entrada.url') && reglaEnlace.includes('entrada.oficial') && reglaEnlace.includes('entrada.sin_civitatis'), 'enlace', 'el botón abre la página de ESA actividad (la de los datos), si no la hay la web oficial, y si tampoco, ningún botón; el buscador solo en las entradas antiguas')
debe(tab.includes('Ver horas y reservar') && tab.includes('EntradaDeLaFicha'), 'boton', 'la pestaña usa la tarjeta nueva y el botón [Ver horas y reservar ↗]')
debe(leer('src/components/route/dayDetail/StopDetailSheet.tsx').includes('new Image()'), 'precarga', 'las fotos de las entradas se piden al abrir la ficha, no al tocar la pestaña')

const completa = {
  nombre: 'Panteón: entrada con reserva de hora', incluye: null, desde: 7, url: null,
  civitatis: { id: 1, nombre: 'Panteón', gratis: false, desde: 7, original: null, moneda: 'EUR', valoracion: 9, opiniones: 5870, fotos: { principal: { url: '/fotos/roma/dia_coliseo_p.jpg', grande: null, pie: null }, galeria: [] }, incluye: ['Entrada al Panteón (24EUR)', 'Audioguía en español'], noIncluye: ['Propinas'], cancelacion: 'Cancelación gratis hasta 24 h antes', reservarHasta: 'Hasta la víspera', duracion: '45 min', puntoDeEncuentro: { texto: 'Plaza de la Rotonda', lat: 41.89, lng: 12.47 }, idiomas: ['Español'], url: 'https://www.civitatis.com/es/roma/entradas-panteon/?aid=5206' },
}
const sinPrecio = { nombre: 'Zona junto a la fuente', incluye: 'Acceso a la zona (3EUR)', desde: null, url: null }
const gratis = { ...completa, nombre: 'Otra opción', civitatis: { ...completa.civitatis, id: 2, gratis: true } }

const app = await abrirApp(APP, { ruta: '/?cuentas=off&apertura=0', ancho: 375, alto: 812 })
try {
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-campo-origen]'))").catch(() => false)); i++) await app.esp(500)
  await app.esp(1500)
  const montar = (entradas, recomendada) =>
    app.evaluar(`(async () => {
      const v = (await fetch('/src/main.tsx').then((r) => r.text())).match(/react-dom_client[.]js[?]v=([a-z0-9]+)/)[1]; const [rd, rr, { EntradaDeLaFicha }] = await Promise.all([import('/node_modules/.vite/deps/react-dom_client.js?v=' + v), import('/node_modules/.vite/deps/react.js?v=' + v), import('/src/components/route/reservas/EntradaDeLaFicha.tsx')]); const createRoot = rd.createRoot ?? rd.default.createRoot; const React = rr.default ?? rr
      document.getElementById('v23')?.remove()
      const d = document.createElement('div'); d.id = 'v23'; d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#FBF6EC;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px'; document.body.appendChild(d)
      const lista = ${JSON.stringify(entradas)}
      createRoot(d).render(React.createElement(React.Fragment, null, lista.map((e, i) => React.createElement(EntradaDeLaFicha, { key: i, entrada: e, reservarTexto: 'Ver horas y reservar', recomendada: i === 0 ? ${JSON.stringify(recomendada)} : null, onReservar: () => { window.__reservada = (window.__reservada || 0) + 1 } }))))
      await new Promise((r) => setTimeout(r, 700)); return true })()`)
  await montar([completa, sinPrecio, gratis], { tipo: 'hora', texto: 'Mié 28 · 9:00 · Encaja con tu ruta' })
  const cerradas = await app.evaluar(`Array.from(document.querySelectorAll('[data-entrada-ficha]')).map((e) => { const r = e.getBoundingClientRect(); return { alto: Math.round(r.height), abierta: e.dataset.abierta, texto: e.innerText.split(String.fromCharCode(10)).join(' ').trim(), detalle: Boolean(e.querySelector('[data-entrada-detalle]')), foto: Boolean(e.querySelector('[data-entrada-foto]')) } })`)
  debe(cerradas.length === 3 && cerradas.every((t) => t.abierta === '0' && !t.detalle), 'cerradas', 'las opciones salen cerradas')
  debe(cerradas.every((t) => t.alto < 160), 'estrechas', `son estrechas: se ven las tres a la vez (${cerradas.map((t) => t.alto).join(', ')} px)`)
  debe(cerradas[0].foto && cerradas[0].texto.includes('9,0') && cerradas[0].texto.includes('5.870 opiniones') && cerradas[0].texto.includes('es') && cerradas[0].texto.includes('45 min') && cerradas[0].texto.includes('desde 7'), 'tarjeta', `la tarjeta: foto, ★ nota, opiniones, dos etiquetas, duración y «desde 7 €» (${cerradas[0].texto})`)
  const todo = cerradas.map((t) => t.texto).join(' | ')
  debe(!/EUR/.test(todo) && !/(^|\s)€(\s|$|\|)/.test(todo.replace(/\d\s*€/g, '')), 'euro-suelto', 'ningún «€» suelto ni «EUR» en las tarjetas')
  debe(!cerradas[1].texto.includes('€') && cerradas[2].texto.includes('Gratis'), 'precio', 'sin precio no sale nada (ni «€»); la gratis dice «Gratis»')
  await app.captura(`${CAP}/entradas_cerradas.jpg`)
  await app.evaluar("document.querySelector('[data-entrada-ficha] [data-entrada-tarjeta]').click(); true")
  await app.esp(500)
  const abierta = await app.evaluar(`(() => { const e = document.querySelector('[data-entrada-ficha]'); const h = e.querySelector('[data-hora-recomendada]'); return { texto: e.innerText.split(String.fromCharCode(10)).join(' '), botones: e.querySelectorAll('[data-ver-horas-y-reservar]').length, boton: e.querySelector('[data-ver-horas-y-reservar]')?.innerText.trim(), mapa: Boolean(e.querySelector('[data-punto-de-encuentro] a')), flecha: Boolean(e.querySelector('[data-ver-horas-y-reservar] svg')), recomendada: Boolean(h), recTag: h?.tagName } })()`)
  debe(['INCLUYE', 'PUNTO DE ENCUENTRO', 'CANCELACIÓN', 'SE RESERVA'].every((x) => abierta.texto.includes(x)), 'detalles', 'al tocar una se abre con incluye, punto de encuentro, cancelación y hasta cuándo se reserva (V40D: como Design)')
  debe(abierta.texto.includes('24 €') && !abierta.texto.includes('24EUR'), 'importes', '«(24EUR)» sale como «24 €»')
  debe(abierta.botones === 1 && abierta.boton === 'Ver horas y reservar' && abierta.flecha && abierta.mapa, 'boton', 'un solo botón [Ver horas y reservar ↗] (con su flechita) y el punto de encuentro con su enlace al mapa')
  debe(abierta.recomendada && abierta.recTag !== 'BUTTON' && /la hora que te recomendamos/i.test(abierta.texto), 'hora-recomendada', 'la hora recomendada es un consejo, no un botón')
  await app.captura(`${CAP}/entradas_abierta.jpg`)
  await app.evaluar("document.querySelector('[data-ver-horas-y-reservar]').click(); true")
  debe((await app.evaluar('window.__reservada')) === 1, 'reservar', 'el botón llama a abrir la reserva (una vez)')

  // la foto, la segunda vez, con la red lenta de Chrome
  await app.evaluar("new Promise((r) => { const i = new Image(); i.onload = i.onerror = () => r(true); i.src = '/fotos/roma/dia_coliseo_p.jpg' })")
  await app.cdp('Network.enable')
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 })
  const segunda = await app.evaluar(`(async () => { const t0 = performance.now(); document.getElementById('v23')?.remove(); const v = (await fetch('/src/main.tsx').then((r) => r.text())).match(/react-dom_client[.]js[?]v=([a-z0-9]+)/)[1]; const [rd, rr, { EntradaDeLaFicha }] = await Promise.all([import('/node_modules/.vite/deps/react-dom_client.js?v=' + v), import('/node_modules/.vite/deps/react.js?v=' + v), import('/src/components/route/reservas/EntradaDeLaFicha.tsx')]); const createRoot = rd.createRoot ?? rd.default.createRoot; const React = rr.default ?? rr; const d = document.createElement('div'); d.id = 'v23'; d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#FBF6EC'; document.body.appendChild(d); createRoot(d).render(React.createElement(EntradaDeLaFicha, { entrada: ${JSON.stringify(completa)}, reservarTexto: 'x', recomendada: null, onReservar() {} })); for (let i = 0; i < 400; i++) { const im = d.querySelector('img'); if (im && im.complete && im.naturalWidth > 0) return Math.round(performance.now() - t0); await new Promise((r) => setTimeout(r, 25)) } return -1 })()`)
  debe(segunda >= 0 && segunda < 1000, 'foto', `la foto, con la red lenta (Slow 4G) y ya en el móvil, sale en menos de 1 segundo (${segunda} ms)`)
  console.log(`   (foto con la red lenta, segunda vez: ${segunda} ms)`)
} finally {
  app.cerrar()
  await new Promise((r) => setTimeout(r, 600))
}

console.log(`\nPrueba de la Tanda V23 (Entradas): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
