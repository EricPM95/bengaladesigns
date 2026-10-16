// Mira qué hay en la API de Civitatis (sandbox): los destinos, si está Roma y qué hay en ella, y qué enlaces nuestros se resuelven a número de actividad.
//   node scripts/destino/civitatisExplorar.mjs [salida=ruta/carpeta]
// Necesita CIVITATIS_API_USER y CIVITATIS_API_PASSWORD en el .env.local (nunca se enseñan ni se guardan). El sandbox solo funciona de 7:00 a 2:00, hora de España.
// Con `salida=` deja las respuestas en esa carpeta (para sacar las respuestas guardadas de la prueba); sin ella solo cuenta lo que ha visto.
import fs from 'node:fs'
import path from 'node:path'
import { config } from 'dotenv'
import { crearClienteCivitatis } from '../../server/civitatis/cliente.js'

config({ path: '.env.local' })
const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const salida = args.salida ?? null
if (salida) fs.mkdirSync(salida, { recursive: true })
const guarda = (nombre, datos) => salida && fs.writeFileSync(path.join(salida, nombre), `${JSON.stringify(datos, null, 1)}\n`)

const cliente = crearClienteCivitatis()
console.log(`Entorno: ${cliente.entorno} · claves puestas: ${cliente.tieneClaves ? 'sí' : 'NO'}`)
if (!cliente.tieneClaves) process.exit(2)

const destinos = await cliente.pedir('/destinations', { consulta: { lang: 'es' } })
if (!destinos.ok) {
  console.log(`No se pudo pedir los destinos: ${destinos.motivo}${destinos.estado ? ` (${destinos.estado})` : ''}. ¿Estás dentro del horario del sandbox (7:00–2:00 de España)?`)
  process.exit(3)
}
const lista = Array.isArray(destinos.datos) ? destinos.datos : []
console.log(`Destinos en el sandbox: ${lista.length} · con actividades: ${lista.filter((d) => d.hasActivities).length} · con traslados: ${lista.filter((d) => d.hasTransfers).length}`)
guarda('destinos.json', lista.map((d) => ({ id: d.id, countryId: d.countryId, name: d.name, hasTransfers: d.hasTransfers, hasActivities: d.hasActivities, gps: d.gps, iata: d.iata })))
const roma = lista.find((d) => /^(roma|rome)$/i.test(String(d.name).trim()))
console.log(roma ? `Roma: SÍ (id ${roma.id}, actividades: ${roma.hasActivities}, traslados: ${roma.hasTransfers})` : `Roma: NO sale (hay ${lista.slice(0, 15).map((d) => d.name).join(', ')}…)`)
if (!roma) process.exit(0)

// Las actividades de Roma (todas las páginas).
const actividades = []
for (let pagina = 1; pagina <= 12; pagina++) {
  const r = await cliente.pedir(`/destinations/${roma.id}/activities`, { consulta: { lang: 'es', page: pagina, limit: 100, currency: 'EUR' } })
  if (!r.ok) {
    console.log(`  (página ${pagina}: ${r.motivo})`)
    break
  }
  if (!r.datos || r.datos.length === 0) break
  actividades.push(...r.datos)
  const total = Number(r.cabeceras?.get?.('X-Total-Count') ?? 0)
  if (total && actividades.length >= total) break
}
console.log(`Actividades de Roma: ${actividades.length}`)
const resumen = actividades.map((a) => ({ id: a.id, title: a.title, url: a.url, minimumPrice: a.minimumPrice, currency: a.currency, score: a.score, reviews: a.reviews, isFreeTour: a.isFreeTour ?? a.freeTour ?? null, duration: a.duration ?? null }))
guarda('roma_actividades.json', resumen)
for (const a of resumen.slice(0, 12)) console.log(`  ${a.id} · ${String(a.title).slice(0, 70)} · desde ${a.minimumPrice ?? '?'} ${a.currency ?? ''} · ${a.score ?? '?'} (${a.reviews ?? '?'})`)

// Los enlaces de Civitatis que ya tenemos: el Free Tour y las siete excursiones.
const roma2 = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const enlaces = new Map()
if (roma2.default_free_tour?.url) enlaces.set('Free Tour', roma2.default_free_tour.url)
const ciudad = roma2.excursions?.civitatis_city ?? 'roma'
for (const opcion of roma2.excursions?.options ?? []) if (opcion.civitatis_slug) enlaces.set(`Excursión: ${opcion.name}`, `https://www.civitatis.com/es/${ciudad}/${opcion.civitatis_slug}/`)
const resueltos = []
for (const [nombre, url] of enlaces) {
  const r = await cliente.pedir('/activities/resolve', { consulta: { url } })
  resueltos.push({ nombre, url, ok: r.ok, activity_id: r.ok ? (r.datos?.activity_id ?? null) : null, motivo: r.ok ? null : r.motivo, meta: r.ok ? (r.datos?.meta ?? null) : null })
  console.log(`  ${r.ok ? 'SÍ ' : 'NO '} ${nombre} → ${r.ok ? (r.datos?.activity_id ?? '?') : r.motivo}`)
}
guarda('resolver.json', resueltos)
console.log(`Resueltos: ${resueltos.filter((r) => r.ok).length} de ${resueltos.length}`)
console.log(`Peticiones: ${cliente.contador.peticiones} · entradas: ${cliente.contador.entradas} · reintentos por 429: ${cliente.contador.reintentos429}`)
