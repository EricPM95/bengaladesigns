// La prueba de la Tanda 6y3, parte de las fotos: las 10 fotos equivocadas no salen, `_fotos_wikimedia.json` no guarda ninguna rechazada,
// la página de candidatas tiene 3 por cada una de las dos nuevas y las fotos buenas siguen igual.
//   node scripts/destino/pruebaFase6y3_fotos.mjs                              (sin servidor: todo menos lo que responde el servidor de verdad)
//   SERVIDOR=http://localhost:8803 node scripts/destino/pruebaFase6y3_fotos.mjs   (con tu servidor encendido, comprueba también eso)
// Da fallo si:
//   1. `fotos_rechazadas` no tiene las 10 (las 8 de la 6y2 + Tívoli + Pompeya y Sorrento) con su motivo, o `fotoOculta` no las oculta;
//   2. (con servidor) alguna de las 10 responde con foto, o las buenas dejan de salir como siempre;
//   3. `_fotos_wikimedia.json` guarda un sitio rechazado o uno de los 6 ficheros equivocados, o ha perdido una foto buena;
//   4. `creditosWikimedia.mjs` no respeta `fotos_rechazadas` (los volvería a añadir);
//   5. la página de candidatas no tiene 3 candidatas (o su aviso) para Tívoli y Pompeya y Sorrento, con autor enlazado y utm_source.
import fs from 'node:fs'

let fallos = 0
let comprobaciones = 0
const ok = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos++
    console.log(`  ✗ ${texto}`)
  }
}
const leer = (p) => fs.readFileSync(p, 'utf8')

const TIVOLI = "Excursión a Tívoli — Villa d'Este y Villa Adriana"
const POMPEYA = 'Excursión a Pompeya y Sorrento'
const OCHO = [
  'Cripta de los Capuchinos',
  'Trastevere al atardecer',
  'Via dei Coronari',
  'Borgo Pio',
  'Excursión a Florencia y Pisa',
  'Excursión a Nápoles y Pompeya en tren',
  'Excursión a la Costa Amalfitana',
  'Excursión a Florencia en tren de alta velocidad',
]
const DIEZ = [...OCHO, TIVOLI, POMPEYA]
const FICHEROS_MALOS = [
  '6h-orologioQuirinale.jpg',
  'MauriceManuscript.jpg',
  'Notre-Dame_de_la_Garde_aerial_view_2020.jpeg',
  "Passetto_di_Borgo_from_Castel_Sant'Angelo_01.jpg",
  'Vueling_A320neo_(EC-NFH)_@_MAN,_September_2020.jpg',
  'Wien_-_Kapuzinergruft,_Maria-Theresia-Gruft_(1).JPG',
]

// ── 1. La lista y la regla ──
console.log('La lista de fotos rechazadas')
const tabla = JSON.parse(leer('data/dias/roma/_fotos.json'))
const W = await import('../../server/engine/writtenDays.js')
{
  const lista = tabla.fotos_rechazadas ?? []
  // Las 10 de siempre + las 2 de Museos Vaticanos (Tanda 8B3: fuera la foto de dentro de la Capilla Sixtina).
  ok(lista.length === DIEZ.length + 2 && lista.filter((r) => /Museos Vaticanos/.test(r.lugar)).length === 2, `1a fotos_rechazadas tiene ${lista.length} sitios y deberían ser ${DIEZ.length + 2} (las 10 y las 2 de Museos Vaticanos)`)
  ok(DIEZ.every((n) => lista.some((r) => r.lugar === n)), `1b faltan en la lista: ${DIEZ.filter((n) => !lista.some((r) => r.lugar === n)).join(' | ')}`)
  ok(lista.every((r) => typeof r.motivo === 'string' && r.motivo.trim().length > 20), '1c algún sitio no lleva su motivo escrito')
  const motivo = (n) => lista.find((r) => r.lugar === n)?.motivo ?? ''
  ok(/Posillipo|Nápoles/.test(motivo(TIVOLI)), '1d el motivo de Tívoli no dice que salía una gruta de Nápoles')
  ok(/Unsplash/.test(motivo(POMPEYA)) && /confirmar/.test(motivo(POMPEYA)), '1e el motivo de Pompeya y Sorrento no dice que viene de Unsplash y no se pudo confirmar')
  ok(new Set(lista.map((r) => r.lugar)).size === lista.length, '1f hay un sitio repetido en la lista')
  ok(DIEZ.every((n) => W.fotoOculta('roma', n)), `1g fotoOculta no oculta: ${DIEZ.filter((n) => !W.fotoOculta('roma', n)).join(' | ')}`)
  ok(W.fotoOculta('roma', `${TIVOLI} (noche)`) && W.fotoOculta('roma', `${POMPEYA} de noche`), '1h fotoOculta no oculta la versión de noche de las dos nuevas')
  ok(!W.fotoOculta('roma', 'Plaza Colonna') && !W.fotoOculta('roma', 'Coliseo') && !W.fotoOculta('roma', 'Excursión a Ostia Antica') && !W.fotoOculta('roma', 'Isla Tiberina'), '1i fotoOculta oculta un sitio bueno')
}

