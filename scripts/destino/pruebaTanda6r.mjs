// La prueba de la Tanda 6r (PROMPT_TANDA6R_PARA_PEGAR.md): ninguna parada que no esté escrita, y el Free Tour con su nombre nuevo.
//   node scripts/destino/pruebaTanda6r.mjs [paso=60] [dias=2,3,4,5,6] [out=docs/dias/PRUEBA_TANDA6R.md] [fallos=ruta.txt]
// Recorre los viajes de siempre (de 2 a 6 días, con y sin Free Tour, con fechas —cada «paso» días del año— y sin fechas —cuatro meses—) y, en cada uno, cada reserva a cada una de sus horas
// y en cada día del viaje (Coliseo, Museos, Galería y, en los viajes con Free Tour, el Free Tour a las 10:00, 12:00, 15:00, 17:00 y 21:00). Da fallo si:
//   1. sale una tarjeta de parada que el documento no escribe como parada ese día (salvo lo que añade el viajero: aquí nada);
//   2. sale como parada algo que el documento pone solo «de camino» en ese día;
//   3. la tarjeta pinta un recuadro de foto vacío (se mira el código de la tarjeta y que el cliente no invente una foto de relleno);
//   4. sale «Free Tour Centro Histórico» en algún sitio (en lo que saca el servidor o en los archivos de la app).
import fs from 'node:fs'
import path from 'node:path'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const paso = Number(args.paso ?? 60)
const SOLO = args.dias ? new Set(args.dias.split(',').map(Number)) : null
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6R.md'
const D = findPipelineV2Data('Roma')
const FT = D.default_free_tour.name
const listas = JSON.parse(fs.readFileSync('data/dias/roma/listas.json', 'utf8'))
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))
const fallos = []
const porRegla = new Map()
const falla = (regla, texto) => {
  porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1)
  if (fallos.length < 300) fallos.push({ regla, texto })
}

// ── Lo que escribe el documento para cada día: cada lugar con los modos con que sale (dentro, fuera, camino…) en cualquier variante de ese día.
const escrito = new Map()
const recorre = (valor, id) => {
  if (Array.isArray(valor)) return valor.forEach((v) => recorre(v, id))
  if (!valor || typeof valor !== 'object') return
  for (const clave of ['lugar', 'titulo', 'sitio']) {
    if (typeof valor[clave] === 'string') {
      const modos = escrito.get(id).get(valor[clave]) ?? new Set()
      modos.add(valor.modo ?? (valor.tipo === 'camino' ? 'camino' : 'parada'))
      escrito.get(id).set(valor[clave], modos)
    }
  }
  for (const v of Object.values(valor)) recorre(v, id)
}
for (const [id, dia] of Object.entries(listas.dias)) {
  escrito.set(id, new Map())
  recorre(dia, id)
}
// (El D1-FT hereda la mañana del D1: lo que escribe el D1 vale también en él.)
for (const [id, dia] of Object.entries(listas.dias)) {
  if (!dia.hereda_manana_de) continue
  for (const [lugar, modos] of escrito.get(dia.hereda_manana_de)) escrito.get(id).set(lugar, new Set([...(escrito.get(id).get(lugar) ?? []), ...modos]))
}
// Lo que no es una parada del día: las nocturnas y las pausas del destino y el Free Tour.
const siempre = new Set([...(D.night_experiences ?? []).map((e) => e.name), ...(D.curated_breaks ?? []).map((e) => e.name), FT])
// Los nombres con que el motor puede renombrar una tarjeta (título de la nocturna, «Llegada a …» y similares) se ven por su tipo, no por el nombre.
const esEspecial = (s) => s.is_arrival || s.is_break || s.is_night_experience || s.is_night_view || s.isNightExperience || s.is_free_walk || /\((noche)\)|iluminad/i.test(s.name)

function revisa(trip, donde) {
  trip.forEach((day, i) => {
    if (!day?.stops) return
    const dia = `${donde} · día ${i + 1} ${day.curated_day?.id ?? ''}`
    const texto = JSON.stringify(day)
    if (texto.includes('Free Tour Centro')) falla('free_tour_nombre_viejo', `${dia}: sale «Free Tour Centro Histórico»`)
    const id = day.curated_day?.id
    const delDia = id ? escrito.get(id) : null
    for (const s of day.stops) {
      if (!delDia || s.pass_through || siempre.has(s.name) || esEspecial(s)) continue
      const modos = delDia.get(s.name) ?? [...delDia.entries()].find(([nombre]) => nombre === s.display_title || nombre === s.photo_name)?.[1]
      if (!modos) falla('parada_no_escrita', `${dia}: «${s.name}» sale como parada y el documento no la escribe ese día (${s.category_label ?? s.category ?? ''})`)
      else if ([...modos].every((m) => m === 'camino')) falla('de_camino_como_parada', `${dia}: «${s.name}» sale como parada y el documento solo la pone «de camino»`)
    }
  })
}

/** Un viaje entero tal como lo monta el servidor. Con fechas (`inicio`) o sin ellas (`mes`, 0-11). */
async function viaje({ dias, inicio = null, mes = null, ft = false, reservas = [] }) {
  const trip = []
  for (let n = 1; n <= dias; n++) {
    const iso = inicio ? addDays(inicio, n - 1) : null
    const entradas = {}
    for (const r of reservas) if (inicio ? r.dateIso === iso : r.dayNumber === n) for (const p of r.placeNames) entradas[p] = r.time
    const reservasGrandes = reservas.filter((r) => r.grande).map((r) => ({ name: r.placeNames[0], dateIso: r.dateIso ?? null, dayNumber: r.dayNumber ?? null }))
    trip.push(
      await buildDayBlockV3(D, dias + 1, ft, n, null, inicio ?? undefined, [], ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], {
        city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: inicio ? null : mes, season: null, diaCuatro: dias >= 4 ? 'roma' : null, entradas, reservasGrandes, forceOrder: null,
      }),
    )
  }
  return trip
}

