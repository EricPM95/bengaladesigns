// RETOQUES_TARJETAS §5b y §5d (agente B): EXPLORAR de Lanzarote — categorías con foto e icono, y el mapa, los filtros y «En tu ruta» con sus números de verdad.
//   API_URL=http://localhost:8787 APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaRetoquesExplorar.mjs
// La API tiene que enseñar Lanzarote (DESTINOS_OCULTOS='-'). El apartado del navegador usa un Chrome por la cola y se salta si no hay APP_URL.
import fs from 'node:fs'
import path from 'node:path'

const API = process.env.API_URL ?? 'http://localhost:8787'
const fallos = []
let n = 0
const debe = (cond, regla, texto) => {
  n++
  if (!cond) fallos.push({ regla, texto })
}
const json = (r) => JSON.parse(fs.readFileSync(r, 'utf8'))
const post = async (u, b) => (await fetch(API + u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json()

// ── 1. El catálogo que recibe EXPLORAR: toda parada con su categoría y su coordenada ──
const lz = await post('/api/destination-places', { destination: 'Lanzarote' })
const sitios = (lz.places ?? []).filter((p) => p.kind === 'place')
debe(sitios.length >= 34, 'C1', `Lanzarote: ${sitios.length} sitios`)
debe(sitios.every((p) => p.filter_category), 'C2', `sitios sin categoría de filtro: ${sitios.filter((p) => !p.filter_category).map((p) => p.name).join(', ')}`)
debe(sitios.every((p) => Number.isFinite(p.coordinates?.lat) && Number.isFinite(p.coordinates?.lng) && Math.abs(p.coordinates.lat) > 1), 'C3', 'todo sitio con coordenada')
const cuenta = (cats) => sitios.filter((p) => cats.includes(p.filter_category)).length
const atracciones = cuenta(['monumentos', 'museos_arte', 'iglesias'])
const miradores = cuenta(['miradores'])
debe(atracciones > 0 && miradores > 0, 'C4', `«Atracciones» ${atracciones} y «Miradores» ${miradores} no pueden ser 0`)
debe(atracciones + miradores === sitios.length, 'C5', 'los dos filtros cubren todos los sitios')
const por = Object.fromEntries(sitios.map((p) => [p.name, p]))
debe(por['Mirador del Río']?.filter_category === 'miradores' && por['Salinas de Janubio']?.filter_category === 'miradores', 'C6', 'los miradores, con Miradores')
debe(por['Fundación César Manrique']?.filter_category === 'museos_arte' && por['Montañas del Fuego (Timanfaya)']?.filter_category === 'monumentos', 'C7', 'un museo con Museos y arte, un volcán con Atracciones')
// «En tu ruta»: las paradas que parten un sitio llevan sus nombres
debe((por['Haría y la Casa-Museo César Manrique']?.nombres_en_ruta ?? []).length === 2 && (por['Playa Blanca y el Faro de Pechiguera']?.nombres_en_ruta ?? []).length === 2, 'C8', 'nombres_en_ruta de Haría y de Playa Blanca')
// El fallback es solo para destinos sin categorías: Roma sale tal cual está en sus datos
const roma = await post('/api/destination-places', { destination: 'Roma' })
const datosRoma = json('data/pipeline_v2/roma.json')
const escritas = new Map([...datosRoma.places, ...(datosRoma.lugares_solo_lista ?? [])].map((p) => [p.name, p.filter_category ?? null]))
const distintas = (roma.places ?? []).filter((p) => p.kind === 'place' && escritas.has(p.name) && escritas.get(p.name) !== p.filter_category)
debe((roma.places ?? []).length > 60 && distintas.length === 0, 'R1', `Roma: la categoría de cada sitio sigue siendo la de sus datos (${distintas.map((p) => p.name).join(', ')})`)
debe((roma.places ?? []).filter((p) => p.kind === 'place').every((p) => !p.nombres_en_ruta?.length), 'R2', 'Roma no lleva nombres_en_ruta')

// ── 2. Las categorías: foto propia e icono que cuadre, del juego de la app ──
const fuente = fs.readFileSync('src/lib/exploreLanzarote.ts', 'utf8')
const iconos = fs.readFileSync('src/lib/iconos.ts', 'utf8')
const esperado = { volcanes: ['montana', 'Montañas del Fuego (Timanfaya)'], cesar_manrique: ['arte', 'Jameos del Agua'], playas_y_charcos: ['ola', 'Playas de Papagayo'], miradores: ['mirador', 'Mirador del Río'], pueblos: ['casa', 'Teguise (villa)'], bodegas: ['copa', 'La Geria y sus bodegas'] }
for (const [id, [icono, foto]] of Object.entries(esperado)) {
  const bloque = fuente.slice(fuente.indexOf(`id: '${id}',`), fuente.indexOf(`id: '${id}',`) + 400)
  debe(bloque.includes(`icono: '${icono}'`) && bloque.includes(`foto: '${foto}'`), 'K1', `${id}: icono ${icono} y foto ${foto}`)
  debe(new RegExp(`^  ${icono}: '`, 'm').test(iconos), 'K2', `el icono ${icono} existe en el juego de iconos`)
  const f = await post('/api/place-photo', { name: foto, city: 'Lanzarote' })
  debe(f.photo_source === 'propia' && /^\/fotos\/lanzarote\//.test(f.photo_url ?? '') && !f.photo_credit, 'K3', `${id}: la foto de ${foto} es nuestra y sin crédito (${f.photo_source})`)
}

// ── 3. En el navegador: tarjetas con foto e icono; dentro de una categoría el mapa con sus pines y los filtros con números ──
const APP = process.env.APP_URL
if (APP) {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)")
    await a.esp(3000)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    await R("st().setMode('explore'); return true")
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-explorar-categorias]'))")); i++) await a.esp(500)
    await a.esp(4000)
    const tarjetas = await ev(`(() => Array.from(document.querySelectorAll('[data-explorar-categorias] > button')).map((b) => ({ texto: (b.innerText || '').split('\\n')[0].trim(), fondo: Array.from(b.querySelectorAll('span')).map((s) => s.style.background || '').join('|'), svg: b.querySelector('svg path')?.getAttribute('d') ?? '' })))()`)
    const delJuego = (nombre) => new RegExp(`^  ${nombre}: '([^']+)'`, 'm').exec(iconos)?.[1]
    for (const [id, etiqueta] of [['volcanes', 'Volcanes'], ['cesar_manrique', 'César Manrique'], ['playas_y_charcos', 'Playas y charcos'], ['miradores', 'Miradores'], ['pueblos', 'Pueblos'], ['bodegas', 'Bodegas']]) {
      const t = tarjetas.find((x) => x.texto === etiqueta)
      debe(t && /\/fotos\/lanzarote\//.test(t.fondo), 'B1', `la tarjeta ${etiqueta} lleva foto de Lanzarote`)
      debe(t && t.svg === delJuego(esperado[id][0]), 'B2', `la tarjeta ${etiqueta} lleva el icono ${esperado[id][0]}`)
    }
    // Dentro de «Volcanes»: la lista, el mapa con pines y los números de los filtros
    const abrir = async (etiqueta) => {
      await ev(`(() => { const b = Array.from(document.querySelectorAll('[data-explorar-categorias] > button')).find((x) => (x.innerText || '').trim().startsWith(${JSON.stringify(etiqueta)})); b?.click(); return Boolean(b) })()`)
      await a.esp(4500)
    }
    const estado = () => ev(`(() => {
      const pines = Array.from(document.querySelectorAll('.mapboxgl-marker'))
      const visibles = pines.filter((m) => m.firstElementChild && getComputedStyle(m.firstElementChild).opacity !== '0' && m.firstElementChild.style.opacity !== '0')
      const chips = Array.from(document.querySelectorAll('button')).map((b) => (b.innerText || '').replace(/\\s+/g, ' ').trim()).filter((t) => /^(Atracciones|Miradores|Entradas) \\d+$/.test(t))
      return { pines: pines.length, visibles: visibles.length, chips, enRuta: (document.body.innerText.match(/En tu ruta · (\\d+)/) || [])[1] ?? null, lista: Array.from(document.querySelectorAll('[role=dialog] h3, h3')).length }
    })()`)
    await abrir('Volcanes')
    const v = await estado()
    console.log('  (Volcanes)', JSON.stringify(v))
    debe(v.visibles >= 5, 'B3', `Volcanes: el mapa enseña un pin por sitio (${v.visibles} a la vista de ${v.pines})`)
    debe(v.chips.some((c) => /^Atracciones [1-9]/.test(c)), 'B4', `Volcanes: el filtro Atracciones tiene su número (${v.chips.join(' · ')})`)
    debe(v.enRuta !== null, 'B5', 'Volcanes: «En tu ruta» sale')
    // Encender «Atracciones» deja en el mapa solo lo de ese filtro, y el número coincide
    await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Atracciones \\d+$/.test((x.innerText || '').replace(/\\s+/g, ' ').trim())); b?.click(); return Boolean(b) })()")
    await a.esp(1500)
    const v2 = await estado()
    const nAtr = Number((v.chips.find((c) => /^Atracciones/.test(c)) ?? '').replace(/\D/g, ''))
    debe(v2.visibles === nAtr, 'B6', `Volcanes › Atracciones: ${v2.visibles} pines a la vista y el filtro dice ${nAtr}`)
    await a.captura(path.resolve('docs/dias/capturas_jutrip/retoques_explorar_volcanes.jpg'))
    await ev("(() => { const b = document.querySelector('button[aria-label=Cerrar], button[aria-label=Atrás], button[aria-label=Volver]'); b?.click(); return true })()")
    await a.esp(1200)
    // «Miradores»: lista, pines y filtro de miradores
    await abrir('Miradores')
    const m = await estado()
    console.log('  (Miradores)', JSON.stringify(m))
    debe(m.visibles >= 5 && m.chips.some((c) => /^Miradores [1-9]/.test(c)), 'B7', `Miradores: pines y filtro con número (${m.visibles}; ${m.chips.join(' · ')})`)
    await a.captura(path.resolve('docs/dias/capturas_jutrip/retoques_explorar_miradores.jpg'))
    await ev("(() => { const b = document.querySelector('button[aria-label=Cerrar], button[aria-label=Atrás], button[aria-label=Volver]'); b?.click(); return true })()")
    await a.esp(1200)
    // «En tu ruta»: la ruta de Lanzarote lleva Haría y Playa Blanca (paradas partidas) y se reconocen
    await abrir('Pueblos')
    const p = await estado()
    console.log('  (Pueblos)', JSON.stringify(p))
    const enRuta = Number(p.enRuta)
    const stops = await R("return route().days.flatMap((d) => d.stops.map((s) => s.name))")
    const n2 = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const pueblos = ['Teguise (villa)', 'Haría y la Casa-Museo César Manrique', 'Caleta de Famara y Playa de Famara', 'El Golfo y el Charco de los Clicos', 'Punta Mujeres y Arrieta (La Garita)', 'Arrecife: Charco de San Ginés y el paseo', 'Puerto del Carmen (Puerto Viejo)', 'Playa Blanca y el Faro de Pechiguera']
    const esperadoEnRuta = pueblos.filter((nombre) => {
      const sitio = por[nombre]
      return [nombre, ...(sitio?.nombres_en_ruta ?? [])].some((x) => stops.some((s) => n2(s) === n2(x)))
    }).length
    debe(enRuta === esperadoEnRuta, 'B8', `Pueblos: «En tu ruta · ${enRuta}» y hay ${esperadoEnRuta} sitios de Pueblos en la ruta`)
  } finally {
    await a.cerrar?.()
  }
} else {
  console.log('  (sin APP_URL: se salta el apartado del navegador)')
}

console.log(`Prueba de EXPLORAR de Lanzarote (retoques): ${n} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
