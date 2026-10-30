// Tanda 10S3 (B) · apartado 9: la foto de NOCHE del Castillo de Sant'Angelo solo sale en la experiencia nocturna (y en general: ninguna foto de noche sale donde no toca).
//   node scripts/destino/pruebaTanda10S3_B.mjs      (con la API en el 8787; la parte de la app, por la cola: _conCola.mjs)
// Causa (en palabras sencillas): el motor pide la foto del Castillo «por fuera» con el nombre «Castillo de Sant'Angelo (por fuera)»; la foto propia de día estaba apuntada solo con «Castillo de Sant'Angelo», así que el servidor no
// la encontraba y buscaba otra en Unsplash, y esa búsqueda trajo el Castillo iluminado, de noche, en una parada de DÍA. Ahora, sin foto propia con el sufijo «(por fuera)» / «(por dentro)», vale la propia del sitio.
// El apartado 3 y el 8 (fotos del acordeón, «Han cambiado el viaje») van aparte, con el Supabase real: pruebaTanda10S3_B_real.mjs (USA EL SUPABASE REAL).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const API = process.env.API_URL || 'http://localhost:8787'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
  console.log(`  ${cond ? 'ok ' : 'MAL'} ${texto}`)
}
const foto = (name, extra = {}) =>
  fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, city: 'Roma', ...extra }) })
    .then((r) => r.json())
    .catch(() => ({}))
const archivo = (r) => String(r?.photo_url ?? '').split('?')[0].split('/').pop()
const esDeNoche = (r) => Boolean(r?.photo_night) || /^(noche_|navidad_noche)/.test(archivo(r))
const nombreDeNoche = (n) => /\(noche\)$|\sde noche$/i.test(n)

console.log('1. El servidor: el Castillo, de día con todos sus nombres de día; de noche solo con el de la nocturna')
for (const n of ["Castillo de Sant'Angelo", "Castillo de Sant'Angelo (por fuera)", "Castillo de Sant'Angelo (por dentro)"]) {
  const r = await foto(n)
  // (10S3b: antes → «por dentro» caía a la foto de fuera → ahora tiene la suya, de día, apuntada en la tabla → decisión de Eric, 10S3 «Antes de cerrar»: la foto de día del Castillo por dentro, nunca la de noche.)
  const esperada = /por dentro/.test(n) ? 'dia_castillo_sant_angelo_dentro.jpg' : 'dia_castillo_sant_angelo_fuera.jpg'
  debe(archivo(r) === esperada, 'dia', `«${n}» → foto de día (${archivo(r) || r.photo_source}; esperada ${esperada})`)
}
const pool = await fetch(`${API}/api/pool-photos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', names: ["Castillo de Sant'Angelo", "Castillo de Sant'Angelo (por fuera)", 'Puente Sant\'Angelo'] }) }).then((r) => r.json()).catch(() => ({}))
for (const n of ["Castillo de Sant'Angelo", "Castillo de Sant'Angelo (por fuera)", "Puente Sant'Angelo"]) {
  const u = String(pool?.photos?.[n]?.url ?? '')
  debe(Boolean(u) && !/noche_/.test(u), 'pool', `EXPLORAR y «Añadir parada» (fotos del pool): «${n}» → ${u.split('?')[0].split('/').pop() || '(sin foto)'}, sin foto de noche`)
}
const noche = await foto("El Puente y el Castillo de Sant'Angelo (noche)")
debe(archivo(noche) === 'noche_puente_y_castillo_sant_angelo.jpg', 'noche', `la experiencia nocturna «El Puente y el Castillo de Sant'Angelo (noche)» sí lleva la de noche (${archivo(noche)})`)

console.log('2. Ningún sitio de día (ni con «por fuera» / «por dentro») sale con foto de noche')
const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const nombres = new Set()
for (const k of ['places', 'zone_walks', 'night_experiences']) for (const p of roma[k] ?? []) { nombres.add(p.name); if (p.photo_name) nombres.add(p.photo_name) }
for (const p of roma.places ?? []) if (p.search_en_fuera) nombres.add(`${p.name} (por fuera)`)
for (const p of roma.places ?? []) if (p.search_en_dentro) nombres.add(`${p.name} (por dentro)`)
const malos = []
for (const n of nombres) {
  if (nombreDeNoche(n)) continue
  const r = await foto(n)
  if (esDeNoche(r)) malos.push(`${n} → ${archivo(r)}`)
}
debe(malos.length === 0, 'noche', `${nombres.size} nombres revisados: ${malos.length} de día con foto de noche${malos.length ? ' (' + malos.join('; ') + ')' : ''}`)
const unsplashNoche = []
for (const n of ['Castillo de Sant\'Angelo (por fuera)', 'Puente Sant\'Angelo', 'Isla Tiberina']) {
  const r = await foto(n)
  if (r.photo_source === 'unsplash' && /night|noche|illuminat/i.test(JSON.stringify(r))) unsplashNoche.push(n)
}
debe(unsplashNoche.length === 0, 'noche', 'los sitios del Tíber no caen en una búsqueda de Unsplash')

console.log('3. En la app: el Castillo de un viaje de día lleva la foto de día (tarjeta del acordeón)')
const app = await abrirApp(process.env.APP_URL || 'http://localhost:5173', { ruta: '/?cuentas=off&apertura=0' })
try {
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  await app.esp(2500)
  const paradas = await app.evaluar(`window.__ruta.getState().route.days.flatMap(d => d.stops.map(s => ({ n: s.name, noche: !!s.isNightExperience, u: String(s.photoUrl||'').split('?')[0].split('/').pop() })))`)
  const castillo = paradas.find((p) => /^Castillo de Sant/.test(p.n))
  debe(Boolean(castillo) && castillo.u === 'dia_castillo_sant_angelo_fuera.jpg', 'app', `la parada «Castillo de Sant'Angelo» del viaje lleva la foto de día (${castillo?.u ?? 'no hay Castillo en el viaje de prueba'})`)
  const nocheEnDia = paradas.filter((p) => !p.noche && /^(noche_|navidad_noche)/.test(p.u))
  debe(nocheEnDia.length === 0, 'app', `ninguna parada de día del viaje lleva foto de noche${nocheEnDia.length ? ': ' + nocheEnDia.map((p) => p.n).join(', ') : ''}`)
  await app.evaluar('(window.__ruta.getState().setMode("days"), true)')
  await app.esp(2000)
  const dia1 = await app.evaluar('window.__ruta.getState().route.days[0].id')
  await app.evaluar(`(window.__ruta.getState().setActiveDayId(${JSON.stringify(dia1)}), true)`)
  await app.esp(3000)
  const imgs = await app.evaluar(`Array.from(document.querySelectorAll('img')).filter(i => i.naturalWidth > 0).map(i => i.src.split('?')[0].split('/').pop())`)
  debe(imgs.includes('dia_castillo_sant_angelo_fuera.jpg'), 'app', 'en el acordeón de DÍAS se ve la foto de día del Castillo')
  debe(!imgs.some((f) => /^noche_.*castillo|noche_puente/.test(f)), 'app', 'y ninguna foto de noche del Castillo ni del Puente')
  try {
    await app.captura?.('docs/dias/capturas_jutrip/10s3_foto_castillo_1.jpg')
  } catch {
    /* sin captura */
  }
} finally {
  app.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
