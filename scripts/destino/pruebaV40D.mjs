// La prueba de la Tanda V40D: la pestaña «Entradas» como Design (Entradas Ficha Pestaña) y el diamante del Vaticano.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV40D.mjs [--capturas]
// La tarjeta se monta suelta (como en pruebaV23_entradas) con los datos de una entrada del Coliseo «tal como vienen de Civitatis».
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
const CAP = 'docs/dias/V40D_capturas'
const conCapturas = process.argv.includes('--capturas')
if (conCapturas) fs.mkdirSync(CAP, { recursive: true })

// ───────── El diamante del Vaticano y los destinos (sin navegador) ─────────
const grados = []
const caminar = (x, f) => {
  if (Array.isArray(x)) x.forEach((y) => caminar(y, f))
  else if (x && typeof x === 'object') {
    f(x)
    Object.values(x).forEach((y) => caminar(y, f))
  }
}
for (const f of fs.readdirSync('data/logros').filter((n) => n.endsWith('.json'))) {
  caminar(JSON.parse(leer(`data/logros/${f}`)), (o) => {
    if (typeof o.grado === 'string' && typeof o.nombre === 'string') grados.push({ f, grado: o.grado, nombre: o.nombre })
  })
}
const EXCEPCION = 'El Vaticano es tuyo'
debe(grados.some((g) => g.nombre === EXCEPCION && g.grado === 'diamante'), 'vaticano', 'el diamante del Vaticano se llama «El Vaticano es tuyo»')
debe(!grados.some((g) => /\bes tuy[oa]\b/i.test(g.nombre) && g.nombre !== EXCEPCION), 'destinos', 'ningún grado de medalla de un destino se llama «… es tuyo/a» (solo el Vaticano)')
debe(!leer('src/lib/sonidos/estudio.ts').includes('Roma es casi tuya') && !leer('src/components/logros/sonidos/ejemploResumenViaje.ts').includes('Roma es casi tuya'), 'ejemplos', 'los ejemplos usan «Roma en el corazón»')