// ── 2. Lo que responde el servidor de verdad ──
console.log('Lo que responde el servidor')
const SERVIDOR = process.env.SERVIDOR
if (!SERVIDOR) {
  console.log('  (sin SERVIDOR: ejecútala con SERVIDOR=http://localhost:8803 para comprobar lo que responde)')
} else {
  const pedir = async (name, extra = {}) => (await fetch(`${SERVIDOR}/api/place-photo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, city: 'Roma', ...extra }) })).json()
  const conFoto = []
  for (const nombre of [...DIEZ, `${TIVOLI} (noche)`, `${POMPEYA} de noche`]) {
    const j = await pedir(nombre)
    if (j.photo_source !== 'none' || j.photo_url || j.unsplash_small || j.photo_zone) conFoto.push(`${nombre} -> ${j.photo_source}`)
  }
  ok(conFoto.length === 0, `2a sitios rechazados que responden con foto: ${conFoto.join(' | ')}`)
  const lote = await (await fetch(`${SERVIDOR}/api/pool-photos`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', names: DIEZ }) })).json()
  ok(Object.keys(lote.photos ?? {}).length === 0, `2b /api/pool-photos da foto a: ${Object.keys(lote.photos ?? {}).join(' | ')}`)
  const forzada = await pedir(POMPEYA, { force: true, wikipedia_title: 'Pompeii' })
  ok(forzada.photo_source === 'none', '2c con force y un título de Wikipedia, Pompeya y Sorrento sigue buscando')
  // Las buenas siguen igual.
  const colonna = await pedir('Plaza Colonna')
  ok(colonna.photo_source === 'wikipedia' && colonna.photo_credit?.autor && colonna.photo_credit?.licencia, `2d Plaza Colonna ya no sale de Wikipedia con su crédito (${colonna.photo_source})`)
  const coliseo = await pedir('Coliseo')
  ok(coliseo.photo_source === 'propia' && /^\/fotos\/roma\//.test(coliseo.photo_url), '2e el Coliseo ha dejado de salir con su foto propia')
}

// ── 3. _fotos_wikimedia.json ──
console.log('_fotos_wikimedia.json')
const wiki = JSON.parse(leer('data/dias/roma/_fotos_wikimedia.json'))
{
  const rechazadas = new Set(DIEZ)
  const malos = (wiki.fotos ?? []).filter((f) => f.lugares.some((l) => rechazadas.has(l) || rechazadas.has(l.replace(/\s*\(noche\)$|\s+de noche$/i, ''))))
  ok(malos.length === 0, `3a guarda sitios rechazados: ${malos.map((f) => `${f.archivo} (${f.lugares.join(', ')})`).join(' | ')}`)
  const archivos = new Set((wiki.fotos ?? []).map((f) => f.archivo))
  ok(FICHEROS_MALOS.every((a) => !archivos.has(a)), `3b siguen los ficheros equivocados: ${FICHEROS_MALOS.filter((a) => archivos.has(a)).join(' | ')}`)
  ok((wiki.sin_autor ?? []).every((s) => !rechazadas.has(s.lugar)), '3c `sin_autor` guarda un sitio rechazado')
  ok((wiki.fotos ?? []).length === 21, `3d deberían quedar 21 fotos buenas y hay ${(wiki.fotos ?? []).length}`)
  for (const buena of ['Plaza Colonna', 'Campo de\' Fiori', 'Iglesia del Gesù', 'Isla Tiberina', 'Museos Vaticanos y Capilla Sixtina', 'Monti']) {
    ok((wiki.fotos ?? []).some((f) => f.lugares.includes(buena)), `3e ha desaparecido la foto buena de ${buena}`)
  }
}

// ── 4. creditosWikimedia.mjs respeta la lista ──
console.log('creditosWikimedia.mjs')
{
  const s = leer('scripts/destino/creditosWikimedia.mjs')
  ok(/fotos_rechazadas/.test(s) && /estaRechazada/.test(s), '4a el script no lee `fotos_rechazadas`')
  const nombres = s.slice(s.indexOf('function nombresDelDestino'), s.indexOf('/** En qué días'))
  ok(/filter\(\(n\) => !estaRechazada\(n\)\)/.test(nombres), '4b la lista de nombres que pide al servidor no deja fuera los rechazados')
  ok(/previo\.fotos = \(previo\.fotos \?\? \[\]\)\.filter/.test(s), '4c el script no quita lo que ya había de un sitio rechazado')
}

// ── 5. La página de candidatas ──
console.log('La página de candidatas')
{
  const RUTA = 'docs/dias/FOTOS_ROMA_CANDIDATAS.html'
  ok(fs.existsSync(RUTA), `5a no existe ${RUTA}`)
  const html = fs.existsSync(RUTA) ? leer(RUTA) : ''
  const datos = JSON.parse(leer('data/dias/roma/_fotos_candidatas_6y2.json'))
  ok(datos.entradas.length === 10, `5b los datos de candidatas tienen ${datos.entradas.length} sitios y deberían ser 10`)
  for (const lugar of DIEZ) ok(datos.entradas.some((e) => e.lugar === lugar), `5c los datos no cubren ${lugar}`)
  for (const lugar of [TIVOLI, POMPEYA]) {
    const e = datos.entradas.find((x) => x.lugar === lugar)
    const seccion = html.slice(html.indexOf(`<h2>${lugar}</h2>`))
    const bloque = seccion.slice(0, seccion.indexOf('</section>'))
    const imgs = (bloque.match(/<img /g) ?? []).length
    ok(bloque.length > 0 && (imgs === 3 || (imgs === 0 && /Sin candidatas buenas/.test(bloque))), `5d ${lugar}: ${imgs} fotos (tiene que haber 3, o el aviso «Sin candidatas buenas»)`)
    ok(e && e.candidatas.length === 3, `5e ${lugar}: los datos no tienen 3 candidatas`)
    ok((bloque.match(/https:\/\/images\.unsplash\.com\//g) ?? []).length === imgs, `5f ${lugar}: alguna foto no viene de images.unsplash.com`)
    ok((bloque.match(/utm_source=viajes_bengala/g) ?? []).length >= imgs * 2, `5g ${lugar}: faltan los enlaces con utm_source del autor y de la foto`)
    ok((e?.candidatas ?? []).every((c) => c.autor && bloque.includes(c.autor) && c.autor_url.includes('unsplash.com/@') && c.pagina.includes('utm_source=viajes_bengala')), `5h ${lugar}: alguna candidata sin autor enlazado`)
    ok((e?.candidatas ?? []).every((c) => c.nota && c.nota.length > 15), `5i ${lugar}: alguna candidata sin nota`)
    ok(/Pon una tuya|pon una tuya|Ninguna te convence/.test(bloque), `5j ${lugar}: no dice que Eric puede poner una suya`)
  }
  ok(!/UNSPLASH_ACCESS_KEY|Client-ID/i.test(html) && !/UNSPLASH_ACCESS_KEY|Client-ID/i.test(leer('data/dias/roma/_fotos_candidatas_6y2.json')), '5k la página o sus datos llevan una clave de Unsplash')
  if (SERVIDOR) {
    const urls = datos.entradas.slice(-2).flatMap((e) => e.candidatas.flatMap((c) => [c.small, c.regular]))
    const malas = []
    for (const u of urls) {
      try {
        const r = await fetch(u, { method: 'HEAD' })
        if (!r.ok) malas.push(`${r.status} ${u.slice(0, 70)}`)
      } catch (error) {
        malas.push(`${error.message} ${u.slice(0, 70)}`)
      }
    }
    ok(malas.length === 0, `5l direcciones de imagen que no responden: ${malas.join(' | ')}`)
  }
}

console.log(`\n6y3 (fotos): ${comprobaciones} comprobaciones, ${fallos} fallos.`)
process.exitCode = fallos === 0 ? 0 : 1
