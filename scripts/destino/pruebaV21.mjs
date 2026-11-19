// La prueba de la Tanda V21: LA PÁGINA DEL DESTINO, CON ACTIVIDADES Y HOTELES (docs/dias/PROMPT_V21_PAGINA_DESTINO.md).
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV21.mjs     (Vite en 5173 y la API en 8787; las partes 1 y 2 no necesitan nada)
//  1. Los datos (actividades y hoteles)   2. El código   3. En un Chrome: «4 noches» en la tarjeta y en la página, las tarjetas, los enlaces, sin botones azul ni rojo, «tu alojamiento»
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { elegirActividades, hotelesDeLaPagina, paginaDelDestino, tipoDeActividad } from '../../server/paginaDestino.js'
import { notaDeLaPagina } from './notasHoteles.mjs'
import { enlaceDeHotel } from '../../src/lib/paginaDestino.ts'

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
const json = (f) => JSON.parse(leer(f))
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V21_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. Los datos ───────── */
console.log('1. Los datos: actividades y hoteles')
{
  const roma = paginaDelDestino({ raiz: '.', destination: 'Roma', datosDestino: json('data/pipeline_v2/roma.json') })
  const lz = paginaDelDestino({ raiz: '.', destination: 'Lanzarote', datosDestino: json('data/pipeline_v2/lanzarote.json') })
  for (const [nombre, p] of [['Roma', roma], ['Lanzarote', lz]]) {
    const a = p.actividades
    debe(a.length >= 5 && a.length <= 7, 'actividades', `${nombre}: entre 5 y 7 actividades (${a.length})`)
    debe(a.every((x, i) => i === 0 || a[i - 1].opiniones >= x.opiniones), 'orden', `${nombre}: de la más popular a la menos (por opiniones: ${a.map((x) => x.opiniones).join(' ≥ ')})`)
    debe(a.every((x) => x.nota >= 8.5), 'nota', `${nombre}: todas de nota 8,5 o más (${a.map((x) => x.nota).join(', ')})`)
    debe(new Set(a.map((x) => x.tipo)).size === a.length, 'tipos', `${nombre}: sin repetir el mismo tipo (${a.map((x) => x.tipo).join(', ')})`)
    debe(a.every((x) => /^https:\/\/www\.civitatis\.com\/es\//.test(x.url) && x.nombre && (x.gratis || typeof x.desde === 'number')), 'datos', `${nombre}: cada una con su enlace de Civitatis y su «desde» o «Gratis»`)
    debe(a.every((x) => x.foto && /^https:\/\//.test(x.foto)), 'fotos', `${nombre}: cada una con su foto de Civitatis`)
  }
  debe(lz.actividades.filter((x) => x.tipo === 'timanfaya').length <= 1 && lz.actividades.some((x) => x.gratis), 'tipos', 'Lanzarote: no hay tres de Timanfaya y el Free Tour sale como «Gratis»')
  debe(tipoDeActividad('Excursión a Pompeya y Sorrento') === tipoDeActividad('Excursión a Nápoles y Pompeya en tren'), 'tipos', 'Pompeya y Nápoles cuentan como el mismo tipo')
  const ej = elegirActividades([
    { id: 'a', nombre: 'Excursión al Timanfaya 1', nota: 9, opiniones: 10, url: 'https://x', desde: 1 },
    { id: 'b', nombre: 'Excursión al Timanfaya 2', nota: 9.5, opiniones: 90, url: 'https://x', desde: 1 },
    { id: 'c', nombre: 'Algo flojo', nota: 8.4, opiniones: 9999, url: 'https://x', desde: 1 },
    { id: 'd', nombre: 'Kayak', nota: 8.5, opiniones: 50, url: 'https://x', desde: 1 },
  ])
  debe(ej.map((x) => x.id).join() === 'b,d', 'regla', 'la regla: fuera lo de menos de 8,5 y el Timanfaya repetido (se queda el más popular), de más a menos opiniones')
  // Los hoteles de Roma: los 7 de Eric con SU enlace de Stay22
  const guia = {
    'Torre Argentina Relais': 'W2tifSYtI0', 'Nikis Collection Trastevere': 'ZnfYv4gsY7', 'Polinari Rooms San Pietro': '7BzGI3MdUt', 'Casa Cleo': 'Rmip5Gear4', 'Spagna Boutique': 'tSWZYf8x5N', 'Colosseo Relais': 'i2FUGOonBU', Evergreen: 'D22pW_dGex',
  }
  debe(roma.hoteles.length === 7 && roma.hoteles.every((h) => guia[h.nombre] && h.enlace === `https://booking.stay22.com/viajesbengala/${guia[h.nombre]}`), 'hoteles', 'Roma: los 7 hoteles de Eric, cada uno con el enlace de Stay22 que dio')
  // (V28, decisión de Eric) Sin etiqueta encima de la foto («Mejor nota de …» ni otra): zona, nota (9 o más en Roma), opiniones y de cuándo.
  debe(roma.hoteles.every((h) => h.zona && !('etiqueta' in h) && h.nota >= 9 && h.opiniones > 100 && h.nota_de), 'hoteles', 'cada uno con su zona, su nota, sus opiniones, de cuándo, y SIN etiqueta')
  debe(roma.hoteles.every((h) => !('precio' in h)), 'hoteles', 'sin precio')
  const archivo = json('data/dias/roma/_hoteles.json')
  debe(archivo.hoteles.every((h) => /^https:\/\/www\.booking\.com\/hotel\/it\/[a-z0-9-]+\.es\.html$/.test(h.booking) && 'permiso' in h && 'foto' in h), 'hoteles', 'cada hotel con su dirección de Booking y de dónde sale la foto («permiso»)')
  // Lanzarote: lo que se ha podido identificar
  debe(lz.hoteles.map((h) => h.nombre).join('|') === 'Princesa Yaiza Suite Hotel Resort|La Isla y el Mar, Hotel Boutique|Oasis Lanz Beach Mate|Sandos Papagayo|SENTIDO Aequora Lanzarote Suites' && lz.hoteles.every((h) => !('etiqueta' in h)), 'hoteles', 'Lanzarote: los 5 hoteles de Eric (V28), sin etiqueta')
  const lzArchivo = json('data/dias/lanzarote/_hoteles.json')
  debe(lzArchivo.hoteles.length === 5 && lzArchivo.hoteles.filter((h) => h.pendiente).length === 0 && lzArchivo.hoteles.every((h) => h.stay22.startsWith('https://booking.stay22.com/viajesbengala/')), 'hoteles', 'Lanzarote: los 5 enlaces de Stay22, ninguno pendiente')
  debe(hotelesDeLaPagina({ hoteles: [{ id: 'x', nombre: 'X', zona: 'Z', stay22: 'https://s', nota: 9, opiniones: 5, pendiente: true }] }).length === 0, 'hoteles', 'un hotel pendiente no sale')
  // El script de notas
  debe(JSON.stringify(notaDeLaPagina('xx aggregateRating" : { "@type" : "AggregateRating", "bestRating" : 10, "reviewCount" : 835, "ratingValue" : 9.6 }')) === '{"nota":9.6,"opiniones":835}' && notaDeLaPagina('nada') === null, 'script', 'notasHoteles.mjs: lee la nota y las opiniones de la página de Booking y, si no están, no inventa nada')
  // El enlace con fechas y personas
  const e = enlaceDeHotel('https://booking.stay22.com/viajesbengala/W2tifSYtI0', { entrada: '2026-11-25', salida: '2026-11-29', personas: 2 })
  debe(e === 'https://booking.stay22.com/viajesbengala/W2tifSYtI0?checkin=2026-11-25&checkout=2026-11-29&adults=2' && enlaceDeHotel('https://s/x', {}) === 'https://s/x', 'enlace', 'Stay22 deja añadir las fechas y las personas: el enlace va con ellas (y tal cual si no se sabe)')
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const modal = leer('src/components/route/DestinationDetailModal.tsx')
  debe(!/BOOKING_BLUE|CIVITATIS_RED|#003580|#E2231A/i.test(modal), 'estilo', 'la página no lleva el azul de Booking ni el rojo de Civitatis')
  debe(/Ver todas las actividades/.test(modal) && /Ver todos en el mapa/.test(modal) && /abrirMapa/.test(modal) && /TU ALOJAMIENTO/.test(modal) && /OTRAS OPCIONES/.test(modal) && /active:scale/.test(modal) && /rel="noopener noreferrer"/.test(modal), 'pagina', 'D1-D3: «Ver todas las actividades», «Ver todos en el mapa» (la pantalla de alojamiento de siempre), «Tu alojamiento», «Otras opciones», se hunde al tocar y se abre fuera')
  debe(/resumenDelTramo/.test(leer('src/components/route/RouteOverview.tsx')) && !/formatSegmentNightsLabel\(detailSegment/.test(leer('src/components/route/RouteOverview.tsx')), 'noches', 'la tarjeta de RUTA y la página usan la MISMA cuenta (resumenDelTramo)')
  const indice = leer('server/index.js')
  debe(/registrarRutaPaginaDestino\(app/.test(indice), 'servidor', 'la ruta /api/destino-pagina está registrada')
}

/* ───────── 3. En un Chrome ───────── */
console.log('3. En la app')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
    for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 60 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
    await a.esp(4000)
    for (let i = 0; i < 4; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    // El viaje de Eric: del 25 al 29 de noviembre (la ruta guardada puede traer un día de menos: lo que cuenta son las fechas del viaje)
    await ev("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); const r = s.route; m.useRouteStore.setState({ route: { ...r, answers: { ...r.answers, dateRange: { start: '2026-11-25', end: '2026-11-29' } } } }); s.setActiveDayId(null); s.setMode('route'); return true })")
    await a.esp(2500)
    const tarjeta = await ev("document.querySelector('[data-duracion-del-viaje]')?.innerText ?? ''")
    debe(/^5 días · 4 noches$/.test(tarjeta.trim()), 'noches', `la tarjeta de RUTA dice «${tarjeta.trim()}»`)
    await ev("document.querySelector('[data-duracion-del-viaje]').closest('button').click(); true")
    for (let i = 0; i < 30 && !(await ev("Boolean(document.querySelector('[data-hotel]'))")); i++) await a.esp(500)
    await a.esp(1200)
    const noches = await ev("document.querySelector('[data-noches-destino]')?.innerText ?? ''")
    debe(/^5 días · 4 noches · 25 nov – 29 nov$/.test(noches.trim()), 'noches', `la página dice «${noches.trim()}» (del 25 al 29: 4 noches, la misma cuenta que la tarjeta)`)
    debe(!/3 noches/.test(await ev('document.body.innerText')), 'noches', 'y ya no sale «3 noches»')
    await a.captura(`${CAP}/D1_pagina.jpg`)
    const p = await ev(`(() => ({
      acts: Array.from(document.querySelectorAll('[data-actividad]')).map((e) => ({ href: e.href, precio: e.querySelector('[data-precio-actividad]')?.innerText, nota: e.querySelector('[data-nota-actividad]')?.innerText.trim(), op: Number((e.innerText.match(/([\\d.]+) opiniones/) || [])[1]?.replace(/\\./g, '')) })),
      hoteles: Array.from(document.querySelectorAll('[data-hotel]')).map((e) => ({ id: e.dataset.hotel, href: e.href, texto: e.innerText.replace(/\\s+/g, ' ') })),
      cabecera: ['QUÉ HACER', 'DÓNDE DORMIR', 'Ver todas las actividades', 'Ver todos en el mapa'].map((t) => document.body.innerText.includes(t)),
      malos: Array.from(document.querySelectorAll('[data-pagina-destino] button, [data-pagina-destino] a')).filter((e) => { const c = getComputedStyle(e).backgroundColor; return c === 'rgb(0, 53, 128)' || c === 'rgb(226, 35, 26)' }).length,
      tuAloj: Boolean(document.querySelector('[data-tu-alojamiento]')),
      pagina: Boolean(document.querySelector('[data-pagina-destino]'))
    }))()`)
    debe(p.pagina && p.cabecera.every(Boolean), 'pagina', 'la página trae «Qué hacer», «Dónde dormir», «Ver todas las actividades» y «Ver todos en el mapa»')
    debe(p.acts.length >= 5 && p.acts.every((x) => /civitatis\.com\/es\//.test(x.href) && /aid=5206/.test(x.href) && x.precio && x.nota), 'actividades', `${p.acts.length} actividades, cada una un enlace de Civitatis con nuestro aid, con «desde» y nota`)
    debe(p.acts.every((x, i) => i === 0 || p.acts[i - 1].op >= x.op), 'orden', `las actividades salen de más a menos opiniones (${p.acts.map((x) => x.op).join(', ')})`)
    debe(p.hoteles.length === 7 && p.hoteles.every((h) => /^https:\/\/booking\.stay22\.com\/viajesbengala\/[\w-]+\?checkin=2026-11-25&checkout=2026-11-29/.test(h.href)), 'hoteles', 'los 7 hoteles, cada uno con SU enlace de Stay22 y las fechas del viaje (25 – 29 nov)')
    debe(p.hoteles.every((h) => !/Mejor nota de/.test(h.texto) && /[0-9],[0-9]/.test(h.texto) && /opiniones/.test(h.texto) && !/€/.test(h.texto)), 'hoteles', 'cada hotel con zona, nota y opiniones, sin etiqueta y sin precio')
    debe(p.malos === 0, 'estilo', 'ningún botón azul Booking ni rojo Civitatis en la página')
    debe(p.tuAloj === false, 'alojamiento', 'sin alojamiento, no sale «Tu alojamiento»')
    await ev("document.querySelector('[data-donde-dormir]').scrollIntoView(); true")
    await a.esp(600)
    await a.captura(`${CAP}/D3_hoteles.jpg`)
    // Con alojamiento: su tarjeta arriba y las actividades en lista
    await ev("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); const dia = s.route.days[0]; m.useRouteStore.setState({ accommodationSelections: { ...s.accommodationSelections, [dia.id]: { name: 'Hotel Palatino', precio: null } } }); return true })")
    await a.esp(1500)
    const con = await ev("({ tu: document.querySelector('[data-tu-alojamiento]')?.innerText.replace(/\\s+/g, ' '), otras: document.body.innerText.includes('OTRAS OPCIONES'), lista: getComputedStyle(document.querySelector('[data-actividades] [data-actividad]').parentElement).flexDirection })")
    debe(/TU ALOJAMIENTO/.test(con.tu ?? '') && /Hotel Palatino/.test(con.tu ?? '') && con.otras && con.lista === 'row', 'alojamiento', 'con alojamiento: su tarjeta arriba, «Otras opciones» y las actividades en CARRUSEL como siempre (V28: ya no en lista)')
    await ev("document.querySelector('[data-pagina-destino]').scrollTo(0, 0); true")
    await a.esp(400)
    await a.captura(`${CAP}/D2_con_alojamiento.jpg`)
    await ev("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ accommodationSelections: {} }); return true })")
  } finally {
    await a.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
