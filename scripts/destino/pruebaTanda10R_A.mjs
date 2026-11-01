// Prueba de la 10R, agente A: los datos de las excursiones de Roma (enlaces, siete datos de la tabla, sin tachados a mano, «Precio orientativo», «No reembolsable», Venecia, fotos de Civitatis).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10R_A.mjs [sinNavegador=1] [capturas=1]
// Necesita la API en 8787 (y el Vite en 5173 con el código nuevo para la parte del navegador). Un Chrome, por la cola.
import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const API = process.env.API_URL ?? 'http://localhost:8787'
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const fallos = []
let n = 0
const debe = (cond, texto) => {
  n++
  if (!cond) fallos.push(texto)
}

// ── 1. Los datos (roma.json) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const opciones = roma.excursions.options
const por = Object.fromEntries(opciones.map((o) => [o.id, o]))
const CH = '2026-10-26 (Eric, web de Civitatis)'
// (10S9) antes → ahora → decisión de Eric (10S9, 1-nov): Nápoles y Pompeya en tren: cancelación null → 'no_reembolsable' (web, 1-nov; mismo aviso que Florencia en tren) y comprobado 26-oct → 1-nov;
// Ostia Antica entra en la tabla (antes solo se miraba su enlace): 9,6/10, 294 opiniones, 3 h, gratuita hasta 3 días antes, comprobado 2026-11-01. Ninguna comprobación baja de fuerza: se añaden.
const CH_1NOV = '2026-11-01 (web de Civitatis)'
const TABLA = {
  pompeya_sorrento: { slug: 'excursion-pompeya-sorrento', nombre: 'Excursión a Pompeya y Sorrento', precio: 98.26, nota: 8.3, op: 793, dur: '12-13 h', canc: 'gratuita' },
  napoles_pompeya_tren: { slug: 'excursion-pompeya-tren', nombre: 'Excursión a Nápoles y Pompeya en tren de alta velocidad', precio: 139, nota: 8.7, op: 343, dur: '12 h', canc: 'no_reembolsable', ch: CH_1NOV },
  florencia_pisa: { slug: 'excursion-florencia-pisa', nombre: 'Excursión a Florencia y Pisa', precio: 95.4, nota: 8.6, op: 704, dur: '14 h', canc: 'gratuita' },
  costa_amalfitana: { slug: 'excursion-amalfi-positano', nombre: 'Excursión a la Costa Amalfitana en autobús + Barco a Positano y Amalfi', precio: 115, nota: 7.9, op: 60, dur: '15 h 30', canc: 'gratuita' },
  tivoli_villas: { slug: 'excursion-villa-adriana-villa-este', nombre: 'Excursión a Tívoli', precio: 118.8, nota: 8.7, op: 725, dur: null, canc: 'gratuita' },
  florencia_tren: { slug: 'excursion-florencia', nombre: 'Excursión a Florencia en tren de alta velocidad', precio: 149, nota: 8.6, op: 689, dur: '12 h 15 - 13 h', canc: 'no_reembolsable' },
  ostia_antica: { slug: 'excursion-ostia-antica', nombre: 'Excursión a Ostia Antica', precio: 52, nota: 9.6, op: 294, dur: '3 h', canc: 'gratuita', ch: CH_1NOV },
  venecia_tren: { slug: 'excursion-venecia', nombre: 'Excursión a Venecia en tren de alta velocidad', precio: 243.95, nota: 9, op: 315, dur: '15 h', canc: 'gratuita' },
}
for (const [id, t] of Object.entries(TABLA)) {
  const o = por[id]
  debe(Boolean(o), `${id}: no está en la lista de excursiones`)
  if (!o) continue
  debe(o.civitatis_slug === t.slug, `${id}: enlace ${o.civitatis_slug} (debería ser ${t.slug})`)
  debe(o.name === t.nombre, `${id}: nombre «${o.name}»`)
  debe(o.price_from_eur === t.precio, `${id}: precio ${o.price_from_eur} (${t.precio})`)
  debe(o.rating === t.nota && o.rating_max === 10, `${id}: nota ${o.rating}/${o.rating_max} (${t.nota}/10)`)
  debe(o.review_count === t.op, `${id}: opiniones ${o.review_count} (${t.op})`)
  debe((o.duration_label ?? null) === t.dur || (t.dur === null && !o.duration_label), `${id}: duración «${o.duration_label}» (${t.dur})`)
  debe((o.cancellation ?? null) === t.canc, `${id}: cancelación ${o.cancellation} (${t.canc})`)
  debe(o.checked === (t.ch ?? CH), `${id}: sin «comprobado: ${t.ch ?? CH}»`)
  debe(!('provisional_pricing' in o), `${id}: sigue con provisional_pricing`)
  debe(/^https:\/\/cdn2\.civitatis\.com\//.test(o.photo_url ?? '') && !/qa\./.test(`${o.photo_url}${o.photo_url_big}`), `${id}: su foto no es de un servidor público de Civitatis (${o.photo_url})`)
  debe(/^\d{4}-\d{2}-\d{2}$/.test(o.photo_checked ?? ''), `${id}: la foto no lleva la fecha`)
}
debe(opciones.every((o) => !('provisional_pricing' in o)), 'alguna excursión sigue con provisional_pricing')
debe(!opciones.some((o) => 'price_before' in o || 'price_original' in o || 'precio_tachado' in o), 'queda un precio tachado escrito a mano')
debe(por.ostia_antica?.civitatis_slug === 'excursion-ostia-antica', 'Ostia Antica cambió de enlace')
debe(por.venecia_tren && por.venecia_tren.half_day === false && Array.isArray(por.venecia_tren.destination_coords) && por.venecia_tren.destination_coords.length === 2, 'Venecia: sin coordenadas o sin ser de día entero')
debe(Boolean(por.venecia_tren?.meeting_point) && (por.venecia_tren?.description ?? '').length > 40 && !/civitatis/i.test(por.venecia_tren.description), 'Venecia: sin punto de encuentro o sin descripción nuestra')
debe(por.florencia_tren?.cancellation === 'no_reembolsable', 'Florencia en tren: no dice «no reembolsable»')
debe(por.napoles_pompeya_tren?.cancellation === 'no_reembolsable', 'Nápoles y Pompeya en tren: no dice «no reembolsable» (10S9)')
debe(por.ostia_antica?.meeting_point === 'Piazzale Ostiense (salida del metro Piramide)' && por.ostia_antica?.cancellation_note === 'Gratuita hasta 3 días antes', 'Ostia Antica: punto de encuentro o nota de cancelación (10S9)')

// ── 2. El servidor (lo que recibe la app) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const r = await fetch(`${API}/api/destination-excursions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })
const j = await r.json()
const lista = j.excursions ?? []
const ids = lista.map((e) => e.id)
debe(ids.includes('venecia_tren'), 'Venecia no sale en la lista de Excursiones del servidor')
for (const [id, t] of Object.entries(TABLA)) {
  const e = lista.find((x) => x.id === id)
  debe(Boolean(e), `${id}: no sale en la lista del servidor`)
  if (!e) continue
  debe(e.rating === t.nota && e.rating_max === 10 && e.review_count === t.op, `${id}: el servidor da nota ${e.rating}/${e.rating_max} (${e.review_count})`)
  debe(e.price_orientativo === true, `${id}: sin la API debería llevar «precio orientativo»`)
  debe(!('provisional_pricing' in e), `${id}: el servidor aún manda provisional_pricing`)
  debe(e.civitatis_url === `https://www.civitatis.com/es/roma/${t.slug}/`, `${id}: enlace ${e.civitatis_url}`)
  debe(Boolean(e.photo_url), `${id}: sin foto de Civitatis en el servidor`)
  debe(e.cancellation === t.canc, `${id}: cancelación ${e.cancellation}`)
}
debe(Boolean(j.rating) && j.rating.excursions >= 7, 'la valoración media no cuenta las notas nuevas')
for (const url of lista.map((e) => e.photo_url).filter(Boolean)) {
  const h = await fetch(url, { method: 'HEAD' }).catch(() => null)
  debe(h?.ok === true, `la foto no responde: ${url}`)
}

// Con la API de consulta (ficha real) el precio ya no es «orientativo»: lo comprueba la parte de pruebaCivitatis1 (enriquecerExcursiones → `civitatis` → price_orientativo false).

// ── 2b. La página del día 4 (ExcursionDayPage): lo mismo, por id (tivoli → tivoli_villas, florencia → florencia_tren) ─────────────────────────────────────
{
  const { excursionPagePayload } = await import('../../server/engine/excursionPage.js')
  const { findPipelineV2Data } = await import('../../server/routeAlgorithm.js')
  const pagina = excursionPagePayload('roma', findPipelineV2Data('Roma'))
  const mapa = { pompeya_sorrento: 'pompeya_sorrento', tivoli: 'tivoli_villas', ostia_antica: 'ostia_antica', florencia: 'florencia_tren', costa_amalfitana: 'costa_amalfitana' }
  for (const [idPagina, idOpcion] of Object.entries(mapa)) {
    const p = pagina?.options.find((x) => x.id === idPagina)
    debe(Boolean(p), `día 4: falta ${idPagina}`)
    if (!p) continue
    debe(p.photo?.url === por[idOpcion].photo_url_big && p.photo.credit === '', `día 4 ${idPagina}: no usa la foto de Civitatis`)
    debe(p.price_from === por[idOpcion].price_from_eur && p.price_orientativo === true, `día 4 ${idPagina}: precio ${p.price_from} / orientativo ${p.price_orientativo}`)
    debe((p.cancellation ?? null) === (por[idOpcion].cancellation ?? null), `día 4 ${idPagina}: cancelación ${p.cancellation}`)
  }
  debe(pagina?.options.find((x) => x.id === 'florencia')?.cancellation === 'no_reembolsable', 'día 4: Florencia no dice «no reembolsable»')
}

// ── 3. En la pantalla ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (args.sinNavegador !== '1') {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let intento = 0; intento < 3; intento++) {
      try {
        await ev('window.__rutaPrueba().then(() => true)')
        break
      } catch (e) {
        if (intento === 2) throw e
        await ev('location.reload()').catch(() => undefined)
        await a.esp(5000)
      }
    }
    for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(2000)
    await ev("(async () => { const S = await import('/src/store/useExcursionsStore.ts'); S.useExcursionsStore.getState().openPage(); return true })()")
    for (let i = 0; i < 40 && !(await ev("document.querySelectorAll('[role=dialog] li').length >= 8").catch(() => false)); i++) await a.esp(500)
    await a.esp(1500)
    const tarjetas = await ev(`Array.from(document.querySelectorAll('[role=dialog] ul > li')).map((li) => ({ titulo: li.querySelector('h2')?.textContent ?? '', texto: li.textContent ?? '', orientativo: !!li.querySelector('[data-precio-orientativo]'), noReemb: !!li.querySelector('[data-no-reembolsable]'), foto: li.querySelector('[role=img]')?.getAttribute('style') ?? '', html: li.innerHTML }))`)
    debe(tarjetas.length === 8, `la lista tiene ${tarjetas.length} tarjetas (8)`)
    const de = (t) => tarjetas.find((x) => x.titulo === t)
    for (const [id, t] of Object.entries(TABLA)) {
      const c = de(t.nombre)
      debe(Boolean(c), `${id}: no sale la tarjeta «${t.nombre}»`)
      if (!c) continue
      debe(c.orientativo, `${id}: sin «Precio orientativo» en la tarjeta`)
      debe(c.texto.includes(String(t.nota).replace('.', ',').replace(/^(\d)$/, '$1,0') + '/10') || c.texto.includes(t.nota.toLocaleString('es-ES', { minimumFractionDigits: 1 }) + '/10'), `${id}: la nota no sale sobre 10 (${c.texto.slice(0, 120)})`)
      debe(c.foto.includes('cdn2.civitatis.com'), `${id}: la tarjeta no usa la foto de Civitatis (${c.foto.slice(0, 80)})`)
      debe(!/civitatis/i.test(c.texto), `${id}: sale el nombre de la empresa en la tarjeta`)
      debe(c.noReemb === (t.canc === 'no_reembolsable'), `${id}: «No reembolsable» ${c.noReemb ? 'sale' : 'no sale'}`)
      if (t.canc === 'no_reembolsable') debe(/No reembolsable/.test(c.texto), `${id}: el aviso no dice «No reembolsable»`)
    }
    debe(!tarjetas.some((c) => /<s>|<del|line-through/.test(c.html)), 'hay un precio tachado')
    if (args.capturas === '1') {
      fs.mkdirSync(SALIDA, { recursive: true })
      const ir = async (titulo) => {
        await ev(`(() => { const li = Array.from(document.querySelectorAll('[role=dialog] ul > li')).find((x) => x.querySelector('h2')?.textContent === ${JSON.stringify(titulo)}); li?.scrollIntoView({ block: 'center' }); return true })()`)
        await a.esp(900)
      }
      await ev("document.querySelector('[role=dialog] .overflow-y-auto')?.scrollTo(0, 0); true")
      await a.esp(900)
      await a.captura(path.join(SALIDA, '10r_excursiones_01_lista.jpg'))
      await ir(TABLA.venecia_tren.nombre)
      await a.captura(path.join(SALIDA, '10r_excursiones_02_venecia.jpg'))
      await ir(TABLA.florencia_tren.nombre)
      await a.captura(path.join(SALIDA, '10r_excursiones_03_florencia_tren.jpg'))
    }
  } finally {
    a.cerrar()
  }
}

console.log(`pruebaTanda10R_A: ${n} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(' ✗', f)
process.exit(fallos.length ? 1 : 0)