// ───────── La pestaña Entradas del Coliseo ─────────
const coliseo = {
  nombre: 'Coliseo, Foro y Palatino + Arena de gladiadores', incluye: null, desde: 53, url: null,
  civitatis: { id: 1, nombre: 'Coliseo', gratis: false, desde: 53, original: null, moneda: 'EUR', valoracion: 9.3, opiniones: 16210, fotos: { principal: { url: '/fotos/roma/dia_coliseo_p.jpg', grande: null, pie: null }, galeria: [] }, incluye: ['Guía en español.', 'Entrada con acceso preferente al Coliseo, Foro y Palatino (18 €).'], noIncluye: ['Propinas'], cancelacion: 'Gratis hasta 3 días antes', reservarHasta: 'Hasta 2 horas antes', duracion: '2 h 30 min – 3 h', puntoDeEncuentro: { texto: 'Parada de metro Colosseo, salida Via dei Fori Imperiali', lat: 41.89, lng: 12.49 }, idiomas: ['Español'], url: 'https://www.civitatis.com/es/roma/' },
}
const app = await abrirApp(APP, { ruta: '/?cuentas=off&apertura=0', ancho: 390, alto: 844 })
try {
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-campo-origen]'))").catch(() => false)); i++) await app.esp(500)
  await app.esp(1500)
  await app.evaluar(`(async () => {
      const v = (await fetch('/src/main.tsx').then((r) => r.text())).match(/react-dom_client[.]js[?]v=([a-z0-9]+)/)[1]; const [rd, rr, { EntradaDeLaFicha }] = await Promise.all([import('/node_modules/.vite/deps/react-dom_client.js?v=' + v), import('/node_modules/.vite/deps/react.js?v=' + v), import('/src/components/route/reservas/EntradaDeLaFicha.tsx')]); const createRoot = rd.createRoot ?? rd.default.createRoot; const React = rr.default ?? rr
      const coliseo = ${JSON.stringify(coliseo)}
      document.getElementById('v40d')?.remove()
      const d = document.createElement('div'); d.id = 'v40d'; d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#F9F4E8;overflow:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px'; document.body.appendChild(d)
      createRoot(d).render(React.createElement(React.Fragment, null, [coliseo, { ...coliseo, nombre: 'Visita guiada por el Coliseo, Foro y Palatino', civitatis: { ...coliseo.civitatis, id: 2, valoracion: 8.9, opiniones: 3526, desde: 50, duracion: '3 h' }, desde: 50 }].map((e, i) => React.createElement(EntradaDeLaFicha, { key: i, entrada: e, reservarTexto: 'Ver horas y reservar', recomendada: null, onReservar: () => { window.__reservada = (window.__reservada || 0) + 1 } }))))
      await new Promise((r) => setTimeout(r, 700)); return true })()`)
  const cerrada = JSON.parse(await app.evaluar(`JSON.stringify((() => { const e = document.querySelector('[data-entrada-ficha]'); const t = e.querySelector('[data-entrada-tarjeta]'); const f = e.querySelector('[data-entrada-foto]'); const cs = (x) => getComputedStyle(x); const precio = e.querySelector('[data-precio-entrada]'); const idi = e.querySelector('[data-idioma-entrada]'); return { texto: e.innerText.split(String.fromCharCode(10)).join(' | '), fotoRadio: f ? cs(f).borderRadius : null, fotoLado: f ? f.getBoundingClientRect().left < t.getBoundingClientRect().left + 30 : false, tituloFuente: cs(t.querySelector('span span')).fontFamily, estrella: Boolean(e.querySelector('[data-nota-entrada] svg')), estrellaColor: e.querySelector('[data-nota-entrada] svg')?.getAttribute('fill'), idioma: idi?.innerText, idiomaMismaFila: idi && precio ? Math.abs(idi.getBoundingClientRect().top - precio.getBoundingClientRect().top) < 24 : false, precioFuente: precio ? cs(precio).fontFamily : '', precioTam: precio ? cs(precio).fontSize : '', abierta: e.dataset.abierta, detalle: Boolean(e.querySelector('[data-entrada-detalle]')) } })())`))
  debe(cerrada.abierta === '0' && !cerrada.detalle, 'cerrada', 'la tarjeta sale cerrada')
  debe(cerrada.fotoRadio === '18px' && cerrada.fotoLado, 'cerrada', `la foto a la izquierda con las esquinas redondas (${cerrada.fotoRadio})`)
  debe(/Instrument Serif/.test(cerrada.tituloFuente), 'cerrada', 'el título en letra de titular (Instrument Serif)')
  debe(cerrada.estrella && cerrada.estrellaColor === '#C99A44' && cerrada.texto.includes('9,3') && cerrada.texto.includes('· 16.210 opiniones'), 'cerrada', `la ★ dorada con la nota y «· N opiniones» (${cerrada.texto})`)
  debe(cerrada.idioma === 'es' && cerrada.idiomaMismaFila && cerrada.texto.includes('2 h 30 min'), 'cerrada', 'en la misma fila, la etiqueta «es» y la duración')
  debe(cerrada.texto.includes('desde') && /Instrument Serif/.test(cerrada.precioFuente) && cerrada.precioTam === '24px' && cerrada.texto.includes('53 €'), 'cerrada', 'a la derecha «desde» pequeño y el precio grande (53 €)')
  if (conCapturas) await app.captura(`${CAP}/entradas_cerradas.jpg`)
  await app.evaluar("document.querySelector('[data-entrada-ficha] [data-entrada-tarjeta]').click(); true")
  await app.esp(500)
  const abierta = JSON.parse(await app.evaluar(`JSON.stringify((() => { const e = document.querySelector('[data-entrada-ficha]'); const cs = (x) => getComputedStyle(x); const incl = e.querySelector('[data-incluye]'); const circ = incl ? [...incl.querySelectorAll('span > span')].filter((s) => s.querySelector('svg')) : []; const cajas = [...e.querySelectorAll('[data-caja-entrada]')]; const canc = cajas.find((c) => c.dataset.cajaEntrada === 'Cancelación'); const res = cajas.find((c) => c.dataset.cajaEntrada === 'Se reserva'); const mapa = e.querySelector('[data-ver-mapa]'); const boton = e.querySelector('[data-ver-horas-y-reservar]'); return { texto: e.innerText.split(String.fromCharCode(10)).join(' | '), puntos: Boolean(e.querySelector('[data-entrada-detalle]')?.previousElementSibling && cs(e.querySelector('[data-entrada-detalle]').previousElementSibling).borderTopStyle === 'dashed'), checks: circ.length, checkColor: circ[0] ? cs(circ[0]).color : '', encuentro: Boolean(e.querySelector('[data-punto-de-encuentro] svg')), mapa: mapa?.innerText, cajasJuntas: cajas.length === 2 && Math.abs(cajas[0].getBoundingClientRect().top - cajas[1].getBoundingClientRect().top) < 4, cancVerde: canc ? cs(canc.querySelector('span:last-child')).color : '', cancCheck: Boolean(canc?.querySelector('svg')), cancTexto: canc?.innerText.split(String.fromCharCode(10)).join(' '), resTexto: res?.innerText.split(String.fromCharCode(10)).join(' '), boton: boton?.innerText.trim(), botones: e.querySelectorAll('[data-ver-horas-y-reservar]').length, botonFondo: boton ? cs(boton).backgroundImage : '' } })())`))
  debe(abierta.puntos, 'abierta', 'bajo una línea de puntos')
  debe(abierta.texto.includes('INCLUYE') && abierta.checks === 2 && abierta.checkColor === 'rgb(47, 107, 67)', 'abierta', `«INCLUYE» con cada cosa con su ✓ verde en un círculo (${abierta.checks})`)
  debe(abierta.texto.includes('PUNTO DE ENCUENTRO') && abierta.encuentro && abierta.mapa === 'Ver mapa' && abierta.texto.includes('Parada de metro Colosseo'), 'abierta', 'el punto de encuentro en su cajita con el pin y [Ver mapa]')
  debe(abierta.cajasJuntas, 'abierta', 'las dos cajitas juntas, en la misma fila')
  debe(abierta.cancTexto === 'CANCELACIÓN Gratis hasta 3 días antes' && abierta.cancCheck && abierta.cancVerde === 'rgb(47, 107, 67)', 'abierta', `CANCELACIÓN en verde con ✓ (${abierta.cancTexto})`)
  debe(abierta.resTexto === 'SE RESERVA Hasta 2 horas antes', 'abierta', `SE RESERVA («${abierta.resTexto}»)`)
  debe(abierta.botones === 1 && abierta.boton === 'Ver horas y reservar' && abierta.botonFondo.includes('linear-gradient'), 'abierta', '[Ver horas y reservar] dorado, como hoy')
  if (conCapturas) await app.captura(`${CAP}/entradas_abierta.jpg`)
  await app.evaluar("document.querySelector('[data-ver-horas-y-reservar]').click(); true")
  debe((await app.evaluar('window.__reservada')) === 1, 'reservar', 'el botón llama a abrir la reserva')
} finally {
  app.cerrar()
}

// ───────── «¿Ya la tienes? Añádela» y el reproductor ─────────
const sr = leer('src/components/route/reservas/StopReservation.tsx')
debe(sr.includes('¿Ya la tienes?') && sr.includes('Añádela') && sr.includes("'#8A6A2C'") && sr.includes("textDecoration: 'underline'"), 'anadela', '«¿Ya la tienes? Añádela» con «Añádela» dorado, en negrita y subrayado (Design)')
const esc = leer('src/components/route/hoy/Escuchar.tsx')
debe(esc.includes('rounded-full bg-[#1C2230]') && esc.includes('linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)') && esc.includes('data-escuchar-ondas') && esc.includes('text-[21px]'), 'escuchar', 'el reproductor «Escuchar historia»: píldora oscura, play dorado y ondas a la derecha (Design)')

console.log(`\nPrueba V40D: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
