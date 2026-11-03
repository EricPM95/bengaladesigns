// La prueba de la Tanda LZ1 (Lanzarote, parte 1): junta las partes y suma sus resultados.
//   · A: lo atado a Roma y Lanzarote oculto. · B: los datos. · C: los tiempos en coche. · D: Civitatis en español y las fotos.
// Además comprueba lo que pide el prompt de forma transversal (oculto, datos completos o con su `verificar`, tabla de coche completa, zona horaria, «Cerca de mí» y ningún texto con «Roma» en Lanzarote)
// y que REPASO_LZ1.html lleva los apartados de ESTA tanda (la lista de comprobación).
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+(?:comprobaciones|bien)\s*[·,]\s*(\d+)\s+fallos/
const partes = ['pruebaTandaLZ1_A.mjs', 'pruebaTandaLZ1_B.mjs', 'pruebaTandaLZ1_C.mjs', 'pruebaTandaLZ1_D.mjs']
let comprobaciones = 0
let fallos = 0
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos++
    console.log(`✗ ${texto}`)
  }
}
for (const f of partes) {
  const r = spawnSync(process.execPath, [`scripts/destino/${f}`], { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 })
  const salida = `${r.stdout}\n${r.stderr}`
  const m = patron.exec(salida)
  if (!m) {
    fallos++
    console.log(`✗ ${f}: no ha dado resultado\n${salida.split('\n').slice(-8).join('\n')}`)
    continue
  }
  comprobaciones += Number(m[1])
  fallos += Number(m[2])
  console.log(`${Number(m[2]) === 0 ? '✓' : '✗'} ${f}: ${m[1]} comprobaciones, ${m[2]} fallos`)
  if (Number(m[2]) > 0) console.log(salida.split('\n').filter((l) => /✗|FALLO/.test(l)).slice(0, 12).join('\n'))
}

// ── Lo que pide el prompt, de forma transversal ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const lz = leer('data/pipeline_v2/lanzarote.json')
const sitios = lz.places ?? lz.lugares ?? []
console.log(`Lanzarote: ${sitios.length} sitios`)
debe(sitios.length >= 30, `Lanzarote tiene sus sitios (${sitios.length})`)
debe(sitios.every((s) => s.name && (s.zone || s.zona || s.zone_id) && (Array.isArray(s.coordinates) && s.coordinates.length === 2)), 'cada sitio con nombre, zona y coordenadas')
debe(sitios.every((s) => s.hours_audit || s.verificar || s.free_access || s.type === 'mirador' || /libre|gratis/i.test(JSON.stringify(s.schedule ?? s.horario ?? ''))), 'cada sitio con su horario auditado (fuente y fecha) o su `verificar`')
const zona = JSON.stringify(lz).match(/Atlantic\/Canary/)
debe(Boolean(zona), 'zona horaria Atlantic/Canary')
debe(!/\bRoma\b|Fiumicino|Ciampino|Pase Roma/.test(JSON.stringify(lz)), 'ningún texto con «Roma» (ni sus aeropuertos) en los datos de Lanzarote')
const gas = leer('data/pipeline_v2/gasolineras/lanzarote.json')
const apar = leer('data/pipeline_v2/aparcamientos/lanzarote.json')
const n = (x) => (Array.isArray(x) ? x.length : (x.items ?? x.features ?? x.gasolineras ?? x.aparcamientos ?? []).length)
debe(n(gas) > 20 && n(apar) > 50, `«Cerca de mí»: gasolineras (${n(gas)}) y aparcamientos (${n(apar)}), en lugar de baños y fuentes`)
debe(!fs.existsSync('data/pipeline_v2/banos/lanzarote.json') && !fs.existsSync('data/pipeline_v2/fuentes/lanzarote.json'), 'Lanzarote no lleva baños ni fuentes')
const paradas = leer('data/dias/lanzarote/_paradas.json')
const lista = paradas.paradas ?? paradas
const coche = leer('data/pipeline_v2/travel/lanzarote_coche.json')
const seg = coche.modes?.driving?.seconds ?? []
debe(coche.points.length === 49 && seg.length === 49 && seg.every((fila, i) => fila.length === 49 && fila.every((v, j) => (i === j ? v === 0 : Number.isFinite(v) && v > 0))), 'la tabla de tiempos en coche está completa (49 × 49, sin huecos)')
// Lanzarote oculto: ni en la lista pública ni en la de datos que llevan sus textos de Roma.
const curados = fs.readFileSync('server/destinosCurados.js', 'utf8')
debe(/DESTINOS_OCULTOS/.test(curados) && /'lanzarote'/.test(curados), 'Lanzarote está en la lista de destinos ocultos del servidor')
// Roma no cambia.
const roma = leer('data/pipeline_v2/roma.json')
debe(!JSON.stringify(roma).includes('Atlantic/Canary'), 'Roma no lleva nada de Lanzarote')

// La lista de comprobación tiene que ser la de ESTA tanda (Eric, 31-oct): REPASO_LZ1.html lleva todos los apartados de su lista de puntos y ninguno de otra tanda.
{
  const puntos = leer('docs/dias/_lz1_puntos.json')
  const html = fs.existsSync('docs/dias/REPASO_LZ1.html') ? fs.readFileSync('docs/dias/REPASO_LZ1.html', 'utf8') : ''
  const apartados = [...new Set(puntos.map((p) => p.apartado))]
  const faltan = apartados.filter((a) => !html.includes(a.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')))
  debe(Boolean(html) && faltan.length === 0, `REPASO_LZ1.html lleva sus ${apartados.length} apartados${faltan.length ? ` (faltan: ${faltan.join(' | ')})` : ''}`)
  const deOtraTanda = ['Repaso de la Tanda 10S11</h1>', 'Repaso de la Tanda 10S10</h1>'].filter((t) => html.includes(t))
  debe(deOtraTanda.length === 0, 'REPASO_LZ1.html no lleva títulos de otra tanda')
}

console.log(`\nPrueba de la Tanda LZ1: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