const RESERVAS = [
  { nombre: 'Coliseo', placeNames: ['Coliseo', 'Foro Romano y Palatino'], horas: ['09:00', '12:30', '15:00'], grande: true },
  { nombre: 'Museos Vaticanos y Capilla Sixtina', placeNames: ['Museos Vaticanos y Capilla Sixtina'], horas: ['09:00', '13:30', '15:30'], grande: true },
  { nombre: 'Galería Borghese', placeNames: ['Galería Borghese'], horas: ['09:00', '12:00', '15:00'], grande: true },
  { nombre: 'Free Tour', placeNames: [FT], horas: ['10:00', '12:00', '15:00', '17:00', '21:00'], grande: false, soloConFreeTour: true },
]

let viajes = 0
let dias = 0
const formas = [{ dias: 2 }, { dias: 3 }, { dias: 4 }, { dias: 5 }, { dias: 6 }, { dias: 3, ft: true }, { dias: 5, ft: true }].filter((f) => !SOLO || SOLO.has(f.dias))
const casos = [...fechas.map((inicio) => ({ inicio })), ...[0, 3, 6, 9].map((mes) => ({ mes }))]
for (const forma of formas) {
  for (const caso of casos) {
    const base = `${forma.dias} días${forma.ft ? ' con Free Tour' : ''} · ${caso.inicio ? `inicio ${caso.inicio}` : `sin fechas, mes ${caso.mes + 1}`}`
    const plan = [{ reserva: null }]
    for (const r of RESERVAS) {
      if (r.soloConFreeTour && !forma.ft) continue
      for (const hora of r.horas) for (let n = 1; n <= forma.dias; n++) plan.push({ reserva: r, hora, n })
    }
    for (const { reserva, hora, n } of plan) {
      const reservas = reserva ? [{ placeNames: reserva.placeNames, time: hora, grande: reserva.grande, ...(caso.inicio ? { dateIso: addDays(caso.inicio, n - 1) } : { dayNumber: n }) }] : []
      const donde = `${base}${reserva ? ` · ${reserva.nombre} ${hora} el día ${n}` : ''}`
      try {
        const trip = await viaje({ dias: forma.dias, inicio: caso.inicio ?? null, mes: caso.mes ?? null, ft: forma.ft, reservas })
        viajes++
        dias += trip.length
        revisa(trip, donde)
      } catch (error) {
        falla('error', `${donde}: ${error.message}`)
      }
    }
  }
}

// ── 3. Nunca una tarjeta con el recuadro de la foto vacío: se mira el código de la tarjeta y el de la foto de relleno.
const tarjeta = fs.readFileSync('src/components/route/dayDetail/TrazoCards.tsx', 'utf8')
if (!/const hasPhoto = Boolean\(photoUrl\) && !noPhoto/.test(tarjeta)) falla('foto_vacia', 'TrazoCard ya no decide con `hasPhoto` si pinta el recuadro de la foto')
if (!/\{hasPhoto && \(\s*<div[^>]*photoBg/.test(tarjeta)) falla('foto_vacia', 'el recuadro de la foto (con su fondo de color) se pinta sin mirar `hasPhoto`')
const mapa = fs.readFileSync('src/lib/mapGeneratedRoute.ts', 'utf8')
if (!/function buildPlaceholderPhotoUrl[^{]*\{[^}]*return ''/s.test(mapa)) falla('foto_vacia', 'la foto de relleno de una parada ya no es «sin foto» (cadena vacía)')

// ── 4. «Free Tour Centro Histórico», en ningún archivo de la app (los archivados y los informes viejos se quedan como están).
const IGNORAR = new Set(['node_modules', '.git', 'archivo', 'fotos', 'dist'])
const recorreArchivos = (dir) => {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(entrada.name)) continue
    const completo = path.join(dir, entrada.name)
    if (entrada.isDirectory()) recorreArchivos(completo)
    else if (/\.(json|js|mjs|ts|tsx|css|html)$/.test(entrada.name) && !/pruebaTanda6r\.mjs$/.test(entrada.name) && fs.readFileSync(completo, 'utf8').includes('Free Tour Centro')) falla('free_tour_nombre_viejo', `${completo.replaceAll('\\', '/')} lleva «Free Tour Centro Histórico»`)
  }
}
for (const raiz of ['src', 'server', 'shared', 'data/dias', 'data/pipeline_v2', 'scripts/destino', 'public']) if (fs.existsSync(raiz)) recorreArchivos(raiz)

const resumen = { viajes, dias, fallos: [...porRegla.values()].reduce((a, b) => a + b, 0), porRegla: Object.fromEntries(porRegla) }
fs.writeFileSync(
  out,
  ['# Prueba de la Tanda 6r', '', `Viajes: **${viajes}** (${dias} días montados). Fallos: **${resumen.fallos}**.`, '', ...(fallos.length ? ['## Fallos (los primeros 300)', '', ...fallos.map((f) => `- ${f.regla}: ${f.texto}`)] : ['Ningún fallo.'])].join('\n') + '\n',
)
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `${f.regla}\t${f.texto}`).join('\n'))
console.log(JSON.stringify(resumen))
if (resumen.fallos > 0) {
  for (const f of fallos.slice(0, 15)) console.log(`FALLO ${f.regla}: ${f.texto}`)
  process.exit(1)
}
