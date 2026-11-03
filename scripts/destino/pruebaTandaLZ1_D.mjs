// LZ1, apartado 4 y fotos (agente D): Civitatis en español de Lanzarote y las fotos con crédito. No usa navegador ni servidor.
//   node scripts/destino/pruebaTandaLZ1_D.mjs
import fs from 'node:fs'
import { stampCivitatis, isCivitatisUrl } from '../../shared/affiliate/civitatis.js'

const fallos = []
let n = 0
const debe = (cond, regla, texto) => {
  n++
  if (!cond) fallos.push({ regla, texto })
}
const json = (r) => JSON.parse(fs.readFileSync(r, 'utf8'))
const civ = json('data/dias/lanzarote/_civitatis.json')
const fotos = json('data/dias/lanzarote/_fotos.json')

// ── Excursiones: cada una con enlace en español, precio, nota, opiniones, duración y cancelación (o `verificar`) ──
const LISTA = [...civ.excursiones, ...civ.free_tours]
debe(civ.excursiones.length >= 20, 'D1', `hay ${civ.excursiones.length} excursiones (se esperaban al menos 20)`)
debe(/^\d{4}-\d{2}-\d{2}$/.test(civ.comprobado ?? ''), 'D2', 'falta «comprobado: <fecha>» arriba')
for (const e of LISTA) {
  const quien = e.id
  debe(/^https:\/\/www\.civitatis\.com\/es\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(e.url), 'D3', `${quien}: el enlace no es una página en español de Civitatis (${e.url})`)
  debe(e.url === `https://www.civitatis.com/es/${e.civitatis_ciudad}/${e.civitatis_slug}/`, 'D3b', `${quien}: la url no sale de ciudad + slug`)
  debe(!/aid=|cmp=/.test(e.url), 'D4', `${quien}: el enlace lleva el código escrito a mano (debe ponerlo la app)`)
  const sellado = new URL(stampCivitatis(e.url, { campaignCode: 'prueba' }))
  debe(sellado.searchParams.get('aid') === '5206' && sellado.searchParams.get('cmp') === 'prueba', 'D5', `${quien}: la app no le pone aid y campaña`)
  debe(isCivitatisUrl(e.url), 'D5b', `${quien}: no es de Civitatis`)
  debe(typeof e.name === 'string' && e.name.length > 5 && !/\b(Day Trip|Tour of|Hike)\b/.test(e.name), 'D6', `${quien}: nombre no está en español (${e.name})`)
  debe(typeof e.price_from_eur === 'number' && e.price_from_eur >= 0, 'D7', `${quien}: precio en euros`)
  debe(e.rating_max === 10 && (e.rating === null ? !!e.verificar || !!e.nota_dato : e.rating > 0 && e.rating <= 10), 'D8', `${quien}: nota (o verificar)`)
  debe(Number.isInteger(e.review_count) && e.review_count > 0, 'D9', `${quien}: opiniones`)
  debe(typeof e.duration_label === 'string' && e.duration_label.length > 0, 'D10', `${quien}: duración`)
  debe(typeof e.cancellation === 'string' && e.cancellation.length > 0, 'D11', `${quien}: cancelación`)
  debe(/^2026-\d{2}-\d{2}/.test(e.checked ?? ''), 'D12', `${quien}: falta «checked»`)
  debe(/^https:\/\/f\.civitatis\.com\/espana\//.test(e.photo_url ?? ''), 'D13', `${quien}: foto de los servidores públicos de Civitatis`)
}
// Las ocho de LANZAROTE_SITIOS / DATOS_CIVITATIS que el borrador pedía
for (const id of ['graciosa_velero', 'lanzarote_completo', 'timanfaya_jameos', 'timanfaya_medio_dia', 'sur_lanzarote', 'cesar_manrique', 'kayak_papagayo', 'fuerteventura', 'isla_lobos', 'senderismo_volcanes', 'catamaran_atardecer'])
  debe(civ.excursiones.some((e) => e.id === id), 'D14', `falta la excursión ${id}`)
// Los datos de la tabla de Eric/docs coinciden con la web española (comprobados el 3-nov)
const por = Object.fromEntries(civ.excursiones.map((e) => [e.id, e]))
debe(por.graciosa_velero?.rating === 9.1 && por.graciosa_velero?.review_count >= 2300, 'D15', 'La Graciosa: 9,1 y unas 2.332 opiniones')
debe(por.sur_lanzarote?.rating === 8.1 && por.sur_lanzarote?.price_from_eur === 65, 'D15', 'Sur: 8,1 y 65 €')
debe(por.kayak_papagayo?.rating === 9.5 && por.kayak_papagayo?.duration_label === '4 h', 'D15', 'Kayak Papagayo: 9,5 y 4 h')
debe(por.salinas_janubio?.price_from_eur === 22, 'D15', 'Janubio: 22 €')

// ── Free Tour: días y horas, punto de encuentro ──
for (const f of civ.free_tours) {
  debe(f.price_from_eur === 0, 'D16', `${f.id}: debe ser gratis`)
  debe(f.meeting_point && f.dias?.length > 0 && f.horas && Object.keys(f.horas).length > 0, 'D17', `${f.id}: días, horas y punto de encuentro`)
  for (const [dia, hs] of Object.entries(f.horas ?? {})) debe(hs.every((h) => /^\d{2}:\d{2}$/.test(h)), 'D17b', `${f.id}: hora mal escrita en ${dia}`)
  debe(f.zona_horaria === 'Atlantic/Canary', 'D18', `${f.id}: zona horaria`)
}
debe(JSON.stringify(civ.free_tours[0].dias) === JSON.stringify(['martes', 'jueves']), 'D17c', 'Teguise: martes y jueves')

// ── API (sandbox): qué resuelve ──
debe(civ.api_sandbox?.comprobado, 'D19', 'falta el resultado de la API (sandbox)')
const resolver = json('data/civitatis/lanzarote_resolver.json')
debe(resolver.resueltos.length >= civ.excursiones.length, 'D20', 'el resolver no recorrió todas las excursiones')
for (const e of civ.excursiones) {
  const r = resolver.resueltos.find((x) => x.id === e.id)
  debe(r && (r.ok ? r.activity_id === e.api_activity_id : e.api_activity_id === null), 'D21', `${e.id}: el número de la API en _civitatis.json no cuadra con lanzarote_resolver.json`)
}

// ── Fotos: portada con crédito, cada foto con su fichero y su crédito ──
debe(fotos.portada?.credito?.autor && fotos.portada?.credito?.licencia && fotos.portada?.credito?.enlace, 'F1', 'la portada no lleva crédito completo')
debe(fs.existsSync(`public/fotos/lanzarote/${fotos.portada.archivo}`) && fs.existsSync(`public/fotos/lanzarote/${fotos.portada.ruta_tarjeta}`), 'F2', 'faltan los ficheros de la portada')
debe((fotos.portadas_candidatas ?? []).length >= 3 && fotos.portadas_candidatas.length <= 5, 'F3', 'tienen que ser de 3 a 5 candidatas a portada')
for (const c of fotos.portadas_candidatas ?? []) debe(fs.existsSync(c.ruta) && fs.existsSync(c.ruta_tarjeta) && c.autor && c.licencia && c.enlace, 'F3b', `candidata ${c.opcion}: fichero o crédito`)
const LIBRE = /^(CC0|Public domain|CC BY(-SA)? \d)/
for (const f of fotos.fotos) {
  debe(fs.existsSync(`public/fotos/lanzarote/${f.archivo}`) && fs.existsSync(`public/fotos/lanzarote/${f.archivo.replace('.jpg', '_p.jpg')}`), 'F4', `${f.archivo}: falta el fichero (grande o _p)`)
  debe(f.credito?.autor && f.credito?.licencia && /^https:\/\/commons\.wikimedia\.org\//.test(f.credito?.enlace ?? ''), 'F5', `${f.archivo}: sin crédito completo`)
  debe(LIBRE.test(f.credito?.licencia ?? ''), 'F6', `${f.archivo}: licencia no libre (${f.credito?.licencia})`)
}
debe(fotos.fotos.filter((f) => f.cuando === 'dia').length >= 25, 'F7', 'menos de 25 fotos de sitios')
// Roma no cambia
const roma = json('data/dias/roma/_fotos.json')
debe(roma.carpeta === '/fotos/roma', 'R1', 'Roma: _fotos.json tocado')
const portadaTs = fs.readFileSync('src/lib/portadaViaje.ts', 'utf8')
debe(/roma: \{ url: '\/fotos\/roma\/dia_coliseo_p\.jpg'/.test(portadaTs) && /lanzarote: \{ url: '\/fotos\/lanzarote\/portada_lanzarote_p\.jpg'/.test(portadaTs), 'R2', 'portadaViaje.ts: Roma igual y Lanzarote con su portada')

console.log(`${n} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
