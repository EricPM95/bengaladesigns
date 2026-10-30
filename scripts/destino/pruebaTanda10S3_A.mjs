// Tanda 10S3, agente A. Apartado 1: la ciudad de salida ya no se confunde por el nombre (nombre Y país Y coordenadas a 50 km o menos).
// Apartado 2: los resultados de la ciudad, entre el campo y el teclado (390 x 844 y 375 x 667 con el teclado abierto: se simula quitando unos 300 px de alto), con 1, 3 y 5 resultados.
// Hace falta la API (8787) y el Vite (5173). Con navegador, por la cola:
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S3_A.mjs
// Los resultados de Mapbox se sustituyen por unos fijos (así salen siempre 1, 3 o 5, sin depender de internet).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { entradaDeTabla, claveDeOrigen, distanciaKm } from '../../server/transportOrigen.js'

const API = process.env.API_URL || 'http://localhost:8787'
let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}

/* ───────────────────────── 1. La ciudad de salida: nombre + país + coordenadas ───────────────────────── */
{
  const tabla = JSON.parse(fs.readFileSync('data/transport/roma_origenes.json', 'utf8'))
  const lugar = (name, countryCode, lat, lng, fullName) => ({ name, fullName: fullName ?? `${name}, X`, countryCode, coordinates: { lat, lng } })
  const casos = [
    // [nombre, país, lat, lng, ¿debe salir de la tabla?, qué fila]
    ['Barcelona', 'es', 41.3874, 2.1686, 'Barcelona'],
    ['Barcelona', 'br', -9.9, -63.9, null], // Barcelona de Brasil (otro país y a miles de km)
    ['Barcelona', 've', 10.13, -64.69, null], // Barcelona de Venezuela
    ['Valencia', 'es', 39.4699, -0.3763, 'Valencia'],
    ['Valencia', 've', 10.16, -68.0, null],
    ['Córdoba', 'es', 37.8882, -4.7794, null], // Córdoba no está en la tabla: se trata como cualquiera
    ['Córdoba', 'ar', -31.42, -64.18, null],
    ['Mérida', 'es', 38.9161, -6.3437, null],
    ['Mérida', 'mx', 20.97, -89.62, null],
  ]
  for (const [nombre, pais, lat, lng, esperada] of casos) {
    const fila = entradaDeTabla(tabla, lugar(nombre, pais, lat, lng))
    debe((fila?.origen ?? null) === esperada, 'ciudad', `${nombre} (${pais}) ${esperada ? `sale de la tabla como ${esperada}` : 'NO sale de la tabla (se trata como cualquier ciudad)'} → ${fila?.origen ?? 'fuera de la tabla'}`)
  }
  // Mismo nombre y país, pero coordenadas lejos (más de 50 km): fuera. Y cerca (menos de 50 km): dentro.
  debe(entradaDeTabla(tabla, lugar('Barcelona', 'es', 39.0, 3.0)) === null, 'ciudad', 'Barcelona con país España pero a cientos de km de la de la tabla: fuera')
  debe(entradaDeTabla(tabla, lugar('Barcelona', 'es', 41.45, 2.25))?.origen === 'Barcelona', 'ciudad', 'Barcelona, España, a menos de 50 km de la de la tabla: dentro')
  debe(distanciaKm({ lat: 41.3874, lng: 2.1686 }, { lat: 41.45, lng: 2.25 }) < 50, 'ciudad', 'el cálculo de la distancia da menos de 50 km para ese punto cercano')
  // Sin país o sin coordenadas: no se fía, fuera de la tabla.
  debe(entradaDeTabla(tabla, lugar('Barcelona', null, 41.3874, 2.1686)) === null, 'ciudad', 'sin país no vale la tabla (se trata como cualquier ciudad)')
  debe(entradaDeTabla(tabla, { name: 'Barcelona', fullName: 'Barcelona, España', countryCode: 'es', coordinates: null }) === null, 'ciudad', 'sin coordenadas no vale la tabla')
  // Los alias y las tildes siguen valiendo cuando país y sitio coinciden.
  debe(entradaDeTabla(tabla, lugar('València', 'es', 39.47, -0.38))?.origen === 'Valencia', 'ciudad', 'València (España) sigue siendo Valencia de la tabla')
  debe(entradaDeTabla(tabla, lugar('Mexico City', 'mx', 19.43, -99.13))?.origen === 'Ciudad de México', 'ciudad', 'Mexico City (México) sigue siendo Ciudad de México de la tabla')
  // Todas las filas de la tabla llevan país y coordenadas.
  debe(tabla.origenes.every((f) => /^[a-z]{2}$/.test(f.pais) && Number.isFinite(f.lat) && Number.isFinite(f.lng)), 'ciudad', 'las 20 filas de la tabla llevan país y coordenadas')
  // La caché: dos ciudades con el mismo nombre nunca comparten clave.
  const claves = new Set(['es|41.3874|2.1686', 'br|-9.9|-63.9', 've|10.13|-64.69'].map((s) => { const [p, la, ln] = s.split('|'); return claveDeOrigen(lugar('Barcelona', p, Number(la), Number(ln))) }))
  debe(claves.size === 3, 'cache', 'Barcelona de España, de Brasil y de Venezuela tienen tres claves de caché distintas')
  debe(claveDeOrigen(lugar('Córdoba', null, 37.88, -4.78)) !== claveDeOrigen(lugar('Córdoba', null, -31.42, -64.18)), 'cache', 'aunque falte el país, dos Córdobas lejanas no comparten clave (entran las coordenadas)')
  debe(claveDeOrigen(lugar('Barcelona', 'es', 41.3874, 2.1686)) === claveDeOrigen(lugar('Barcelona', 'es', 41.39, 2.17)), 'cache', 'la misma ciudad con coordenadas casi iguales sí comparte clave (la caché sigue sirviendo)')
  // La API, con lo que NO gasta Claude: las dos de España salen de la tabla.
  for (const [nombre, lat, lng, tiempo] of [['Barcelona', 41.3874, 2.1686, '1 h 50'], ['Valencia', 39.4699, -0.3763, null]]) {
    const r = await fetch(`${API}/api/transport-feasibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: lugar(nombre, 'es', lat, lng, `${nombre}, España`), destination: { name: 'Roma', fullName: 'Roma, Italia', countryCode: 'it', coordinates: { lat: 41.9, lng: 12.5 } } }),
    })
    const j = await r.json()
    debe(r.ok && j.source === 'tabla', 'ciudad', `la API da ${nombre} (España) desde la tabla (source=${j.source})`)
    if (tiempo) debe(j.flight?.duration_label === tiempo, 'ciudad', `y con su tiempo en avión (${j.flight?.duration_label})`)
  }
  const src = fs.readFileSync('server/index.js', 'utf8')
  debe(/entradaDeTabla\(table, origin\)/.test(src) && /claveDeOrigen\(origin\)/.test(src), 'ciudad', '/api/transport-feasibility usa entradaDeTabla y claveDeOrigen')
}

/* ───────────────────────── 2. Los resultados con el teclado abierto ───────────────────────── */
const MOCK = `(() => {
  const cities = [
    ['Barcelona', 'España', 'es', 2.1686, 41.3874],
    ['Barcelona', 'Brasil', 'br', -63.9, -9.9],
    ['Barcelos', 'Portugal', 'pt', -8.6, 41.53],
    ['Barcelona', 'Venezuela', 've', -64.69, 10.13],
    ['Barcelona', 'Filipinas', 'ph', 124.1, 12.9],
  ]
  const orig = window.fetch.bind(window)
  window.__nRes = 5
  window.fetch = (url, opts) => {
    const u = String(url)
    if (u.includes('api.mapbox.com/geocoding')) {
      const tipos = new URL(u).searchParams.get('types')
      const features = tipos === 'place' ? cities.slice(0, window.__nRes).map(([text, pais, cc, lng, lat], i) => ({ id: 'place.' + i, text, place_name: text + ', ' + pais, center: [lng, lat], relevance: 1 - i * 0.01, place_type: ['place'], context: [{ id: 'country.' + i, text: pais, short_code: cc }] })) : []
      return Promise.resolve(new Response(JSON.stringify({ features }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    return orig(url, opts)
  }
})()`

const MIDE = `(() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) } }
  const opciones = [...document.querySelectorAll('[data-origen-opcion]')]
  const campo = document.querySelector('[data-campo-origen]')
  const vis = (e) => { if (!e) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; return e.getBoundingClientRect().width > 0 }
  const tapadas = opciones.filter((o) => { const b = o.getBoundingClientRect(); const x = (b.left + b.right) / 2; const y = (b.top + b.bottom) / 2; const e = document.elementFromPoint(x, y); return !(e && (e === o || o.contains(e))) }).length
  const titulo = document.querySelector('[data-titulo-paso]')
  return {
    alto: window.innerHeight, ancho: window.innerWidth,
    n: opciones.length,
    cajas: opciones.map(r),
    campo: r(campo),
    tarjeta: r(document.querySelector('[data-tarjeta-origen-destino]')),
    lista: r(document.querySelector('[data-sugerencias-origen]')),
    tapadas,
    textos: opciones.map((o) => o.querySelector('[data-origen-texto]')?.textContent ?? ''),
    banderas: opciones.map((o) => { const f = o.querySelector('[data-origen-bandera]'); return f ? f.className : '' }),
    texto_recortado: opciones.filter((o) => { const t = o.querySelector('[data-origen-texto]'); return t && t.scrollWidth > t.clientWidth + 1 }).length,
    tituloVisible: vis(titulo),
    mapaVisible: vis(document.querySelector('[data-mapa-primera]')),
    trazarVisible: vis(document.querySelector('[data-trazar-ruta]')),
    unirmeVisible: vis(document.querySelector('[data-unirme-con-codigo]')),
    escribiendo: Boolean(document.querySelector('[data-zona-escribir]')),
    scrollPagina: document.scrollingElement.scrollTop,
  }
})()`

const tamanos = [
  { ancho: 390, alto: 844 - 300, nombre: '390x844' },
  { ancho: 375, alto: 667 - 300, nombre: '375x667' },
]
fs.mkdirSync('docs/dias/capturas_jutrip', { recursive: true })

for (const t of tamanos) {
  for (const n of [1, 3, 5]) {
    const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0', ancho: t.ancho, alto: t.alto, antes: MOCK })
    try {
      const et = `${t.nombre} con teclado, ${n} resultado${n > 1 ? 's' : ''}`
      let listo = false
      for (let i = 0; i < 120 && !listo; i++) {
        listo = await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]') && document.querySelector('[data-campo-origen]'))").catch(() => false)
        if (!listo) await app.esp(500)
      }
      debe(listo, 'teclado', `${et}: la primera pantalla abre`)
      await app.esp(1200)
      // Antes de escribir: lo de siempre.
      const antes = await app.evaluar(MIDE)
      debe(antes.tituloVisible && antes.mapaVisible && antes.trazarVisible && !antes.escribiendo, 'teclado', `${et}: antes de tocar el campo se ve el título, el mapa y [Trazar ruta]`)
      await app.evaluar(`window.__nRes = ${n}`)
      await app.escribir('[data-campo-origen]', 'Barcelona')
      let m = null
      for (let i = 0; i < 40; i++) {
        m = await app.evaluar(MIDE)
        if (m.n === n) break
        await app.esp(300)
      }
      await app.esp(400)
      m = await app.evaluar(MIDE)
      debe(m.n === n, 'teclado', `${et}: salen ${n} resultados (${m.n})`)
      debe(m.escribiendo && !m.tituloVisible && !m.mapaVisible && !m.trazarVisible && !m.unirmeVisible, 'teclado', `${et}: mientras se escribe se esconde el título, el mapa, [Trazar ruta] y «Únete con un código» (escribiendo=${m.escribiendo} título=${m.tituloVisible} mapa=${m.mapaVisible})`)
      debe(m.tarjeta && m.tarjeta.t <= 20, 'teclado', `${et}: la tarjeta sube arriba del todo (top ${m.tarjeta?.t})`)
      debe(m.cajas.every((c) => c && c.t >= m.campo.b - 1), 'teclado', `${et}: los resultados salen debajo del campo (campo acaba en ${m.campo.b}; el primero empieza en ${m.cajas[0]?.t})`)
      debe(m.cajas.every((c) => c && c.t >= 0 && c.b <= m.alto && c.l >= 0 && c.r <= m.ancho), 'teclado', `${et}: ninguno se sale de la zona que deja el teclado (${m.alto} px): el último acaba en ${m.cajas[m.cajas.length - 1]?.b}`)
      debe(m.cajas.every((c) => c && c.h >= 40), 'teclado', `${et}: cada resultado se puede tocar (alto mínimo ${Math.min(...m.cajas.map((c) => c.h))} px)`)
      debe(m.tapadas === 0, 'teclado', `${et}: ninguno tapado por otra cosa (${m.tapadas} tapados)`)
      debe(m.scrollPagina === 0, 'teclado', `${et}: la página no se ha movido sola (${m.scrollPagina})`)
      debe(m.textos.every((x) => /^Barcel\S*,\s\S+/.test(x)), 'teclado', `${et}: cada uno dice ciudad y país («${m.textos.join('», «')}»)`)
      debe(m.banderas.every((c) => /\bfi fi-[a-z]{2}\b/.test(c)), 'teclado', `${et}: cada uno lleva su bandera (${m.banderas.join(' | ')})`)
      debe(m.texto_recortado === 0, 'teclado', `${et}: ningún texto cortado (${m.texto_recortado})`)
      if (n === 5) {
        debe(m.textos[0] === 'Barcelona, España' && m.textos[1] === 'Barcelona, Brasil', 'teclado', `${et}: «Barcelona, España» y «Barcelona, Brasil» salen distintos`)
      }
      const capNombre = `docs/dias/capturas_jutrip/10s3_ciudad_teclado_${t.nombre}_${n}.jpg`
      if (n === 5 || n === 1 || t.nombre === '375x667') await app.captura(capNombre)

      // Elegir uno: todo vuelve como estaba.
      if (n === 5) {
        await app.evaluar("(() => { const e = [...document.querySelectorAll('[data-origen-opcion]')][1]; e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); return true })()")
        await app.esp(500)
        // Sin destino elegido, la app pasa al campo de destino (sigue escribiendo: lo normal).
        const d = await app.evaluar("({ origen: document.querySelector('[data-campo-origen]').value, destinoEnfocado: document.activeElement === document.querySelector('[data-campo-destino]') })")
        debe(d.origen === 'Barcelona' && d.destinoEnfocado, 'teclado', `${et}: al elegir «Barcelona, Brasil» el campo de origen queda con la ciudad y el foco pasa al destino`)
        await app.evaluar("document.activeElement.blur()")
        await app.esp(700)
        const v = await app.evaluar(MIDE)
        debe(!v.escribiendo && v.tituloVisible && v.mapaVisible && v.trazarVisible, 'teclado', `${et}: al cerrar el teclado vuelve todo (título, mapa y [Trazar ruta])`)
        const pais = await app.evaluar("(() => { const x = window.__trazoOrigen; return null })()")
        void pais
      }
    } finally {
      app.cerrar()
      await new Promise((r) => setTimeout(r, 600))
    }
  }
}

// El destino también sube la tarjeta y deja las tarjetas de destinos debajo del campo.
{
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0', ancho: 375, alto: 667 - 300, antes: MOCK })
  try {
    for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-campo-destino]'))").catch(() => false)); i++) await app.esp(500)
    await app.esp(1200)
    await app.evaluar("document.querySelector('[data-campo-destino]').focus()")
    await app.esp(900)
    const d = await app.evaluar(`(() => {
      const c = document.querySelector('[data-campo-destino]').getBoundingClientRect(); const f = document.querySelector('[data-destinos-fila]')?.getBoundingClientRect(); const t = document.querySelector('[data-tarjeta-origen-destino]').getBoundingClientRect()
      const card = document.querySelector('[data-destino-card]')?.getBoundingClientRect()
      return { tarjetaTop: Math.round(t.top), campoB: Math.round(c.bottom), filaT: f ? Math.round(f.top) : null, filaB: f ? Math.round(f.bottom) : null, cardB: card ? Math.round(card.bottom) : null, alto: innerHeight }
    })()`)
    debe(d.tarjetaTop <= 20, 'teclado-destino', `con el destino en uso la tarjeta sube arriba (${d.tarjetaTop})`)
    debe(d.filaT !== null && d.filaT >= d.campoB - 1 && d.cardB <= d.alto, 'teclado-destino', `las tarjetas de destinos salen debajo del campo y a la vista (campo ${d.campoB}, fila ${d.filaT}, acaba ${d.cardB} de ${d.alto})`)
    await app.captura('docs/dias/capturas_jutrip/10s3_ciudad_teclado_destino_375x667.jpg')
  } finally {
    app.cerrar()
    await new Promise((r) => setTimeout(r, 600))
  }
}

// Código: lo que esconde y lo que deja.
{
  const f = fs.readFileSync('src/components/trazo/PrimeraPantalla.tsx', 'utf8')
  debe(/onVolverAMiViaje && !enTransporte && !escribiendo/.test(f), 'teclado', '«Volver a mi viaje» se esconde mientras se escribe')
  debe(/\{!escribiendo && \(\s*<span[^>]*>\s*<LogoPequeno/.test(f), 'teclado', 'el logo se esconde mientras se escribe')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
